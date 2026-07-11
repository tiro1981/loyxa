/* ============================================================
   cloud.js — Supabase KV (kalit-qiymat) qatlami
   localStorage o'rnini bosadi, ammo ma'lumot SERVERDA saqlanadi
   va barcha qurilmalarda ko'rinadi.

   ISHLASH:
   - Ilova boshida BIR MARTA `await Cloud.init(app, client)` chaqiriladi:
     serverdagi shu (app, client) ma'lumotini yuklab xotirada keshlaydi.
   - Cloud.get(key)  — SINXRON (keshdan o'qiydi)
   - Cloud.set(key,v) — keshni yangilab, fonda serverga yozadi
   - Cloud.remove(key)

   SOZLAMA: pastdagi ikki qiymatni Supabase loyihangizdan to'ldiring
   (Settings → API). To'ldirilmasa — ilova localStorage rejimida ishlayveradi
   (faqat o'sha qurilmada; server sinxronizatsiyasi bo'lmaydi).
   ============================================================ */

// >>> Supabase Settings → API dan oling <<<
const SUPABASE_URL = "https://ctakvioxteagcwjlclnu.supabase.co";   // masalan: https://abcdefgh.supabase.co
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0YWt2aW94dGVhZ2N3amxjbG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODU1OTEsImV4cCI6MjA5NzI2MTU5MX0.fm8tVEvnWuvA6D2F9I7JqDvqDKgtalbKctqXSVHsCUQ";       // "anon public" kaliti (brauzerda ochiq turishi normal)

