// ===== BiznesOnline — Sayt Admin Paneli =====
// (Bu fayl SAYT admini uchun. Ilova admin paneliga aloqasi yo'q)
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- DEMO MA'LUMOTLARNI URUG'LASH ---------- */
    seedDemoData();

    /* ---------- SESSIYANI TEKSHIRISH ---------- */
    const session = getSession();
    if (!session || session.type !== 'admin') {
        // sessiya yo'q — kirish sahifasiga
        // (lekin sahifani yopib qo'ymasdan, faqat ogohlantirish demo uchun)
        // Realda: window.location.href = 'kirish.html';
    }

    /* ---------- ADMIN PROFIL ---------- */
    const adminAcc = JSON.parse(localStorage.getItem('bo_admin') || '{}');
    document.getElementById('adminName').textContent = adminAcc.name || 'Admin';
    document.getElementById('adminAvatar').textContent = (adminAcc.name || 'A')[0].toUpperCase();

    /* ---------- NAVIGATION ---------- */
    document.querySelectorAll('.admin-link[data-section]').forEach(btn => {
        btn.addEventListener('click', () => goTo(btn.dataset.section));
    });
    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => goTo(el.dataset.goto));
    });

    function goTo(section) {
        document.querySelectorAll('.admin-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.admin-link[data-section="${section}"]`)?.classList.add('active');
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById('sec-' + section)?.classList.add('active');

        if (section === 'dashboard') renderDashboard();
        if (section === 'clients') renderClients();
        if (section === 'apps') renderAppsAdmin();
        if (section === 'payments') renderPayments();
        if (section === 'revenue') renderRevenue();
        if (section === 'settings') loadSettings();

        // Mobile: yon panelni yopish
        document.getElementById('adminSidebar').classList.remove('open');
        document.getElementById('adminOverlay').classList.remove('show');
    }

    /* ---------- MOBILE TOGGLE ---------- */
    document.getElementById('adminMenuToggle').addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.add('open');
        document.getElementById('adminOverlay').classList.add('show');
    });
    document.getElementById('adminOverlay').addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.remove('open');
        document.getElementById('adminOverlay').classList.remove('show');
    });

    /* ---------- LOGOUT ---------- */
    document.getElementById('adminLogout').addEventListener('click', () => {
        localStorage.removeItem('bo_session');
        window.showToast && window.showToast('Tizimdan chiqildi', 'success');
        setTimeout(() => { window.location.href = 'kirish.html'; }, 600);
    });

    /* ---------- DASHBOARD RENDER ---------- */
    function renderDashboard() {
        const clients = getClients();
        const activeClients = clients.filter(c => c.status === 'active');
        const monthlyRev = activeClients.reduce((s, c) => s + (c.price || 0), 0);

        document.getElementById('kpiActiveClients').textContent = activeClients.length;
        document.getElementById('kpiPending').textContent = clients.filter(c => c.status !== 'active').length;
        document.getElementById('kpiRevenue').textContent = fmt(monthlyRev) + " so'm";
        document.getElementById('kpiApps').textContent = activeClients.length;

        // So'nggi 5 ta mijoz
        const recent = clients.slice(0, 5);
        const recentEl = document.getElementById('dashRecentRequests');
        if (recentEl) {
            if (!recent.length) {
                recentEl.innerHTML = `<tr><td colspan="5"><div class="adm-empty"><i class="fa-solid fa-users"></i><h3>Mijozlar yo'q</h3><p>Hali hech kim obuna bo'lmagan</p></div></td></tr>`;
            } else {
                recentEl.innerHTML = recent.map(c => `
                    <tr>
                        <td><strong>${c.id}</strong></td>
                        <td>${escapeHtml(c.businessName)}</td>
                        <td>${escapeHtml(c.app || '')}</td>
                        <td>${formatDate(c.createdAt)}</td>
                        <td>${statusPill(c.status)}</td>
                    </tr>
                `).join('');
            }
        }

        // Ilovalar taqsimoti
        const apps = getApps();
        const distribEl = document.getElementById('appDistrib');
        if (distribEl) {
            const distrib = {};
            apps.forEach(a => { distrib[a.slug] = 0; });
            clients.forEach(c => { if (distrib[c.app] !== undefined) distrib[c.app]++; });
            const total = Math.max(clients.length, 1);
            distribEl.innerHTML = apps.map(a => {
                const pct = Math.round(((distrib[a.slug] || 0) / total) * 100);
                return `
                    <div class="distrib-row">
                        <div class="label-row">
                            <span>${a.logoEmoji || '📱'} ${escapeHtml(a.name)}</span>
                            <strong>${distrib[a.slug] || 0} mijoz (${pct}%)</strong>
                        </div>
                        <div class="distrib-bar"><span style="width:${pct}%"></span></div>
                    </div>
                `;
            }).join('') || '<p style="color:var(--gray-400);font-size:13px;padding:12px 0;">Ilovalar mavjud emas</p>';
        }
    }

    /* ---------- CLIENTS RENDER ---------- */
    function renderClients() {
        const clients = getClients();
        const tbody = document.getElementById('clientsTbody');
        if (!clients.length) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="adm-empty"><i class="fa-solid fa-users"></i><h3>Mijozlar yo'q</h3><p>Hozircha faol mijozlar yo'q</p></div></td></tr>`;
            return;
        }
        tbody.innerHTML = clients.map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:10px">
                        <div class="aav" style="width:32px;height:32px;font-size:13px">${(c.businessName || 'B')[0].toUpperCase()}</div>
                        <div>
                            <strong>${escapeHtml(c.businessName)}</strong>
                            <div style="font-size:11px;color:var(--gray-500)">${c.id}</div>
                        </div>
                    </div>
                </td>
                <td>${appLabel(c.app)}</td>
                <td>${escapeHtml(c.email)}</td>
                <td>${escapeHtml(c.phone)}</td>
                <td><strong style="color:var(--primary)">${fmt(c.price)} so'm</strong></td>
                <td>${statusPill(c.status)}</td>
                <td>
                    <div class="row-actions">
                        <button class="icon-act" data-edit-client="${c.id}" title="Tahrirlash">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="icon-act danger" data-del-client="${c.id}" title="O'chirish">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-edit-client]').forEach(b =>
            b.addEventListener('click', () => openClientEditModal(b.dataset.editClient)));
        tbody.querySelectorAll('[data-del-client]').forEach(b =>
            b.addEventListener('click', () => deleteClient(b.dataset.delClient)));
    }

    function openClientEditModal(clientId) {
        const client = getClients().find(c => c.id === clientId);
        if (!client) return;
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editBusinessName').value = client.businessName;
        document.getElementById('editEmail').value = client.email;
        document.getElementById('editPhone').value = client.phone || '';
        document.getElementById('editPrice').value = client.price || 0;
        document.getElementById('editStatus').value = client.status || 'active';
        document.getElementById('editPassword').value = '';
        showModal('clientModal');
    }

    document.getElementById('clientEditForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editClientId').value;
        const subs = getClients();
        const idx = subs.findIndex(s => s.id === id);
        if (idx < 0) return;

        subs[idx].businessName = document.getElementById('editBusinessName').value.trim();
        subs[idx].email = document.getElementById('editEmail').value.trim();
        subs[idx].phone = document.getElementById('editPhone').value.trim();
        subs[idx].price = parseInt(document.getElementById('editPrice').value, 10) || 0;
        subs[idx].status = document.getElementById('editStatus').value;
        const newPass = document.getElementById('editPassword').value.trim();
        if (newPass) subs[idx].password = newPass;

        localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
        hideModal('clientModal');
        renderClients();
        renderDashboard();
        window.showToast && window.showToast('Mijoz ma\'lumotlari yangilandi', 'success');
    });

    function deleteClient(id) {
        const client = getClients().find(c => c.id === id);
        if (!client) return;
        confirmAction(`${client.businessName} o'chirilsinmi?`, "Mijoz va uning ilovasi to'liq o'chiriladi.", () => {
            const subs = getClients().filter(c => c.id !== id);
            localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
            renderClients();
            renderDashboard();
            window.showToast && window.showToast("Mijoz o'chirildi", 'success');
        });
    }

    /* ---------- PAYMENTS ---------- */
    function renderPayments() {
        const clients = getClients().filter(c => c.status === 'active');
        const tbody = document.getElementById('paymentsTbody');
        if (!clients.length) {
            tbody.innerHTML = `<tr><td colspan="5"><div class="adm-empty"><i class="fa-solid fa-sack-dollar"></i><h3>To'lovlar yo'q</h3></div></td></tr>`;
            return;
        }
        tbody.innerHTML = clients.map(c => `
            <tr>
                <td>
                    <strong>${escapeHtml(c.businessName)}</strong>
                    <div style="font-size:11px;color:var(--gray-500)">${escapeHtml(c.email)}</div>
                </td>
                <td>${appLabel(c.app)}</td>
                <td><strong style="color:var(--primary)">${fmt(c.price)} so'm</strong></td>
                <td>${formatDate(c.activatedAt || c.createdAt)}</td>
                <td><span class="pill active">To'langan</span></td>
            </tr>
        `).join('');
    }

    /* ---------- REVENUE ---------- */
    function renderRevenue() {
        const clients = getClients().filter(c => c.status === 'active');
        const monthlyRev = clients.reduce((s, c) => s + (c.price || 0), 0);
        const avg = clients.length ? Math.round(monthlyRev / clients.length) : 0;
        document.getElementById('revMonthly').textContent = fmt(monthlyRev) + " so'm";
        document.getElementById('revYearly').textContent = fmt(monthlyRev * 12) + " so'm";
        document.getElementById('revAvg').textContent = fmt(avg) + " so'm";

        const max = Math.max(...clients.map(c => c.price || 0), 1);
        const revBars = document.getElementById('revBars');
        if (!clients.length) {
            revBars.innerHTML = `<div class="adm-empty"><i class="fa-solid fa-chart-line"></i><p>Daromad ma'lumotlari yo'q</p></div>`;
            return;
        }
        revBars.innerHTML = clients.map(c => {
            const pct = Math.round(((c.price || 0) / max) * 100);
            return `
                <div class="rev-row">
                    <div class="rev-name">${escapeHtml(c.businessName)}</div>
                    <div class="rev-bar"><span style="width:${pct}%"></span></div>
                    <div class="rev-amt">${fmt(c.price)} so'm</div>
                </div>
            `;
        }).join('');
    }

    /* ---------- SETTINGS ---------- */
    function loadSettings() {
        const a = JSON.parse(localStorage.getItem('bo_admin') || '{}');
        document.getElementById('setAdmName').value = a.name || '';
        document.getElementById('setAdmUser').value = a.username || '';
        document.getElementById('setAdmPass').value = '';

        const site = JSON.parse(localStorage.getItem('bo_site_settings') || '{}');
        if (site.name) document.getElementById('setSiteName').value = site.name;
        if (site.phone) document.getElementById('setSitePhone').value = site.phone;
        if (site.email) document.getElementById('setSiteEmail').value = site.email;
    }
    document.getElementById('saveAdmin').addEventListener('click', () => {
        const a = JSON.parse(localStorage.getItem('bo_admin') || '{}');
        a.name = document.getElementById('setAdmName').value.trim();
        a.username = document.getElementById('setAdmUser').value.trim();
        const np = document.getElementById('setAdmPass').value.trim();
        if (np) a.password = np;
        localStorage.setItem('bo_admin', JSON.stringify(a));
        document.getElementById('adminName').textContent = a.name;
        document.getElementById('adminAvatar').textContent = (a.name || 'A')[0].toUpperCase();
        window.showToast && window.showToast('Admin profili saqlandi', 'success');
    });
    document.getElementById('saveSite').addEventListener('click', () => {
        localStorage.setItem('bo_site_settings', JSON.stringify({
            name: document.getElementById('setSiteName').value.trim(),
            phone: document.getElementById('setSitePhone').value.trim(),
            email: document.getElementById('setSiteEmail').value.trim()
        }));
        window.showToast && window.showToast('Sayt sozlamalari saqlandi', 'success');
    });
    document.getElementById('resetData').addEventListener('click', () => {
        confirmAction('Hamma ma\'lumotlar o\'chirilsinmi?', 'So\'rovlar, mijozlar va sozlamalar tiklanadi.', () => {
            ['bo_subscriptions', 'bo_site_settings', 'bo_session'].forEach(k => localStorage.removeItem(k));
            seedDemoData();
            location.reload();
        });
    });

    /* ---------- EXPORT ---------- */
    document.getElementById('exportData').addEventListener('click', () => {
        const data = {
            requests: getRequests(),
            clients: getClients(),
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `biznesonline-export-${Date.now()}.json`;
        a.click();
        window.showToast && window.showToast('Ma\'lumotlar yuklab olindi', 'success');
    });

    /* ---------- MODAL HELPERS ---------- */
    function showModal(id) { document.getElementById(id).classList.add('show'); }
    function hideModal(id) { document.getElementById(id).classList.remove('show'); }
    document.querySelectorAll('[data-close]').forEach(b =>
        b.addEventListener('click', () => hideModal(b.dataset.close)));
    document.querySelectorAll('.adm-modal').forEach(m =>
        m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('show'); }));

    let confirmCb = null;
    function confirmAction(title, text, cb) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmText').textContent = text;
        confirmCb = cb;
        showModal('confirmModal');
    }
    document.getElementById('confirmYes').addEventListener('click', () => {
        if (confirmCb) confirmCb();
        hideModal('confirmModal');
        confirmCb = null;
    });

    /* ---------- SEARCH ---------- */
    document.getElementById('adminSearch').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.adm-table tbody tr').forEach(tr => {
            tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });

    /* ---------- INITIAL RENDER ---------- */
    renderDashboard();

    // ====== HELPERS ======
    function getClients() { return JSON.parse(localStorage.getItem('bo_subscriptions') || '[]'); }
    function getSession() {
        try { return JSON.parse(localStorage.getItem('bo_session') || 'null'); }
        catch { return null; }
    }

    function appLabel(app) {
        return ({
            'dokon': "🏪 Do'kon",
            'fastfood': '🍔 Fast Food',
            'kafe': '☕ Kafe'
        })[app] || app;
    }
    function statusPill(s) {
        const m = {
            pending:  ['pending',  'Kutilmoqda'],
            active:   ['active',   'Faol'],
            rejected: ['rejected', 'Rad etilgan'],
            paused:   ['paused',   "To'xtatilgan"],
            blocked:  ['blocked',  'Bloklangan']
        };
        const [cls, lbl] = m[s] || ['pending', s];
        return `<span class="pill ${cls}">${lbl}</span>`;
    }
    function fmt(n) { return ((n || 0).toLocaleString('uz-UZ')).replace(/,/g, ' '); }
    function formatDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return '—'; }
    }
    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function setBadge(id, n) {
        const el = document.getElementById(id);
        if (!el) return;
        if (n > 0) { el.style.display = 'inline-block'; el.textContent = n; }
        else el.style.display = 'none';
    }

    /* ====================================================
       ============ ILOVALAR (APPS) CRUD ==================
       ==================================================== */
    function getApps() {
        try { return JSON.parse(localStorage.getItem('bo_apps') || '[]'); }
        catch { return []; }
    }
    function saveApps(arr) {
        localStorage.setItem('bo_apps', JSON.stringify(arr));
    }

    function renderAppsAdmin() {
        const apps = getApps();
        const grid = document.getElementById('appsAdminGrid');
        if (!grid) return;

        if (!apps.length) {
            grid.innerHTML = `
                <div class="adm-empty" style="grid-column:1/-1">
                    <i class="fa-solid fa-mobile-screen"></i>
                    <h3>Ilovalar yo'q</h3>
                    <p>"Yangi ilova qo'shish" tugmasini bosing</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = apps.map(a => {
            const logo = a.logo
                ? `<img src="${a.logo}" alt="${escapeHtml(a.name)}">`
                : (a.logoEmoji || '📱');
            const priceTag = a.price
                ? `<span class="aa-price"><i class="fa-solid fa-tag"></i> ${fmt(a.price)} so'm / ${escapeHtml(a.priceLabel || 'oyiga')}</span>`
                : `<span class="aa-price no-price"><i class="fa-solid fa-handshake"></i> Narx belgilanmagan</span>`;
            return `
                <div class="app-admin-card">
                    ${a.popular ? `<span class="aa-popular"><i class="fa-solid fa-fire"></i> Mashhur</span>` : ''}
                    <span class="aa-status ${a.active ? 'on' : 'off'}">${a.active ? 'Faol' : 'Yashirin'}</span>
                    <div class="aa-logo">${logo}</div>
                    <h4>${escapeHtml(a.name)}</h4>
                    <div class="aa-slug">/${escapeHtml(a.slug || '')}</div>
                    <p class="aa-desc">${escapeHtml(a.desc || '')}</p>
                    <div class="aa-meta">
                        ${priceTag}
                        <span><i class="fa-solid fa-list-check"></i>${(a.features || []).length} imkoniyat</span>
                    </div>
                    <div class="aa-actions">
                        <button class="aa-edit" data-edit-app="${a.id}">
                            <i class="fa-solid fa-pen"></i> Tahrirlash
                        </button>
                        <button class="aa-del" data-del-app="${a.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('[data-edit-app]').forEach(b =>
            b.addEventListener('click', () => openAppModal(b.dataset.editApp)));
        grid.querySelectorAll('[data-del-app]').forEach(b =>
            b.addEventListener('click', () => deleteApp(b.dataset.delApp)));
    }

    // Yangi/tahrir modal
    const addAppBtn = document.getElementById('addAppBtn');
    if (addAppBtn) addAppBtn.addEventListener('click', () => openAppModal(null));

    let currentEditingApp = { logo: null, logoEmoji: '' };

    function openAppModal(id) {
        const form = document.getElementById('appForm');
        form.reset();
        currentEditingApp = { logo: null, logoEmoji: '' };
        document.getElementById('appId').value = '';

        if (id) {
            const app = getApps().find(x => x.id === id);
            if (!app) return;
            document.getElementById('appModalTitle').textContent = 'Ilovani tahrirlash';
            document.getElementById('appId').value = app.id;
            document.getElementById('appName').value = app.name || '';
            document.getElementById('appSlug').value = app.slug || '';
            document.getElementById('appDesc').value = app.desc || '';
            document.getElementById('appFeatures').value = (app.features || []).join('\n');
            document.getElementById('appDemoUrl').value = app.demoUrl || '';
            document.getElementById('appAdminUrl').value = app.adminUrl || '';
            document.getElementById('appLogoEmoji').value = app.logoEmoji || '';
            document.getElementById('appActive').checked = app.active !== false;
            document.getElementById('appPopular').checked = !!app.popular;
            document.getElementById('appPrice').value = app.price || '';
            document.getElementById('appPriceLabel').value = app.priceLabel || '';
            currentEditingApp.logo = app.logo || null;
            currentEditingApp.logoEmoji = app.logoEmoji || '';
        } else {
            document.getElementById('appModalTitle').textContent = "Yangi ilova qo'shish";
            document.getElementById('appActive').checked = true;
        }

        refreshLogoPreview();
        showModal('appModal');
    }

    function refreshLogoPreview() {
        const prev = document.getElementById('appLogoPreview');
        const clr = document.getElementById('appLogoClear');
        if (currentEditingApp.logo) {
            prev.innerHTML = `<img src="${currentEditingApp.logo}" alt="logo">`;
            if (clr) clr.style.display = 'inline-flex';
        } else {
            prev.innerHTML = `<i class="fa-solid fa-image"></i><span>Logo</span>`;
            if (clr) clr.style.display = 'none';
        }
    }

    // Logo file pick
    const logoPick = document.getElementById('appLogoPick');
    const logoFile = document.getElementById('appLogoFile');
    const logoClear = document.getElementById('appLogoClear');
    if (logoPick) logoPick.addEventListener('click', () => logoFile.click());
    if (logoFile) logoFile.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        readImageAsDataURL(f, 400, (dataUrl) => {
            currentEditingApp.logo = dataUrl;
            refreshLogoPreview();
        });
        logoFile.value = '';
    });
    if (logoClear) logoClear.addEventListener('click', () => {
        currentEditingApp.logo = null;
        refreshLogoPreview();
    });

    // Submit
    const appForm = document.getElementById('appForm');
    if (appForm) appForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('appId').value;
        const apps = getApps();

        const priceVal = parseInt(document.getElementById('appPrice').value, 10);
        const data = {
            name: document.getElementById('appName').value.trim(),
            slug: document.getElementById('appSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
            desc: document.getElementById('appDesc').value.trim(),
            features: document.getElementById('appFeatures').value
                .split('\n').map(s => s.trim()).filter(Boolean),
            demoUrl: document.getElementById('appDemoUrl').value.trim(),
            adminUrl: document.getElementById('appAdminUrl').value.trim(),
            logo: currentEditingApp.logo,
            logoEmoji: document.getElementById('appLogoEmoji').value.trim() || '📱',
            price: isNaN(priceVal) || priceVal <= 0 ? null : priceVal,
            priceLabel: document.getElementById('appPriceLabel').value.trim() || 'oyiga',
            active: document.getElementById('appActive').checked,
            popular: document.getElementById('appPopular').checked
        };

        if (!data.name || !data.slug || !data.desc) {
            window.showToast && window.showToast('Asosiy maydonlarni to\'ldiring', 'error');
            return;
        }

        if (id) {
            const idx = apps.findIndex(a => a.id === id);
            if (idx >= 0) apps[idx] = { ...apps[idx], ...data };
            window.showToast && window.showToast('Ilova yangilandi', 'success');
        } else {
            data.id = 'app-' + Date.now();
            data.createdAt = new Date().toISOString();
            apps.push(data);
            window.showToast && window.showToast('Ilova qo\'shildi — saytda paydo bo\'ldi', 'success');
        }

        saveApps(apps);
        hideModal('appModal');
        renderAppsAdmin();
        renderDashboard();
    });

    function deleteApp(id) {
        const app = getApps().find(a => a.id === id);
        if (!app) return;
        confirmAction(`"${app.name}" ilovasi o'chirilsinmi?`, "Bu ilova saytda ham ko'rinmay qoladi.", () => {
            const arr = getApps().filter(a => a.id !== id);
            saveApps(arr);
            renderAppsAdmin();
            window.showToast && window.showToast("Ilova o'chirildi", 'success');
        });
    }

    // Rasmlarni o'qish va kichraytirish (canvas orqali)
    function readImageAsDataURL(file, maxSize, cb) {
        if (!file || !file.type.startsWith('image/')) {
            window.showToast && window.showToast('Faqat rasm fayllari', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            window.showToast && window.showToast('Rasm hajmi 5MB dan oshmasin', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                cb(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => window.showToast && window.showToast('Rasm yuklanmadi', 'error');
            img.src = ev.target.result;
        };
        reader.onerror = () => window.showToast && window.showToast('Faylni o\'qishda xato', 'error');
        reader.readAsDataURL(file);
    }

    function seedDemoData() {
        // Admin
        if (!localStorage.getItem('bo_admin')) {
            localStorage.setItem('bo_admin', JSON.stringify({
                username: 'admin', password: 'admin123', name: 'Bosh administrator'
            }));
        }
        // Demo mijozlar
        if (!localStorage.getItem('bo_subscriptions')) {
            localStorage.setItem('bo_subscriptions', JSON.stringify([
                {
                    id: 'CL-001', businessName: 'Demo Burger', businessType: 'fastfood', app: 'fastfood',
                    email: 'mijoz@demo.uz', phone: '+998 90 123 45 67',
                    city: 'Toshkent', address: 'Chilonzor',
                    password: 'demo123', price: 99000, status: 'active', subdomain: 'demo-burger',
                    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
                    activatedAt: new Date(Date.now() - 86400000 * 13).toISOString()
                },
                {
                    id: 'CL-002', businessName: 'Coffee Time', businessType: 'kafe', app: 'kafe',
                    email: 'coffee@time.uz', phone: '+998 90 333 44 55',
                    city: 'Toshkent', address: 'Yunusobod',
                    password: 'demo123', price: 75000, status: 'active', subdomain: 'coffee-time',
                    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
                    activatedAt: new Date(Date.now() - 86400000 * 29).toISOString()
                }
            ]));
        }
    }
});
