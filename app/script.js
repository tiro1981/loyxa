// ========== CLIENT NAMESPACE ==========
const _urlP = new URLSearchParams(window.location.search);
const _urlClient = _urlP.get('client');
if (_urlClient) { try { localStorage.setItem('app_last_client', _urlClient); } catch (e) {} }
const CLIENT_ID = _urlClient
  || (() => { try { return localStorage.getItem('app_last_client') || null; } catch { return null; } })()
  || (() => {
    try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; }
  })() || 'demo';
const _P = CLIENT_ID + '_';

// Mijoz haqida ma'lumot (biznes nomi, manzili — restorant brending uchun)
const _clientInfo = (() => {
  try {
    const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
    return subs.find(s => s.id === CLIENT_ID) || null;
  } catch { return null; }
})();

// ========== SHARED DB (auto-prefixes tb_* keys per client) ==========
// Serverga (Cloud/Supabase) ko'chiriladigan UMUMIY kalitlar — Cloud client_id bo'yicha
// avtomatik ajratadi (multi-tenant). Qurilmaga xos kalitlar (savat tb_cart, joriy login
// tb_current_user, foydalanuvchiga xos tb_user_*, tema) localStorage'da (_P bilan) qoladi.
const CLOUD_KEYS = new Set(['tb_foods','tb_orders','tb_users','tb_settings','tb_messages','tb_admin_account','tb_bot_config','tb_store_url','tb_bot_api']);
const DB = {
  _k(k) { return k.startsWith('tb_') ? _P + k : k; },
  get(k, fb) {
    if (CLOUD_KEYS.has(k) && window.Cloud) { const v = Cloud.get(k, undefined); return (v === undefined || v === null) ? fb : v; }
    try { const v = localStorage.getItem(this._k(k)); return v ? JSON.parse(v) : fb; } catch { return fb; }
  },
  set(k, v) {
    if (CLOUD_KEYS.has(k) && window.Cloud) { Cloud.set(k, v); return; }
    localStorage.setItem(this._k(k), JSON.stringify(v));
  },
  remove(k) {
    if (CLOUD_KEYS.has(k) && window.Cloud) { Cloud.remove(k); return; }
    localStorage.removeItem(this._k(k));
  }
};
// DOM tayyorligini hisobga oluvchi yordamchi (cloud boot-loader skriptni sahifa
// yuklangach qo'shadi — DOMContentLoaded o'tib ketgan bo'lishi mumkin).
function onReady(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

// ========== SEED FOODS ==========
// Har bir mijoz alohida boshlanadi — default ovqatlar yo'q.
// Mijoz admin panelida o'z menyusini qo'shadi.
if (!DB.get('tb_foods')) DB.set('tb_foods', []);
if (!DB.get('tb_orders')) DB.set('tb_orders', []);
if (!DB.get('tb_users')) DB.set('tb_users', []);
if (!DB.get('tb_messages')) DB.set('tb_messages', []);
if (!DB.get('tb_settings')) {
  DB.set('tb_settings', {
    restaurantName: _clientInfo?.businessName || 'Mening restoranim',
    address: _clientInfo?.address ? `${_clientInfo.city || ''}, ${_clientInfo.address}`.trim().replace(/^,\s*/, '') : 'Manzilni kiriting',
    hours: '09:00 - 23:00',
    deliveryFee: 15000
  });
}

// Sahifa title va topbar brendingi — mijoz restorant nomidan
(function applyClientBranding() {
  const settings = DB.get('tb_settings', {});
  const name = settings.restaurantName || _clientInfo?.businessName || 'Restoran';
  const addr = settings.address || 'Manzil';
  document.title = name + ' — Onlayn buyurtma';
  onReady(() => {
    const n = document.getElementById('topbarRestaurantName'); if (n) n.textContent = name;
    const a = document.getElementById('topbarAddress'); if (a) a.textContent = addr;
    const auth = document.getElementById('authBrandName'); if (auth) auth.textContent = name;
  });
})();

// ========== STATE ==========
let cart = DB.get('tb_cart', []);
let currentUser = DB.get('tb_current_user', null);
let currentCat = 'all';
let currentFood = null;
let qty = 1;
let filterState = { sort: 'default', maxPrice: 100000 };
const $ = (id) => document.getElementById(id);

// ========== USER DATA HELPERS ==========
function userKey(k) { return currentUser ? `tb_user_${currentUser.id}_${k}` : null; }
function getFav() { return DB.get(userKey('fav'), []); }
function setFav(v) { DB.set(userKey('fav'), v); }
function getAddrs() { return DB.get(userKey('addr'), []); }
function setAddrs(v) { DB.set(userKey('addr'), v); }
function getPays() { return DB.get(userKey('pay'), []); }
function setPays(v) { DB.set(userKey('pay'), v); }
function getNotifs() { return DB.get(userKey('notif'), []); }
function setNotifs(v) { DB.set(userKey('notif'), v); }

// ========== AUTH ==========
const authOverlay = $('authOverlay');
// Mehmon (ro'yxatdan o'tmagan) mijoz uchun shu QURILMAGA xos, bir martalik va doimiy ID.
// MUHIM: bu ID hech qachon "guest" kabi qattiq kodlangan umumiy qiymat bo'lmasligi kerak —
// aks holda barcha mehmon mijozlar bitta ID'ni baham ko'radi va "tb_orders" umumiy (Cloud)
// saqlangani uchun bir-birining buyurtmalarini (ism, telefon, manzil bilan) ko'rib qoladi.
function guestId() {
  const key = _P + 'tb_guest_id';
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    return 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }
}
function checkAuth() {
  // Login/ro'yxatdan o'tish talab qilinmaydi — foydalanuvchi to'g'ridan-to'g'ri kiradi (mehmon sifatida)
  if (!currentUser) {
    currentUser = { id: guestId(), name: 'Mehmon', email: '', phone: '', orders: 0, status: 'active', joinDate: new Date().toISOString() };
    DB.set('tb_current_user', currentUser);
  }
  if (authOverlay) authOverlay.classList.remove('show');
  initUserUI();
}

