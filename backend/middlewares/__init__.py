from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User


def protected_route(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return jsonify({"error": "User not found or inactive"}), 401
            return fn(*args, **kwargs, current_user=user)
        except Exception as e:
            return jsonify({"error": "Authentication required"}), 401
    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or not user.is_admin:
                return jsonify({"error": "Admin access required"}), 403
            return fn(*args, **kwargs, current_user=user)
        except Exception:
            return jsonify({"error": "Authentication required"}), 401
    return wrapper


def rate_limit_by_ip(max_per_minute=60):
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    return limiter.limit(f"{max_per_minute}/minute")
