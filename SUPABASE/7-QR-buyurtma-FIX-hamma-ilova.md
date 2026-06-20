# PROMPT — QR buyurtma kanalga bormaydi: HAMMA ILOVA uchun universal tuzatish

> Repoga ulangan AI'ga bering. Bu 5 ilovaning HAMMASIga taalluqli (ovqat ham, qolgani ham).
> Avval pastdagi `[BOT_SERVER_URL]` ni o'zingizning HAQIQIY bot server manzilingiz bilan
> almashtiring (masalan Render'dagi: https://loyxa-bot.onrender.com).

---

MUAMMO: QR skaner qilib (mijoz qurilmasi, `?client=...`) berilgan buyurtma Telegram
kanalga bormaydi; lekin do'kon egasi o'z brauzerida bersa — boradi.

SABAB (5 ilovada ham BIR XIL): bot server manzilini topadigan kod oxirida default
`http://localhost:3344` turibdi. Ega brauzerida `localStorage.bo_bot_api` bor → ishlaydi.
Mijoz qurilmasida u yo'q → `localhost:3344` ga tushadi → mijoz telefonida localhost yo'q
→ buyurtma jimgina yuborilmaydi.

UNIVERSAL YECHIM: har ilovada `localhost:3344` defaultini HAQIQIY HTTPS bot manzili bilan
almashtir. Shunda mijoz qurilmasi ham to'g'ri serverga yuboradi. (Ega o'rnatgan
`bo_bot_api` localStorage qiymati baribir ustun turadi — moslamalar buzilmaydi.)

ALMASHTIRILADIGAN QIYMAT (hamma joyda):
    ESKI:   'http://localhost:3344'
    YANGI:  '[BOT_SERVER_URL]'        // masalan: 'https://loyxa-bot.onrender.com'

QUYIDAGI FAYL VA QATORLARDA (har ilovada bot manzili shu yerda aniqlanadi):

1) ovqat-dokoni/telegram.js        — `apiBase()` ichidagi default (taxminan 22-qator)
2) salqin-ichimliklar/telegram.js  — bot manzili defaulti (taxminan 8-qator)
3) kitob-dokoni/script.js          — taxminan 151-qator (storefront yuborish)
   kitob-dokoni/admin.js           — `getBotApi()` (taxminan 1316-qator)
4) kiyim-dokoni/script.js          — taxminan 148-qator
   kiyim-dokoni/admin.js           — `getBotApi()` (taxminan 1371-qator)
5) app/script.js                   — taxminan 501-qator
   app/admin.js                    — `getBotApi()` (taxminan 953-qator)

KO'RSATMA AI'GA:
- Har bir faylda `'http://localhost:3344'` (yoki `http://localhost:3344` ko'rinishidagi)
  default qiymatni top va `'[BOT_SERVER_URL]'` ga almashtir.
- `bo_bot_api` / `Cloud.get('bot_api')` / `getBotApi()` mantig'ining QOLGAN qismiga TEGMA —
  faqat eng oxirgi fallback (localhost) ni o'zgartir.
- Ixtiyoriy, lekin tavsiya: agar `location.hostname` localhost/127/192.168 bo'lsa
  `http://localhost:3344` qoldir (lokal test uchun), aks holda `[BOT_SERVER_URL]`:
      const FALLBACK = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)
        ? 'http://localhost:3344' : '[BOT_SERVER_URL]';

TEKSHIRUV (har ilova uchun):
1. Deploy qiling.
2. Boshqa qurilmada QR (`?client=...`) → buyurtma bering.
3. Telegram kanalga buyurtma kelsin ✅.
4. Kelmasa — mijoz qurilmasida F12 → Console → bot manzili va xato ko'rinadi.

---

## Muhim shartlar
- `[BOT_SERVER_URL]` **HTTPS** va internetdan ochiq bo'lishi shart (bot/bot.py shu manzilда ishlab tursin).
- Har do'kon egasi o'z botini admin paneldan token bilan ulagan bo'lishi kerak
  (bot manzili to'g'ri bo'lsa ham, do'kon boti ulanmagan bo'lsa kanal yo'q).

## Eng to'liq variant (ovqat — Cloud'ga ko'chirilgan ilova uchun)
ovqat-dokoni Cloud'da bo'lgani uchun, unга `SUPABASE/6-...FIX.md` dagi to'liqroq yechim
(bot manzilini admin paneldan o'zgartirib, Cloud orqali barcha qurilmaga sinxronlash)
mos keladi. Qolgan 4 ilova Cloud'ga ko'chirilgach (`2-`, `3-`, `4-` promptlar), ularга
ham xuddi shu Cloud-sinxron yondashuvini qo'llasa bo'ladi. Hozircha yuqoridagi universal
default-almashtirish 5 ilovaning hammasini darrov tuzatadi.
