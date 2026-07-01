import urllib.parse


def build_upi_params(upi_id: str, name: str, amount: float | None = None, note: str | None = None) -> dict:
    params = {
        "pa": upi_id,
        "pn": name[:30] if name else "MoneySaver",
        "tn": (note or "Savings deposit")[:50],
        "cu": "INR",
    }
    if amount and amount > 0:
        params["am"] = f"{amount:.2f}"
    return params


def build_upi_url(upi_id: str, name: str, amount: float | None = None, note: str | None = None) -> str:
    params = build_upi_params(upi_id, name, amount, note)
    query = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    return f"upi://pay?{query}"


def build_payment_app_urls(upi_id: str, name: str, amount: float | None = None, note: str | None = None):
    params = build_upi_params(upi_id, name, amount, note)
    query = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)

    raw_whatsapp_text = f"Pay via UPI: upi://pay?pa={urllib.parse.quote(upi_id)}&pn={urllib.parse.quote(name[:30])}&cu=INR"
    if amount and amount > 0:
        raw_whatsapp_text += f"&am={amount:.2f}"

    return {
        "google_pay": f"upi://pay?{query}",
        "phone_pe": f"upi://pay?{query}",
        "paytm": f"upi://pay?{query}",
        "bhim": f"upi://pay?{query}",
        "whatsapp": f"https://wa.me/?text={urllib.parse.quote(raw_whatsapp_text)}",
    }


def generate_qr_content(upi_id: str, name: str, amount: float | None = None, note: str | None = None) -> str:
    return build_upi_url(upi_id, name, amount, note)
