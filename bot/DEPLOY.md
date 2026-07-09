# AlwaysData ga joylash — qadamba-qadam (SSH, persistent process)

Bot — uzluksiz ishlovchi Telegram polling boti (aiogram v3) + aiohttp HTTP server.
Shuning uchun uni AlwaysData'da **doimiy ishlovchi "User program"** sayti sifatida ishga tushiramiz.

> Quyida `ACCOUNT` o'rniga o'zingizning AlwaysData login'ingizni yozing — **joriy akkaunt: `tiro21`**
> (eski `tiro19` akkaunt o'chirilgan, shu sabab bot serveriga ulanib bo'lmayotgan edi).
> SSH host: `ssh-tiro21.alwaysdata.net`, foydalanuvchi: `tiro21`.
>
> ⚠️ **Muhim:** `tiro21` akkauntida allaqachon `sms-habar` boti sayt sifatida ishlab turibdi va
> asosiy domenni (`https://tiro21.alwaysdata.net/`) egallab turibdi. Shu bot uchun **3-qadamda**
> yangi sayt yaratayotganda unga **alohida path yoki subdomen** bering (masalan sayt sozlamasida
> "Path" maydoniga `/store-bot` yozing, yoki AlwaysData "Domains" bo'limidan qo'shimcha subdomen
> so'rang) — aks holda ikkala bot bir-birining ustiga yozilib qoladi.

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

## 4) HTTP API — do'kon botlari ("Bot server manzili") uchun MAJBURIY

Bot ichidagi aiohttp server **standart holatda faqat localhost** (`127.0.0.1:3344`) da ishlaydi.
Buyurtma boti (yagona `/orders/:botId` oqimi) uchun shu yetarli — lekin **do'kon egalari admin
paneldan token ulaydigan "Do'kon boti" funksiyasi** (`/store-bot/connect` va h.k.) ishlashi uchun
bu server **internetdan ochiq HTTPS manzilda** turishi SHART, chunki admin panel (brauzer) unga
to'g'ridan-to'g'ri so'rov yuboradi.

1. Env'ga qo'shing: `HOST=0.0.0.0` **va** `ADMIN_TOKEN=<kuchli_maxfiy_kalit>`.
2. AlwaysData saytida ko'rsatilgan portga moslang (`PORT` env yoki sayt port sozlamasi).
3. Admin panelda so'rovlarga `X-Admin-Token: <ADMIN_TOKEN>` header qo'shing (broadcast endpointi uchun).
4. AlwaysData reverse-proxy odatda 443/HTTPS'ni o'zi ta'minlaydi — sayt sozlamasidan chiqqan
   HTTPS manzilni (masalan `https://tiro21.alwaysdata.net/store-bot` yoki alohida subdomen)
   **aniqlab oling**.
5. Shu manzilni har bir ilovaning admin paneli → **Telegram Bot → "1. Bot server manzili"**
   bo'limiga bir marta kiritib saqlang (Cloud orqali barcha qurilmalarga sinxronlashadi) —
   shundan keyingina "Botni ulash" ishlaydi.

Faqat buyurtma boti (`/orders/:botId`, eski oqim) kerak bo'lsa, bu qadamni o'tkazib yuborish mumkin.

---

## 5) Tekshirish

- Telegramda botingizga `/start` yuboring — javob kelsa, deploy muvaffaqiyatli.
- Loglar: admin panel → sayt → **Logs**, yoki SSH'da `~/bot` ichidagi chiqishni kuzating.

## Yangilash (keyingi safar)

Faqat 1-qadamni qaytaring (`bash deploy.sh`), so'ng admin paneldan saytni **Restart** qiling.
Jonli `*.json` holat fayllari ustidan yozilmaydi.
