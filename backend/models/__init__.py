from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class TimestampMixin:
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    avatar = db.Column(db.String(500), nullable=True)
    currency = db.Column(db.String(10), default="INR")
    language = db.Column(db.String(10), default="en")
    dark_mode = db.Column(db.Boolean, default=False)
    email_verified = db.Column(db.Boolean, default=False)
    biometric_enabled = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    goals = db.relationship("Goal", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    transactions = db.relationship(
        "Transaction", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    notifications = db.relationship(
        "Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    achievements = db.relationship(
        "Achievement", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    settings = db.relationship(
        "Setting", backref="user", uselist=False, cascade="all, delete-orphan"
    )
    auto_save_schedules = db.relationship(
        "AutoSaveSchedule", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    sessions = db.relationship(
        "Session", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar": self.avatar,
            "currency": self.currency,
            "language": self.language,
            "dark_mode": self.dark_mode,
            "email_verified": self.email_verified,
            "biometric_enabled": self.biometric_enabled,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Goal(TimestampMixin, db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0)
    deadline = db.Column(db.DateTime, nullable=True)
    priority = db.Column(db.String(20), default="medium")
    color_theme = db.Column(db.String(50), default="emerald")
    icon = db.Column(db.String(100), default="target")
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    def progress(self):
        if self.target_amount <= 0:
            return 100.0
        return min(round((self.current_amount / self.target_amount) * 100, 2), 100.0)

    def remaining(self):
        return max(self.target_amount - self.current_amount, 0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "target_amount": self.target_amount,
            "current_amount": self.current_amount,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "priority": self.priority,
            "color_theme": self.color_theme,
            "icon": self.icon,
            "completed": self.completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "progress": self.progress(),
            "remaining": self.remaining(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Transaction(TimestampMixin, db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    goal_id = db.Column(db.Integer, db.ForeignKey("goals.id"), nullable=True)
    transaction_type = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    transaction_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    goal = db.relationship("Goal", backref="transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "goal_id": self.goal_id,
            "type": self.transaction_type,
            "amount": self.amount,
            "category": self.category,
            "description": self.description,
            "notes": self.notes,
            "transaction_date": self.transaction_date.isoformat(),
            "goal_title": self.goal.title if self.goal else None,
            "created_at": self.created_at.isoformat(),
        }


class Achievement(TimestampMixin, db.Model):
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    icon = db.Column(db.String(100), default="trophy")
    unlocked = db.Column(db.Boolean, default=False)
    unlocked_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "unlocked": self.unlocked,
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None,
            "created_at": self.created_at.isoformat(),
        }


class Notification(TimestampMixin, db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.String(500), nullable=True)
    notification_type = db.Column(db.String(50), default="info")
    read = db.Column(db.Boolean, default=False, index=True)
    read_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "type": self.notification_type,
            "read": self.read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat(),
        }


class Setting(TimestampMixin, db.Model):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    theme = db.Column(db.String(20), default="light")
    currency = db.Column(db.String(10), default="INR")
    language = db.Column(db.String(10), default="en")
    daily_reminder = db.Column(db.Boolean, default=True)
    goal_reminder = db.Column(db.Boolean, default=True)
    achievement_notification = db.Column(db.Boolean, default=True)
    monthly_report = db.Column(db.Boolean, default=True)
    pin_enabled = db.Column(db.Boolean, default=False)
    pin_hash = db.Column(db.String(255), nullable=True)
    biometric_enabled = db.Column(db.Boolean, default=False)
    upi_id = db.Column(db.String(100), nullable=True)
    upi_name = db.Column(db.String(100), nullable=True)
    preferred_upi_app = db.Column(db.String(50), nullable=True)
    default_save_amount = db.Column(db.Float, default=0.0)
    default_save_note = db.Column(db.String(200), nullable=True)
    withdrawal_upi_id = db.Column(db.String(100), nullable=True)
    withdrawal_upi_name = db.Column(db.String(100), nullable=True)
    withdrawal_preferred_upi_app = db.Column(db.String(50), nullable=True)
    withdrawal_default_amount = db.Column(db.Float, default=0.0)
    withdrawal_default_note = db.Column(db.String(200), nullable=True)
    auto_lock_minutes = db.Column(db.Integer, default=0)

    reminder_enabled = db.Column(db.Boolean, default=False)
    reminder_time = db.Column(db.String(5), default="09:00")
    reminder_frequency = db.Column(db.String(20), default="daily")
    reminder_days = db.Column(db.Text, nullable=True)
    reminder_amount = db.Column(db.Float, default=0.0)
    reminder_title = db.Column(db.String(200), default="Money Vault Reminder")
    reminder_message = db.Column(db.String(500), default="Don't forget today's savings!")
    reminder_timezone = db.Column(db.String(50), default="UTC")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "theme": self.theme,
            "currency": self.currency,
            "language": self.language,
            "daily_reminder": self.daily_reminder,
            "goal_reminder": self.goal_reminder,
            "achievement_notification": self.achievement_notification,
            "monthly_report": self.monthly_report,
            "pin_enabled": self.pin_enabled,
            "biometric_enabled": self.biometric_enabled,
            "upi_id": self.upi_id,
            "upi_name": self.upi_name,
            "preferred_upi_app": self.preferred_upi_app,
            "default_save_amount": self.default_save_amount,
            "default_save_note": self.default_save_note,
            "withdrawal_upi_id": self.withdrawal_upi_id,
            "withdrawal_upi_name": self.withdrawal_upi_name,
            "withdrawal_preferred_upi_app": self.withdrawal_preferred_upi_app,
            "withdrawal_default_amount": self.withdrawal_default_amount,
            "withdrawal_default_note": self.withdrawal_default_note,
            "auto_lock_minutes": self.auto_lock_minutes,
            "reminder_enabled": self.reminder_enabled,
            "reminder_time": self.reminder_time,
            "reminder_frequency": self.reminder_frequency,
            "reminder_days": self.reminder_days,
            "reminder_amount": self.reminder_amount,
            "reminder_title": self.reminder_title,
            "reminder_message": self.reminder_message,
            "reminder_timezone": self.reminder_timezone,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class AutoSaveSchedule(TimestampMixin, db.Model):
    __tablename__ = "auto_save_schedules"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    frequency = db.Column(db.String(20), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=True)
    day_of_month = db.Column(db.Integer, nullable=True)
    time = db.Column(db.String(5), nullable=True)
    note = db.Column(db.String(200), nullable=True)
    goal_id = db.Column(db.Integer, db.ForeignKey("goals.id"), nullable=True)
    active = db.Column(db.Boolean, default=True)
    last_triggered = db.Column(db.DateTime, nullable=True)
    next_trigger = db.Column(db.DateTime, nullable=True, index=True)

    goal = db.relationship("Goal", backref="auto_save_schedules")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": self.amount,
            "frequency": self.frequency,
            "day_of_week": self.day_of_week,
            "day_of_month": self.day_of_month,
            "time": self.time,
            "note": self.note,
            "goal_id": self.goal_id,
            "active": self.active,
            "last_triggered": self.last_triggered.isoformat() if self.last_triggered else None,
            "next_trigger": self.next_trigger.isoformat() if self.next_trigger else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Session(TimestampMixin, db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    token = db.Column(db.String(500), nullable=False, unique=True, index=True)
    refresh_token = db.Column(db.String(500), nullable=True)
    device_info = db.Column(db.String(500), nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "device_info": self.device_info,
            "ip_address": self.ip_address,
            "is_active": self.is_active,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat(),
        }
