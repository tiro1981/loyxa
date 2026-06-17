# PROMPT — ovqat-dokoni ni Supabase'ga ko'chirish

> Oldin `SUPABASE/0-SETUP.md` ni bajaring (jadval + cloud.js tayyor bo'lsin).
> Quyidagi matnni to'liq nusxalab, repoga ulangan AI'ga (Cursor/Copilot/Claude) bering.

---

VAZIFA: `ovqat-dokoni` ilovasi hozir ma'lumotni brauzer localStorage'da saqlaydi.
Buni `cloud.js` dagi `Cloud` (Supabase KV) qatlamiga ko'chir, shunda ma'lumot serverda
saqlanadi va barcha qurilmalarda ko'rinadi. `?client=` tizimi va QR generatori
O'ZGARMASLIGI kerak.

KONTEKST (mavjud kod):
- `js/data.js` — `DATA` IIFE. Katalog (`products`, `categories`) ni
  `localStorage` kalitidan o'qiydi: `CATALOG_KEY = "ovqat_catalog_v1__" + CLIENT_ID`.
  `saveCatalog()` funksiyasi shu kalitga yozadi.
- `js/store.js` — `Store` IIFE. Holatni (cart, favorites, orders, addresses, theme,
  user, promo) `KEY = "ovqat_dokoni_v1__" + DATA.clientId` dan o'qiydi/yozadi
  (`load()` va `save()` funksiyalari).
- `CLIENT_ID` `?client=` yoki `bo_session.clientId` dan olinadi (data.js ichida).
- HTML'da `cloud.js` ALLAQACHON ulanган deb hisobla (0-SETUP bo'yicha). Agar ulanmagan
  bo'lsa, index.html va admin/index.html ga supabase CDN + cloud.js ni boshqa
  skriptlardan oldin qo'sh.

QILINADIGAN O'ZGARISHLAR:

1) BOOT TARTIBI (eng muhim). `Cloud` async, shuning uchun ma'lumot o'qilishidan
   OLDIN `Cloud.init` tugashi kerak. Ilova ishga tushishini shunday qil:
   - CLIENT_ID ni aniqlaydigan mantiqni HTML boot skriptiga yoki app.js boshiga ko'chir.
   - Ilova boshlanishida AVVAL kutib ol:
       await Cloud.init("ovqat", CLIENT_ID);
     keyingina `DATA` va `Store` ni yuklab, sahifani render qil.
   - Buning eng oson yo'li: index.html (va admin) da data.js/store.js/app.js larни
     to'g'ridan-to'g'ri <script src> bilan emas, balki boot skriptida ketma-ket yukla:
       <script>
         (async () => {
           const CLIENT_ID = new URLSearchParams(location.search).get("client")
             || (JSON.parse(localStorage.getItem("bo_session")||"{}").clientId) || "demo";
           window.__CLIENT_ID = CLIENT_ID;
           await Cloud.init("ovqat", CLIENT_ID);
           // endi ilova skriptlarini yukla
           for (const src of ["js/data.js","js/store.js","js/app.js"]) {
             await new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s);});
           }
         })();
       </script>
     (admin sahifasida admin skriptlari ro'yxatini mos qo'y.)

2) `js/data.js`:
   - `CLIENT_ID` ni endi `window.__CLIENT_ID` dan ol (boot allaqachon aniqlagan).
   - Katalog O'QISH: `localStorage.getItem(CATALOG_KEY)` o'rniga:
       const _saved = Cloud.get("catalog", null);
   - `saveCatalog()` ichidagi `localStorage.setItem(CATALOG_KEY, ...)` o'rniga:
       Cloud.set("catalog", { products, categories });
   - "Ilk ishga tushirishda standart kategoriyalarni yozish" qatori
     (`if (!localStorage.getItem(CATALOG_KEY)) saveCatalog();`) o'rniga:
       if (!Cloud.get("catalog")) saveCatalog();

3) `js/store.js`:
   - `load()` ichidagi `localStorage.getItem(KEY)` o'rniga: `Cloud.get("state", null)`
     (qaytgan qiymat allaqachon obyekt — JSON.parse SHART EMAS).
   - `save()` ichidagi `localStorage.setItem(KEY, JSON.stringify(state))` o'rniga:
       Cloud.set("state", state);
   - `KEY` o'zgaruvchisini olib tashlasang ham bo'ladi (endi ishlatilmaydi).

4) admin/js/admin.js:
   - Katalogni o'zgartirгandan keyin `DATA.saveCatalog()` chaqirilishi davom etsin —
     u endi avtomatik Cloud.set qiladi, qo'shimcha o'zgarish kerak emas.
   - QR generatori (havola `index.html?client=<id>` ni kodlaydi) — TEGMA.
   - Bot konfiguratsiyasi (`BOT_KEY`), tema (`admin-theme`) kabi mayda localStorage
     kalitlarini xohlasang localStorage'da qoldir (ular qurilmaga xos sozlama, demo uchun muhim emas).

5) TEKSHIRUV:
   - Hech bir joy katalog/holatni localStorage'dan O'QImasin (faqat tema/bot config qolishi mumkin).
   - Admin'da mahsulot qo'shilsa → Supabase `app_state` jadvalida
     `app='ovqat', key='catalog'` qatori paydo bo'lsin.
   - Boshqa qurilmada `index.html?client=<o'sha id>` ochilsa → mahsulot ko'rinsin.

NATIJA: admin qo'shган mahsulot serverga yoziladi va QR (`?client=<id>`) orqali
ochilган storefront'da, har qanday qurilmada ko'rinadi.
