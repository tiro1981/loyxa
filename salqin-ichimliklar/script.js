// Salqin — Mobile Web App (page-based)
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  let activeCategory = 'all';
  let searchTerm = '';
  let activePage = 'home';

  // ---------- THEME ----------
  function applyTheme(t) {
    const el = document.documentElement;
    el.setAttribute('data-theme', t);
    el.classList.toggle('theme-dark', t === 'dark');
    el.classList.toggle('theme-light', t === 'light');
    el.style.colorScheme = t;
  }
  applyTheme(DB.theme.get());

  // ---------- I18N ----------
  I18N.applyDOM();
  document.addEventListener('langchange', () => {
    renderCategories();
    renderProducts();
    renderCart();
    if (activePage === 'orders') renderOrdersList();
    if (activePage === 'profile') renderProfile();
    updatePageTitle();
    if ($('#checkoutSummary').innerHTML) fillSummary();
  });

  // ---------- TOAST ----------
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg, type = '') {
    toastEl.textContent = msg;
    toastEl.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  // ---------- PAGE ROUTER ----------
  const PAGES = { home: '#pageHome', cart: '#pageCart', orders: '#pageOrders', profile: '#pageProfile' };
  const TITLE_KEYS = { home: 'bn.home', cart: 'bn.cart', orders: 'bn.orders', profile: 'bn.profile' };

  function updatePageTitle() {
    $('#pageTitle').textContent = t(TITLE_KEYS[activePage] || 'bn.home');
  }

  function showPage(name) {
    if (!PAGES[name]) name = 'home';
    activePage = name;
    Object.entries(PAGES).forEach(([k, sel]) => {
      $(sel).classList.toggle('page-active', k === name);
    });
    $$('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.bn === name));
    document.body.classList.toggle('on-profile', name === 'profile');
    updatePageTitle();
    window.scrollTo({ top: 0 });

    if (name === 'cart')    renderCart();
    if (name === 'orders')  renderOrdersList();
    if (name === 'profile') renderProfile();
  }

  $('#bottomNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.bn-item');
    if (!btn) return;
    showPage(btn.dataset.bn);
  });

  // ---------- PRODUCTS ----------
  function renderCategories() {
    const wrap = $('#categories');
    const cats = DB.products.categoriesOnly();
    wrap.innerHTML =
      `<button class="chip ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">${t('common.all')}</button>` +
      cats.map(c => `<button class="chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
    wrap.onclick = (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      activeCategory = btn.dataset.cat;
      renderCategories();
      renderProducts();
    };
  }

  function renderProducts() {
    const grid = $('#productsGrid');
    let list = DB.products.all();
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
    }
    $('#emptyState').classList.toggle('hidden', list.length > 0);
    grid.innerHTML = list.map(p => {
      const final = DB.products.finalPrice(p);
      const hasDiscount = (p.discount || 0) > 0;
      const out = (p.stock || 0) <= 0;
      const isPhoto = p.img && !p.img.startsWith('data:image/svg');
      return `
        <article class="card">
          <div class="card-img ${isPhoto ? 'card-img-photo' : 'card-img-svg'}">
            ${hasDiscount ? `<span class="discount-tag">-${p.discount}%</span>` : ''}
            <img src="${p.img}" alt="${p.name}" />
          </div>
          <div class="card-body">
            <span class="card-cat">${p.category}</span>
            <span class="card-name">${p.name}</span>
            <div class="card-price-row">
              <span class="card-price-main">${DB.fmt.money(final)}</span>
              ${hasDiscount ? `<span class="card-price-old">${DB.fmt.money(p.price)}</span>` : ''}
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary btn-block" data-add="${p.id}" ${out ? 'disabled' : ''}>
              ${out ? t('btn.out_of_stock') : t('btn.add_to_cart')}
            </button>
          </div>
        </article>`;
    }).join('');
    grid.onclick = (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      DB.cart.add(btn.dataset.add, 1);
      updateBadges();
      if (activePage === 'cart') renderCart();
      toast(t('cart.added'), 'success');
    };
  }

  $('#searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderProducts();
  });

  // ---------- CART (page) ----------
  function renderCart() {
    const body = $('#cartItems');
    const foot = $('#cartFoot');
    const items = DB.cart.all();
    $('#cartTotal').textContent = DB.fmt.money(DB.cart.total());

    if (!items.length) {
      body.innerHTML = `<div class="cart-empty">${t('cart.empty')}<br/>${t('cart.empty.sub')}</div>`;
      foot.classList.add('hidden');
      return;
    }
    foot.classList.remove('hidden');
    body.innerHTML = items.map(i => {
      const p = DB.products.get(i.productId);
      if (!p) return '';
      const final = DB.products.finalPrice(p);
      return `
        <div class="cart-row">
          <img src="${p.img}" alt="" />
          <div>
            <div class="name">${p.name}</div>
            <div class="price">${DB.fmt.money(final)} × ${i.qty}</div>
            <div class="qty" style="margin-top:6px">
              <button data-dec="${p.id}">−</button>
              <span>${i.qty}</span>
              <button data-inc="${p.id}">+</button>
            </div>
          </div>
          <button class="rm" data-rm="${p.id}">${t('cart.remove')}</button>
        </div>`;
    }).join('');

    body.onclick = (e) => {
      const el = e.target;
      const id = el.dataset.inc || el.dataset.dec || el.dataset.rm;
      if (!id) return;
      const cur = DB.cart.all().find(i => i.productId === id)?.qty || 0;
      if (el.dataset.inc) DB.cart.setQty(id, cur + 1);
      if (el.dataset.dec) DB.cart.setQty(id, cur - 1);
      if (el.dataset.rm)  DB.cart.remove(id);
      renderCart();
      updateBadges();
    };
  }

  // ---------- BADGES ----------
  function updateBadges() {
    const c = DB.cart.count();
    const cb = $('#bnCartBadge');
    cb.textContent = c;
    cb.classList.toggle('hidden', c <= 0);

    const u = DB.users.current();
    const ob = $('#bnOrdersBadge');
    if (!u) { ob.classList.add('hidden'); return; }
    const n = DB.notifications.forUser(u.id).length;
    if (n) { ob.textContent = n; ob.classList.remove('hidden'); }
    else ob.classList.add('hidden');
  }

  // ---------- CHECKOUT ----------
  const checkoutModal = $('#checkoutModal');
  $('#checkoutBtn').addEventListener('click', () => {
    if (!DB.cart.count()) return toast(t('cart.empty.err'), 'error');
    fillSummary();
    const u = DB.users.current();
    if (u) {
      const f = $('#checkoutForm');
      f.name.value = u.name; f.phone.value = u.phone; f.address.value = u.address || '';
    }
    checkoutModal.classList.add('open');
  });
  $$('[data-close="checkout"]').forEach(b => b.addEventListener('click', () => checkoutModal.classList.remove('open')));

  function fillSummary() {
    const items = DB.cart.all().map(i => {
      const p = DB.products.get(i.productId);
      return { name: p.name, qty: i.qty, sum: i.qty * DB.products.finalPrice(p) };
    });
    const total = items.reduce((s, i) => s + i.sum, 0);
    $('#checkoutSummary').innerHTML =
      items.map(i => `<div class="l"><span>${i.name} × ${i.qty}</span><b>${DB.fmt.money(i.sum)}</b></div>`).join('') +
      `<div class="l total"><span>${t('pay.summary.total')}</span><span>${DB.fmt.money(total)}</span></div>`;
  }

  // ---------- TO'LOV ----------
  $$('input[name="payment"]').forEach(r => {
    r.addEventListener('change', () => {
      const v = r.value;
      $('#payCardFields').classList.toggle('hidden', v !== 'karta');
      $('#payClickFields').classList.toggle('hidden', v !== 'click');
      $('#codeWrap').classList.add('hidden');
      $('#smsCode').value = '';
    });
  });

  $('#cardNumber').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    $('#cpNumber').textContent = (v.padEnd(16, '•')).match(/.{1,4}/g).join(' ');
  });
  $('#cardExpiry').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
    $('#cpExpiry').textContent = v || 'MM/YY';
  });
  $('#cardCvv').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });

  $('#sendCodeBtn').addEventListener('click', () => {
    const phone = $('#clickPhone').value.trim();
    if (!phone || phone.replace(/\D/g, '').length < 9) return toast(t('pay.err.phone_valid'), 'error');
    $('#codeWrap').classList.remove('hidden');
    toast(t('pay.click.sent'), 'success');
  });

  function validatePayment(formData) {
    const type = formData.get('payment');
    if (type === 'karta') {
      const num = (formData.get('cardNumber') || '').replace(/\s/g, '');
      const exp = formData.get('cardExpiry') || '';
      const cvv = formData.get('cardCvv') || '';
      if (num.length !== 16) return t('pay.err.card_num');
      if (!/^\d{2}\/\d{2}$/.test(exp)) return t('pay.err.expiry');
      const mm = parseInt(exp.split('/')[0], 10);
      if (mm < 1 || mm > 12) return t('pay.err.month');
      if (cvv.length < 3) return t('pay.err.cvv');
      return null;
    }
    if (type === 'click') {
      const phone = (formData.get('clickPhone') || '').replace(/\D/g, '');
      const code = formData.get('smsCode') || '';
      if (phone.length < 9) return t('pay.err.phone');
      if (!code || code.length !== 4) return t('pay.err.code');
      return null;
    }
    return null;
  }

  $('#checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const fd = new FormData(f);
    const err = validatePayment(fd);
    if (err) return toast(err, 'error');

    try {
      const user = DB.users.current();
      const payment = fd.get('payment');
      let paymentMeta = null;
      if (payment === 'karta') {
        const num = (fd.get('cardNumber') || '').replace(/\s/g, '');
        paymentMeta = { cardLast4: num.slice(-4), expiry: fd.get('cardExpiry') };
      } else if (payment === 'click') {
        paymentMeta = { phone: fd.get('clickPhone') };
      }

      const order = DB.orders.place({
        userId: user ? user.id : null,
        name: f.name.value.trim(),
        phone: f.phone.value.trim(),
        address: f.address.value.trim(),
        note: f.note.value.trim(),
        payment, paymentMeta,
      });
      checkoutModal.classList.remove('open');
      f.reset();
      $('#payCardFields').classList.add('hidden');
      $('#payClickFields').classList.add('hidden');
      $('#codeWrap').classList.add('hidden');
      $('#cpNumber').textContent = '•••• •••• •••• ••••';
      $('#cpExpiry').textContent = 'MM/YY';

      renderCart();
      updateBadges();
      toast(t('order.placed', { id: order.id.slice(-5).toUpperCase() }), 'success');

      if (window.Telegram && Telegram.isEnabled()) {
        Telegram.sendOrder(order).then(r => {
          if (r && r.error) console.warn('[Telegram] send failed:', r.error);
        });
      }

      // Admin panelida ulangan Telegram botga buyurtmani yuborish (port 3344)
      try {
        const botCfg = JSON.parse(localStorage.getItem('si_bot_config') || 'null');
        if (botCfg && botCfg.connected && botCfg.channel) {
          const BOT_HTTP = localStorage.getItem('si_bot_http_url') || 'http://localhost:3344';
          fetch(`${BOT_HTTP}/orders/${botCfg.botId}`, {
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
            .then(r => r.json().catch(() => ({ ok: false })))
            .then(res => {
              if (res && res.ok) {
                botCfg.sentCount = (botCfg.sentCount || 0) + 1;
                localStorage.setItem('si_bot_config', JSON.stringify(botCfg));
              } else {
                console.warn('[bot] yuborilmadi:', res?.error);
              }
            })
            .catch(err => console.warn('[bot] HTTP xato (3344):', err.message));
        }
      } catch (e) { console.warn('bot notify error:', e); }
      showPage('orders');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  // ---------- ORDERS ----------
  const STATUS_STEPS = ['yangi', 'tayyorlanmoqda', 'yetkazilmoqda', 'bajarildi'];

  function renderTimeline(order) {
    if (order.status === 'bekor') {
      return `<div class="timeline">
        <div class="tl-step cancelled" style="flex:1">
          <span class="tl-dot">✕</span>
          <div class="tl-label">${t('orders.cancelled')}</div>
        </div>
      </div>`;
    }
    const idx = STATUS_STEPS.indexOf(order.status);
    return `<div class="timeline">
      ${STATUS_STEPS.map((key, i) => {
        const cls = i < idx ? 'done' : i === idx ? 'current done' : '';
        return `<div class="tl-step ${cls}">
          <span class="tl-dot">${i < idx ? '✓' : i + 1}</span>
          <div class="tl-line"></div>
          <div class="tl-label">${t('status.' + key)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderOrdersList() {
    const u = DB.users.current();
    const list = $('#ordersList');
    if (!u) {
      list.innerHTML = `<div class="cart-empty">${t('orders.login.required')}<br/>${t('orders.login.hint')}</div>`;
      return;
    }
    const myOrders = DB.orders.byUser(u.id);
    if (!myOrders.length) {
      list.innerHTML = `<div class="cart-empty">${t('orders.empty')}</div>`;
      return;
    }
    const notes = DB.notifications.forUser(u.id);
    const newKeys = new Set(notes.map(n => `${n.orderId}:${n.status}`));
    list.innerHTML = myOrders.map(o => {
      const isNew = (o.statusHistory || []).some(h => newKeys.has(`${o.id}:${h.status}`));
      return `
        <div class="order-item">
          <div class="order-item-head">
            <div>
              <span class="order-item-id">#${o.id.slice(-5).toUpperCase()}</span>
              ${isNew ? `<span class="order-new-tag">${t('orders.new_tag')}</span>` : ''}
            </div>
            <span class="order-item-date">${DB.fmt.date(o.createdAt)}</span>
          </div>
          <div class="order-products">
            ${o.items.slice(0, 6).map(i => { const p = DB.products.get(i.productId); const src = (p && p.img) || i.img || ''; return `<img class="order-mini-img" src="${src}" alt="${i.name}" title="${i.name} × ${i.qty}"/>`; }).join('')}
            ${o.items.length > 6 ? `<span class="muted" style="align-self:center">+${o.items.length - 6}</span>` : ''}
          </div>
          ${renderTimeline(o)}
          <div class="order-summary-row">
            <span class="muted">${o.items.reduce((s,i)=>s+i.qty,0)} ${t('orders.pieces')} · ${o.payment}</span>
            <span class="order-total">${DB.fmt.money(o.total)}</span>
          </div>
        </div>`;
    }).join('');

    // Yangi tag'larni ko'rilgan deb belgilash
    DB.notifications.markAllSeen(u.id);
    updateBadges();
  }

  let lastStatusSnapshot = '';
  function pollStatusUpdates() {
    const u = DB.users.current();
    if (!u) return;
    const notes = DB.notifications.forUser(u.id);
    const snap = JSON.stringify(notes.map(n => n.key));
    if (snap !== lastStatusSnapshot) {
      if (lastStatusSnapshot && notes.length) {
        const n = notes[0];
        toast(t('order.status_changed', {
          id: n.orderId.slice(-5).toUpperCase(),
          status: t('status.' + n.status),
        }), 'success');
      }
      lastStatusSnapshot = snap;
      updateBadges();
      if (activePage === 'orders') renderOrdersList();
    }
  }
  setInterval(pollStatusUpdates, 5000);
  window.addEventListener('storage', pollStatusUpdates);

  // ---------- AUTH MODAL ----------
  const authModal = $('#authModal');
  $$('[data-close="auth"]').forEach(b => b.addEventListener('click', () => authModal.classList.remove('open')));

  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.tab-pane').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    $('#' + tab.dataset.tab + 'Form').classList.add('active');
  }));

  $('#registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      DB.users.register({
        name: f.name.value.trim(),
        phone: f.phone.value.trim(),
        address: f.address.value.trim(),
        password: f.password.value,
      });
      DB.users.login(f.phone.value.trim(), f.password.value);
      authModal.classList.remove('open');
      f.reset();
      renderProfile();
      updateBadges();
      toast(t('auth.registered'), 'success');
    } catch (err) {
      const map = {
        'Bu telefon raqami avval ro\'yxatdan o\'tgan': 'auth.err.phone_exists',
        'Telefon yoki parol noto\'g\'ri': 'auth.err.wrong',
      };
      toast(map[err.message] ? t(map[err.message]) : err.message, 'error');
    }
  });

  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const u = DB.users.login(f.phone.value.trim(), f.password.value);
      authModal.classList.remove('open');
      f.reset();
      renderProfile();
      updateBadges();
      DB.notifications.markAllSeen(u.id);
      toast(t('auth.welcome', { name: u.name }), 'success');
    } catch (err) {
      const map = { 'Telefon yoki parol noto\'g\'ri': 'auth.err.wrong' };
      toast(map[err.message] ? t(map[err.message]) : err.message, 'error');
    }
  });

  // ---------- LANG MENU ----------
  const langMenu = $('#langMenu');
  let langBackdrop = null;
  function openLangMenu() {
    langBackdrop = document.createElement('div');
    langBackdrop.className = 'lang-backdrop';
    langBackdrop.addEventListener('click', closeLangMenu);
    document.body.appendChild(langBackdrop);
    langMenu.classList.remove('hidden');
  }
  function closeLangMenu() {
    langMenu.classList.add('hidden');
    if (langBackdrop) { langBackdrop.remove(); langBackdrop = null; }
  }
  $$('#langMenu [data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      I18N.set(btn.dataset.lang);
      closeLangMenu();
    });
  });

  // ---------- PROFILE page ----------
  function renderProfile() {
    const u = DB.users.current();
    const body = $('#profileBody');
    const meta = I18N.meta();
    const theme = DB.theme.get();
    const isDark = theme === 'dark';

    const initial = u ? (u.name || '?').trim().charAt(0).toUpperCase() : 'U';
    const displayName = u ? u.name : t('profile.guest');
    const displaySub = u ? (u.phone || t('profile.guest.sub')) : t('profile.guest.sub');

    const orderCount = u ? DB.orders.byUser(u.id).length : 0;

    const head = `
      <div class="profile-hero-new">
        <div class="ph-photo">
          <span class="ph-initial">${initial}</span>
        </div>
        <div class="ph-name">${displayName}</div>
        <div class="ph-sub">${displaySub}</div>
      </div>

      <div class="profile-stats">
        <div class="ps-card">
          <div class="ps-num">${orderCount}</div>
          <div class="ps-label">${t('profile.stats.orders')}</div>
        </div>
        <div class="ps-card">
          <div class="ps-num">0</div>
          <div class="ps-label">${t('profile.stats.bonus')}</div>
        </div>
      </div>
    `;

    const row = (key, color, icon, title, sub, extra = '') => `
      <button class="profile-row" data-pr="${key}">
        <span class="pr-icon pr-icon-${color}">${icon}</span>
        <span class="pr-text"><span class="pr-title">${title}</span><span class="pr-sub">${sub}</span></span>
        ${extra || '<span class="pr-chev">›</span>'}
      </button>
    `;

    const sv = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    const iconHeart   = sv('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" fill="currentColor" stroke="none"/>');
    const iconPin     = sv('<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>');
    const iconCard    = sv('<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M2 11h20"/>');
    const iconMoon    = sv('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor" stroke="none"/>');
    const iconChat    = sv('<path d="M21 12a8 8 0 0 1-11.7 7.1L3 21l1.9-6.3A8 8 0 1 1 21 12z"/>');
    const iconHelp    = sv('<circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7"/><path d="M12 17h.01"/>');
    const iconShield  = sv('<path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/>');
    const iconLogout  = sv('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>');
    const iconGlobe   = sv('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>');

    const chatUnread = u ? DB.chat.unreadForUser(u.id) : 0;
    const chatSub = chatUnread > 0 ? `${chatUnread} ta yangi xabar` : t('profile.row.chat.sub');

    const rows = [
      row('address',   'green',  iconPin,   t('profile.row.addresses'),  u ? (u.address || t('profile.row.address.empty')) : t('profile.row.addresses.sub')),
      row('payment',   'orange', iconCard,  t('profile.row.payment'),    t('profile.row.payment.sub')),
      row('theme',     'dark',   iconMoon,  t('profile.row.darkmode'),   t('profile.row.darkmode.sub'),
        `<label class="pr-switch"><input type="checkbox" data-pr="theme" ${isDark ? 'checked' : ''}/><span class="pr-slider"></span></label>`),
      row('chat',      'blue',   iconChat,  t('profile.row.chat'),       chatSub),
      row('language',  'blue',   iconGlobe, t('profile.row.language'),   meta.name),
    ].join('');

    const logoutKey = u ? 'logout' : 'login';
    const logoutTitle = u ? t('profile.row.logout') : t('profile.row.login');
    const logoutSub = u ? t('profile.row.logout.sub') : t('profile.row.login.sub');
    const logout = `
      <button class="profile-row pr-danger" data-pr="${logoutKey}">
        <span class="pr-icon pr-icon-red">${iconLogout}</span>
        <span class="pr-text"><span class="pr-title">${logoutTitle}</span><span class="pr-sub">${logoutSub}</span></span>
        <span class="pr-chev">›</span>
      </button>
    `;

    body.innerHTML = head + `<div class="profile-menu">${rows}${logout}</div>`;

    body.onclick = (e) => {
      if (e.target.closest('.pr-switch')) return;
      const el = e.target.closest('[data-pr]');
      if (!el) return;
      const k = el.dataset.pr;
      if (k === 'orders')    { showPage('orders'); return; }
      if (k === 'login')     { authModal.classList.add('open'); return; }
      if (k === 'address')   { openAddressModal(); return; }
      if (k === 'payment')   { openPaymentModal(); return; }
      if (k === 'chat')      { openChatModal(); return; }
      if (k === 'language')  { openLangMenu(); return; }
      if (k === 'theme')     { applyTheme(DB.theme.toggle()); renderProfile(); return; }
      if (k === 'logout') {
        if (confirm(t('auth.logout.confirm', { name: DB.users.current().name }))) {
          DB.users.logout();
          renderProfile();
          updateBadges();
          toast(t('auth.logged_out'));
        }
      }
    };

    const themeToggle = body.querySelector('input[type="checkbox"][data-pr="theme"]');
    if (themeToggle) {
      themeToggle.addEventListener('change', () => {
        applyTheme(DB.theme.toggle());
        renderProfile();
      });
    }
  }

  // ---------- ADDRESS MODAL ----------
  const addressModal = $('#addressModal');
  $$('[data-close="address"]').forEach(b => b.addEventListener('click', () => addressModal.classList.remove('open')));

  // Viloyat selectini to'ldirish
  const addrRegion = $('#addrRegion');
  const addrDistrict = $('#addrDistrict');
  Object.keys(DB.regions).forEach(r => {
    const opt = document.createElement('option');
    opt.value = r; opt.textContent = r;
    addrRegion.appendChild(opt);
  });

  addrRegion.addEventListener('change', () => {
    const districts = DB.regions[addrRegion.value] || [];
    addrDistrict.innerHTML = '<option value="">Tanlang...</option>';
    districts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      addrDistrict.appendChild(opt);
    });
    addrDistrict.disabled = !districts.length;
    updateAddrPreview();
  });
  addrDistrict.addEventListener('change', updateAddrPreview);
  $('#addrStreet').addEventListener('input', updateAddrPreview);
  $('#addrHouse').addEventListener('input', updateAddrPreview);

  function updateAddrPreview() {
    const parts = [addrRegion.value, addrDistrict.value, $('#addrStreet').value.trim(), $('#addrHouse').value.trim()].filter(Boolean);
    const pre = $('#addrPreview');
    if (parts.length >= 2) {
      pre.classList.remove('hidden');
      pre.innerHTML = '<b>Manzil:</b> ' + parts.join(', ');
    } else {
      pre.classList.add('hidden');
    }
  }

  function openAddressModal() {
    const u = DB.users.current();
    if (!u) {
      toast(t('address.login_required'), 'error');
      authModal.classList.add('open');
      return;
    }
    // Agar avval manzil saqlangan bo'lsa, parselaymiz
    if (u.address) {
      const parts = u.address.split(', ');
      if (parts.length >= 2 && DB.regions[parts[0]]) {
        addrRegion.value = parts[0];
        addrRegion.dispatchEvent(new Event('change'));
        setTimeout(() => {
          if (parts[1]) addrDistrict.value = parts[1];
          if (parts[2]) $('#addrStreet').value = parts[2];
          if (parts[3]) $('#addrHouse').value = parts[3];
          updateAddrPreview();
        }, 50);
      } else {
        $('#addrStreet').value = u.address;
        updateAddrPreview();
      }
    }
    addressModal.classList.add('open');
  }

  $('#addressForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = DB.users.current();
    if (!u) return;
    const parts = [addrRegion.value, addrDistrict.value, $('#addrStreet').value.trim(), $('#addrHouse').value.trim()].filter(Boolean);
    const val = parts.join(', ');
    if (!val) return toast('Manzilni to\'liq kiriting', 'error');
    DB.users.update(u.id, { address: val });
    addressModal.classList.remove('open');
    renderProfile();
    toast(t('address.saved'), 'success');
  });

  // ---------- PAYMENT MODAL ----------
  const paymentModal = $('#paymentModal');
  $$('[data-close="payment"]').forEach(b => b.addEventListener('click', () => paymentModal.classList.remove('open')));

  const PAY_METHODS = [
    { id: 'naqd',  icon: '💵', name: 'Naqd pul',    sub: 'Kuryerga to\'lov' },
    { id: 'uzcard',icon: '💳', name: 'Uzcard',       sub: 'Plastik karta' },
    { id: 'humo',  icon: '💳', name: 'Humo',         sub: 'Plastik karta' },
    { id: 'payme', icon: '📲', name: 'Payme',        sub: 'Mobil to\'lov' },
    { id: 'click', icon: '📲', name: 'Click',        sub: 'Mobil to\'lov' },
  ];

  function openPaymentModal() {
    const u = DB.users.current();
    if (!u) {
      toast(t('address.login_required'), 'error');
      authModal.classList.add('open');
      return;
    }
    const current = u.paymentMethod || 'naqd';
    $('#paymentMethods').innerHTML = PAY_METHODS.map(m => `
      <div class="pay-method ${m.id === current ? 'active' : ''}" data-pay="${m.id}">
        <span class="pm-icon">${m.icon}</span>
        <div class="pm-text"><b>${m.name}</b><small>${m.sub}</small></div>
        <span class="pm-check">${m.id === current ? '✓' : ''}</span>
      </div>
    `).join('');

    $('#paymentMethods').onclick = (e) => {
      const el = e.target.closest('[data-pay]');
      if (!el) return;
      const id = el.dataset.pay;
      DB.users.update(u.id, { paymentMethod: id });
      $$('.pay-method').forEach(m => {
        m.classList.toggle('active', m.dataset.pay === id);
        m.querySelector('.pm-check').textContent = m.dataset.pay === id ? '✓' : '';
      });
      toast(`To'lov usuli: ${PAY_METHODS.find(m => m.id === id).name}`, 'success');
    };

    paymentModal.classList.add('open');
  }

  // ---------- CHAT MODAL ----------
  const chatModal = $('#chatModal');
  $$('[data-close="chat"]').forEach(b => b.addEventListener('click', () => chatModal.classList.remove('open')));
  let chatPollTimer = null;

  function openChatModal() {
    const u = DB.users.current();
    if (!u) {
      toast(t('address.login_required'), 'error');
      authModal.classList.add('open');
      return;
    }
    renderChatMessages(u.id);
    DB.chat.markSeenByUser(u.id);
    chatModal.classList.add('open');
    scrollChatBottom();

    // Har 3 sekundda yangilanish
    clearInterval(chatPollTimer);
    chatPollTimer = setInterval(() => {
      if (!chatModal.classList.contains('open')) { clearInterval(chatPollTimer); return; }
      renderChatMessages(u.id);
      DB.chat.markSeenByUser(u.id);
    }, 3000);
  }

  function renderChatMessages(userId) {
    const msgs = DB.chat.byUser(userId);
    const wrap = $('#chatMessages');
    if (!msgs.length) {
      wrap.innerHTML = '<div class="chat-empty">Hali xabar yo\'q.<br>Adminga savol yoki murojaat yuboring.</div>';
      return;
    }
    wrap.innerHTML = msgs.map(m => {
      const time = new Date(m.at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      return `<div class="chat-bubble ${m.from}">
        ${m.text}
        <span class="cb-time">${time}</span>
      </div>`;
    }).join('');
  }

  function scrollChatBottom() {
    setTimeout(() => {
      const el = $('#chatMessages');
      el.scrollTop = el.scrollHeight;
    }, 100);
  }

  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = DB.users.current();
    if (!u) return;
    const input = $('#chatInput');
    const text = input.value.trim();
    if (!text) return;
    DB.chat.send(u.id, u.name, text, 'user');
    input.value = '';
    renderChatMessages(u.id);
    scrollChatBottom();
  });

  // ---------- INIT ----------
  renderCategories();
  renderProducts();
  renderCart();
  updateBadges();
  showPage('home');
})();
