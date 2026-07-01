from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from models import db, User, Session
from utils import (
    sanitize_input, validate_email, validate_password,
    hash_password, check_password
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = sanitize_input(data.get("name", ""))
    email = sanitize_input(data.get("email", ""))
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    valid, msg = validate_password(password)
    if not valid:
        return jsonify({"error": msg}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    db.session.add(user)
    db.session.flush()

    from models import Setting
    if not Setting.query.filter_by(user_id=user.id).first():
        setting = Setting(user_id=user.id)
        db.session.add(setting)

    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    session = Session(
        user_id=user.id,
        token=access_token,
        refresh_token=refresh_token,
        device_info=data.get("device_info", ""),
        ip_address=request.remote_addr,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        "message": "Registration successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = sanitize_input(data.get("email", ""))
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated"}), 403

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    session = Session(
        user_id=user.id,
        token=access_token,
        refresh_token=refresh_token,
        device_info=data.get("device_info", ""),
        ip_address=request.remote_addr,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    Session.query.filter_by(user_id=user_id, is_active=True).update({"is_active": False})
    db.session.commit()
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "name" in data:
        user.name = sanitize_input(data["name"])
    if "avatar" in data:
        user.avatar = data["avatar"]
    if "currency" in data:
        user.currency = data["currency"]
    if "language" in data:
        user.language = data["language"]
    if "dark_mode" in data:
        user.dark_mode = bool(data["dark_mode"])

    db.session.commit()
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = sanitize_input(data.get("email", ""))
    if not validate_email(email):
        return jsonify({"error": "Invalid email"}), 400
    user = User.query.filter_by(email=email).first()
    if user:
        pass
    return jsonify({"message": "Password reset email sent if account exists"}), 200


@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json()
    email = sanitize_input(data.get("email", ""))
    otp = data.get("otp", "")
    if not email or not otp:
        return jsonify({"error": "Email and OTP required"}), 400
    return jsonify({"message": "Email verified successfully (mock)"}), 200