window.Cloud = (function () {
  // Sozlangan-sozlanmaganini aniqlaymiz. Placeholder yoki supabase kutubxonasi
  // yo'q bo'lsa — localStorage rejimiga o'tamiz (ilova baribir ishlaydi).
  const configured =
    typeof supabase !== "undefined" &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co/i.test(SUPABASE_URL) &&
    typeof SUPABASE_KEY === "string" && SUPABASE_KEY.length > 30;

  let _sb = null;
  if (configured) {
    try { _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }
    catch (e) { console.error("[Cloud] createClient:", e); }
  }

  return {
    app: "app",
    client: "demo",
    mode: _sb ? "cloud" : "local",   // 'cloud' = Supabase; 'local' = localStorage fallback
    _cache: {},

    _lsKey(key) { return "cloud__" + this.app + "__" + this.client + "__" + key; },

    // Ilova boshida BIR MARTA chaqiriladi (await bilan).
    // MUHIM: bu funksiya server javobini KUTIB sahifani BLOKLAMAYDI.
    // Qaytgan tashrifda oxirgi ma'lumot local "mirror"dan darrov tiklanadi,
    // server esa FONDA yangilanadi. Shu tufayli sahifa "qotmaydi".
    async init(app, client) {
      this.app = app || "app";
      this.client = client || "demo";

      // 1) DARROV: oxirgi ma'lum ma'lumotni local mirrordan tiklaymiz (sinxron).
      //    Sahifa endi server javobini kutmasdan ham to'liq chiziladi.
      this._cache = this._loadMirror();

      if (!_sb) {
        this.mode = "local";
        console.warn("[Cloud] Supabase sozlanmagan — localStorage rejimida ishlayapti.");
        return;
      }

      this.mode = "cloud";
      const hasMirror = this._cache && Object.keys(this._cache).length > 0;

      if (hasMirror) {
        // Qaytgan tashrif: keshdan darrov ishlaymiz, serverni FONDA yangilaymiz.
        // Hech narsa kutilmaydi — 5 soniyalik "qotish" YO'Q.
        this._refresh();
        return;
      }

      // 2) Birinchi tashrif (mirror bo'sh): menyu bo'sh chizilib keyin "sakramasligi" uchun
      //    bir martagina server javobini kutamiz, ammo timeout bilan cheklab.
      try {
        const res = await this._fetchOnce(2500);
        if (res.__timeout) {
          console.warn("[Cloud] init: server 2.5s ichida javob bermadi — localStorage rejimida davom etamiz.");
          this.mode = "local";
          // MUHIM: shu yerda batamom taslim bo'lmaymiz. QR skaner qilgan YANGI mijoz
          // qurilmasida mirror bo'lmaydi — birinchi urinish sekin javob bersa (tarmoq) yoki
          // xato bilan tugasa (masalan CORS/vaqtinchalik server xatosi — bu ayrim qurilma/
          // brauzerlarda ko'proq uchraydi), oldingi versiya bu holatni butunlay tashlab
          // yuborardi va menyu HAR DOIM bo'sh ko'rinardi. Endi fonda bir necha marta qayta
          // urinamiz; muvaffaqiyatli bo'lsa "cloud:updated" orqali UI'ni qayta chizamiz.
          this._backgroundRetry();
          return;
        }
        if (res.error) {
          console.error("[Cloud] init:", res.error);
          this.mode = "local";
          this._backgroundRetry();
          return;
        }
        const c = {};
        (res.data || []).forEach((r) => { c[r.key] = r.value; });
        this._cache = c;
        this._saveMirror(c);
      } catch (e) {
        console.error("[Cloud] init (network):", e);
        this.mode = "local";   // server ulanmasa — localStorage'ga qaytamiz
        this._backgroundRetry();
      }
    },

    // Bitta so'rovni berilgan timeout bilan sinaydi. { data, error } yoki { __timeout: true }
    // yoki { error } (tarmoq xatosi) qaytaradi — hech qachon tashlab (throw) yubormaydi.
    async _fetchOnce(timeoutMs) {
      try {
        const query = _sb
          .from("app_state").select("key,value")
          .eq("app", this.app).eq("client_id", this.client);
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), timeoutMs));
        const res = await Promise.race([query, timeout]);
        return res && res.__timeout ? { __timeout: true } : res;
      } catch (e) {
        return { error: e };
      }
    },

    // Birinchi urinish muvaffaqiyatsiz bo'lsa (sekin YOKI xato) — sahifani BLOKLAMASDAN
    // fonda bir necha marta (ortib boruvchi kutish bilan) qayta urinadi. Muvaffaqiyatli
    // bo'lsa keshni/mirror'ni yangilab, "cloud:updated" orqali UI'ni qayta chizadi.
    async _backgroundRetry() {
      const delays = [2000, 4000, 8000, 15000];
      for (const delay of delays) {
        await new Promise((r) => setTimeout(r, delay));
        const res = await this._fetchOnce(6000);
        if (res.__timeout || res.error || !res.data) continue;
        const c = {};
        res.data.forEach((r2) => { c[r2.key] = r2.value; });
        this._cache = c;
        this._saveMirror(c);
        this.mode = "cloud";
        try { window.dispatchEvent(new CustomEvent("cloud:updated")); } catch (e2) {}
        return;
      }
      console.warn("[Cloud] fon rejimida qayta urinishlar tugadi — server bilan bog'lanib bo'lmadi.");
    },

    // Serverdan FONDA yangilaydi — UI ni bloklamaydi. Yangi ma'lumot kelsa,
    // keshni va mirror'ni yangilab, "cloud:updated" hodisasini yuboradi (qayta chizish uchun).
    async _refresh() {
      if (this.mode !== "cloud" || !_sb) return;
      try {
        const { data, error } = await _sb
          .from("app_state").select("key,value")
          .eq("app", this.app).eq("client_id", this.client);
        if (error) { console.error("[Cloud] refresh:", error); return; }
        const c = {};
        (data || []).forEach((r) => { c[r.key] = r.value; });
        this._cache = c;
        this._saveMirror(c);
        try { window.dispatchEvent(new CustomEvent("cloud:updated")); } catch (e) {}
      } catch (e) {
        console.error("[Cloud] refresh (network):", e);
      }
    },

    // ---- Local "mirror": oxirgi cloud ma'lumotini shu qurilmada saqlaydi ----
    _mirrorKey() { return "cloud_mirror__" + this.app + "__" + this.client; },
    _loadMirror() {
      try { return JSON.parse(localStorage.getItem(this._mirrorKey()) || "{}") || {}; }
      catch (e) { return {}; }
    },
    _saveMirror(c) {
      try { localStorage.setItem(this._mirrorKey(), JSON.stringify(c)); }
      catch (e) {}
    },

    // SINXRON o'qish (localStorage.getItem o'rnida)
    get(key, fallback = null) {
      if (this.mode === "cloud") {
        return (key in this._cache) ? this._cache[key] : fallback;
      }
      try {
        const v = localStorage.getItem(this._lsKey(key));
        return v !== null ? JSON.parse(v) : fallback;
      } catch (e) { return fallback; }
    },

    // Yozish (localStorage.setItem o'rnida) — keshni yangilab, fonda serverga yuboradi
    set(key, value) {
      if (this.mode === "cloud") {
        this._cache[key] = value;
        this._saveMirror(this._cache);   // mirror ham yangilanadi (keyingi ochilish darrov chizadi)
        _sb.from("app_state")
          .upsert(
            { app: this.app, client_id: this.client, key, value, updated_at: new Date().toISOString() },
            { onConflict: "app,client_id,key" }
          )
          .then(({ error }) => { if (error) console.error("[Cloud] set:", error); });
      } else {
        try { localStorage.setItem(this._lsKey(key), JSON.stringify(value)); }
        catch (e) { console.warn("[Cloud] set (local):", e); }
      }
    },

    // O'chirish (localStorage.removeItem o'rnida)
    remove(key) {
      if (this.mode === "cloud") {
        delete this._cache[key];
        this._saveMirror(this._cache);
        _sb.from("app_state").delete()
          .eq("app", this.app).eq("client_id", this.client).eq("key", key)
          .then(({ error }) => { if (error) console.error("[Cloud] remove:", error); });
      } else {
        try { localStorage.removeItem(this._lsKey(key)); } catch (e) {}
      }
    },
  };
})();
