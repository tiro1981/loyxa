"""
============================================================
 SMS OTP — telefon tasdiqlash boti moduli (aiogram v3)

 Sayt ro'yxatdan o'tishida telefon raqami SMS o'rniga Telegram orqali tasdiqlanadi:
   1. Foydalanuvchi botga /start yuboradi → "📱 Telefon raqamni yuborish" tugmasi chiqadi.
   2. O'z kontaktini yuboradi → bot 4 xonali kod beradi (CODE_TTL soniya amal qiladi).
   3. Sayt POST /verify/check {phone, code} → {"ok": true/false}.

 Asosiy bot (bot/bot.py) shu modulni O'Z JARAYONIDA ishga tushiradi — bitta jarayon,
 bitta HTTP server. (AlwaysData'da ikki alohida bot jarayoni bir-birini o'chirib
 qo'yayotgan edi.) Token faqat muhit o'zgaruvchisidan: SMS_BOT_TOKEN.
 MUHIM: bitta tokenni faqat BITTA jarayon tinglashi kerak.
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

SMS_BOT_TOKEN = os.getenv("SMS_BOT_TOKEN", "").strip()
CODE_TTL = int(os.getenv("CODE_TTL", "120"))    # kod amal qilish muddati (soniya), 2 daqiqa

log = logging.getLogger("sms-otp")

# normalizatsiya qilingan_telefon -> {"code","chatId","ts"} — bir martalik, CODE_TTL gacha
VERIFY_CODES: dict = {}
# chat_id -> telefon ("🔄 Yangi kod olish" uchun)
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
router = Router(name="sms-otp")


def contact_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Telefon raqamni yuborish", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    """/start — faqat telefon raqamini so'raydi (bot faqat tasdiqlash uchun)."""
    await message.answer(
        "Ro'yxatdan o'tishni tasdiqlash uchun pastdagi tugma bilan "
        "telefon raqamingizni yuboring.",
        reply_markup=contact_kb(),
        parse_mode=None,
    )


@router.message(F.contact)
async def on_contact(message: Message) -> None:
    """Kontakt kelganda 4 xonali tasdiqlash kodini yaratib yuboradi."""
    # Faqat foydalanuvchining O'Z raqami — boshqa odamning kontakt kartasini yuborib,
    # begona raqamni "tasdiqlab" olishning oldini olamiz.
    if not message.from_user or message.contact.user_id != message.from_user.id:
        await message.answer(
            "Faqat o'zingizning raqamingizni pastdagi tugma orqali yuboring.",
            reply_markup=contact_kb(),
            parse_mode=None,
        )
        return
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


@router.message()
async def on_other(message: Message) -> None:
    """Boshqa har qanday xabar — yana telefon so'raymiz."""
    await message.answer(
        "Tasdiqlash kodi olish uchun pastdagi tugma bilan telefon raqamingizni yuboring.",
        reply_markup=contact_kb(),
        parse_mode=None,
    )


# ============ HTTP ============
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


def add_routes(app: web.Application) -> None:
    """Sayt uchun /verify/* endpointlarini mavjud aiohttp ilovaga qo'shadi."""
    app.router.add_post("/verify/check", handle_verify_check)
    app.router.add_get("/verify/status", handle_verify_status)


async def run_polling() -> None:
    """SMS botni polling qiladi. Xato bo'lsa (tarmoq, Conflict) jarayonni yiqitmay qayta urinadi."""
    if not SMS_BOT_TOKEN:
        log.warning("SMS_BOT_TOKEN berilmagan — SMS tasdiqlash boti ishga tushmadi.")
        return
    bot = Bot(SMS_BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)
    asyncio.create_task(cleanup_expired_codes())
    try:
        while True:
            try:
                log.info("📱 SMS OTP bot polling ishga tushdi.")
                await dp.start_polling(bot, handle_signals=False)
                break
            except asyncio.CancelledError:
                raise
            except Exception as e:
                if "conflict" in str(e).lower():
                    log.error("❗ SMS bot tokenini BOSHQA jarayon ham tinglayapti (Telegram Conflict) — "
                              "ikkinchi nusxani (masalan alohida sms-habar saytini) to'xtating.")
                log.error("SMS polling xatosi: %s — 5 soniyadan keyin qayta urinamiz", e)
                await asyncio.sleep(5)
    finally:
        await bot.session.close()
