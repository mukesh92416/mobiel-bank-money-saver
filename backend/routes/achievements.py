from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Achievement

achievements_bp = Blueprint("achievements", __name__, url_prefix="/api/achievements")


@achievements_bp.route("", methods=["GET"])
@jwt_required()
def list_achievements():
    user_id = int(get_jwt_identity())
    achievements = Achievement.query.filter_by(user_id=user_id).order_by(
        Achievement.created_at.asc()
    ).all()

    unlocked = sum(1 for a in achievements if a.unlocked)
    total = len(achievements)

    return jsonify({
        "achievements": [a.to_dict() for a in achievements],
        "unlocked": unlocked,
        "total": total,
    }), 200
