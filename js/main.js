// ===== BiznesOnline — main.js =====
// Umumiy funksiyalar: navigatsiya, animatsiyalar, smooth scroll, toast
'use strict';

document.addEventListener('DOMContentLoaded', () => {

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

    /* ---------- ACTIVE NAVIGATION HIGHLIGHT ---------- */
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinkItems = document.querySelectorAll('.nav-link');

    if (sections.length && navLinkItems.length) {
        const setActive = () => {
            const scrollPos = window.scrollY + 120;
            let current = '';

            sections.forEach(sec => {
                const top = sec.offsetTop;
                const height = sec.offsetHeight;
                if (scrollPos >= top && scrollPos < top + height) {
                    current = sec.id;
                }
            });

            navLinkItems.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === `#${current}`) {
                    link.classList.add('active');
                }
            });
        };
        window.addEventListener('scroll', setActive);
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

});

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
                demoUrl: 'app/index.html',
                adminUrl: 'app/admin.html',
                popular: true,
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'app-salqin',
                slug: 'salqin-ichimliklar',
                name: 'Salqin Ichimliklar',
                desc: 'Ichimliklar do\'koni uchun zamonaviy onlayn-magazin — katalog, savat, buyurtma va to\'liq admin paneli',
                logo: null,
                logoEmoji: '🥤',
                price: 119000,
                priceLabel: 'oyiga',
                features: [
                    'Ichimliklar katalogi',
                    'Savat va buyurtma',
                    'Karta / Click / Naqd to\'lov',
                    'Mijoz bilan jonli chat',
                    'Telegram bot integratsiyasi',
                    'Admin panel (mahsulot, moliya, foydalanuvchilar)'
                ],
                demoUrl: 'salqin-ichimliklar/index.html',
                adminUrl: 'salqin-ichimliklar/admin.html',
                popular: false,
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
                id: 'app-kitob',
                slug: 'kitob-dokoni',
                name: 'Kitob Olami',
                desc: 'Onlayn kitob do\'koni uchun zamonaviy ilova — kitoblar katalogi, muallif va janrlar bo\'yicha qidiruv, savat va to\'liq admin paneli',
                logo: null,
                logoEmoji: '📚',
                price: 129000,
                priceLabel: 'oyiga',
                features: [
                    'Kitoblar katalogi (muallif, janr, ISBN)',
                    'Muqova turi va format tanlash',
                    'Savat va buyurtma tizimi',
                    'Kuponlar va chegirmalar',
                    'Mijoz bilan jonli chat',
                    'Telegram bot integratsiyasi',
                    'Admin panel (kitoblar, hisobot, mijozlar)'
                ],
                demoUrl: 'kitob-dokoni/index.html',
                adminUrl: 'kitob-dokoni/admin.html',
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
            }
        ];

        const APPS_VERSION = 'v3-ovqat-dokoni';
        const savedVersion = localStorage.getItem('bo_apps_version');
        const existing = JSON.parse(localStorage.getItem('bo_apps') || '[]');

        if (existing.length === 0 || savedVersion !== APPS_VERSION) {
            const defaultIds = new Set(defaults.map(d => d.id));
            const userApps = existing.filter(a => !defaultIds.has(a.id));
            localStorage.setItem('bo_apps', JSON.stringify([...defaults, ...userApps]));
            localStorage.setItem('bo_apps_version', APPS_VERSION);
            return;
        }

        let changed = false;
        defaults.forEach(d => {
            if (!existing.find(a => a.id === d.id)) {
                existing.push(d);
                changed = true;
            }
        });
        if (changed) localStorage.setItem('bo_apps', JSON.stringify(existing));
    } catch (e) { console.error(e); }
}

/* ===== ILOVALARNI INDEX SAHIFASIDA RENDER QILISH ===== */
function renderApps() {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;

    let apps = [];
    try { apps = JSON.parse(localStorage.getItem('bo_apps') || '[]'); }
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
        const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
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
        localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
        return true;
    } catch (e) { console.error('boAssignApp', e); return false; }
}

window.boGetApp = function (appId) {
    // Dashboard'da bo'lsa — to'g'ridan-to'g'ri obuna bo'ladi
    if (typeof window.BO_subscribe === 'function') { window.BO_subscribe(appId); return; }

    let apps = [];
    try { apps = JSON.parse(localStorage.getItem('bo_apps') || '[]'); } catch {}
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
