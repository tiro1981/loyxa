/* ============================================================
   particles.js — bosh sahifa fonidagi 3D "uchburchak zarrachalar"
   Minglab mayda rangli uchburchaklar sahifa aylantirilganda bir
   shakldan boshqasiga oqib o'tadi:
     hero      -> do'kon binosi
     ilovalar  -> sochilgan "galaktika"
     qanday    -> smartfon
     CTA       -> globus
     footer    -> gul / portlash
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

    // 5) Gul / portlash — 5 ta yaproqli burama shakl
    const BLOOM = build([[1, () => {
        const k = Math.floor(rnd() * 5), t = Math.pow(rnd(), 0.8);
        const a0 = k * Math.PI * 2 / 5, w = Math.sin(Math.PI * t) * 0.55;
        const a = a0 + R(-w, w) * 0.6 + t * 0.9;
        const r = 0.25 + t * 3.0;
        return [Math.cos(a) * r, Math.sin(a) * r, Math.sin(t * Math.PI) * 1.2 * Math.cos(a0 * 2) + R(-.15, .15)];
    }]]);

    const SHAPES = [SHOP, SCATTER, PHONE, GLOBE, BLOOM];

    /* ---------------- Sahifa bo'limlariga bog'lash ----------------
       x/y — sahna markazining siljishi, s — o'lcham, ry — burilish, o — shaffoflik */
    const KEYS = [
        { sel: '#home',    d: { x: 3.4,  y: -0.3,  s: 1.18, ry: -0.6,  o: 1.0  }, m: { x: 0, y: -2.2, s: 0.62, ry: -0.5, o: 0.9 } },
        { sel: '#apps',    d: { x: 0,    y: 0,     s: 1.0,  ry: 0,     o: 0.75 }, m: { x: 0, y: 0,    s: 0.8,  ry: 0,    o: 0.6 } },
        { sel: '#how',     d: { x: 5.3,  y: -0.6,  s: 1.05, ry: -0.5,  o: 0.95 }, m: { x: 0, y: 0.6,  s: 0.75, ry: -0.3, o: 0.5 } },
        { sel: '#contact', d: { x: 0,    y: 0.1,   s: 1.15, ry: 0.3,   o: 0.7  }, m: { x: 0, y: 0,    s: 0.8,  ry: 0.3,  o: 0.5 } },
        { sel: '.footer',  d: { x: 0,    y: 0.4,   s: 1.0,  ry: 0,     o: 0.9  }, m: { x: 0, y: 0.6,  s: 0.75, ry: 0,    o: 0.6 } },
    ];
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
        [0.96, 0.77, 0.26], [0.96, 0.77, 0.26], [0.98, 0.62, 0.25],   // sariq / to'q sariq
        [0.55, 0.36, 0.96], [0.43, 0.36, 1.0],  [0.75, 0.52, 0.99],   // binafsha
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
        const dt = Math.min((now - last) / 1000, 0.05); last = now;
        time += reduceMotion ? 0 : dt;

        const target = scrollProgress();
        prog += (target - prog) * (reduceMotion ? 1 : Math.min(1, dt * 4.5));
        const i0 = Math.min(Math.floor(prog), SHAPES.length - 1), i1 = Math.min(i0 + 1, SHAPES.length - 1);
        const f = prog - i0, A = SHAPES[i0], B = SHAPES[i1];
        const burst = (i0 === i1) ? 0 : 2.4;

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
        const m = mobile() ? 'm' : 'd', ka = KEYS[i0][m], kb = KEYS[i1][m], te = ease(Math.min(1, f * 1.4));
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

    resize();
    requestAnimationFrame(frame);
})();
