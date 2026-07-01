from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Setting, Transaction, Goal, Notification, Achievement, Session

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")


@settings_bp.route("", methods=["GET"])
@jwt_required()
def get_settings():
    user_id = int(get_jwt_identity())
    setting = Setting.query.filter_by(user_id=user_id).first()
    if not setting:
        setting = Setting(user_id=user_id)
        db.session.add(setting)
        db.session.commit()
    return jsonify({"settings": setting.to_dict()}), 200


@settings_bp.route("", methods=["PUT"])
@jwt_required()
def update_settings():
    user_id = int(get_jwt_identity())
    setting = Setting.query.filter_by(user_id=user_id).first()
    if not setting:
        setting = Setting(user_id=user_id)
        db.session.add(setting)

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    for field in ["theme", "currency", "language", "daily_reminder",
                  "goal_reminder", "achievement_notification", "monthly_report",
                  "pin_enabled", "biometric_enabled",
                  "upi_id", "upi_name", "preferred_upi_app", "default_save_note",
                  "withdrawal_upi_id", "withdrawal_upi_name",
                  "withdrawal_preferred_upi_app", "withdrawal_default_note",
                  "auto_lock_minutes"]:
        if field in data:
            setattr(setting, field, data[field])

    if "default_save_amount" in data:
        setting.default_save_amount = float(data["default_save_amount"])

    if "withdrawal_default_amount" in data:
        setting.withdrawal_default_amount = float(data["withdrawal_default_amount"])

    if "pin" in data and data["pin"]:
        from werkzeug.security import generate_password_hash
        setting.pin_hash = generate_password_hash(str(data["pin"]))

    db.session.commit()
    return jsonify({"message": "Settings updated", "settings": setting.to_dict()}), 200


@settings_bp.route("/backup", methods=["GET"])
@jwt_required()
def backup_data():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    goals = Goal.query.filter_by(user_id=user_id).all()
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    achievements = Achievement.query.filter_by(user_id=user_id).all()
    settings = Setting.query.filter_by(user_id=user_id).first()

    data = {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "user": {
            "name": user.name,
            "email": user.email,
            "currency": user.currency,
        },
        "goals": [g.to_dict() for g in goals],
        "transactions": [t.to_dict() for t in transactions],
        "achievements": [a.to_dict() for a in achievements],
        "settings": settings.to_dict() if settings else None,
    }

    encrypt = request.args.get("encrypt")
    if encrypt and encrypt == "true":
        import json
        from cryptography.fernet import Fernet
        key = request.args.get("key")
        if not key:
            return jsonify({"error": "Encryption key required"}), 400
        try:
            cipher = Fernet(key.encode())
            encrypted = cipher.encrypt(json.dumps(data).encode())
            return jsonify({"encrypted": True, "data": encrypted.decode()}), 200
        except Exception:
            return jsonify({"error": "Encryption failed. Invalid key."}), 400

    return jsonify({"encrypted": False, "data": data}), 200


@settings_bp.route("/restore", methods=["POST"])
@jwt_required()
def restore_data():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "No backup data provided"}), 400

    if data.get("encrypted") and data.get("key"):
        try:
            import json
            from cryptography.fernet import Fernet
            cipher = Fernet(data["key"].encode())
            decrypted = cipher.decrypt(data["data"].encode())
            data = json.loads(decrypted)
        except Exception:
            return jsonify({"error": "Decryption failed. Invalid key or corrupted data."}), 400
    elif data.get("encrypted"):
        return jsonify({"error": "Encryption key required to restore"}), 400
    else:
        data = data.get("data", data)

    if "goals" in data:
        Goal.query.filter_by(user_id=user_id).delete()
        for g in data["goals"]:
            goal = Goal(
                user_id=user_id,
                title=g["title"],
                target_amount=g["target_amount"],
                current_amount=g.get("current_amount", 0),
            )
            db.session.add(goal)

    if "transactions" in data:
        Transaction.query.filter_by(user_id=user_id).delete()
        for t in data["transactions"]:
            txn = Transaction(
                user_id=user_id,
                transaction_type=t["type"],
                amount=t["amount"],
                category=t.get("category"),
                description=t.get("description"),
                notes=t.get("notes"),
            )
            db.session.add(txn)

    db.session.commit()
    return jsonify({"message": "Data restored successfully"}), 200


@settings_bp.route("/delete-account", methods=["DELETE"])
@jwt_required()
def delete_account():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Account deleted permanently"}), 200


@settings_bp.route("/reset", methods=["POST"])
@jwt_required()
def reset_app():
    user_id = int(get_jwt_identity())
    Goal.query.filter_by(user_id=user_id).delete()
    Transaction.query.filter_by(user_id=user_id).delete()
    Notification.query.filter_by(user_id=user_id).delete()
    Achievement.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"message": "Application data reset successfully"}), 200