document.querySelectorAll('.auth-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab + 'Form').classList.add('active');
  });
});

$('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const inputs = e.target.querySelectorAll('input');
  const email = inputs[0].value.trim();
  const password = inputs[1].value;
  const users = DB.get('tb_users', []);
  let user = users.find(u => u.email === email);
  if (user) {
    if (user.password !== password) { showToast('Parol noto\'g\'ri'); return; }
    if (user.status === 'blocked') { showToast('Hisobingiz bloklangan'); return; }
  } else {
    user = { id: Date.now(), name: email.split('@')[0], email, phone: '', password, orders: 0, status: 'active', joinDate: new Date().toISOString() };
    users.push(user); DB.set('tb_users', users);
  }
  currentUser = user;
  DB.set('tb_current_user', user);
  checkAuth();
  showToast('Xush kelibsiz, ' + user.name + '! 🎉');
});

$('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const inputs = e.target.querySelectorAll('input');
  const name = inputs[0].value.trim();
  const email = inputs[1].value.trim();
  const phone = inputs[2].value.trim();
  const password = inputs[3].value;
  const users = DB.get('tb_users', []);
  if (users.find(u => u.email === email)) { showToast('Bu email allaqachon ro\'yxatdan o\'tgan'); return; }
  const user = { id: Date.now(), name, email, phone, password, orders: 0, status: 'new', joinDate: new Date().toISOString() };
  users.push(user); DB.set('tb_users', users);
  currentUser = user;
  DB.set('tb_current_user', user);
  checkAuth();
  showToast('Hisob yaratildi! 🎉');
});

$('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  DB.remove('tb_current_user');
  checkAuth();
});

function initUserUI() {
  updateProfile();
  renderFoods();
  updateCartBadge();
  renderNotifications();
}

function updateProfile() {
  if (!currentUser) return;
  const myOrders = DB.get('tb_orders', []).filter(o => o.userId === currentUser.id);
  $('profileName').textContent = currentUser.name;
  $('profileEmail').textContent = currentUser.email;
  const initial = currentUser.name[0].toUpperCase();
  $('profileAvatar').textContent = initial;
  $('topAvatar').textContent = initial;
  $('statOrders').textContent = myOrders.length;
  $('statFav').textContent = getFav().length;
  $('statBonus').textContent = Math.floor(myOrders.filter(o => o.status === 'completed').length * 1.5);
  document.querySelector('.home-head h1 .accent').textContent = currentUser.name;
}

// ========== BOTTOM NAV ==========
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});
function navigateTo(page) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${page}"]`)?.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $('page-' + page).classList.add('active');
  if (page === 'cart') renderCart();
  if (page === 'orders') renderOrders(document.querySelector('.order-tab.active')?.dataset.otab || 'active');
  if (page === 'home') renderFoods();
  if (page === 'profile') updateProfile();
  if (page === 'favorites') renderFavorites();
}

document.querySelectorAll('[data-back]').forEach(b =>
  b.addEventListener('click', () => navigateTo(b.dataset.back)));

// ========== NOTIFICATIONS ==========
$('notifBtn').addEventListener('click', () => {
  $('notifPanel').classList.add('open');
  // mark all read
  const ns = getNotifs();
  ns.forEach(n => n.unread = false);
  setNotifs(ns);
  updateNotifBadge();
});
$('closeNotif').addEventListener('click', () => $('notifPanel').classList.remove('open'));
$('clearNotif').addEventListener('click', () => {
  setNotifs([]); renderNotifications(); updateNotifBadge();
});

