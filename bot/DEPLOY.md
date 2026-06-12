# AlwaysData ga joylash — qadamba-qadam (SSH, persistent process)

Bot — uzluksiz ishlovchi Telegram polling boti (aiogram v3) + aiohttp HTTP server.
Shuning uchun uni AlwaysData'da **doimiy ishlovchi "User program"** sayti sifatida ishga tushiramiz.

> Quyida `ACCOUNT` o'rniga o'zingizning AlwaysData login'ingizni yozing (masalan `tiro`).
> SSH host: `ssh-ACCOUNT.alwaysdata.net`, foydalanuvchi: `ACCOUNT`.

---

## 1) Fayllarni yuklash (lokal terminalingizdan)

`deploy.sh` ichidagi `ACCOUNT` ni to'g'rilang, so'ng:

```bash
cd ~/Desktop/bot
bash deploy.sh
```

Yoki qo'lda, bitta buyruq bilan:

```bash
cd ~/Desktop/bot
rsync -avz --exclude '.venv/' --exclude '__pycache__/' --exclude '.DS_Store' \
  --exclude '.git/' --exclude '.env' \
  ./ ACCOUNT@ssh-ACCOUNT.alwaysdata.net:bot/
```

(SSH paroli so'raladi — uni **o'zingiz** kiritasiz.)

---

## 2) Serverda virtual muhit va kutubxonalar

SSH bilan kiring va venv quring (serverdagi Python bilan — lokal `.venv` ko'chirilmaydi):

```bash
ssh ACCOUNT@ssh-ACCOUNT.alwaysdata.net

cd ~/bot
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

> AlwaysData bir nechta Python versiyasini beradi. `python3 --version` bilan tekshiring;
> kerak bo'lsa aniq versiya: `python3.11 -m venv .venv`.

Tez sinov (ixtiyoriy — Ctrl+C bilan to'xtating):

```bash
cd ~/bot
BOT_TOKEN="SIZNING_TOKEN" .venv/bin/python bot.py
```

`✅ HTTP server ...` va polling log'lari chiqsa — bot ishlayapti.

---

## 3) Doimiy process qilib qo'yish (admin panel)

AlwaysData admin → **Web → Sites → Add a site** (yoki *Saytlar → Sayt qo'shish*):

| Maydon | Qiymat |
|---|---|
| **Type / Turi** | **User program** (uzoq ishlovchi buyruq) |
| **Command / Buyruq** | `/home/ACCOUNT/bot/.venv/bin/python /home/ACCOUNT/bot/bot.py` |
| **Working directory** | `/home/ACCOUNT/bot` |

Saqlang. AlwaysData jarayonni avtomatik kuzatadi va o'chsa qayta ishga tushiradi.

### Environment o'zgaruvchilari

Xuddi shu sayt sozlamalarida **Environment** bo'limiga qo'shing:

```
BOT_TOKEN = <BotFather token>
ADMIN_IDS = <Telegram ID, masalan 6797754291>   # /broadcast uchun
BROADCAST_DELAY = 0.05
```

> 🔒 **Maslahat:** token'ni kod ichida qoldirmang — bu yerda env orqali bering.

---

## 4) HTTP API kerakmi? (ixtiyoriy)

Bot ichidagi aiohttp server **standart holatda faqat localhost** (`127.0.0.1:3344`) da ishlaydi —
bu admin panel **shu serverda** bo'lsa yetarli.

Agar admin panel/ilova **boshqa joydan** bot API'siga ulanishi kerak bo'lsa:

1. Env'ga qo'shing: `HOST=0.0.0.0` **va** `ADMIN_TOKEN=<kuchli_maxfiy_kalit>`.
2. AlwaysData saytida ko'rsatilgan portga moslang (`PORT` env yoki sayt port sozlamasi).
3. Admin panelda so'rovlarga `X-Admin-Token: <ADMIN_TOKEN>` header qo'shing.

Aks holda bu qadamni o'tkazib yuboring — Telegram qismi internet kerak qilmaydi (polling).

---

## 5) Tekshirish

- Telegramda botingizga `/start` yuboring — javob kelsa, deploy muvaffaqiyatli.
- Loglar: admin panel → sayt → **Logs**, yoki SSH'da `~/bot` ichidagi chiqishni kuzating.

## Yangilash (keyingi safar)

Faqat 1-qadamni qaytaring (`bash deploy.sh`), so'ng admin paneldan saytni **Restart** qiling.
Jonli `*.json` holat fayllari ustidan yozilmaydi.
