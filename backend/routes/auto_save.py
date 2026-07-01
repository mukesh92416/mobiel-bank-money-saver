from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, AutoSaveSchedule, Goal
from utils import sanitize_input, validate_amount

auto_save_bp = Blueprint("auto_save", __name__, url_prefix="/api/auto-save")


def compute_next_trigger(schedule):
    now = datetime.now(timezone.utc)
    freq = schedule.frequency
    base = schedule.last_triggered or now

    if freq == "daily":
        return base + timedelta(days=1)
    elif freq == "weekly":
        return base + timedelta(weeks=1)
    elif freq == "monthly":
        month = base.month + 1
        year = base.year
        if month > 12:
            month = 1
            year += 1
        try:
            return base.replace(year=year, month=month)
        except ValueError:
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            return base.replace(year=year, month=month, day=last_day)
    elif freq == "salary":
        return base + timedelta(days=30)
    return base + timedelta(days=1)


@auto_save_bp.route("/schedules", methods=["GET"])
@jwt_required()
def list_schedules():
    user_id = int(get_jwt_identity())
    schedules = AutoSaveSchedule.query.filter_by(user_id=user_id).order_by(
        AutoSaveSchedule.created_at.desc()
    ).all()
    return jsonify({"schedules": [s.to_dict() for s in schedules]}), 200


@auto_save_bp.route("/schedules", methods=["POST"])
@jwt_required()
def create_schedule():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    amount = data.get("amount")
    valid, msg = validate_amount(amount)
    if not valid:
        return jsonify({"error": msg}), 400

    frequency = data.get("frequency")
    if frequency not in ("daily", "weekly", "monthly", "salary", "custom"):
        return jsonify({"error": "Invalid frequency"}), 400

    goal_id = data.get("goal_id")
    if goal_id:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({"error": "Goal not found"}), 404

    schedule = AutoSaveSchedule(
        user_id=user_id,
        amount=float(amount),
        frequency=frequency,
        day_of_week=data.get("day_of_week"),
        day_of_month=data.get("day_of_month"),
        time=data.get("time"),
        note=sanitize_input(data.get("note", "")),
        goal_id=goal_id,
    )
    schedule.next_trigger = compute_next_trigger(schedule)
    db.session.add(schedule)
    db.session.commit()

    return jsonify({"message": "Auto-save schedule created", "schedule": schedule.to_dict()}), 201


@auto_save_bp.route("/schedules/<int:schedule_id>", methods=["PUT"])
@jwt_required()
def update_schedule(schedule_id):
    user_id = int(get_jwt_identity())
    schedule = AutoSaveSchedule.query.filter_by(id=schedule_id, user_id=user_id).first()
    if not schedule:
        return jsonify({"error": "Schedule not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "amount" in data:
        valid, msg = validate_amount(data["amount"])
        if not valid:
            return jsonify({"error": msg}), 400
        schedule.amount = float(data["amount"])
    if "frequency" in data:
        schedule.frequency = data["frequency"]
    if "day_of_week" in data:
        schedule.day_of_week = data["day_of_week"]
    if "day_of_month" in data:
        schedule.day_of_month = data["day_of_month"]
    if "time" in data:
        schedule.time = data["time"]
    if "note" in data:
        schedule.note = sanitize_input(data["note"])
    if "goal_id" in data:
        schedule.goal_id = data["goal_id"]
    if "active" in data:
        schedule.active = bool(data["active"])

    schedule.next_trigger = compute_next_trigger(schedule)
    db.session.commit()
    return jsonify({"message": "Schedule updated", "schedule": schedule.to_dict()}), 200


@auto_save_bp.route("/schedules/<int:schedule_id>", methods=["DELETE"])
@jwt_required()
def delete_schedule(schedule_id):
    user_id = int(get_jwt_identity())
    schedule = AutoSaveSchedule.query.filter_by(id=schedule_id, user_id=user_id).first()
    if not schedule:
        return jsonify({"error": "Schedule not found"}), 404
    db.session.delete(schedule)
    db.session.commit()
    return jsonify({"message": "Schedule deleted"}), 200


@auto_save_bp.route("/next", methods=["GET"])
@jwt_required()
def get_next_trigger():
    user_id = int(get_jwt_identity())
    schedule = AutoSaveSchedule.query.filter_by(
        user_id=user_id, active=True
    ).order_by(AutoSaveSchedule.next_trigger.asc()).first()
    return jsonify({
        "next": schedule.to_dict() if schedule else None
    }), 200
