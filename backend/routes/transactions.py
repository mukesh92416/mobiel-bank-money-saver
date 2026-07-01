from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Transaction, Goal
from utils import sanitize_input, validate_amount
from sqlalchemy import func as f

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


@transactions_bp.route("", methods=["GET"])
@jwt_required()
def list_transactions():
    user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    sort_by = request.args.get("sort_by", "date")
    sort_order = request.args.get("sort_order", "desc")
    tx_type = request.args.get("type")
    category = request.args.get("category")
    search = request.args.get("search")
    goal_id = request.args.get("goal_id", type=int)

    query = Transaction.query.filter_by(user_id=user_id)

    if tx_type:
        query = query.filter(Transaction.transaction_type == tx_type)
    if category:
        query = query.filter(Transaction.category == category)
    if goal_id:
        query = query.filter(Transaction.goal_id == goal_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                Transaction.description.ilike(search_term),
                Transaction.category.ilike(search_term),
                Transaction.notes.ilike(search_term),
            )
        )

    sort_columns = {
        "date": Transaction.transaction_date,
        "amount": Transaction.amount,
        "created": Transaction.created_at,
    }
    sort_col = sort_columns.get(sort_by, Transaction.transaction_date)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "transactions": [t.to_dict() for t in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
        "per_page": per_page,
    }), 200


@transactions_bp.route("/<int:txn_id>", methods=["GET"])
@jwt_required()
def get_transaction(txn_id):
    user_id = int(get_jwt_identity())
    txn = Transaction.query.filter_by(id=txn_id, user_id=user_id).first()
    if not txn:
        return jsonify({"error": "Transaction not found"}), 404
    return jsonify({"transaction": txn.to_dict()}), 200


@transactions_bp.route("/deposit", methods=["POST"])
@jwt_required()
def deposit():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    amount = data.get("amount")
    valid, msg = validate_amount(amount)
    if not valid:
        return jsonify({"error": msg}), 400

    goal_id = data.get("goal_id")
    if goal_id:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({"error": "Goal not found"}), 404
        goal.current_amount += float(amount)
        if goal.current_amount >= goal.target_amount:
            goal.completed = True
            goal.completed_at = datetime.now(timezone.utc)

    txn = Transaction(
        user_id=user_id,
        goal_id=goal_id,
        transaction_type="deposit",
        amount=float(amount),
        category=sanitize_input(data.get("category", "general")),
        description=sanitize_input(data.get("description", "")),
        notes=data.get("notes", ""),
        transaction_date=(
            datetime.fromisoformat(data["transaction_date"])
            if data.get("transaction_date")
            else datetime.now(timezone.utc)
        ),
    )
    db.session.add(txn)
    db.session.commit()

    return jsonify({"message": "Deposit recorded", "transaction": txn.to_dict()}), 201


@transactions_bp.route("/withdraw", methods=["POST"])
@jwt_required()
def withdraw():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    amount = data.get("amount")
    valid, msg = validate_amount(amount)
    if not valid:
        return jsonify({"error": msg}), 400

    amount_float = float(amount)

    total_deposits = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
    ).scalar()

    total_withdrawals = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "withdrawal",
    ).scalar()

    balance = total_deposits - total_withdrawals
    if amount_float > balance:
        return jsonify({"error": "Insufficient balance"}), 400

    goal_id = data.get("goal_id")
    if goal_id:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({"error": "Goal not found"}), 404
        goal.current_amount = max(0, goal.current_amount - amount_float)

    txn = Transaction(
        user_id=user_id,
        goal_id=goal_id,
        transaction_type="withdrawal",
        amount=amount_float,
        category=sanitize_input(data.get("category", "general")),
        description=sanitize_input(data.get("description", "")),
        notes=data.get("notes", ""),
        transaction_date=(
            datetime.fromisoformat(data["transaction_date"])
            if data.get("transaction_date")
            else datetime.now(timezone.utc)
        ),
    )
    db.session.add(txn)
    db.session.commit()

    return jsonify({"message": "Withdrawal recorded", "transaction": txn.to_dict()}), 201


@transactions_bp.route("/<int:txn_id>", methods=["DELETE"])
@jwt_required()
def delete_transaction(txn_id):
    user_id = int(get_jwt_identity())
    txn = Transaction.query.filter_by(id=txn_id, user_id=user_id).first()
    if not txn:
        return jsonify({"error": "Transaction not found"}), 404
    db.session.delete(txn)
    db.session.commit()
    return jsonify({"message": "Transaction deleted"}), 200


