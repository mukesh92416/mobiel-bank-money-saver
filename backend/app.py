import os
from datetime import datetime, timezone, timedelta
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import config
from models import db, Achievement, Notification, Transaction, Goal


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config.get(config_name, config["development"]))

    db.init_app(app)
    Migrate(app, db)
    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    JWTManager(app)

    if app.config["RATE_LIMIT_ENABLED"]:
        Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=[app.config["RATE_LIMIT_DEFAULT"]],
        )

    from routes.auth import auth_bp
    from routes.goals import goals_bp
    from routes.transactions import transactions_bp
    from routes.analytics import analytics_bp
    from routes.notifications import notifications_bp
    from routes.achievements import achievements_bp
    from routes.settings import settings_bp
    from routes.upi import upi_bp
    from routes.auto_save import auto_save_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(goals_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(achievements_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(upi_bp)
    app.register_blueprint(auto_save_bp)

    @app.route("/api/health")
    def health():
        return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Not found"}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error"}, 500

    with app.app_context():
        db.create_all()

    return app


def seed_achievements(user_id):
    achievements_data = [
        {"name": "First Deposit", "description": "Made your first deposit", "icon": "piggy-bank"},
        {"name": "₹100 Saved", "description": "Saved ₹100 in total", "icon": "rupee-sign"},
        {"name": "₹1,000 Saved", "description": "Saved ₹1,000 in total", "icon": "rupee-sign"},
        {"name": "₹10,000 Saved", "description": "Saved ₹10,000 in total", "icon": "rupee-sign"},
        {"name": "30 Day Streak", "description": "Saved for 30 consecutive days", "icon": "fire"},
        {"name": "100 Transactions", "description": "Recorded 100 transactions", "icon": "exchange-alt"},
        {"name": "Goal Completed", "description": "Completed your first savings goal", "icon": "trophy"},
        {"name": "Early Bird", "description": "Made a deposit before 8 AM", "icon": "sun"},
        {"name": "Night Owl", "description": "Made a deposit after 10 PM", "icon": "moon"},
        {"name": "Saver Extraordinaire", "description": "Saved ₹1,00,000 in total", "icon": "crown"},
    ]
    for a in achievements_data:
        existing = Achievement.query.filter_by(user_id=user_id, name=a["name"]).first()
        if not existing:
            achievement = Achievement(
                user_id=user_id,
                name=a["name"],
                description=a["description"],
                icon=a["icon"],
            )
            db.session.add(achievement)
    db.session.commit()

app = create_app()

if __name__ == "__main__":
    
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
