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
const SUPABASE_URL = "https://lzygxzenebutsiydujty.supabase.co";   // masalan: https://abcdefgh.supabase.co
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6eWd4emVuZWJ1dHNpeWR1anR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMzMwNDQsImV4cCI6MjEwODgwOTA0NH0.IdM00h2rsCbKF12BhTFrvQj3Rw-geuTRLOK88uW6-14";       // "anon public" kaliti (brauzerda ochiq turishi normal)

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
    _lastSet: {},   // key -> oxirgi yozuv vaqti (watch yaqinda yozilganini bosib ketmasin)

    _lsKey(key) { return "cloud__" + this.app + "__" + this.client + "__" + key; },

    // Ilova boshida BIR MARTA chaqiriladi (await bilan).
    async init(app, client) {
      this.app = app || "app";
      this.client = client || "demo";
      this._cache = {};
      if (this.mode !== "cloud") {
        if (!_sb) console.warn("[Cloud] Supabase sozlanmagan — localStorage rejimida ishlayapti.");
        return;
      }
      // Supabase so'rovi (thenable — Promise.race chaqirilganda ishga tushadi)
      const query = _sb
        .from("app_state").select("key,value")
        .eq("app", this.app).eq("client_id", this.client);
      try {
        // MUHIM: tarmoq sekin yoki uzilgan bo'lsa sahifa QOTIB qolmasin. So'rovni qisqa
        // timeout bilan poygaga qo'yamiz — javob kelmasa localStorage rejimiga o'tib davom etamiz.
        // (Oldin 6000ms edi — sahifa har ochilishda sezilarli "qotib qolish" hissi berardi.)
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), 2500));
        const res = await Promise.race([query, timeout]);
        if (res && res.__timeout) {
          console.warn("[Cloud] init: server 2.5s ichida javob bermadi — localStorage rejimida davom etamiz.");
          this.mode = "local";
          // MUHIM: so'rovni tashlab yubormaymiz. QR skaner qilgan YANGI mijoz qurilmasida
          // hali hech qanday keshlangan ma'lumot yo'q — server sekin javob bersa (2.5s dan
          // ko'p), haqiqiy katalog butunlay yo'qolib, do'kon doim bo'sh ko'rinardi. Endi kech
          // kelgan javobni ham qo'llab, "cloud:updated" orqali sahifani yangilaymiz.
          query.then(({ data, error }) => {
            if (error || !data) return;
            this._cache = {};
            data.forEach((r) => { this._cache[r.key] = r.value; });
            this.mode = "cloud";
            try { window.dispatchEvent(new CustomEvent("cloud:updated")); } catch (e2) {}
          }).catch((e2) => console.error("[Cloud] init (late):", e2));
          return;
        }
        const { data, error } = res;
        if (error) { console.error("[Cloud] init:", error); this.mode = "local"; return; }
        (data || []).forEach((r) => { this._cache[r.key] = r.value; });
      } catch (e) {
        console.error("[Cloud] init (network):", e);
        this.mode = "local";   // server ulanmasa — localStorage'ga qaytamiz
      }
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
      this._lastSet[key] = Date.now();
      if (this.mode === "cloud") {
        this._cache[key] = value;
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

    // ---- Jonli kuzatish: sahifani yangilamasdan yangi xabarlarni olish ----
    // `keys` kalitlarini har `ms` millisekundda serverdan tekshiradi. Qiymat keshdagidan
    // farq qilsa onChange(key, value) chaqiriladi (keshni chaqiruvchi Cloud.adopt bilan
    // yangilaydi). Vkladkaga qaytilganda darrov tekshiradi (fonda brauzer taymerni sekinlatadi).
    watch(keys, onChange, ms = 4000) {
      if (!_sb) return () => {};
      let busy = false;
      const tick = async () => {
        if (busy || this.mode !== "cloud") return;
        busy = true;
        try {
          const { data, error } = await _sb
            .from("app_state").select("key,value")
            .eq("app", this.app).eq("client_id", this.client).in("key", keys);
          if (error || !data) return;
          data.forEach((r) => {
            // O'zimiz yaqinda yozgan kalit — server hali eski qiymatni qaytarishi mumkin
            if (Date.now() - (this._lastSet[r.key] || 0) < 5000) return;
            if (JSON.stringify(r.value) === JSON.stringify(this._cache[r.key])) return;
            try { onChange(r.key, r.value); } catch (e) { console.error("[Cloud] watch:", e); }
          });
        } catch (e) { /* tarmoq xatosi — keyingi safar */ }
        finally { busy = false; }
      };
      const id = setInterval(tick, ms);
      const onVis = () => { if (!document.hidden) tick(); };
      document.addEventListener("visibilitychange", onVis);
      return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
    },

    // Bitta kalitni serverdan YANGIDAN o'qish (keshni ham yangilaydi). Buyurtmalar kabi
    // bir nechta qurilma yozadigan ro'yxatlarda yozishdan oldin chaqiriladi — aks holda
    // eskirgan kesh boshqa mijozning buyurtmasini bosib ketishi mumkin.
    async fetchKey(key, fallback = null) {
      if (!_sb || this.mode !== "cloud") return this.get(key, fallback);
      try {
        const { data, error } = await _sb
          .from("app_state").select("value")
          .eq("app", this.app).eq("client_id", this.client).eq("key", key).maybeSingle();
        if (error) return this.get(key, fallback);
        const v = data ? data.value : fallback;
        this.adopt(key, v);
        return v;
      } catch (e) { return this.get(key, fallback); }
    },

    // Serverdan kelgan qiymatni keshga yozish (serverga QAYTA yubormasdan)
    adopt(key, value) {
      this._cache[key] = value;
      if (this._saveMirror) this._saveMirror(this._cache);
    },

    // O'chirish (localStorage.removeItem o'rnida)
    remove(key) {
      if (this.mode === "cloud") {
        delete this._cache[key];
        _sb.from("app_state").delete()
          .eq("app", this.app).eq("client_id", this.client).eq("key", key)
          .then(({ error }) => { if (error) console.error("[Cloud] remove:", error); });
      } else {
        try { localStorage.removeItem(this._lsKey(key)); } catch (e) {}
      }
    },
  };
})();
