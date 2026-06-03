"""Salqin — Telegram Bot API bilan ishlovchi qatlam."""
import requests
from datetime import datetime
import config

TIMEOUT = 20


def _api(method: str) -> str:
    return f'https://api.telegram.org/bot{config.BOT_TOKEN}/{method}'


def esc(s) -> str:
    """HTML escape (Telegram parse_mode=HTML uchun)."""
    return (
        str(s if s is not None else '')
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
    )


def format_money(n) -> str:
    try:
        v = int(round(float(n)))
    except (TypeError, ValueError):
        v = 0
    return f"{v:,}".replace(',', ' ') + " so'm"


def get_me() -> dict:
    return requests.get(_api('getMe'), timeout=TIMEOUT).json()


def send_message(text: str, parse_mode: str = 'HTML') -> dict:
    return requests.post(
        _api('sendMessage'),
        data={
            'chat_id': config.CHANNEL_ID,
            'text': text,
            'parse_mode': parse_mode,
            'disable_web_page_preview': True,
        },
        timeout=TIMEOUT,
    ).json()


def send_photo(image_bytes, caption: str, parse_mode: str = 'HTML') -> dict:
    """image_bytes — BytesIO yoki bytes."""
    if hasattr(image_bytes, 'seek'):
        image_bytes.seek(0)
    files = {'photo': ('receipt.png', image_bytes, 'image/png')}
    data = {
        'chat_id': config.CHANNEL_ID,
        'caption': caption,
        'parse_mode': parse_mode,
    }
    return requests.post(_api('sendPhoto'), files=files, data=data, timeout=TIMEOUT).json()


# ------------------- Caption builder -------------------

def _format_date(ts):
    try:
        return datetime.fromtimestamp(int(ts) / 1000).strftime('%d.%m.%Y %H:%M')
    except Exception:
        return datetime.now().strftime('%d.%m.%Y %H:%M')


def build_caption(order: dict) -> str:
    oid = (order.get('id') or '')[-5:].upper() or 'NEW'
    items = order.get('items') or []

    item_lines = [
        f"• {esc(i.get('name'))} × {i.get('qty', 0)} — "
        f"<b>{format_money(i.get('qty', 0) * i.get('finalPrice', 0))}</b>"
        for i in items
    ]

    payment = order.get('payment') or '—'
    meta = order.get('paymentMeta') or {}
    if meta.get('cardLast4'):
        payment += f" · **** {meta['cardLast4']}"
    elif meta.get('phone'):
        payment += f" · {meta['phone']}"

    parts = [
        f"🛒 <b>Yangi buyurtma #{oid}</b>",
        '',
        f"👤 {esc(order.get('name', '—'))}",
        f"📞 {esc(order.get('phone', '—'))}",
    ]
    if order.get('address'):
        parts.append(f"📍 {esc(order['address'])}")
    parts.append('')
    parts.extend(item_lines)
    parts.append('')
    parts.append(f"💰 Jami: <b>{format_money(order.get('total', 0))}</b>")
    parts.append(f"💳 To'lov: {esc(payment)}")
    parts.append('')
    parts.append(f"🕒 {_format_date(order.get('createdAt'))}")
    if order.get('note'):
        parts.append('')
        parts.append(f"📝 {esc(order['note'])}")
    return '\n'.join(parts)


def build_status_message(payload: dict) -> str:
    oid = (payload.get('orderId') or '')[-5:].upper() or '—'
    status = payload.get('status') or '—'
    name = payload.get('name') or '—'
    phone = payload.get('phone') or '—'
    return (
        f"📦 <b>Buyurtma #{oid}</b>\n\n"
        f"Yangi holat: <b>{esc(status)}</b>\n"
        f"Mijoz: {esc(name)} · {esc(phone)}"
    )
