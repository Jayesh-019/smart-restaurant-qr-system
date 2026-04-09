import base64
from io import BytesIO

import qrcode


def build_table_qr_url(base_url: str, table_number: str, qr_token: str) -> str:
    return f"{base_url}?table={table_number}&token={qr_token}"


def generate_qr_base64(content: str) -> str:
    qr_image = qrcode.make(content)
    buffer = BytesIO()
    qr_image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
