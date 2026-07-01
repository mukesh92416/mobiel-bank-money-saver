from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Setting
from utils.upi import build_upi_url, build_payment_app_urls, generate_qr_content

upi_bp = Blueprint("upi", __name__, url_prefix="/api/upi")


@upi_bp.route("/settings", methods=["GET"])
@jwt_required()
def get_upi_settings():
    user_id = int(get_jwt_identity())
    setting = Setting.query.filter_by(user_id=user_id).first()
    if not setting:
        return jsonify({
            "upi_id": None,
            "upi_name": None,
            "preferred_upi_app": None,
            "default_save_amount": 0,
            "default_save_note": None,
            "withdrawal_upi_id": None,
            "withdrawal_upi_name": None,
            "withdrawal_preferred_upi_app": None,
            "withdrawal_default_amount": 0,
            "withdrawal_default_note": None,
        }), 200

    return jsonify({
        "upi_id": setting.upi_id,
        "upi_name": setting.upi_name,
        "preferred_upi_app": setting.preferred_upi_app,
        "default_save_amount": setting.default_save_amount,
        "default_save_note": setting.default_save_note,
        "withdrawal_upi_id": setting.withdrawal_upi_id,
        "withdrawal_upi_name": setting.withdrawal_upi_name,
        "withdrawal_preferred_upi_app": setting.withdrawal_preferred_upi_app,
        "withdrawal_default_amount": setting.withdrawal_default_amount,
        "withdrawal_default_note": setting.withdrawal_default_note,
    }), 200


@upi_bp.route("/settings", methods=["PUT"])
@jwt_required()
def update_upi_settings():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    setting = Setting.query.filter_by(user_id=user_id).first()
    if not setting:
        setting = Setting(user_id=user_id)
        db.session.add(setting)

    if "upi_id" in data:
        setting.upi_id = data["upi_id"]
    if "upi_name" in data:
        setting.upi_name = data["upi_name"]
    if "preferred_upi_app" in data:
        setting.preferred_upi_app = data["preferred_upi_app"]
    if "default_save_amount" in data:
        setting.default_save_amount = float(data["default_save_amount"])
    if "default_save_note" in data:
        setting.default_save_note = data["default_save_note"]
    if "withdrawal_upi_id" in data:
        setting.withdrawal_upi_id = data["withdrawal_upi_id"]
    if "withdrawal_upi_name" in data:
        setting.withdrawal_upi_name = data["withdrawal_upi_name"]
    if "withdrawal_preferred_upi_app" in data:
        setting.withdrawal_preferred_upi_app = data["withdrawal_preferred_upi_app"]
    if "withdrawal_default_amount" in data:
        setting.withdrawal_default_amount = float(data["withdrawal_default_amount"])
    if "withdrawal_default_note" in data:
        setting.withdrawal_default_note = data["withdrawal_default_note"]

    db.session.commit()
    return jsonify({"message": "UPI settings updated"}), 200


@upi_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_upi_info():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    setting = Setting.query.filter_by(user_id=user_id).first()

    profile = data.get("profile", "deposit")
    is_deposit = profile == "deposit"

    if is_deposit:
        upi_id = data.get("upi_id") or (setting.upi_id if setting else None)
        upi_name = data.get("upi_name") or (setting.upi_name if setting else None) or "MoneySaver"
        note = data.get("note") or (setting.default_save_note if setting else None)
    else:
        upi_id = data.get("upi_id") or (setting.withdrawal_upi_id if setting else None)
        upi_name = data.get("upi_name") or (setting.withdrawal_upi_name if setting else None) or "MoneySaver"
        note = data.get("note") or (setting.withdrawal_default_note if setting else None)

    amount = data.get("amount", 0)

    if not upi_id:
        return jsonify({"error": "UPI ID not configured"}), 400

    upi_url = build_upi_url(upi_id, upi_name, amount, note)
    app_urls = build_payment_app_urls(upi_id, upi_name, amount, note)
    qr_content = generate_qr_content(upi_id, upi_name, amount, note)

    return jsonify({
        "upi_url": upi_url,
        "qr_content": qr_content,
        "payment_apps": app_urls,
        "upi_id": upi_id,
        "upi_name": upi_name,
        "amount": amount,
    }), 200