function renderNotifications() {
  const list = $('notifList');
  const ns = getNotifs();
  if (ns.length === 0) {
    list.innerHTML = `<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i><p>Bildirishnomalar yo'q</p></div>`;
    return;
  }
  const icons = { order: 'fa-circle-check', delivery: 'fa-truck-fast', promo: 'fa-tag', message: 'fa-comment-dots', cancel: 'fa-circle-xmark' };
  const colors = { order: 'green', delivery: 'orange', promo: 'orange', message: 'dark', cancel: 'red' };
  list.innerHTML = ns.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}">
      <div class="notif-icon ${colors[n.type] || 'green'}"><i class="fa-solid ${icons[n.type] || 'fa-bell'}"></i></div>
      <div class="notif-body">
        <h4>${n.title}</h4>
        <p>${n.text}</p>
        <span class="time">${timeAgo(n.time)}</span>
      </div>
    </div>
  `).join('');
}
function updateNotifBadge() {
  const c = getNotifs().filter(n => n.unread).length;
  const b = document.querySelector('.notif-btn .badge');
  if (c > 0) { b.style.display = 'flex'; b.textContent = c; } else b.style.display = 'none';
}
function addNotification(type, title, text) {
  const ns = getNotifs();
  ns.unshift({ id: Date.now(), type, title, text, time: new Date().toISOString(), unread: true });
  setNotifs(ns);
  renderNotifications();
  updateNotifBadge();
}
function timeAgo(iso) {
  const d = new Date(iso); const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'Hozir';
  if (s < 3600) return Math.floor(s / 60) + ' daq oldin';
  if (s < 86400) return Math.floor(s / 3600) + ' soat oldin';
  return Math.floor(s / 86400) + ' kun oldin';
}

// ========== CATEGORIES ==========
document.querySelectorAll('.cat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentCat = chip.dataset.cat;
    renderFoods();
  });
});

// ========== SEARCH ==========
$('searchInput').addEventListener('input', renderFoods);

// ========== RENDER FOODS ==========
function foodImageHTML(f) {
  return f.image ? `<img src="${f.image}" alt="${f.name}">` : f.emoji;
}

function renderFoods() {
  const foods = DB.get('tb_foods', []);
  const q = $('searchInput').value.toLowerCase();
  const grid = $('foodGrid');
  let list = foods.filter(f =>
    f.active !== false &&
    (currentCat === 'all' || f.cat === currentCat) &&
    f.name.toLowerCase().includes(q) &&
    f.price <= filterState.maxPrice
  );
  if (filterState.sort === 'priceAsc') list.sort((a, b) => a.price - b.price);
  if (filterState.sort === 'priceDesc') list.sort((a, b) => b.price - a.price);
  if (filterState.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  if (filterState.sort === 'fast') list.sort((a, b) => a.time - b.time);

  if (list.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-sub)"><i class="fa-solid fa-magnifying-glass" style="font-size:40px;opacity:.3"></i><p style="margin-top:12px">Hech narsa topilmadi</p></div>';
    return;
  }

  const favs = getFav();
  grid.innerHTML = list.map(f => `
    <div class="food-card" data-id="${f.id}">
      <button class="fav-btn ${favs.includes(f.id) ? 'on' : ''}" data-fav="${f.id}">
        <i class="${favs.includes(f.id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      </button>
      <div class="food-emoji">${foodImageHTML(f)}</div>
      <div class="food-name">${f.name}</div>
      <div class="food-meta">
        <i class="fa-solid fa-star"></i> ${f.rating}
        <span>•</span>
        <i class="fa-solid fa-clock"></i> ${f.time} daq
      </div>
      <div class="food-foot">
        <span class="food-price">${formatPrice(f.price)}</span>
        <button class="add-btn" data-add="${f.id}"><i class="fa-solid fa-plus"></i></button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.food-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-btn') || e.target.closest('.fav-btn')) return;
      openDetail(parseInt(card.dataset.id));
    });
  });
  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(parseInt(btn.dataset.add), 1); });
  });
  grid.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(parseInt(btn.dataset.fav)); });
  });
}

function toggleFav(id) {
  let favs = getFav();
  if (favs.includes(id)) favs = favs.filter(x => x !== id);
  else favs.push(id);
  setFav(favs);
  renderFoods();
  if ($('page-favorites').classList.contains('active')) renderFavorites();
  updateProfile();
}

