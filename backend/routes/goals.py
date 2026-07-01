from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Goal, Transaction
from utils import sanitize_input, validate_amount

goals_bp = Blueprint("goals", __name__, url_prefix="/api/goals")


@goals_bp.route("", methods=["GET"])
@jwt_required()
def list_goals():
    user_id = int(get_jwt_identity())
    goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.created_at.desc()).all()
    return jsonify({"goals": [g.to_dict() for g in goals]}), 200


@goals_bp.route("/<int:goal_id>", methods=["GET"])
@jwt_required()
def get_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    return jsonify({"goal": goal.to_dict()}), 200


@goals_bp.route("", methods=["POST"])
@jwt_required()
def create_goal():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    title = sanitize_input(data.get("title", ""))
    target_amount = data.get("target_amount")
    deadline_str = data.get("deadline")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    valid, msg = validate_amount(target_amount)
    if not valid:
        return jsonify({"error": msg}), 400

    deadline = None
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid deadline format"}), 400

    goal = Goal(
        user_id=user_id,
        title=title,
        target_amount=float(target_amount),
        deadline=deadline,
        priority=data.get("priority", "medium"),
        color_theme=data.get("color_theme", "emerald"),
        icon=data.get("icon", "target"),
    )
    db.session.add(goal)
    db.session.commit()

    return jsonify({"message": "Goal created", "goal": goal.to_dict()}), 201


@goals_bp.route("/<int:goal_id>", methods=["PUT"])
@jwt_required()
def update_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "title" in data:
        goal.title = sanitize_input(data["title"])
    if "target_amount" in data:
        valid, msg = validate_amount(data["target_amount"])
        if not valid:
            return jsonify({"error": msg}), 400
        goal.target_amount = float(data["target_amount"])
    if "deadline" in data:
        try:
            goal.deadline = datetime.fromisoformat(data["deadline"]) if data["deadline"] else None
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid deadline format"}), 400
    if "priority" in data:
        goal.priority = data["priority"]
    if "color_theme" in data:
        goal.color_theme = data["color_theme"]
    if "icon" in data:
        goal.icon = data["icon"]
    if "current_amount" in data:
        goal.current_amount = float(data["current_amount"])
        if goal.current_amount >= goal.target_amount:
            goal.completed = True
            goal.completed_at = datetime.now(timezone.utc)

    db.session.commit()
    return jsonify({"message": "Goal updated", "goal": goal.to_dict()}), 200


@goals_bp.route("/<int:goal_id>", methods=["DELETE"])
@jwt_required()
def delete_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted"}), 200
