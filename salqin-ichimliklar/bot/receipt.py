"""Salqin — buyurtma chekining PNG rasmi (Pillow bilan)."""
import os
from io import BytesIO
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# ---------- Font tanlash (tizimda mavjudini topadi) ----------
_FONT_REG = [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/TTF/DejaVuSans.ttf',
    'C:/Windows/Fonts/arial.ttf',
]
_FONT_BOLD = [
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
]


def _find(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None


_REG_PATH = _find(_FONT_REG)
_BOLD_PATH = _find(_FONT_BOLD) or _REG_PATH


def _font(size: int, bold: bool = False):
    path = _BOLD_PATH if bold else _REG_PATH
    try:
        return ImageFont.truetype(path, size) if path else ImageFont.load_default()
    except Exception:
        return ImageFont.load_default()


COLORS = {
    'bg': (255, 255, 255),
    'ink': (15, 23, 42),
    'muted': (100, 116, 139),
    'soft': (148, 163, 184),
    'line': (203, 213, 225),
    'primary': (14, 165, 233),
    'primary2': (6, 182, 212),
    'pill_bg': (224, 242, 254),
    'pill_ink': (12, 74, 108),
    'danger': (220, 38, 38),
}


def _money(n) -> str:
    try:
        v = int(round(float(n)))
    except (TypeError, ValueError):
        v = 0
    return f"{v:,}".replace(',', ' ') + " so'm"


def _text_w(draw, text, fnt):
    try:
        bbox = draw.textbbox((0, 0), text, font=fnt)
        return bbox[2] - bbox[0]
    except Exception:
        return draw.textlength(text, font=fnt)


def _truncate(draw, text, fnt, max_w):
    if _text_w(draw, text, fnt) <= max_w:
        return text
    t = text
    while len(t) > 4 and _text_w(draw, t + '…', fnt) > max_w:
        t = t[:-1]
    return t + '…'


def _dashed(draw, x1, y, x2, color, dash=6, gap=4):
    x = x1
    while x < x2:
        draw.line([(x, y), (min(x + dash, x2), y)], fill=color, width=1)
        x += dash + gap


def _format_date(ts):
    try:
        return datetime.fromtimestamp(int(ts) / 1000).strftime('%d.%m.%Y %H:%M')
    except Exception:
        return datetime.now().strftime('%d.%m.%Y %H:%M')


def generate(order: dict) -> BytesIO:
    """Buyurtma uchun chek PNG rasmini yaratadi va BytesIO qaytaradi."""
    W = 720
    PAD = 44

    items = order.get('items') or []
    subtotal = sum((i.get('qty', 0) * i.get('price', 0)) for i in items)
    total = order.get('total', subtotal)
    discount_val = subtotal - total
    has_discount = discount_val > 0

    header_h = 150
    customer_h = 30 + (28 if order.get('address') else 0) + 90
    item_gap = 50
    items_h = max(len(items), 1) * item_gap + 60
    totals_h = 200 if has_discount else 165
    footer_h = 70
    H = header_h + customer_h + items_h + totals_h + footer_h

    img = Image.new('RGB', (W, H), COLORS['bg'])
    d = ImageDraw.Draw(img)

    # ---- Header (gradient) ----
    p1, p2 = COLORS['primary'], COLORS['primary2']
    for y in range(header_h):
        r = (y / header_h)
        col = (
            int(p1[0] + (p2[0] - p1[0]) * r),
            int(p1[1] + (p2[1] - p1[1]) * r),
            int(p1[2] + (p2[2] - p1[2]) * r),
        )
        d.line([(0, y), (W, y)], fill=col)

    # Brand mark + nomi
    d.text((PAD, 38), '*', fill='white', font=_font(48, True))  # joy-keeper
    d.text((PAD, 42), 'SALQIN', fill='white', font=_font(38, True))
    d.text((PAD, 98), "Sovuq ichimliklar do'koni", fill=(240, 249, 255), font=_font(15))

    # Order id (right)
    id_str = '#' + ((order.get('id') or '')[-5:].upper() or 'NEW')
    fnt_id = _font(28, True)
    id_w = _text_w(d, id_str, fnt_id)
    d.text((W - PAD - id_w, 42), id_str, fill='white', font=fnt_id)

    date_str = _format_date(order.get('createdAt'))
    fnt_date = _font(14)
    date_w = _text_w(d, date_str, fnt_date)
    d.text((W - PAD - date_w, 85), date_str, fill=(240, 249, 255), font=fnt_date)

    # ---- Customer ----
    y = header_h + 30
    d.text((PAD, y), 'MIJOZ', fill=COLORS['soft'], font=_font(12, True))
    y += 22
    d.text((PAD, y), order.get('name', '—'), fill=COLORS['ink'], font=_font(18, True))
    y += 26
    d.text((PAD, y), order.get('phone', '—'), fill=COLORS['muted'], font=_font(15))
    y += 22
    if order.get('address'):
        d.text((PAD, y), order['address'], fill=COLORS['muted'], font=_font(15))
        y += 22

    y += 14
    _dashed(d, PAD, y, W - PAD, COLORS['line'])
    y += 22

    # ---- Items ----
    d.text((PAD, y), 'MAHSULOTLAR', fill=COLORS['soft'], font=_font(12, True))
    y += 28

    for item in items:
        name = _truncate(d, item.get('name', '—'), _font(16, True), W - PAD * 2 - 180)
        d.text((PAD, y), name, fill=COLORS['ink'], font=_font(16, True))

        line_total = _money(item.get('qty', 0) * item.get('finalPrice', 0))
        lt_w = _text_w(d, line_total, _font(17, True))
        d.text((W - PAD - lt_w, y), line_total, fill=COLORS['ink'], font=_font(17, True))

        disc = item.get('discount', 0) or 0
        sub = f"× {item.get('qty', 0)} · {_money(item.get('finalPrice', 0))}"
        if disc:
            sub += f"  (−{disc}%)"
        d.text((PAD, y + 22), sub, fill=COLORS['muted'], font=_font(13))
        y += item_gap

    y += 6
    _dashed(d, PAD, y, W - PAD, COLORS['line'])
    y += 24

    # ---- Totals ----
    if has_discount:
        d.text((PAD, y), 'Mahsulotlar:', fill=COLORS['muted'], font=_font(15))
        s = _money(subtotal)
        d.text((W - PAD - _text_w(d, s, _font(15)), y), s, fill=COLORS['muted'], font=_font(15))
        y += 24

        d.text((PAD, y), 'Chegirma:', fill=COLORS['danger'], font=_font(15))
        ds = '−' + _money(discount_val)
        d.text((W - PAD - _text_w(d, ds, _font(15)), y), ds, fill=COLORS['danger'], font=_font(15))
        y += 30

    fnt_total = _font(26, True)
    d.text((PAD, y), 'JAMI', fill=COLORS['ink'], font=fnt_total)
    total_str = _money(total)
    tw = _text_w(d, total_str, fnt_total)
    d.text((W - PAD - tw, y), total_str, fill=COLORS['primary'], font=fnt_total)
    y += 42

    # Payment pill
    payment = order.get('payment', '—')
    meta = order.get('paymentMeta') or {}
    if meta.get('cardLast4'):
        payment += f" · **** {meta['cardLast4']}"
    elif meta.get('phone'):
        payment += f" · {meta['phone']}"
    pay_text = f"To'lov: {payment}"
    fnt_pay = _font(13)
    pw = _text_w(d, pay_text, fnt_pay)
    pill_w = pw + 24
    pill_h = 28
    d.rounded_rectangle(
        [PAD, y, PAD + pill_w, y + pill_h],
        radius=14, fill=COLORS['pill_bg']
    )
    d.text((PAD + 12, y + 7), pay_text, fill=COLORS['pill_ink'], font=fnt_pay)

    # ---- Footer ----
    foot = "Buyurtmangiz uchun rahmat! · salqin.uz"
    fnt_foot = _font(12)
    fw = _text_w(d, foot, fnt_foot)
    d.text(((W - fw) // 2, H - 30), foot, fill=COLORS['soft'], font=fnt_foot)

    buf = BytesIO()
    img.save(buf, format='PNG', optimize=True)
    buf.seek(0)
    return buf
