# Salqin Telegram Bot

Salqin ichimliklar do'koni uchun **Python (Flask)** asosidagi Telegram bot serveri.
Frontend (web ilova) shu serverga buyurtma yuboradi, server esa kanalga **chek rasmi va to'liq ma'lumot** yuboradi.

## 🧱 Arxitektura

```
┌───────────────┐    POST /api/order    ┌─────────────┐   Bot API    ┌──────────────┐
│  Web ilova    │ ───────────────────►  │ Python bot  │ ───────────► │  Telegram    │
│ (index.html)  │ ◄─────────────────── │  (Flask)    │              │   kanal      │
└───────────────┘   { ok: true, id }    └─────────────┘              └──────────────┘
                                              │
                                              ├── Pillow bilan chek PNG yaratadi
                                              ├── HTML caption tayyorlaydi
                                              └── sendPhoto → kanalga yuboradi
```

Bot tokeni **faqat server tomonida** (`.env` faylida) saqlanadi — frontendda ko'rinmaydi.

## 📋 Talablar

- Python **3.9+**
- pip
- Telegram bot token (@BotFather)
- Telegram kanal (bot admin sifatida qo'shilgan)

## 🚀 O'rnatish

### 1. Bot yaratish

1. Telegramda **@BotFather** ga `/newbot` yuboring
2. Bot uchun nom va `@username` tanlang
3. Token sizga beriladi — uni saqlang (`123456789:AAH...`)

### 2. Kanal sozlash

1. Yangi Telegram **kanal** yarating (yopiq yoki ochiq farq qilmaydi)
2. Kanal sozlamalari → **Administrators** → Add Administrator
3. Botingizni qidirib qo'shing va **Post Messages** ruxsatini bering
4. Kanal username (`@yourchannel`) yoki ID (`-1001234567890`) ni saqlang

### 3. Loyihani sozlash

```bash
cd bot
cp .env.example .env
```

`.env` faylini ochib to'ldiring:

```env
BOT_TOKEN=123456789:AAH-yourTokenHere
CHANNEL_ID=@yourchannel
PORT=5000
DEBUG=1
```

### 4. Ishga tushirish

**Tezkor usul (macOS/Linux):**

```bash
./run.sh
```

Yoki qo'lda:

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Server ishga tushganda quyidagicha ko'rinishi kerak:

```
2026-05-17 14:30:00 [INFO] 🤖 Bot: @salqin_bot ulandi
2026-05-17 14:30:00 [INFO] 🚀 Server: http://0.0.0.0:5000
```

## 🔌 API endpointlari

### `GET /api/health`

Bot ulanishini tekshirish:

```bash
curl http://localhost:5000/api/health
```

```json
{
  "ok": true,
  "bot": { "username": "salqin_bot", "first_name": "Salqin" },
  "channel": "@yourchannel"
}
```

### `POST /api/order`

Yangi buyurtma — chek rasmi va caption kanalga yuboriladi.

```bash
curl -X POST http://localhost:5000/api/order \
  -H "Content-Type: application/json" \
  -d '{
    "id": "abc12345",
    "name": "Akmal Karimov",
    "phone": "+998901234567",
    "address": "Toshkent, Chilonzor 5/12",
    "payment": "karta",
    "paymentMeta": { "cardLast4": "1234" },
    "items": [
      { "name": "Coca-Cola 1L", "qty": 2, "price": 14000, "discount": 10, "finalPrice": 12600 }
    ],
    "total": 25200,
    "createdAt": 1715942400000
  }'
```

### `POST /api/status`

Buyurtma statusi o'zgarganda kanalga matnli xabar:

```bash
curl -X POST http://localhost:5000/api/status \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "abc12345",
    "status": "yetkazilmoqda",
    "name": "Akmal Karimov",
    "phone": "+998901234567"
  }'
```

## 🌐 Frontend bilan ulash

Web ilova (`index.html`, `script.js`) `telegram.js` orqali shu serverga murojaat qiladi.
Standart API URL: `http://localhost:5000`.

Boshqa serverga ulash uchun brauzer konsolida:

```js
localStorage.setItem('si_api_url', 'https://your-server.com');
location.reload();
```

## 🚢 Production deploy

### Variant 1: Render / Railway / Fly.io

`requirements.txt` mavjud, ishga tushirish komandasi `python app.py`.

### Variant 2: VPS + systemd + gunicorn

```bash
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

`/etc/systemd/system/salqin-bot.service`:

```ini
[Unit]
Description=Salqin Telegram Bot
After=network.target

[Service]
WorkingDirectory=/opt/salqin/bot
Environment="PATH=/opt/salqin/bot/venv/bin"
EnvironmentFile=/opt/salqin/bot/.env
ExecStart=/opt/salqin/bot/venv/bin/gunicorn -w 2 -b 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now salqin-bot
```

### CORS

Production'da `.env` da `CORS_ORIGIN` ni aniq URL ga sozlang:

```env
CORS_ORIGIN=https://salqin.uz
```

## 🐛 Muammolarni hal qilish

| Muammo | Yechim |
|---|---|
| `400 Bad Request: chat not found` | Bot kanalga admin sifatida qo'shilmagan |
| `401 Unauthorized` | Bot tokeni noto'g'ri yoki bekor qilingan |
| `Forbidden: bot is not a member` | Bot kanalga admin sifatida qo'shilishi kerak |
| Chek shrifti g'alati ko'rinadi | Tizimda DejaVu yoki Arial fontlari yo'q; `apt install fonts-dejavu` (Linux) |
| CORS xatosi (browser console) | `.env` da `CORS_ORIGIN=*` yoki frontend origin'ini ko'rsating |

## 📁 Fayllar

```
bot/
├── app.py            — Flask server, route handler'lar
├── bot.py            — Telegram Bot API bilan ishlash
├── receipt.py        — Pillow bilan chek PNG rasmi
├── config.py         — .env dan sozlamalar
├── requirements.txt  — pip kutubxonalari
├── .env.example      — sozlamalar shabloni
├── run.sh            — tezkor ishga tushirish
└── README.md         — bu fayl
```

## 📝 Litsenziya

Salqin loyihasi · Ichki foydalanish uchun.
