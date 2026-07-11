// ===== BiznesOnline — Mijoz Dashbordi =====
'use strict';

// Cloud.init() tugagach bu skript DINAMIK ravishda qo'shiladi — shu payt
// DOMContentLoaded allaqachon o'tib ketgan bo'lishi mumkin, shuning uchun
// oddiy addEventListener o'rniga readyState'ni ham tekshiramiz.
function _boDashboardInit() {

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
        const subs = boCloudGet('bo_subscriptions', []);
        client = subs.find(s => s.id === resolvedClientId);
    } catch {}

    if (!client) {
        window.location.replace('kirish.html');
        return;
    }

    /* ---------- OBUNALAR (ko'p-ilova model) ---------- */
    function persistClient() {
        try {
            const subs = boCloudGet('bo_subscriptions', []);
            const idx = subs.findIndex(s => s.id === resolvedClientId);
            if (idx >= 0) { subs[idx] = client; boCloudSet('bo_subscriptions', subs); }
        } catch (e) { console.error('persistClient', e); }
    }

    // Eski bitta-ilova modelidan ko'p-ilova (subscriptions[]) ga migratsiya
    if (!Array.isArray(client.subscriptions)) {
        if (client.app && client.status === 'active') {
            client.subscriptions = [{
                id: 'sub-' + (client.appId || client.app || Date.now()),
                appId: client.appId || null,
                slug: client.slug || client.app || null,
                name: client.appName || 'Ilova',
                logoEmoji: client.logoEmoji || null,
                logo: client.logo || null,
                demoUrl: client.appUrl || null,
                adminUrl: client.adminUrl || null,
                subdomain: client.subdomain || null,
                status: 'active',
                activatedAt: client.activatedAt || client.createdAt
            }];
        } else {
            client.subscriptions = [];
        }
        persistClient();
    }

    function activeSubs() { return (client.subscriptions || []).filter(s => s.status !== 'cancelled'); }
    let hasActiveSubscription = activeSubs().length > 0;

    const noSubWrap        = document.getElementById('noSubWrap');
    const marketplaceWrap  = document.getElementById('marketplaceWrap');
    const activeSubWrap    = document.getElementById('activeSubWrap');
    const subscriptionWrap = document.getElementById('subscriptionWrap');
    const supportWrap      = document.getElementById('supportWrap');

    function hideAllViews() {
        [noSubWrap, marketplaceWrap, activeSubWrap, subscriptionWrap, supportWrap]
            .forEach(w => { if (w) w.style.display = 'none'; });
    }

    function showView(view) {
        hideAllViews();
        if (view === 'marketplace') {
            marketplaceWrap.style.display = 'block';
            renderMarketplace();
        } else if (view === 'subscription') {
            subscriptionWrap.style.display = 'block';
            renderSubscriptions(document.getElementById('subsGrid'));
        } else if (view === 'support') {
            supportWrap.style.display = 'block';
            renderSupportThread();
            markAdminMessagesRead();
            updateNotifBadge();
        } else { // 'home' (standart)
            if (activeSubs().length > 0) {
                activeSubWrap.style.display = 'block';
                renderSubscriptions(document.getElementById('homeSubsGrid'));
            } else {
                noSubWrap.style.display = 'block';
                renderNoSubApps();
            }
        }
    }

    /* ---------- APP / ADMIN URL LAR (nisbiy yo'l) ---------- */
    // Chrome / Safari / Android Studio / VS Code Live Server da bir xil ishlashi uchun
    // mutlaq emas, nisbiy yo'l ishlatamiz. file:// protokolida ham, http:// da ham ishlaydi.
    // dashboard.html — root da, app fayllari — ./app/ ichida.
    const cid = encodeURIComponent(resolvedClientId);
    const base = location.href.replace(/[^\/]*(\?.*)?$/, '');
    // Eski "app/" papkasi (fast food ilovasining eski nusxasi) endi
    // "fast-food-dokoni/" ga ko'chirilgan. Ba'zi eski mijozlarning
    // demoUrl/adminUrl'lari hali "app/..." ni ko'rsatadi — ularni yangi papkaga
    // yo'naltiramiz (aks holda eskirgan nusxa ochiladi).
    const normalizeLegacy = (r) => (r || '').replace(/^\/?app\//, 'fast-food-dokoni/');
    // Mijoz tanlagan ilovaning o'z URL'lari (bo'lmasa — eski fast food ilovasi)
    const buildUrl = (rel, fallback) => {
        const r = normalizeLegacy(rel || fallback);
        const sep = r.includes('?') ? '&' : '?';
        return base + r + sep + 'client=' + cid;
    };
    // Har bir obuna uchun ilova / boshqaruv URL'lari
    function subAppUrl(sub)   { return buildUrl(sub.demoUrl,  'fast-food-dokoni/index.html'); }
    function subAdminUrl(sub) { return buildUrl(sub.adminUrl, 'fast-food-dokoni/admin.html'); }

    function isInTelegram() {
        // Telegram ichidaligini bir nechta signal bilan aniqlaymiz (platform ba'zan 'unknown' bo'ladi).
        const w = window.Telegram && window.Telegram.WebApp;
        if (window.TelegramWebviewProxy) return true;                 // mobil Telegram webview belgisi
        if (w && w.initData && w.initData.length > 0) return true;    // haqiqiy Mini App
        if (w && w.initDataUnsafe && Object.keys(w.initDataUnsafe).length) return true;
        if (w && w.platform && w.platform !== 'unknown') return true;
        if (/Telegram/i.test(navigator.userAgent || '')) return true; // desktop Telegram
        return false;
    }

    function openInNewTab(url) {
        // Telegram ichida bo'lsak — havolani O'SHA webview'da ochamiz (yangi tab emas),
        // aks holda Telegram "Open link?" so'rab, tashqi brauzerga chiqaradi.
        if (isInTelegram()) {
            window.location.href = url;   // joyida o'tadi, Telegram ichida qoladi
            return;
        }
        // Oddiy brauzerda — yangi tab (pop-up blocker'dan qochish uchun <a target="_blank">).
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

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
    setText('clientId',      'Mijoz');
    setText('clientAvatar',  (client.businessName || 'B')[0].toUpperCase());

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
            const view = link.dataset.view;
            // data-view yo'q (masalan "Sozlamalar") — bu panel ochadi, view emas
            if (!view) {
                if (window.innerWidth <= 992) close();
                return;
            }
            document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
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
        try { return boCloudGet('bo_apps', []).filter(a => a.active !== false); }
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

            const priceBlock = `<div class="mp-app-price mp-app-price-free"><i class="fa-solid fa-gift"></i> Bepul foydalanish</div>`;

            const features = (app.features || []).slice(0, 3).map(f =>
                `<li><i class="fa-solid fa-check"></i> ${escapeHtml(f)}</li>`
            ).join('');

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
                        ${isSubscribedTo(app.id)
                            ? `<button type="button" class="btn btn-sm btn-subscribed" disabled><i class="fa-solid fa-circle-check"></i> Obuna bo'lingan</button>`
                            : `<button type="button" class="btn btn-primary btn-sm" data-subscribe="${escapeHtml(app.id)}"><i class="fa-solid fa-bolt"></i> Obuna bo'lish</button>`}
                    </div>
                </div>
            `;
        }).join('');

        // "Obuna bo'lish" — to'g'ridan-to'g'ri obuna (subdomen so'ralmaydi)
        container.querySelectorAll('[data-subscribe]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const app = apps.find(a => a.id === btn.dataset.subscribe);
                if (app) subscribeToApp(app);
            });
        });

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

    /* ====================================================
       ============ OBUNA TIZIMI (ko'p-ilova) =============
       ==================================================== */
    function isSubscribedTo(appId) {
        return activeSubs().some(s => s.appId === appId);
    }
    // Obuna — subdomen so'ralmaydi. Mijoz do'koniga eski havola orqali kiradi:
    //   /{papka}/index.html?client={client_id}
    function subscribeToApp(app) {
        if (isSubscribedTo(app.id)) {
            window.showToast?.('Siz bu ilovaga allaqachon obuna bo\'lgansiz', 'info');
            return;
        }
        const sub = {
            id: 'sub-' + Date.now() + '-' + Math.floor(Math.random() * 1e4),
            appId: app.id,
            slug: app.slug || app.id,
            name: app.name,
            logoEmoji: app.logoEmoji || null,
            logo: app.logo || null,
            demoUrl: app.demoUrl || null,
            adminUrl: app.adminUrl || null,
            status: 'active',
            activatedAt: new Date().toISOString()
        };
        if (!Array.isArray(client.subscriptions)) client.subscriptions = [];
        client.subscriptions.push(sub);
        persistClient();
        hasActiveSubscription = true;
        window.showToast?.(`${app.name} — obuna bo'ldingiz! 🎉 Havola va QR kod "Ilova boshqaruvi"da.`, 'success');
        document.querySelectorAll('.side-link').forEach(l => l.classList.toggle('active', l.dataset.view === 'subscription'));
        showView('subscription');
    }

    /* ---------- OBUNA KARTALARI ---------- */
    function renderSubscriptions(container) {
        if (!container) return;
        const subs = activeSubs();
        if (!subs.length) {
            container.innerHTML = `
                <div class="ns-empty" style="grid-column:1/-1">
                    <i class="fa-solid fa-layer-group"></i>
                    <h3>Hali obunangiz yo'q</h3>
                    <p>"Ilovalar" bo'limidan birorta web ilovaga obuna bo'ling</p>
                    <button class="btn btn-primary" data-view-trigger="marketplace" style="margin-top:14px"><i class="fa-solid fa-grip"></i> Ilovalarni ko'rish</button>
                </div>`;
            wireViewTriggers(container);
            return;
        }
        container.innerHTML = subs.map(sub => `
            <div class="sub-card reveal visible" data-sub="${escapeHtml(sub.id)}">
                <div class="sub-card-top">
                    <div class="sub-icon">${sub.logo ? `<img src="${sub.logo}" alt="">` : (sub.logoEmoji || '📱')}</div>
                    <div class="sub-card-info">
                        <h3>${escapeHtml(sub.name)}</h3>
                        <span class="sub-domain" title="${escapeHtml(subAppUrl(sub))}"><i class="fa-solid fa-link"></i> ${escapeHtml((subAppUrl(sub) || '').replace(/^https?:\/\//, ''))}</span>
                    </div>
                    <span class="sub-status-pill"><i class="fa-solid fa-circle"></i> Faol</span>
                </div>
                <div class="sub-meta-row">
                    <span><i class="fa-solid fa-gift"></i> Bepul</span>
                    <span><i class="fa-solid fa-calendar-day"></i> ${formatDate(sub.activatedAt)}</span>
                </div>
                <div class="sub-actions">
                    <button class="btn btn-primary btn-sm" data-open="${escapeHtml(sub.id)}"><i class="fa-solid fa-mobile-screen"></i> Ilovani ochish</button>
                    <button class="btn btn-outline btn-sm" data-admin="${escapeHtml(sub.id)}"><i class="fa-solid fa-sliders"></i> Ilova boshqaruvi</button>
                    <button class="btn btn-ghost-danger btn-sm" data-cancel="${escapeHtml(sub.id)}"><i class="fa-solid fa-circle-xmark"></i> Obunani to'xtatish</button>
                </div>
            </div>
        `).join('');

        const findSub = (id) => activeSubs().find(s => s.id === id);
        container.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => { const s = findSub(b.dataset.open); if (s) openInNewTab(subAppUrl(s)); }));
        container.querySelectorAll('[data-admin]').forEach(b => b.addEventListener('click', () => { const s = findSub(b.dataset.admin); if (s) openInNewTab(subAdminUrl(s)); }));
        container.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', () => cancelSubscription(b.dataset.cancel)));
    }

    function cancelSubscription(subId) {
        const sub = (client.subscriptions || []).find(s => s.id === subId);
        if (!sub) return;
        if (!confirm(`"${sub.name}" obunasini to'xtatasizmi?`)) return;
        client.subscriptions = client.subscriptions.filter(s => s.id !== subId);
        persistClient();
        hasActiveSubscription = activeSubs().length > 0;
        window.showToast?.('Obuna to\'xtatildi', 'info');
        renderSubscriptions(document.getElementById('subsGrid'));
        renderSubscriptions(document.getElementById('homeSubsGrid'));
        if (activeSubs().length === 0) {
            document.querySelectorAll('.side-link').forEach(l => l.classList.toggle('active', l.dataset.view === 'home'));
            showView('home');
        }
    }

    function wireViewTriggers(scope) {
        (scope || document).querySelectorAll('[data-view-trigger]').forEach(btn => {
            if (btn._wired) return; btn._wired = true;
            btn.addEventListener('click', () => {
                const target = btn.dataset.viewTrigger;
                document.querySelectorAll('.side-link').forEach(l => l.classList.toggle('active', l.dataset.view === target));
                showView(target);
            });
        });
    }

    // Detail modal va landing sahifa "Obuna bo'lish" tugmasi — to'g'ridan-to'g'ri obuna
    window.BO_subscribe = function (appId) {
        const app = getApps().find(a => a.id === appId);
        if (!app) return;
        document.getElementById('appDetailModal')?.classList.remove('show');
        document.body.style.overflow = '';
        subscribeToApp(app);
    };

    // URL ?subscribe=<slug> — landing/ro'yxatdan o'tishdan keyin avtomatik obuna
    (function handleSubscribeParam() {
        const slug = new URLSearchParams(location.search).get('subscribe');
        history.replaceState(null, '', location.pathname);
        if (!slug) return;
        const app = getApps().find(a => a.slug === slug || a.id === slug);
        if (app && !isSubscribedTo(app.id)) setTimeout(() => subscribeToApp(app), 450);
    })();

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
            const action = btn.dataset.action;
            if (action === 'support') {
                // Qo'llab-quvvatlash view ga o'tish
                document.querySelectorAll('.side-link').forEach(l =>
                    l.classList.toggle('active', l.dataset.view === 'support'));
                showView('support');
            } else if (action === 'renew') {
                window.showToast?.('Ilovangiz bepul va muddatsiz — yangilash shart emas ✅', 'info');
            } else {
                window.showToast?.('Tez orada', 'info');
            }
        });
    });

    /* ---------- LOGOUT ---------- */
    document.getElementById('clientLogout')?.addEventListener('click', () => {
        if (confirm('Hisobingizdan chiqishni istaysizmi?')) {
            localStorage.removeItem('bo_session');
            window.location.href = 'kirish.html';
        }
    });

    /* ====================================================
       ====== XABARLAR / BILDIRISHNOMA (admin bilan) ======
       ==================================================== */
    const MESSAGES_KEY = 'bo_messages';
    function getMessages() {
        try { return boCloudGet(MESSAGES_KEY, []); } catch { return []; }
    }
    function saveMessages(arr) { boCloudSet(MESSAGES_KEY, arr); }
    function myMessages() {
        return getMessages()
            .filter(m => m.clientId === resolvedClientId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    function unreadAdminCount() {
        return myMessages().filter(m => m.from === 'admin' && !m.read).length;
    }
    function markAdminMessagesRead() {
        const all = getMessages();
        let changed = false;
        all.forEach(m => {
            if (m.clientId === resolvedClientId && m.from === 'admin' && !m.read) { m.read = true; changed = true; }
        });
        if (changed) saveMessages(all);
    }

    // Birinchi marta — administratordan xush kelibsiz xabari (bildirishnoma ko'rinsin)
    (function seedWelcomeMessage() {
        const all = getMessages();
        if (!all.some(m => m.clientId === resolvedClientId)) {
            all.push({
                id: 'msg-' + Date.now(),
                clientId: resolvedClientId,
                clientName: client.businessName,
                from: 'admin',
                text: `Assalomu alaykum, ${client.businessName}! BiznesOnline platformasiga xush kelibsiz. 👋 Savol yoki muammoingiz bo'lsa, shu yerdan yozing — administrator javob beradi.`,
                createdAt: new Date().toISOString(),
                read: false
            });
            saveMessages(all);
        }
    })();

    /* ---------- BILDIRISHNOMA (qo'ng'iroq) ---------- */
    const notifBtn   = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    const notifList  = document.getElementById('notifList');
    const notifBadge = document.getElementById('notifBadge');

    function updateNotifBadge() {
        if (!notifBadge) return;
        const unread = unreadAdminCount();
        if (unread > 0) { notifBadge.style.display = ''; notifBadge.textContent = unread > 9 ? '9+' : String(unread); }
        else notifBadge.style.display = 'none';
    }
    function renderNotifList() {
        if (!notifList) return;
        const msgs = myMessages().filter(m => m.from === 'admin').reverse(); // eng yangisi tepada
        if (!msgs.length) {
            notifList.innerHTML = `<div class="notif-empty"><i class="fa-regular fa-bell"></i><p>Hozircha bildirishnoma yo'q</p></div>`;
            return;
        }
        notifList.innerHTML = msgs.map(m => `
            <div class="notif-item ${m.read ? '' : 'unread'}">
                <div class="notif-item-ic"><i class="fa-solid fa-headset"></i></div>
                <div class="notif-item-body">
                    <p>${escapeHtml(m.text)}</p>
                    <span class="notif-time">${timeAgo(m.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }
    notifBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notifPanel.classList.contains('show')) { notifPanel.classList.remove('show'); return; }
        renderNotifList();                 // joriy holatni (o'qilmaganlar ajratilgan) ko'rsatish
        notifPanel.classList.add('show');
        markAdminMessagesRead();           // ochilganda o'qildi deb belgilash
        updateNotifBadge();                // badge ni tozalash
    });
    document.getElementById('notifReadAll')?.addEventListener('click', (e) => {
        e.stopPropagation();
        markAdminMessagesRead();
        updateNotifBadge();
        renderNotifList();
    });
    // Bildirishnomani bossa — qo'llab-quvvatlash view ga o'tish
    notifList?.addEventListener('click', (e) => {
        if (!e.target.closest('.notif-item')) return;
        notifPanel.classList.remove('show');
        document.querySelectorAll('.side-link').forEach(l =>
            l.classList.toggle('active', l.dataset.view === 'support'));
        showView('support');
    });
    // Tashqariga bosilganda yopish
    document.addEventListener('click', (e) => {
        if (notifPanel?.classList.contains('show') && !e.target.closest('.notif-wrap')) {
            notifPanel.classList.remove('show');
        }
    });

    /* ---------- QO'LLAB-QUVVATLASH (chat) ---------- */
    const supportThread = document.getElementById('supportThread');
    const supportForm   = document.getElementById('supportForm');
    const supportInput  = document.getElementById('supportInput');

    function renderSupportThread() {
        if (!supportThread) return;
        const msgs = myMessages();
        if (!msgs.length) {
            supportThread.innerHTML = `<div class="support-empty"><i class="fa-regular fa-comments"></i><p>Hali xabar yo'q. Birinchi xabaringizni yozing.</p></div>`;
            return;
        }
        supportThread.innerHTML = msgs.map(m => `
            <div class="msg-row ${m.from === 'client' ? 'me' : 'them'}">
                <div class="msg-bubble">
                    <p>${escapeHtml(m.text)}</p>
                    <span class="msg-meta">${m.from === 'client' ? 'Siz' : 'Administrator'} · ${timeAgo(m.createdAt)}</span>
                </div>
            </div>
        `).join('');
        supportThread.scrollTop = supportThread.scrollHeight;
    }
    function autoGrowSupport(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
    supportInput?.addEventListener('input', () => autoGrowSupport(supportInput));
    supportInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); supportForm.requestSubmit(); }
    });
    supportForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = supportInput.value.trim();
        if (!text) return;
        const all = getMessages();
        all.push({
            id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1e4),
            clientId: resolvedClientId,
            clientName: client.businessName,
            clientApp: client.app || null,
            from: 'client',
            text,
            createdAt: new Date().toISOString(),
            read: false
        });
        saveMessages(all);
        supportInput.value = '';
        autoGrowSupport(supportInput);
        renderSupportThread();
        window.showToast?.('Xabaringiz administratorga yuborildi ✅', 'success');
    });

    // Boshqa tabda (admin) o'zgarsa — jonli yangilash (eski, bir xil brauzer ichida)
    window.addEventListener('storage', (e) => {
        if (e.key !== MESSAGES_KEY) return;
        updateNotifBadge();
        if (notifPanel?.classList.contains('show')) renderNotifList();
        if (supportWrap && supportWrap.style.display !== 'none') renderSupportThread();
    });
    // Xabarlar endi Supabase'da — boshqa QURILMADAN kelgan yangilanish "cloud:updated"
    // orqali keladi (Cloud fonda kech javob kelganda qayta yuklaganda).
    window.addEventListener('cloud:updated', () => {
        updateNotifBadge();
        if (notifPanel?.classList.contains('show')) renderNotifList();
        if (supportWrap && supportWrap.style.display !== 'none') renderSupportThread();
    });

    // Dastlabki badge
    updateNotifBadge();

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
    function timeAgo(iso) {
        try {
            const d = new Date(iso), now = new Date();
            const s = Math.floor((now - d) / 1000);
            if (s < 60) return 'hozir';
            const m = Math.floor(s / 60); if (m < 60) return m + ' daqiqa oldin';
            const h = Math.floor(m / 60); if (h < 24) return h + ' soat oldin';
            const days = Math.floor(h / 24); if (days < 7) return days + ' kun oldin';
            return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
        } catch { return ''; }
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
}
if (document.readyState !== 'loading') _boDashboardInit(); else document.addEventListener('DOMContentLoaded', _boDashboardInit);
