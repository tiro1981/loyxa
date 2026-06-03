// Salqin — Admin paneli logikasi
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- I18N ----------
  I18N.applyDOM();
  function refreshLangBtn(prefix = '') {
    const m = I18N.meta();
    const flag = $('#' + (prefix ? prefix + 'L' : 'l') + 'angFlag');
    const code = $('#' + (prefix ? prefix + 'L' : 'l') + 'angCode');
    if (flag) flag.textContent = m.flag;
    if (code) code.textContent = m.code;
  }
  refreshLangBtn();
  refreshLangBtn('login');

  function bindLangSwitch(btnId, menuId) {
    const btn = $('#' + btnId), menu = $('#' + menuId);
    if (!btn) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lang-switch')) menu.classList.add('hidden');
    });
    $$('[data-lang]', menu).forEach(b => b.addEventListener('click', () => {
      I18N.set(b.dataset.lang);
      refreshLangBtn();
      refreshLangBtn('login');
      menu.classList.add('hidden');
    }));
  }
  bindLangSwitch('langBtn', 'langMenu');
  bindLangSwitch('loginLangBtn', 'loginLangMenu');

  // Til o'zgarganda jonli yangilash
  document.addEventListener('langchange', () => {
    if (!app.classList.contains('hidden')) {
      // Hozirgi sahifani qayta chizish
      const cur = $$('.page').find(p => !p.classList.contains('hidden'));
      if (!cur) return;
      const page = cur.id.replace('page-', '');
      const meta = pageMeta[page];
      $('#pageTitle').textContent = t(meta.titleKey);
      $('#pageSub').textContent = t(meta.subKey);
      if (page === 'dashboard') renderDashboard();
      if (page === 'products')  renderProducts();
      if (page === 'orders')    renderOrders();
      if (page === 'users')     renderUsers();
      if (page === 'finance')   renderFinance();
    }
  });

  // ---------- TOAST ----------
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg, type = '') => {
    toastEl.textContent = msg;
    toastEl.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  };

  // ---------- AUTH ----------
  const loginScreen = $('#loginScreen');
  const app = $('#app');

  function showApp() {
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
    renderAll();
  }
  function showLogin() {
    app.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }

  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      DB.admin.login(f.login.value.trim(), f.password.value);
      showApp();
      toast(t('admin.welcome'), 'success');
    } catch (err) {
      toast(t('admin.err.login'), 'error');
    }
  });

  $('#logoutBtn').addEventListener('click', () => {
    if (confirm(t('admin.logout.confirm'))) {
      DB.admin.logout();
      showLogin();
    }
  });

  // ---------- NAVIGATION ----------
  const pageMeta = {
    dashboard: { titleKey: 'admin.menu.dashboard', subKey: 'admin.page.dashboard.sub' },
    products:  { titleKey: 'admin.menu.products',  subKey: 'admin.page.products.sub' },
    orders:    { titleKey: 'admin.menu.orders',     subKey: 'admin.page.orders.sub' },
    chat:      { titleKey: 'admin.menu.dashboard',  subKey: 'admin.page.dashboard.sub' },
    users:     { titleKey: 'admin.menu.users',      subKey: 'admin.page.users.sub' },
    finance:   { titleKey: 'admin.menu.finance',    subKey: 'admin.page.finance.sub' },
    bot:       { titleKey: 'admin.menu.dashboard',  subKey: 'admin.page.dashboard.sub' },
  };
  function go(page) {
    $$('.menu-item').forEach(m => m.classList.toggle('active', m.dataset.page === page));
    $$('.page').forEach(p => p.classList.add('hidden'));
    $('#page-' + page).classList.remove('hidden');
    const meta = pageMeta[page];
    if (meta) {
      const titles = { chat: 'Chat', bot: 'Telegram Bot' };
      const subs   = { chat: 'Foydalanuvchilar bilan yozishmalar', bot: 'Buyurtmalarni Telegram kanalingizga avtomatik yuboring' };
      $('#pageTitle').textContent = titles[page] || t(meta.titleKey);
      $('#pageSub').textContent   = subs[page]   || t(meta.subKey);
    }
    if (page === 'dashboard') renderDashboard();
    if (page === 'products')  renderProducts();
    if (page === 'orders')    renderOrders();
    if (page === 'chat')      renderAdminChat();
    if (page === 'users')     renderUsers();
    if (page === 'finance')   renderFinance();
    if (page === 'bot')       renderBot();
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (link) { e.preventDefault(); go(link.dataset.page); }
  });

  // ====================================================================
  //                          DASHBOARD
  // ====================================================================
  function renderDashboard() {
    $('#statToday').textContent      = DB.fmt.money(DB.stats.today());
    $('#statWeek').textContent       = DB.fmt.money(DB.stats.week());
    $('#statMonth').textContent      = DB.fmt.money(DB.stats.month());
    $('#statProducts').textContent   = DB.products.all().length;

    const today = new Date(); today.setHours(0,0,0,0);
    const todayCount = DB.stats.countIn(today.getTime(), Date.now());
    $('#statTodaySub').innerHTML = t('stat.today.sub', { count: todayCount });
    const userCount = DB.users.all().length;
    $('#statUsersSub').innerHTML = t('stat.users_count', { n: userCount });

    const newCount = DB.orders.all().filter(o => o.status === 'yangi').length;
    const badge = $('#newOrdersBadge');
    badge.textContent = newCount;
    badge.classList.toggle('hidden', newCount === 0);

    drawBarChart('chartRevenue', DB.stats.last7Days().map(d => ({ label: d.label, value: d.revenue })));

    const top = DB.stats.topProducts(5);
    $('#topProducts').innerHTML = top.length
      ? top.map((p, i) => `
          <div class="top-row">
            <span class="rank">${i + 1}</span>
            <div><div class="name">${p.name}</div><div class="meta">${t('panel.sold', { n: p.qty })}</div></div>
            <span class="rev">${DB.fmt.money(p.revenue)}</span>
          </div>`).join('')
      : `<div class="empty-row" style="padding:20px 0">${t('panel.top.empty')}</div>`;

    const recent = DB.orders.all().slice(0, 5);
    $('#recentOrders').innerHTML = recent.length ? `
      <table class="table">
        <thead><tr>
          <th>${t('ord.col.id')}</th><th>${t('ord.col.customer')}</th>
          <th>${t('ord.col.sum')}</th><th>${t('ord.col.date')}</th><th>${t('ord.col.status')}</th>
        </tr></thead>
        <tbody>${recent.map(o => `
          <tr>
            <td><b>#${o.id.slice(-5).toUpperCase()}</b></td>
            <td>${o.name}</td>
            <td>${DB.fmt.money(o.total)}</td>
            <td>${DB.fmt.date(o.createdAt)}</td>
            <td><span class="status ${o.status}">${t('status.' + o.status)}</span></td>
          </tr>`).join('')}</tbody>
      </table>`
      : `<div class="empty-row">${t('panel.recent.empty')}</div>`;
  }

  // ====================================================================
  //                          PRODUCTS
  // ====================================================================
  let productSearch = '';
  $('#productSearch').addEventListener('input', e => {
    productSearch = e.target.value.trim().toLowerCase();
    renderProducts();
  });

  function renderProducts() {
    const tbody = $('#productsTable');
    let list = DB.products.all();
    if (productSearch) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(productSearch) ||
        p.category.toLowerCase().includes(productSearch));
    }
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-row">${t('prod.empty')}</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(p => `
      <tr>
        <td><img class="cell-img" src="${p.img}" alt="" /></td>
        <td><b>${p.name}</b></td>
        <td>${p.category}</td>
        <td>${DB.fmt.money(p.price)}</td>
        <td>${p.discount ? p.discount + '%' : '—'}</td>
        <td><b style="color:var(--primary)">${DB.fmt.money(DB.products.finalPrice(p))}</b></td>
        <td>${p.stock <= 5 ? `<span style="color:var(--danger);font-weight:700">${p.stock}</span>` : p.stock}</td>
        <td class="actions">
          <button class="btn btn-ghost btn-sm" data-edit="${p.id}">${t('common.edit')}</button>
          <button class="btn btn-danger btn-sm" data-del="${p.id}">${t('common.delete')}</button>
        </td>
      </tr>`).join('');
  }

  $('#productsTable').addEventListener('click', (e) => {
    const ed = e.target.dataset.edit;
    const dl = e.target.dataset.del;
    if (ed) openProductModal(DB.products.get(ed));
    if (dl) {
      const p = DB.products.get(dl);
      if (confirm(t('prod.del.confirm', { name: p.name }))) {
        DB.products.remove(dl);
        renderProducts();
        toast(t('prod.deleted'), 'success');
      }
    }
  });

  // Product modal
  const productModal = $('#productModal');
  const productForm = $('#productForm');
  let pendingImg = '';
  let customCategories = JSON.parse(localStorage.getItem('si_custom_categories') || '[]');

  $('#addProductBtn').addEventListener('click', () => openProductModal(null));
  $$('[data-close="product"]').forEach(b => b.addEventListener('click', () => productModal.classList.remove('open')));

  function buildCategoryOptions(selected = '') {
    const fromProducts = DB.products.categoriesOnly();
    const all = Array.from(new Set([...fromProducts, ...customCategories])).sort();
    const sel = $('#categorySelect');
    sel.innerHTML = all.length
      ? all.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('')
      : `<option value="" disabled selected>${t('prod.new_cat.title')} →</option>`;
    if (selected && !all.includes(selected)) {
      sel.insertAdjacentHTML('afterbegin', `<option value="${selected}" selected>${selected}</option>`);
    }
  }

  $('#addCategoryBtn').addEventListener('click', () => {
    $('#newCategoryWrap').classList.remove('hidden');
    $('#newCategoryInput').focus();
  });
  $('#cancelCategoryBtn').addEventListener('click', () => {
    $('#newCategoryWrap').classList.add('hidden');
    $('#newCategoryInput').value = '';
  });
  $('#saveCategoryBtn').addEventListener('click', () => {
    const v = $('#newCategoryInput').value.trim();
    if (!v) return toast(t('prod.cat.name_required'), 'error');
    if (!customCategories.includes(v)) {
      customCategories.push(v);
      localStorage.setItem('si_custom_categories', JSON.stringify(customCategories));
    }
    buildCategoryOptions(v);
    $('#newCategoryWrap').classList.add('hidden');
    $('#newCategoryInput').value = '';
    toast(t('prod.cat.added'), 'success');
  });

  function openProductModal(p) {
    productForm.reset();
    pendingImg = '';
    $('#productImgPreview').removeAttribute('src');
    $('#imgMeta').classList.add('hidden');
    $('#newCategoryWrap').classList.add('hidden');
    if (p) {
      $('#productModalTitle').textContent = t('prod.modal.edit');
      productForm.id.value = p.id;
      productForm.name.value = p.name;
      productForm.price.value = p.price;
      productForm.discount.value = p.discount || 0;
      productForm.stock.value = p.stock || 0;
      buildCategoryOptions(p.category);
      pendingImg = p.img;
      $('#productImgPreview').src = p.img;
    } else {
      $('#productModalTitle').textContent = t('prod.modal.new');
      productForm.id.value = '';
      buildCategoryOptions();
    }
    productModal.classList.add('open');
  }

  $('#productImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast(t('prod.img.too_big'), 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      pendingImg = reader.result;
      $('#productImgPreview').src = pendingImg;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const ratio = w / h;
        const isSquare = Math.abs(ratio - 1) < 0.05;
        const isBigEnough = w >= 300 && h >= 300;
        const sizeKb = Math.round(file.size / 1024);

        let ratioTag, sizeTag;
        if (isSquare && isBigEnough) {
          ratioTag = `<span class="tag ok">✓ ${w}×${h}px · 1:1</span>`;
        } else if (!isSquare) {
          ratioTag = `<span class="tag warn">⚠ ${w}×${h}px · ${ratio.toFixed(2)}:1</span>`;
        } else {
          ratioTag = `<span class="tag bad">✕ ${w}×${h}px · min 300×300</span>`;
        }
        sizeTag = sizeKb < 500 ? `<span class="tag ok">✓ ${sizeKb} KB</span>`
                : sizeKb < 1500 ? `<span class="tag warn">⚠ ${sizeKb} KB</span>`
                : `<span class="tag bad">✕ ${sizeKb} KB</span>`;

        const meta = $('#imgMeta');
        meta.innerHTML = ratioTag + sizeTag;
        meta.classList.remove('hidden');
      };
      img.src = pendingImg;
    };
    reader.readAsDataURL(file);
  });

  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const category = $('#categorySelect').value.trim();
    if (!category) return toast(t('prod.cat.required'), 'error');
    const data = {
      name: f.name.value.trim(),
      category,
      price: parseInt(f.price.value, 10) || 0,
      discount: parseInt(f.discount.value, 10) || 0,
      stock: parseInt(f.stock.value, 10) || 0,
      img: pendingImg || DB.svgGlass({ liquid: '#0EA5E9', type: 'bottle', label: f.name.value.slice(0, 6).toUpperCase() || 'DRINK' }),
    };
    if (f.id.value) {
      DB.products.update(f.id.value, data);
      toast(t('prod.updated'), 'success');
    } else {
      DB.products.add(data);
      toast(t('prod.added'), 'success');
    }
    productModal.classList.remove('open');
    renderProducts();
  });

  // ====================================================================
  //                          ORDERS
  // ====================================================================
  let orderFilter = 'all';
  $('#orderFilters').addEventListener('click', (e) => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('#orderFilters .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    orderFilter = c.dataset.status;
    renderOrders();
  });

  function renderOrders() {
    const tbody = $('#ordersTable');
    let list = DB.orders.all();
    if (orderFilter !== 'all') list = list.filter(o => o.status === orderFilter);

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-row">${t('ord.empty')}</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(o => `
      <tr>
        <td><b>#${o.id.slice(-5).toUpperCase()}</b></td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${t('ord.items.summary', { count: o.items.length, qty: o.items.reduce((s,i)=>s+i.qty,0) })}</td>
        <td><b>${DB.fmt.money(o.total)}</b></td>
        <td>${DB.fmt.date(o.createdAt)}</td>
        <td><span class="status ${o.status}">${t('status.' + o.status)}</span></td>
        <td class="actions">
          <button class="btn btn-ghost btn-sm" data-view="${o.id}">${t('common.view')}</button>
        </td>
      </tr>`).join('');
  }

  $('#ordersTable').addEventListener('click', (e) => {
    const id = e.target.dataset.view;
    if (id) openOrderModal(DB.orders.all().find(o => o.id === id));
  });

  const orderModal = $('#orderModal');
  $$('[data-close="order"]').forEach(b => b.addEventListener('click', () => orderModal.classList.remove('open')));

  const STATUSES = ['yangi', 'tayyorlanmoqda', 'yetkazilmoqda', 'bajarildi', 'bekor'];

  function openOrderModal(o) {
    if (!o) return;
    $('#orderDetails').innerHTML = `
      <div class="order-detail">
        <div class="head">
          <div><b>${t('ord.detail.id')}</b>#${o.id.slice(-5).toUpperCase()}</div>
          <div><b>${t('ord.detail.date')}</b>${DB.fmt.date(o.createdAt)}</div>
          <div><b>${t('ord.detail.customer')}</b>${o.name}</div>
          <div><b>${t('ord.detail.phone')}</b>${o.phone}</div>
          <div><b>${t('ord.detail.address')}</b>${o.address || '—'}</div>
          <div><b>${t('ord.detail.payment')}</b>${o.payment}${
            o.paymentMeta?.cardLast4 ? ` · **** ${o.paymentMeta.cardLast4}` :
            o.paymentMeta?.phone ? ` · ${o.paymentMeta.phone}` : ''
          }</div>
          ${o.note ? `<div style="grid-column:1/-1"><b>${t('ord.detail.note')}</b>${o.note}</div>` : ''}
        </div>
        <div class="items">
          ${o.items.map(i => `
            <div class="item">
              <span>${i.name} <span class="muted">× ${i.qty}</span></span>
              <b>${DB.fmt.money(i.qty * i.finalPrice)}</b>
            </div>`).join('')}
        </div>
        <div class="total">${t('ord.detail.total')}: ${DB.fmt.money(o.total)}</div>
        <div style="margin-top:14px"><b>${t('ord.detail.status')}:</b> <span class="status ${o.status}">${t('status.' + o.status)}</span></div>
        <div class="status-actions">
          ${STATUSES.map(s => s === o.status
            ? ''
            : `<button class="btn ${s === 'bekor' ? 'btn-danger' : 'btn-ghost'} btn-sm" data-set-status="${s}" data-order="${o.id}">→ ${t('status.' + s)}</button>`
          ).join('')}
        </div>
      </div>`;
    orderModal.classList.add('open');
  }

  $('#orderDetails').addEventListener('click', (e) => {
    const st = e.target.dataset.setStatus;
    const id = e.target.dataset.order;
    if (st && id) {
      DB.orders.update(id, { status: st });
      const updated = DB.orders.all().find(o => o.id === id);
      // Telegramga status o'zgarishini yuborish (best-effort)
      if (updated && Telegram.isEnabled()) Telegram.sendStatusUpdate(updated);
      orderModal.classList.remove('open');
      renderOrders();
      renderDashboard();
      toast(t('ord.status.changed', { status: t('status.' + st) }), 'success');
    }
  });

  // ====================================================================
  //                          USERS
  // ====================================================================
  function renderUsers() {
    const tbody = $('#usersTable');
    const list = DB.users.all();
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-row">${t('user.empty')}</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(u => {
      const userOrders = DB.orders.byUser(u.id).filter(o => o.status !== 'bekor');
      const spent = userOrders.reduce((s, o) => s + o.total, 0);
      return `
        <tr>
          <td><b>${u.name}</b></td>
          <td>${u.phone}</td>
          <td>${u.address || '—'}</td>
          <td>${userOrders.length}</td>
          <td><b style="color:var(--primary)">${DB.fmt.money(spent)}</b></td>
          <td>${DB.fmt.dateOnly(u.createdAt)}</td>
          <td class="actions">
            <button class="btn btn-danger btn-sm" data-del-user="${u.id}">${t('common.delete')}</button>
          </td>
        </tr>`;
    }).join('');
  }

  $('#usersTable').addEventListener('click', (e) => {
    const id = e.target.dataset.delUser;
    if (id && confirm(t('user.del.confirm'))) {
      DB.users.remove(id);
      renderUsers();
      toast(t('prod.deleted'), 'success');
    }
  });

  // ====================================================================
  //                          FINANCE
  // ====================================================================
  function renderFinance() {
    $('#fToday').textContent = DB.fmt.money(DB.stats.today());
    $('#fWeek').textContent  = DB.fmt.money(DB.stats.week());
    $('#fMonth').textContent = DB.fmt.money(DB.stats.month());
    const all = DB.orders.all()
      .filter(o => o.status !== 'bekor')
      .reduce((s, o) => s + o.total, 0);
    $('#fTotal').textContent = DB.fmt.money(all);

    const week = DB.stats.last7Days();
    drawBarChart('fChartRevenue', week.map(d => ({ label: d.label, value: d.revenue })));
    drawBarChart('fChartCount',   week.map(d => ({ label: d.label, value: d.count })), { intFormat: true });
  }

  // ====================================================================
  //                  CHART (sof JS)
  // ====================================================================
  function drawBarChart(canvasId, data, opts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || canvas.parentElement.clientWidth;
    const H = canvas.height = 240;
    canvas.width = W * dpr; canvas.style.width = W + 'px';
    canvas.height = H * dpr; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const padL = 50, padR = 16, padT = 16, padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const max = Math.max(1, ...data.map(d => d.value));
    const niceMax = niceCeil(max);

    ctx.strokeStyle = 'rgba(148,163,184,.15)';
    ctx.lineWidth = 1;
    ctx.font = '11px Manrope, system-ui';
    ctx.fillStyle = '#94a3b8';
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = padT + (chartH * i) / steps;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      const val = niceMax * (1 - i / steps);
      const label = opts.intFormat ? String(Math.round(val)) : shortMoney(val);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(label, padL - 8, y);
    }

    const slot = chartW / data.length;
    const barW = Math.min(38, slot * 0.55);
    data.forEach((d, i) => {
      const x = padL + slot * i + (slot - barW) / 2;
      const h = (d.value / niceMax) * chartH;
      const y = padT + chartH - h;

      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, '#0ea5e9');
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barW, h, 6); ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(d.label, x + barW / 2, padT + chartH + 8);

      if (d.value > 0) {
        ctx.fillStyle = '#e2e8f0';
        ctx.textBaseline = 'bottom';
        ctx.font = 'bold 11px Manrope, system-ui';
        const txt = opts.intFormat ? String(d.value) : shortMoney(d.value);
        ctx.fillText(txt, x + barW / 2, y - 4);
        ctx.font = '11px Manrope, system-ui';
      }
    });
  }
  function shortMoney(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
    return String(Math.round(n));
  }
  function niceCeil(n) {
    if (n <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(n)));
    const f = n / exp;
    let nice;
    if      (f <= 1) nice = 1;
    else if (f <= 2) nice = 2;
    else if (f <= 5) nice = 5;
    else nice = 10;
    return nice * exp;
  }
  function roundRect(ctx, x, y, w, h, r) {
    if (h < 1) h = 1;
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  window.addEventListener('resize', () => {
    if (!app.classList.contains('hidden')) {
      const visible = $$('.page').find(p => !p.classList.contains('hidden'));
      if (visible?.id === 'page-dashboard') renderDashboard();
      if (visible?.id === 'page-finance')   renderFinance();
    }
  });

  // ====================================================================
  //                         ADMIN CHAT
  // ====================================================================
  let activeChatUser = null;
  let adminChatPollTimer = null;

  function renderAdminChat() {
    const chatUsers = DB.chat.users();
    const list = $('#chatUserList');

    // Badge yangilash
    const totalUnread = DB.chat.unreadForAdmin();
    const badge = $('#chatBadge');
    if (totalUnread > 0) { badge.textContent = totalUnread; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');

    if (!chatUsers.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Hali chat yo\'q</div>';
      return;
    }

    list.innerHTML = chatUsers.map(cu => {
      const initial = (cu.userName || '?').charAt(0).toUpperCase();
      const lastText = cu.lastMsg.text.length > 30 ? cu.lastMsg.text.slice(0, 30) + '...' : cu.lastMsg.text;
      const isActive = activeChatUser === cu.userId;
      return `<div class="chat-user-item ${isActive ? 'active' : ''}" data-chat-user="${cu.userId}">
        <div class="cui-avatar">${initial}</div>
        <div class="cui-info">
          <div class="cui-name">${cu.userName}</div>
          <div class="cui-last">${cu.lastMsg.from === 'admin' ? 'Siz: ' : ''}${lastText}</div>
        </div>
        ${cu.unread > 0 ? `<div class="cui-badge">${cu.unread}</div>` : ''}
      </div>`;
    }).join('');

    list.onclick = (e) => {
      const el = e.target.closest('[data-chat-user]');
      if (!el) return;
      activeChatUser = el.dataset.chatUser;
      DB.chat.markSeenByAdmin(activeChatUser);
      renderAdminChat();
      renderAdminChatMessages();
    };

    if (activeChatUser) renderAdminChatMessages();

    // Polling
    clearInterval(adminChatPollTimer);
    adminChatPollTimer = setInterval(() => {
      const visible = $$('.page').find(p => !p.classList.contains('hidden'));
      if (visible?.id !== 'page-chat') { clearInterval(adminChatPollTimer); return; }
      renderAdminChat();
    }, 3000);
  }

  function renderAdminChatMessages() {
    if (!activeChatUser) return;
    const msgs = DB.chat.byUser(activeChatUser);
    const head = $('#chatMainHead');
    const wrap = $('#adminChatMessages');
    const form = $('#adminChatForm');

    const cu = DB.chat.users().find(c => c.userId === activeChatUser);
    head.innerHTML = `<b>${cu ? cu.userName : 'Foydalanuvchi'}</b>`;

    if (!msgs.length) {
      wrap.innerHTML = '<div class="admin-chat-empty">Xabarlar yo\'q</div>';
    } else {
      wrap.innerHTML = msgs.map(m => {
        const time = new Date(m.at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        return `<div class="admin-chat-bubble ${m.from}">
          ${m.text}
          <span class="acb-time">${time}</span>
        </div>`;
      }).join('');
      wrap.scrollTop = wrap.scrollHeight;
    }

    form.classList.remove('hidden');
  }

  $('#adminChatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeChatUser) return;
    const input = $('#adminChatInput');
    const text = input.value.trim();
    if (!text) return;
    const cu = DB.chat.users().find(c => c.userId === activeChatUser);
    DB.chat.send(activeChatUser, cu ? cu.userName : '', text, 'admin');
    input.value = '';
    renderAdminChatMessages();
  });

  // Chat badge'ni har doim yangilash
  setInterval(() => {
    if (app.classList.contains('hidden')) return;
    const n = DB.chat.unreadForAdmin();
    const badge = $('#chatBadge');
    if (n > 0) { badge.textContent = n; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  }, 5000);

  function renderAll() { renderDashboard(); }

  // ====================================================================
  //                          TELEGRAM BOT
  // ====================================================================
  const BOT_CFG_KEY = 'si_bot_config';
  const BOT_FEED_KEY = 'si_bot_feed';
  const BOT_HTTP_URL = localStorage.getItem('si_bot_http_url') || 'http://localhost:3344';

  function botRead() {
    try { return JSON.parse(localStorage.getItem(BOT_CFG_KEY) || 'null'); } catch { return null; }
  }
  function botWrite(cfg) {
    localStorage.setItem(BOT_CFG_KEY, JSON.stringify(cfg));
  }
  function getOrCreateBotId() {
    let cfg = botRead();
    if (!cfg || !cfg.botId) {
      const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      cfg = cfg || {};
      cfg.botId = `BOT-SALQIN-${suffix}`;
      cfg.createdAt = new Date().toISOString();
      cfg.connected = false;
      cfg.channel = null;
      cfg.connectedAt = null;
      cfg.sentCount = 0;
      botWrite(cfg);
    }
    return cfg;
  }

  function fmtBotDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  }

  function renderBot() {
    const cfg = getOrCreateBotId();
    const idInput = $('#botIdInput');
    if (idInput) idInput.value = cfg.botId;

    const statusCard      = $('#botStatusCard');
    const statusLabel     = $('#botStatusLabel');
    const statusTitle     = $('#botStatusTitle');
    const statusDesc      = $('#botStatusDesc');
    const indicatorText   = $('#botIndicatorText');
    const connectedCard   = $('#botConnectedCard');
    const sideBadge       = $('#botSideBadge');

    if (cfg.connected && cfg.channel) {
      statusCard?.classList.add('connected');
      if (statusLabel)   statusLabel.textContent = 'Ulangan';
      if (statusTitle)   statusTitle.textContent = 'Bot faol ishlamoqda';
      if (statusDesc)    statusDesc.textContent  = `Yangi buyurtmalar ${cfg.channel} kanaliga yuborilmoqda`;
      if (indicatorText) indicatorText.textContent = 'Online';
      if (connectedCard) connectedCard.style.display = '';
      if (sideBadge)     sideBadge.classList.remove('hidden');

      const ch = $('#botChannelName');   if (ch) ch.textContent = cfg.channel;
      const at = $('#botConnectedAt');   if (at) at.textContent = fmtBotDate(cfg.connectedAt);
      const sc = $('#botSentCount');     if (sc) sc.textContent = String(cfg.sentCount || 0);
    } else {
      statusCard?.classList.remove('connected');
      if (statusLabel)   statusLabel.textContent = 'Ulanmagan';
      if (statusTitle)   statusTitle.textContent = 'Bot ulanish kutmoqda';
      if (statusDesc)    statusDesc.textContent  = 'Quyidagi qadamlarni bajaring va botingizni ulang';
      if (indicatorText) indicatorText.textContent = 'Offline';
      if (connectedCard) connectedCard.style.display = 'none';
      if (sideBadge)     sideBadge.classList.add('hidden');
    }
  }

  function pushBotFeed(msg) {
    let feed = [];
    try { feed = JSON.parse(localStorage.getItem(BOT_FEED_KEY) || '[]'); } catch {}
    feed.push(msg);
    if (feed.length > 50) feed.shift();
    localStorage.setItem(BOT_FEED_KEY, JSON.stringify(feed));
  }

  // ----- Bot ID nusxalash -----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#copyBotIdBtn');
    if (!btn) return;
    const idInput = $('#botIdInput');
    if (!idInput) return;
    navigator.clipboard.writeText(idInput.value).then(() => {
      btn.classList.add('copied');
      toast('Bot ID nusxalandi', 'success');
      setTimeout(() => btn.classList.remove('copied'), 1800);
    }).catch(() => {
      idInput.select();
      try { document.execCommand('copy'); toast('Bot ID nusxalandi', 'success'); } catch {}
    });
  });

  // ----- Demo: kanal ulash -----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#botSimConnectBtn');
    if (!btn) return;
    const input = $('#botChannelInput');
    let channel = (input?.value || '').trim();
    if (!channel) { toast('Kanal username yoki ID kiriting', 'error'); return; }
    if (!channel.startsWith('@') && !channel.startsWith('-')) channel = '@' + channel;

    const cfg = getOrCreateBotId();
    cfg.connected = true;
    cfg.channel = channel;
    cfg.connectedAt = new Date().toISOString();
    cfg.sentCount = cfg.sentCount || 0;
    botWrite(cfg);

    toast(`Bot ${channel} kanaliga ulandi! 🎉`, 'success');
    pushBotFeed({
      type: 'system',
      text: `✅ ${cfg.botId} muvaffaqiyatli ulandi! Endi yangi buyurtmalar shu yerga keladi.`,
      time: new Date().toISOString(),
    });
    renderBot();
  });

  // ----- Test habar -----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#botTestBtn');
    if (!btn) return;
    const cfg = botRead() || {};
    if (!cfg.connected) { toast('Avval botni ulang', 'error'); return; }

    pushBotFeed({
      type: 'test',
      text: `🧪 Test habar — ${cfg.channel} ulanishi to'g'ri ishlamoqda.`,
      time: new Date().toISOString(),
    });
    cfg.sentCount = (cfg.sentCount || 0) + 1;
    botWrite(cfg);
    toast('Test habar yuborildi', 'success');
    renderBot();
  });

  // ----- Uzish -----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#botDisconnectBtn');
    if (!btn) return;
    if (!confirm('Botni kanaldan uzasizmi? Yangi buyurtmalar yuborilmaydi.')) return;
    const cfg = getOrCreateBotId();
    cfg.connected = false;
    cfg.channel = null;
    cfg.connectedAt = null;
    botWrite(cfg);
    toast('Bot uzildi', 'info');
    renderBot();
  });

  // ----- Buyurtma → Kanal (script.js dan chaqirish uchun global) -----
  window.notifyBotNewOrder = function (order) {
    try {
      const cfg = botRead();
      if (!cfg || !cfg.connected || !cfg.channel) return;

      const settings = (() => { try { return JSON.parse(localStorage.getItem('si_settings') || '{}'); } catch { return {}; } })();
      const shopName = settings.shopName || 'Salqin';

      const itemsText = (order.items || []).map(it =>
        `   • ${it.name} × ${it.qty} = ${DB.fmt.money(it.finalPrice * it.qty)}`
      ).join('\n');

      const msg = [
        `🥤 YANGI BUYURTMA — ${shopName}`,
        ``,
        `📦 Buyurtma: ${order.id.slice(-6).toUpperCase()}`,
        `👤 Mijoz: ${order.name || 'Anonim'}`,
        `📞 Tel: ${order.phone || '—'}`,
        `📍 Manzil: ${order.address || '—'}`,
        ``,
        `🛒 Mahsulotlar:`,
        itemsText || '   (bo\'sh)',
        ``,
        `💰 Jami: ${DB.fmt.money(order.total)}`,
        `⏱ Vaqt: ${DB.fmt.date(order.createdAt)}`
      ].join('\n');

      pushBotFeed({ type: 'order', text: msg, time: new Date().toISOString(), orderId: order.id });
      cfg.sentCount = (cfg.sentCount || 0) + 1;
      botWrite(cfg);

      // Haqiqiy Telegram bot serveriga POST
      fetch(`${BOT_HTTP_URL}/orders/${cfg.botId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: order.id.slice(-6).toUpperCase(),
            userName: order.name,
            phone: order.phone,
            address: order.address,
            items: (order.items || []).map(i => ({ name: i.name, qty: i.qty, price: i.finalPrice })),
            total: order.total,
          }
        })
      })
        .then(r => r.json().catch(() => ({ ok: false, error: 'Invalid JSON' })))
        .then(res => {
          if (res && res.ok) {
            console.log('[bot] yuborildi:', cfg.channel);
          } else {
            console.warn('[bot] xato:', res?.error);
          }
        })
        .catch(err => {
          console.warn('[bot] HTTP xato (port 3344 ishlamayotgan bo\'lishi mumkin):', err.message);
        });
    } catch (err) {
      console.error('notifyBotNewOrder error:', err);
    }
  };

  if (DB.admin.isAuthed()) showApp(); else showLogin();
})();
