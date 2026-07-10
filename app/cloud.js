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
      const query = _sb
        .from("app_state").select("key,value")
        .eq("app", this.app).eq("client_id", this.client);
      try {
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), 2500));
        const res = await Promise.race([query, timeout]);
        if (res && res.__timeout) {
          console.warn("[Cloud] init: server 2.5s ichida javob bermadi — localStorage rejimida davom etamiz.");
          this.mode = "local";
          // MUHIM: so'rovni tashlab yubormaymiz. QR skaner qilgan YANGI mijoz qurilmasida
          // mirror bo'lmaydi — server 2.5s dan sekin javob bersa (masalan restoran wifi/mobil
          // tarmoq), oldingi versiya bu javobni butunlay tashlab yuborar edi va menyu doim
          // bo'sh ko'rinardi. Endi kech kelgan javobni ham qo'llab, "cloud:updated" orqali
          // UI'ni (menyu ro'yxatini) qayta chizamiz.
          query.then(({ data, error }) => {
            if (error || !data) return;
            const c = {};
            data.forEach((r) => { c[r.key] = r.value; });
            this._cache = c;
            this._saveMirror(c);
            this.mode = "cloud";
            try { window.dispatchEvent(new CustomEvent("cloud:updated")); } catch (e2) {}
          }).catch((e2) => console.error("[Cloud] init (late):", e2));
          return;
        }
        const { data, error } = res;
        if (error) { console.error("[Cloud] init:", error); this.mode = "local"; return; }
        const c = {};
        (data || []).forEach((r) => { c[r.key] = r.value; });
        this._cache = c;
        this._saveMirror(c);
      } catch (e) {
        console.error("[Cloud] init (network):", e);
        this.mode = "local";   // server ulanmasa — localStorage'ga qaytamiz
      }
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