// ========== FAVORITES PAGE ==========
$('favoritesBtn').addEventListener('click', () => navigateTo('favorites'));
function renderFavorites() {
  const favs = getFav();
  const foods = DB.get('tb_foods', []).filter(f => favs.includes(f.id) && f.active !== false);
  const grid = $('favGrid');
  if (foods.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-sub)"><i class="fa-regular fa-heart" style="font-size:60px;opacity:.2"></i><h3 style="margin-top:14px">Sevimlilar yo\'q</h3><p style="margin-top:6px">Yoqtirgan taomlaringizni yurakcha bilan belgilang</p></div>';
    return;
  }
  grid.innerHTML = foods.map(f => `
    <div class="food-card" data-id="${f.id}">
      <button class="fav-btn on" data-fav="${f.id}"><i class="fa-solid fa-heart"></i></button>
      <div class="food-emoji">${foodImageHTML(f)}</div>
      <div class="food-name">${f.name}</div>
      <div class="food-meta">
        <i class="fa-solid fa-star"></i> ${f.rating}
        <span>•</span>
        <i class="fa-solid fa-clock"></i> ${f.time} daq
      </div>
      <div class="food-foot">
        <span class="food-price">${formatPrice(f.price)}</span>
        <button class="add-btn" data-add="${f.id}"><i class="fa-solid fa-plus"></i></button>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.fav-btn').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(parseInt(b.dataset.fav)); }));
  grid.querySelectorAll('.add-btn').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); addToCart(parseInt(b.dataset.add), 1); }));
  grid.querySelectorAll('.food-card').forEach(c => c.addEventListener('click', (e) => {
    if (e.target.closest('.add-btn') || e.target.closest('.fav-btn')) return;
    openDetail(parseInt(c.dataset.id));
  }));
}

// ========== DETAIL MODAL ==========
const detailModal = $('detailModal');
function openDetail(id) {
  const foods = DB.get('tb_foods', []);
  const f = foods.find(x => x.id === id);
  if (!f) return;
  currentFood = f;
  qty = 1;
  $('dImg').innerHTML = foodImageHTML(f);
  $('dName').textContent = f.name;
  $('dDesc').textContent = f.desc;
  $('dPrice').textContent = formatPrice(f.price);
  $('qVal').textContent = qty;
  detailModal.classList.add('show');
}
$('closeDetail').addEventListener('click', () => detailModal.classList.remove('show'));
$('qMinus').addEventListener('click', () => {
  if (qty > 1) { qty--; $('qVal').textContent = qty; updateDPrice(); }
});
$('qPlus').addEventListener('click', () => { qty++; $('qVal').textContent = qty; updateDPrice(); });
function updateDPrice() { if (currentFood) $('dPrice').textContent = formatPrice(currentFood.price * qty); }
$('addToCart').addEventListener('click', () => {
  if (currentFood) { addToCart(currentFood.id, qty); detailModal.classList.remove('show'); }
});

// ========== CART ==========
function addToCart(id, q) {
  const exist = cart.find(c => c.id === id);
  if (exist) exist.qty += q;
  else cart.push({ id, qty: q });
  saveCart();
  showToast('Savatga qo\'shildi 🛒');
}
function saveCart() { DB.set('tb_cart', cart); updateCartBadge(); }
function updateCartBadge() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const b = $('cartBadge');
  if (total > 0) { b.style.display = 'flex'; b.textContent = total; } else b.style.display = 'none';
}
function renderCart() {
  const list = $('cartList');
  const summary = $('cartSummary');
  if (cart.length === 0) {
    list.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-bag-shopping"></i><h3>Savat bo'sh</h3><p>Mahsulot tanlang va savatga qo'shing</p></div>`;
    summary.classList.remove('show'); return;
  }
  summary.classList.add('show');
  const foods = DB.get('tb_foods', []);
  list.innerHTML = cart.map(c => {
    const f = foods.find(x => x.id === c.id);
    if (!f) return '';
    return `
      <div class="cart-item">
        <div class="cart-emoji">${foodImageHTML(f)}</div>
        <div class="cart-info"><h4>${f.name}</h4><p>${formatPrice(f.price * c.qty)}</p></div>
        <div class="cart-qty">
          <button data-minus="${c.id}">−</button>
          <span>${c.qty}</span>
          <button data-plus="${c.id}">+</button>
        </div>
      </div>`;
  }).join('');
  list.querySelectorAll('[data-minus]').forEach(b => b.addEventListener('click', () => {
    const it = cart.find(c => c.id === parseInt(b.dataset.minus));
    if (it.qty > 1) it.qty--; else cart = cart.filter(c => c.id !== it.id);
    saveCart(); renderCart();
  }));
  list.querySelectorAll('[data-plus]').forEach(b => b.addEventListener('click', () => {
    const it = cart.find(c => c.id === parseInt(b.dataset.plus));
    it.qty++; saveCart(); renderCart();
  }));
  const settings = DB.get('tb_settings', {});
  const deliveryFee = settings.deliveryFee || 15000;
  const items = cart.reduce((s, c) => {
    const f = foods.find(x => x.id === c.id);
    return s + (f ? f.price * c.qty : 0);
  }, 0);
  $('sumItems').textContent = formatPrice(items);
  $('sumTotal').textContent = formatPrice(items + deliveryFee);
}

// ========== CHECKOUT ==========
$('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0 || !currentUser) return;
  const addrs = getAddrs();
  if (addrs.length === 0) {
    showToast('Avval manzil qo\'shing');
    $('addressModal').classList.add('show');
    renderAddresses();
    return;
  }
  const foods = DB.get('tb_foods', []);
  const settings = DB.get('tb_settings', {});
  const deliveryFee = settings.deliveryFee || 15000;
  const items = cart.map(c => {
    const f = foods.find(x => x.id === c.id);
    return { foodId: c.id, name: f.name, emoji: f.emoji, image: f.image, qty: c.qty, price: f.price };
  });
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
  const order = {
    id: 'TB-' + (1000 + DB.get('tb_orders', []).length + 1),
    userId: currentUser.id,
    userName: defaultAddr.fullName || currentUser.name,
    userPhone: defaultAddr.phone || currentUser.phone,
    items, itemsText: items.map(i => `${i.name} × ${i.qty}`).join(', '),
    subtotal, deliveryFee, total: subtotal + deliveryFee,
    address: defaultAddr.address,
    status: 'new',
    createdAt: new Date().toISOString(),
    time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  };
  const orders = DB.get('tb_orders', []);
  orders.unshift(order);
  DB.set('tb_orders', orders);
  const users = DB.get('tb_users', []);
  const u = users.find(x => x.id === currentUser.id);
  if (u) { u.orders = (u.orders || 0) + 1; DB.set('tb_users', users); }
  cart = []; saveCart(); renderCart();
  addNotification('order', 'Buyurtma qabul qilindi', `#${order.id} raqamli buyurtmangiz tasdiqlandi`);
  showToast('Buyurtma qabul qilindi ✅ #' + order.id);

  // === BOT'GA YUBORISH === Mahsulot bilan birga manzil/tel ham
  sendOrderToBot({
    ...order,
    phone: order.userPhone || currentUser.phone,
    address: defaultAddr.address
  });

  navigateTo('orders');
});

