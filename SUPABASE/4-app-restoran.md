# PROMPT — app (restoran ilovasi) ni Supabase'ga ko'chirish

> Oldin `SUPABASE/0-SETUP.md` ni bajaring.
> Bu ilovada ma'lumot allaqachon `DB` obyekti orqali, client bo'yicha prefikslangan
> (`_k()`). Shuning uchun migratsiya juda toza: faqat `DB.get/set/remove` ni o'zgartiramiz.

---

VAZIFA: `app` (restoran) ilovasi ma'lumotni `script.js`/`admin.js` dagi `DB` obyekti orqali
localStorage'da saqlaydi. Umumiy ma'lumotni (taomlar, buyurtmalar, foydalanuvchilar,
sozlama, xabarlar) `cloud.js` dagi `Cloud` (Supabase) qatlamiga ko'chir. Qurilmaga xos
narsalar (joriy login, admin sessiyasi, savat, tema) localStorage'da qolsin.
`?client=` tizimi O'ZGARMASLIGI kerak.

KONTEKST (mavjud kod — `script.js` va `admin.js` da bir xil `DB`):
- `CLIENT_ID` `?client=` yoki `bo_session.clientId` dan olinadi; `_P = CLIENT_ID + '_'`.
- `DB` obyekti:
    _k(k) { return k.startsWith('tb_') ? _P + k : k; }
    get(k, fb) { ... localStorage.getItem(this._k(k)) ... }
    set(k, v)  { localStorage.setItem(this._k(k), JSON.stringify(v)); }
    remove(k)  { localStorage.removeItem(this._k(k)); }
- Kalitlar:
    SERVERGA (umumiy): tb_foods, tb_orders, tb_users, tb_settings, tb_messages,
      tb_admin_account, tb_bot_config, tb_store_url
    QURILMADA qoladigan (localStorage): tb_current_user, tb_admin_session, tb_cart,
      tb_user_<...> (foydalanuvchiga xos qurilma holati), 'theme', 'adminTheme'
- HTML: index.html va admin.html da `cloud.js` + supabase CDN ni boshqa skriptlardan OLDIN ulang.

QILINADIGAN O'ZGARISHLAR:

1) `DB` obyektini shunday o'zgartir (cloud kalitlarini Cloud'ga yo'naltir; Cloud allaqachon
   client bo'yicha ajratadi, shuning uchun bu kalitlarга `_P` prefiks SHART EMAS):
       const CLOUD_KEYS = new Set([
         'tb_foods','tb_orders','tb_users','tb_settings',
         'tb_messages','tb_admin_account','tb_bot_config','tb_store_url'
       ]);
       const DB = {
         _k(k) { return k.startsWith('tb_') ? _P + k : k; },
         get(k, fb) {
           if (CLOUD_KEYS.has(k)) { const v = Cloud.get(k, undefined); return (v===undefined||v===null) ? fb : v; }
           try { const v = localStorage.getItem(this._k(k)); return v !== null ? JSON.parse(v) : fb; } catch { return fb; }
         },
         set(k, v) {
           if (CLOUD_KEYS.has(k)) { Cloud.set(k, v); return; }
           localStorage.setItem(this._k(k), JSON.stringify(v));
         },
         remove(k) {
           if (CLOUD_KEYS.has(k)) { Cloud.remove(k); return; }
           localStorage.removeItem(this._k(k));
         }
       };
   (Bu o'zgarishni script.js VA admin.js dagi DB ta'rifiga bir xil qo'lla.)

2) BOOT TARTIBI (eng muhim). `Cloud` async — `DB.get(...)` birinchi marta ishlatilishidan
   OLDIN `Cloud.init` tugasin (script.js da yuqorida `if (!DB.get('tb_orders'))` bor).
   index.html va admin.html da, script.js/admin.js dan oldin:
       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
       <script src="cloud.js"></script>
       <script>
         (async () => {
           const CLIENT_ID = new URLSearchParams(location.search).get("client")
             || (JSON.parse(localStorage.getItem("bo_session")||"{}").clientId) || "demo";
           window.__CLIENT_ID = CLIENT_ID;
           await Cloud.init("tabby", CLIENT_ID);
           for (const src of ["script.js"]) {      // admin.html da: ["admin.js"]
             await new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s);});
           }
         })();
       </script>
   (Statik <script src="script.js"> / <script src="admin.js"> teglarini olib tashlab,
    boot ro'yxatiga ko'chir.)
   script.js/admin.js boshidagi `CLIENT_ID`/`_P` ta'rifini saqla, lekin CLIENT_ID ni
   `window.__CLIENT_ID` dan olish ham mumkin (ikkalasi bir xil natija beradi).

3) `tb_current_user`, `tb_admin_session`, `tb_cart`, `theme`, `adminTheme` — TEGMA
   (qurilmaga xos). `tb_user_<id>` kabi foydalanuvchiga xos kalitlar ham localStorage'da qolsin.

4) Bot bilan bog'liq `fetch(... /store-bot/...)` chaqiruvlari — TEGMA (alohida bot server).

5) TEKSHIRUV:
   - Admin'da taom qo'shilsa → Supabase `app_state` da `app='tabby'`, `key='tb_foods'`
     qatori yangilansin.
   - Mijoz buyurtma bersa → `tb_orders` serverga yozilib, admin boshqa qurilmada ko'rsin.
   - Ro'yxatdan o'tган foydalanuvchi (`tb_users`) boshqa qurilmada login qila olsin.
   - Savat (`tb_cart`) va joriy login (`tb_current_user`) qurilmaga xos qolsin.

NATIJA: menyu (taomlar), buyurtmalar, foydalanuvchilar va sozlamalar serverda —
admin va mijoz turli qurilmalarda bir xil ma'lumotni ko'radi.
