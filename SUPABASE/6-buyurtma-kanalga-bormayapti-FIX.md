# PROMPT — QR orqali berilgan buyurtma Telegram kanalga bormayapti (FIX)

> Repoga ulangan AI'ga bering. Ilova: `ovqat-dokoni` (xuddi shu naqsh boshqa
> ilovalarda ham bor — keyin ularga ham qo'llang).

---

MUAMMO: QR skaner qilib (mijoz qurilmasida, `?client=...`) berilgan buyurtma Telegram
kanalga YUBORILMAYDI. Lekin do'kon egasi o'z brauzerida buyurtma bersa — kanalga BORADI.

ANIQLANGAN SABAB: `ovqat-dokoni/telegram.js` dagi `apiBase()` bot server manzilini
shunday topadi:
    Cloud.get('bot_api')  ||  localStorage 'bo_bot_api'  ||  'ovqat_bot_http_url'  ||  'http://localhost:3344'
Bot server manzili (`bot_api`) faqat EGANING brauzeridagi localStorage'da saqlangan,
Cloud (Supabase) ga yozilmagan. Shuning uchun:
  - Eganing brauzeri: localStorage'dan oladi → ishlaydi.
  - Mijoz qurilmasi (QR): Cloud'da yo'q + localStorage bo'sh → `localhost:3344` ga
    tushadi → mijoz telefonida localhost yo'q → fetch jimgina fail bo'ladi → buyurtma
    kanalga bormaydi.

TUZATISH — 2 fayl:

## 1) `ovqat-dokoni/telegram.js` — `apiBase()` ni productionда localhost'ga tushirmaslik

`apiBase()` funksiyasini shunga almashtir:

    function apiBase() {
      const configured =
        (window.Cloud && Cloud.get('bot_api')) ||
        localStorage.getItem('bo_bot_api') ||
        localStorage.getItem('ovqat_bot_http_url') || '';
      if (configured) return configured.replace(/\/+$/, '');
      // Faqat lokal test (localhost/LAN) da localhost'ga tushamiz; productionда YO'Q.
      if (/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)) return 'http://localhost:3344';
      return '';   // sozlanmagan — sendOrder buni aniqlab, aniq xato beradi
    }

`sendOrder` ichida, fetch'dan OLDIN bo'sh manzilni aniqlab, aniq xato chiqar:

    async function sendOrder(order) {
      const base = apiBase();
      if (!base) {
        console.error('[Telegram] bot server manzili (bot_api) sozlanmagan — buyurtma kanalga yuborilmadi. Admin paneldan bot serverini saqlang.');
        return { ok: false, error: 'bot_api sozlanmagan' };
      }
      // ... qolgan kod o'zgarmaydi (payload tuzish + request('/store-bot/order', ...))
    }

## 2) `ovqat-dokoni/admin/js/admin.js` — mavjud bot_api ni Cloud'ga avtomatik ko'chirish

Sabab: ega `bot_api` ni Supabase migratsiyasidan OLDIN sozlagan bo'lsa, u faqat
localStorage'da; Cloud'da yo'q. Admin yuklanganda, agar Cloud'da `bot_api` bo'lmasa
LEKIN localStorage'da bor bo'lsa — uni bir marta Cloud'ga yozamiz (avtomatik tuzaladi).

Admin ishga tushish (init) joyiga, Cloud tayyor bo'lgach, shu blokni qo'sh:

    // Eski localStorage'dagi bot server manzilini Cloud'ga ko'chiramiz (bir marta) —
    // shunda mijoz qurilmalari (QR) ham bot manzilini oladi.
    (function migrateBotApiToCloud() {
      if (!window.Cloud) return;
      const inCloud = Cloud.get('bot_api', '');
      const inLocal = localStorage.getItem('bo_bot_api') || localStorage.getItem('ovqat_bot_http_url') || '';
      if (!inCloud && inLocal) {
        Cloud.set('bot_api', inLocal.replace(/\/+$/, ''));
        console.log('[admin] bot_api Cloud\'ga ko\'chirildi:', inLocal);
      }
    })();

(Bot manzilini saqlash kodida `Cloud.set("bot_api", v)` allaqachon bor — uni o'zgartirma.)

## 3) MUHIM — bot server manzili HTTPS va internetdan ochiq bo'lsin

`localhost:3344` faqat eganing kompyuterida ishlaydi. Mijozlar (QR) buyurtmasi
kanalga borishi uchun bot server (bot/bot.py) **internetда, HTTPS** manzilда turishi
shart (masalan Render'dagi URL). Admin → Bot sozlamalari → bot server manzilini
shu HTTPS URL bilan **qayta saqlang** (shunda u Cloud'ga yoziladi va barcha
qurilmalarga sinxron bo'ladi).

## TEKSHIRUV
1. Admin'ni oching (`?client=CL-1002`) → Bot sozlamalarida server manzili HTTPS ekanini
   tasdiqlang, kerak bo'lsa qayta saqlang.
2. Supabase → app_state → `app='ovqat'`, `key='bot_api'` qatori paydo bo'lsin.
3. Boshqa qurilmada QR (`?client=CL-1002`) → buyurtma bering.
4. Telegram kanalga buyurtma kelsin ✅. Kelmas a — mijoz qurilmasida F12 → Console'da
   `[Telegram] sendOrder ...` loglarini ko'ring (manzil va xato ko'rsatiladi).

## ESLATMA — boshqa ilovalar
Xuddi shu localhost-fallback naqshi `kiyim-dokoni`, `app` ilovalarining
telegram/bot klientlarida ham bor.
ovqat-dokoni ishlaganini ko'rgach, shu tuzatishni ularga ham qo'llang
(har birida bot server manzilini Cloud'ga sinxronlash + localhost'ni faqat lokalда).