/* ===== Telegram bot'ga buyurtmani yuborish (do'kon boti orqali) ===== */
function sendOrderToBot(order) {
  try {
    const cfg = DB.get('tb_bot_config', null);
    if (!cfg || !cfg.token) return; // bot hali ulanmagan
    const SHOP_KEY = (CLIENT_ID || 'demo') + '__fastfood';
    const BOT_HTTP = (function () {
      const configured = DB.get('tb_bot_api', '') || localStorage.getItem('bo_bot_api') || window.BOT_HTTP_URL || '';
      if (configured) return configured.replace(/\/+$/, '');
      return /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname) ? 'http://localhost:3344' : '';
    })();
    if (!BOT_HTTP) { console.warn('[bot] Bot server manzili sozlanmagan — avval Bot sozlamalaridan server manzilini saqlang'); return; }
    fetch(`${BOT_HTTP}/store-bot/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: SHOP_KEY, order })
    }).then(r => r.json().catch(() => ({ ok: false }))).then(res => {
      if (res && res.ok) {
        console.log('[bot] ✅ Buyurtma kanalga yuborildi:', order.id);
        try { const c = DB.get('tb_bot_config', {}); c.sentCount = res.sentCount || (c.sentCount || 0) + 1; DB.set('tb_bot_config', c); } catch {}
      } else {
        console.warn('[bot] yuborilmadi:', res && res.error);
      }
    }).catch(err => {
      console.warn('[bot] HTTP xato:', err.message, '— bot.py ishlamayapti (cd bot && python3 bot.py)');
    });
  } catch (err) {
    console.error('[bot] sendOrderToBot error:', err);
  }
}

// ========== ORDERS ==========
document.querySelectorAll('.order-tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.order-tab').forEach(b => b.classList.remove('active'));
    t.classList.add('active');
    renderOrders(t.dataset.otab);
  });
});
function renderOrders(tab) {
  const list = $('orderList');
  if (!currentUser) { list.innerHTML = ''; return; }
  const all = DB.get('tb_orders', []).filter(o => o.userId === currentUser.id);
  const map = { active: ['new', 'preparing', 'delivery'], done: ['completed'], cancel: ['cancelled'] };
  const data = all.filter(o => map[tab].includes(o.status));
  if (data.length === 0) {
    list.innerHTML = '<div class="cart-empty"><i class="fa-solid fa-receipt"></i><h3>Buyurtma yo\'q</h3><p>Bu yerda buyurtmalar ko\'rinadi</p></div>';
    return;
  }
  const cls = { new: 'active', preparing: 'active', delivery: 'active', completed: 'done', cancelled: 'cancel' };
  const txt = { new: 'Yangi', preparing: 'Tayyorlanmoqda', delivery: "Yo'lda", completed: 'Yakunlangan', cancelled: 'Bekor qilindi' };
  list.innerHTML = data.map(o => `
    <div class="order-card">
      <div class="oc-head">
        <h4>#${o.id}</h4>
        <span class="oc-status ${cls[o.status]}">${txt[o.status]}</span>
      </div>
      <div class="oc-items">${o.itemsText}</div>
      <div class="oc-foot">
        <b>${formatPrice(o.total)}</b>
        <button>${new Date(o.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</button>
      </div>
    </div>
  `).join('');
}

// ========== THEME ==========
const themeToggle = $('themeToggle');
if (localStorage.getItem('theme') === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); themeToggle.checked = true; }
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); showToast('Tungi rejim 🌙'); }
  else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); showToast('Kunduzgi rejim ☀️'); }
});

// ========== MODAL HELPERS ==========
function openModal(id) { $(id).classList.add('show'); }
function closeModal(id) { $(id).classList.remove('show'); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
document.querySelectorAll('.mini-modal, .detail-modal').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('show'); });
});

// ========== ADDRESS CRUD ==========
$('addressBtn').addEventListener('click', () => { renderAddresses(); openModal('addressModal'); });
$('newAddressBtn').addEventListener('click', () => openAddressForm(null));

function renderAddresses() {
  const list = $('addressList');
  const addrs = getAddrs();
  if (addrs.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:30px 10px;color:var(--text-sub)"><i class="fa-solid fa-location-dot" style="font-size:40px;opacity:.25"></i><p style="margin-top:10px;font-size:13px">Manzillar yo\'q</p></div>';
    return;
  }
  list.innerHTML = addrs.map(a => `
    <div class="address-item ${a.isDefault ? 'default' : ''}">
      ${a.isDefault ? '<span class="default-badge">ASOSIY</span>' : ''}
      <div class="addr-ic"><i class="fa-solid fa-location-dot"></i></div>
      <div class="addr-info"><h4>${a.label}</h4><p>${a.address}${a.note ? ' • ' + a.note : ''}</p>${a.fullName ? `<p>${a.fullName}${a.phone ? ' · ' + a.phone : ''}</p>` : ''}</div>
      <div class="item-acts">
        ${!a.isDefault ? `<button data-default="${a.id}" title="Asosiy"><i class="fa-solid fa-star"></i></button>` : ''}
        <button data-eaddr="${a.id}" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
        <button class="del" data-daddr="${a.id}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('[data-default]').forEach(b => b.addEventListener('click', () => {
    const all = getAddrs(); all.forEach(x => x.isDefault = x.id === parseInt(b.dataset.default));
    setAddrs(all); renderAddresses();
  }));
  list.querySelectorAll('[data-eaddr]').forEach(b => b.addEventListener('click', () => openAddressForm(parseInt(b.dataset.eaddr))));
  list.querySelectorAll('[data-daddr]').forEach(b => b.addEventListener('click', () => {
    setAddrs(getAddrs().filter(x => x.id !== parseInt(b.dataset.daddr)));
    renderAddresses();
    showToast('Manzil o\'chirildi');
  }));
}

