// ===== BiznesOnline — Sayt Admin Paneli =====
// (Bu fayl SAYT admini uchun. Ilova admin paneliga aloqasi yo'q)
'use strict';

// Cloud.init() tugagach bu skript DINAMIK ravishda qo'shiladi — shu payt
// DOMContentLoaded allaqachon o'tib ketgan bo'lishi mumkin, shuning uchun
// oddiy addEventListener o'rniga readyState'ni ham tekshiramiz.
function _boAdminInit() {

    /* ---------- DEMO MA'LUMOTLARNI URUG'LASH ---------- */
    seedDemoData();

    /* ---------- SESSIYANI TEKSHIRISH ---------- */
    const session = getSession();
    if (!session || session.type !== 'admin') {
        // Sessiya yo'q yoki admin emas — kirish sahifasiga yo'naltiramiz.
        // Sahifa tarkibi (mijozlar ma'lumoti va h.k.) hozircha keyingi
        // skript qatorlarida chizilmasin deb, funksiyani shu yerda to'xtatamiz.
        window.location.href = 'kirish.html';
        return;
    }

    /* ---------- ADMIN PROFIL ---------- */
    const adminAcc = boCloudGet('bo_admin', {});
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
        if (section === 'messages') renderMessages();
        if (section === 'apps') renderAppsAdmin();
        if (section === 'payments') renderPayments();
        if (section === 'revenue') renderRevenue();
        if (section === 'settings') loadSettings();
        // Bot bo'limidan chiqilsa — pollingni to'xtatish
        if (section === 'bot') renderBot(); else stopBotPolling();

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

    /* ---------- TOPBAR BELL → XABARLAR ---------- */
    document.getElementById('adminNotifBtn')?.addEventListener('click', () => goTo('messages'));

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

    document.getElementById('clientEditForm').addEventListener('submit', async (e) => {
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
        // MUHIM: parol endi ochiq matnda emas, xeshlab saqlanadi (js/main.js — hashPassword).
        // Haqiqiy "parolni tiklash havolasi" oqimi Supabase Auth ulanganda (2-bosqich) qo'shiladi.
        const newPass = document.getElementById('editPassword').value.trim();
        if (newPass) subs[idx].password = await hashPassword(newPass);

        boCloudSet('bo_subscriptions', subs);
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
            boCloudSet('bo_subscriptions', subs);
            renderClients();
            renderDashboard();
            window.showToast && window.showToast("Mijoz o'chirildi", 'success');
        });
    }

    /* ====================================================
       ============ XABARLAR (mijozlar bilan) =============
       ==================================================== */
    function getMessages() {
        try { return boCloudGet('bo_messages', []); } catch { return []; }
    }
    function saveMessages(arr) { boCloudSet('bo_messages', arr); }

    function getConversations() {
        const byClient = {};
        getMessages().forEach(m => {
            if (!byClient[m.clientId]) byClient[m.clientId] = { clientId: m.clientId, clientName: m.clientName || m.clientId, messages: [] };
            byClient[m.clientId].messages.push(m);
            if (m.clientName) byClient[m.clientId].clientName = m.clientName;
        });
        const clients = getClients();
        return Object.values(byClient).map(c => {
            c.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const sub = clients.find(s => s.id === c.clientId);
            if (sub) c.clientName = sub.businessName;
            c.last = c.messages[c.messages.length - 1];
            c.unread = c.messages.filter(m => m.from === 'client' && !m.read).length;
            return c;
        }).sort((a, b) => new Date(b.last.createdAt) - new Date(a.last.createdAt));
    }
    function totalUnreadMsgs() {
        return getMessages().filter(m => m.from === 'client' && !m.read).length;
    }
    function updateMsgBadges() {
        const n = totalUnreadMsgs();
        setBadge('msgNavBadge', n);
        const dot = document.getElementById('adminNotifDot');
        if (dot) dot.style.display = n > 0 ? 'block' : 'none';
    }

    let activeConvoId = null;

    function renderMessages() {
        renderConvoList();
        if (activeConvoId) renderConversation(activeConvoId);
        updateMsgBadges();
    }

    function renderConvoList() {
        const list = document.getElementById('msgConvos');
        if (!list) return;
        const convos = getConversations();
        if (!convos.length) {
            list.innerHTML = `<div class="adm-empty" style="padding:36px 16px"><i class="fa-regular fa-comments"></i><h3>Xabar yo'q</h3><p>Mijozlar yozsa shu yerda chiqadi</p></div>`;
            return;
        }
        list.innerHTML = convos.map(c => `
            <button class="msg-convo ${c.clientId === activeConvoId ? 'active' : ''}" data-convo="${escapeHtml(c.clientId)}">
                <div class="aav msg-convo-av">${(c.clientName || 'M')[0].toUpperCase()}</div>
                <div class="msg-convo-info">
                    <div class="msg-convo-top">
                        <strong>${escapeHtml(c.clientName)}</strong>
                        <span class="msg-convo-time">${timeAgo(c.last.createdAt)}</span>
                    </div>
                    <div class="msg-convo-preview">
                        ${c.last.from === 'admin' ? '<i class="fa-solid fa-reply"></i> ' : ''}${escapeHtml(c.last.text)}
                    </div>
                </div>
                ${c.unread ? `<span class="msg-convo-badge">${c.unread}</span>` : ''}
            </button>
        `).join('');
        list.querySelectorAll('[data-convo]').forEach(b =>
            b.addEventListener('click', () => openConversation(b.dataset.convo)));
    }

    function openConversation(clientId) {
        activeConvoId = clientId;
        // Mijoz xabarlarini o'qildi deb belgilash
        const all = getMessages();
        let changed = false;
        all.forEach(m => { if (m.clientId === clientId && m.from === 'client' && !m.read) { m.read = true; changed = true; } });
        if (changed) saveMessages(all);
        renderConvoList();
        renderConversation(clientId);
        updateMsgBadges();
    }

    function renderConversation(clientId) {
        const convo = getConversations().find(c => c.clientId === clientId);
        const emptyEl = document.getElementById('msgPanelEmpty');
        const convEl = document.getElementById('msgConversation');
        if (!convo) { if (emptyEl) emptyEl.style.display = ''; if (convEl) convEl.style.display = 'none'; return; }
        if (emptyEl) emptyEl.style.display = 'none';
        if (convEl) convEl.style.display = 'flex';

        const sub = getClients().find(s => s.id === clientId);
        document.getElementById('msgConvHead').innerHTML = `
            <div class="aav">${(convo.clientName || 'M')[0].toUpperCase()}</div>
            <div class="msg-conv-head-info">
                <strong>${escapeHtml(convo.clientName)}</strong>
                <div class="msg-conv-sub">${escapeHtml(clientId)}${sub && sub.email ? ' · ' + escapeHtml(sub.email) : ''}</div>
            </div>`;
        const thread = document.getElementById('msgConvThread');
        thread.innerHTML = convo.messages.map(m => `
            <div class="msg-row ${m.from === 'admin' ? 'me' : 'them'}">
                <div class="msg-bubble">
                    <p>${escapeHtml(m.text)}</p>
                    <span class="msg-meta">${m.from === 'admin' ? 'Siz (admin)' : escapeHtml(convo.clientName)} · ${timeAgo(m.createdAt)}</span>
                </div>
            </div>
        `).join('');
        thread.scrollTop = thread.scrollHeight;
    }

    // Javob yuborish
    const msgReplyForm = document.getElementById('msgReplyForm');
    const msgReplyInput = document.getElementById('msgReplyInput');
    function autoGrowReply(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
    if (msgReplyInput) {
        msgReplyInput.addEventListener('input', () => autoGrowReply(msgReplyInput));
        msgReplyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); msgReplyForm.requestSubmit(); }
        });
    }
    if (msgReplyForm) msgReplyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!activeConvoId) return;
        const text = msgReplyInput.value.trim();
        if (!text) return;
        const convo = getConversations().find(c => c.clientId === activeConvoId);
        const all = getMessages();
        all.push({
            id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1e4),
            clientId: activeConvoId,
            clientName: convo ? convo.clientName : activeConvoId,
            from: 'admin',
            text,
            createdAt: new Date().toISOString(),
            read: false
        });
        saveMessages(all);
        msgReplyInput.value = '';
        autoGrowReply(msgReplyInput);
        renderConversation(activeConvoId);
        renderConvoList();
        window.showToast && window.showToast('Javob yuborildi — mijozga bildirishnoma bordi', 'success');
    });

    // Boshqa tabda (mijoz) o'zgarsa — jonli yangilash
    window.addEventListener('storage', (e) => {
        if (e.key !== 'bo_messages') return;
        updateMsgBadges();
        if (document.getElementById('sec-messages')?.classList.contains('active')) {
            renderConvoList();
            if (activeConvoId) renderConversation(activeConvoId);
        }
    });

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
        const a = boCloudGet('bo_admin', {});
        document.getElementById('setAdmName').value = a.name || '';
        document.getElementById('setAdmUser').value = a.username || '';
        document.getElementById('setAdmPass').value = '';

        const site = boCloudGet('bo_site_settings', {});
        if (site.name) document.getElementById('setSiteName').value = site.name;
        if (site.phone) document.getElementById('setSitePhone').value = site.phone;
        if (site.email) document.getElementById('setSiteEmail').value = site.email;
        const botApiEl = document.getElementById('setBotApi');
        if (botApiEl) botApiEl.value = boCloudGet('bo_bot_api', '');
        const botTokenEl = document.getElementById('setBotToken');
        if (botTokenEl) botTokenEl.value = boCloudGet('bo_bot_token', '');
    }
    document.getElementById('saveAdmin').addEventListener('click', async () => {
        const a = boCloudGet('bo_admin', {});
        a.name = document.getElementById('setAdmName').value.trim();
        a.username = document.getElementById('setAdmUser').value.trim();
        const np = document.getElementById('setAdmPass').value.trim();
        if (np) a.password = await hashPassword(np);
        boCloudSet('bo_admin', a);
        document.getElementById('adminName').textContent = a.name;
        document.getElementById('adminAvatar').textContent = (a.name || 'A')[0].toUpperCase();
        window.showToast && window.showToast('Admin profili saqlandi', 'success');
    });
    document.getElementById('saveSite').addEventListener('click', () => {
        boCloudSet('bo_site_settings', {
            name: document.getElementById('setSiteName').value.trim(),
            phone: document.getElementById('setSitePhone').value.trim(),
            email: document.getElementById('setSiteEmail').value.trim()
        });
        const botApi = (document.getElementById('setBotApi')?.value || '').trim().replace(/\/+$/, '');
        if (botApi) boCloudSet('bo_bot_api', botApi);
        else if (window.Cloud) Cloud.remove('bo_bot_api'); else localStorage.removeItem('bo_bot_api');
        const botToken = (document.getElementById('setBotToken')?.value || '').trim();
        if (botToken) boCloudSet('bo_bot_token', botToken);
        else if (window.Cloud) Cloud.remove('bo_bot_token'); else localStorage.removeItem('bo_bot_token');
        window.showToast && window.showToast('Sayt sozlamalari saqlandi', 'success');
    });
    document.getElementById('resetData').addEventListener('click', () => {
        confirmAction('Hamma ma\'lumotlar o\'chirilsinmi?', 'So\'rovlar, mijozlar va sozlamalar tiklanadi.', () => {
            ['bo_subscriptions', 'bo_site_settings'].forEach(k => { if (window.Cloud) Cloud.remove(k); else localStorage.removeItem(k); });
            localStorage.removeItem('bo_session');   // sessiya har doim shu qurilmada — alohida
            seedDemoData();
            location.reload();
        });
    });

    /* ====================================================
       ============ TELEGRAM BOT PANELI ===================
       ==================================================== */
    function getBotApi() {
        return (boCloudGet('bo_bot_api', '') || 'http://localhost:3344').replace(/\/+$/, '');
    }

    let botPollTimer = null;
    let botReqSeq = 0; // eng oxirgi so'rov natijasini ko'rsatish uchun (race oldini olish)
    function stopBotPolling() {
        if (botPollTimer) { clearInterval(botPollTimer); botPollTimer = null; }
    }

    function setBotStatus(state, text) {
        const el = document.getElementById('botStatus');
        if (el) { el.className = 'bot-status ' + state; el.innerHTML = `<span class="bot-status-dot"></span> ${text}`; }
        const dot = document.getElementById('botNavDot');
        if (dot) dot.style.display = state === 'online' ? 'inline-block' : 'none';
        const apiLabel = document.getElementById('botApiLabel');
        if (apiLabel) apiLabel.textContent = getBotApi();
    }

    async function fetchBotStats() {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 4000);
        try {
            const res = await fetch(getBotApi() + '/bot/stats', { signal: controller.signal });
            clearTimeout(t);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (e) {
            clearTimeout(t);
            return null;
        }
    }

    async function renderBot() {
        // Bo'limda turganimizda har 15 soniyada yangilab turish
        if (!botPollTimer) botPollTimer = setInterval(renderBot, 15000);

        // Faqat onlayn bo'lmaganda "tekshirilmoqda" ko'rsatamiz (har 15s da miltillamasligi uchun)
        const statusEl = document.getElementById('botStatus');
        if (!statusEl || !statusEl.classList.contains('online')) setBotStatus('checking', 'Tekshirilmoqda...');

        const myReq = ++botReqSeq;
        const stats = await fetchBotStats();
        // Eskirgan (kechikkan) so'rov natijasini chizmaymiz
        if (myReq !== botReqSeq) return;

        if (!stats || !stats.ok) {
            setBotStatus('offline', 'Bot oflayn');
            ['botTotalUsers', 'botActiveUsers', 'botConnections'].forEach(id => {
                const e = document.getElementById(id); if (e) e.textContent = '—';
            });
            const tb = document.getElementById('botUsersTbody');
            if (tb) tb.innerHTML = `<tr><td colspan="4"><div class="adm-empty"><i class="fa-brands fa-telegram"></i><h3>Bot ulanmagan</h3><p>Botni ishga tushiring: <code>cd bot &amp;&amp; python3 bot.py</code></p></div></td></tr>`;
            return;
        }

        setBotStatus('online', 'Bot onlayn');
        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set('botTotalUsers', stats.total || 0);
        set('botActiveUsers', stats.active || 0);
        set('botConnections', stats.connections || 0);

        const tbody = document.getElementById('botUsersTbody');
        if (!tbody) return;
        const users = stats.users || [];
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="4"><div class="adm-empty"><i class="fa-solid fa-user-slash"></i><h3>Hozircha foydalanuvchi yo'q</h3><p>Kimdir botga /start yozsa shu yerda ko'rinadi</p></div></td></tr>`;
            return;
        }
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px">
                        <div class="aav" style="width:32px;height:32px;font-size:13px">${escapeHtml((u.firstName || '?')[0].toUpperCase())}</div>
                        <div>
                            <strong>${escapeHtml(u.firstName || '—')}</strong>
                            <div style="font-size:11px;color:var(--gray-500)">ID: ${escapeHtml(String(u.id || ''))}</div>
                        </div>
                    </div>
                </td>
                <td>${u.username ? '@' + escapeHtml(u.username) : '<span style="color:var(--gray-400)">—</span>'}</td>
                <td>${timeAgo(u.lastSeen)}</td>
                <td>${u.active ? '<span class="pill active">Faol</span>' : '<span class="pill paused">Nofaol</span>'}</td>
            </tr>
        `).join('');
    }

    document.getElementById('botRefresh')?.addEventListener('click', renderBot);

    document.getElementById('botBroadcastBtn')?.addEventListener('click', () => {
        const ta = document.getElementById('botBroadcastText');
        const text = (ta.value || '').trim();
        const resEl = document.getElementById('botBroadcastResult');
        if (!text) { window.showToast && window.showToast('Xabar matnini kiriting', 'error'); return; }
        confirmAction('Ommaviy xabar yuborilsinmi?', 'Xabar botdagi BARCHA foydalanuvchilarga boradi.', async () => {
            const btn = document.getElementById('botBroadcastBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yuborilmoqda...';
            try {
                const headers = { 'Content-Type': 'application/json' };
                const tok = boCloudGet('bo_bot_token', '');
                if (tok) headers['X-Admin-Token'] = tok;
                const res = await fetch(getBotApi() + '/bot/broadcast', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                if (!data.ok) throw new Error(data.error || 'Xato');
                resEl.style.display = 'block';
                resEl.className = 'bot-broadcast-result ok';
                resEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Yuborildi: <strong>${data.sent}</strong> ta · Xato: ${data.failed} ta · Jami: ${data.total} ta`;
                ta.value = '';
                window.showToast && window.showToast('Broadcast yuborildi', 'success');
                renderBot();
            } catch (e) {
                resEl.style.display = 'block';
                resEl.className = 'bot-broadcast-result err';
                resEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Yuborilmadi — bot oflayn yoki xato: ${escapeHtml(String(e.message || e))}`;
                window.showToast && window.showToast('Broadcast yuborilmadi — bot ishlab turibdimi?', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Hammaga yuborish';
            }
        });
    });

    /* ---------- EXPORT ---------- */
    document.getElementById('exportData').addEventListener('click', () => {
        const data = {
            messages: getMessages(),
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
    updateMsgBadges();

    // ====== HELPERS ======
    function getClients() { return boCloudGet('bo_subscriptions', []); }
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
    function timeAgo(iso) {
        try {
            const d = new Date(iso), now = new Date();
            const s = Math.floor((now - d) / 1000);
            if (s < 60) return 'hozir';
            const m = Math.floor(s / 60); if (m < 60) return m + ' daq';
            const h = Math.floor(m / 60); if (h < 24) return h + ' soat';
            const days = Math.floor(h / 24); if (days < 7) return days + ' kun';
            return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
        } catch { return ''; }
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
        try { return boCloudGet('bo_apps', []); }
        catch { return []; }
    }
    function saveApps(arr) {
        boCloudSet('bo_apps', arr);
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
        readImageAsDataURL(f, 400, async (dataUrl, blob) => {
            // Darrov ko'rsatamiz (base64) — sekin internetda ham UI kutib qolmasin.
            currentEditingApp.logo = dataUrl;
            refreshLogoPreview();
            // Fonda Supabase Storage'ga yuklashga urinamiz — muvaffaqiyatli bo'lsa,
            // katta base64 matni o'rniga qisqa URL saqlanadi (bo_apps yozuvi yengil bo'ladi).
            if (window.Cloud && blob) {
                const url = await Cloud.uploadImage(blob, f.name || 'logo.jpg');
                if (url) {
                    currentEditingApp.logo = url;
                    refreshLogoPreview();
                }
                // url null bo'lsa (bucket hali yaratilmagan va h.k.) — base64 shu holicha qoladi.
            }
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

    // Rasmlarni o'qish va kichraytirish (canvas orqali).
    // cb(dataUrl, blob) — dataUrl darrov ko'rsatish (preview) uchun, blob esa
    // Supabase Storage'ga yuklash uchun (agar Cloud/bucket mavjud bo'lsa).
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
                canvas.toBlob((blob) => cb(canvas.toDataURL('image/jpeg', 0.85), blob), 'image/jpeg', 0.85);
            };
            img.onerror = () => window.showToast && window.showToast('Rasm yuklanmadi', 'error');
            img.src = ev.target.result;
        };
        reader.onerror = () => window.showToast && window.showToast('Faylni o\'qishda xato', 'error');
        reader.readAsDataURL(file);
    }

    function seedDemoData() {
        // Admin — standart hisob: tiro / tiro2004
        (function ensureAdmin() {
            const a = boCloudGet('bo_admin', null);
            // Hisob yo'q yoki eski standart (admin/admin123) bo'lsa — tiro hisobiga o'tkazamiz
            if (!a || (a.username === 'admin' && a.password === 'admin123')) {
                boCloudSet('bo_admin', {
                    username: 'tiro', password: 'tiro2004', name: 'Bosh administrator'
                });
            }
        })();
        // Demo mijozlar
        if (!boCloudGet('bo_subscriptions', null)) {
            boCloudSet('bo_subscriptions', [
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
            ]);
        }
    }
}
if (document.readyState !== 'loading') _boAdminInit(); else document.addEventListener('DOMContentLoaded', _boAdminInit);
