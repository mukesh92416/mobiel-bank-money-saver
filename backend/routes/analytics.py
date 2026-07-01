from datetime import datetime, timezone, timedelta, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Transaction, Goal
from sqlalchemy import func as f

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    user_id = int(get_jwt_identity())
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

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

    today_deposits = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= today_start,
    ).scalar()

    balance = total_deposits - total_withdrawals

    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_deposits = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= month_start,
    ).scalar()

    last_month_end = month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_deposits = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= last_month_start,
        Transaction.transaction_date < month_start,
    ).scalar()

    month_over_month_change = None
    if last_month_deposits > 0:
        month_over_month_change = round(
            (monthly_deposits - last_month_deposits) / last_month_deposits * 100, 1
        )

    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    yearly_deposits = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= year_start,
    ).scalar()

    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    weekly_deposits = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= week_start,
    ).scalar()

    total_goals = Goal.query.filter_by(user_id=user_id).count()
    completed_goals = Goal.query.filter_by(user_id=user_id, completed=True).count()

    txn_count = Transaction.query.filter_by(user_id=user_id).count()

    top_goal = Goal.query.filter_by(user_id=user_id, completed=False).order_by(
        Goal.target_amount.asc()
    ).first()

    return jsonify({
        "balance": balance,
        "total_deposits": total_deposits,
        "total_withdrawals": total_withdrawals,
        "today_deposits": today_deposits,
        "weekly_deposits": weekly_deposits,
        "monthly_deposits": monthly_deposits,
        "yearly_deposits": yearly_deposits,
        "month_over_month_change": month_over_month_change,
        "total_goals": total_goals,
        "completed_goals": completed_goals,
        "transaction_count": txn_count,
        "active_goal": top_goal.to_dict() if top_goal else None,
    }), 200


@analytics_bp.route("/trend", methods=["GET"])
@jwt_required()
def get_trend():
    user_id = int(get_jwt_identity())
    period = request.args.get("period", "monthly")
    now = datetime.now(timezone.utc)

    if period == "weekly":
        start = now - timedelta(days=90)
        from sqlalchemy import func as f
        results = db.session.query(
            f.date(Transaction.transaction_date).label("date"),
            f.sum(Transaction.amount).label("amount"),
            Transaction.transaction_type,
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start,
        ).group_by(
            f.date(Transaction.transaction_date),
            Transaction.transaction_type,
        ).all()

        data = {}
        for r in results:
            key = str(r.date)
            if key not in data:
                data[key] = {"date": key, "deposits": 0, "withdrawals": 0}
            if r.transaction_type == "deposit":
                data[key]["deposits"] = float(r.amount)
            else:
                data[key]["withdrawals"] = float(r.amount)

    elif period == "yearly":
        from sqlalchemy import func as f
        results = db.session.query(
            f.strftime("%Y-%m", Transaction.transaction_date).label("month"),
            f.sum(Transaction.amount).label("amount"),
            Transaction.transaction_type,
        ).filter(
            Transaction.user_id == user_id,
        ).group_by(
            f.strftime("%Y-%m", Transaction.transaction_date),
            Transaction.transaction_type,
        ).order_by(f.strftime("%Y-%m", Transaction.transaction_date)).all()

        data = {}
        for r in results:
            key = str(r.month)
            if key not in data:
                data[key] = {"month": key, "deposits": 0, "withdrawals": 0}
            if r.transaction_type == "deposit":
                data[key]["deposits"] = float(r.amount)
            else:
                data[key]["withdrawals"] = float(r.amount)

    else:
        start = now - timedelta(days=365)
        from sqlalchemy import func as f
        results = db.session.query(
            f.strftime("%Y-%m", Transaction.transaction_date).label("month"),
            f.sum(Transaction.amount).label("amount"),
            Transaction.transaction_type,
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start,
        ).group_by(
            f.strftime("%Y-%m", Transaction.transaction_date),
            Transaction.transaction_type,
        ).order_by(f.strftime("%Y-%m", Transaction.transaction_date)).all()

        data = {}
        for r in results:
            key = str(r.month)
            if key not in data:
                data[key] = {"month": key, "deposits": 0, "withdrawals": 0}
            if r.transaction_type == "deposit":
                data[key]["deposits"] = float(r.amount)
            else:
                data[key]["withdrawals"] = float(r.amount)

    return jsonify({"trend": list(data.values())}), 200


@analytics_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    user_id = int(get_jwt_identity())
    from sqlalchemy import func as f

    deposits = db.session.query(
        Transaction.category,
        f.sum(Transaction.amount).label("amount"),
        f.count(Transaction.id).label("count"),
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
    ).group_by(Transaction.category).all()

    withdrawals = db.session.query(
        Transaction.category,
        f.sum(Transaction.amount).label("amount"),
        f.count(Transaction.id).label("count"),
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "withdrawal",
    ).group_by(Transaction.category).all()

    return jsonify({
        "deposits": [
            {"category": r.category or "general", "amount": float(r.amount), "count": r.count}
            for r in deposits
        ],
        "withdrawals": [
            {"category": r.category or "general", "amount": float(r.amount), "count": r.count}
            for r in withdrawals
        ],
    }), 200


@analytics_bp.route("/goals", methods=["GET"])
@jwt_required()
def get_goal_comparison():
    user_id = int(get_jwt_identity())
    goals = Goal.query.filter_by(user_id=user_id).all()
    return jsonify({
        "goals": [
            {
                "title": g.title,
                "target": g.target_amount,
                "current": g.current_amount,
                "progress": g.progress(),
                "remaining": g.remaining(),
            }
            for g in goals
        ]
    }), 200


