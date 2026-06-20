# SMS Habar boti — AlwaysData ga joylash (qadam-baqadam)

Bu bot uzluksiz ishlovchi Telegram polling boti + aiohttp HTTP server (`/verify/check`).
AlwaysData'da **alohida "User program" sayt** sifatida ishga tushiramiz (asosiy `bot/` dan mustaqil).

> `ACCOUNT` o'rniga AlwaysData login'ingizni yozing (masalan `tiro`).
> SSH: `ssh ACCOUNT@ssh-ACCOUNT.alwaysdata.net`

---

## 0) ⚠️ AVVAL — token xavfsizligi (muhim)

Hozir bot token'i `sms-habar/bot.py` (41-qator) va `.env.example` ichida **ochiq** yozilgan.
Bu fayllar GitHub'ga tushsa, token oshkor bo'ladi. Shuning uchun:

1. `@BotFather` → `/mybots` → shu bot → **API Token → Revoke current token** (yangi token oling),
   yoki hozirgi tokenni faqat o'zingizda saqlang.
2. `bot.py` dagi standart qiymatni placeholder qiling:
   ```python
   BOT_TOKEN = os.getenv("BOT_TOKEN", "PUT_YOUR_TOKEN")
   ```
3. `.env.example` dagi tokenni ham placeholder bilan almashtiring (haqiqiy token faqat `.env` da bo'lsin — u `.gitignore` da).
4. Haqiqiy token AlwaysData'da **Environment** orqali beriladi (pastda 3-qadam).

---

## 1) Fayllarni serverga yuklash (lokal terminalda)

```bash
cd ~/Desktop/webilova/loyxa
rsync -avz --exclude '.venv/' --exclude '__pycache__/' --exclude '.DS_Store' \
  --exclude '.git/' --exclude '.env' \
  sms-habar/ ACCOUNT@ssh-ACCOUNT.alwaysdata.net:sms-habar/
```

(SSH parolini o'zingiz kiritasiz.)

## 2) Serverda venv + kutubxonalar

```bash
ssh ACCOUNT@ssh-ACCOUNT.alwaysdata.net

cd ~/sms-habar
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Tez sinov (Ctrl+C bilan to'xtating):
```bash
BOT_TOKEN="SIZNING_TOKEN" HOST=0.0.0.0 PORT=3355 .venv/bin/python bot.py
```
`SMS Habar HTTP server: http://0.0.0.0:3355` va polling log'i chiqsa — ishlayapti.

## 3) Doimiy process — AlwaysData panel

[admin.alwaysdata.com](https://admin.alwaysdata.com) → **Web → Sites → Add a site**:

| Maydon | Qiymat |
|---|---|
| **Type** | **User program** |
| **Command** | `/home/ACCOUNT/sms-habar/.venv/bin/python /home/ACCOUNT/sms-habar/bot.py` |
| **Working directory** | `/home/ACCOUNT/sms-habar` |
| **Addresses (domen)** | yangi subdomen qo'shing, masalan `sms.ACCOUNT.alwaysdata.net` |

> AlwaysData "User program" saytga **PORT** muhit o'zgaruvchisini avtomatik beradi va shu
> portga HTTPS'ni yo'naltiradi. Bot `PORT` ni env'dan o'qiydi — shuning uchun qo'lда port
> belgilash shart emas, faqat `HOST=0.0.0.0` bo'lsin.

### Environment (shu sayt sozlamalarида)
```
BOT_TOKEN = <BotFather token>
HOST      = 0.0.0.0
CODE_TTL  = 600
```
Saqlang → AlwaysData jarayonni ishga tushiradi va o'chsa qayta yoqadi.

## 4) Tekshirish

1. Brauzerда saytingizni oching:
   `https://sms.ACCOUNT.alwaysdata.net/`
   → `{"ok": true, "service": "sms-habar"}` chiqsin.
2. Telegram'da botga `/start` yuboring — javob kelsin.
3. Bu manzil — sizning **BOT_SERVER**ingiz.

## 5) Saytga ulash (`js/auth.js`)

```js
const BOT_USERNAME = "sizning_sms_bot";                    // @BotFather bergan username (@ siz)
const BOT_SERVER   = "https://sms.ACCOUNT.alwaysdata.net"; // 4-qadamdagi URL (oxirida / yo'q)
```

Saytni (Render) qayta deploy qiling.

## Yangilash (keyingi safar)
1-qadamni qaytaring (rsync), so'ng AlwaysData panelда saytni **Restart** qiling.

---

## Tez-tez uchraydigan muammolar
- **`/` ochilmayapti / 502:** sayt "User program" emas yoki `HOST=0.0.0.0` qo'yilmagan;
  yoki Command'dagi yo'l noto'g'ri. Loglarni ko'ring (panel → sayt → Logs).
- **Bot javob bermaydi:** `BOT_TOKEN` env noto'g'ri yoki bot boshqa joyда ham polling qilyapti
  (bir token bir joyда polling qilsin).
- **Sayt `/verify/check` ga ulanmayapti:** BOT_SERVER HTTPS va to'g'ri subdomen ekanini tekshiring;
  CORS bot kodида yoqilgan bo'lsin (so'rov boshqa domendan keladi).
