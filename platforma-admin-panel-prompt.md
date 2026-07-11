# Prompt — Platforma admin panelini tuzatish va yaxshilash

Quyidagi promptni Claude'ga (Claude Code yoki shu loyihaga ulangan Claude sessiyasiga) to'liq nusxalab bering.

---

## PROMPT MATNI (shu joydan pastini nusxalang)

Men BiznesOnline nomli SaaS platformasi ustida ishlayapman. Loyihada ikkita **alohida** admin panel bor — bir-biriga ALOQASI YO'Q, ikkalasini aralashtirmang:

1. **Platforma admin paneli** (biz ishlaydigan panel) — `admin.html`, `js/admin.js`, `css/admin.css`. Bu — sayt egasi uchun panel: mijozlarni (biznes egalarini), ilovalar katalogini, to'lovlarni, daromadni, Telegram botni boshqaradi.
2. **Ilova admin paneli** — `fast-food-dokoni/admin.html`, `ovqat-dokoni/admin/`, `kiyim-dokoni/admin.html`, `kitob-dokoni/admin.html`. Bu har bir mijozning o'z do'koni ichidagi panel (mahsulot/buyurtma boshqaruvi).

**Faqat 1-band — platforma admin paneli (`admin.html`, `js/admin.js`, `css/admin.css`, va bog'liq `kirish.html`, `dashboard.html`) ustida ishlang. Ilova admin panellariga (2-band) tegmang.**

### Hozirgi holat va topilgan muammolar

Platforma admin paneli hozircha to'liq `localStorage` asosida ishlaydi (demo rejim), quyidagi muammolar bor:

1. **Xavfsizlik teshigi:** `js/admin.js`da sessiya tekshiruvi o'chirib qo'yilgan (kod ichida "Realda: window.location.href = 'kirish.html'" izohi bor, lekin ishlamaydi). Hozir hech kim login qilmasdan `admin.html`ga kira oladi.
2. **Parollar ochiq matn holida:** Admin login/parol (`tiro/tiro2004`) va mijoz parollari `localStorage`da va JS kodida oddiy matn ko'rinishida saqlanadi/tahrirlanadi (`editPassword` maydoni).
3. **Haqiqiy backend yo'q:** Mijozlar, ilovalar, to'lovlar, xabarlar — hammasi faqat `localStorage`da, ya'ni faqat bitta brauzerda ishlaydi, boshqa qurilmadan ko'rinmaydi va brauzer keshi tozalansa butunlay yo'qoladi. Loyihada `SUPABASE/` papkasida boshqa modullar uchun Supabase sozlamalari bor — platforma panelini ham shu Supabase'ga ulash kerak.
4. **"To'lovlar" bo'limi soxta:** Haqiqiy to'lov tizimi (Payme/Click) integratsiyasi yo'q — faqat "active" statusdagi mijoz avtomatik "To'langan" deb ko'rsatiladi. To'lov tarixi, muddati o'tgan to'lovlar, keyingi to'lov sanasi kuzatilmaydi.
5. **Ilova logotiplari** `localStorage`da base64 rasm sifatida saqlanadi — katta rasmlarda brauzerni sekinlashtiradi va xotira chegarasiga tez yetadi.
6. **Mijozlar/to'lovlar jadvali** sahifalash (pagination) va real filtrlashsiz — mijozlar soni ko'paysa ishlash sekinlashadi (hozir faqat oddiy client-side qidiruv bor).
7. **Tasdiqlash oqimi yo'q:** kod ichida `pending`/`rejected` statuslar mavjud, lekin yangi ro'yxatdan o'tgan mijozni ko'rib chiqish/tasdiqlash/rad etish uchun admin panelda hech qanday ekran yo'q.
8. **Bitta admin, rol yo'q:** faqat bitta bosh administrator hisobi bor, moderator/cheklangan huquqli xodim qo'shib bo'lmaydi, va kim nima o'zgartirgani haqida hech qanday jurnal (audit log) yuritilmaydi.

### Bajarilishi kerak bo'lgan ishlar (ustuvorlik tartibida)

**1-bosqich — Xavfsizlik (birinchi navbatda, boshqa hech narsadan oldin):**
- `js/admin.js`dagi sessiya tekshiruvini yoqing — sessiya yo'q yoki `type !== 'admin'` bo'lsa, foydalanuvchini `kirish.html`ga yo'naltiring.
- Admin va mijoz parollarini ochiq matn holida saqlashni to'xtating. Iloji bo'lsa, real autentifikatsiyani Supabase Auth orqali qiling (yoki kamida parollarni hash'lab saqlang, front-endda ko'rsatmang).
- "Parolni tahrirlash" maydonini "parolni tiklash havolasi yuborish" mantig'iga almashtiring (agar backend imkon bersa).

**2-bosqich — Backendga o'tkazish:**
- Mijozlar (`bo_subscriptions`), ilovalar (`bo_apps`), xabarlar (`bo_messages`), sayt sozlamalari (`bo_site_settings`) uchun Supabase jadvallari yarating (yoki mavjud SUPABASE sozlamalaridan foydalaning).
- `js/admin.js`dagi barcha `localStorage.getItem/setItem` chaqiruvlarini mos Supabase so'rovlariga almashtiring, lekin funksional xatti-harakatni (render funksiyalari, modal oqimi) saqlab qoling.
- Ilova logotiplarini base64 o'rniga Supabase Storage'ga yuklaydigan qilib o'zgartiring.

**3-bosqich — To'lov va obuna boshqaruvi:**
- Har bir mijoz uchun "keyingi to'lov sanasi" maydonini qo'shing, muddati yaqinlashganda yoki o'tib ketganda vizual ogohlantirish (masalan, qizil belgi) ko'rsating.
- To'lovlar bo'limiga real to'lov tarixi jadvalini qo'shing (sana, summa, holat: to'langan/kutilmoqda/muvaffaqiyatsiz), soxta "har doim to'langan" mantig'ini olib tashlang.
- Imkon bo'lsa, Payme yoki Click to'lov integratsiyasi uchun joy tayyorlab qo'ying (hech bo'lmasa to'lov yaratish/holatini yangilash uchun backend endpoint/struktura).

**4-bosqich — Mijozlarni boshqarish oqimi:**
- "Kutilayotgan mijozlar" (pending) uchun alohida ro'yxat/bo'lim qo'shing — admin ariza tafsilotlarini ko'rib, "Tasdiqlash" yoki "Rad etish" tugmalari bilan ishlashi kerak.
- Mijozlar va to'lovlar jadvaliga sahifalash (pagination) va server tomonlama qidiruv/filtr qo'shing.

**5-bosqich (ixtiyoriy, vaqt qolsa):**
- Rol asosidagi kirish: bosh admin + cheklangan huquqli moderator hisoblari.
- Amallar jurnali (audit log): kim, qachon, nimani o'zgartirgani.
- Bir nechta Telegram bot bo'lsa (`bot/`, `ovqat-dokoni/bot/` va h.k.), Bot bo'limida qaysi botni ko'rish/broadcast qilish tanlovini qo'shing.

### Texnik cheklovlar

- Ilova admin panellariga (`fast-food-dokoni/`, `ovqat-dokoni/admin`, `kiyim-dokoni/admin.html`, `kitob-dokoni/admin.html`) va ularning JS/CSS fayllariga tegmang.
- Mavjud UI dizayni, sinflar nomlari va umumiy sahifa strukturasini iloji boricha saqlang — faqat ma'lumot manbai va xavfsizlik mantig'ini o'zgartiring.
- Har bir bosqichdan keyin admin panelni brauzerda ochib, asosiy oqimlarni (login, mijoz qo'shish/tahrirlash, ilova qo'shish, to'lovlarni ko'rish) qo'lda tekshiring va natijani menga qisqacha yozing.
- Katta o'zgarishlarni bittada emas, bosqichma-bosqich (yuqoridagi tartibda) kiriting, har bosqichdan keyin to'xtab tasdiq so'rang.

---

Promptni xohlasangiz to'liq yoki faqat kerakli bosqichini (masalan, faqat "1-bosqich — Xavfsizlik") ajratib berishingiz mumkin.