function openAddressForm(id) {
  $('addressForm').reset();
  $('addrId').value = '';
  // Umumiy UzAddress kaskadini har ochilishda qaytadan joylashtiramiz (edit-rejim toza reset bo'lsin)
  $('addrCascade').innerHTML = UzAddress.formHTML({ idPrefix: 'na', inputClass: '', selectClass: '', labelClass: '' });
  UzAddress.bind(document, { idPrefix: 'na' });
  if (id) {
    const a = getAddrs().find(x => x.id === id);
    if (!a) return;
    $('addrFormTitle').textContent = 'Manzilni tahrirlash';
    $('addrId').value = a.id;
    $('addrFullName').value = a.fullName || '';
    $('addrPhone').value = a.phone || '';
    // Saqlangan tarkibiy maydonlardan kaskadni to'ldiramiz
    if (a.region) {
      $('na-region').value = a.region;
      // bind() faqat change'da tumanlarni to'ldiradi — edit uchun qo'lda to'ldiramiz
      const ds = UzAddress.districts(a.region);
      if (ds.length) {
        $('na-district').innerHTML = ['<option value="">Tumanni tanlang</option>']
          .concat(ds.map(d => `<option value="${d}">${d}</option>`)).join('');
        $('na-district').disabled = false;
        if (a.district) $('na-district').value = a.district;
      }
    }
    if (a.village) $('na-village').value = a.village;
    if (a.house) $('na-house').value = a.house;
    if (a.note) $('na-note').value = a.note;
  } else {
    $('addrFormTitle').textContent = 'Yangi manzil';
    $('addrFullName').value = (currentUser && currentUser.name) || '';
    $('addrPhone').value = (currentUser && currentUser.phone) || '+998 ';
  }
  openModal('addressFormModal');
}

$('addressForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = parseInt($('addrId').value);
  const fullName = $('addrFullName').value.trim();
  const phone = $('addrPhone').value.trim();
  // Umumiy UzAddress kaskadidan to'liq manzilni o'qiymiz (majburiy: viloyat, tuman, uy)
  const addr = UzAddress.read(document, { idPrefix: 'na' });
  if (!fullName || !phone || !addr) {
    showToast('Ism familiya, telefon, viloyat, tuman va uy raqamini to\'ldiring');
    return;
  }
  if (phone.replace(/\D/g, '').length < 9) {
    showToast('Telefon raqam noto\'g\'ri');
    return;
  }
  let addrs = getAddrs();
  const data = {
    label: id ? addrs.find(a => a.id === id).label : `Manzil ${addrs.length + 1}`,
    fullName, phone,
    address: addr.text,   // checkout/renderAddresses `address` ni o'qiydi — shu nom saqlanadi
    note: addr.note,
    region: addr.region,
    district: addr.district,
    village: addr.village,
    house: addr.house
  };
  if (id) {
    const i = addrs.findIndex(a => a.id === id);
    addrs[i] = { ...addrs[i], ...data };
  } else {
    data.id = Date.now();
    data.isDefault = addrs.length === 0;
    addrs.push(data);
  }
  setAddrs(addrs);
  upsertCustomerFromAddress(fullName, phone);
  closeModal('addressFormModal');
  renderAddresses();
  showToast('Manzil saqlandi');
});

// Manzil saqlanganda mijozni admin panelning "Foydalanuvchilar" ro'yxatiga
// (Cloud-sync qilinadigan tb_users) qo'shadi/yangilaydi — telefon bo'yicha dedupe.
function upsertCustomerFromAddress(fullName, phone) {
  const users = DB.get('tb_users', []);
  const norm = (p) => (p || '').replace(/\D/g, '');
  const phoneNorm = norm(phone);
  const existing = users.find(u => norm(u.phone) === phoneNorm);
  if (existing) {
    existing.name = fullName || existing.name;
    existing.phone = phone;
  } else {
    users.push({
      id: Date.now(),
      name: fullName,
      email: '',
      phone,
      orders: 0,
      status: 'new',
      joinDate: new Date().toISOString(),
      password: ''
    });
  }
  DB.set('tb_users', users);
}

// ========== PAYMENT METHODS ==========
// Faqat naqd pul faol — karta/Click/Payme "tez orada". Modal statik (renderPayments shart emas).
$('paymentBtn').addEventListener('click', () => openModal('paymentModal'));
$('newPaymentBtn')?.addEventListener('click', () => openPaymentForm());

