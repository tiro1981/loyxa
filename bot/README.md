# BiznesOnline Telegram Bot — Python (aiogram)

Buyurtmalarni Telegram kanaliga yuboruvchi bot. **aiogram v3** asosida yozilgan.

## O'rnatish

1. **BotFather'dan token oling:**
   - Telegram'da [@BotFather](https://t.me/BotFather) ga yozing
   - `/newbot` → bot nomi → username → **token** ni saqlang

2. **Token'ni o'rnating:**
   ```bash
   export BOT_TOKEN="123456:ABC-DEF..."
   ```
   yoki `bot.py` ichida `BOT_TOKEN` ni to'g'ridan-to'g'ri yozing.

3. **Bog'liqliklarni o'rnating va ishga tushiring:**
   ```bash
   cd bot
   python3 -m venv .venv
   source .venv/bin/activate          # Linux/Mac
   # .venv\Scripts\activate           # Windows
   pip install -r requirements.txt
   python3 bot.py
   ```

## Ishlash jarayoni

1. Foydalanuvchi botga `/start` yuboradi
2. Bot **Bot ID** ni so'raydi (admin paneldan nusxalanadi)
3. Bot **kanal username/ID** ni so'raydi (masalan `@mening_kanalim`)
4. Foydalanuvchi botni kanalga **admin** sifatida qo'shadi
5. Bot kanalga "✅ Muvaffaqiyatli ulandi" yuboradi
6. Admin paneldan yangi buyurtma kelganda — bot uni kanalga yuboradi

## HTTP API

Admin panel buyurtmalarni quyidagi endpoint orqali yuboradi:

```
POST http://localhost:3344/orders/BOT-CL001-X7K9P
Content-Type: application/json

{
  "order": {
    "id": "TB-1001",
    "userName": "Sardor",
    "phone": "+998 90 123 45 67",
    "address": "Toshkent, Chilonzor",
    "items": [
      { "name": "Burger", "qty": 2, "price": 35000 }
    ],
    "total": 70000
  }
}
```

## Bot komandalar

- `/start` — Ulanishni boshlash
- `/status` — Joriy ulanish holati
- `/disconnect` — Botni uzish
- `/help` — Yordam

## Texnik xususiyatlar

- **Framework:** aiogram v3 (async)
- **HTTP server:** aiohttp (aiogram bilan birga)
- **Database:** fayl asosida `bot-db.json` (`{ botId: { chatId, channel, ... } }`)
- **State machine:** FSM (Connect.awaiting_id → Connect.awaiting_channel → connected)
- **CORS:** ruxsat berilgan (admin paneldan brauzer fetch'i uchun)
