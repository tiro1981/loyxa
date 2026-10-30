"""
============================================================
 SMS HABAR — telefon tasdiqlash (OTP) botini ALOHIDA ishga tushirish (lokal sinov uchun).

 Asosiy kod: ../bot/sms_otp.py. Serverda (AlwaysData) bu bot endi asosiy bot
 (bot/bot.py) jarayonida ishlaydi — alohida sms-habar sayti KERAK EMAS va
 ikkalasini bir vaqtda ishga tushirmang (bitta tokenni ikki jarayon tinglab,
 bir-biriga xalaqit beradi).

 ISHLATISH (lokal):
   SMS_BOT_TOKEN=xxx python3 bot.py        # yoki .env ga yozib: bash run.sh
============================================================
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

from aiohttp import web

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "bot"))
# Eski .env'lar BOT_TOKEN nomini ishlatadi — moslik uchun
if not os.getenv("SMS_BOT_TOKEN") and os.getenv("BOT_TOKEN"):
    os.environ["SMS_BOT_TOKEN"] = os.environ["BOT_TOKEN"]

import sms_otp  # noqa: E402

HTTP_HOST = os.getenv("IP") or os.getenv("HOST", "0.0.0.0")
HTTP_PORT = int(os.getenv("PORT", "3355"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sms-habar")


@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        return web.Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "600",
        })
    response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"ok": True, "service": "sms-habar"})


async def main() -> None:
    if not sms_otp.SMS_BOT_TOKEN:
        raise SystemExit("SMS_BOT_TOKEN yo'q. @BotFather tokenini muhit o'zgaruvchisi yoki .env orqali bering.")
    app = web.Application(middlewares=[cors_middleware])
    sms_otp.add_routes(app)
    app.router.add_get("/", handle_health)
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, HTTP_HOST, HTTP_PORT).start()
    log.info("SMS Habar HTTP server: http://%s:%s", HTTP_HOST, HTTP_PORT)
    try:
        await sms_otp.run_polling()
    finally:
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
