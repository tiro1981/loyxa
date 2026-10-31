// ===== BiznesOnline — main.js =====
// Umumiy funksiyalar: navigatsiya, animatsiyalar, smooth scroll, toast
'use strict';

/* ---------- PAROL XESHLASH (SHA-256, Web Crypto API) ----------
   Parollar endi localStorage'da OCHIQ MATN holida saqlanmaydi. Bu haqiqiy
   server-tomon autentifikatsiya EMAS (butun platforma hali localStorage
   asosida ishlagani uchun — buni Supabase Auth beradi, keyingi bosqich),
   lekin kamida parol qiymati kodda/DevTools'da ochiq ko'rinib turmaydi.
   Eski (xeshlanmagan) yozuvlar bilan ham mos ishlaydi — muvaffaqiyatli
   solishtirilgan zahoti xeshga "yangilab" qo'yiladi (bosqichma-bosqich
   migratsiya, foydalanuvchini qayta ro'yxatdan o'tkazish shart emas). */
const PW_HASH_PREFIX = 'sha256:';
// crypto.subtle faqat "xavfsiz kontekst"da (HTTPS / localhost) mavjud. Sayt oddiy
// HTTP yoki lokal tarmoq IP manzili orqali ochilsa u undefined bo'ladi va login
// "Xato yuz berdi" bilan yiqilardi — shu holat uchun sof-JS SHA-256 zaxirasi.
function _sha256Fallback(bytes) {
    const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const len = bytes.length;
    const total = Math.ceil((len + 9) / 64) * 64;
    const m = new Uint8Array(total);
    m.set(bytes); m[len] = 0x80;
    const bits = len * 8;
    m[total - 4] = (bits >>> 24) & 0xff; m[total - 3] = (bits >>> 16) & 0xff;
    m[total - 2] = (bits >>> 8) & 0xff;  m[total - 1] = bits & 0xff;
    m[total - 5] = Math.floor(bits / 0x100000000) & 0xff;
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < total; o += 64) {
        for (let i = 0; i < 16; i++) w[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
            const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
async function hashPassword(plain) {
    const enc = new TextEncoder().encode(String(plain));
    let hex;
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
        const buf = await crypto.subtle.digest('SHA-256', enc);
        hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } else {
        hex = _sha256Fallback(enc);
    }
    return PW_HASH_PREFIX + hex;
}
// Kiritilgan parolni saqlangan qiymat bilan solishtiradi.
// Qaytaradi: { ok, upgradedHash } — upgradedHash bo'lsa, chaqiruvchi shu
// qiymatni saqlangan joyga yozib qo'yishi kerak (eski oddiy-matn -> xesh).
async function verifyPassword(plain, stored) {
    if (!stored) return { ok: false, upgradedHash: null };
    if (String(stored).startsWith(PW_HASH_PREFIX)) {
        const h = await hashPassword(plain);
        return { ok: h === stored, upgradedHash: null };
    }
    const ok = String(stored) === String(plain);
    return { ok, upgradedHash: ok ? await hashPassword(plain) : null };
}

/* ---------- UMUMIY PLATFORMA MA'LUMOTI (Supabase, js/cloud.js) ----------
   bo_subscriptions, bo_apps, bo_apps_version va h.k. endi Supabase'da
   saqlanadi (barcha admin/mijozlarda bir xil ko'rinadi). Bu fayl
   index.html'da HAM ishlatilgani uchun (u yerda Cloud yuklanmaydi),
   har doim "window.Cloud" borligini tekshirib, bo'lmasa localStorage'ga
   tushamiz — shu bilan index.html buzilmaydi.
   MUHIM: "bo_session" bunga kirmaydi — u atayin har doim shu qurilmada
   (localStorage'da) qoladi. */
function boCloudGet(key, fallback) {
    if (window.Cloud) return Cloud.get(key, fallback);
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
}
function boCloudSet(key, value) {
    if (window.Cloud) { Cloud.set(key, value); return; }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
// Serverdan eng so'nggi ma'lumotni qayta yuklash (login va muhim yozuvlardan oldin).
// Cloud yo'q yoki server javob bermasa — jimgina mavjud kesh bilan davom etiladi.
async function boCloudRefresh() {
    if (!window.Cloud || typeof Cloud.refresh !== 'function') return false;
    try { return await Cloud.refresh(); } catch (e) { console.warn('boCloudRefresh', e); return false; }
}

// Cloud.init() tugagach bu skript DINAMIK ravishda qo'shiladi — shu payt
// DOMContentLoaded allaqachon o'tib ketgan bo'lishi mumkin, shuning uchun
// oddiy addEventListener o'rniga readyState'ni ham tekshiramiz.
function _boMainInit() {

    /* ---------- NAVBAR SCROLL EFFECT ---------- */
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    /* ---------- HAMBURGER MENU ---------- */
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        // Linkni bossangiz menyu yopiladi
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    /* ---------- ACTIVE NAVIGATION + SIRPANUVCHI INDIKATOR ----------
       Barcha havolalar uchun bitta indikator (pill + porloq chiziq): sichqoncha
       qaysi havola ustida bo'lsa o'shanga sirpanadi, ketganda faol bo'limga qaytadi;
       sahifa aylantirilganda bo'limdan bo'limga suzib o'tadi. */
    const navList = document.getElementById('navLinks');
    const navLinkItems = [...document.querySelectorAll('.nav-link')];
    const sectionOf = (link) => {
        const href = link.getAttribute('href') || '';
        return href.startsWith('#') ? document.querySelector(href) : null;
    };

    if (navList && navLinkItems.length) {
        const indicator = document.createElement('span');
        indicator.className = 'nav-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        navList.appendChild(indicator);

        let activeLink = navLinkItems.find(l => l.classList.contains('active')) || null;
        let hoverLink = null;

        const moveTo = (link) => {
            if (!link || !link.offsetWidth) { indicator.classList.remove('on'); return; }
            const pad = 14;
            indicator.style.width = (link.offsetWidth + pad * 2) + 'px';
            indicator.style.transform = `translateX(${link.offsetLeft - pad}px)`;
            indicator.classList.add('on');
            if (!indicator.classList.contains('ready')) {
                // birinchi joylashuv — animatsiyasiz, keyingi harakatlar sirpanadi
                requestAnimationFrame(() => indicator.classList.add('ready'));
            }
        };
        const sync = () => {
            navLinkItems.forEach(l => l.classList.toggle('is-hover', l === hoverLink));
            moveTo(hoverLink || activeLink);
        };

        navLinkItems.forEach(link => {
            link.addEventListener('mouseenter', () => { hoverLink = link; sync(); });
            link.addEventListener('focus', () => { hoverLink = link; sync(); });
            link.addEventListener('blur', () => { hoverLink = null; sync(); });
        });
        navList.addEventListener('mouseleave', () => { hoverLink = null; sync(); });

        const setActive = () => {
            const scrollPos = window.scrollY + 120;
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
            let current = null;
            navLinkItems.forEach(link => {
                const sec = sectionOf(link);
                if (!sec) return;
                const top = sec.getBoundingClientRect().top + window.scrollY;
                if (scrollPos >= top && scrollPos < top + sec.offsetHeight) current = link;
            });
            // Sahifa oxirida (footer qisqa bo'lsa ham) — oxirgi havola ("Bog'lanish")
            if (atBottom) current = navLinkItems.filter(sectionOf).pop() || current;
            if (current === activeLink) return;
            activeLink = current;
            navLinkItems.forEach(l => l.classList.toggle('active', l === activeLink));
            sync();
        };

        window.addEventListener('scroll', setActive, { passive: true });
        window.addEventListener('resize', () => { indicator.classList.remove('ready'); sync(); requestAnimationFrame(() => indicator.classList.add('ready')); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
        setActive();
        sync();
    }

    /* ---------- REVEAL ON SCROLL ---------- */
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

        reveals.forEach(el => observer.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('visible'));
    }

    /* ---------- COUNTER ANIMATION ---------- */
    const counters = document.querySelectorAll('.stat-number[data-target]');
    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target, 10);
        const duration = 1500;
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(eased * target);
            el.textContent = target >= 100 ? `${value}+` : value;
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window && counters.length) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => counterObserver.observe(c));
    }

    /* ---------- SCROLL TO TOP ---------- */
    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- SMOOTH SCROLL (ichki linklar) ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ---------- ILOVALARNI DINAMIK RENDER QILISH ---------- */
    seedDefaultApps();
    renderApps();

}
if (document.readyState !== 'loading') _boMainInit(); else document.addEventListener('DOMContentLoaded', _boMainInit);