@transactions_bp.route("/export", methods=["GET"])
@jwt_required()
def export_csv():
    user_id = int(get_jwt_identity())
    import csv
    import io

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    tx_type = request.args.get("type")

    query = Transaction.query.filter_by(user_id=user_id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.fromisoformat(end_date))
    if tx_type:
        query = query.filter(Transaction.transaction_type == tx_type)

    txns = query.order_by(Transaction.transaction_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Type", "Amount", "Category", "Description", "Goal", "Date"])
    for t in txns:
        writer.writerow([
            t.id, t.transaction_type, t.amount, t.category,
            t.description, t.goal.title if t.goal else "",
            t.transaction_date.isoformat(),
        ])

    return jsonify({"csv": output.getvalue()}), 200


@transactions_bp.route("/export-pdf", methods=["GET"])
@jwt_required()
def export_pdf():
    user_id = int(get_jwt_identity())
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = Transaction.query.filter_by(user_id=user_id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.fromisoformat(end_date))

    txns = query.order_by(Transaction.transaction_date.desc()).all()

    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.units import mm
    import io

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()

    elements = []
    elements.append(Paragraph(f"Transaction Report", styles['Title']))
    elements.append(Spacer(1, 6*mm))
    elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%d %b %Y')}", styles['Normal']))
    if start_date and end_date:
        elements.append(Paragraph(f"Period: {start_date} to {end_date}", styles['Normal']))
    elements.append(Spacer(1, 6*mm))

    table_data = [["Date", "Type", "Amount", "Category", "Description"]]
    for t in txns:
        table_data.append([
            t.transaction_date.strftime('%d %b %Y'),
            t.transaction_type.capitalize(),
            f"₹{t.amount:,.2f}",
            t.category or "-",
            (t.description or "")[:40],
        ])

    if len(table_data) > 1:
        total_deposits = sum(t.amount for t in txns if t.transaction_type == "deposit")
        total_withdrawals = sum(t.amount for t in txns if t.transaction_type == "withdrawal")
        table_data.append(["", "", "", "", ""])
        table_data.append(["", "Total Deposits", f"₹{total_deposits:,.2f}", "", ""])
        table_data.append(["", "Total Withdrawals", f"₹{total_withdrawals:,.2f}", "", ""])
        table_data.append(["", "Net", f"₹{total_deposits - total_withdrawals:,.2f}", "", ""])

    t = Table(table_data, colWidths=[65*mm, 30*mm, 35*mm, 30*mm, 40*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    elements.append(t)

    doc.build(elements)
    pdf = buf.getvalue()
    buf.close()

    return Response(pdf, mimetype='application/pdf',
                    headers={'Content-Disposition': f'attachment; filename=transactions_{datetime.now(timezone.utc).strftime("%Y%m%d")}.pdf'})


@transactions_bp.route("/monthly-report", methods=["GET"])
@jwt_required()
def monthly_report():
    user_id = int(get_jwt_identity())
    year = request.args.get("year", datetime.now(timezone.utc).year, type=int)
    month = request.args.get("month", datetime.now(timezone.utc).month, type=int)

    month_start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        month_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    txns = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < month_end,
    ).order_by(Transaction.transaction_date.desc()).all()

    deposits = [t for t in txns if t.transaction_type == "deposit"]
    withdrawals = [t for t in txns if t.transaction_type == "withdrawal"]

    total_deposits = sum(t.amount for t in deposits)
    total_withdrawals = sum(t.amount for t in withdrawals)

    category_breakdown = db.session.query(
        Transaction.category,
        f.sum(Transaction.amount),
        f.count(Transaction.id),
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < month_end,
    ).group_by(Transaction.category).all()

    daily_data = db.session.query(
        f.date(Transaction.transaction_date).label('date'),
        f.sum(Transaction.amount).label('amount'),
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < month_end,
    ).group_by(f.date(Transaction.transaction_date)).order_by(f.date(Transaction.transaction_date)).all()

    return jsonify({
        "year": year,
        "month": month,
        "total_deposits": total_deposits,
        "total_withdrawals": total_withdrawals,
        "net_savings": total_deposits - total_withdrawals,
        "transaction_count": len(txns),
        "deposit_count": len(deposits),
        "withdrawal_count": len(withdrawals),
        "daily_breakdown": [
            {"date": str(r.date), "amount": float(r.amount)} for r in daily_data
        ],
        "category_breakdown": [
            {"category": r.category or "general", "amount": float(r[1]), "count": r[2]}
            for r in category_breakdown
        ],
    }), 200
