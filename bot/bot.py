"""
============================================================
 BiznesOnline — Telegram Bot (aiogram v3)
 Buyurtmalarni do'kon adminlarining Telegram kanaliga yuboradi.

 ISHLATISH:
   1. @BotFather dan yangi bot yarating va TOKEN oling
   2. .env ga BOT_TOKEN=xxx yozing (yoki pastdagi qiymatni o'zgartiring)
   3. python3 -m pip install -r requirements.txt
   4. python3 bot.py

 BOT JARAYONI:
   1. Foydalanuvchi /start yuboradi → bot kutib oladi
   2. Bot Bot ID ni so'raydi (admin paneldan nusxalanadi)
   3. Bot kanal username/ID ni so'raydi
   4. Foydalanuvchi botni kanalga admin qiladi
   5. Bot kanalga "✅ Muvaffaqiyatli ulandi" yuboradi
   6. POST /orders/:botId endpoint orqali admin panel yangi buyurtmani yuboradi
      → bot uni ulangan kanalga yuboradi
============================================================
"""

import asyncio
import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ChatMemberStatus, ParseMode
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import Message
from aiohttp import web

# ============ CONFIG ============
BOT_TOKEN = os.getenv("BOT_TOKEN", "8912161833:AAG_Dd-BEZ6mHpfUUNLotpqtlhtrkmGEyuc")
HTTP_PORT = int(os.getenv("PORT", "3344"))
DB_FILE = Path(__file__).parent / "bot-db.json"

BOT_ID_RE = re.compile(r"^BOT-[A-Z0-9]+-[A-Z0-9]{5}$", re.IGNORECASE)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("bot")


# ============ MINI DB (fayl asosida) ============
# Tuzilishi: { botId: { chatId, channel, connectedAt, status } }
def load_db() -> dict:
    try:
        if not DB_FILE.exists():
            return {}
        return json.loads(DB_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        log.error("load_db error: %s", e)
        return {}


def save_db(db: dict) -> None:
    try:
        DB_FILE.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        log.error("save_db error: %s", e)


def find_by_bot_id(bot_id: str):
    return load_db().get(bot_id)


def find_by_chat_id(chat_id: int):
    for bot_id, cfg in load_db().items():
        if cfg.get("chatId") == chat_id:
            return {"botId": bot_id, **cfg}
    return None


# ============ FSM BOSQICHLARI ============
class Connect(StatesGroup):
    awaiting_id = State()
    awaiting_channel = State()


router = Router()


# ============ /start ============
@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    await state.clear()
    await state.set_state(Connect.awaiting_id)
    name = message.from_user.first_name or "foydalanuvchi"
    await message.answer(
        f"👋 Salom, {name}!\n\n"
        f"Men BiznesOnline buyurtmalar botiman. Sizning do'koningiz uchun yangi "
        f"buyurtmalarni shu yerdan kanalingizga yuboraman.\n\n"
        f"📋 *1-qadam:* Iltimos, admin paneldan olingan *Bot ID* ni yuboring.\n\n"
        f"Misol: `BOT-CL001-X7K9P`",
    )


# ============ /help ============
@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "📚 *Yordam*\n\n"
        "/start — Ulanishni boshlash\n"
        "/status — Joriy ulanish holati\n"
        "/disconnect — Botni uzish\n\n"
        "Muammo bo'lsa: @support"
    )


# ============ /status ============
@router.message(Command("status"))
async def cmd_status(message: Message) -> None:
    me = find_by_chat_id(message.chat.id)
    if not me or me.get("status") != "connected":
        await message.answer("❌ Hozir hech qanday do'konga ulanmagansiz. /start ni bosing.")
        return
    connected_at = datetime.fromisoformat(me["connectedAt"]).strftime("%d.%m.%Y %H:%M")
    await message.answer(
        "✅ *Ulangan*\n\n"
        f"🆔 Bot ID: `{me['botId']}`\n"
        f"📢 Kanal: {me['channel']}\n"
        f"🕐 Ulangan vaqt: {connected_at}"
    )


# ============ /disconnect ============
@router.message(Command("disconnect"))
async def cmd_disconnect(message: Message, state: FSMContext) -> None:
    me = find_by_chat_id(message.chat.id)
    if not me:
        await message.answer("❌ Ulanish topilmadi")
        return
    db = load_db()
    db.pop(me["botId"], None)
    save_db(db)
    await state.clear()
    await message.answer("🔌 Bot uzildi. Yangi buyurtmalar yuborilmaydi.")


