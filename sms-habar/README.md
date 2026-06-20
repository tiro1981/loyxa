# SMS Habar — telefon tasdiqlash (OTP) boti

Sayt ro'yxatdan o'tishida **SMS o'rniga** Telegram orqali telefon raqamini tasdiqlaydigan
**alohida** bot. Asosiy platforma/do'kon botidan (`../bot/bot.py`) butunlay mustaqil —
o'z tokeni va o'z porti bilan ishlaydi.

## Qanday ishlaydi

1. Foydalanuvchi saytda nom/telefon/parol kiritadi → akkaunt **hali yaratilmaydi**.
2. Sayt uni shu botga yo'naltiradi (`t.me/<bot>?start=verify`).
3. Bot **"📱 Telefon yuborish"** tugmasini ko'rsatadi → foydalanuvchi kontaktini yuboradi.
4. Bot **4 xonali kod** yuboradi (10 daqiqa, bir martalik).
5. Foydalanuvchi kodni saytga kiritadi → sayt `POST <BOT_SERVER>/verify/check {phone, code}`.
6. Bot `{"ok": true}` qaytarsa — sayt akkauntni yaratadi.

> Xavfsizlik: saytda kiritilgan telefon Telegram'da yuborilgan raqam bilan **oxirgi 9 raqam
> bo'yicha** solishtiriladi — bu raqam egaligini tasdiqlaydi.

## O'rnatish va ishga tushirish

```bash
cd sms-habar
cp .env.example .env          # .env ichida BOT_TOKEN ni to'ldiring
python3 -m pip install -r requirements.txt
python3 bot.py                # yoki: bash run.sh
```

`@BotFather` → `/newbot` orqali **yangi** bot yarating, tokenni `.env` dagi `BOT_TOKEN` ga yozing.

## HTTP endpointlar

| Metod | Yo'l | Vazifa |
|-------|------|--------|
| `POST` | `/verify/check` | `{phone, code}` ni tekshiradi → `{"ok": bool, "error"?: str}` |
| `GET` | `/` | tiriklik tekshiruvi → `{"ok": true, "service": "sms-habar"}` |

Standart port: **3355** (asosiy bot 3344 da — to'qnashmaydi).

## Saytga ulash (`js/auth.js`)

```js
const BOT_USERNAME = "sizning_sms_bot";              // @ siz, @BotFather bergan username
const BOT_SERVER   = "https://sizning-sms-bot.uz";   // shu bot ishlab turgan HTTPS manzil
```

## Deploy (muhim)

- `BOT_SERVER` **HTTPS** va **internetdan ochiq** bo'lishi shart (mijoz telefoni undan kod tekshiradi).
- `HOST=0.0.0.0` bo'lsin (faqat localhost emas).
- alwaysdata / Render / Railway kabi xizmatlarga joylash mumkin (port `$PORT` muhit o'zgaruvchisidan olinadi).
