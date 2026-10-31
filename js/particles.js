/* ============================================================
   particles.js — bosh sahifa fonidagi 3D "uchburchak zarrachalar"
   Minglab mayda rangli uchburchaklar sahifa aylantirilganda bir
   shakldan boshqasiga oqib o'tadi:
     hero      -> do'kon binosi
     ilovalar  -> tanlangan ilova belgisi
     qanday    -> smartfon
     CTA/footer-> globus (sayyora)
   Har o'tishda zarrachalar avval sochilib, keyin yangi shaklga
   yig'iladi. Sichqoncha bilan sahna biroz buriladi.
   Talab: window.THREE (three.js r128, cdnjs).
   ============================================================ */
(function () {
    'use strict';
    if (!window.THREE) return;

    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = () => window.innerWidth < 768;
    const N = mobile() ? 4200 : 9000;     // zarrachalar soni
    const BIG = mobile() ? 10 : 22;        // suzib yuruvchi katta uchburchaklar

    /* ---------------- Renderer / sahna ---------------- */
    const canvas = document.createElement('canvas');
    canvas.id = 'space-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
        canvas.remove();          // WebGL yo'q — sahifa oddiy qorong'i fon bilan qoladi
        return;
    }
    const DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    /* ---------------- Yordamchilar ---------------- */
    let seed = 1337;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const R = (a, b) => a + (b - a) * rnd();

    // Shakl yasovchi: [og'irlik, (out) => out.push(x,y,z)] ro'yxatidan N ta nuqta
    function build(parts) {
        const total = parts.reduce((s, p) => s + p[0], 0);
        const arr = new Float32Array(N * 3);
        let k = 0;
        parts.forEach(([w, fn], idx) => {
            const cnt = idx === parts.length - 1 ? N - k : Math.round(N * w / total);
            for (let i = 0; i < cnt && k < N; i++, k++) {
                const p = fn();
                arr[k * 3] = p[0]; arr[k * 3 + 1] = p[1]; arr[k * 3 + 2] = p[2];
            }
        });
        // Aralashtiramiz — har bir zarracha shakllar orasida tasodifiy yo'l bosadi
        for (let i = N - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            for (let c = 0; c < 3; c++) { const t = arr[i * 3 + c]; arr[i * 3 + c] = arr[j * 3 + c]; arr[j * 3 + c] = t; }
        }
        return arr;
    }
    const J = (v, a) => v + R(-a, a);
    // To'rtburchak qirralari (x0..x1, y0..y1) z tekisligida
    const rectEdge = (x0, x1, y0, y1, z, j = 0.02) => () => {
        const e = Math.floor(rnd() * 4), t = rnd();
        const x = e < 2 ? x0 + (x1 - x0) * t : (e === 2 ? x0 : x1);
        const y = e < 2 ? (e === 0 ? y0 : y1) : y0 + (y1 - y0) * t;
        return [J(x, j), J(y, j), J(z, j)];
    };
    const rectFill = (x0, x1, y0, y1, z, j = 0.02) => () => [J(R(x0, x1), j), J(R(y0, y1), j), J(z, j)];
    // Quti sirti va qirralari
    function boxSurface(cx, cy, cz, w, h, d) {
        const faces = [[w * h, 'z', 1], [w * h, 'z', -1], [w * d, 'y', 1], [w * d, 'y', -1], [h * d, 'x', 1], [h * d, 'x', -1]];
        const tot = faces.reduce((s, f) => s + f[0], 0);
        return () => {
            let r = rnd() * tot, f = faces[0];
            for (const ff of faces) { r -= ff[0]; if (r <= 0) { f = ff; break; } }
            let x = R(-w / 2, w / 2), y = R(-h / 2, h / 2), z = R(-d / 2, d / 2);
            if (f[1] === 'z') z = f[2] * d / 2; else if (f[1] === 'y') y = f[2] * h / 2; else x = f[2] * w / 2;
            return [cx + x, cy + y, cz + z];
        };
    }
    function boxEdges(cx, cy, cz, w, h, d) {
        return () => {
            const e = Math.floor(rnd() * 12), t = R(-0.5, 0.5), sx = rnd() < .5 ? -1 : 1, sy = rnd() < .5 ? -1 : 1;
            let x, y, z;
            if (e < 4) { x = t * w; y = sx * h / 2; z = sy * d / 2; }
            else if (e < 8) { y = t * h; x = sx * w / 2; z = sy * d / 2; }
            else { z = t * d; x = sx * w / 2; y = sy * h / 2; }
            return [cx + J(x, .015), cy + J(y, .015), cz + J(z, .015)];
        };
    }

    /* ---------------- Shakllar ---------------- */
    // 1) Do'kon: bino, tom, peshtoq (yo'l-yo'l soyabon), vitrina, eshik, yer
    const SHOP = build([
        [26, boxSurface(0, -0.35, 0, 4, 2.3, 1.8)],
        [10, boxEdges(0, -0.35, 0, 4, 2.3, 1.8)],
        [6,  boxSurface(0, 0.92, 0, 4.4, 0.24, 2.1)],
        [5,  rectEdge(-1.3, 1.3, 1.1, 1.65, 0.93)],           // peshlavha
        [3,  rectFill(-1.1, 1.1, 1.22, 1.52, 0.93, .01)],
        [16, () => {                                            // soyabon — yo'l-yo'l
            for (;;) {
                const u = R(-1.9, 1.9), t = rnd();
                const stripe = Math.floor((u + 1.9) / 0.38);
                if (stripe % 2 === 0 || rnd() < 0.18) return [u, 0.62 - t * 0.55, 0.9 + t * 0.75];
            }
        }],
        [5,  () => { const u = R(-1.9, 1.9), a = R(0, Math.PI); const s = ((u + 1.9) % 0.38) - 0.19; return [u, 0.07 - Math.sin(a) * 0.12 * (1 - Math.abs(s) * 4), 1.65]; }],
        [8,  rectEdge(-1.75, 0.15, -1.25, 0.2, 0.91)],         // vitrina
        [4,  rectFill(-1.7, 0.1, -1.2, 0.15, 0.91, .01)],
        [6,  rectEdge(0.55, 1.45, -1.5, 0.3, 0.91)],           // eshik
        [7,  () => { const a = R(0, Math.PI * 2), r = Math.sqrt(rnd()) * 3.1; return [Math.cos(a) * r, -1.55, Math.sin(a) * r * 0.55 + 0.4]; }],
        [4,  () => [J(1.95 + R(0, .05), .02), R(-1.5, 0.6), J(1.1, .02)]], // chiroq ustuni
    ]);

    // 2) Sochilish — keng "galaktika"
    const SCATTER = build([[1, () => [R(-9, 9), R(-5.5, 5.5), R(-7, 3)]]]);

    // 3) Smartfon: korpus, ekran, ilova qatorlari
    const PHONE = (() => {
        const W = 2.1, H = 4.1, D = 0.26;
        const rr = (t) => {                                     // yumaloq burchakli konturda nuqta
            const per = 2 * (W + H), s = t * per; let x, y;
            if (s < W) { x = -W / 2 + s; y = H / 2; }
            else if (s < W + H) { x = W / 2; y = H / 2 - (s - W); }
            else if (s < 2 * W + H) { x = W / 2 - (s - W - H); y = -H / 2; }
            else { x = -W / 2; y = -H / 2 + (s - 2 * W - H); }
            const cr = 0.32, ex = Math.max(Math.abs(x) - (W / 2 - cr), 0), ey = Math.max(Math.abs(y) - (H / 2 - cr), 0);
            if (ex > 0 && ey > 0) { const a = Math.atan2(ey, ex), l = cr; x = Math.sign(x) * (W / 2 - cr + Math.cos(a) * l); y = Math.sign(y) * (H / 2 - cr + Math.sin(a) * l); }
            return [x, y];
        };
        return build([
            [22, () => { const [x, y] = rr(rnd()); return [x, y, D / 2]; }],
            [12, () => { const [x, y] = rr(rnd()); return [x, y, -D / 2]; }],
            [8,  () => { const [x, y] = rr(rnd()); return [x, y, R(-D / 2, D / 2)]; }],
            [5,  rectEdge(-0.35, 0.35, 1.78, 1.92, D / 2 + .01, .01)],          // "orol"
            [9,  rectFill(-0.85, 0.85, 1.25, 1.6, D / 2 + .01, .01)],           // sarlavha paneli
            [10, rectEdge(-0.85, -0.05, 0.1, 1.05, D / 2 + .01, .01)],          // mahsulot kartalari
            [10, rectEdge(0.05, 0.85, 0.1, 1.05, D / 2 + .01, .01)],
            [8,  rectEdge(-0.85, -0.05, -1.0, -0.05, D / 2 + .01, .01)],
            [8,  rectEdge(0.05, 0.85, -1.0, -0.05, D / 2 + .01, .01)],
            [6,  rectFill(-0.85, 0.85, -1.75, -1.4, D / 2 + .01, .01)],         // "Buyurtma" tugmasi
            [4,  rectFill(-0.95, 0.95, -1.95, 1.95, -D / 2 - .01, .3)],
        ]);
    })();

    // 4) Globus: kenglik/uzunlik chiziqlari + "qit'alar" + orbita
    const GLOBE = (() => {
        const Rg = 2.5;
        const sph = (th, ph, r = Rg) => [r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)];
        return build([
            [18, () => { const lat = (Math.floor(rnd() * 9) + 1) * Math.PI / 10; return sph(lat + R(-.01, .01), R(0, Math.PI * 2)); }],
            [18, () => { const lon = Math.floor(rnd() * 12) * Math.PI / 6; return sph(R(0.05, Math.PI - .05), lon + R(-.01, .01)); }],
            [44, () => {
                for (let i = 0; i < 30; i++) {
                    const th = Math.acos(R(-1, 1)), ph = R(0, Math.PI * 2);
                    const n = Math.sin(th * 3.1 + 1.3) * Math.sin(ph * 2.0 + 0.4) + 0.6 * Math.sin(ph * 5.0 + th * 2.0);
                    if (n > 0.35) return sph(th, ph, Rg * R(0.99, 1.02));
                }
                return sph(Math.acos(R(-1, 1)), R(0, Math.PI * 2));
            }],
            [20, () => { const a = R(0, Math.PI * 2), r = R(3.2, 3.6); return [Math.cos(a) * r, Math.sin(a) * r * 0.22 + R(-.05, .05), Math.sin(a) * r * 0.9]; }],
        ]);
    })();

    /* ---------------- Ilova belgilari (ilovalar bo'limi) ---------------- */
    const seg = (a, b, j = 0.02) => () => { const t = rnd(); return [J(a[0] + (b[0] - a[0]) * t, j), J(a[1] + (b[1] - a[1]) * t, j), J(a[2] + (b[2] - a[2]) * t, j)]; };
    const segs = (list, j) => { const fs = list.map(([a, b]) => seg(a, b, j)); const L = list.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); const T = L.reduce((x, y) => x + y, 0);
        return () => { let r = rnd() * T; for (let i = 0; i < fs.length; i++) { r -= L[i]; if (r <= 0) return fs[i](); } return fs[0](); }; };
    const disc = (cy, r, h, squash = 1) => () => {   // yassi silindr (ustki/pastki yuz + yon)
        const a = R(0, Math.PI * 2), k = rnd();
        if (k < 0.45) { const rr = r * Math.sqrt(rnd()); return [Math.cos(a) * rr, cy + h / 2, Math.sin(a) * rr * squash]; }
        if (k < 0.6)  { const rr = r * Math.sqrt(rnd()); return [Math.cos(a) * rr, cy - h / 2, Math.sin(a) * rr * squash]; }
        return [Math.cos(a) * r, cy + R(-h / 2, h / 2), Math.sin(a) * r * squash];
    };

    // Burger (Fast Food): kunjutli ustki non, salat, pishloq, kotlet, pastki non
    const BURGER = build([
        [30, () => { const a = R(0, Math.PI * 2), ph = Math.acos(rnd()) ; const r = 2.25; return [Math.cos(a) * Math.sin(ph) * r, 0.75 + Math.cos(ph) * 1.15, Math.sin(a) * Math.sin(ph) * r]; }],
        [4,  () => { const a = R(0, Math.PI * 2), ph = Math.acos(R(0.35, 1)); const r = 2.3; return [J(Math.cos(a) * Math.sin(ph) * r, .03), 0.75 + Math.cos(ph) * 1.2, J(Math.sin(a) * Math.sin(ph) * r, .03)]; }],
        [12, () => { const a = R(0, Math.PI * 2); const r = 2.45 + Math.sin(a * 9) * 0.18; return [Math.cos(a) * r, 0.55 + Math.sin(a * 13) * 0.06, Math.sin(a) * r]; }],
        [10, () => { const x = R(-2.2, 2.2), z = R(-2.2, 2.2); const drip = (Math.abs(x) > 1.9 || Math.abs(z) > 1.9) && rnd() < .5 ? R(0, .35) : 0; return [x, 0.35 - drip, z]; }],
        [20, disc(0.0, 2.35, 0.55)],
        [24, () => { const a = R(0, Math.PI * 2), k = rnd(); const r = 2.25;
            if (k < 0.5) { const rr = r * Math.sqrt(rnd()); return [Math.cos(a) * rr, -0.75, Math.sin(a) * rr]; }
            return [Math.cos(a) * r, R(-0.75, -0.3), Math.sin(a) * r]; }],
    ]);

    // Futbolka (Moda): kontur (old va orqa), yoqa, chok chiziqlari
    const TSHIRT = (() => {
        const P = [[-0.65, 2.0], [-2.3, 1.45], [-2.85, 0.35], [-1.9, -0.05], [-1.6, 0.5], [-1.6, -2.3], [1.6, -2.3], [1.6, 0.5], [1.9, -0.05], [2.85, 0.35], [2.3, 1.45], [0.65, 2.0]];
        const outline = (z) => { const L = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (i === P.length - 1) continue; L.push([[a[0], a[1], z], [b[0], b[1], z]]); } return L; };
        const collar = (z) => () => { const a = R(Math.PI * 1.05, Math.PI * 1.95); return [Math.cos(a) * 0.65, 2.0 + Math.sin(a) * 0.55, z]; };
        const inside = () => { for (;;) { const x = R(-2.85, 2.85), y = R(-2.3, 2.0);
            if (Math.abs(x) <= 1.6 && y <= 1.85 && !(y > 1.45 && Math.abs(x) < 0.65 - (2.0 - y) * 0.2)) return [x, y];
            if (Math.abs(x) > 1.6 && y > -0.05 + (Math.abs(x) - 1.9) * 0.4 && y < 1.45 - (Math.abs(x) - 2.3) * 2 && y < 1.75) return [x, y]; } };
        return build([
            [30, segs(outline(0.18), .02)], [14, segs(outline(-0.18), .02)],
            [8, collar(0.18)], [3, collar(-0.18)],
            [6, segs([[[-1.6, 0.5, 0.19], [-1.6, 1.7, 0.19]], [[1.6, 0.5, 0.19], [1.6, 1.7, 0.19]]], .015)],
            [26, () => { const [x, y] = inside(); return [x, y, 0.18]; }],
            [13, () => { const [x, y] = inside(); return [x, y, -0.18]; }],
        ]);
    })();

    // Savat (Ovqat): trapetsiya to'rli savat, tutqich, g'ildiraklar
    const CART = (() => {
        const D = 1.4;
        const L = [];
        for (const z of [D / 2, -D / 2]) {
            L.push([[-2.0, 1.2, z], [2.2, 1.2, z]], [[-1.6, -0.8, z], [1.8, -0.8, z]], [[-2.0, 1.2, z], [-1.6, -0.8, z]], [[2.2, 1.2, z], [1.8, -0.8, z]]);
            for (let k = 1; k < 6; k++) { const t = k / 6; L.push([[-2.0 + 0.4 * t, 1.2 - 2.0 * t, z], [2.2 - 0.4 * t, 1.2 - 2.0 * t, z]]); }
            for (let k = 1; k < 8; k++) { const t = k / 8; L.push([[-2.0 + 4.2 * t, 1.2, z], [-1.6 + 3.4 * t, -0.8, z]]); }
        }
        for (const [x, y] of [[-2.0, 1.2], [2.2, 1.2], [-1.6, -0.8], [1.8, -0.8]]) L.push([[x, y, D / 2], [x, y, -D / 2]]);
        L.push([[-2.0, 1.2, 0], [-2.7, 1.9, 0]], [[-2.7, 1.9, 0], [-3.3, 1.9, 0]]);     // tutqich
        L.push([[-1.6, -0.8, 0], [-1.4, -1.35, 0]], [[1.8, -0.8, 0], [1.6, -1.35, 0]], [[-1.4, -1.35, 0], [1.6, -1.35, 0]]);
        const wheel = (cx) => () => { const a = R(0, Math.PI * 2), r = 0.32; return [cx + Math.cos(a) * r, -1.75 + Math.sin(a) * r, J(0, .06)]; };
        return build([[78, segs(L, .02)], [6, wheel(-1.2)], [6, wheel(1.3)],
            [10, () => [R(-1.3, 1.5), R(1.25, 1.9), R(-.4, .4)]]]);              // ichidagi mahsulotlar
    })();

    // Ochiq kitob (Kitob): egilgan ikki sahifa, matn qatorlari, muqova
    const BOOK = (() => {
        // sahifa o'rtasi biroz ko'tarilgan (egilgan qog'oz)
        const page = () => (x, y) => { const u = Math.abs(x) / 2.6; return [x, y, Math.sin(u * Math.PI) * 0.45]; };
        const surf = (side) => () => { const x = side * R(0.05, 2.6), y = R(-1.8, 1.8); return page(side)(x, y); };
        const lines = (side) => () => { const row = Math.floor(rnd() * 9), y = 1.4 - row * 0.34, x = side * R(0.35, 2.3); return page(side)(J(x, .01), J(y, .01)).map((v, i) => i === 2 ? v + 0.02 : v); };
        const edge = (side) => () => { const k = rnd(); const x = k < .5 ? side * R(0.05, 2.6) : side * 2.6, y = k < .5 ? (rnd() < .5 ? 1.8 : -1.8) : R(-1.8, 1.8); return page(side)(x, y); };
        return build([
            [18, surf(-1)], [18, surf(1)], [14, lines(-1)], [14, lines(1)], [10, edge(-1)], [10, edge(1)],
            [6, () => [J(0, .03), R(-1.85, 1.85), J(-0.05, .03)]],                       // umurtqa
            [10, () => { const x = R(-2.75, 2.75), u = Math.abs(x) / 2.6; return [x, rnd() < .5 ? -1.95 : R(-1.95, -1.9), Math.sin(Math.min(u, 1) * Math.PI) * 0.45 - 0.25]; }], // muqova
        ]);
    })();

    // Qahva finjoni (Kofe): devor, chet, qahva yuzasi, tutqich, likopcha, bug'
    const CUP = build([
        [34, () => { const a = R(0, Math.PI * 2), t = rnd(); const r = 1.15 + 0.45 * t; return [Math.cos(a) * r, -1.1 + t * 2.2, Math.sin(a) * r]; }],
        [10, () => { const a = R(0, Math.PI * 2); return [Math.cos(a) * 1.6, 1.1, Math.sin(a) * 1.6]; }],
        [8,  () => { const a = R(0, Math.PI * 2), rr = 1.5 * Math.sqrt(rnd()); return [Math.cos(a) * rr, 0.85, Math.sin(a) * rr]; }],
        [12, () => { const a = R(-Math.PI / 2, Math.PI / 2); return [1.6 + Math.cos(a) * 0.55, 0.1 + Math.sin(a) * 0.55, J(0, .06)]; }],
        [22, () => { const a = R(0, Math.PI * 2), rr = 2.6 * Math.sqrt(rnd()); return [Math.cos(a) * rr, -1.25, Math.sin(a) * rr * 0.9]; }],
        [14, () => { const k = Math.floor(rnd() * 3), y = R(1.4, 3.0); return [(k - 1) * 0.55 + Math.sin(y * 3 + k) * 0.18, y, J(0, .05)]; }],
    ]);

    const APP_SHAPES = { ovqat: CART, fastfood: BURGER, kiyim: TSHIRT, kitob: BOOK, kofe: CUP };
    // Ilovalar bo'limidagi "jonli" slot: tanlangan ilova belgisi (o'tishda aralashma)
    const APP_SLOT = new Float32Array(CART);
    let appFrom = CART, appTo = CART, appT = 1;

    const SHAPES = [SHOP, APP_SLOT, PHONE, GLOBE];

    /* ---------------- Sahifa bo'limlariga bog'lash ----------------
       x/y — sahna markazining siljishi, s — o'lcham, ry — burilish, o — shaffoflik */
    const KEYS = [
        { sel: '#home',    d: { x: 3.4,  y: -0.3,  s: 1.18, ry: -0.6,  o: 1.0  }, m: { x: 0, y: -2.2, s: 0.62, ry: -0.5, o: 0.9 } },
        { sel: '#apps',    anchor: '#apps .as-visual', ry: -0.35, d: { x: -3.2, y: 0, s: 0.95, ry: -0.35, o: 1 }, m: { x: 0, y: 1.6, s: 0.55, ry: -0.3, o: 1 } },
        { sel: '#how',     d: { x: 5.3,  y: -0.6,  s: 1.05, ry: -0.5,  o: 0.95 }, m: { x: 0, y: 0.6,  s: 0.75, ry: -0.3, o: 0.5 } },
        { sel: '#finale',  d: { x: 0,    y: 0.1,   s: 1.15, ry: 0.3,   o: 0.7  }, m: { x: 0, y: 0,    s: 0.8,  ry: 0.3,  o: 0.5 } },
    ];
    /* ---------------- Avtomatik rejim (aylantirilmaydigan sahifalar) ----------------
       <body data-particles="auto"> — shakllar vaqt bo'yicha almashadi. Sahna
       [data-particles-anchor] elementi markaziga joylashadi; u ko'rinmasa —
       ekran markazida, xiraroq turadi. */
    const AUTO = document.body.dataset.particles === 'auto';
    const AUTO_SEQ = [0, 2, 3];                    // do'kon -> smartfon -> globus
    const AUTO_HOLD = 4.2, AUTO_MORPH = 2.6;       // soniya
    // Element markazi -> sahna koordinatasi (o'lchami ham elementga mos)
    function placeAt(el, ry, o) {
        const r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
        if (!r || r.width < 40 || r.height < 40) return null;
        const vw = window.innerWidth, vh = window.innerHeight;
        const visH = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z, visW = visH * vw / vh;
        return {
            x: ((r.left + r.width / 2) / vw - 0.5) * visW,
            y: -((r.top + r.height / 2) / vh - 0.5) * visH,
            s: Math.min(1.15, (r.width / vw) * visW / 5.8, (r.height / vh) * visH / 5.0),
            ry, o,
        };
    }
    function keyPlace(k, m) {
        if (k.anchor) { const p = placeAt(document.querySelector(k.anchor), k.ry || 0, k[m].o); if (p) return p; }
        return k[m];
    }
    function autoPlace() {
        const vw = window.innerWidth, vh = window.innerHeight;
        const visH = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z, visW = visH * vw / vh;
        const el = document.querySelector('[data-particles-anchor]');
        const r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
        // <body data-particles-opacity="0.3"> — kartalar ko'p sahifalarda fon xiraroq
        const dim = parseFloat(document.body ? document.body.dataset.particlesOpacity : '');
        if (!r || r.width < 40 || r.height < 40) return { x: 0, y: 0, s: mobile() ? 0.7 : 0.9, ry: -0.45, o: isNaN(dim) ? 0.42 : dim };
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        return {
            x: (cx / vw - 0.5) * visW,
            y: -(cy / vh - 0.5) * visH,
            // globus orbitasi bilan ~7.2 birlik keng — shakl joyiga to'liq sig'sin
            s: Math.min(1.0, (r.width / vw) * visW / 7.4, (r.height / vh) * visH / 6.2),
            ry: -0.5, o: isNaN(dim) ? 1 : dim,
        };
    }

    let anchors = [];
    function measure() {
        const vh = window.innerHeight, maxS = document.documentElement.scrollHeight - vh;
        anchors = KEYS.map((k, i) => {
            const el = document.querySelector(k.sel);
            if (!el || i === 0) return 0;
            const r = el.getBoundingClientRect(), top = r.top + window.scrollY;
            return Math.min(maxS, Math.max(0, top + r.height / 2 - vh / 2));
        });
        for (let i = 1; i < anchors.length; i++) if (anchors[i] <= anchors[i - 1]) anchors[i] = anchors[i - 1] + 1;
    }
    function scrollProgress() {
        const y = window.scrollY;
        if (y <= anchors[0]) return 0;
        for (let i = 0; i < anchors.length - 1; i++) {
            if (y < anchors[i + 1]) return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
        }
        return anchors.length - 1;
    }

    /* ---------------- Zarrachalar geometriyasi ---------------- */
    const PALETTE = [
        [0.38, 0.65, 0.98], [0.49, 0.83, 0.99], [0.30, 0.45, 0.95],   // ko'k / havorang (oldin sariq)
        [0.27, 0.35, 0.94], [0.35, 0.42, 0.96], [0.56, 0.61, 1.0],   // indigo-ko'k
        [0.18, 0.83, 0.75], [0.37, 0.92, 0.83],                       // firuza
        [0.95, 0.95, 1.0],  [0.95, 0.95, 1.0],  [0.93, 0.45, 0.70],   // oq / pushti
    ];
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N),
          rot = new Float32Array(N), delay = new Float32Array(N), dir = new Float32Array(N * 3), phase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        const c = PALETTE[Math.floor(rnd() * PALETTE.length)], b = R(0.75, 1.05);
        col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
        size[i] = rnd() < 0.06 ? R(2.2, 3.4) : R(0.7, 1.6);
        rot[i] = R(0, Math.PI * 2);
        delay[i] = rnd() * 0.38;
        phase[i] = R(0, Math.PI * 2);
        const a = R(0, Math.PI * 2), z = R(-1, 1), q = Math.sqrt(1 - z * z);
        dir[i * 3] = q * Math.cos(a); dir[i * 3 + 1] = q * Math.sin(a); dir[i * 3 + 2] = z;
        pos[i * 3] = SHOP[i * 3]; pos[i * 3 + 1] = SHOP[i * 3 + 1]; pos[i * 3 + 2] = SHOP[i * 3 + 2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('rot', new THREE.BufferAttribute(rot, 1));

    // Har bir nuqta — aylanuvchi uchburchak konturi (fragment shaderda chiziladi)
    const VERT = `
        attribute vec3 color; attribute float size; attribute float rot;
        uniform float uTime; uniform float uPx;
        varying vec3 vColor; varying float vRot; varying float vFade;
        void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = size * uPx * (12.0 / -mv.z);
            vColor = color;
            vRot = rot + uTime * (fract(rot * 3.7) - 0.5) * 1.2;
            vFade = clamp(1.25 - (-mv.z - 8.0) / 14.0, 0.2, 1.0);
        }`;
    const FRAG = `
        precision mediump float;
        uniform float uOpacity; uniform float uLine;
        varying vec3 vColor; varying float vRot; varying float vFade;
        float sdTri(vec2 p, float r) {
            const float k = 1.7320508;
            p.x = abs(p.x) - r; p.y = p.y + r / k;
            if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
            p.x -= clamp(p.x, -2.0 * r, 0.0);
            return -length(p) * sign(p.y);
        }
        void main() {
            vec2 p = gl_PointCoord * 2.0 - 1.0; p.y = -p.y;
            float c = cos(vRot), s = sin(vRot);
            p = mat2(c, -s, s, c) * p;
            float d = abs(sdTri(p, 0.58)) - uLine;
            float a = 1.0 - smoothstep(0.0, 0.10, d);
            if (a < 0.03) discard;
            gl_FragColor = vec4(vColor, a * vFade * uOpacity);
        }`;
    const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        uniforms: { uTime: { value: 0 }, uPx: { value: 0 }, uOpacity: { value: 1 }, uLine: { value: 0.09 } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    /* ---------------- Suzib yuruvchi katta uchburchaklar ---------------- */
    const bPos = new Float32Array(BIG * 3), bCol = new Float32Array(BIG * 3), bSize = new Float32Array(BIG), bRot = new Float32Array(BIG), bBase = [];
    for (let i = 0; i < BIG; i++) {
        const c = PALETTE[Math.floor(rnd() * PALETTE.length)];
        bCol.set(c, i * 3);
        bSize[i] = R(5, 11);
        bRot[i] = R(0, Math.PI * 2);
        bBase.push({ x: R(-9, 9), y: R(-6, 6), z: R(-4, 4), sp: R(0.15, 0.4), ph: R(0, 6.28) });
    }
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3).setUsage(THREE.DynamicDrawUsage));
    bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
    bGeo.setAttribute('size', new THREE.BufferAttribute(bSize, 1));
    bGeo.setAttribute('rot', new THREE.BufferAttribute(bRot, 1));
    const bMat = mat.clone();
    bMat.uniforms = { uTime: { value: 0 }, uPx: { value: 0 }, uOpacity: { value: 0.7 }, uLine: { value: 0.035 } };
    const bigPts = new THREE.Points(bGeo, bMat);
    scene.add(bigPts);

    /* ---------------- O'lcham / hodisalar ---------------- */
    function resize() {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const px = h * DPR / 900;               // ekran balandligiga mos nuqta o'lchami
        mat.uniforms.uPx.value = 3.1 * px;
        bMat.uniforms.uPx.value = 2.1 * px;
        measure();
    }
    window.addEventListener('resize', resize);
    window.addEventListener('load', measure);
    setTimeout(measure, 1500);                    // dinamik bo'limlar (ilovalar) yuklangach

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', (e) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    /* ---------------- Animatsiya ---------------- */
    const ease = (t) => t * t * (3 - 2 * t);
    const lerp = (a, b, t) => a + (b - a) * t;
    let prog = 0, running = true, last = performance.now(), time = 0;
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) { last = performance.now(); requestAnimationFrame(frame); }
    });

    function frame(now) {
        if (!running) return;
        // rAF vaqti performance.now() dan oldin bo'lishi mumkin — manfiy dt bo'lmasin
        const dt = Math.max(0, Math.min((now - last) / 1000, 0.05)); last = now;
        time += reduceMotion ? 0 : dt;

        let A, B, f, burst, ka, kb;
        const m = mobile() ? 'm' : 'd';
        if (AUTO) {
            // Avtomatik rejim: shakllar vaqt bo'yicha navbat bilan almashadi
            const per = AUTO_HOLD + AUTO_MORPH, loop = per * AUTO_SEQ.length, c = ((time % loop) + loop) % loop;
            const k = Math.floor(c / per), within = c - k * per;
            f = within < AUTO_HOLD ? 0 : (within - AUTO_HOLD) / AUTO_MORPH;
            A = SHAPES[AUTO_SEQ[k]]; B = SHAPES[AUTO_SEQ[(k + 1) % AUTO_SEQ.length]];
            burst = f > 0 ? 2.4 : 0;
            ka = kb = autoPlace();
        } else {
            const target = scrollProgress();
            prog += (target - prog) * (reduceMotion ? 1 : Math.min(1, dt * 4.5));
            const i0 = Math.min(Math.floor(prog), SHAPES.length - 1), i1 = Math.min(i0 + 1, SHAPES.length - 1);
            f = prog - i0; A = SHAPES[i0]; B = SHAPES[i1];
            burst = (i0 === i1) ? 0 : 2.4;
            ka = keyPlace(KEYS[i0], m); kb = keyPlace(KEYS[i1], m);
        }

        if (appT < 1) {
            appT = Math.min(1, appT + dt / 1.5);
            for (let i = 0; i < N; i++) {
                let t = (appT - delay[i]) / 0.62; t = t < 0 ? 0 : t > 1 ? 1 : t;
                const e = ease(t), bump = Math.sin(Math.PI * t) * 1.6, j = i * 3;
                APP_SLOT[j]     = appFrom[j]     + (appTo[j]     - appFrom[j])     * e + dir[j]     * bump;
                APP_SLOT[j + 1] = appFrom[j + 1] + (appTo[j + 1] - appFrom[j + 1]) * e + dir[j + 1] * bump;
                APP_SLOT[j + 2] = appFrom[j + 2] + (appTo[j + 2] - appFrom[j + 2]) * e + dir[j + 2] * bump;
            }
        }

        for (let i = 0; i < N; i++) {
            let t = (f - delay[i]) / 0.62;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            const e = ease(t), bump = Math.sin(Math.PI * t) * burst;
            const w = reduceMotion ? 0 : Math.sin(time * 0.9 + phase[i]) * 0.035;
            const j = i * 3;
            pos[j]     = A[j]     + (B[j]     - A[j])     * e + dir[j]     * bump + w;
            pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * e + dir[j + 1] * bump + w;
            pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * e + dir[j + 2] * bump;
        }
        geo.attributes.position.needsUpdate = true;

        // Sahna joylashuvi: ikki bo'lim o'rtasida silliq o'tadi
        const te = ease(Math.min(1, f * 1.4));
        mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
        group.position.set(lerp(ka.x, kb.x, te), lerp(ka.y, kb.y, te), 0);
        group.scale.setScalar(lerp(ka.s, kb.s, te));
        group.rotation.y = lerp(ka.ry, kb.ry, te) + Math.sin(time * 0.25) * 0.25 + mouse.x * 0.35;
        group.rotation.x = 0.12 + mouse.y * 0.18;
        mat.uniforms.uOpacity.value = lerp(ka.o, kb.o, te);
        mat.uniforms.uTime.value = time;

        for (let i = 0; i < BIG; i++) {
            const b = bBase[i];
            let y = b.y + time * b.sp * 0.4 - window.scrollY * 0.002 * (1 + b.sp);
            y = ((y + 7) % 14 + 14) % 14 - 7;
            bPos[i * 3] = b.x + Math.sin(time * b.sp + b.ph) * 0.6 + mouse.x * 0.4 * b.sp;
            bPos[i * 3 + 1] = y;
            bPos[i * 3 + 2] = b.z;
        }
        bGeo.attributes.position.needsUpdate = true;
        bMat.uniforms.uTime.value = time;

        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    }

    // Tashqi boshqaruv: ilovalar bo'limi tanlangan ilovani shu orqali bildiradi
    window.BOParticles = {
        setApp(key) {
            const target = APP_SHAPES[key];
            if (!target || target === appTo) return;
            appFrom = new Float32Array(APP_SLOT);   // joriy holatdan (o'tish o'rtasida ham) boshlaymiz
            appTo = target;
            appT = reduceMotion ? 1 : 0;
            if (reduceMotion) APP_SLOT.set(target);
        },
    };

    resize();
    requestAnimationFrame(frame);
})();
