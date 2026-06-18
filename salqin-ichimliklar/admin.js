// Salqin — Admin paneli logikasi
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = DB.esc; // XSS himoyasi — dinamik matnlar uchun

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
    qr:        { titleKey: 'admin.menu.dashboard',  subKey: 'admin.page.dashboard.sub' },
  };
  function go(page) {
    $$('.menu-item').forEach(m => m.classList.toggle('active', m.dataset.page === page));
    $$('.page').forEach(p => p.classList.add('hidden'));
    $('#page-' + page).classList.remove('hidden');
    const meta = pageMeta[page];
    if (meta) {
      const titles = { chat: 'Chat', bot: 'Telegram Bot', qr: 'QR Kod' };
      const subs   = { chat: 'Foydalanuvchilar bilan yozishmalar', bot: 'Buyurtmalarni Telegram kanalingizga avtomatik yuboring', qr: 'QR kod orqali do\'koningizni ulashing' };
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
    if (page === 'qr')        renderQrImg();
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
            <div><div class="name">${esc(p.name)}</div><div class="meta">${t('panel.sold', { n: p.qty })}</div></div>
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
            <td>${esc(o.name)}</td>
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
        <td><img class="cell-img" src="${esc(p.img)}" alt="" /></td>
        <td><b>${esc(p.name)}</b></td>
        <td>${esc(p.category)}</td>
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
      ? all.map(c => `<option value="${esc(c)}" ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join('')
      : `<option value="" disabled selected>${t('prod.new_cat.title')} →</option>`;
    if (selected && !all.includes(selected)) {
      sel.insertAdjacentHTML('afterbegin', `<option value="${esc(selected)}" selected>${esc(selected)}</option>`);
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
        <td>${esc(o.name)}</td>
        <td>${esc(o.phone)}</td>
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
          <div><b>${t('ord.detail.customer')}</b>${esc(o.name)}</div>
          <div><b>${t('ord.detail.phone')}</b>${esc(o.phone)}</div>
          <div><b>${t('ord.detail.address')}</b>${esc(o.address) || '—'}</div>
          <div><b>${t('ord.detail.payment')}</b>${esc(o.payment)}${
            o.paymentMeta?.cardLast4 ? ` · **** ${esc(o.paymentMeta.cardLast4)}` :
            o.paymentMeta?.phone ? ` · ${esc(o.paymentMeta.phone)}` : ''
          }</div>
          ${o.note ? `<div style="grid-column:1/-1"><b>${t('ord.detail.note')}</b>${esc(o.note)}</div>` : ''}
        </div>
        <div class="items">
          ${o.items.map(i => `
            <div class="item">
              <span>${esc(i.name)} <span class="muted">× ${i.qty}</span></span>
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
          <td><b>${esc(u.name)}</b></td>
          <td>${esc(u.phone)}</td>
          <td>${esc(u.address) || '—'}</td>
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
      return `<div class="chat-user-item ${isActive ? 'active' : ''}" data-chat-user="${esc(cu.userId)}">
        <div class="cui-avatar">${esc(initial)}</div>
        <div class="cui-info">
          <div class="cui-name">${esc(cu.userName)}</div>
          <div class="cui-last">${cu.lastMsg.from === 'admin' ? 'Siz: ' : ''}${esc(lastText)}</div>
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
    head.innerHTML = `<b>${cu ? esc(cu.userName) : 'Foydalanuvchi'}</b>`;

    if (!msgs.length) {
      wrap.innerHTML = '<div class="admin-chat-empty">Xabarlar yo\'q</div>';
    } else {
      wrap.innerHTML = msgs.map(m => {
        const time = new Date(m.at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        return `<div class="admin-chat-bubble ${m.from === 'admin' ? 'admin' : 'user'}">
          ${esc(m.text)}
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
  //              TELEGRAM BOT — Python server holati (real)
  // ====================================================================
  function botLocal() { try { return JSON.parse(localStorage.getItem('si_bot_config') || 'null') || {}; } catch { return {}; } }
  function botLocalSave(c) { localStorage.setItem('si_bot_config', JSON.stringify(c)); }
  function botShopName() {
    try {
      const s = (typeof DB !== 'undefined' && DB.settings && DB.settings.get) ? DB.settings.get() : null;
      return (s && (s.storeName || s.shopName || s.name)) || 'Salqin';
    } catch { return 'Salqin'; }
  }
  function botErr(e) { const m = String((e && e.message) || e || ''); if (/Failed to fetch|NetworkError|load failed|ERR_/i.test(m)) return "Bot serveriga ulanib bo'lmadi — «cd bot && python3 bot.py» ishlab turibdimi? (" + Telegram.API_URL + ')'; return m || 'Xato'; }

  function botSetConnUI(connected, username) {
    const pill = $('#bot2Status'); if (pill) { pill.className = 'bot2-status ' + (connected ? 'on' : 'off'); pill.textContent = '● ' + (connected ? 'Ulangan' : 'Ulanmagan'); }
    const side = $('#botSideBadge'); if (side) side.classList.toggle('hidden', !connected);
    const c = $('#bot2ConnectBtn'); if (c) c.style.display = connected ? 'none' : '';
    const d = $('#bot2DisconnectBtn'); if (d) d.style.display = connected ? '' : 'none';
    const box = $('#bot2BotInfo'); if (box) box.style.display = connected ? '' : 'none';
    const un = $('#bot2Username'); if (un) un.textContent = username || '@bot';
    const link = $('#bot2OpenLink'); if (link) { const u = String(username || '').replace(/^@/, ''); link.href = u ? ('https://t.me/' + u) : '#'; }
    const t = $('#bot2Token'); if (t) t.readOnly = connected;
  }
  function botSetChanUI(cfg) {
    const info = $('#bot2ChannelInfo'); if (info) info.style.display = cfg.channel ? '' : 'none';
    const set = (id, v) => { const el = $('#' + id); if (el) el.textContent = v; };
    set('bot2ChannelName', cfg.channel || '—');
    set('bot2SentCount', String(cfg.sentCount || 0));
    set('bot2UserCount', String(cfg.userCount || 0));
  }

  async function renderBot() {
    const cfg = botLocal();
    const setv = (id, v) => { const el = $('#' + id); if (el && !el.value) el.value = v; };
    setv('bot2Token', cfg.token || '');
    botSetConnUI(!!cfg.connected, cfg.username);
    botSetChanUI(cfg);
    const h = await Telegram.status();
    if (h && h.ok) {
      const c = botLocal();
      c.connected = !!h.connected; c.username = h.username || c.username; c.channel = h.channel || null; c.sentCount = h.sentCount || 0; c.userCount = h.userCount || 0;
      botLocalSave(c);
      botSetConnUI(c.connected, c.username); botSetChanUI(c);
    }
  }

  function botBusy(btn, on, txt) { if (!btn) return; btn.disabled = on; if (on) { btn.dataset._t = btn.innerHTML; btn.innerHTML = '⏳ ' + (txt || '...'); } else if (btn.dataset._t) { btn.innerHTML = btn.dataset._t; delete btn.dataset._t; } }

  async function botConnect() {
    const tokenEl = $('#bot2Token');
    const token = (tokenEl?.value || botLocal().token || '').trim();
    if (!/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token)) { toast("Token formati noto'g'ri", 'error'); tokenEl?.focus(); return; }
    const cfg = { shopName: botShopName(), token, storeUrl: (function(){ try { var u=new URL('index.html', location.href); var c=new URLSearchParams(location.search).get('client')||(JSON.parse(localStorage.getItem('bo_session')||'{}').clientId||''); if(c)u.searchParams.set('client',c); return u.href; } catch(e){ return ''; } })() };
    const btn = $('#bot2ConnectBtn');
    botBusy(btn, true, 'Ulanmoqda...');
    try {
      const data = await Telegram.connect(cfg);
      const lc = botLocal(); Object.assign(lc, cfg, { username: data.username, connected: true }); botLocalSave(lc);
      botSetConnUI(true, data.username);
      toast('Bot ulandi! ' + (data.username || '') + ' 🎉', 'success');
      renderBot();
    } catch (err) { toast(botErr(err), 'error'); } finally { botBusy(btn, false); }
  }
  async function botDisconnect() {
    if (!confirm('Botni uzasizmi? Buyurtmalar kanalga yuborilmaydi.')) return;
    await Telegram.disconnect();
    const c = botLocal(); c.connected = false; c.channel = null; botLocalSave(c);
    botSetConnUI(false); botSetChanUI(c); toast('Bot uzildi', 'info');
  }
  async function botConnectChannel() {
    const channel = ($('#bot2Channel')?.value || '').trim();
    if (!channel) { toast('Kanal username yoki ID kiriting', 'error'); return; }
    if (!botLocal().connected) { toast('Avval botni ulang', 'error'); return; }
    const btn = $('#bot2ChannelBtn'); botBusy(btn, true, 'Ulanmoqda...');
    try {
      const data = await Telegram.setChannel(channel);
      const c = botLocal(); c.channel = data.channel; botLocalSave(c); botSetChanUI(c);
      toast('Kanal ulandi: ' + data.channel + ' 🎉', 'success');
    } catch (err) { toast(botErr(err), 'error'); } finally { botBusy(btn, false); }
  }
  async function botDisconnectChannel() {
    if (!confirm('Kanalni uzasizmi? Buyurtmalar yuborilmaydi.')) return;
    try { await Telegram.setChannel(null, true); } catch (e) {}
    const c = botLocal(); c.channel = null; botLocalSave(c); botSetChanUI(c); toast('Kanal uzildi', 'info');
  }
  async function botTestChannel() {
    if (!botLocal().channel) { toast('Avval kanal ulang', 'error'); return; }
    const btn = $('#bot2ChannelTest'); botBusy(btn, true, 'Yuborilmoqda...');
    try {
      const data = await Telegram.sendOrder({ id: 'TEST', name: 'Test mijoz', phone: '+998 90 000 00 00', address: 'Sinov manzil', items: [{ name: 'Sinov mahsulot', qty: 1, price: 10000 }], total: 10000 });
      if (!data.ok) throw new Error(data.error || 'Yuborilmadi');
      const c = botLocal(); c.sentCount = data.sentCount || (c.sentCount || 0) + 1; botLocalSave(c); botSetChanUI(c);
      toast('Test habar kanalga yuborildi ✅', 'success');
    } catch (err) { toast(botErr(err), 'error'); } finally { botBusy(btn, false); }
  }
  async function botBroadcast() {
    const ta = $('#bot2BroadcastText'); const text = (ta?.value || '').trim();
    if (!text) { toast('Xabar matnini kiriting', 'error'); return; }
    if (!botLocal().connected) { toast('Avval botni ulang', 'error'); return; }
    const btn = $('#bot2BroadcastBtn'); const resEl = $('#bot2BroadcastResult'); botBusy(btn, true, 'Yuborilmoqda...');
    try {
      const data = await Telegram.broadcast(text);
      if (resEl) resEl.textContent = `✅ Yuborildi: ${data.sent} / ${data.total} ta` + (data.failed ? ` (xato: ${data.failed})` : '');
      if (ta) ta.value = ''; toast(data.total ? `Yuborildi: ${data.sent} ta` : 'Hali hech kim botga /start yozmagan', data.total ? 'success' : 'info');
    } catch (err) { if (resEl) resEl.textContent = ''; toast(botErr(err), 'error'); } finally { botBusy(btn, false); }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#bot2ConnectBtn')) botConnect();
    else if (e.target.closest('#bot2DisconnectBtn')) botDisconnect();
    else if (e.target.closest('#bot2ChannelBtn')) botConnectChannel();
    else if (e.target.closest('#bot2ChannelTest')) botTestChannel();
    else if (e.target.closest('#bot2ChannelDisc')) botDisconnectChannel();
    else if (e.target.closest('#bot2BroadcastBtn')) botBroadcast();
    else if (e.target.closest('#bot2Eye')) { const t = $('#bot2Token'); const btn = e.target.closest('#bot2Eye'); if (t) { const h = t.type === 'password'; t.type = h ? 'text' : 'password'; btn.textContent = h ? '🙈' : '👁'; } }
  });

  // ====================================================================
  //                  QR KOD — platformaning standart tizimi
  // ====================================================================
  // Joriy do'kon (mijoz) id'si — QR aynan shu do'kon storefront'iga olib borishi uchun.
  // Mavjud global ifodani qayta ishlatamiz (admin.html boot scriptida o'rnatilgan).
  function qrClientId() {
    const c = window.__CLIENT_ID;
    return (c && c !== 'shop') ? c : '';
  }
  // Ixtiyoriy maxsus domen uchun localStorage kaliti (har bir do'kon alohida)
  function qrStoreUrlKey() { return 'si_store_url__' + (qrClientId() || 'shop'); }
  // QR ko'rsatadigan storefront manzili. admin.html va index.html BIR PAPKADA —
  // shuning uchun "index.html" (NE "../index.html"), kerak bo'lsa ?client= qo'shiladi.
  function qrStoreUrl() {
    try {
      const saved = localStorage.getItem(qrStoreUrlKey());
      if (saved) return saved;
      const u = new URL('index.html', location.href);
      const cid = qrClientId();
      if (cid) u.searchParams.set('client', cid);
      return u.href;
    } catch (e) {
      return location.href.replace(/admin\.html.*$/, 'index.html');
    }
  }
  // Tashqi QR rasm xizmati (internet kerak)
  function qrApiSrc(url, size) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size +
      '&margin=10&qzone=1&data=' + encodeURIComponent(url);
  }
  // Do'kon nomi — bot bo'limidagi mavjud yordamchi orqali
  function qrShopName() { return botShopName(); }

  // QR rasmni va matnlarni chizish — sahifa ochilganda chaqiriladi
  function renderQrImg() {
    const url = qrStoreUrl();
    const input = $('#qrUrlInput'); if (input) input.value = url;
    const sn = $('#qrStoreName'); if (sn) sn.textContent = qrShopName();
    const img = $('#qrImage');
    const loading = $('#qrLoading');
    if (img) {
      if (loading) { loading.style.display = 'block'; loading.textContent = 'QR yuklanmoqda…'; }
      img.style.display = 'none';
      img.onload = () => { img.style.display = 'block'; if (loading) loading.style.display = 'none'; };
      img.onerror = () => { if (loading) loading.textContent = '⚠️ QR yuklanmadi (internet kerak)'; };
      img.src = qrApiSrc(url, 320);
    }
  }

  // QR tugmalari — delegatsiya orqali (renderQrImg bir necha marta chaqirilsa ham xavfsiz)
  document.addEventListener('click', (e) => {
    // Nusxalash
    if (e.target.closest('#qrCopyBtn')) {
      navigator.clipboard.writeText(qrStoreUrl())
        .then(() => toast('Havola nusxalandi', 'success'))
        .catch(() => toast('Nusxalab bo\'lmadi', 'error'));
    }
    // Ochish
    else if (e.target.closest('#qrOpenBtn')) {
      window.open(qrStoreUrl(), '_blank');
    }
    // Yuklab olish (600px) — blob orqali, xato bo'lsa yangi oynada ochiladi
    else if (e.target.closest('#qrDownloadBtn')) {
      (async () => {
        try {
          const res = await fetch(qrApiSrc(qrStoreUrl(), 600));
          const blob = await res.blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'qr-kod.png';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 3000);
          toast('QR kod yuklab olindi', 'success');
        } catch (err) { window.open(qrApiSrc(qrStoreUrl(), 600), '_blank'); }
      })();
    }
    // Chop etish — alohida oynaga QR + do'kon nomi + URL chiqarib print qiladi
    else if (e.target.closest('#qrPrintBtn')) {
      const url = qrStoreUrl();
      const w = window.open('', '_blank', 'width=480,height=680');
      if (!w) { toast('Chop etish oynasi bloklandi', 'error'); return; }
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>QR Kod</title></head>' +
        '<body style="font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#0f172a">' +
        '<h2 style="margin:0 0 4px">' + esc(qrShopName()) + '</h2>' +
        '<p style="margin:0 0 18px;color:#64748b">Veb-ilovamizni oching</p>' +
        '<img src="' + qrApiSrc(url, 400) + '" style="width:320px;height:320px"/>' +
        '<p style="margin-top:18px;font-size:18px">📷 Telefon kamerasi bilan skaner qiling</p>' +
        '<p style="color:#64748b;word-break:break-all;font-size:12px">' + esc(url) + '</p>' +
        '</body></html>');
      w.document.close();
      setTimeout(() => { try { w.focus(); w.print(); } catch (er) {} }, 700);
    }
    // Saqlash — maxsus domenni localStorage'ga yozadi va QR'ni qayta chizadi
    else if (e.target.closest('#qrSaveBtn')) {
      const inp = $('#qrCustomInput');
      let v = (inp && inp.value || '').trim();
      if (!v) { toast('Avval domen kiriting', 'error'); return; }
      if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
      try { localStorage.setItem(qrStoreUrlKey(), v); } catch (er) {}
      if (inp) inp.value = '';
      toast('QR kod yangilandi', 'success');
      renderQrImg();
    }
  });

  // ----- Admin parolini o'zgartirish -----
  $('#changePassBtn')?.addEventListener('click', () => {
    const oldP = prompt('Joriy parolni kiriting:');
    if (oldP === null) return;
    const newP = prompt('Yangi parol (kamida 6 belgi):');
    if (newP === null) return;
    const newP2 = prompt('Yangi parolni takrorlang:');
    if (newP2 === null) return;
    if (newP !== newP2) return toast('Parollar mos kelmadi', 'error');
    try {
      DB.admin.changePassword(oldP, newP);
      toast('Parol o\'zgartirildi ✓', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  if (DB.admin.isAuthed()) showApp(); else showLogin();

  // Standart parol bilan ishlatilayotgan bo'lsa ogohlantirish
  if (DB.admin.isAuthed() && DB.admin.isDefaultPassword()) {
    setTimeout(() => toast('⚠ Standart admin paroli ishlatilmoqda — uni o\'zgartiring!', 'error'), 1200);
  }
})();
