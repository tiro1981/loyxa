# Prompt — BiznesOnline qo'nish sahifasi (index.html) dizaynini yangilash

Quyidagi promptni Claude'ga (yoki shu loyihaga ulangan boshqa AI sessiyasiga) to'liq nusxalab bering.

---

## PROMPT MATNI (shu joydan pastini nusxalang)

Men **BiznesOnline** nomli SaaS platformasi ustida ishlayapman va uning qo'nish (landing) sahifasi — `index.html` + `css/style.css` — dizaynini yangilamoqchiman. Funksionallikka tegmasdan, faqat vizual dizaynni qayta ishlang.

### 1. Platforma nima va qanday ishlaydi

BiznesOnline — O'zbekistondagi kichik biznes egalari (do'kon, fast food, kafe, kitob do'koni, kiyim do'koni egalari) uchun **bepul, tayyor veb-ilova** beruvchi SaaS platforma. Ishlash mantig'i:

1. Mijoz (biznes egasi) qo'nish sahifasiga kiradi, 4 ta tayyor ilova turidan birini tanlaydi.
2. `kirish.html?tab=register` orqali **bepul ro'yxatdan o'tadi** (biznes nomi, telefon, manzil).
3. Ro'yxatdan o'tgach `dashboard.html`ga yo'naltiriladi — bu yerda o'ziga biriktirilgan ilovani (demo/admin linklarini) ko'radi va boshqaradi.
4. Har bir ilova o'zining mustaqil admin paneliga ega (mahsulot qo'shish, buyurtmalarni ko'rish, mijozlar bilan chat, Telegram bot orqali xabar yuborish, QR-kod menyu generatsiya qilish).
5. Platforma egasi (men) uchun alohida **platforma admin paneli** (`admin.html`) bor — u yerda barcha mijozlar, ilovalar katalogi, to'lovlar va statistika boshqariladi.

### 2. Haqiqatda mavjud 4 ta tayyor ilova (qo'nish sahifasida shular reklama qilinishi kerak)

- **Fast Food Ilovasi** (`fast-food-dokoni/`) — restoran/fast-food uchun onlayn menyu, buyurtma tizimi, yetkazib berish, QR-kod menyu, alohida boshqaruv dashbordi.
- **Kiyim Do'koni** (`kiyim-dokoni/`) — moda/kiyim uchun katalog, o'lcham tanlash, savat, kuponlar, Telegram bot, admin panel.
- **Ovqat Dokoni** (`ovqat-dokoni/`) — oziq-ovqat va yetkazib berish uchun katalog, savat, Telegram bot, QR-kod menyu, moliya hisobotlari.
- **Bookz — Kitob Do'koni** (`kitob-dokoni/`) — onlayn kitob do'koni, muallif/janr bo'yicha katalog, savat, admin panel.

