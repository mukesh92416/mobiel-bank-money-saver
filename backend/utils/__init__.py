import re
from werkzeug.security import generate_password_hash, check_password_hash


def sanitize_input(value):
    if not value:
        return value
    if isinstance(value, str):
        value = value.strip()
        value = re.sub(r'[<>\'";()]', '', value)
    return value


def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain an uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain a lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain a number"
    return True, ""


def hash_password(password):
    return generate_password_hash(password)


def check_password(password, password_hash):
    return check_password_hash(password_hash, password)


def validate_amount(amount):
    try:
        amount = float(amount)
        if amount <= 0:
            return False, "Amount must be greater than zero"
        if amount > 999999999.99:
            return False, "Amount exceeds maximum limit"
        return True, ""
    except (TypeError, ValueError):
        return False, "Invalid amount format"