# ============ Bot ID qabul qilish ============
@router.message(Connect.awaiting_id, F.text)
async def receive_bot_id(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    if not BOT_ID_RE.match(text):
        await message.answer(
            "❌ Bot ID format noto'g'ri.\n\n"
            "To'g'ri format: `BOT-CL001-X7K9P`\n\n"
            "Admin paneldan to'liq nusxa oling."
        )
        return

    bot_id = text.upper()
    await state.update_data(bot_id=bot_id)
    await state.set_state(Connect.awaiting_channel)

    await message.answer(
        f"✅ Bot ID qabul qilindi: `{bot_id}`\n\n"
        f"📢 *2-qadam:* Endi kanal username yoki ID sini yuboring.\n\n"
        f"Misol: `@mening_kanalim` yoki `-1001234567890`"
    )


# ============ Kanal qabul qilish + admin tekshirish ============
@router.message(Connect.awaiting_channel, F.text)
async def receive_channel(message: Message, state: FSMContext, bot: Bot) -> None:
    channel = (message.text or "").strip()
    if not channel.startswith("@") and not channel.startswith("-"):
        channel = "@" + channel

    data = await state.get_data()
    bot_id = data.get("bot_id")
    if not bot_id:
        await state.clear()
        await message.answer("❌ Sessiya tugagan. /start ni qaytadan bosing.")
        return

    try:
        me = await bot.get_me()
        member = await bot.get_chat_member(channel, me.id)
        if member.status not in (ChatMemberStatus.ADMINISTRATOR, ChatMemberStatus.CREATOR):
            await message.answer(
                f"⚠️ Bot {channel} kanalida *admin emas*.\n\n"
                f"🔧 *3-qadam:* Iltimos, botni kanalingizga *admin* sifatida qo'shing "
                f"(yozish huquqi bilan), so'ng yana shu kanalni yuboring."
            )
            return

        # Hammasi joyida — saqlash
        db = load_db()
        db[bot_id] = {
            "chatId": message.chat.id,
            "channel": channel,
            "connectedAt": datetime.now().isoformat(),
            "status": "connected",
        }
        save_db(db)

        # Foydalanuvchiga tasdiq
        await message.answer(
            "🎉 *Muvaffaqiyatli ulandi!*\n\n"
            f"Bot endi {channel} kanaliga yangi buyurtmalarni avtomatik yuboradi."
        )

        # Kanalga tasdiq habari
        await bot.send_message(
            channel,
            "✅ *BiznesOnline boti muvaffaqiyatli ulandi!*\n\n"
            f"🆔 Do'kon ID: `{bot_id}`\n"
            f"🕐 {datetime.now().strftime('%d.%m.%Y %H:%M')}\n\n"
            f"Endi yangi buyurtmalar avtomatik shu kanalga keladi."
        )

        await state.clear()

    except TelegramAPIError as err:
        log.error("Channel check error: %s", err)
        await message.answer(
            f"❌ Xato: {err.message or 'Kanalga ulana olmadim'}.\n\n"
            f"Tekshiring:\n"
            f"• Kanal username to'g'rimi?\n"
            f"• Bot kanalda admin qilinganmi?\n\n"
            f"Yana kanal username/ID ni yuboring."
        )


# ============ Holat bo'lmagan xabarlar ============
@router.message(F.text)
async def fallback(message: Message, state: FSMContext) -> None:
    current = await state.get_state()
    if current is None:
        await message.answer("Ulanish boshlanmagan. /start ni bosing.")


# ============================================================
# ============ HTTP ENDPOINT: BUYURTMA QABUL QILISH ============
# ============================================================
async def handle_order(request: web.Request) -> web.Response:
    """Admin panel POST /orders/:botId — buyurtmani ulangan kanalga yuboradi."""
    bot_id = request.match_info["bot_id"].upper()
    bot: Bot = request.app["bot"]

    try:
        body = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Invalid JSON"}, status=400)

    order = body.get("order") or {}
    cfg = find_by_bot_id(bot_id)
    if not cfg:
        return web.json_response({"ok": False, "error": "Bot not connected"}, status=404)

    items_lines = [
        f"   • {it.get('name', '')} × {it.get('qty', 0)} = "
        f"{int(it.get('price', 0)) * int(it.get('qty', 0)):,} so'm".replace(",", " ")
        for it in (order.get("items") or [])
    ]
    items_text = "\n".join(items_lines) or "   (bo'sh)"

    total = int(order.get("total") or 0)
    msg = (
        "🔔 *YANGI BUYURTMA*\n\n"
        f"📦 Buyurtma: `{order.get('id', '—')}`\n"
        f"👤 Mijoz: {order.get('userName', 'Anonim')}\n"
        f"📞 Tel: {order.get('phone', '—')}\n"
        f"📍 Manzil: {order.get('address', '—')}\n\n"
        f"🛒 Mahsulotlar:\n{items_text}\n\n"
        f"💰 *Jami: {total:,} so'm*".replace(",", " ")
    )

    try:
        await bot.send_message(cfg["channel"], msg)
        return web.json_response({"ok": True})
    except TelegramAPIError as err:
        log.error("send to channel error: %s", err)
        return web.json_response({"ok": False, "error": str(err)}, status=500)


@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        return web.Response(
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )
    response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


def build_http_app(bot: Bot) -> web.Application:
    app = web.Application(middlewares=[cors_middleware])
    app["bot"] = bot
    app.router.add_post(r"/orders/{bot_id:BOT-[A-Z0-9]+-[A-Z0-9]{5}}", handle_order)
    app.router.add_options(r"/orders/{bot_id:.*}", lambda r: web.Response(status=204))
    return app


# ============ MAIN ============
async def main() -> None:
    if BOT_TOKEN.startswith("PUT_YOUR"):
        raise SystemExit("❌ BOT_TOKEN o'rnatilmagan. Avval BotFather'dan token oling.")

    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN))
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)

    # HTTP server (admin panel orderlari uchun)
    app = build_http_app(bot)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", HTTP_PORT)
    await site.start()
    log.info("✅ HTTP endpoint: http://localhost:%s/orders/:botId", HTTP_PORT)
    log.info("✅ Telegram bot polling rejimida ishga tushdi")

    try:
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit) as e:
        log.info("Bot to'xtatildi: %s", e)
