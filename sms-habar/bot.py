"""
============================================================
 SMS HABAR — telefon tasdiqlash (OTP) boti  (aiogram v3)
 ALOHIDA, mustaqil bot. Asosiy platforma/do'kon botidan butunlay ajratilgan.

 VAZIFASI: sayt ro'yxatdan o'tishida foydalanuvchi telefon raqamini Telegram orqali
 tasdiqlaydi (SMS o'rniga):
   1. Foydalanuvchi botni ochadi (/start) → "📱 Telefon yuborish" tugmasi chiqadi.
   2. Foydalanuvchi kontaktini yuboradi → bot 4 xonali kod yuboradi.
   3. Sayt POST /verify/check {phone, code} yuboradi → bot {"ok": true/false} qaytaradi.

 ISHLATISH:
   1. @BotFather dan YANGI bot yarating va TOKEN oling.
   2. .env ga BOT_TOKEN=xxx yozing (yoki muhit o'zgaruvchisi sifatida bering).
   3. python3 -m pip install -r requirements.txt
   4. python3 bot.py
   5. Saytdagi js/auth.js da BOT_USERNAME = bot @username, BOT_SERVER = shu server HTTPS manzili.

 DEPLOY: HTTPS va internetdan ochiq bo'lishi shart (mijoz qurilmasi /verify/check ga ulanadi).
============================================================
"""

import asyncio
import logging
import os
import random
import re
import time

from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import CommandStart
from aiogram.types import (
    Message,
    ReplyKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardRemove,
)
from aiohttp import web

# ============ CONFIG ============
BOT_TOKEN = os.getenv("BOT_TOKEN", "8938349890:AAH3uzdAyjOHabEZRGhyof5flBbV-jrTCuI")          # @BotFather'dan oling (.env yoki muhit o'zgaruvchisi)
HTTP_HOST = os.getenv("HOST", "0.0.0.0")        # internetga ochiq bo'lsin (deploy uchun 0.0.0.0)
HTTP_PORT = int(os.getenv("PORT", "3355"))      # asosiy bot 3344 da — bu boshqa port
CODE_TTL = int(os.getenv("CODE_TTL", "600"))    # kod amal qilish muddati (soniya), 10 daqiqa

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sms-habar")

# Tasdiqlash kodlari xotirada: normalizatsiya qilingan_telefon -> {"code","chatId","ts"}.
# Bir martalik ishlatiladi va CODE_TTL dan keyin yaroqsiz bo'ladi.
VERIFY_CODES: dict = {}


def norm_phone(p) -> str:
    """Telefonni oxirgi 9 raqami bo'yicha solishtirish uchun normalizatsiya qiladi
    (saytdagi va Telegram'dagi format farq qilsa ham bir xil bo'lsin)."""
    d = re.sub(r"\D", "", str(p or ""))
    return d[-9:] if len(d) >= 9 else d


# ============ TELEGRAM BOT ============
router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    """/start — telefon yuborish tugmasini ko'rsatadi (bot faqat tasdiqlash uchun)."""
    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Telefon raqamni yuborish", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
    await message.answer(
        "Ro'yxatdan o'tishni tasdiqlash uchun pastdagi tugma bilan "
        "telefon raqamingizni yuboring.",
        reply_markup=kb,
        parse_mode=None,
    )


@router.message(F.contact)
async def on_contact(message: Message) -> None:
    """Kontakt kelganda 4 xonali tasdiqlash kodini yaratib yuboradi."""
    phone = norm_phone(message.contact.phone_number)
    code = f"{random.randint(0, 9999):04d}"
    VERIFY_CODES[phone] = {"code": code, "chatId": message.chat.id, "ts": time.time()}
    log.info("Kod yuborildi: phone=%s", phone)
    await message.answer(
        f"✅ Tasdiqlash kodingiz: {code}\n\n"
        f"Shu kodni saytga kiriting. ({CODE_TTL // 60} daqiqa amal qiladi)",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode=None,
    )


# ============ HTTP SERVER (sayt /verify/check shu yerga murojaat qiladi) ============
async def cors_middleware(request, handler):
    """Har qanday domendan (sayt) so'rovga ruxsat (CORS) + OPTIONS preflight javobi."""
    if request.method == "OPTIONS":
        return web.Response(
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "600",
            }
        )
    response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


async def handle_verify_check(request: web.Request) -> web.Response:
    """Sayt yuborgan {phone, code} ni tekshiradi → {"ok": bool, "error"?: str}."""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Invalid JSON"}, status=400)
    phone = norm_phone(body.get("phone"))
    code = str(body.get("code") or "").strip()
    rec = VERIFY_CODES.get(phone)
    if not rec:
        return web.json_response({"ok": False, "error": "Kod topilmadi. Botda telefon yuboring."})
    if time.time() - rec["ts"] > CODE_TTL:
        VERIFY_CODES.pop(phone, None)
        return web.json_response({"ok": False, "error": "Kod muddati tugadi."})
    if code != rec["code"]:
        return web.json_response({"ok": False, "error": "Kod noto'g'ri."})
    VERIFY_CODES.pop(phone, None)  # bir martalik
    log.info("Tasdiqlandi: phone=%s", phone)
    return web.json_response({"ok": True})


async def handle_health(request: web.Request) -> web.Response:
    """Tiriklik tekshiruvi (deploy/monitoring uchun)."""
    return web.json_response({"ok": True, "service": "sms-habar"})


def build_http_app() -> web.Application:
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_post("/verify/check", handle_verify_check)
    app.router.add_get("/", handle_health)
    return app


# ============ ISHGA TUSHIRISH (bot polling + HTTP server birga) ============
async def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit(
            "BOT_TOKEN yo'q. @BotFather'dan token oling va .env ga "
            "BOT_TOKEN=... yozing (yoki muhit o'zgaruvchisi sifatida bering)."
        )

    bot = Bot(BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)

    # HTTP serverni ishga tushiramiz (sayt /verify/check uchun)
    runner = web.AppRunner(build_http_app())
    await runner.setup()
    await web.TCPSite(runner, HTTP_HOST, HTTP_PORT).start()
    log.info("SMS Habar HTTP server: http://%s:%s", HTTP_HOST, HTTP_PORT)

    # Botni polling rejimida ishlatamiz
    try:
        log.info("SMS Habar bot ishga tushdi (polling).")
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
