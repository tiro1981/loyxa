# SMS Habar — yangilanish promti (kod muddati + "Yangi kod olish")

Quyidagi promtni AI yordamchiga (yoki o'zingiz qo'lda bajarish uchun reja sifatida)
bersangiz, ushbu funksiyalarni qaytadan tiklash mumkin.

---

## PROMT

> Menda alohida `sms-habar` Telegram OTP boti (aiogram v3 + aiohttp) va statik veb-sayt
> (`kirish.html` + `js/auth.js`) bor. Sayt ro'yxatdan o'tishida telefon Telegram orqali
> 4 xonali kod bilan tasdiqlanadi. Quyidagi yangilanishlarni kirit:
>
> **Bot (`sms-habar/bot.py`):**
> 1. Kod amal qilish muddatini **2 daqiqa** qil (`CODE_TTL = 120`).
> 2. Foydalanuvchi telefon raqamini yuborgach, kod bilan birga **inline tugma
>    «🔄 Yangi kod olish»** (`callback_data="newcode"`) chiqsin. Tugma bosilganda
>    o'sha chatdagi telefonga yangi kod yuborilsin (chat_id → telefon mosligini xotirada
>    sakla). Buning uchun `CHAT_PHONE` dict va `issue_code()`/`code_text()`/`refresh_kb()`
>    yordamchi funksiyalaridan foydalan.
> 3. Yangi endpoint qo'sh: **`GET /verify/status?phone=...`** →
>    `{"ok":true,"exists":bool,"remaining":int,"ttl":int}` — kodning qolgan amal muddatini
>    (soniyada) qaytaradi. CORS middleware barcha endpointlarga amal qilsin.
>
> **Sayt (`kirish.html` + `js/auth.js`):**
> 4. Tasdiqlash blokida **sanoq taymeri** ko'rinsin (mm:ss). Taymer server bilan sinxron
>    bo'lsin: `/verify/status` har ~3 soniyada so'ralsin, oradagi soniyalar mahalliy 1s
>    sanoq bilan to'ldirilsin. Kod muddati tugaganda qizil holatda
>    «Kod muddati tugadi. Botda «🔄 Yangi kod olish» tugmasini bosing» yozuvi chiqsin.
>    Botda yangi kod olinsa, taymer avtomatik qayta boshlansin.
> 5. Login (**Kirish / Mijoz**) tabiga o'tilganda «Telefonni tasdiqlang» bloki
>    ko'rinmasin — tab almashganda tasdiqlash holatini tozalaydigan `resetVerifyStep()`
>    qo'sh va uni `switchRole()` ichida chaqir.
>
> aiohttp CORS middleware'da `@web.middleware` dekoratori borligiga ishonch hosil qil
> (aks holda har bir HTTP so'rov 500 qaytaradi va sayt ulanolmaydi).

---

## Deploy (o'zgarishlardan keyin)

**Bot — AlwaysData serverida:**
```bash
# Lokal Mac terminalda (server ichida emas!):
cd ~/Desktop/webilova/loyxa
rsync -avz sms-habar/bot.py tiro21@ssh-tiro21.alwaysdata.net:loyxa/sms-habar/bot.py
```
So'ng panel → Web → Saytlar → sms-habar → **Restart**.
(Ixtiyoriy: Environment'da `CODE_TTL=120` qo'ying.)

**Sayt — Render:**
`kirish.html` va `js/auth.js` ni git'ga commit qilib push qiling → Render qayta deploy qiladi.

## Tekshirish
1. `https://tiro21.alwaysdata.net/verify/status?phone=998901234567` → JSON qaytsin.
2. Botga telefon yuboring → kod + «🔄 Yangi kod olish» tugmasi chiqsin.
3. Saytda ro'yxatdan o'ting → taymer 2:00 dan teskari sanasin; 0 da qizil ogohlantirish.
4. Botda «🔄 Yangi kod olish» bosing → saytdagi taymer qayta boshlansin.
5. «Kirish» tabiga o'ting → «Telefonni tasdiqlang» bloki ko'rinmasin.