/* ===== DEFAULT ILOVALARNI URUG'LASH ===== */
function seedDefaultApps() {
    try {
        const defaults = [
            {
                id: 'app-fastfood',
                slug: 'fastfood',
                name: 'Fast Food Ilovasi',
                desc: 'Restoran va fast food uchun to\'liq tizim — onlayn menyu, buyurtma va alohida boshqaruv dashbordi',
                logo: null,
                logoEmoji: '🍔',
                price: 149000,
                priceLabel: 'oyiga',
                features: [
                    'Onlayn menyu',
                    'Buyurtma berish tizimi',
                    'Yetkazib berish',
                    'QR kod menyu',
                    'Alohida boshqaruv dashbordi'
                ],
                demoUrl: 'fast-food-dokoni/index.html',
                adminUrl: 'fast-food-dokoni/admin.html',
                popular: true,
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'app-kiyim',
                slug: 'kiyim-dokoni',
                name: 'Kiyim Do\'koni',
                desc: 'Moda va kiyim do\'koni uchun zamonaviy onlayn-magazin — katalog, o\'lcham tanlash, savat va to\'liq admin paneli',
                logo: null,
                logoEmoji: '👕',
                price: 139000,
                priceLabel: 'oyiga',
                features: [
                    'Kiyim katalogi va o\'lchamlar',
                    'Savat va buyurtma tizimi',
                    'Kuponlar va chegirmalar',
                    'Mijoz bilan jonli chat',
                    'Telegram bot integratsiyasi',
                    'Admin panel (mahsulot, hisobot, mijozlar)'
                ],
                demoUrl: 'kiyim-dokoni/index.html',
                adminUrl: 'kiyim-dokoni/admin.html',
                popular: false,
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'app-ovqat',
                slug: 'ovqat-dokoni',
                name: 'Ovqat Dokoni',
                desc: 'Oziq-ovqat va yetkazib berish do\'koni uchun zamonaviy ilova — menyu, savat, buyurtma, Telegram bot va QR kod menyu',
                logo: null,
                logoEmoji: '🛒',
                price: 134000,
                priceLabel: 'oyiga',
                features: [
                    'Mahsulotlar katalogi va kategoriyalar',
                    'Savat va buyurtma berish tizimi',
                    'Yetkazib berish va to\'lov usullari',
                    'Mijoz bilan jonli chat',
                    'Telegram bot integratsiyasi',
                    'QR kod menyu (stol va do\'kon uchun)',
                    'Admin panel (mahsulot, buyurtma, moliya, mijozlar)'
                ],
                demoUrl: 'ovqat-dokoni/index.html',
                adminUrl: 'ovqat-dokoni/admin/index.html',
                popular: false,
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'app-kitob',
                slug: 'kitob-dokoni',
                name: 'Bookz — Kitob do\'koni',
                desc: 'Onlayn kitob do\'koni uchun zamonaviy qorong\'u ilova — kitoblar katalogi, muallif va janrlar, savat, buyurtma va to\'liq admin paneli',
                logo: null,
                logoEmoji: '📚',
                price: 129000,
                priceLabel: 'oyiga',
                features: [
                    'Kitoblar katalogi (muallif, janr, reyting)',
                    'Savat va buyurtma tizimi',
                    'Sevimlilar va manzillar',
                    'Mijoz bilan jonli chat',
                    'Telegram bot integratsiyasi',
                    'QR kod (do\'kon uchun)',
                    'Admin panel (kitoblar, hisobot, mijozlar)'
                ],
                demoUrl: 'kitob-dokoni/index.html',
                adminUrl: 'kitob-dokoni/admin.html',
                popular: false,
                active: true,
                createdAt: new Date().toISOString()
            }
        ];

        const APPS_VERSION = 'v12-remove-nura-kosmetika';
        const removedIds = new Set(['app-salqin', 'app-kofe', 'app-lume', 'app-nura']);
        const savedVersion = boCloudGet('bo_apps_version', null);
        const existing = boCloudGet('bo_apps', []);

        if (existing.length === 0 || savedVersion !== APPS_VERSION) {
            const defaultIds = new Set(defaults.map(d => d.id));
            const userApps = existing.filter(a => !defaultIds.has(a.id) && !removedIds.has(a.id));
            boCloudSet('bo_apps', [...defaults, ...userApps]);
            boCloudSet('bo_apps_version', APPS_VERSION);
            return;
        }

        let changed = false;
        defaults.forEach(d => {
            if (!existing.find(a => a.id === d.id)) {
                existing.push(d);
                changed = true;
            }
        });
        if (changed) boCloudSet('bo_apps', existing);
    } catch (e) { console.error(e); }
}

