/* ============================================
   KITOB OLAMI — Admin Panel Logic
   ============================================ */

const STATUSES = ['yangi', 'jarayonda', 'yetkazilmoqda', 'yetkazildi', 'bekor'];
const STATUS_LABELS = { yangi: 'Yangi', jarayonda: 'Jarayonda', yetkazilmoqda: 'Yetkazilmoqda', yetkazildi: 'Yetkazildi', bekor: 'Bekor qilindi' };

let data = Store.load();
let currentPage = 'dashboard';
let productPage = 1;
const PRODS_PER_PAGE = 8;
let pFilters = { search: '', cat: 'all', status: 'all' };
let orderStatusTab = 'all';
let reportRange = 'week';

/* Login olib tashlandi — to'g'ridan-to'g'ri admin panelni ishga tushuramiz */
document.addEventListener('DOMContentLoaded', initAdmin);
if (document.readyState === 'interactive' || document.readyState === 'complete') initAdmin();

/* ============ INIT ============ */
let __adminInited = false;
function initAdmin() {
    if (__adminInited) return;
    __adminInited = true;

    // Sidebar nav
    document.querySelectorAll('.nav-link').forEach(b => b.onclick = () => navigate(b.dataset.page));
    document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => navigate(b.dataset.go));

    // Hamburger / mobile sidebar
    document.getElementById('hamburger').onclick = () => document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarClose').onclick = () => document.getElementById('sidebar').classList.remove('open');

    // Dropdowns
    setupDropdown('notifBtn', 'notifMenu');
    setupDropdown('userBtn', 'userMenu');
    document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dd-menu').forEach(m => m.classList.remove('open'));
        }
    });

    // Dark mode
    if (localStorage.getItem('kitob_dark') === '1') document.body.classList.add('dark');
    document.getElementById('darkToggle').onclick = () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('kitob_dark', document.body.classList.contains('dark') ? '1' : '0');
        renderDashboard();
    };

    // Global modal close
    document.querySelectorAll('[data-close-modal]').forEach(b => b.onclick = closeAllModals);
    document.getElementById('modalOverlay').onclick = closeAllModals;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

    // Global search
    document.getElementById('globalSearch').oninput = e => {
        const q = e.target.value.trim().toLowerCase();
        if (q.length > 1) {
            navigate('products');
            document.getElementById('pSearch').value = q;
            pFilters.search = q;
            renderProducts();
        }
    };

    // Setup page handlers
    setupProductsPage();
    setupOrdersPage();
    setupCustomersPage();
    setupCategoriesPage();
    setupCouponsPage();
    setupReportsPage();
    setupSettingsPage();
    setupMessagesPage();
    setupNotifications();
    setupBotPage();
    setupQrPage();

    renderDashboard();
    updateNavBadge();
    updateMsgBadge();
    updateBotBadge();

    // Cross-tab sync: foydalanuvchidan yangi xabar kelganda
    window.addEventListener('storage', e => {
        if (e.key !== STORE_KEY) return;
        data = Store.load();
        updateMsgBadge();
        setupNotifications();
        if (currentPage === 'messages') renderMessageThreads();
        if (currentPage === 'messages' && currentChatKey) renderConversation(currentChatKey, false);
    });
}

function setupDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    btn.onclick = e => {
        e.stopPropagation();
        document.querySelectorAll('.dd-menu').forEach(m => { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
    };
}

function navigate(page) {
    currentPage = page;
    document.querySelectorAll('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.dataset.page === page));
    const titles = {
        dashboard: 'Dashboard', products: 'Kitoblar', orders: 'Buyurtmalar',
        customers: 'Mijozlar', categories: 'Kategoriyalar', coupons: 'Kuponlar',
        reports: 'Hisobot', settings: 'Sozlamalar', messages: 'Habarlar',
        bot: 'Telegram Bot', qr: 'QR Kod'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    document.getElementById('sidebar').classList.remove('open');

    if (page === 'dashboard') renderDashboard();
    if (page === 'products') renderProducts();
    if (page === 'orders') renderOrders();
    if (page === 'customers') renderCustomers();
    if (page === 'categories') renderCategories();
    if (page === 'coupons') renderCoupons();
    if (page === 'reports') renderReports();
    if (page === 'settings') renderSettings();
    if (page === 'messages') renderMessageThreads();
    if (page === 'bot') renderBot();
    if (page === 'qr') renderQrImg();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    document.getElementById('modalOverlay').classList.remove('open');
}
function openModal(id) {
    closeAllModals();
    document.getElementById(id).classList.add('open');
    document.getElementById('modalOverlay').classList.add('open');
}

function confirmAction(title, msg, cb) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent = msg;
    openModal('confirmModal');
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    const handler = () => { closeAllModals(); cb(); ok.removeEventListener('click', handler); };
    ok.addEventListener('click', handler, { once: true });
    cancel.onclick = closeAllModals;
}

function updateNavBadge() {
    const newCount = data.orders.filter(o => o.status === 'yangi').length;
    document.getElementById('navOrdersBadge').textContent = newCount;
    document.getElementById('navOrdersBadge').style.display = newCount > 0 ? 'inline-block' : 'none';
}

/* ============ NOTIFICATIONS ============ */
function setupNotifications() {
    const newOrders = data.orders.filter(o => o.status === 'yangi').slice(0, 5);
    const lowStock = data.products.filter(p => p.stock < 5 && p.active).slice(0, 3);
    const newMessages = (data.chats || []).filter(c => (c.unreadAdmin || 0) > 0).slice(0, 5);
    const items = [
        ...newMessages.map(c => ({ icon: '💬', title: `Yangi xabar — ${c.userName || 'Mehmon'}`, sub: c.messages[c.messages.length-1]?.text.slice(0, 60) || '' })),
        ...newOrders.map(o => ({ icon: '🛍️', title: `Yangi buyurtma #${o.id}`, sub: `${o.name} — ${money(o.total)}` })),
        ...lowStock.map(p => ({ icon: '⚠️', title: 'Zaxira tugayapti', sub: `${p.name} — ${p.stock} dona qoldi` })),
    ];
    document.getElementById('notifBadge').textContent = items.length;
    document.getElementById('notifBadge').style.display = items.length > 0 ? 'block' : 'none';
    document.getElementById('notifList').innerHTML = items.length ? items.map(n => `
        <div class="dd-notif-item">
            <div class="dd-notif-icon">${n.icon}</div>
            <div class="dd-notif-body">
                <strong>${n.title}</strong>
                <small>${n.sub}</small>
            </div>
        </div>`).join('') : '<div class="empty" style="padding:30px"><div class="empty-ico">🔕</div>Bildirishnomalar yo\'q</div>';
}

/* ============ DASHBOARD ============ */
function renderDashboard() {
    const totalRevenue = data.orders.filter(o => o.status === 'yetkazildi').reduce((s, o) => s + o.total, 0);
    const todayOrders = data.orders.filter(o => o.date === new Date().toISOString().slice(0,10)).length;
    const newOrders = data.orders.filter(o => o.status === 'yangi').length;
    const activeProducts = data.products.filter(p => p.active).length;
    const newCustomersThisMonth = data.customers.filter(c => {
        const d = new Date(c.joined);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    document.getElementById('kpiRevenue').textContent = money(totalRevenue);
    document.getElementById('kpiOrders').textContent = data.orders.length;
    document.getElementById('kpiOrdersToday').textContent = todayOrders;
    document.getElementById('kpiCustomers').textContent = data.customers.length;
    document.getElementById('kpiCustomersNew').textContent = newCustomersThisMonth;
    document.getElementById('kpiProducts').textContent = data.products.length;
    document.getElementById('kpiProductsActive').textContent = activeProducts;

    renderWeeklyChart();
    renderDonutChart();
    renderRecentOrders();
    renderTopProducts();
}

function renderWeeklyChart() {
    const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    const today = new Date();
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().slice(0,10);
        const sum = data.orders.filter(o => o.date === iso && o.status !== 'bekor').reduce((s, o) => s + o.total, 0);
        weekly.push({ day: days[d.getDay() === 0 ? 6 : d.getDay() - 1], val: sum });
    }
    const max = Math.max(1, ...weekly.map(w => w.val));
    document.getElementById('weeklyChart').innerHTML = '<div class="bar-chart">' + weekly.map(w => `
        <div class="bar-item">
            <div class="bar-fill" data-val="${(w.val / 1000).toFixed(0)}K" style="height:${(w.val / max * 85) || 2}%"></div>
            <div class="bar-label">${w.day}</div>
        </div>`).join('') + '</div>';
}

function renderDonutChart() {
    const cats = {};
    data.orders.filter(o => o.status !== 'bekor').forEach(o => {
        o.items.forEach(i => {
            const p = data.products.find(x => x.id === i.pid);
            if (p) cats[p.category] = (cats[p.category] || 0) + i.qty * i.price;
        });
    });
    const entries = Object.entries(cats).sort((a,b) => b[1] - a[1]);
    const total = entries.reduce((s, [,v]) => s + v, 0);
    const colors = ['#6c63ff', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
    let offset = 0;
    const r = 70, cx = 90, cy = 90;
    const C = 2 * Math.PI * r;
    const segments = entries.map(([cat, val], i) => {
        const pct = val / total;
        const len = pct * C;
        const seg = `<circle r="${r}" cx="${cx}" cy="${cy}" fill="transparent" stroke="${colors[i % colors.length]}" stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
        offset += len;
        return seg;
    }).join('');
    const center = `<text x="${cx}" y="${cy + 6}" class="donut-center">${entries.length}</text><text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="11" fill="var(--text-muted)">kategoriya</text>`;
    document.getElementById('donutChart').innerHTML = `<svg viewBox="0 0 180 180" class="donut-svg">${segments}${center}</svg>`;
    document.getElementById('donutLegend').innerHTML = entries.map(([cat, val], i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${colors[i % colors.length]}"></span>
            <span>${catLabel(cat)}</span>
            <strong>${money(val)}</strong>
        </div>`).join('');
}

function renderRecentOrders() {
    const recent = [...data.orders].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    document.getElementById('recentOrders').innerHTML = recent.map(o => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.name}</td>
            <td>${o.items.length} dona</td>
            <td><strong>${money(o.total)}</strong></td>
            <td><span class="status ${o.status}">${STATUS_LABELS[o.status]}</span></td>
            <td>${formatDate(o.date)}</td>
        </tr>`).join('');
}

function renderTopProducts() {
    const top = [...data.products].sort((a,b) => b.sold - a.sold).slice(0, 5);
    document.getElementById('topProducts').innerHTML = top.map(p => `
        <div class="top-prod">
            <img src="${p.image}" alt="${p.name}">
            <div class="top-prod-info">
                <strong>${p.name}</strong>
                <small>${p.sold} sotilgan</small>
            </div>
            <div class="top-prod-val">${money(p.price)}</div>
        </div>`).join('');
}

/* ============ PRODUCTS ============ */
function setupProductsPage() {
    const sel = document.getElementById('pCatFilter');
    sel.innerHTML = '<option value="all">Barcha kategoriya</option>' + data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    document.getElementById('pSearch').oninput = e => { pFilters.search = e.target.value.toLowerCase(); productPage = 1; renderProducts(); };
    document.getElementById('pCatFilter').onchange = e => { pFilters.cat = e.target.value; productPage = 1; renderProducts(); };
    document.getElementById('pStatusFilter').onchange = e => { pFilters.status = e.target.value; productPage = 1; renderProducts(); };
    document.getElementById('addProductBtn').onclick = () => openProductForm();

    document.getElementById('productForm').onsubmit = saveProductForm;

    // Drop zone
    const dz = document.getElementById('dropZone');
    const fi = document.getElementById('fileInput');
    dz.onclick = () => fi.click();
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('dragover'); };
    dz.ondragleave = () => dz.classList.remove('dragover');
    dz.ondrop = e => {
        e.preventDefault(); dz.classList.remove('dragover');
        if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
    };
    fi.onchange = e => { if (e.target.files[0]) loadImageFile(e.target.files[0]); };
}

function catLabel(id) {
    const c = data.categories.find(x => x.id === id);
    return c ? c.name : capitalize(id);
}

function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = e => { document.getElementById('pImage').value = e.target.result; toast('Rasm yuklandi'); };
    reader.readAsDataURL(file);
}

function filteredProducts() {
    let list = data.products;
    if (pFilters.search) list = list.filter(p => p.name.toLowerCase().includes(pFilters.search));
    if (pFilters.cat !== 'all') list = list.filter(p => p.category === pFilters.cat);
    if (pFilters.status === 'active') list = list.filter(p => p.active);
    if (pFilters.status === 'archive') list = list.filter(p => !p.active);
    return list;
}

function renderProducts() {
    const list = filteredProducts();
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PRODS_PER_PAGE));
    if (productPage > totalPages) productPage = totalPages;
    const start = (productPage - 1) * PRODS_PER_PAGE;
    const pageList = list.slice(start, start + PRODS_PER_PAGE);

    const tbody = document.getElementById('productsTable');
    if (pageList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="empty-ico">📚</div>Kitob topilmadi</div></td></tr>`;
    } else {
        tbody.innerHTML = pageList.map(p => `
            <tr>
                <td><img src="${p.image}" alt="${p.name}" class="tbl-img"></td>
                <td>
                    <div class="tbl-name">${p.name}</div>
                    <div class="tbl-sub">${p.author ? p.author + ' • ' : ''}${p.sold} sotilgan</div>
                </td>
                <td>${catLabel(p.category)}</td>
                <td>
                    <strong>${money(p.price)}</strong>
                    ${p.oldPrice ? `<div class="tbl-sub" style="text-decoration:line-through">${money(p.oldPrice)}</div>` : ''}
                </td>
                <td>${p.stock} dona</td>
                <td><span class="status ${p.active ? 'active' : 'inactive'}">${p.active ? 'Aktiv' : 'Arxiv'}</span></td>
                <td>
                    <div class="row-acts">
                        <button class="icon-act" onclick="viewProduct(${p.id})" title="Ko'rish">👁</button>
                        <button class="icon-act" onclick="openProductForm(${p.id})" title="Tahrirlash">✏️</button>
                        <button class="icon-act danger" onclick="deleteProduct(${p.id})" title="O'chirish">🗑</button>
                    </div>
                </td>
            </tr>`).join('');
    }

    // Pagination
    document.getElementById('productsPagination').innerHTML = total === 0 ? '' : `
        <span>${start + 1}–${Math.min(start + PRODS_PER_PAGE, total)} / ${total} dan</span>
        <div class="page-nums">
            <button class="page-num" ${productPage === 1 ? 'disabled' : ''} onclick="goProductPage(${productPage - 1})">‹</button>
            ${Array.from({ length: totalPages }, (_, i) => `<button class="page-num ${i + 1 === productPage ? 'active' : ''}" onclick="goProductPage(${i + 1})">${i + 1}</button>`).join('')}
            <button class="page-num" ${productPage === totalPages ? 'disabled' : ''} onclick="goProductPage(${productPage + 1})">›</button>
        </div>`;
}

window.goProductPage = function(n) { productPage = n; renderProducts(); };

window.openProductForm = function(id) {
    const form = document.getElementById('productForm');
    form.reset();
    const catSel = document.getElementById('pCat');
    catSel.innerHTML = data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (id) {
        const p = data.products.find(x => x.id === id);
        if (!p) return;
        document.getElementById('productFormTitle').textContent = 'Kitobni tahrirlash';
        document.getElementById('pId').value = p.id;
        document.getElementById('pName').value = p.name;
        document.getElementById('pAuthor').value = p.author || '';
        document.getElementById('pCat').value = p.category;
        document.getElementById('pPrice').value = p.price;
        document.getElementById('pOld').value = p.oldPrice || '';
        document.getElementById('pStock').value = p.stock;
        document.getElementById('pImage').value = p.image;
        document.getElementById('pPublisher').value = p.publisher || '';
        document.getElementById('pYear').value = p.year || '';
        document.getElementById('pPages').value = p.pages || '';
        document.getElementById('pLang').value = p.lang || "O'zbek";
        document.getElementById('pIsbn').value = p.isbn || '';
        document.getElementById('pDesc').value = p.desc || '';
        document.getElementById('pActive').checked = p.active;
        document.querySelectorAll('#pSizes input').forEach(c => c.checked = (p.sizes || []).includes(c.value));
    } else {
        document.getElementById('productFormTitle').textContent = 'Yangi kitob';
        document.getElementById('pId').value = '';
        document.getElementById('pActive').checked = true;
        document.querySelectorAll('#pSizes input').forEach(c => c.checked = (c.value === 'Qattiq muqova'));
    }
    openModal('productModal');
};

function saveProductForm(e) {
    e.preventDefault();
    const id = document.getElementById('pId').value;
    const sizes = [...document.querySelectorAll('#pSizes input:checked')].map(i => i.value);
    const obj = {
        name: document.getElementById('pName').value,
        author: document.getElementById('pAuthor').value,
        category: document.getElementById('pCat').value,
        price: +document.getElementById('pPrice').value,
        oldPrice: +document.getElementById('pOld').value || null,
        stock: +document.getElementById('pStock').value,
        image: document.getElementById('pImage').value,
        publisher: document.getElementById('pPublisher').value,
        year: +document.getElementById('pYear').value || null,
        pages: +document.getElementById('pPages').value || null,
        lang: document.getElementById('pLang').value,
        isbn: document.getElementById('pIsbn').value,
        desc: document.getElementById('pDesc').value,
        active: document.getElementById('pActive').checked,
        sizes,
        colors: [],
    };
    if (id) {
        const p = data.products.find(x => x.id === +id);
        Object.assign(p, obj);
        toast('Kitob yangilandi', 'success');
    } else {
        obj.id = Math.max(0, ...data.products.map(x => x.id)) + 1;
        obj.sold = 0;
        obj.created = new Date().toISOString().slice(0,10);
        data.products.push(obj);
        toast('Kitob qo\'shildi', 'success');
    }
    Store.save(data);
    closeAllModals();
    renderProducts();
    renderDashboard();
}

window.viewProduct = function(id) {
    const p = data.products.find(x => x.id === id);
    if (!p) return;
    toast(`${p.name} — ${money(p.price)} • Zaxira: ${p.stock}`, 'info');
};

window.deleteProduct = function(id) {
    const p = data.products.find(x => x.id === id);
    if (!p) return;
    confirmAction('Kitobni o\'chirish', `"${p.name}" kitobini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`, () => {
        data.products = data.products.filter(x => x.id !== id);
        Store.save(data);
        renderProducts();
        renderDashboard();
        toast('Kitob o\'chirildi', 'success');
    });
};

/* ============ ORDERS ============ */
function setupOrdersPage() {
    document.querySelectorAll('#orderTabs .tab').forEach(t => t.onclick = () => {
        document.querySelectorAll('#orderTabs .tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        orderStatusTab = t.dataset.status;
        renderOrders();
    });
}

function renderOrders() {
    let list = data.orders;
    if (orderStatusTab !== 'all') list = list.filter(o => o.status === orderStatusTab);
    list = [...list].sort((a,b) => b.id - a.id);

    const counts = {
        all: data.orders.length,
        yangi: data.orders.filter(o => o.status === 'yangi').length,
        jarayonda: data.orders.filter(o => o.status === 'jarayonda').length,
        yetkazilmoqda: data.orders.filter(o => o.status === 'yetkazilmoqda').length,
        yetkazildi: data.orders.filter(o => o.status === 'yetkazildi').length,
        bekor: data.orders.filter(o => o.status === 'bekor').length,
    };
    document.getElementById('cntAll').textContent = counts.all;
    document.getElementById('cntNew').textContent = counts.yangi;
    document.getElementById('cntProc').textContent = counts.jarayonda;
    document.getElementById('cntShip').textContent = counts.yetkazilmoqda;
    document.getElementById('cntDone').textContent = counts.yetkazildi;
    document.getElementById('cntCancel').textContent = counts.bekor;

    const tbody = document.getElementById('ordersTable');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><div class="empty-ico">🛍️</div>Buyurtmalar yo'q</div></td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(o => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${formatDate(o.date)}</td>
            <td>
                <div class="tbl-user">
                    <div class="avatar sm">${o.name.charAt(0)}</div>
                    <div>
                        <div class="tbl-name">${o.name}</div>
                        <div class="tbl-sub">${o.phone}</div>
                    </div>
                </div>
            </td>
            <td>${o.items.length} dona</td>
            <td><strong>${money(o.total)}</strong></td>
            <td>${capitalize(o.payment)}</td>
            <td><span class="status ${o.status}">${STATUS_LABELS[o.status]}</span></td>
            <td>
                <div class="row-acts">
                    <button class="icon-act" onclick="viewOrder(${o.id})" title="Ko'rish">👁</button>
                    <button class="icon-act danger" onclick="deleteOrder(${o.id})" title="O'chirish">🗑</button>
                </div>
            </td>
        </tr>`).join('');
}

window.viewOrder = function(id) {
    const o = data.orders.find(x => x.id === id);
    if (!o) return;
    document.getElementById('orderModalBody').innerHTML = `
        <div class="order-grid">
            <div><small>Buyurtma raqami</small><strong>#${o.id}</strong></div>
            <div><small>Sana</small><strong>${formatDate(o.date)}</strong></div>
            <div><small>Mijoz</small><strong>${o.name}</strong></div>
            <div><small>Telefon</small><strong>${o.phone}</strong></div>
            <div><small>Manzil</small><strong>${o.address}</strong></div>
            <div><small>To'lov</small><strong>${capitalize(o.payment)}</strong></div>
        </div>

        <h4 style="font-size:13px;text-transform:uppercase;color:var(--text-muted);margin:14px 0 8px;letter-spacing:0.05em">Kitoblar</h4>
        <div class="order-items-list">
            ${o.items.map(i => `
                <div class="oi">
                    <div class="oi-img">${i.qty}×</div>
                    <div>
                        <div class="oi-name">${i.name}</div>
                        <div class="oi-meta">${i.size || '—'}</div>
                    </div>
                    <div class="oi-price">${money(i.price * i.qty)}</div>
                </div>`).join('')}
        </div>

        <div class="order-tot"><span>Jami:</span><span>${money(o.total)}</span></div>

        <div class="status-changer-wrap">
            <label>Holatni o'zgartirish</label>
            <div class="status-changer">
                ${STATUSES.map(s => `<button class="s-pick ${s} ${s === o.status ? 'active' : ''}" onclick="changeOrderStatus(${o.id},'${s}')">${STATUS_LABELS[s]}</button>`).join('')}
            </div>
        </div>

        <div class="form-row">
            <label>Izoh</label>
            <textarea id="orderNote" rows="2" placeholder="Izoh qo'shish...">${o.note || ''}</textarea>
        </div>

        <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">
            <button class="btn btn-ghost" onclick="window.print()">🖨 Chop etish</button>
            <button class="btn btn-primary" onclick="saveOrderNote(${o.id})">Saqlash</button>
        </div>`;
    openModal('orderModal');
};

window.saveOrderNote = function(id) {
    const o = data.orders.find(x => x.id === id);
    if (!o) return;
    o.note = document.getElementById('orderNote').value;
    Store.save(data);
    toast('Izoh saqlandi', 'success');
    closeAllModals();
};

window.changeOrderStatus = function(id, status) {
    const o = data.orders.find(x => x.id === id);
    if (!o) return;
    o.status = status;
    Store.save(data);
    document.querySelectorAll('.status-changer .s-pick').forEach(b => b.classList.remove('active'));
    document.querySelector(`.status-changer .s-pick.${status}`).classList.add('active');
    renderOrders();
    renderDashboard();
    updateNavBadge();
    setupNotifications();
    toast('Holat yangilandi: ' + STATUS_LABELS[status], 'success');
};

window.deleteOrder = function(id) {
    confirmAction('Buyurtmani o\'chirish', `#${id} buyurtmasini butunlay o'chirmoqchimisiz?`, () => {
        data.orders = data.orders.filter(o => o.id !== id);
        Store.save(data);
        renderOrders();
        renderDashboard();
        updateNavBadge();
        toast('Buyurtma o\'chirildi', 'success');
    });
};

/* ============ CUSTOMERS ============ */
function setupCustomersPage() {
    document.getElementById('cSearch').oninput = () => renderCustomers();
}

function renderCustomers() {
    const q = (document.getElementById('cSearch')?.value || '').toLowerCase();
    let list = data.customers;
    if (q) list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
    const tbody = document.getElementById('customersTable');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><div class="empty-ico">👥</div>Mijoz topilmadi</div></td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(c => {
        const orders = data.orders.filter(o => o.customerId === c.id);
        const spent = orders.filter(o => o.status === 'yetkazildi').reduce((s, o) => s + o.total, 0);
        return `
            <tr>
                <td>
                    <div class="tbl-user">
                        <div class="avatar sm">${c.name.charAt(0)}</div>
                        <div>
                            <div class="tbl-name">${c.name}</div>
                            <div class="tbl-sub">ID: ${c.id}</div>
                        </div>
                    </div>
                </td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td><strong>${orders.length}</strong></td>
                <td><strong>${money(spent)}</strong></td>
                <td>${formatDate(c.joined)}</td>
                <td><span class="status ${c.active ? 'active' : 'inactive'}">${c.active ? 'Aktiv' : 'Bloklangan'}</span></td>
                <td>
                    <div class="row-acts">
                        <button class="icon-act" onclick="viewCustomer(${c.id})" title="Ko'rish">👁</button>
                        <button class="icon-act" onclick="toggleCustomer(${c.id})" title="Bloklash/Aktiv">${c.active ? '🚫' : '✅'}</button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

window.viewCustomer = function(id) {
    const c = data.customers.find(x => x.id === id);
    if (!c) return;
    const orders = data.orders.filter(o => o.customerId === id).sort((a,b) => new Date(b.date) - new Date(a.date));
    const spent = orders.filter(o => o.status === 'yetkazildi').reduce((s, o) => s + o.total, 0);
    document.getElementById('customerModalBody').innerHTML = `
        <div class="customer-head">
            <div class="avatar lg">${c.name.charAt(0)}</div>
            <div class="ch-info">
                <strong>${c.name}</strong>
                <small>${c.email}</small>
                <div style="margin-top:6px"><span class="status ${c.active ? 'active' : 'inactive'}">${c.active ? 'Aktiv' : 'Bloklangan'}</span></div>
            </div>
        </div>
        <div class="order-grid">
            <div><small>Telefon</small><strong>${c.phone}</strong></div>
            <div><small>Ro'yxatdan o'tgan</small><strong>${formatDate(c.joined)}</strong></div>
            <div><small>Buyurtmalar</small><strong>${orders.length} ta</strong></div>
            <div><small>Jami sarflagan</small><strong>${money(spent)}</strong></div>
        </div>
        <div style="margin-bottom:10px"><small style="color:var(--text-muted)">Manzil:</small> ${c.address}</div>

        <h4 style="font-size:13px;text-transform:uppercase;color:var(--text-muted);margin:14px 0 8px;letter-spacing:0.05em">Buyurtmalar tarixi</h4>
        ${orders.length === 0 ? '<div class="empty"><div class="empty-ico">📭</div>Buyurtmalar yo\'q</div>' : `
            <div class="order-items-list">
                ${orders.slice(0, 6).map(o => `
                    <div class="oi">
                        <div class="oi-img">#${o.id}</div>
                        <div>
                            <div class="oi-name">${o.items.length} kitob</div>
                            <div class="oi-meta">${formatDate(o.date)} • <span class="status ${o.status}" style="font-size:10px">${STATUS_LABELS[o.status]}</span></div>
                        </div>
                        <div class="oi-price">${money(o.total)}</div>
                    </div>`).join('')}
            </div>
        `}

        <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">
            <button class="btn ${c.active ? 'btn-danger' : 'btn-primary'}" onclick="toggleCustomer(${c.id})">${c.active ? 'Bloklash' : 'Faollashtirish'}</button>
        </div>`;
    openModal('customerModal');
};

window.toggleCustomer = function(id) {
    const c = data.customers.find(x => x.id === id);
    if (!c) return;
    c.active = !c.active;
    Store.save(data);
    renderCustomers();
    closeAllModals();
    toast(c.active ? 'Mijoz faollashtirildi' : 'Mijoz bloklandi', c.active ? 'success' : 'info');
};

/* ============ CATEGORIES ============ */
function setupCategoriesPage() {
    document.getElementById('addCatBtn').onclick = () => openCategoryForm();
    document.getElementById('catForm').onsubmit = saveCategoryForm;
    document.querySelectorAll('#emojiPick button').forEach(b => b.onclick = () => {
        document.querySelectorAll('#emojiPick button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        document.getElementById('catIcon').value = b.dataset.emoji;
    });
}

function renderCategories() {
    document.getElementById('catGrid').innerHTML = data.categories.map(c => {
        const count = data.products.filter(p => p.category === c.id).length;
        return `
            <div class="cat-card">
                <div class="cat-actions">
                    <button class="icon-act" onclick="openCategoryForm('${c.id}')">✏️</button>
                    <button class="icon-act danger" onclick="deleteCategory('${c.id}')">🗑</button>
                </div>
                <span class="cat-emoji">${c.icon}</span>
                <strong>${c.name}</strong>
                <small>${c.desc || ''}</small>
                <div class="cat-count">${count} kitob</div>
            </div>`;
    }).join('');
}

window.openCategoryForm = function(id) {
    const form = document.getElementById('catForm');
    form.reset();
    document.querySelectorAll('#emojiPick button').forEach(x => x.classList.remove('active'));
    if (id) {
        const c = data.categories.find(x => x.id === id);
        if (!c) return;
        document.getElementById('catModalTitle').textContent = 'Kategoriya tahrirlash';
        document.getElementById('catId').value = c.id;
        document.getElementById('catName').value = c.name;
        document.getElementById('catIcon').value = c.icon;
        document.getElementById('catDesc').value = c.desc || '';
        document.getElementById('catActive').checked = c.active;
    } else {
        document.getElementById('catModalTitle').textContent = 'Yangi kategoriya';
        document.getElementById('catId').value = '';
        document.getElementById('catActive').checked = true;
    }
    openModal('catModal');
};

function saveCategoryForm(e) {
    e.preventDefault();
    const id = document.getElementById('catId').value;
    const obj = {
        name: document.getElementById('catName').value,
        icon: document.getElementById('catIcon').value,
        desc: document.getElementById('catDesc').value,
        active: document.getElementById('catActive').checked,
    };
    if (id) {
        const c = data.categories.find(x => x.id === id);
        Object.assign(c, obj);
        toast('Kategoriya yangilandi', 'success');
    } else {
        obj.id = obj.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        data.categories.push(obj);
        toast('Kategoriya qo\'shildi', 'success');
    }
    Store.save(data);
    closeAllModals();
    renderCategories();
}

window.deleteCategory = function(id) {
    const c = data.categories.find(x => x.id === id);
    confirmAction('Kategoriyani o\'chirish', `"${c.name}" kategoriyasini o'chirmoqchimisiz?`, () => {
        data.categories = data.categories.filter(x => x.id !== id);
        Store.save(data);
        renderCategories();
        toast('Kategoriya o\'chirildi', 'success');
    });
};

/* ============ COUPONS ============ */
function setupCouponsPage() {
    document.getElementById('addCouponBtn').onclick = () => openCouponForm();
    document.getElementById('couponForm').onsubmit = saveCouponForm;
}

function renderCoupons() {
    const tbody = document.getElementById('couponsTable');
    if (data.coupons.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty">Kuponlar yo'q</div></td></tr>`;
        return;
    }
    tbody.innerHTML = data.coupons.map(c => `
        <tr>
            <td>
                <span class="coupon-code">${c.code}<button class="copy-btn" onclick="copyCode('${c.code}')">📋</button></span>
            </td>
            <td>${c.type === 'percent' ? 'Foiz' : 'Belgilangan'}</td>
            <td><strong>${c.type === 'percent' ? c.value + '%' : money(c.value)}</strong></td>
            <td>${c.maxUses}</td>
            <td>${c.used} / ${c.maxUses}</td>
            <td>${formatDate(c.expires)}</td>
            <td><span class="status ${c.active ? 'active' : 'inactive'}">${c.active ? 'Aktiv' : 'Tugagan'}</span></td>
            <td>
                <div class="row-acts">
                    <button class="icon-act" onclick="openCouponForm(${c.id})">✏️</button>
                    <button class="icon-act danger" onclick="deleteCoupon(${c.id})">🗑</button>
                </div>
            </td>
        </tr>`).join('');
}

window.copyCode = function(code) {
    navigator.clipboard.writeText(code).then(() => toast(`Kod nusxalandi: ${code}`, 'success'));
};

window.openCouponForm = function(id) {
    const form = document.getElementById('couponForm');
    form.reset();
    if (id) {
        const c = data.coupons.find(x => x.id === id);
        if (!c) return;
        document.getElementById('couponModalTitle').textContent = 'Kuponni tahrirlash';
        document.getElementById('cpId').value = c.id;
        document.getElementById('cpCode').value = c.code;
        document.getElementById('cpType').value = c.type;
        document.getElementById('cpValue').value = c.value;
        document.getElementById('cpMax').value = c.maxUses;
        document.getElementById('cpExpires').value = c.expires;
        document.getElementById('cpActive').checked = c.active;
    } else {
        document.getElementById('couponModalTitle').textContent = 'Yangi kupon';
        document.getElementById('cpId').value = '';
        document.getElementById('cpActive').checked = true;
        const d = new Date(); d.setMonth(d.getMonth() + 1);
        document.getElementById('cpExpires').value = d.toISOString().slice(0,10);
    }
    openModal('couponModal');
};

function saveCouponForm(e) {
    e.preventDefault();
    const id = +document.getElementById('cpId').value;
    const obj = {
        code: document.getElementById('cpCode').value.toUpperCase(),
        type: document.getElementById('cpType').value,
        value: +document.getElementById('cpValue').value,
        maxUses: +document.getElementById('cpMax').value,
        expires: document.getElementById('cpExpires').value,
        active: document.getElementById('cpActive').checked,
    };
    if (id) {
        const c = data.coupons.find(x => x.id === id);
        Object.assign(c, obj);
        toast('Kupon yangilandi', 'success');
    } else {
        obj.id = Math.max(0, ...data.coupons.map(x => x.id)) + 1;
        obj.used = 0;
        data.coupons.push(obj);
        toast('Kupon yaratildi', 'success');
    }
    Store.save(data);
    closeAllModals();
    renderCoupons();
}

window.deleteCoupon = function(id) {
    confirmAction('Kuponni o\'chirish', 'Ushbu kuponni o\'chirmoqchimisiz?', () => {
        data.coupons = data.coupons.filter(c => c.id !== id);
        Store.save(data);
        renderCoupons();
        toast('Kupon o\'chirildi', 'success');
    });
};

/* ============ REPORTS ============ */
function setupReportsPage() {
    document.querySelectorAll('.rng-btn').forEach(b => b.onclick = () => {
        document.querySelectorAll('.rng-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        reportRange = b.dataset.range;
        renderReports();
    });
    document.getElementById('exportCsvBtn').onclick = exportCsv;
    document.getElementById('exportPdfBtn').onclick = () => window.print();
}

function reportDates() {
    const now = new Date();
    let from = new Date();
    if (reportRange === 'today') from = new Date(now.toDateString());
    if (reportRange === 'week') from.setDate(now.getDate() - 7);
    if (reportRange === 'month') from.setMonth(now.getMonth() - 1);
    if (reportRange === 'year') from.setFullYear(now.getFullYear() - 1);
    const customFrom = document.getElementById('reportFrom').value;
    const customTo = document.getElementById('reportTo').value;
    if (customFrom) from = new Date(customFrom);
    const to = customTo ? new Date(customTo) : now;
    return { from, to };
}

function renderReports() {
    const { from, to } = reportDates();
    const orders = data.orders.filter(o => {
        const d = new Date(o.date);
        return d >= from && d <= to && o.status !== 'bekor';
    });
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const soldQty = orders.reduce((s, o) => s + o.items.reduce((q, i) => q + i.qty, 0), 0);
    const avg = orders.length ? revenue / orders.length : 0;

    document.getElementById('rpRevenue').textContent = money(revenue);
    document.getElementById('rpOrders').textContent = orders.length;
    document.getElementById('rpAvg').textContent = money(Math.round(avg));
    document.getElementById('rpSold').textContent = soldQty + ' dona';

    // Line chart
    renderLineChart(orders, from, to);

    // Top 10 products
    const counter = {};
    orders.forEach(o => o.items.forEach(i => {
        if (!counter[i.pid]) counter[i.pid] = { qty: 0, rev: 0 };
        counter[i.pid].qty += i.qty;
        counter[i.pid].rev += i.qty * i.price;
    }));
    const top = Object.entries(counter)
        .map(([pid, v]) => ({ p: data.products.find(x => x.id === +pid), ...v }))
        .filter(x => x.p)
        .sort((a,b) => b.qty - a.qty)
        .slice(0, 10);
    document.getElementById('reportTopTable').innerHTML = top.length === 0
        ? `<tr><td colspan="5"><div class="empty">Ma'lumot yo'q</div></td></tr>`
        : top.map((t, i) => `
            <tr>
                <td><strong>${i + 1}</strong></td>
                <td>
                    <div class="tbl-user">
                        <img src="${t.p.image}" class="tbl-img" alt="">
                        <strong>${t.p.name}</strong>
                    </div>
                </td>
                <td>${catLabel(t.p.category)}</td>
                <td>${t.qty} dona</td>
                <td><strong>${money(t.rev)}</strong></td>
            </tr>`).join('');
}

function renderLineChart(orders, from, to) {
    const dayMap = {};
    const days = Math.max(1, Math.round((to - from) / 86400000));
    const step = days > 30 ? Math.ceil(days / 15) : 1;
    for (let i = 0; i <= days; i += step) {
        const d = new Date(from); d.setDate(d.getDate() + i);
        dayMap[d.toISOString().slice(0,10)] = 0;
    }
    orders.forEach(o => { if (dayMap[o.date] !== undefined) dayMap[o.date] += o.total; });
    const points = Object.entries(dayMap);
    if (points.length < 2) {
        document.getElementById('lineChart').innerHTML = '<div class="empty"><div class="empty-ico">📈</div>Ma\'lumot yetarli emas</div>';
        return;
    }
    const W = 800, H = 240, PAD = 40;
    const max = Math.max(1, ...points.map(p => p[1]));
    const xStep = (W - PAD * 2) / (points.length - 1);
    const pts = points.map((p, i) => [PAD + i * xStep, H - PAD - (p[1] / max) * (H - PAD * 2)]);
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const area = `M ${pts[0][0]} ${H - PAD} ${pts.map(p => `L ${p[0]} ${p[1]}`).join(' ')} L ${pts[pts.length-1][0]} ${H - PAD} Z`;
    const grid = [0.25, 0.5, 0.75, 1].map(p => `<line x1="${PAD}" y1="${H - PAD - p * (H - PAD * 2)}" x2="${W - PAD}" y2="${H - PAD - p * (H - PAD * 2)}" stroke="var(--border)" stroke-dasharray="2 4"/>`).join('');
    const dots = pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--accent)" stroke="#fff" stroke-width="2"/>`).join('');
    document.getElementById('lineChart').innerHTML = `
        <svg class="line-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
            <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c63ff" stop-opacity="0.3"/><stop offset="1" stop-color="#6c63ff" stop-opacity="0"/></linearGradient></defs>
            ${grid}
            <path d="${area}" fill="url(#grad)"/>
            <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            ${dots}
        </svg>`;
}

function exportCsv() {
    const { from, to } = reportDates();
    const orders = data.orders.filter(o => {
        const d = new Date(o.date);
        return d >= from && d <= to;
    });
    const rows = [['ID', 'Sana', 'Mijoz', 'Telefon', 'Manzil', 'Mahsulotlar', 'Summa', 'To\'lov', 'Holat']];
    orders.forEach(o => rows.push([o.id, o.date, o.name, o.phone, o.address, o.items.map(i => `${i.name} x${i.qty}`).join('; '), o.total, o.payment, STATUS_LABELS[o.status]]));
    const csv = rows.map(r => r.map(c => `"${(c+'').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hisobot-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV fayl yuklab olindi', 'success');
}

/* ============ SETTINGS ============ */
function setupSettingsPage() {
    document.querySelectorAll('.st-tab').forEach(t => t.onclick = () => {
        document.querySelectorAll('.st-tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.settings-pane').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.querySelector(`.settings-pane[data-stab="${t.dataset.stab}"]`).classList.add('active');
    });

    document.getElementById('saveStoreBtn').onclick = e => {
        e.preventDefault();
        Object.assign(data.settings, {
            storeName: document.getElementById('stName').value,
            phone: document.getElementById('stPhone').value,
            email: document.getElementById('stEmail').value,
            workHours: document.getElementById('stHours').value,
            address: document.getElementById('stAddress').value,
            logo: document.getElementById('stLogo').value,
        });
        Store.save(data);
        toast('Sozlamalar saqlandi', 'success');
    };

    document.getElementById('savePayBtn').onclick = () => {
        document.querySelectorAll('#payList input[type=checkbox]').forEach(c => {
            data.settings.payments[c.dataset.pay] = c.checked;
        });
        Store.save(data);
        toast('To\'lov sozlamalari saqlandi', 'success');
    };

    document.getElementById('saveShipBtn').onclick = () => {
        const zones = [];
        document.querySelectorAll('.ship-zone').forEach(z => {
            const name = z.querySelector('.zone-name').value;
            const price = +z.querySelector('.zone-price').value;
            if (name) zones.push({ zone: name, price });
        });
        data.settings.shipping = zones;
        Store.save(data);
        toast('Yetkazib berish zonalari saqlandi', 'success');
    };

    document.getElementById('addZoneBtn').onclick = () => {
        addShipRow({ zone: '', price: 0 });
    };

    document.getElementById('saveNotifBtn').onclick = () => {
        document.querySelectorAll('#notifSettings input[type=checkbox]').forEach(c => {
            data.settings.notifications[c.dataset.n] = c.checked;
        });
        Store.save(data);
        toast('Bildirishnoma sozlamalari saqlandi', 'success');
    };

    document.getElementById('resetDataBtn').onclick = () => {
        confirmAction('Demo ma\'lumotlarni tiklash', 'Boshlang\'ich demo ma\'lumotlar tiklanadi. Joriy o\'zgarishlar yo\'qoladi.', () => {
            Store.reset();
            data = Store.load();
            navigate('dashboard');
            renderSettings();
            updateNavBadge();
            setupNotifications();
            toast('Demo ma\'lumotlar tiklandi', 'success');
        });
    };

    document.getElementById('clearDataBtn').onclick = () => {
        confirmAction('Barchasini o\'chirish', 'Bu amal mahsulotlar, buyurtmalar, mijozlar va barcha ma\'lumotlarni o\'chiradi. Davom etasizmi?', () => {
            Store.clear();
            toast('Barcha ma\'lumotlar o\'chirildi', 'success');
            setTimeout(() => location.reload(), 800);
        });
    };
}

function addShipRow(z) {
    const wrap = document.createElement('div');
    wrap.className = 'ship-zone';
    wrap.innerHTML = `
        <input class="zone-name" type="text" placeholder="Zona nomi" value="${z.zone}">
        <input class="zone-price" type="number" placeholder="Narxi (so'm)" value="${z.price}">
        <button class="zone-del" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('shipList').appendChild(wrap);
}

function renderSettings() {
    const s = data.settings;
    document.getElementById('stName').value = s.storeName || '';
    document.getElementById('stPhone').value = s.phone || '';
    document.getElementById('stEmail').value = s.email || '';
    document.getElementById('stHours').value = s.workHours || '';
    document.getElementById('stAddress').value = s.address || '';
    document.getElementById('stLogo').value = s.logo || '';

    const pays = [
        { key: 'naqd', name: 'Naqd pul', icon: '💵' },
        { key: 'uzcard', name: 'Uzcard / Humo', icon: '💳' },
        { key: 'payme', name: 'Payme', icon: '📱' },
        { key: 'click', name: 'Click', icon: '⚡' },
    ];
    document.getElementById('payList').innerHTML = pays.map(p => `
        <div class="pay-item">
            <div class="pay-item-info">
                <div class="pay-item-icon">${p.icon}</div>
                <div><strong>${p.name}</strong></div>
            </div>
            <label class="switch"><input type="checkbox" data-pay="${p.key}" ${s.payments[p.key] ? 'checked' : ''}><span class="slider"></span></label>
        </div>`).join('');

    document.getElementById('shipList').innerHTML = '';
    (s.shipping || []).forEach(addShipRow);

    const notifs = [
        { key: 'email', name: 'Email orqali', icon: '📧' },
        { key: 'sms', name: 'SMS orqali', icon: '💬' },
        { key: 'telegram', name: 'Telegram orqali', icon: '✈️' },
    ];
    document.getElementById('notifSettings').innerHTML = notifs.map(n => `
        <div class="pay-item">
            <div class="pay-item-info">
                <div class="pay-item-icon">${n.icon}</div>
                <div><strong>${n.name}</strong></div>
            </div>
            <label class="switch"><input type="checkbox" data-n="${n.key}" ${s.notifications[n.key] ? 'checked' : ''}><span class="slider"></span></label>
        </div>`).join('');
}

/* ============ MESSAGES ============ */
let currentChatKey = null;
let msgSearchQ = '';

function setupMessagesPage() {
    document.getElementById('msgSearch').oninput = e => {
        msgSearchQ = e.target.value.trim().toLowerCase();
        renderMessageThreads();
    };
    document.getElementById('msgBack').onclick = () => {
        currentChatKey = null;
        document.querySelector('.messages-layout').classList.remove('show-conv');
        document.getElementById('msgEmpty').style.display = '';
        document.getElementById('msgConversation').style.display = 'none';
    };
    document.getElementById('msgConvForm').onsubmit = e => {
        e.preventDefault();
        const inp = document.getElementById('msgConvInput');
        const text = inp.value.trim();
        if (!text || !currentChatKey) return;
        if (!Array.isArray(data.chats)) data.chats = [];
        const chat = data.chats.find(c => c.key === currentChatKey);
        if (!chat) return;
        chat.messages.push({ from: 'admin', text, time: new Date().toISOString() });
        chat.lastActive = new Date().toISOString();
        chat.unreadUser = (chat.unreadUser || 0) + 1;
        Store.save(data);
        inp.value = '';
        renderConversation(currentChatKey, true);
        renderMessageThreads();
        updateMsgBadge();
        inp.focus();
    };
    document.getElementById('msgConvDel').onclick = () => {
        if (!currentChatKey) return;
        confirmAction("Suhbatni o'chirish", "Ushbu mijoz bilan suhbat butunlay o'chiriladi.", () => {
            data.chats = (data.chats || []).filter(c => c.key !== currentChatKey);
            Store.save(data);
            currentChatKey = null;
            document.querySelector('.messages-layout').classList.remove('show-conv');
            document.getElementById('msgEmpty').style.display = '';
            document.getElementById('msgConversation').style.display = 'none';
            renderMessageThreads();
            updateMsgBadge();
        });
    };
}

function updateMsgBadge() {
    const chats = data.chats || [];
    const total = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);
    const badge = document.getElementById('navMsgBadge');
    if (!badge) return;
    badge.textContent = total > 99 ? '99+' : total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
}

function escHtml(s) {
    return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function fmtMsgTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const today = new Date(); today.setHours(0,0,0,0);
    const day = new Date(d); day.setHours(0,0,0,0);
    if (day.getTime() === today.getTime()) {
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (day.getTime() === yesterday.getTime()) return 'Kecha';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}
function fmtDayLabel(iso) {
    const d = new Date(iso);
    const today = new Date(); today.setHours(0,0,0,0);
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    const day = new Date(d); day.setHours(0,0,0,0);
    if (day.getTime() === today.getTime()) return 'Bugun';
    if (day.getTime() === yest.getTime()) return 'Kecha';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function renderMessageThreads() {
    const list = document.getElementById('msgThreads');
    let chats = (data.chats || [])
        .filter(c => c && c.messages && c.messages.length > 0)
        .sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0));

    if (msgSearchQ) {
        chats = chats.filter(c =>
            (c.userName || '').toLowerCase().includes(msgSearchQ) ||
            (c.userPhone || '').toLowerCase().includes(msgSearchQ)
        );
    }

    if (chats.length === 0) {
        list.innerHTML = `<div class="msg-no-threads"><div class="emp-ico">💬</div><h4>Suhbatlar yo'q</h4><p>Hozircha hech qaysi mijoz xabar yubormagan</p></div>`;
        return;
    }

    list.innerHTML = chats.map(c => {
        const last = c.messages[c.messages.length - 1];
        const initial = (c.userName || 'M').charAt(0).toUpperCase();
        const preview = last ? (last.from === 'admin' ? 'Siz: ' : '') + (last.text.length > 50 ? last.text.slice(0, 50) + '…' : last.text) : '';
        return `
            <div class="msg-thread ${currentChatKey === c.key ? 'active' : ''} ${c.unreadAdmin > 0 ? 'unread' : ''}" data-chat="${escHtml(c.key)}">
                <div class="msg-thread-avatar">${escHtml(initial)}</div>
                <div class="msg-thread-info">
                    <div class="msg-thread-top">
                        <strong>${escHtml(c.userName || 'Mehmon')}</strong>
                        <small>${fmtMsgTime(c.lastActive)}</small>
                    </div>
                    <div class="msg-thread-bot">
                        <span class="msg-thread-preview">${escHtml(preview)}</span>
                        ${c.unreadAdmin > 0 ? `<span class="msg-thread-badge">${c.unreadAdmin > 9 ? '9+' : c.unreadAdmin}</span>` : ''}
                    </div>
                </div>
            </div>`;
    }).join('');

    list.querySelectorAll('.msg-thread').forEach(t => t.onclick = () => {
        renderConversation(t.dataset.chat, true);
    });
}

function renderConversation(chatKey, openLayout) {
    currentChatKey = chatKey;
    if (!Array.isArray(data.chats)) data.chats = [];
    const chat = data.chats.find(c => c.key === chatKey);
    if (!chat) return;

    // mark as read for admin
    if (chat.unreadAdmin > 0) {
        chat.unreadAdmin = 0;
        Store.save(data);
        updateMsgBadge();
        renderMessageThreads();
    }

    if (openLayout) {
        document.getElementById('msgEmpty').style.display = 'none';
        document.getElementById('msgConversation').style.display = 'flex';
        document.querySelector('.messages-layout').classList.add('show-conv');
    }
    document.getElementById('msgConvAvatar').textContent = (chat.userName || 'M').charAt(0).toUpperCase();
    document.getElementById('msgConvName').textContent = chat.userName || 'Mehmon';
    document.getElementById('msgConvPhone').textContent = chat.userPhone || 'Telefon kiritilmagan';

    const body = document.getElementById('msgConvBody');
    if (!chat.messages || chat.messages.length === 0) {
        body.innerHTML = `<div class="msg-conv-empty"><div class="emp-ico">💬</div><p>Hozircha xabarlar yo'q</p></div>`;
        return;
    }
    let html = '';
    let lastDay = '';
    chat.messages.forEach(m => {
        const dl = fmtDayLabel(m.time);
        if (dl !== lastDay) {
            html += `<div class="msg-day-divider">${dl}</div>`;
            lastDay = dl;
        }
        html += `<div class="msg-bubble from-${m.from}">${escHtml(m.text)}<span class="msg-bubble-time">${new Date(m.time).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></div>`;
    });
    body.innerHTML = html;
    requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
}

/* ============================================
   TELEGRAM BOT
   ============================================ */
// ====== Do'kon boti — token asosida (yagona bot) ======
const BOT_CFG_KEY = 'kitob_bot_config';
const SHOP_KEY = (new URLSearchParams(location.search).get('client') || (() => { try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; } })() || 'shop') + '__kitob';
function getBotApi() { return (localStorage.getItem('bo_bot_api') || localStorage.getItem('kitob_bot_http_url') || 'http://localhost:3344').replace(/\/+$/, ''); }
function botRead() { try { return JSON.parse(localStorage.getItem(BOT_CFG_KEY) || 'null') || {}; } catch { return {}; } }
function botWrite(cfg) { localStorage.setItem(BOT_CFG_KEY, JSON.stringify(cfg)); }
function _shopName() { try { const d = (typeof Store !== 'undefined') ? Store.load() : {}; return (d.settings && (d.settings.storeName || d.settings.shopName)) || 'Kitob Olami'; } catch { return 'Kitob Olami'; } }
function botErr(err) { const m = String((err && err.message) || err || ''); if (/Failed to fetch|NetworkError|load failed|ERR_/i.test(m)) return "Bot serveriga ulanib bo'lmadi — «cd bot && python3 bot.py» ishlab turibdimi? (" + getBotApi() + ')'; return m || 'Xato'; }

function renderBot() {
    const cfg = botRead();
    const set = (id, v) => { const el = document.getElementById(id); if (el && !el.value) el.value = v; };
    set('bot2Token', cfg.token || '');
    setBotConnectedUI(!!cfg.connected, cfg.username);
    setChannelUI(cfg);
    refreshBotStatus();
}
function setBotConnectedUI(connected, username) {
    const pill = document.getElementById('bot2Status');
    if (pill) { pill.className = 'bot2-status ' + (connected ? 'on' : 'off'); pill.textContent = '● ' + (connected ? 'Ulangan' : 'Ulanmagan'); }
    const side = document.getElementById('navBotBadge'); if (side) side.style.display = connected ? '' : 'none';
    const c = document.getElementById('bot2ConnectBtn'); if (c) c.style.display = connected ? 'none' : '';
    const d = document.getElementById('bot2DisconnectBtn'); if (d) d.style.display = connected ? '' : 'none';
    const box = document.getElementById('bot2BotInfo'); if (box) box.style.display = connected ? '' : 'none';
    const un = document.getElementById('bot2Username'); if (un) un.textContent = username || '@bot';
    const link = document.getElementById('bot2OpenLink'); if (link) { const u = String(username || '').replace(/^@/, ''); link.href = u ? ('https://t.me/' + u) : '#'; }
    const t = document.getElementById('bot2Token'); if (t) t.readOnly = connected;
}
function setChannelUI(cfg) {
    const info = document.getElementById('bot2ChannelInfo'); if (info) info.style.display = cfg.channel ? '' : 'none';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('bot2ChannelName', cfg.channel || '—');
    set('bot2SentCount', String(cfg.sentCount || 0));
    set('bot2UserCount', String(cfg.userCount || 0));
}
async function refreshBotStatus() {
    try {
        const res = await fetch(getBotApi() + '/store-bot/status?clientId=' + encodeURIComponent(SHOP_KEY) + '&_=' + Date.now(), { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) return;
        const cfg = botRead();
        cfg.connected = !!data.connected; cfg.username = data.username || cfg.username;
        cfg.channel = data.channel || null; cfg.sentCount = data.sentCount || 0; cfg.userCount = data.userCount || 0;
        botWrite(cfg);
        setBotConnectedUI(cfg.connected, cfg.username); setChannelUI(cfg);
    } catch (e) {}
}

function _btnBusy(btn, on, txt) { if (!btn) return; btn.disabled = on; if (on) { btn.dataset._t = btn.innerHTML; btn.innerHTML = '⏳ ' + (txt || 'Yuborilmoqda...'); } else if (btn.dataset._t) { btn.innerHTML = btn.dataset._t; delete btn.dataset._t; } }

async function connectBot() {
    const tokenEl = document.getElementById('bot2Token');
    const token = (tokenEl?.value || botRead().token || '').trim();
    if (!/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token)) { toast("Token formati noto'g'ri", 'error'); tokenEl?.focus(); return; }
    const payload = { clientId: SHOP_KEY, shopName: _shopName(), token, storeUrl: (function(){ try { var u=new URL('index.html', location.href); var c=new URLSearchParams(location.search).get('client')||(JSON.parse(localStorage.getItem('bo_session')||'{}').clientId||''); if(c)u.searchParams.set('client',c); return u.href; } catch(e){ return ''; } })() };
    const btn = document.getElementById('bot2ConnectBtn');
    _btnBusy(btn, true, 'Ulanmoqda...');
    try {
        const res = await fetch(getBotApi() + '/store-bot/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Ulanmadi');
        const cfg = botRead(); Object.assign(cfg, { token, username: data.username, connected: true }); botWrite(cfg);
        setBotConnectedUI(true, data.username);
        toast('Bot ulandi! ' + (data.username || '') + ' 🎉', 'success');
        refreshBotStatus();
    } catch (err) { toast(botErr(err), 'error'); } finally { _btnBusy(btn, false); }
}
function disconnectBot() {
    confirmAction('Botni uzish', 'Botni uzasizmi? Buyurtmalar kanalga yuborilmaydi.', async () => {
        try { await fetch(getBotApi() + '/store-bot/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY }) }).then(r => r.json().catch(() => ({}))); } catch (e) {}
        const cfg = botRead(); cfg.connected = false; cfg.channel = null; botWrite(cfg);
        setBotConnectedUI(false); setChannelUI(cfg); toast('Bot uzildi', 'info');
    });
}
async function connectChannel() {
    let channel = (document.getElementById('bot2Channel')?.value || '').trim();
    if (!channel) { toast('Kanal username yoki ID kiriting', 'error'); return; }
    if (!botRead().connected) { toast('Avval botni ulang', 'error'); return; }
    const btn = document.getElementById('bot2ChannelBtn'); _btnBusy(btn, true, 'Ulanmoqda...');
    try {
        const res = await fetch(getBotApi() + '/store-bot/set-channel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, channel }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Ulanmadi');
        const cfg = botRead(); cfg.channel = data.channel; botWrite(cfg); setChannelUI(cfg);
        toast('Kanal ulandi: ' + data.channel + ' 🎉', 'success');
    } catch (err) { toast(botErr(err), 'error'); } finally { _btnBusy(btn, false); }
}
function disconnectChannel() {
    confirmAction('Kanalni uzish', 'Kanalni uzasizmi? Buyurtmalar yuborilmaydi.', async () => {
        try { await fetch(getBotApi() + '/store-bot/set-channel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, clear: true }) }).then(r => r.json().catch(() => ({}))); } catch (e) {}
        const cfg = botRead(); cfg.channel = null; botWrite(cfg); setChannelUI(cfg); toast('Kanal uzildi', 'info');
    });
}
async function testChannel() {
    if (!botRead().channel) { toast('Avval kanal ulang', 'error'); return; }
    const btn = document.getElementById('bot2ChannelTest'); _btnBusy(btn, true, 'Yuborilmoqda...');
    try {
        const res = await fetch(getBotApi() + '/store-bot/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, order: { id: 'TEST', userName: 'Test mijoz', phone: '+998 90 000 00 00', address: 'Sinov manzil', items: [{ name: 'Sinov mahsulot', qty: 1, price: 10000 }], total: 10000 } }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Yuborilmadi');
        const cfg = botRead(); cfg.sentCount = data.sentCount || (cfg.sentCount || 0) + 1; botWrite(cfg); setChannelUI(cfg);
        toast('Test habar kanalga yuborildi ✅', 'success');
    } catch (err) { toast(botErr(err), 'error'); } finally { _btnBusy(btn, false); }
}
async function sendBroadcast() {
    const ta = document.getElementById('bot2BroadcastText'); const text = (ta?.value || '').trim();
    if (!text) { toast('Xabar matnini kiriting', 'error'); return; }
    if (!botRead().connected) { toast('Avval botni ulang', 'error'); return; }
    const btn = document.getElementById('bot2BroadcastBtn'); const resEl = document.getElementById('bot2BroadcastResult');
    _btnBusy(btn, true, 'Yuborilmoqda...');
    try {
        const res = await fetch(getBotApi() + '/store-bot/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, text }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Yuborilmadi');
        if (resEl) resEl.textContent = `✅ Yuborildi: ${data.sent} / ${data.total} ta` + (data.failed ? ` (xato: ${data.failed})` : '');
        if (ta) ta.value = ''; toast(data.total ? `Yuborildi: ${data.sent} ta` : 'Hali hech kim botga /start yozmagan', data.total ? 'success' : 'info');
    } catch (err) { if (resEl) resEl.textContent = ''; toast(botErr(err), 'error'); } finally { _btnBusy(btn, false); }
}

function setupBotPage() {
    const eye = document.getElementById('bot2Eye');
    if (eye) eye.onclick = () => { const t = document.getElementById('bot2Token'); if (!t) return; const h = t.type === 'password'; t.type = h ? 'text' : 'password'; eye.textContent = h ? '🙈' : '👁'; };
    const byId = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    byId('bot2ConnectBtn', connectBot);
    byId('bot2DisconnectBtn', disconnectBot);
    byId('bot2ChannelBtn', connectChannel);
    byId('bot2ChannelTest', testChannel);
    byId('bot2ChannelDisc', disconnectChannel);
    byId('bot2BroadcastBtn', sendBroadcast);
}

/* Buyurtma → Telegram kanal (do'kon boti orqali) */
window.notifyBotNewOrder = function (order) {
    try {
        const cfg = botRead();
        if (!cfg.connected || !cfg.channel) return;
        const payload = {
            id: String(order.id),
            userName: order.userName || order.name,
            phone: order.phone,
            address: order.address,
            items: (order.items || []).map(i => ({ name: i.name + (i.size ? ' (' + i.size + ')' : ''), qty: i.qty, price: i.price })),
            total: order.total,
        };
        fetch(getBotApi() + '/store-bot/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, order: payload }) })
            .then(r => r.json().catch(() => ({ ok: false })))
            .then(res => { if (res && res.ok) { const c = botRead(); c.sentCount = res.sentCount || (c.sentCount || 0) + 1; botWrite(c); setChannelUI(c); } else { console.warn('[bot] yuborilmadi:', res && res.error); } })
            .catch(err => console.warn('[bot] HTTP xato:', err.message));
    } catch (err) { console.error('notifyBotNewOrder error:', err); }
};

/* ============ QR KOD (platformaning standart tizimi) ============ */

/* Joriy do'kon client_id'si — boot-loader hisoblab qo'ygan window.__CLIENT_ID'dan foydalanamiz */
function qrClientId() {
    return window.__CLIENT_ID || 'shop';
}

/* localStorage kaliti: shu client uchun maxsus domen saqlanadi */
function qrStoreKey() {
    return 'kitob_store_url__' + qrClientId();
}

/* Do'kon havolasi:
   - agar foydalanuvchi maxsus domen saqlagan bo'lsa — o'shani qaytaramiz,
   - aks holda shu papkadagi index.html + ?client=<id> (admin.html bilan bir papkada, "../" KERAK EMAS). */
function qrStoreUrl() {
    const saved = localStorage.getItem(qrStoreKey());
    if (saved) return saved;
    const u = new URL('index.html', location.href);
    // ?client= dan boshqa eski parametrlarni tozalab, faqat client qo'shamiz
    u.search = '';
    const cid = qrClientId();
    if (cid) u.searchParams.set('client', cid);
    return u.href;
}

/* QR rasm manbasi — tashqi API (internet kerak). size: ko'rsatish 320, yuklab olish/chop etish 600 */
function qrApiSrc(url, size) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size +
        '&margin=10&qzone=1&data=' + encodeURIComponent(url);
}

/* QR sahifasi ochilganda chaqiriladi — rasm + do'kon nomi + manzilni tiklaydi */
function renderQrImg() {
    const url = qrStoreUrl();

    // Manzil inputi va do'kon nomi
    const urlInput = document.getElementById('qrUrl');
    if (urlInput) urlInput.value = url;
    const nameEl = document.getElementById('qrShopName');
    if (nameEl) nameEl.textContent = _shopName();

    // Maxsus domen inputiga saqlangan qiymatni ko'rsatamiz
    const customInput = document.getElementById('qrCustomUrl');
    if (customInput) customInput.value = localStorage.getItem(qrStoreKey()) || '';

    // QR rasmni yuklash — holatni boshqaramiz
    const img = document.getElementById('qrImg');
    const state = document.getElementById('qrState');
    if (!img || !state) return;

    state.style.display = '';
    state.textContent = 'QR yuklanmoqda…';
    img.style.display = 'none';

    img.onload = () => { state.style.display = 'none'; img.style.display = ''; };
    img.onerror = () => { img.style.display = 'none'; state.style.display = ''; state.textContent = '⚠️ QR yuklanmadi (internet kerak)'; };
    img.src = qrApiSrc(url, 320);
}

/* http(s):// prefiks qo'shadi — foydalanuvchi domenni sxemasiz kiritsa */
function qrNormalizeUrl(v) {
    v = (v || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    return v;
}

/* Tugma ishlovchilarini ulaymiz (initAdmin'da bir marta) */
function setupQrPage() {
    const byId = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

    // Nusxalash — havolani clipboard'ga
    byId('qrCopyBtn', () => {
        const url = qrStoreUrl();
        navigator.clipboard.writeText(url)
            .then(() => toast('Havola nusxalandi', 'success'))
            .catch(() => toast('Nusxalab bo\'lmadi', 'error'));
    });

    // Ochish — do'kon sahifasini yangi oynada
    byId('qrOpenBtn', () => { window.open(qrStoreUrl(), '_blank'); });

    // Yuklab olish — 600px QR'ni blob qilib PNG sifatida saqlaymiz
    byId('qrDownloadBtn', () => {
        const src = qrApiSrc(qrStoreUrl(), 600);
        fetch(src)
            .then(r => r.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'qr-kod.png';
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(a.href), 2000);
                toast('QR yuklab olindi', 'success');
            })
            .catch(() => { window.open(src, '_blank'); }); // xato bo'lsa shunchaki ochamiz
    });

    // Chop etish — yangi oynaga QR + do'kon nomi + URL chiqarib print qilamiz
    byId('qrPrintBtn', () => {
        const url = qrStoreUrl();
        const name = _shopName();
        const w = window.open('', '_blank', 'width=480,height=640');
        if (!w) { toast('Pop-up bloklangan', 'error'); return; }
        w.document.write(
            '<!doctype html><html><head><meta charset="utf-8"><title>QR — ' + name + '</title>' +
            '<style>body{font-family:system-ui,Arial,sans-serif;text-align:center;padding:32px;margin:0}' +
            'h1{font-size:22px;margin:0 0 4px}p{color:#555;word-break:break-all;font-size:13px;margin:16px auto 0;max-width:340px}' +
            'img{margin:24px auto 0;display:block}</style></head><body>' +
            '<h1>' + name + '</h1><div>📷 Telefon bilan skaner qiling</div>' +
            '<img src="' + qrApiSrc(url, 600) + '" width="360" height="360" onload="window.print()">' +
            '<p>' + url + '</p></body></html>'
        );
        w.document.close();
    });

    // Saqlash — maxsus domenni localStorage'ga yozib QR'ni qayta render qilamiz
    byId('qrSaveBtn', () => {
        const input = document.getElementById('qrCustomUrl');
        const val = qrNormalizeUrl(input ? input.value : '');
        if (!val) { toast('Domen kiriting', 'error'); return; }
        localStorage.setItem(qrStoreKey(), val);
        renderQrImg();
        toast('Maxsus domen saqlandi', 'success');
    });

    // Standart havolaga qaytarish — maxsus domenni o'chiramiz
    byId('qrResetBtn', () => {
        localStorage.removeItem(qrStoreKey());
        const input = document.getElementById('qrCustomUrl');
        if (input) input.value = '';
        renderQrImg();
        toast('Standart havolaga qaytarildi', 'info');
    });
}

/* ============ HELPERS ============ */
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