@analytics_bp.route("/streak", methods=["GET"])
@jwt_required()
def get_streak():
    user_id = int(get_jwt_identity())
    from sqlalchemy import func as f

    dates = db.session.query(
        f.date(Transaction.transaction_date)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
    ).distinct().order_by(
        f.date(Transaction.transaction_date).desc()
    ).all()

    from datetime import datetime
    dates = [datetime.strptime(row[0], '%Y-%m-%d').date() if isinstance(row[0], str) else row[0] for row in dates]

    if not dates:
        return jsonify({"current_streak": 0, "longest_streak": 0}), 200

    from datetime import date
    current_streak = 0
    longest_streak = 0
    streak = 0

    all_dates = sorted(set(dates), reverse=True)
    today = date.today()

    check_date = today
    for d in all_dates:
        if d == check_date:
            streak += 1
            check_date = d
            from datetime import timedelta
            check_date = check_date - timedelta(days=1)
        elif d < check_date:
            if streak > longest_streak:
                longest_streak = streak
            streak = 1
            check_date = d
            from datetime import timedelta
            check_date = check_date - timedelta(days=1)
        else:
            break

    if streak > longest_streak:
        longest_streak = streak

    if all_dates and all_dates[0] == today:
        current_streak = streak
    else:
        current_streak = 0

    return jsonify({"current_streak": current_streak, "longest_streak": longest_streak}), 200


@analytics_bp.route("/prediction", methods=["GET"])
@jwt_required()
def get_prediction():
    user_id = int(get_jwt_identity())
    months_to_predict = request.args.get("months", 3, type=int)

    results = db.session.query(
        f.strftime("%Y-%m", Transaction.transaction_date).label("month"),
        f.sum(Transaction.amount).label("amount"),
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
    ).group_by("month").order_by("month").all()

    if not results:
        return jsonify({"predicted_months": [], "monthly_average": 0}), 200

    amounts = [float(r.amount) for r in results]
    monthly_average = round(sum(amounts) / len(amounts), 2)

    recent = amounts[-3:] if len(amounts) >= 3 else amounts
    trend_factor = 1.0
    if len(recent) >= 2:
        recent_avg = sum(recent) / len(recent)
        overall_avg = monthly_average
        if overall_avg > 0:
            trend_factor = recent_avg / overall_avg

    last_month = datetime.now(timezone.utc).replace(day=1)
    predicted = []
    for i in range(1, months_to_predict + 1):
        next_month = last_month + timedelta(days=32 * i)
        next_month = next_month.replace(day=1)
        predicted_amount = round(monthly_average * (trend_factor ** i), 2)
        predicted.append({
            "month": next_month.strftime("%Y-%m"),
            "predicted_amount": max(predicted_amount, 0),
        })

    return jsonify({
        "monthly_average": monthly_average,
        "trend_factor": round(trend_factor, 3),
        "trend": "increasing" if trend_factor > 1.05 else ("decreasing" if trend_factor < 0.95 else "stable"),
        "predicted_months": predicted,
    }), 200


@analytics_bp.route("/comparison", methods=["GET"])
@jwt_required()
def get_comparison():
    user_id = int(get_jwt_identity())
    now = datetime.now(timezone.utc)

    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    this_month = db.session.query(f.coalesce(f.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= this_month_start,
    ).scalar()

    last_month = db.session.query(f.coalesce(f.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= last_month_start,
        Transaction.transaction_date < this_month_start,
    ).scalar()

    this_year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    last_year_start = this_year_start.replace(year=this_year_start.year - 1)
    last_year_end = this_year_start - timedelta(days=1)

    this_year = db.session.query(f.coalesce(f.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= this_year_start,
    ).scalar()

    last_year = db.session.query(f.coalesce(f.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        Transaction.transaction_date >= last_year_start,
        Transaction.transaction_date < this_year_start,
    ).scalar()

    month_change = None
    if last_month and last_month > 0:
        month_change = round((float(this_month) - float(last_month)) / float(last_month) * 100, 1)

    year_change = None
    if last_year and last_year > 0:
        year_change = round((float(this_year) - float(last_year)) / float(last_year) * 100, 1)

    return jsonify({
        "this_month": float(this_month),
        "last_month": float(last_month),
        "month_change": month_change,
        "this_year": float(this_year),
        "last_year": float(last_year),
        "year_change": year_change,
        "month_comparison_data": [
            {"month": last_month_start.strftime("%b"), "amount": float(last_month)},
            {"month": "Current", "amount": float(this_month)},
        ],
    }), 200


@analytics_bp.route("/heatmap", methods=["GET"])
@jwt_required()
def get_heatmap():
    user_id = int(get_jwt_identity())
    year = request.args.get("year", datetime.now(timezone.utc).year, type=int)

    results = db.session.query(
        f.date(Transaction.transaction_date).label("date"),
        f.sum(Transaction.amount).label("amount"),
        f.count(Transaction.id).label("count"),
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "deposit",
        f.extract("year", Transaction.transaction_date) == year,
    ).group_by(f.date(Transaction.transaction_date)).all()

    max_amount = max((float(r.amount) for r in results), default=0)

    heatmap = {}
    for r in results:
        d = str(r.date)
        amount = float(r.amount)
        intensity = round(amount / max_amount * 4, 1) if max_amount > 0 else 0
        heatmap[d] = {
            "amount": amount,
            "count": r.count,
            "intensity": min(intensity, 4),
        }

    return jsonify({
        "year": year,
        "max_amount": max_amount,
        "data": heatmap,
    }), 200
