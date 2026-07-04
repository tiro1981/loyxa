# Supabase Setup — barcha ilovalar uchun umumiy

Bu fayl bir marta o'qiladi. 1-3 qadamlar Supabase panelida, 4-qadam koddagi
umumiy `cloud.js` fayli. Har bir ilova prompti shu `cloud.js` ga tayanadi.

> **Asosiy g'oya:** Hamma ilova ma'lumotni JSON "blob" ko'rinishida localStorage'da
> saqlaydi. Biz ularni alohida jadvallarga ajratmaymiz — o'rniga **bitta universal
> "kalit-qiymat" jadval** (`app_state`) ishlatamiz. Kod deyarli o'zgarmaydi:
> faqat `localStorage` o'rniga `cloud.js` ning xotira-keshi + serverga yozish keladi.

---

## 1-qadam: Loyiha (allaqachon ochilgan)

Supabase loyihangiz: **loyxa** (tiro1981). Yangi loyiha kerak emas.

> Oldin yaratgan `products` va `orders` jadvallari endi **kerak emas** — universal
> yondashuvga o'tyapmiz. Ularni o'chirib tashlasangiz bo'ladi (ixtiyoriy):
> ```sql
> drop table if exists products;
> drop table if exists orders;
> ```

## 2-qadam: Universal jadval (SQL Editor → New query → Run)

```sql
create table app_state (
  app        text not null,          -- 'ovqat' | 'kiyim' | 'kitob' | 'kofe' | 'tabby'
  client_id  text not null,          -- do'kon identifikatori (?client= yoki bo_session)
  key        text not null,          -- localStorage kaliti (masalan 'products','orders','catalog')
  value      jsonb,                  -- saqlanadigan ma'lumot (har qanday JSON)
  updated_at timestamptz default now(),
  primary key (app, client_id, key)
);

create index on app_state (app, client_id);
```

## 3-qadam: Xavfsizlik (RLS) — keyin yoqing

Ilova ishlaganini tasdiqlagach (har bir ilova sinab bo'lingach), shu so'rovni Run qiling:

```sql
alter table app_state enable row level security;
create policy "read"   on app_state for select using (true);
create policy "insert" on app_state for insert with check (true);
create policy "update" on app_state for update using (true);
create policy "delete" on app_state for delete using (true);
```

> Eslatma: bu anon kalit bilan har kim yozishi mumkin degani. Demo/MVP uchun yetarli.
> Keyinroq admin login qo'shilганda yozishni cheklash mumkin.

## 4-qadam: `cloud.js` — umumiy ma'lumot qatlami

Quyidagi faylni **har bir ilova papkasiga** `cloud.js` nomi bilan joylang
(yoki bitta umumiy joyga qo'yib, hammasidan ulang). Faqat ikkita qiymatni to'ldiring:

```js
// cloud.js — Supabase KV qatlami (localStorage o'rnini bosadi, ammo serverda)
// Sinxron o'qish: ma'lumot boshda bir marta yuklanadi va xotirada keshlanadi.
// Yozish: xotira yangilanadi + fonda serverga upsert qilinadi.

const SUPABASE_URL = "https://SIZNING_LOYIHA.supabase.co";  // Settings → API → Project URL
const SUPABASE_KEY = "eyJ...";                               // Settings → API → anon public

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Cloud = {
  app: null,
  client: null,
  _cache: {},

  // Ilova boshida BIR MARTA chaqiriladi — barcha ma'lumotni serverdan yuklab keshlaydi.
  async init(app, client) {
    this.app = app;
    this.client = client || "demo";
    this._cache = {};
    const { data, error } = await _sb
      .from("app_state").select("key,value")
      .eq("app", this.app).eq("client_id", this.client);
    if (error) { console.error("[Cloud] init:", error); return; }
    (data || []).forEach((r) => { this._cache[r.key] = r.value; });
  },

  // Sinxron o'qish (localStorage.getItem o'rniga)
  get(key, fallback = null) {
    return (key in this._cache) ? this._cache[key] : fallback;
  },

  // Yozish (localStorage.setItem o'rniga) — keshni yangilab, fonda serverga yuboradi
  set(key, value) {
    this._cache[key] = value;
    _sb.from("app_state")
      .upsert(
        { app: this.app, client_id: this.client, key, value, updated_at: new Date().toISOString() },
        { onConflict: "app,client_id,key" }
      )
      .then(({ error }) => { if (error) console.error("[Cloud] set:", error); });
  },

  // O'chirish (localStorage.removeItem o'rniga)
  remove(key) {
    delete this._cache[key];
    _sb.from("app_state").delete()
      .eq("app", this.app).eq("client_id", this.client).eq("key", key)
      .then(({ error }) => { if (error) console.error("[Cloud] remove:", error); });
  },
};
```

## Har bir ilova HTML'ига qo'shiladigan ikki qator (har sahifa: index.html va admin)

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="cloud.js"></script>
```

> Bularni boshqa ilova skriptlaridan (`data.js`, `script.js`, `admin.js`, `db.js`) **OLDIN** ulang.

---

## Muhim tushuncha — nega `Cloud.init()` ni kutish (await) shart

`localStorage` **sinxron** (darhol qaytaradi), Supabase esa **asinxron** (internetdan keladi).
Shuning uchun ilova boshlanishida **avval `await Cloud.init(...)`** ni tugatib, keyin
ma'lumotni o'qiydigan kodni ishga tushirish kerak. Har bir ilova prompti buni
qanday qilishni aniq ko'rsatadi (boot tartibini async qilish).

`Cloud.get/set/remove` esa init'dan keyin **sinxron** ishlaydi (keshdan), shuning uchun
ilovaning qolgan yuzlab `localStorage` o'qishlarini async qilishga hojat yo'q — faqat
boot va saqlash nuqtalari o'zgaradi.
