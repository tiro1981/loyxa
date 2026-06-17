# PROMPT — salqin-ichimliklar ni Supabase'ga ko'chirish

> Oldin `SUPABASE/0-SETUP.md` ni bajaring.
> Bu ilova eng murakkabi: mahsulot, buyurtma, foydalanuvchi (parol hash bilan), savat, chat bor.
> Yaxshi xabar: hammasi `db.js` dagi BITTA `read()` / `write()` funksiyasidan o'tadi —
> shuning uchun asosan shu ikki funksiyani o'zgartiramiz.

---

VAZIFA: `salqin-ichimliklar` ilovasi ma'lumotni `db.js` orqali localStorage'da saqlaydi.
Umumiy ma'lumotlarni (mahsulot, buyurtma, foydalanuvchi, savat, chat, sozlama) `cloud.js`
dagi `Cloud` (Supabase) qatlamiga ko'chir, shunda ular serverda saqlanib barcha
qurilmalarda ko'rinadi. Qurilmaga xos narsalar (login sessiyasi, tema) localStorage'da qolsin.

KONTEKST (mavjud kod — `db.js`):
- Modul nomi: `DB`. Barcha o'qish/yozish ikki yordamchidan o'tadi:
    read(k, fallback)  — `localStorage.getItem(k)` ni JSON.parse qiladi
    write(k, v)        — `localStorage.setItem(k, JSON.stringify(v))`
- Kalitlar (`KEYS` obyekti):
    SERVERGA ko'chiriladigan (umumiy): si_products, si_orders, si_users, si_cart,
      si_settings, si_chat, si_seen_statuses, si_admin_creds
    QURILMADA qoladigan (localStorage): si_session, si_admin_session, si_theme
- `seed()` boshlang'ich bo'sh ma'lumotni yozadi.
- HTML: index.html va admin.html da `cloud.js` ni `db.js` dan OLDIN ulang
  (supabase CDN ham). Mavjud `db.js` da AVVALdan yozilgan `DB` ni o'zgartiramiz, o'chirmaymiz.

QILINADIGAN O'ZGARISHLAR (db.js ichida):

1) Eng yuqoriga, umumiy va lokal kalitlar ro'yxatini belgila:
       const CLOUD_KEYS = new Set([
         'si_products','si_orders','si_users','si_cart',
         'si_settings','si_chat','si_seen_statuses','si_admin_creds'
       ]);
       // qolganlari (si_session, si_admin_session, si_theme) localStorage'da qoladi.

2) `read(k, fallback)` ni shunday qil:
       const read = (k, fallback) => {
         if (CLOUD_KEYS.has(k)) {
           const v = Cloud.get(k, undefined);
           return (v === undefined || v === null) ? fallback : v;
         }
         try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
         catch { return fallback; }
       };

3) `write(k, v)` ni shunday qil (kvota-tozalash mantiqi endi kerak emas — server cheksiz):
       const write = (k, v) => {
         if (CLOUD_KEYS.has(k)) { Cloud.set(k, v); return; }
         try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn(e); }
       };

4) BOOT TARTIBI (eng muhim). `Cloud` async — `DB` ishlatilishidan OLDIN init bo'lsin.
   index.html va admin.html da, db.js dan oldin, boot skriptini async qil:
       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
       <script src="cloud.js"></script>
       <script>
         (async () => {
           const CLIENT_ID = new URLSearchParams(location.search).get("client")
             || (JSON.parse(localStorage.getItem("bo_session")||"{}").clientId) || "main";
           await Cloud.init("salqin", CLIENT_ID);
           // endi qolgan skriptlarni yukla (db.js, script.js / admin uchun mos fayllar)
           for (const src of ["db.js","script.js"]) {
             await new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s);});
           }
         })();
       </script>
   (Hozir db.js/script.js to'g'ridan-to'g'ri <script src> bilan ulangan bo'lsa, ularni
    bu boot ro'yxatiga ko'chir va statik teglarni olib tashla. admin.html da admin
    skriptlari ro'yxatini mos qo'y.)

5) `seed()` o'zgarmaydi — u `write()` orqali ishlaydi, endi avtomatik Cloud'ga yozadi.
   `si_session`/`si_admin_session`/`si_theme` ni o'qiydigan joylar (users.login,
   admin.login, theme.get/set) localStorage'da qoladi — TEGMA.

6) Eslatma — parol/hash: `users.register`/`login` parolni SHA-256 hash qilib `si_users`
   ichida saqlaydi. Bu endi serverda saqlanadi (hash ko'rinishida, ochiq matn emas).
   Mantiq o'zgarmaydi — faqat saqlash joyi server bo'ladi.

7) TEKSHIRUV:
   - Mahsulot/buyurtma/ro'yxatdan o'tish → Supabase `app_state` da `app='salqin'`,
     mos `key` (si_products, si_orders, si_users...) qatorlari paydo bo'lsin.
   - Boshqa qurilmada mahsulotlar ko'rinsin; ro'yxatdan o'tган foydalanuvchi boshqa
     qurilmada ham login qila olsin.
   - Login sessiyasi (si_session) qurilmaga xos qolishini tekshir (bir qurilmada
     chiqish boshqasiga ta'sir qilmaydi).

NATIJA: katalog, buyurtmalar, foydalanuvchilar va chat serverda — barcha qurilmada bir xil.
