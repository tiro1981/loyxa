// ===== BiznesOnline — Mijoz Dashbordi =====
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- SESSIYANI TEKSHIRISH ---------- */
    let session = null;
    try { session = JSON.parse(localStorage.getItem('bo_session') || 'null'); } catch {}

    if (!session || session.type !== 'client') {
        window.location.replace('kirish.html');
        return;
    }

    const resolvedClientId = session.clientId || session.id;

    let client = null;
    try {
        const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
        client = subs.find(s => s.id === resolvedClientId);
    } catch {}

    if (!client) {
        window.location.replace('kirish.html');
        return;
    }

    /* ---------- OBUNA HOLATINI ANIQLASH ---------- */
    // Mijozning faol obunasi bormi?
    const hasActiveSubscription = !!(client.app && client.status === 'active');

    const noSubWrap     = document.getElementById('noSubWrap');
    const marketplaceWrap = document.getElementById('marketplaceWrap');
    const activeSubWrap = document.getElementById('activeSubWrap');
    const subOnlyLinks  = document.querySelectorAll('.side-link-subonly');

    function showView(view) {
        // Hidden vs visible — view ga qarab
        if (view === 'marketplace') {
            noSubWrap.style.display = 'none';
            marketplaceWrap.style.display = 'block';
            activeSubWrap.style.display = 'none';
            renderMarketplace();
        } else if (view === 'home') {
            marketplaceWrap.style.display = 'none';
            if (hasActiveSubscription) {
                noSubWrap.style.display = 'none';
                activeSubWrap.style.display = 'block';
            } else {
                activeSubWrap.style.display = 'none';
                noSubWrap.style.display = 'block';
                renderNoSubApps();
            }
        } else if (view === 'app' && hasActiveSubscription) {
            openInNewTab(appUrl);
        } else if (view === 'subscription') {
            // Obuna bo'limi — agar obuna bo'lsa active wrap, bo'lmasa marketplace
            if (hasActiveSubscription) {
                showView('home');
            } else {
                showView('marketplace');
            }
        } else {
            window.showToast?.(`Bu bo'lim tez orada qo'shiladi`, 'info');
        }
    }

    // Obuna yo'q bo'lsa "Mening ilovam" linkini yashirish
    subOnlyLinks.forEach(link => {
        link.style.display = hasActiveSubscription ? '' : 'none';
    });

    /* ---------- APP / ADMIN URL LAR (nisbiy yo'l) ---------- */
    // Chrome / Safari / Android Studio / VS Code Live Server da bir xil ishlashi uchun
    // mutlaq emas, nisbiy yo'l ishlatamiz. file:// protokolida ham, http:// da ham ishlaydi.
    // dashboard.html — root da, app fayllari — ./app/ ichida.
    const cid = encodeURIComponent(resolvedClientId);
    const base = location.href.replace(/[^\/]*(\?.*)?$/, '');
    const appUrl   = base + 'app/index.html?client=' + cid;
    const adminUrl = base + 'app/admin.html?client=' + cid;

    function openInNewTab(url) {
        // window.open ba'zi browserlarda pop-up blocker tomonidan to'silishi mumkin —
        // shu sababli vaqtinchalik <a target="_blank"> yaratib, click qilamiz.
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    const setupLink = (id, url) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.href = url;
        el.target = '_blank';
        el.rel = 'noopener';
        // Safari/Chrome da href="#" eski qiymati cache bo'lib qolmasligi uchun
        // qo'shimcha click handler — yangi tabda ochadi.
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openInNewTab(url);
        });
    };
    setupLink('sbAppLink',     appUrl);
    setupLink('sbAdminLink',   adminUrl);
    setupLink('qaAppLink',     appUrl);
    setupLink('qaAdminLink',   adminUrl);
    setupLink('entryAppLink',  appUrl);
    setupLink('entryAdminLink', adminUrl);

    /* ---------- TODAY DATE ---------- */
    const dateEl = document.getElementById('todayDate');
    if (dateEl) {
        const months   = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
        const weekdays = ['yakshanba','dushanba','seshanba','chorshanba','payshanba','juma','shanba'];
        const now = new Date();
        dateEl.textContent = `Bugun, ${weekdays[now.getDay()]} — ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    }

    /* ---------- CLIENT INFO ---------- */
    const appIcons = { fastfood: '🍔', dokon: '🏪', kafe: '☕' };
    const appNames = { fastfood: 'Fast Food Ilovasi', dokon: "Do'kon Ilovasi", kafe: 'Kafe Ilovasi' };

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };

    setText('welcomeTitle',  `Salom, ${client.businessName}! 👋`);
    setText('noSubGreeting', `Salom, ${client.businessName}! Biznesingizni online ga olib chiqing`);
    setText('clientName',    client.businessName);
    setText('clientId',      hasActiveSubscription ? client.id : 'Mijoz');
    setText('clientAvatar',  (client.businessName || 'B')[0].toUpperCase());

    if (hasActiveSubscription) {
        setText('sbAppIcon',  appIcons[client.app] || '📱');
        setText('sbAppName',  client.appName || appNames[client.app] || 'Ilovangiz');
        setText('sbPrice',    fmt(client.price));
        setText('sbStatus',   client.status === 'active' ? 'Faol obuna' : client.status);

        setText('statPrice',  fmt(client.price));
        setText('statDays',   daysUntilNext(client.activatedAt || client.createdAt));
        setText('statDomain', (client.subdomain || 'biznes') + '.biznesonline.uz');

        setText('detClientId',      client.id);
        setText('detBusinessName',  client.businessName);
        setText('detApp',           (appIcons[client.app] || '') + ' ' + (appNames[client.app] || client.appName || ''));
        setText('detDomain',        (client.subdomain || 'biznes') + '.biznesonline.uz');
        setText('detPrice',         client.price ? fmt(client.price) + " so'm" : '—');
        setText('detActivatedAt',   formatDate(client.activatedAt || client.createdAt));
        setText('detNextPay',       formatDate(nextPayDate(client.activatedAt || client.createdAt)));
    }

    /* ---------- SIDEBAR TOGGLE ---------- */
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const open  = () => { sidebar?.classList.add('open'); overlay?.classList.add('show'); document.body.style.overflow = 'hidden'; };
    const close = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); document.body.style.overflow = ''; };
    document.getElementById('menuToggle')?.addEventListener('click', open);
    document.getElementById('sidebarClose')?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    /* ---------- SIDEBAR NAV ---------- */
    document.querySelectorAll('.side-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const view = link.dataset.view;
            showView(view);
            if (window.innerWidth <= 992) close();
        });
    });

    // No-sub hero ichidagi tugma
    document.querySelectorAll('[data-view-trigger]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.viewTrigger;
            document.querySelectorAll('.side-link').forEach(l => {
                l.classList.toggle('active', l.dataset.view === target);
            });
            showView(target);
        });
    });

    /* ---------- DASTLABKI VIEW ---------- */
    showView('home');

    /* ---------- MARKETPLACE RENDER ---------- */
    function getApps() {
        try { return JSON.parse(localStorage.getItem('bo_apps') || '[]').filter(a => a.active !== false); }
        catch { return []; }
    }

    function renderAppCards(container, emptyMsg) {
        if (!container) return;
        const apps = getApps();

        if (apps.length === 0) {
            container.innerHTML = `
                <div class="ns-empty">
                    <i class="fa-solid fa-mobile-screen"></i>
                    <h3>Hozircha ilovalar mavjud emas</h3>
                    <p>${emptyMsg || "Administrator yangi ilovalar qo'shganda shu yerda ko'rinadi"}</p>
                </div>`;
            return;
        }

        // Apps list cache for click handler
        container._apps = apps;
        container.innerHTML = apps.map(app => {
            const logoBlock = app.logo
                ? `<img src="${app.logo}" alt="${escapeHtml(app.name)}" class="mp-app-logo">`
                : `<span class="mp-app-emoji">${app.logoEmoji || '📱'}</span>`;

            const priceBlock = app.price
                ? `<div class="mp-app-price"><strong>${fmt(app.price)}</strong> so'm <span>/ ${escapeHtml(app.priceLabel || 'oyiga')}</span></div>`
                : `<div class="mp-app-price mp-app-price-custom"><i class="fa-solid fa-handshake"></i> Narx kelishiladi</div>`;

            const features = (app.features || []).slice(0, 3).map(f =>
                `<li><i class="fa-solid fa-check"></i> ${escapeHtml(f)}</li>`
            ).join('');

            const buyHref = app.price
                ? `obuna.html?app=${encodeURIComponent(app.slug || 'app')}&price=${app.price}`
                : `obuna.html?app=${encodeURIComponent(app.slug || 'app')}`;

            return `
                <div class="mp-app-card ${app.popular ? 'popular' : ''}" data-app-id="${escapeHtml(app.id)}">
                    ${app.popular ? `<span class="mp-popular"><i class="fa-solid fa-fire"></i> Mashhur</span>` : ''}
                    <div class="mp-app-icon">${logoBlock}</div>
                    <h3 class="mp-app-name">${escapeHtml(app.name)}</h3>
                    <p class="mp-app-desc">${escapeHtml(app.desc || '')}</p>
                    ${features ? `<ul class="mp-app-features">${features}</ul>` : ''}
                    ${priceBlock}
                    <div class="mp-app-actions" onclick="event.stopPropagation()">
                        ${app.demoUrl ? `<a href="${app.demoUrl}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-eye"></i> Demo</a>` : ''}
                        <a href="${buyHref}" class="btn btn-primary btn-sm">
                            <i class="fa-solid fa-cart-shopping"></i> Obuna
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        // Karta ustiga bosish → detal modal
        container.querySelectorAll('.mp-app-card[data-app-id]').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.appId;
                const app = apps.find(a => a.id === id);
                if (app && typeof window.showAppDetailModal === 'function') {
                    window.showAppDetailModal(app);
                }
            });
        });
    }

    function renderMarketplace() {
        renderAppCards(document.getElementById('marketplaceGrid'));
    }

    function renderNoSubApps() {
        renderAppCards(document.getElementById('noSubAppsGrid'));
    }

    /* ---------- REVEAL ---------- */
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    } else {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }

    /* ---------- QUICK ACTIONS ---------- */
    document.querySelectorAll('button.qa-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const msgs = { renew: 'Obunani yangilash uchun administrator bilan bog\'laning', support: 'Qo\'llab-quvvatlash tez orada qo\'shiladi' };
            window.showToast?.(msgs[btn.dataset.action] || 'Tez orada', 'info');
        });
    });

    /* ---------- LOGOUT ---------- */
    document.getElementById('clientLogout')?.addEventListener('click', () => {
        if (confirm('Hisobingizdan chiqishni istaysizmi?')) {
            localStorage.removeItem('bo_session');
            window.location.href = 'kirish.html';
        }
    });

    /* ---------- ICON BUTTONS ---------- */
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', () => window.showToast?.(`${btn.title || 'Funksiya'} tez orada`, 'info'));
    });

    /* ---------- HELPERS ---------- */
    function fmt(n) { return ((n || 0).toLocaleString('uz-UZ')).replace(/,/g, ' '); }
    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }
    function formatDate(iso) {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return '—'; }
    }
    function nextPayDate(activatedAt) {
        if (!activatedAt) return null;
        const d = new Date(activatedAt);
        const now = new Date();
        while (d <= now) d.setDate(d.getDate() + 30);
        return d.toISOString();
    }
    function daysUntilNext(activatedAt) {
        const next = nextPayDate(activatedAt);
        if (!next) return '—';
        return Math.max(Math.ceil((new Date(next) - new Date()) / 86400000), 0);
    }
});