Bu ilovalarning har biri **haqiqatda ishlaydi** (demo sifatida ochib ko'rish mumkin) — qo'nish sahifasidagi "Ilovalar" bo'limi shu 4 tasini haqiqiy demo linklari bilan ko'rsatadi (`js/main.js` ichida `seedDefaultApps()` orqali dinamik render qilinadi, admin panelidan boshqariladi — statik matn emas).

### 3. Hozirgi qo'nish sahifasi tuzilishi (mazmun sifatida saqlanishi kerak bo'lgan bo'limlar)

1. **Navbar** — logo, menyu (Bosh sahifa/Ilovalar/Qanday ishlaydi/Sharhlar/Bog'lanish), Kirish/Ro'yxatdan o'tish tugmalari, sozlamalar (til/tema) tugmasi.
2. **Hero** — asosiy sarlavha ("Biznesingizni Online ga oling — Bepul va bir necha daqiqada"), CTA tugmalari, ishonch belgisi (200+ biznes, 4.9/5 reyting), o'ng tomonda jonli dashboard-uslubidagi vizual karta (buyurtma/sharh/daromad misoli).
3. **Statistika paneli** — faol bizneslar soni, ilova turlari soni, uptime %, 24/7 yordam.
4. **Ilovalar bo'limi** — 4 ta ilova kartasi (dinamik, `#appsGrid`), har birida narx, xususiyatlar ro'yxati, demo/admin ko'rish tugmalari.
5. **"Qanday ishlaydi"** — 3 qadam: ilovani tanlash → ma'lumot kiritish → online bo'lish.
6. **Sharhlar** — 3 ta mijoz sharhi (ism, biznes nomi, matn, reyting).
7. **CTA bo'limi** — yakuniy chaqiruv + telefon raqami.
8. **Footer** — logo, ijtimoiy tarmoqlar, sahifalar, aloqa ma'lumotlari.
9. **Ilova tafsiloti modali** (`#appDetailModal`) — kartaga bosilganda ochiladigan popup.

Ushbu bo'limlarning **barchasi platforma uchun ma'noli va kerakli** — hech birini olib tashlamang (mazmuni bir xil qolishi mumkin, faqat vizual taqdimoti o'zgarsin). Xohlasangiz, bo'limlar ichidagi joylashuvni (masalan, statistika joyini) o'zgartirishingiz mumkin, lekin barcha ma'lumot saqlanishi kerak.

### 4. Vizual yo'nalish

Aniq bir uslub tanlashni menga qoldirdingiz — platforma tabiatidan kelib chiqib, quyidagi yo'nalishni tavsiya qilaman va shu asosda ishlang:

**Zamonaviy-minimal SaaS dizayn** (Stripe/Linear uslubiga yaqin), lekin O'zbekiston kichik biznes auditoriyasiga mos yumshoqlik bilan:
- Auditoriya **texnik bo'lmagan** kichik do'kon/restoran egalari — dizayn **ishonchli, tushunarli va oddiy** bo'lishi kerak, ortiqcha murakkab animatsiya yoki "startup hype" emas.
- Asosiy maqsad — **konversiya** (ro'yxatdan o'tish tugmasini bosish). Hero va CTA bo'limlari eng kuchli vizual urg'uga ega bo'lsin.
- Joriy brend rangi — yashil `#16A34A` (ishonch, "pul/o'sish" assotsiatsiyasi, platforma ichidagi barcha 4 ilova va admin panelda ham asosiy rang sifatida ishlatiladi) va amber `#F59E0B` urg'u rangi sifatida — **shu ranglarni saqlab qoling**, chunki brend butun platformada (dashboard, admin panel, ilovalar) izchil ishlatiladi.
- Tipografika: sarlavhalar uchun quyuq/og'ir shrift (hozir Nunito 800-900), matn uchun Inter — buni xohlasangiz zamonaviyroq juftlikka almashtirishingiz mumkin, lekin lotin+kiril harflarni (o'zbek tili) to'liq qo'llab-quvvatlashi shart.
- Ilova kartalari (4 ta) — **eng muhim savdo elementi** — har biriga mos emoji/rang-kod (🍔 fast food, 👕 kiyim, 🛒 ovqat, 📚 kitob) bilan yaqqol ajralib turishi, narx va xususiyatlar ro'yxati oson o'qilishi kerak.
- Mobil-birinchi: aksariyat foydalanuvchilar telefon orqali kiradi — barcha bo'limlar mobilda mukammal ishlashi shart.

### 5. TEXNIK CHEKLOVLAR — bularga albatta rioya qiling

- Loyiha **framework ishlatmaydi** — sof HTML + CSS + vanilla JS. React/Vue/Tailwind kompilyatori yo'q. Shunday saqlang.
- Shrift: Google Fonts (`Inter` + `Nunito`), ikonkalar: Font Awesome 6 (CDN orqali) — davom eting.
- **`js/main.js` va `js/settings.js` quyidagi ID/klasslarga bog'langan — ularni o'chirmang yoki nomini o'zgartirmang** (faqat CSS/joylashuvni o'zgartirishingiz mumkin):
  - `#navbar` (scroll bo'lganda `.scrolled` klassi qo'shiladi)
  - `#hamburger` + `#navLinks` (mobil menyu ochish/yopish, `.active`/`.open`)
  - `.nav-link` + har bir asosiy bo'limda `id` atributi (scroll paytida faol menyu punktini belgilash uchun)
  - `.reveal` klassi (IntersectionObserver orqali scroll animatsiyasi qo'shadi — `.visible`)
  - `.stat-number[data-target="..."]` (raqam animatsiyasi uchun)
  - `#appsGrid` (4 ta ilova kartasi shu yerga JS orqali dinamik chiqadi — statik HTML yozmang)
  - `#appDetailModal`, `#appDetailContent`, `#appDetailClose` (ilova tafsiloti popup)
  - `#scrollTop`, `#toast`
  - `data-settings-open` atributi (til/tema sozlamalari paneli)
  - `data-i18n="..."` atributlari — ko'p tilli tizim uchun ishlatiladi (`js/settings.js`) — **har bir tarjima qilinadigan matnda shu atributni saqlang**, matnni o'zgartirsangiz ham atributni olib tashlamang.
  - `kirish.html`, `kirish.html?tab=register`, `dashboard.html` havolalari — shu fayl nomlarini o'zgartirmang.
- Yangi CSS klasslarini xohlagancha qo'shishingiz mumkin, lekin yuqoridagi ID/klasslarni saqlang.

### 6. Vazifa

1. `css/style.css`dagi (yoki kerak bo'lsa yangi CSS fayl) vizual uslubni yuqoridagi yo'nalish asosida qayta yozing — ranglar, oraliqlar, soyalar, border-radius, tipografika shkalasi, kartalar dizayni.
2. `index.html`dagi HTML strukturasini kerak bo'lsa qayta tashkil qiling (masalan, hero layoutini, kartalar gridini), lekin 5-band'dagi barcha ID/klass/atributlarni saqlab qoling.
3. Har bir o'zgarishdan keyin sahifani (mobil va desktop kenglikda) tekshirib, joylashuv buzilmaganini tasdiqlang.
4. Oxirida menga qisqacha nima o'zgargani haqida hisobot bering (qaysi bo'limlar, qanday o'zgardi).

---

*(Prompt tugadi — nusxalash shu joygacha)*
