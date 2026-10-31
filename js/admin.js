// ===== BiznesOnline — Sayt Admin Paneli =====
// (Bu fayl SAYT admini uchun. Ilova admin paneliga aloqasi yo'q)
//
// Ma'lumot modeli (bo_subscriptions — har bir yozuv bitta MIJOZ):
//   { id, username, businessName, phone, password(xesh), status, createdAt,
//     subscriptions: [{ id, appId, slug, name, logo, logoEmoji, demoUrl, adminUrl, status, activatedAt }] }
//   status: 'registered' | 'active' — kirishga ruxsat;  'blocked' (yoki eski 'paused') — kirish yopiq.
// Platformadagi barcha ilovalar bepul — shuning uchun to'lov/daromad bo'limlari yo'q.
'use strict';

const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

// Cloud.init() tugagach bu skript DINAMIK ravishda qo'shiladi — shu payt
// DOMContentLoaded allaqachon o'tib ketgan bo'lishi mumkin, shuning uchun
// oddiy addEventListener o'rniga readyState'ni ham tekshiramiz.
function _boAdminInit() {

    /* ---------- SESSIYANI TEKSHIRISH ---------- */
    const session = getSession();
    if (!session || session.type !== 'admin') {
        window.location.href = 'kirish.html';
        return;
    }
    ensureAdmin();

    /* ---------- ADMIN PROFIL ---------- */
    function paintAdminProfile() {
        const a = boCloudGet('bo_admin', {});
        document.getElementById('adminName').textContent = a.name || 'Admin';
        document.getElementById('adminAvatar').textContent = (a.name || 'A')[0].toUpperCase();
    }
    paintAdminProfile();

    /* ---------- HOLAT ---------- */
    const PAGE_SIZE = 25;
    let clientFilter = 'all';
    let clientQuery = '';
    let clientLimit = PAGE_SIZE;
    let currentSection = 'dashboard';

    /* ---------- NAVIGATION ---------- */
    document.querySelectorAll('.admin-link[data-section]').forEach(btn => {
        btn.addEventListener('click', () => goTo(btn.dataset.section));
    });
    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => {
            if (el.dataset.filter) setClientFilter(el.dataset.filter, false);
            goTo(el.dataset.goto);
        });
    });

    function goTo(section) {
        currentSection = section;
        document.querySelectorAll('.admin-link').forEach(l => l.classList.toggle('active', l.dataset.section === section));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.toggle('active', s.id === 'sec-' + section));
        renderSection(section);
        if (section !== 'bot') stopBotPolling();

        document.getElementById('adminSidebar').classList.remove('open');
        document.getElementById('adminOverlay').classList.remove('show');
        window.scrollTo(0, 0);
    }

    function renderSection(section) {
        if (section === 'dashboard') renderDashboard();
        if (section === 'clients') renderClients();
        if (section === 'messages') renderMessages();
        if (section === 'apps') renderAppsAdmin();
        if (section === 'bot') renderBot();
        if (section === 'settings') loadSettings();
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

    /* ---------- TOPBAR ---------- */
    document.getElementById('adminNotifBtn').addEventListener('click', () => goTo('messages'));
    document.getElementById('adminSyncBtn').addEventListener('click', async (e) => {
        const ic = e.currentTarget.querySelector('i');
        ic.classList.add('fa-spin');
        await syncNow();
        ic.classList.remove('fa-spin');
        toast("Ma'lumotlar yangilandi", 'success');
    });

    // Qidiruv — har doim mijozlar bo'limida ishlaydi
    const searchEl = document.getElementById('adminSearch');
    searchEl.addEventListener('input', () => {
        clientQuery = searchEl.value.trim().toLowerCase();
        clientLimit = PAGE_SIZE;
        if (currentSection !== 'clients') goTo('clients'); else renderClients();
    });

    /* ---------- LOGOUT ---------- */
    document.getElementById('adminLogout').addEventListener('click', () => {
        localStorage.removeItem('bo_session');
        toast('Tizimdan chiqildi', 'success');
        setTimeout(() => { window.location.href = 'kirish.html'; }, 600);
    });

    /* ====================================================
       ==================== DASHBOARD =====================
       ==================================================== */
    function renderDashboard() {
        const clients = getClients();
        const weekAgo = Date.now() - 7 * 86400000;
        const newThisWeek = clients.filter(c => new Date(c.createdAt).getTime() >= weekAgo).length;
        const totalSubs = clients.reduce((s, c) => s + activeSubsOf(c).length, 0);
        const withSubs = clients.filter(c => activeSubsOf(c).length > 0).length;

        setText('kpiClients', clients.length);
        setText('kpiClientsWeek', newThisWeek ? `+${newThisWeek} shu hafta` : 'Shu hafta yangi yo\'q');
        setText('kpiSubs', totalSubs);
        setText('kpiSubsHint', `${withSubs} ta mijozda`);
        setText('kpiNoSub', clients.filter(c => !isBlocked(c) && activeSubsOf(c).length === 0).length);
        setText('kpiUnread', totalUnreadMsgs());

        renderRegChart(clients);
        renderDistrib(clients);

        const recent = sortedClients(clients).slice(0, 6);
        const tb = document.getElementById('dashRecent');
        tb.innerHTML = recent.length
            ? recent.map(c => `
                <tr class="clickable" data-open-client="${escapeHtml(c.id)}">
                    <td>${clientCell(c)}</td>
                    <td>${escapeHtml(c.phone) || dash()}</td>
                    <td>${subChips(c)}</td>
                    <td>${formatDate(c.createdAt)}</td>
                    <td>${statusPill(c)}</td>
                </tr>`).join('')
            : emptyRow(5, 'fa-users', "Mijozlar yo'q", "Hali hech kim ro'yxatdan o'tmagan");
        wireOpenClient(tb);
    }

    function renderRegChart(clients) {
        const days = 14;
        const buckets = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            buckets.push({ d, n: 0 });
        }
        clients.forEach(c => {
            const t = new Date(c.createdAt); t.setHours(0, 0, 0, 0);
            const b = buckets.find(x => x.d.getTime() === t.getTime());
            if (b) b.n++;
        });
        const max = Math.max(...buckets.map(b => b.n), 1);
        const total = buckets.reduce((s, b) => s + b.n, 0);
        setText('regChartTotal', total ? `+${total}` : '0');
        document.getElementById('regChart').innerHTML = buckets.map((b, i) => `
            <div class="rc-col" title="${b.d.getDate()} ${UZ_MONTHS[b.d.getMonth()]}: ${b.n} ta">
                <span class="rc-val">${b.n || ''}</span>
                <div class="rc-bar" style="height:${Math.max(4, Math.round((b.n / max) * 100))}%"></div>
                <span class="rc-day">${i % 2 === (days - 1) % 2 ? b.d.getDate() : ''}</span>
            </div>`).join('');
    }

    function renderDistrib(clients) {
        const apps = getApps();
        const el = document.getElementById('appDistrib');
        const counts = subCountsByApp(clients);
        const total = Math.max(Object.values(counts).reduce((s, n) => s + n, 0), 1);
        const rows = apps
            .map(a => ({ a, n: counts[a.id] || 0 }))
            .sort((x, y) => y.n - x.n);
        el.innerHTML = rows.length
            ? rows.map(({ a, n }) => {
                const pct = Math.round((n / total) * 100);
                return `
                    <div class="distrib-row">
                        <div class="label-row">
                            <span>${appIcon(a)} ${escapeHtml(a.name)}</span>
                            <strong>${n} <small>(${pct}%)</small></strong>
                        </div>
                        <div class="distrib-bar"><span style="width:${pct}%"></span></div>
                    </div>`;
            }).join('')
            : `<p class="muted">Ilovalar mavjud emas</p>`;
    }

    /* ====================================================
       ===================== MIJOZLAR =====================
       ==================================================== */
    document.querySelectorAll('#clientFilters .chip').forEach(ch =>
        ch.addEventListener('click', () => setClientFilter(ch.dataset.filter, true)));

    function setClientFilter(f, render) {
        clientFilter = f;
        clientLimit = PAGE_SIZE;
        document.querySelectorAll('#clientFilters .chip').forEach(c => c.classList.toggle('active', c.dataset.filter === f));
        if (render) renderClients();
    }

    function filterClients(clients) {
        let list = clients;
        if (clientFilter === 'subscribed') list = list.filter(c => !isBlocked(c) && activeSubsOf(c).length > 0);
        if (clientFilter === 'nosub') list = list.filter(c => !isBlocked(c) && activeSubsOf(c).length === 0);
        if (clientFilter === 'blocked') list = list.filter(isBlocked);
        if (clientQuery) {
            const qDigits = clientQuery.replace(/\D/g, '');
            list = list.filter(c => {
                const hay = [c.id, c.username, c.businessName, c.email, ...activeSubsOf(c).flatMap(s => [s.name, s.shopName || ''])]
                    .filter(Boolean).join(' ').toLowerCase();
                return hay.includes(clientQuery) || (qDigits.length >= 3 && digitsOf(c.phone).includes(qDigits));
            });
        }
        return sortedClients(list);
    }

    function renderClients() {
        const all = getClients();
        setText('fcAll', all.length);
        setText('fcSub', all.filter(c => !isBlocked(c) && activeSubsOf(c).length > 0).length);
        setText('fcNoSub', all.filter(c => !isBlocked(c) && activeSubsOf(c).length === 0).length);
        setText('fcBlocked', all.filter(isBlocked).length);

        const list = filterClients(all);
        const shown = list.slice(0, clientLimit);
        const tbody = document.getElementById('clientsTbody');
        if (!shown.length) {
            tbody.innerHTML = clientQuery
                ? emptyRow(6, 'fa-magnifying-glass', 'Hech narsa topilmadi', `"${escapeHtml(clientQuery)}" bo'yicha mijoz yo'q`)
                : emptyRow(6, 'fa-users', "Mijozlar yo'q", "Bu filtr bo'yicha mijoz topilmadi");
        } else {
            tbody.innerHTML = shown.map(c => `
                <tr class="clickable" data-open-client="${escapeHtml(c.id)}">
                    <td>${clientCell(c)}</td>
                    <td>${escapeHtml(c.phone) || dash()}</td>
                    <td>${subChips(c)}</td>
                    <td>${formatDate(c.createdAt)}<div class="sub-line">${agoText(c.createdAt)}</div></td>
                    <td>${statusPill(c)}</td>
                    <td>
                        <div class="row-actions">
                            <button class="icon-act" data-msg-client="${escapeHtml(c.id)}" title="Xabar yozish"><i class="fa-solid fa-comment"></i></button>
                            <button class="icon-act ${isBlocked(c) ? 'ok' : 'warn'}" data-block-client="${escapeHtml(c.id)}" title="${isBlocked(c) ? 'Blokdan chiqarish' : 'Bloklash'}">
                                <i class="fa-solid ${isBlocked(c) ? 'fa-lock-open' : 'fa-ban'}"></i>
                            </button>
                            <button class="icon-act danger" data-del-client="${escapeHtml(c.id)}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`).join('');
        }

        const foot = document.getElementById('clientsFoot');
        foot.innerHTML = list.length > shown.length
            ? `<span>${shown.length} / ${list.length} ko'rsatilmoqda</span><button class="btn btn-outline btn-sm" id="clientsMore">Yana ko'rsatish</button>`
            : (list.length ? `<span>Jami: ${list.length}</span>` : '');
        document.getElementById('clientsMore')?.addEventListener('click', () => { clientLimit += PAGE_SIZE; renderClients(); });

        wireOpenClient(tbody);
        tbody.querySelectorAll('[data-msg-client]').forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation(); openChatWith(b.dataset.msgClient);
        }));
        tbody.querySelectorAll('[data-block-client]').forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation(); toggleBlock(b.dataset.blockClient);
        }));
        tbody.querySelectorAll('[data-del-client]').forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation(); deleteClient(b.dataset.delClient);
        }));
        updateNavCounts();
    }

    function wireOpenClient(root) {
        root.querySelectorAll('[data-open-client]').forEach(tr =>
            tr.addEventListener('click', () => openClientModal(tr.dataset.openClient)));
    }

    // Serverdan eng so'nggi ro'yxatni olib, bitta mijozni o'zgartirish
    // (eskirgan kesh bilan boshqa mijozlar yozuvini ustidan yozmaslik uchun).
    async function updateClient(id, mutate) {
        await boCloudRefresh();
        const subs = getClients();
        const idx = subs.findIndex(s => s.id === id);
        if (idx < 0) { toast('Mijoz topilmadi', 'error'); return null; }
        const res = await mutate(subs[idx]);
        if (res === false) return null;
        boCloudSet('bo_subscriptions', subs);
        return subs[idx];
    }

    function toggleBlock(id) {
        const c = getClients().find(x => x.id === id);
        if (!c) return;
        const blocking = !isBlocked(c);
        const run = async () => {
            const upd = await updateClient(id, (cl) => { cl.status = blocking ? 'blocked' : 'registered'; });
            if (!upd) return;
            refreshViews();
            if (document.getElementById('clientModal').classList.contains('show')) openClientModal(id);
            toast(blocking ? `${displayName(upd)} bloklandi — endi kira olmaydi` : `${displayName(upd)} blokdan chiqarildi`, 'success');
        };
        if (blocking) confirmAction(`${displayName(c)} bloklansinmi?`, "Mijoz o'z hisobiga va ilovalar boshqaruviga kira olmaydi. Keyin blokdan chiqarish mumkin.", run, 'Ha, bloklash');
        else run();
    }

    function deleteClient(id) {
        const c = getClients().find(x => x.id === id);
        if (!c) return;
        confirmAction(`${displayName(c)} o'chirilsinmi?`, "Mijoz hisobi va obunalari butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.", async () => {
            await boCloudRefresh();
            boCloudSet('bo_subscriptions', getClients().filter(x => x.id !== id));
            hideModal('clientModal');
            refreshViews();
            toast("Mijoz o'chirildi", 'success');
        }, "Ha, o'chirish");
    }

    /* ---------- MIJOZ MODALI ---------- */
    let modalClientId = null;

    function openClientModal(id) {
        const c = getClients().find(x => x.id === id);
        if (!c) return;
        modalClientId = id;

        document.getElementById('cmTitle').innerHTML = `
            <div class="aav lg">${initial(displayName(c))}</div>
            <div>
                <h3>${escapeHtml(displayName(c))} ${statusPill(c)}</h3>
                <div class="sub-line">${escapeHtml(c.id)} · ro'yxatdan o'tgan: ${formatDate(c.createdAt)}</div>
            </div>`;

        const blk = document.getElementById('cmToggleBlock');
        blk.className = 'btn btn-sm ' + (isBlocked(c) ? 'btn-outline' : 'btn-warn-ghost');
        blk.innerHTML = isBlocked(c)
            ? '<i class="fa-solid fa-lock-open"></i> Blokdan chiqarish'
            : '<i class="fa-solid fa-ban"></i> Bloklash';

        const subs = activeSubsOf(c);
        const subsEl = document.getElementById('cmSubs');
        subsEl.innerHTML = subs.length
            ? subs.map(s => `
                <div class="cm-sub-row">
                    <div class="cm-sub-ic">${subIcon(s)}</div>
                    <div class="cm-sub-info">
                        <strong>${escapeHtml(s.shopName || s.name || 'Ilova')}</strong>
                        <span>${s.shopName ? escapeHtml(s.name || 'Ilova') + ' · ' : ''}${formatDate(s.activatedAt)} dan beri</span>
                    </div>
                    <a class="icon-act" href="${escapeHtml(storeUrl(c, s.demoUrl, 'index.html', s))}" target="_blank" rel="noopener" title="Do'konni ochish"><i class="fa-solid fa-store"></i></a>
                    <a class="icon-act" href="${escapeHtml(storeUrl(c, s.adminUrl, 'admin.html', s))}" target="_blank" rel="noopener" title="Do'kon boshqaruvi"><i class="fa-solid fa-sliders"></i></a>
                    <button type="button" class="icon-act danger" data-cancel-sub="${escapeHtml(s.id)}" title="Obunani bekor qilish"><i class="fa-solid fa-xmark"></i></button>
                </div>`).join('')
            : `<div class="cm-empty"><i class="fa-solid fa-layer-group"></i> Hali birorta ilovaga obuna bo'lmagan</div>`;
        subsEl.querySelectorAll('[data-cancel-sub]').forEach(b =>
            b.addEventListener('click', () => cancelSub(id, b.dataset.cancelSub)));

        document.getElementById('editClientId').value = c.id;
        document.getElementById('editUsername').value = c.username || c.businessName || '';
        document.getElementById('editPhone').value = c.phone || '';
        document.getElementById('editStatus').value = isBlocked(c) ? 'blocked' : 'ok';
        document.getElementById('editPassword').value = '';
        showModal('clientModal');
    }

    document.getElementById('cmMessage').addEventListener('click', () => { hideModal('clientModal'); openChatWith(modalClientId); });
    document.getElementById('cmToggleBlock').addEventListener('click', () => toggleBlock(modalClientId));
    document.getElementById('cmDelete').addEventListener('click', () => deleteClient(modalClientId));

    function cancelSub(clientId, subId) {
        const c = getClients().find(x => x.id === clientId);
        const s = c && activeSubsOf(c).find(x => x.id === subId);
        if (!s) return;
        confirmAction(`"${s.shopName || s.name}" obunasi bekor qilinsinmi?`, "Ilova mijoz dashbordidan olib tashlanadi. Mijoz keyin qayta obuna bo'lishi mumkin.", async () => {
            const upd = await updateClient(clientId, (cl) => {
                const sub = (cl.subscriptions || []).find(x => x.id === subId);
                if (!sub) return false;
                sub.status = 'cancelled';
                sub.cancelledAt = new Date().toISOString();
            });
            if (!upd) return;
            openClientModal(clientId);
            refreshViews();
            toast('Obuna bekor qilindi', 'success');
        }, 'Ha, bekor qilish');
    }

    document.getElementById('clientEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editClientId').value;
        const username = document.getElementById('editUsername').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const statusSel = document.getElementById('editStatus').value;
        const newPass = document.getElementById('editPassword').value.trim();

        if (!username) { toast('Foydalanuvchi nomini kiriting', 'error'); return; }
        if (newPass && newPass.length < 6) { toast("Parol kamida 6 ta belgidan iborat bo'lsin", 'error'); return; }

        const clash = getClients().find(c => c.id !== id && c.username && c.username.toLowerCase() === username.toLowerCase());
        if (clash) { toast('Bu foydalanuvchi nomi band', 'error'); return; }

        const passHash = newPass ? await hashPassword(newPass) : null;
        const upd = await updateClient(id, (cl) => {
            cl.username = username;
            cl.businessName = username;
            cl.phone = phone;
            if (statusSel === 'blocked') cl.status = 'blocked';
            else if (isBlocked(cl)) cl.status = 'registered';
            if (passHash) cl.password = passHash;
        });
        if (!upd) return;
        hideModal('clientModal');
        refreshViews();
        toast("Mijoz ma'lumotlari saqlandi", 'success');
    });

    /* ---------- CSV EKSPORT ---------- */
    document.getElementById('exportClients').addEventListener('click', () => {
        const list = filterClients(getClients());
        const head = ['ID', 'Foydalanuvchi', 'Telefon', 'Ilovalar', "Ro'yxatdan o'tgan", 'Holat'];
        const rows = list.map(c => [
            c.id, displayName(c), c.phone || '',
            activeSubsOf(c).map(s => s.shopName ? `${s.shopName} (${s.name})` : s.name).join('; '),
            c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
            isBlocked(c) ? 'Bloklangan' : 'Faol'
        ]);
        const csv = '﻿' + [head, ...rows]
            .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `biznesonline-mijozlar-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast(`${list.length} ta mijoz yuklab olindi`, 'success');
    });

    /* ====================================================
       ============ XABARLAR (mijozlar bilan) =============
       ==================================================== */
    function getMessages() { return boCloudGet('bo_messages', []) || []; }
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
            if (sub) c.clientName = displayName(sub);
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

    // Mijozlar ro'yxati / modalidan "Xabar yozish" — suhbat bo'lmasa ham ochiladi
    function openChatWith(clientId) {
        goTo('messages');
        openConversation(clientId);
        document.getElementById('msgReplyInput').focus();
    }

    function renderConvoList() {
        const list = document.getElementById('msgConvos');
        const convos = getConversations();
        if (!convos.length) {
            list.innerHTML = `<div class="adm-empty sm"><i class="fa-regular fa-comments"></i><h3>Xabar yo'q</h3><p>Mijozlar yozsa shu yerda chiqadi</p></div>`;
            return;
        }
        list.innerHTML = convos.map(c => `
            <button class="msg-convo ${c.clientId === activeConvoId ? 'active' : ''}" data-convo="${escapeHtml(c.clientId)}">
                <div class="aav msg-convo-av">${initial(c.clientName)}</div>
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
        const all = getMessages();
        let changed = false;
        all.forEach(m => { if (m.clientId === clientId && m.from === 'client' && !m.read) { m.read = true; changed = true; } });
        if (changed) saveMessages(all);
        renderConvoList();
        renderConversation(clientId);
        updateMsgBadges();
        document.querySelector('.msg-layout')?.classList.add('has-active');
    }

    function renderConversation(clientId) {
        const emptyEl = document.getElementById('msgPanelEmpty');
        const convEl = document.getElementById('msgConversation');
        const sub = getClients().find(s => s.id === clientId);
        const convo = getConversations().find(c => c.clientId === clientId);
        if (!convo && !sub) { emptyEl.style.display = ''; convEl.style.display = 'none'; return; }
        emptyEl.style.display = 'none';
        convEl.style.display = 'flex';

        const name = sub ? displayName(sub) : convo.clientName;
        document.getElementById('msgConvHead').innerHTML = `
            <button class="icon-act msg-back" id="msgBack" title="Orqaga" aria-label="Orqaga"><i class="fa-solid fa-arrow-left"></i></button>
            <div class="aav">${initial(name)}</div>
            <div class="msg-conv-head-info">
                <strong>${escapeHtml(name)}</strong>
                <div class="msg-conv-sub">${escapeHtml(clientId)}${sub && sub.phone ? ' · ' + escapeHtml(sub.phone) : ''}</div>
            </div>
            ${sub ? `<button class="btn btn-outline btn-sm" id="msgOpenClient"><i class="fa-solid fa-id-card"></i> Profil</button>` : ''}`;
        document.getElementById('msgBack').addEventListener('click', () => {
            document.querySelector('.msg-layout')?.classList.remove('has-active');
        });
        document.getElementById('msgOpenClient')?.addEventListener('click', () => openClientModal(clientId));

        const thread = document.getElementById('msgConvThread');
        const msgs = convo ? convo.messages : [];
        thread.innerHTML = msgs.length
            ? msgs.map(m => `
                <div class="msg-row ${m.from === 'admin' ? 'me' : 'them'}">
                    <div class="msg-bubble">
                        <p>${escapeHtml(m.text)}</p>
                        <span class="msg-meta">${m.from === 'admin' ? 'Siz' : escapeHtml(name)} · ${timeAgo(m.createdAt)}${m.from === 'admin' ? (m.read ? ' · <i class="fa-solid fa-check-double"></i>' : ' · <i class="fa-solid fa-check"></i>') : ''}</span>
                    </div>
                </div>`).join('')
            : `<div class="msg-thread-empty">Bu mijoz bilan hali yozishmagansiz. Birinchi xabarni yuboring.</div>`;
        thread.scrollTop = thread.scrollHeight;
    }

    const msgReplyForm = document.getElementById('msgReplyForm');
    const msgReplyInput = document.getElementById('msgReplyInput');
    function autoGrowReply(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
    msgReplyInput.addEventListener('input', () => autoGrowReply(msgReplyInput));
    msgReplyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); msgReplyForm.requestSubmit(); }
    });
    msgReplyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!activeConvoId) return;
        const text = msgReplyInput.value.trim();
        if (!text) return;
        await boCloudRefresh();   // shu orada mijoz yozgan xabarlarni yo'qotmaslik uchun
        const sub = getClients().find(s => s.id === activeConvoId);
        const convo = getConversations().find(c => c.clientId === activeConvoId);
        const all = getMessages();
        all.push({
            id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1e4),
            clientId: activeConvoId,
            clientName: sub ? displayName(sub) : (convo ? convo.clientName : activeConvoId),
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
        toast('Javob yuborildi', 'success');
    });

    // Boshqa tabda (mijoz) o'zgarsa — jonli yangilash
    window.addEventListener('storage', (e) => {
        if (e.key !== 'bo_messages') return;
        updateMsgBadges();
        if (currentSection === 'messages') renderMessages();
    });

    /* ====================================================
       ============ ILOVALAR (APPS) CRUD ==================
       ==================================================== */
    function getApps() { return boCloudGet('bo_apps', []) || []; }
    function saveApps(arr) { boCloudSet('bo_apps', arr); }

    function renderAppsAdmin() {
        const apps = getApps();
        const grid = document.getElementById('appsAdminGrid');
        const counts = subCountsByApp(getClients());

        if (!apps.length) {
            grid.innerHTML = `<div class="adm-empty" style="grid-column:1/-1"><i class="fa-solid fa-mobile-screen"></i><h3>Ilovalar yo'q</h3><p>"Yangi ilova" tugmasini bosing</p></div>`;
            return;
        }

        grid.innerHTML = apps.map(a => `
            <div class="app-admin-card ${a.active === false ? 'is-off' : ''}">
                <div class="aa-top">
                    <div class="aa-logo">${appIcon(a)}</div>
                    <div class="aa-badges">
                        ${a.popular ? `<span class="aa-popular"><i class="fa-solid fa-fire"></i> Mashhur</span>` : ''}
                        <span class="aa-status ${a.active === false ? 'off' : 'on'}">${a.active === false ? 'Yashirin' : 'Faol'}</span>
                    </div>
                </div>
                <h4>${escapeHtml(a.name)}</h4>
                <div class="aa-slug">/${escapeHtml(a.slug || '')}</div>
                <p class="aa-desc">${escapeHtml(a.desc || '')}</p>
                <div class="aa-meta">
                    <span><i class="fa-solid fa-users"></i> ${counts[a.id] || 0} obunachi</span>
                    <span><i class="fa-solid fa-list-check"></i> ${(a.features || []).length} imkoniyat</span>
                </div>
                <div class="aa-actions">
                    <button class="aa-edit" data-edit-app="${escapeHtml(a.id)}"><i class="fa-solid fa-pen"></i> Tahrirlash</button>
                    ${a.demoUrl ? `<a class="aa-icon" href="${escapeHtml(a.demoUrl)}" target="_blank" rel="noopener" title="Demoni ochish"><i class="fa-solid fa-eye"></i></a>` : ''}
                    <button class="aa-icon" data-toggle-app="${escapeHtml(a.id)}" title="${a.active === false ? "Saytda ko'rsatish" : 'Saytdan yashirish'}">
                        <i class="fa-solid ${a.active === false ? 'fa-eye-slash' : 'fa-toggle-on'}"></i>
                    </button>
                    <button class="aa-icon danger" data-del-app="${escapeHtml(a.id)}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('');

        grid.querySelectorAll('[data-edit-app]').forEach(b => b.addEventListener('click', () => openAppModal(b.dataset.editApp)));
        grid.querySelectorAll('[data-del-app]').forEach(b => b.addEventListener('click', () => deleteApp(b.dataset.delApp)));
        grid.querySelectorAll('[data-toggle-app]').forEach(b => b.addEventListener('click', () => {
            const apps = getApps();
            const a = apps.find(x => x.id === b.dataset.toggleApp);
            if (!a) return;
            a.active = a.active === false;
            saveApps(apps);
            renderAppsAdmin();
            toast(a.active ? `${a.name} saytda ko'rinadi` : `${a.name} saytdan yashirildi`, 'success');
        }));
    }

    document.getElementById('addAppBtn').addEventListener('click', () => openAppModal(null));

    let currentEditingApp = { logo: null };

    function openAppModal(id) {
        document.getElementById('appForm').reset();
        currentEditingApp = { logo: null };
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
            currentEditingApp.logo = app.logo || null;
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
            prev.innerHTML = `<img src="${escapeHtml(currentEditingApp.logo)}" alt="logo">`;
            clr.style.display = 'inline-flex';
        } else {
            prev.innerHTML = `<i class="fa-solid fa-image"></i><span>Logo</span>`;
            clr.style.display = 'none';
        }
    }

    const logoFile = document.getElementById('appLogoFile');
    document.getElementById('appLogoPick').addEventListener('click', () => logoFile.click());
    logoFile.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        readImageAsDataURL(f, 400, async (dataUrl, blob) => {
            // Darrov ko'rsatamiz (base64), fonda Supabase Storage'ga yuklaymiz —
            // muvaffaqiyatli bo'lsa katta base64 o'rniga qisqa URL saqlanadi.
            currentEditingApp.logo = dataUrl;
            refreshLogoPreview();
            if (window.Cloud && blob) {
                const url = await Cloud.uploadImage(blob, f.name || 'logo.jpg');
                if (url) { currentEditingApp.logo = url; refreshLogoPreview(); }
            }
        });
        logoFile.value = '';
    });
    document.getElementById('appLogoClear').addEventListener('click', () => {
        currentEditingApp.logo = null;
        refreshLogoPreview();
    });

    document.getElementById('appForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('appId').value;
        const apps = getApps();
        const data = {
            name: document.getElementById('appName').value.trim(),
            slug: document.getElementById('appSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
            desc: document.getElementById('appDesc').value.trim(),
            features: document.getElementById('appFeatures').value.split('\n').map(s => s.trim()).filter(Boolean),
            demoUrl: document.getElementById('appDemoUrl').value.trim(),
            adminUrl: document.getElementById('appAdminUrl').value.trim(),
            logo: currentEditingApp.logo,
            logoEmoji: document.getElementById('appLogoEmoji').value.trim() || '📱',
            active: document.getElementById('appActive').checked,
            popular: document.getElementById('appPopular').checked
        };

        if (!data.name || !data.slug || !data.desc) { toast("Asosiy maydonlarni to'ldiring", 'error'); return; }
        if (apps.some(a => a.id !== id && a.slug === data.slug)) { toast('Bu slug boshqa ilovada band', 'error'); return; }

        if (id) {
            const idx = apps.findIndex(a => a.id === id);
            if (idx >= 0) apps[idx] = { ...apps[idx], ...data };
            toast('Ilova yangilandi', 'success');
        } else {
            data.id = 'app-' + Date.now();
            data.createdAt = new Date().toISOString();
            apps.push(data);
            toast("Ilova qo'shildi — saytda paydo bo'ldi", 'success');
        }
        saveApps(apps);
        hideModal('appModal');
        renderAppsAdmin();
    });

    function deleteApp(id) {
        const app = getApps().find(a => a.id === id);
        if (!app) return;
        const n = subCountsByApp(getClients())[id] || 0;
        confirmAction(`"${app.name}" o'chirilsinmi?`,
            n ? `Diqqat: ${n} ta mijoz shu ilovaga obuna. Ilova saytdan yo'qoladi — vaqtincha yashirish uchun "Yashirish" tugmasidan foydalaning.`
              : "Ilova saytda ko'rinmay qoladi.",
            () => {
                saveApps(getApps().filter(a => a.id !== id));
                renderAppsAdmin();
                toast("Ilova o'chirildi", 'success');
            }, "Ha, o'chirish");
    }

    // Rasmni o'qish va kichraytirish (canvas). cb(dataUrl, blob)
    function readImageAsDataURL(file, maxSize, cb) {
        if (!file || !file.type.startsWith('image/')) { toast('Faqat rasm fayllari', 'error'); return; }
        if (file.size > 5 * 1024 * 1024) { toast('Rasm hajmi 5MB dan oshmasin', 'error'); return; }
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
            img.onerror = () => toast('Rasm yuklanmadi', 'error');
            img.src = ev.target.result;
        };
        reader.onerror = () => toast("Faylni o'qishda xato", 'error');
        reader.readAsDataURL(file);
    }

    /* ====================================================
       ============ TELEGRAM BOT PANELI ===================
       ==================================================== */
    function getBotApi() {
        const saved = boCloudGet('bo_bot_api', '');
        // eski (o'chirilgan) tiro19/tiro21 manzili e'tiborga olinmaydi
        return ((saved && !/(^|\/\/)(tiro19|tiro21)\.alwaysdata\.net/i.test(saved) ? saved : '') || (/^(localhost|127\.)/.test(location.hostname) ? 'http://localhost:3344' : 'https://onlinebiznes.alwaysdata.net')).replace(/\/+$/, '');
    }

    let botPollTimer = null;
    let botReqSeq = 0;
    function stopBotPolling() {
        if (botPollTimer) { clearInterval(botPollTimer); botPollTimer = null; }
    }

    function setBotStatus(state, text) {
        const el = document.getElementById('botStatus');
        el.className = 'bot-status ' + state;
        el.innerHTML = `<span class="bot-status-dot"></span> ${text}`;
        document.getElementById('botNavDot').style.display = state === 'online' ? 'inline-block' : 'none';
        setText('botApiLabel', getBotApi());
    }

    async function fetchBotStats() {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 4000);
        try {
            const res = await fetch(getBotApi() + '/bot/stats', { signal: controller.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch { return null; }
        finally { clearTimeout(t); }
    }

    async function renderBot() {
        if (!botPollTimer) botPollTimer = setInterval(renderBot, 15000);
        if (!document.getElementById('botStatus').classList.contains('online')) setBotStatus('checking', 'Tekshirilmoqda...');

        const myReq = ++botReqSeq;
        const stats = await fetchBotStats();
        if (myReq !== botReqSeq) return;

        const tbody = document.getElementById('botUsersTbody');
        if (!stats || !stats.ok) {
            setBotStatus('offline', 'Bot oflayn');
            ['botTotalUsers', 'botActiveUsers', 'botConnections'].forEach(id => setText(id, '—'));
            tbody.innerHTML = emptyRow(4, 'fa-brands fa-telegram', 'Bot ulanmagan', "Bot ishlab turganini va pastdagi API manzili to'g'riligini tekshiring");
            return;
        }

        setBotStatus('online', 'Bot onlayn');
        setText('botTotalUsers', stats.total || 0);
        setText('botActiveUsers', stats.active || 0);
        setText('botConnections', stats.connections || 0);

        const users = stats.users || [];
        tbody.innerHTML = users.length
            ? users.map(u => `
                <tr>
                    <td>
                        <div class="cell-user">
                            <div class="aav sm">${initial(u.firstName || '?')}</div>
                            <div>
                                <strong>${escapeHtml(u.firstName || '—')}</strong>
                                <div class="sub-line">ID: ${escapeHtml(String(u.id || ''))}</div>
                            </div>
                        </div>
                    </td>
                    <td>${u.username ? '@' + escapeHtml(u.username) : dash()}</td>
                    <td>${timeAgo(u.lastSeen)}</td>
                    <td>${u.active ? '<span class="pill ok">Faol</span>' : '<span class="pill muted">Nofaol</span>'}</td>
                </tr>`).join('')
            : emptyRow(4, 'fa-user-slash', "Hozircha foydalanuvchi yo'q", 'Kimdir botga /start yozsa shu yerda ko\'rinadi');
    }

    document.getElementById('botRefresh').addEventListener('click', renderBot);

    const bcText = document.getElementById('botBroadcastText');
    bcText.addEventListener('input', () => setText('botCharCount', bcText.value.length));

    document.getElementById('botBroadcastBtn').addEventListener('click', () => {
        const text = bcText.value.trim();
        const resEl = document.getElementById('botBroadcastResult');
        if (!text) { toast('Xabar matnini kiriting', 'error'); return; }
        confirmAction('Ommaviy xabar yuborilsinmi?', 'Xabar botdagi BARCHA foydalanuvchilarga boradi.', async () => {
            const btn = document.getElementById('botBroadcastBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yuborilmoqda...';
            try {
                const headers = { 'Content-Type': 'application/json' };
                const tok = boCloudGet('bo_bot_token', '');
                if (tok) headers['X-Admin-Token'] = tok;
                const res = await fetch(getBotApi() + '/bot/broadcast', { method: 'POST', headers, body: JSON.stringify({ text }) });
                const data = await res.json();
                if (!data.ok) throw new Error(data.error || 'Xato');
                resEl.style.display = 'block';
                resEl.className = 'bot-broadcast-result ok';
                resEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Yuborildi: <strong>${data.sent}</strong> ta · Xato: ${data.failed} ta · Jami: ${data.total} ta`;
                bcText.value = '';
                setText('botCharCount', 0);
                toast('Broadcast yuborildi', 'success');
                renderBot();
            } catch (e) {
                resEl.style.display = 'block';
                resEl.className = 'bot-broadcast-result err';
                resEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Yuborilmadi — bot oflayn yoki xato: ${escapeHtml(String(e.message || e))}`;
                toast('Broadcast yuborilmadi — bot ishlab turibdimi?', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Hammaga yuborish';
            }
        }, 'Ha, yuborish');
    });

    document.getElementById('saveBotConn').addEventListener('click', () => {
        const botApi = document.getElementById('setBotApi').value.trim().replace(/\/+$/, '');
        const botToken = document.getElementById('setBotToken').value.trim();
        if (botApi) boCloudSet('bo_bot_api', botApi); else removeKey('bo_bot_api');
        if (botToken) boCloudSet('bo_bot_token', botToken); else removeKey('bo_bot_token');
        toast('Bot ulanish sozlamalari saqlandi', 'success');
        renderBot();
    });

    /* ====================================================
       ==================== SOZLAMALAR ====================
       ==================================================== */
    function loadSettings() {
        const a = boCloudGet('bo_admin', {});
        document.getElementById('setAdmName').value = a.name || '';
        document.getElementById('setAdmUser').value = a.username || '';
        document.getElementById('setAdmPass').value = '';
        document.getElementById('setAdmPass2').value = '';

        const social = boCloudGet('bo_social', {}) || {};
        const soc = { setSocTelegram: 'telegram', setSocInstagram: 'instagram', setSocFacebook: 'facebook', setSocYoutube: 'youtube' };
        Object.keys(soc).forEach(id => { document.getElementById(id).value = social[soc[id]] || ''; });
    }

    document.getElementById('saveAdmin').addEventListener('click', async () => {
        const name = document.getElementById('setAdmName').value.trim();
        const username = document.getElementById('setAdmUser').value.trim();
        const np = document.getElementById('setAdmPass').value;
        const np2 = document.getElementById('setAdmPass2').value;
        if (!username) { toast('Login bo\'sh bo\'lmasin', 'error'); return; }
        if (np && np.length < 6) { toast("Parol kamida 6 ta belgidan iborat bo'lsin", 'error'); return; }
        if (np !== np2) { toast('Parollar mos kelmadi', 'error'); return; }

        await boCloudRefresh();
        const a = boCloudGet('bo_admin', {});
        a.name = name;
        a.username = username;
        if (np) a.password = await hashPassword(np);
        boCloudSet('bo_admin', a);
        document.getElementById('setAdmPass').value = '';
        document.getElementById('setAdmPass2').value = '';
        paintAdminProfile();
        toast('Admin profili saqlandi', 'success');
    });

    document.getElementById('saveSocial').addEventListener('click', () => {
        const val = (id) => document.getElementById(id).value.trim();
        boCloudSet('bo_social', {
            telegram: val('setSocTelegram'),
            instagram: val('setSocInstagram'),
            facebook: val('setSocFacebook'),
            youtube: val('setSocYoutube')
        });
        toast('Ijtimoiy tarmoq havolalari saqlandi', 'success');
    });

    // Bot sozlamalari maydonlarini bir marta to'ldiramiz
    document.getElementById('setBotApi').value = boCloudGet('bo_bot_api', '') || '';
    document.getElementById('setBotToken').value = boCloudGet('bo_bot_token', '') || '';

    /* ---------- MODAL HELPERS ---------- */
    function showModal(id) { document.getElementById(id).classList.add('show'); }
    function hideModal(id) { document.getElementById(id).classList.remove('show'); }
    function anyModalOpen() { return !!document.querySelector('.adm-modal.show'); }
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => hideModal(b.dataset.close)));
    document.querySelectorAll('.adm-modal').forEach(m =>
        m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('show'); }));
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const open = [...document.querySelectorAll('.adm-modal.show')].pop();
        if (open) open.classList.remove('show');
    });

    let confirmCb = null;
    function confirmAction(title, text, cb, yesLabel) {
        setText('confirmTitle', title);
        setText('confirmText', text);
        setText('confirmYes', yesLabel || 'Ha, davom etish');
        confirmCb = cb;
        showModal('confirmModal');
    }
    document.getElementById('confirmYes').addEventListener('click', () => {
        const cb = confirmCb;
        confirmCb = null;
        hideModal('confirmModal');
        if (cb) cb();
    });

    /* ---------- SINXRONLASH ---------- */
    function updateNavCounts() {
        const n = getClients().length;
        setText('clientsNavCount', n || '');
    }
    function refreshViews() {
        updateNavCounts();
        updateMsgBadges();
        if (currentSection === 'dashboard') renderDashboard();
        if (currentSection === 'clients') renderClients();
        if (currentSection === 'apps') renderAppsAdmin();
    }
    async function syncNow() {
        await boCloudRefresh();
        refreshViews();
        if (currentSection === 'messages') renderMessages();
    }
    // Har 30 soniyada serverdan yangi mijoz/xabarlarni olamiz (modal ochiq yoki
    // foydalanuvchi yozayotgan bo'lsa — ekranni qayta chizmaymiz).
    setInterval(async () => {
        if (document.hidden) return;
        await boCloudRefresh();
        updateMsgBadges();
        updateNavCounts();
        const typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
        if (anyModalOpen() || typing) return;
        if (currentSection === 'messages') renderMessages();
        else if (currentSection === 'dashboard' || currentSection === 'clients') renderSection(currentSection);
    }, 30000);

    /* ---------- INITIAL RENDER ---------- */
    renderDashboard();
    updateMsgBadges();
    updateNavCounts();

    /* ====================================================
       ===================== HELPERS ======================
       ==================================================== */
    function getClients() { return boCloudGet('bo_subscriptions', []) || []; }
    function getSession() {
        try { return JSON.parse(localStorage.getItem('bo_session') || 'null'); }
        catch { return null; }
    }
    // Admin hisobi bo'lmasa — standart hisob (birinchi kirishda parol xeshlanadi)
    function ensureAdmin() {
        const a = boCloudGet('bo_admin', null);
        if (!a || (a.username === 'admin' && a.password === 'admin123')) {
            boCloudSet('bo_admin', { username: 'tiro', password: 'tiro2004', name: 'Bosh administrator' });
        }
    }
    function removeKey(k) { if (window.Cloud) Cloud.remove(k); else localStorage.removeItem(k); }
    function toast(msg, type) { window.showToast && window.showToast(msg, type); }

    function isBlocked(c) { return c.status === 'blocked' || c.status === 'paused' || c.status === 'rejected'; }
    function displayName(c) { return c.username || c.businessName || c.id; }
    // Eski bitta-ilova modelidagi mijozlarni ham hisobga olamiz
    function activeSubsOf(c) {
        if (Array.isArray(c.subscriptions)) return c.subscriptions.filter(s => s.status !== 'cancelled');
        if (c.app && c.status === 'active') return [{ id: 'legacy', appId: c.appId || null, slug: c.app, name: c.appName || c.app, activatedAt: c.activatedAt || c.createdAt }];
        return [];
    }
    function subCountsByApp(clients) {
        const apps = getApps();
        const counts = {};
        clients.forEach(c => activeSubsOf(c).forEach(s => {
            const app = apps.find(a => a.id === s.appId) || apps.find(a => a.slug === s.slug);
            if (app) counts[app.id] = (counts[app.id] || 0) + 1;
        }));
        return counts;
    }
    function sortedClients(list) {
        return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    function digitsOf(s) { return String(s || '').replace(/\D/g, ''); }

    // Mijoz do'koni havolasi (dashboard.js dagi buildUrl bilan bir xil qoida)
    function storeUrl(c, rel, page, sub) {
        const apps = getApps();
        const app = apps.find(a => a.id === sub.appId) || apps.find(a => a.slug === sub.slug);
        const fallback = (app && (page === 'admin.html' ? app.adminUrl : app.demoUrl)) || ('fast-food-dokoni/' + page);
        const r = (rel || fallback).replace(/^\/?app\//, 'fast-food-dokoni/');
        return r + (r.includes('?') ? '&' : '?') + 'client=' + encodeURIComponent(c.id);
    }

    // Obunadagi logo obuna paytida nusxalangan — joriy ilova logosini ko'rsatamiz
    function subIcon(s) {
        const apps = getApps();
        const app = apps.find(a => a.id === s.appId) || apps.find(a => a.slug && a.slug === s.slug);
        const logo = app ? app.logo : s.logo;
        return logo ? `<img src="${escapeHtml(logo)}" alt="">` : escapeHtml((app && app.logoEmoji) || s.logoEmoji || '📱');
    }
    function appIcon(a) {
        return a.logo ? `<img src="${escapeHtml(a.logo)}" alt="">` : escapeHtml(a.logoEmoji || '📱');
    }
    function clientCell(c) {
        return `
            <div class="cell-user">
                <div class="aav sm">${initial(displayName(c))}</div>
                <div>
                    <strong>${escapeHtml(displayName(c))}</strong>
                    <div class="sub-line">${escapeHtml(c.id)}</div>
                </div>
            </div>`;
    }
    function subChips(c) {
        const subs = activeSubsOf(c);
        if (!subs.length) return `<span class="muted">—</span>`;
        const shown = subs.slice(0, 2).map(s => `<span class="app-chip">${subIcon(s)} ${escapeHtml(s.name || '')}</span>`).join('');
        return `<div class="chip-wrap">${shown}${subs.length > 2 ? `<span class="app-chip more">+${subs.length - 2}</span>` : ''}</div>`;
    }
    function statusPill(c) {
        if (isBlocked(c)) return `<span class="pill bad">Bloklangan</span>`;
        return activeSubsOf(c).length ? `<span class="pill ok">Faol</span>` : `<span class="pill warn">Obunasiz</span>`;
    }
    function emptyRow(cols, icon, title, text) {
        const ic = icon.includes(' ') ? icon : 'fa-solid ' + icon;
        return `<tr><td colspan="${cols}"><div class="adm-empty"><i class="${ic}"></i><h3>${title}</h3><p>${text}</p></div></td></tr>`;
    }
    function initial(s) { return escapeHtml(String(s || '?').trim().charAt(0).toUpperCase() || '?'); }
    function dash() { return '<span class="muted">—</span>'; }
    function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return isNaN(d) ? '—' : `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    function timeAgo(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return '';
        const s = Math.floor((Date.now() - d) / 1000);
        if (s < 60) return 'hozir';
        const m = Math.floor(s / 60); if (m < 60) return m + ' daq';
        const h = Math.floor(m / 60); if (h < 24) return h + ' soat';
        const days = Math.floor(h / 24); if (days < 30) return days + ' kun';
        return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
    }
    function agoText(iso) {
        const t = timeAgo(iso);
        return !t ? '' : (t === 'hozir' ? 'hozirgina' : t + ' oldin');
    }
    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function setBadge(id, n) {
        const el = document.getElementById(id);
        if (!el) return;
        if (n > 0) { el.style.display = 'inline-block'; el.textContent = n; }
        else el.style.display = 'none';
    }
}
if (document.readyState !== 'loading') _boAdminInit(); else document.addEventListener('DOMContentLoaded', _boAdminInit);