function renderPayments() {
  const list = $('paymentList');
  if (!list) return;
  const pays = getPays();
  if (pays.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:30px 10px;color:var(--text-sub)"><i class="fa-solid fa-credit-card" style="font-size:40px;opacity:.25"></i><p style="margin-top:10px;font-size:13px">Kartalar yo\'q</p></div>';
    return;
  }
  const icons = { uzcard: 'fa-credit-card', humo: 'fa-credit-card', visa: 'fa-cc-visa', mastercard: 'fa-cc-mastercard' };
  list.innerHTML = pays.map(p => `
    <div class="pay-item ${p.isDefault ? 'default' : ''}">
      ${p.isDefault ? '<span class="default-badge">ASOSIY</span>' : ''}
      <div class="pay-ic"><i class="fa-solid ${icons[p.type] || 'fa-credit-card'}"></i></div>
      <div class="pay-info"><h4>${p.type.toUpperCase()} •••• ${p.number.slice(-4)}</h4><p>${p.holder} • ${p.expiry}</p></div>
      <div class="item-acts">
        ${!p.isDefault ? `<button data-pdef="${p.id}"><i class="fa-solid fa-star"></i></button>` : ''}
        <button class="del" data-dpay="${p.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('[data-pdef]').forEach(b => b.addEventListener('click', () => {
    const all = getPays(); all.forEach(x => x.isDefault = x.id === parseInt(b.dataset.pdef));
    setPays(all); renderPayments();
  }));
  list.querySelectorAll('[data-dpay]').forEach(b => b.addEventListener('click', () => {
    setPays(getPays().filter(x => x.id !== parseInt(b.dataset.dpay)));
    renderPayments();
  }));
}

function openPaymentForm() {
  $('paymentForm').reset();
  openModal('paymentFormModal');
}

$('paymentForm').addEventListener('submit', (e) => {
  e.preventDefault();
  let pays = getPays();
  const data = {
    id: Date.now(),
    type: $('payType').value,
    number: $('payNumber').value.replace(/\s/g, ''),
    holder: $('payHolder').value.trim().toUpperCase(),
    expiry: $('payExpiry').value,
    isDefault: pays.length === 0
  };
  pays.push(data);
  setPays(pays);
  closeModal('paymentFormModal');
  renderPayments();
  showToast('Karta qo\'shildi');
});

// Card number formatter
$('payNumber').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
});
$('payExpiry').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
  e.target.value = v;
});

// ========== PROFILE EDIT ==========
$('editProfileBtn').addEventListener('click', () => {
  $('peName').value = currentUser.name;
  $('peEmail').value = currentUser.email;
  $('pePhone').value = currentUser.phone || '';
  openModal('profileEditModal');
});

$('profileEditForm').addEventListener('submit', (e) => {
  e.preventDefault();
  currentUser.name = $('peName').value.trim();
  currentUser.email = $('peEmail').value.trim();
  currentUser.phone = $('pePhone').value.trim();
  DB.set('tb_current_user', currentUser);
  const users = DB.get('tb_users', []);
  const i = users.findIndex(u => u.id === currentUser.id);
  if (i >= 0) { users[i] = currentUser; DB.set('tb_users', users); }
  closeModal('profileEditModal');
  updateProfile();
  showToast('Profil yangilandi ✅');
});

// ========== PASSWORD ==========
$('privacyBtn').addEventListener('click', () => openModal('privacyModal'));
$('passForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const cur = $('curPass').value, nw = $('newPass').value, cf = $('confPass').value;
  if (cur !== currentUser.password) { showToast('Joriy parol noto\'g\'ri'); return; }
  if (nw.length < 4) { showToast('Parol kamida 4 belgi'); return; }
  if (nw !== cf) { showToast('Parollar mos kelmadi'); return; }
  currentUser.password = nw;
  DB.set('tb_current_user', currentUser);
  const users = DB.get('tb_users', []);
  const i = users.findIndex(u => u.id === currentUser.id);
  if (i >= 0) { users[i].password = nw; DB.set('tb_users', users); }
  $('passForm').reset();
  closeModal('privacyModal');
  showToast('Parol o\'zgartirildi 🔒');
});

// ========== CHAT WITH ADMIN ==========
$('chatBtn').addEventListener('click', openChat);
$('openChatFromHelp').addEventListener('click', (e) => { e.preventDefault(); closeModal('helpModal'); openChat(); });

function openChat() {
  renderChat();
  openModal('chatModal');
  // mark read
  const msgs = DB.get('tb_messages', []);
  const m = msgs.find(x => x.userId === currentUser.id);
  if (m) { m.unread = false; DB.set('tb_messages', msgs); }
}

function renderChat() {
  const msgs = DB.get('tb_messages', []);
  const m = msgs.find(x => x.userId === currentUser.id);
  const body = $('uchatBody');
  if (!m || m.messages.length === 0) {
    body.innerHTML = `<div class="chat-empty-u"><i class="fa-regular fa-comments"></i><p>Hozircha habarlar yo'q.<br>Birinchi habarni yozing.</p></div>`;
    return;
  }
  body.innerHTML = m.messages.map(b => `
    <div class="ububble ${b.from === 'user' ? 'out' : 'in'}">${b.text}<small>${b.time}</small></div>
  `).join('');
  body.scrollTop = body.scrollHeight;
}

$('uchatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const inp = $('uchatInput');
  const txt = inp.value.trim();
  if (!txt) return;
  const msgs = DB.get('tb_messages', []);
  let m = msgs.find(x => x.userId === currentUser.id);
  const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  if (!m) {
    m = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      avatar: currentUser.name[0].toUpperCase(),
      unread: true,
      messages: []
    };
    msgs.push(m);
  } else m.unread = true;
  m.messages.push({ from: 'user', text: txt, time });
  DB.set('tb_messages', msgs);
  inp.value = '';
  renderChat();
});

