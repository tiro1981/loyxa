# Platforma admin paneli — Supabase'ga o'tkazish (2-bosqich)

Bu fayl `admin.html`, `js/admin.js`, `js/auth.js`, `js/main.js`, `js/dashboard.js`,
`js/settings.js`, `kirish.html`, `dashboard.html` uchun. Ilova admin panellariga
(`fast-food-dokoni/`, `ovqat-dokoni/admin`, `kiyim-dokoni/admin.html`, `kitob-dokoni/admin.html`)
aloqasi yo'q — ular alohida, o'z `cloud.js`lariga ega.

## Nima o'zgardi

Platforma ma'lumotlari (mijozlar ro'yxati, ilovalar katalogi, xabarlar, sayt
sozlamalari, platforma boti sozlamalari) endi **`js/cloud.js`** orqali xuddi
shu `app_state` jadvalida (`SUPABASE/0-SETUP.md`) saqlanadi — faqat
`app="platform"`, `client_id="global"` bilan (bitta umumiy yozuv, do'konlarga
bo'linmagan). Qo'shimcha SQL jadval kerak emas — jadval allaqachon mavjud.

`bo_session` (joriy tizimga kirgan foydalanuvchi) atayin **localStorage'da
qoladi** — u har qurilmaga xos.

## Qo'shimcha qadam — logotiplar uchun Storage bucket (ixtiyoriy)

Ilova logotiplari hozircha ham ishlaydi (base64 ko'rinishida `bo_apps`
yozuvi ichida saqlanadi — avvalgidek). Lekin katta rasmlar uchun buni
Supabase Storage'ga o'tkazish tavsiya etiladi (`js/cloud.js` da
`Cloud.uploadImage()` funksiyasi buni qo'llab-quvvatlaydi, lekin bucket
hali yo'q bo'lsa avtomatik ravishda eski base64 usuliga qaytadi — hech
narsa buzilmaydi).

Yoqish uchun (Supabase panelida, bir marta):

1. **Storage → New bucket**
2. Nomi: **`app-logos`** (aynan shu nom — kod shunga qattiq bog'langan)
3. **Public bucket**: ✅ yoqing (logotiplar ochiq URL orqali ko'rinishi kerak)
4. Saqlang.

Shundan keyin admin panelda yangi logo yuklanganda avtomatik shu bucket'ga
tushadi va qisqa URL saqlanadi. Eski (base64) logotiplar ishlashda davom
etaveradi — ularni qayta yuklash shart emas.

## Tekshirish

- `admin.html`ni sessiyasiz oching → `kirish.html`ga yo'naltirilishi kerak.
- `kirish.html`da tizimga kiring (yoki ro'yxatdan o'ting) → `dashboard.html`.
- Ikkinchi (boshqa) brauzer/qurilmada admin sifatida kirib, mijozlar
  ro'yxatini ochsangiz — birinchi qurilmada qo'shilgan/o'zgartirilgan
  mijozlar ham ko'rinishi kerak (bu — Supabase orqali ishlayotganining
  isboti; localStorage'da bo'lsa faqat bitta qurilmada ko'rinardi).