/* ===== ILOVALARNI INDEX SAHIFASIDA RENDER QILISH ===== */
function renderApps() {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;

    let apps = [];
    try { apps = boCloudGet('bo_apps', []); }
    catch { apps = []; }

    const active = apps.filter(a => a.active !== false);

    if (active.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--gray-500);">
                <i class="fa-solid fa-mobile-screen" style="font-size:48px;opacity:0.3;margin-bottom:12px;"></i>
                <h3 style="margin-bottom:6px;">Hozircha ilovalar mavjud emas</h3>
                <p style="font-size:13px;">Administrator yangi ilovalarni admin panelida qo'shadi</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = active.map(app => {
        const logoBlock = app.logo
            ? `<img src="${app.logo}" alt="${escapeHtmlMain(app.name)}" class="app-logo-img">`
            : `<span class="app-logo-emoji">${app.logoEmoji || '📱'}</span>`;

        const freeBlock = `<div class="app-free-tag"><i class="fa-solid fa-gift"></i> <span>Bepul foydalanish</span></div>`;

        const getBtn = `<button type="button" class="btn btn-primary btn-block" onclick="boGetApp('${escapeHtmlMain(app.id)}')"><i class="fa-solid fa-circle-down"></i> Ilovani olish</button>`;

        return `
            <div class="app-card reveal ${app.popular ? 'popular' : ''}" data-app-id="${escapeHtmlMain(app.id)}" style="cursor:pointer;">
                ${app.popular ? `<div class="popular-badge"><i class="fa-solid fa-fire"></i> Mashhur</div>` : ''}
                <div class="app-icon-wrap">${logoBlock}</div>
                <h3 class="app-title">${escapeHtmlMain(app.name)}</h3>
                <p class="app-desc">${escapeHtmlMain(app.desc)}</p>
                ${freeBlock}
                <div class="app-card-actions" onclick="event.stopPropagation()">
                    ${app.demoUrl ? `<a href="${app.demoUrl}" target="_blank" class="btn btn-outline btn-block"><i class="fa-solid fa-eye"></i> Demo versiyasi</a>` : ''}
                    ${getBtn}
                </div>
            </div>
        `;
    }).join('');

    // Karta ustiga bosish — detail modal
    grid.querySelectorAll('.app-card[data-app-id]').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.appId;
            const app = active.find(a => a.id === id);
            if (app) showAppDetailModal(app);
        });
    });

    // Reveal animation re-trigger
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    en.target.classList.add('visible');
                    obs.unobserve(en.target);
                }
            });
        }, { threshold: 0.12 });
        grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    } else {
        grid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }
}

