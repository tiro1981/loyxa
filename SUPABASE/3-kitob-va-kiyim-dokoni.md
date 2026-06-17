# PROMPT — kitob-dokoni va kiyim-dokoni ni Supabase'ga ko'chirish

> Oldin `SUPABASE/0-SETUP.md` ni bajaring.
> Bu ikki ilova **egizak** — strukturasi bir xil, faqat kalit prefiksi farq qiladi:
>   - kitob-dokoni → `kitob_*`,  app nomi: `"kitob"`
>   - kiyim-dokoni → `moda_*`,   app nomi: `"kiyim"`
> Quyidagi promptni HAR BIRIGA alohida bering (qaytib chiqqan {PREFIX} va {APP} ni mos qo'ying).
> kitob uchun: {PREFIX}=kitob, {APP}=kitob.  kiyim uchun: {PREFIX}=moda, {APP}=kiyim.

---

VAZIFA: `{APP}-dokoni` ilovasi ma'lumotni `script.js`/`admin.js` da localStorage'da
saqlaydi. Do'kon ma'lumotini (katalog + buyurtmalar + sozlama) `cloud.js` dagi `Cloud`
(Supabase) qatlamiga ko'chir, shunda u serverda saqlanib barcha qurilmada ko'rinadi.
Xaridorга xos vaqtinchalik holat (savat, sevimlilar, profil, manzil, promo, tema)
localStorage'da qolsin. `?client=` va QR tizimi O'ZGARMASLIGI kerak.

KONTEKST (mavjud kod):
- `script.js` da `STORE_KEY = '{PREFIX}_store_v1'`. Bu BITTA katta JSON blob:
    { products, orders, customers, categories, coupons, settings, chats }
  `Store.load()` shu kalitdan o'qiydi, `Store.save(data)` yozadi.
- Xaridorга xos alohida kalitlar (BULAR localStorage'da QOLADI):
    CART_KEY='{PREFIX}_cart_v1', FAV_KEY='{PREFIX}_favs_v1',
    PROFILE_KEY='{PREFIX}_profile_v1', ADDR_KEY='{PREFIX}_addrs_v1',
    PROMO_KEY='{PREFIX}_promo', NOTIF_KEY='{PREFIX}_notif_seen', THEME_KEY (tema)
- `admin.js` ham xuddi shu `STORE_KEY` ni o'qib/yozadi (Store orqali).
- Client: `?client=` yoki `bo_session.clientId` (kodda `SHOP_KEY` shundan tuziladi).
- HTML: index.html va admin.html da `cloud.js` + supabase CDN ni boshqa skriptlardan OLDIN ulang.

QILINADIGAN O'ZGARISHLAR:

1) Faqat `STORE_KEY` blobini serverga ko'chiramiz. `Store.load()` / `Store.save()`
   ichidagi localStorage chaqiruvini almashtir:
   - `Store.load()`: `localStorage.getItem(STORE_KEY)` o'rniga:
        const parsed = Cloud.get("store", null);
        if (!parsed) { this.save(DEFAULT_DATA); return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
        // (qaytgan qiymat allaqachon obyekt — JSON.parse SHART EMAS)
   - `Store.save(data)`: `localStorage.setItem(STORE_KEY, JSON.stringify(data))` o'rniga:
        Cloud.set("store", data);
   - Boshqa kalitlar (CART/FAV/PROFILE/ADDR/PROMO/NOTIF/THEME) — TEGMA, localStorage'da qolsin.

2) BOOT TARTIBI (eng muhim). `Cloud` async — `Store.load()` chaqirilishidan OLDIN
   `Cloud.init` tugasin. index.html va admin.html da, script.js/admin.js dan oldin:
       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
       <script src="cloud.js"></script>
       <script>
         (async () => {
           const CLIENT_ID = new URLSearchParams(location.search).get("client")
             || (JSON.parse(localStorage.getItem("bo_session")||"{}").clientId) || "shop";
           await Cloud.init("{APP}", CLIENT_ID);
           // endi ilova skriptlarini yukla (index uchun script.js; admin uchun admin.js)
           for (const src of ["script.js"]) {     // admin.html da: ["admin.js"]
             await new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s);});
           }
         })();
       </script>
   (Statik <script src="script.js"> / <script src="admin.js"> teglarini olib tashlab,
    shu boot ro'yxatiga ko'chir. CSS va boshqa kutubxonalarga tegma.)

3) FOYDALI YON TA'SIR: hozir `STORE_KEY` barcha mijozlar uchun YAGONA edi (katalog
   client bo'yicha ajralmagan). `Cloud` esa client_id bo'yicha avtomatik ajratadi —
   shuning uchun endi har bir do'kon o'z katalogiga ega bo'ladi (multi-tenant to'g'rilanadi).

4) Bot konfiguratsiyasi (`BOT_CFG_KEY`, `{PREFIX}_bot_config`) va boshqa server-bot
   `fetch` chaqiruvlari (getBotApi) — TEGMA, ular alohida bot serverига tegishli.

5) TEKSHIRUV:
   - Admin'da mahsulot qo'shilsa → Supabase `app_state` da `app='{APP}'`, `key='store'`
     qatori yangilansin.
   - Xaridor buyurtma bersa → o'sha `store` blobidagi `orders` yangilanib, admin boshqa
     qurilmada ko'rsin.
   - Boshqa qurilmada `index.html?client=<id>` ochilsa → katalog ko'rinsin.
   - Savat faqat o'sha qurilmada qolishini tekshir (xaridorга xos, normal holat).

NATIJA: katalog, buyurtmalar va sozlamalar serverda — admin va xaridor turli qurilmalarda
bir xil ma'lumotni ko'radi.
