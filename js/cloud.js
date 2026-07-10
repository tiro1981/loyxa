/* ============================================================
   js/cloud.js — Platforma (sayt admin) uchun Supabase KV qatlami
   localStorage o'rnini bosadi, ammo ma'lumot SERVERDA saqlanadi va
   barcha qurilmalarda (va barcha administratorlarda) bir xil ko'rinadi.

   Boshqa ilovalardagi cloud.js bilan BIR XIL "app_state" jadvalidan
   foydalanadi (qarang: SUPABASE/0-SETUP.md), faqat app="platform",
   client="global" bilan — chunki bu ma'lumot (mijozlar ro'yxati, ilovalar
   katalogi, xabarlar, sayt sozlamalari) do'konlarga emas, butun platformaga
   tegishli yagona umumiy joy.

   MUHIM: `bo_session` (joriy tizimga kirgan foydalanuvchi) bu yerga
   kirmaydi — u atayin har bir qurilmada alohida (localStorage'da) qoladi.

   ISHLASH:
   - Sahifa boshida BIR MARTA `await Cloud.init()` chaqiriladi.
   - Cloud.get(key)   — SINXRON (keshdan o'qiydi)
   - Cloud.set(key,v) — keshni yangilab, fonda serverga yozadi
   - Cloud.remove(key)
   ============================================================ */
'use strict';

const SUPABASE_URL = "https://ctakvioxteagcwjlclnu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0YWt2aW94dGVhZ2N3amxjbG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODU1OTEsImV4cCI6MjA5NzI2MTU5MX0.fm8tVEvnWuvA6D2F9I7JqDvqDKgtalbKctqXSVHsCUQ";

window.Cloud = (function () {
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
        app: "platform",
        client: "global",
        mode: _sb ? "cloud" : "local",   // 'cloud' = Supabase; 'local' = localStorage fallback
        _cache: {},

        _lsKey(key) { return "cloud__" + this.app + "__" + this.client + "__" + key; },

        // Sahifa boshida BIR MARTA chaqiriladi (await bilan).
        async init() {
            this._cache = {};
            if (!_sb) {
                this.mode = "local";
                console.warn("[Cloud] Supabase sozlanmagan — localStorage rejimida ishlayapti.");
                return;
            }
            this.mode = "cloud";
            try {
                const res = await this._fetchOnce(4000);
                if (res.__timeout || res.error) {
                    console.warn("[Cloud] init: server javob bermadi — localStorage rejimida davom etamiz.");
                    this.mode = "local";
                    // So'rovni tashlab yubormaymiz — fonda bir necha marta qayta urinamiz;
                    // muvaffaqiyatli bo'lsa "cloud:updated" orqali UI qayta chizib olinadi.
                    this._backgroundRetry();
                    return;
                }
                const c = {};
                (res.data || []).forEach((r) => { c[r.key] = r.value; });
                this._cache = c;
            } catch (e) {
                console.error("[Cloud] init (network):", e);
                this.mode = "local";
                this._backgroundRetry();
            }
        },

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

        async _backgroundRetry() {
            const delays = [2000, 4000, 8000, 15000];
            for (const delay of delays) {
                await new Promise((r) => setTimeout(r, delay));
                const res = await this._fetchOnce(6000);
                if (res.__timeout || res.error || !res.data) continue;
                const c = {};
                res.data.forEach((r2) => { c[r2.key] = r2.value; });
                this._cache = c;
                this.mode = "cloud";
                try { window.dispatchEvent(new CustomEvent("cloud:updated")); } catch (e2) {}
                return;
            }
            console.warn("[Cloud] fon rejimida qayta urinishlar tugadi — server bilan bog'lanib bo'lmadi.");
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
                _sb.from("app_state").delete()
                    .eq("app", this.app).eq("client_id", this.client).eq("key", key)
                    .then(({ error }) => { if (error) console.error("[Cloud] remove:", error); });
            } else {
                try { localStorage.removeItem(this._lsKey(key)); } catch (e) {}
            }
        },

        // Rasm (masalan ilova logotipi) yuklash — Supabase Storage'ga.
        // MUHIM: "app-logos" bucket'i Supabase panelida oldindan (bir marta) yaratilgan
        // bo'lishi kerak (Storage → New bucket → nomi "app-logos", Public: yoqilgan).
        // Bucket hali yo'q yoki xato bo'lsa — null qaytadi, chaqiruvchi shu holda eski
        // base64 usuliga qaytishi kerak (funksionallik buzilmasin deb).
        async uploadImage(blob, filename) {
            if (this.mode !== "cloud" || !_sb) return null;
            try {
                const path = this.client + "/" + Date.now() + "-" + filename.replace(/[^a-zA-Z0-9._-]/g, "_");
                const { error } = await _sb.storage.from("app-logos").upload(path, blob, {
                    contentType: blob.type || "image/jpeg",
                    upsert: true,
                });
                if (error) { console.warn("[Cloud] uploadImage:", error.message || error); return null; }
                const { data } = _sb.storage.from("app-logos").getPublicUrl(path);
                return data && data.publicUrl ? data.publicUrl : null;
            } catch (e) {
                console.warn("[Cloud] uploadImage (network):", e);
                return null;
            }
        },
    };
})();