// ========== HELP / PROMO / FILTER ==========
$('helpBtn').addEventListener('click', () => openModal('helpModal'));
// (Reklama promo-banneri olib tashlangani uchun uning tugma ishlovchisi ham olib tashlandi)
document.querySelectorAll('.see-all').forEach(a => a.addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('[data-cat="all"]').click();
  $('foodGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

document.querySelector('.filter-btn').addEventListener('click', () => openModal('filterModal'));
document.querySelectorAll('#sortRow .filt-chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('#sortRow .filt-chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
}));
$('priceRange').addEventListener('input', (e) => {
  $('prMax').textContent = parseInt(e.target.value).toLocaleString('uz-UZ').replace(/,/g, ' ');
});
$('applyFilter').addEventListener('click', () => {
  filterState.sort = document.querySelector('#sortRow .filt-chip.active').dataset.sort;
  filterState.maxPrice = parseInt($('priceRange').value);
  closeModal('filterModal');
  renderFoods();
  showToast('Filter qo\'llandi');
});
$('resetFilter').addEventListener('click', () => {
  filterState = { sort: 'default', maxPrice: 100000 };
  $('priceRange').value = 100000;
  $('prMax').textContent = '100 000';
  document.querySelectorAll('#sortRow .filt-chip').forEach(x => x.classList.remove('active'));
  document.querySelector('[data-sort="default"]').classList.add('active');
  closeModal('filterModal');
  renderFoods();
});

// ========== TOAST ==========
let toastTimer;
function showToast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ========== HELPERS ==========
function formatPrice(n) { return (n || 0).toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm"; }

// ========== LIVE SYNC (admin → user) ==========
let lastOrderSnapshot = JSON.stringify(DB.get('tb_orders', []).filter(o => currentUser && o.userId === currentUser.id).map(o => ({ id: o.id, status: o.status })));
let lastMsgSnapshot = '';

function syncCheck() {
  if (!currentUser) return;
  // Order status changes
  const myOrders = DB.get('tb_orders', []).filter(o => o.userId === currentUser.id);
  const snap = JSON.stringify(myOrders.map(o => ({ id: o.id, status: o.status })));
  if (snap !== lastOrderSnapshot) {
    const prev = JSON.parse(lastOrderSnapshot || '[]');
    myOrders.forEach(o => {
      const p = prev.find(x => x.id === o.id);
      if (p && p.status !== o.status) {
        const titles = { preparing: 'Tayyorlanmoqda 👨‍🍳', delivery: 'Yo\'lda 🚚', completed: 'Yakunlandi ✅', cancelled: 'Bekor qilindi ❌' };
        addNotification(o.status === 'cancelled' ? 'cancel' : o.status === 'delivery' ? 'delivery' : 'order',
          `#${o.id} — ${titles[o.status] || o.status}`,
          o.status === 'delivery' ? 'Kuryer yo\'lda, tez orada yetib boradi' :
          o.status === 'completed' ? 'Buyurtmangiz yakunlandi. Rahmat!' :
          o.status === 'cancelled' ? 'Buyurtmangiz bekor qilindi' :
          'Buyurtmangiz tayyorlanmoqda');
      }
    });
    lastOrderSnapshot = snap;
    if (document.querySelector('.nav-btn[data-page="orders"]').classList.contains('active'))
      renderOrders(document.querySelector('.order-tab.active')?.dataset.otab || 'active');
    updateProfile();
  }
  // Admin replies
  const msgs = DB.get('tb_messages', []);
  const m = msgs.find(x => x.userId === currentUser.id);
  if (m) {
    const lastFromAdmin = [...m.messages].reverse().find(x => x.from === 'admin');
    const key = lastFromAdmin ? lastFromAdmin.text + lastFromAdmin.time : '';
    if (key && key !== lastMsgSnapshot) {
      if (lastMsgSnapshot) addNotification('message', 'Admin javob berdi 💬', lastFromAdmin.text.slice(0, 60));
      lastMsgSnapshot = key;
      if ($('chatModal').classList.contains('show')) renderChat();
    } else if (!lastMsgSnapshot && lastFromAdmin) {
      lastMsgSnapshot = key;
    }
  }
}
setInterval(syncCheck, 2000);

window.addEventListener('storage', (e) => {
  if (e.key === 'tb_foods') renderFoods();
  if (e.key === 'tb_orders') syncCheck();
  if (e.key === 'tb_messages') syncCheck();
});

// Cloud FONDA yangilanganda (server ma'lumoti kelgach) — UI ni yangilaymiz.
// Sahifa darrov ochiladi, so'ng eng yangi ma'lumot sokin yangilanadi.
window.addEventListener('cloud:updated', () => {
  try {
    const s = DB.get('tb_settings', {});
    if (s.restaurantName) {
      document.title = s.restaurantName + ' — Onlayn buyurtma';
      const n = document.getElementById('topbarRestaurantName'); if (n) n.textContent = s.restaurantName;
    }
    if (s.address) { const a = document.getElementById('topbarAddress'); if (a) a.textContent = s.address; }
    if (typeof renderFoods === 'function') renderFoods();
    if (currentUser && typeof syncCheck === 'function') syncCheck();
  } catch (e) { console.error('cloud:updated (app):', e); }
});

// ========== INIT ==========
checkAuth();
if (currentUser) initUserUI();
