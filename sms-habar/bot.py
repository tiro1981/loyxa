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
    CallbackQuery,
    ReplyKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardRemove,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from aiohttp import web

# ============ CONFIG ============
BOT_TOKEN = os.getenv("BOT_TOKEN", "8938349890:AAH3uzdAyjOHabEZRGhyof5flBbV-jrTCuI")          # @BotFather'dan oling (.env yoki muhit o'zgaruvchisi)
HTTP_HOST = os.getenv("IP") or os.getenv("HOST", "0.0.0.0")  # AlwaysData IP env'ni (IPv6) afzal ko'radi, aks holda HOST
HTTP_PORT = int(os.getenv("PORT", "3355"))      # asosiy bot 3344 da — bu boshqa port
CODE_TTL = int(os.getenv("CODE_TTL", "120"))    # kod amal qilish muddati (soniya), 2 daqiqa

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sms-habar")

# Tasdiqlash kodlari xotirada: normalizatsiya qilingan_telefon -> {"code","chatId","ts"}.
# Bir martalik ishlatiladi va CODE_TTL dan keyin yaroqsiz bo'ladi.
VERIFY_CODES: dict = {}

# chat_id -> normalizatsiya qilingan telefon. "🔄 Yangi kod olish" tugmasi bosilganda
# qaysi telefonga yangi kod yuborishni bilish uchun kerak.
CHAT_PHONE: dict = {}


def issue_code(phone: str, chat_id: int) -> str:
    """Berilgan telefon uchun yangi 4 xonali kod yaratadi va xotiraga yozadi."""
    code = f"{random.randint(0, 9999):04d}"
    VERIFY_CODES[phone] = {"code": code, "chatId": chat_id, "ts": time.time()}
    log.info("Kod yuborildi: phone=%s", phone)
    return code


def code_text(code: str) -> str:
    return (
        f"✅ Tasdiqlash kodingiz: {code}\n\n"
        f"Shu kodni saytga kiriting. ({CODE_TTL // 60} daqiqa amal qiladi)\n"
        f"Muddati tugasa — pastdagi «🔄 Yangi kod olish» tugmasini bosing."
    )


def refresh_kb() -> InlineKeyboardMarkup:
    """Yangi kod olish uchun inline tugma."""
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🔄 Yangi kod olish", callback_data="newcode")]]
    )


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
    CHAT_PHONE[message.chat.id] = phone          # keyin "Yangi kod olish" uchun eslab qolamiz
    code = issue_code(phone, message.chat.id)
    # Avval kontakt klaviaturasini olib tashlaymiz, so'ng kodni inline tugma bilan yuboramiz.
    await message.answer("📱 Raqamingiz qabul qilindi.", reply_markup=ReplyKeyboardRemove())
    await message.answer(code_text(code), reply_markup=refresh_kb(), parse_mode=None)


@router.callback_query(F.data == "newcode")
async def on_newcode(cb: CallbackQuery) -> None:
    """«🔄 Yangi kod olish» bosilganda — shu chat telefoniga yangi kod yuboradi."""
    phone = CHAT_PHONE.get(cb.message.chat.id)
    if not phone:
        await cb.answer("Avval telefon raqamingizni yuboring (/start).", show_alert=True)
        return
    code = issue_code(phone, cb.message.chat.id)
    await cb.message.answer(code_text(code), reply_markup=refresh_kb(), parse_mode=None)
    await cb.answer("Yangi kod yuborildi ✅")


# ============ HTTP SERVER (sayt /verify/check shu yerga murojaat qiladi) ============
@web.middleware
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


async def handle_verify_status(request: web.Request) -> web.Response:
    """Sayt sanoq taymeri uchun: telefon bo'yicha kodning qolgan amal muddati (soniya).
    GET /verify/status?phone=... → {"ok", "exists", "remaining", "ttl"}."""
    phone = norm_phone(request.query.get("phone"))
    rec = VERIFY_CODES.get(phone)
    if not rec:
        return web.json_response({"ok": True, "exists": False, "remaining": 0, "ttl": CODE_TTL})
    remaining = int(max(0, CODE_TTL - (time.time() - rec["ts"])))
    return web.json_response({"ok": True, "exists": True, "remaining": remaining, "ttl": CODE_TTL})


async def handle_health(request: web.Request) -> web.Response:
    """Tiriklik tekshiruvi (deploy/monitoring uchun)."""
    return web.json_response({"ok": True, "service": "sms-habar"})


def build_http_app() -> web.Application:
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_post("/verify/check", handle_verify_check)
    app.router.add_get("/verify/status", handle_verify_status)
    app.router.add_get("/", handle_health)
    return app


async def cleanup_expired_codes() -> None:
    """Muddati o'tgan kodlarni xotiradan tozalaydi — uzoq ishlaganda (haftalab)
    VERIFY_CODES/CHAT_PHONE cheksiz o'sib RAM'ni band qilib qolmasligi uchun.
    AlwaysData "juda ko'p RAM ishlatgan jarayonni o'chiradi" siyosatiga qarshi ehtiyot chorasi."""
    while True:
        await asyncio.sleep(300)  # har 5 daqiqada
        try:
            now = time.time()
            stale = [p for p, rec in VERIFY_CODES.items() if now - rec["ts"] > CODE_TTL]
            for p in stale:
                VERIFY_CODES.pop(p, None)
            if stale:
                log.info("Tozalandi: %d ta muddati o'tgan kod", len(stale))
        except Exception as e:
            log.error("cleanup_expired_codes xato: %s", e)


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

    asyncio.create_task(cleanup_expired_codes())

    # Botni polling rejimida ishlatamiz. MUHIM: avval bu yerda xato (masalan Telegram
    # tarmog'ida vaqtinchalik uzilish yoki "Conflict: terminated by other getUpdates
    # request" — boshqa nusxa bir vaqtda ishga tushib qolsa) butun jarayonni yiqitib,
    # /verify/* HTTP endpointlarini ham birga o'chirib qo'yardi. Endi xato bo'lsa,
    # log yozib, biroz kutib qayta urinamiz — HTTP server va jarayon tirik qoladi.
    while True:
        try:
            log.info("SMS Habar bot ishga tushdi (polling).")
            await dp.start_polling(bot, handle_signals=False)
            break  # start_polling normal to'xtasa (masalan signal bilan) — chiqamiz
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.error("Polling xatosi: %s — 5 soniyadan keyin qayta urinamiz", e)
            await asyncio.sleep(5)
    await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
