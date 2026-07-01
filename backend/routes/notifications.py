from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Notification

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.route("", methods=["GET"])
@jwt_required()
def list_notifications():
    user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    pagination = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    unread_count = Notification.query.filter_by(user_id=user_id, read=False).count()

    return jsonify({
        "notifications": [n.to_dict() for n in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
        "unread_count": unread_count,
    }), 200


@notifications_bp.route("/<int:notification_id>/read", methods=["POST"])
@jwt_required()
def mark_read(notification_id):
    user_id = int(get_jwt_identity())
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not notification:
        return jsonify({"error": "Notification not found"}), 404
    notification.read = True
    notification.read_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@notifications_bp.route("/read-all", methods=["POST"])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, read=False).update({
        "read": True,
        "read_at": datetime.now(timezone.utc),
    })
    db.session.commit()
    return jsonify({"message": "All marked as read"}), 200