/* ===== ILOVA DETAIL MODAL — global ===== */
window.showAppDetailModal = showAppDetailModal;
function showAppDetailModal(app) {
    const modal = document.getElementById('appDetailModal');
    if (!modal) return;

    const logoBlock = app.logo
        ? `<img src="${app.logo}" alt="${escapeHtmlMain(app.name)}" class="detail-app-logo-img">`
        : `<span class="detail-app-logo-emoji">${app.logoEmoji || '📱'}</span>`;

    const features = (app.features || []).map(f =>
        `<li><i class="fa-solid fa-check"></i> ${escapeHtmlMain(f)}</li>`
    ).join('');

    const priceSection = `<div class="app-free-tag" style="margin-bottom:0">
               <i class="fa-solid fa-gift"></i><span>Mutlaqo bepul</span>
           </div>`;

    const buyBtn = `<button type="button" class="btn btn-primary btn-lg" style="flex:1" onclick="boGetApp('${escapeHtmlMain(app.id)}')"><i class="fa-solid fa-circle-down"></i> Ilovani olish</button>`;

    document.getElementById('appDetailContent').innerHTML = `
        <div class="detail-app-header">
            <div class="detail-app-icon">${logoBlock}</div>
            <div class="detail-app-title-wrap">
                <h2 class="detail-app-name">${escapeHtmlMain(app.name)}</h2>
                ${app.popular ? `<span class="detail-popular-badge"><i class="fa-solid fa-fire"></i> Mashhur</span>` : ''}
            </div>
        </div>

        <div class="detail-app-desc">
            <h4>Ilova haqida</h4>
            <p>${escapeHtmlMain(app.desc)}</p>
        </div>

        ${features ? `
        <div class="detail-app-features">
            <h4>Imkoniyatlar</h4>
            <ul class="app-features detail-features-list">${features}</ul>
        </div>` : ''}

        <div class="detail-app-footer">
            <div class="detail-price-block">
                <span class="detail-price-title">Narxi</span>
                ${priceSection}
            </div>
            <div class="detail-app-actions">
                ${app.demoUrl ? `<a href="${app.demoUrl}" target="_blank" class="btn btn-outline btn-lg"><i class="fa-solid fa-eye"></i> Demo versiyasi</a>` : ''}
                ${buyBtn}
            </div>
        </div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/* ===== ILOVANI BEPUL OLISH (ro'yxatdan o'tish shart) ===== */
function boAssignApp(clientId, app) {
    try {
        const subs = boCloudGet('bo_subscriptions', []);
        const me = subs.find(s => s.id === clientId);
        if (!me) return false;
        me.app = app.slug || app.id;
        me.appId = app.id;
        me.appName = app.name;
        me.appUrl = app.demoUrl || null;
        me.adminUrl = app.adminUrl || null;
        me.slug = app.slug || null;
        me.logoEmoji = app.logoEmoji || null;
        me.price = 0;
        me.status = 'active';
        me.activatedAt = new Date().toISOString();
        boCloudSet('bo_subscriptions', subs);
        return true;
    } catch (e) { console.error('boAssignApp', e); return false; }
}

window.boGetApp = function (appId) {
    // Dashboard'da bo'lsa — to'g'ridan-to'g'ri obuna bo'ladi
    if (typeof window.BO_subscribe === 'function') { window.BO_subscribe(appId); return; }

    let apps = [];
    try { apps = boCloudGet('bo_apps', []); } catch {}
    const app = apps.find(a => a.id === appId);
    if (!app) return;
    const slug = encodeURIComponent(app.slug || app.id);

    let session = null;
    try { session = JSON.parse(localStorage.getItem('bo_session') || 'null'); } catch {}

    // Ro'yxatdan o'tmagan — avval ro'yxatdan o'tkazamiz (ilova eslab qolinadi)
    if (!session || session.type !== 'client') {
        window.showToast && window.showToast('Obuna bo\'lish uchun avval ro\'yxatdan o\'ting', 'info');
        setTimeout(() => { window.location.href = 'kirish.html?tab=register&app=' + slug; }, 600);
        return;
    }

    // Ro'yxatdan o'tgan — dashboard'da avtomatik obuna bo'ladi
    window.location.href = 'dashboard.html?subscribe=' + slug;
};

/* ===== UZS FORMATTER (main uchun) ===== */
function fmtMain(n) {
    return (n || 0).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

function escapeHtmlMain(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/* ===== GLOBAL TOAST FUNCTION ===== */
window.showToast = function(message, type = 'success', duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = type === 'success'
        ? '<i class="fa-solid fa-circle-check"></i>'
        : type === 'error'
            ? '<i class="fa-solid fa-circle-exclamation"></i>'
            : '<i class="fa-solid fa-circle-info"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toast.className = `toast ${type} show`;

    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
};

/* ===== UZS FORMATTER ===== */
window.formatUZS = function(num) {
    return new Intl.NumberFormat('uz-UZ').format(num) + " so'm";
};
