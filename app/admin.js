// ========== CLIENT ID (URL ?client=... yoki bo_session orqali) ==========
const _urlP = new URLSearchParams(window.location.search);
const CLIENT_ID = _urlP.get('client') || (() => {
  try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; }
})() || 'demo';
const _P = CLIENT_ID + '_';

// Mijoz haqida ma'lumot (sarlavha, brend nomi uchun)
const _clientInfo = (() => {
  try {
    const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
    return subs.find(s => s.id === CLIENT_ID) || null;
  } catch { return null; }
})();

// ========== SHARED DB — har mijozga alohida prefix ==========
const DB = {
  _k(k) { return k.startsWith('tb_') ? _P + k : k; },
  get(k, fb = null) {
    try { const v = localStorage.getItem(this._k(k)); return v !== null ? JSON.parse(v) : fb; } catch { return fb; }
  },
  set(k, v) { localStorage.setItem(this._k(k), JSON.stringify(v)); },
  remove(k) { localStorage.removeItem(this._k(k)); }
};

// ========== SEED ==========
if (!DB.get('tb_admin_account')) {
  DB.set('tb_admin_account', { username: 'admin', password: 'admin123', name: 'Bosh administrator' });
}
if (!DB.get('tb_foods')) DB.set('tb_foods', []);
if (!DB.get('tb_orders')) DB.set('tb_orders', []);
if (!DB.get('tb_users')) DB.set('tb_users', []);
if (!DB.get('tb_messages')) DB.set('tb_messages', [
  { id: 1, userId: 'demo-1', userName: 'Aziza K.', avatar: 'A', unread: true,
    messages: [
      { from: 'user', text: 'Assalomu alaykum, buyurtmam qachon yetib boradi?', time: '14:25' },
      { from: 'user', text: 'Yana bir savol — to\'lovni qanday qaytarish mumkin?', time: '14:30' }
    ]
  },
  { id: 2, userId: 'demo-2', userName: 'Bobur S.', avatar: 'B', unread: true,
    messages: [ { from: 'user', text: 'Rahmat, hammasi yetib bordi!', time: '13:15' } ]
  },
  { id: 3, userId: 'demo-3', userName: 'Madina R.', avatar: 'M', unread: false,
    messages: [
      { from: 'user', text: 'Buyurtmani bekor qilmoqchiman', time: '12:00' },
      { from: 'admin', text: 'Albatta, qaysi raqamli buyurtma?', time: '12:05' }
    ]
  }
]);
if (!DB.get('tb_settings')) {
  // Mijozning o'zining biznes nomi va manzili default qiymat sifatida
  DB.set('tb_settings', {
    restaurantName: _clientInfo?.businessName || 'Mening biznesim',
    address: _clientInfo?.address ? `${_clientInfo.city || ''}, ${_clientInfo.address}`.trim().replace(/^,\s*/, '') : 'Manzilni kiriting',
    hours: '09:00 - 23:00',
    deliveryFee: 15000,
    autoAccept: false,
    soundOn: true
  });
}

// ========== INIT (login olib tashlangan — to'g'ridan-to'g'ri dashbord) ==========
const adminApp = document.getElementById('adminApp');

function showApp() {
  try {
    if (adminApp) adminApp.style.display = 'grid';
    const acc = DB.get('tb_admin_account', { name: 'Admin' });
    const nameEl = document.getElementById('adminName');
    const avEl = document.getElementById('adminAv');
    if (nameEl) nameEl.textContent = acc.name || 'Admin';
    if (avEl) avEl.textContent = (acc.name || 'A')[0].toUpperCase();

    // Sahifa sarlavhasi va sidebar brandini mijoz biznes nomi bilan brending qilish
    if (_clientInfo && _clientInfo.businessName) {
      document.title = `${_clientInfo.businessName} — Ilova boshqaruvi`;
      const brandEl = document.querySelector('.sidebar .brand span');
      if (brandEl) {
        brandEl.innerHTML = escapeBrand(_clientInfo.businessName);
      }
    }

    loadSettings();
    refreshAll();
  } catch (err) {
    console.error('showApp error:', err);
  }
}

function escapeBrand(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Script tugagandan keyin ishga tushirish — pastda e'lon qilingan
// let o'zgaruvchilar (currentFoodFilter, orderFilter, activeMsgId) TDZ xatosini bermasligi uchun.
window.addEventListener('DOMContentLoaded', () => {
  try { showApp(); } catch (err) { console.error('init error:', err); }
});

document.getElementById('adminLogoutBtn').addEventListener('click', () => {
  // BiznesOnline mijoz dashbordiga qaytish
  window.location.href = '../dashboard.html';
});

// ========== SIDEBAR NAV ==========
document.querySelectorAll('.side-link[data-section]').forEach(link => {
  link.addEventListener('click', () => goTo(link.dataset.section));
});
function goTo(section) {
  document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.side-link[data-section="${section}"]`)?.classList.add('active');
  document.querySelectorAll('.asection').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + section).classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
  if (section === 'foods') renderFoods();
  if (section === 'orders') renderOrders();
  if (section === 'users') renderUsers();
  if (section === 'messages') renderMessages();
  if (section === 'bot') renderBot();
  if (section === 'qr') renderQR();
  if (section === 'dashboard') renderDashboard();
}

document.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', (e) => {
  e.preventDefault();
  goTo(el.dataset.goto);
}));

document.getElementById('hambBtn').addEventListener('click', () =>
  document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('refreshBtn').addEventListener('click', () => {
  refreshAll();
  toast('Yangilandi', 'success');
});

// ========== DASHBOARD ==========
function renderDashboard() {
  const orders = DB.get('tb_orders', []);
  const foods = DB.get('tb_foods', []);
  const users = DB.get('tb_users', []);
  const today = new Date().toDateString();

  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const newCount = orders.filter(o => o.status === 'new').length;

  document.getElementById('statRevenue').textContent = fmt(revenue) + " so'm";
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statNewOrders').textContent = newCount;
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statFoods').textContent = foods.filter(f => f.active !== false).length;

  // Chart — sales by day of week
  const week = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
  const daySales = [0,0,0,0,0,0,0];
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    let d = new Date(o.createdAt).getDay(); // 0=Sun
    d = (d + 6) % 7; // Mon=0
    daySales[d] += o.total;
  });
  const max = Math.max(...daySales, 1);
  document.getElementById('chart').innerHTML = week.map((w, i) => {
    const h = Math.max((daySales[i] / max) * 100, 4);
    return `<div class="bar" style="--h:${h}%" title="${fmt(daySales[i])} so'm"><span>${w}</span></div>`;
  }).join('');

  // Top products
  const sold = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o =>
    o.items.forEach(it => {
      if (!sold[it.foodId]) sold[it.foodId] = { ...it, qty: 0, total: 0 };
      sold[it.foodId].qty += it.qty;
      sold[it.foodId].total += it.qty * it.price;
    })
  );
  const top = Object.values(sold).sort((a, b) => b.qty - a.qty).slice(0, 4);
  const topEl = document.getElementById('topList');
  if (top.length === 0) {
    topEl.innerHTML = '<div class="empty-state" style="padding:20px"><i class="fa-solid fa-chart-line"></i><p>Hozircha sotuvlar yo\'q</p></div>';
  } else {
    topEl.innerHTML = top.map(t => `
      <div class="top-item">
        <span>${t.emoji || '🍔'}</span>
        <div><h4>${t.name}</h4><p>${t.qty} sotildi</p></div>
        <b>${fmt(t.total)}</b>
      </div>`).join('');
  }

  // Recent orders
  const recent = orders.slice(0, 5);
  const dashOrders = document.getElementById('dashOrders');
  if (recent.length === 0) {
    dashOrders.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-receipt"></i><h3>Buyurtmalar yo\'q</h3><p>Yangi buyurtmalar bu yerda ko\'rinadi</p></div></td></tr>';
  } else {
    dashOrders.innerHTML = recent.map(o => `
      <tr>
        <td><b>#${o.id}</b></td>
        <td>${o.userName}</td>
        <td>${o.itemsText}</td>
        <td>${fmt(o.total)}</td>
        <td>${statusPill(o.status)}</td>
        <td><button class="ico" data-view-order="${o.id}"><i class="fa-solid fa-eye"></i></button></td>
      </tr>`).join('');
    dashOrders.querySelectorAll('[data-view-order]').forEach(b =>
      b.addEventListener('click', () => openOrderDetail(b.dataset.viewOrder)));
  }

  // Badges
  const msgs = DB.get('tb_messages', []);
  const unreadMsgs = msgs.filter(m => m.unread).length;
  setBadge('msgBadge', unreadMsgs);
  setBadge('newOrdersBadge', newCount);
  setBadge('notifBadge', newCount + unreadMsgs);
}

function statusPill(s) {
  const m = {
    new: ['orange', 'Yangi'],
    preparing: ['green', 'Tayyorlanmoqda'],
    delivery: ['orange', "Yo'lda"],
    completed: ['gray', 'Yakunlangan'],
    cancelled: ['red', 'Bekor qilingan']
  };
  const [cl, lb] = m[s] || ['gray', s];
  return `<span class="pill ${cl}">${lb}</span>`;
}
function setBadge(id, n) {
  const el = document.getElementById(id);
  if (!el) return;
  if (n > 0) { el.style.display = 'inline-flex'; el.textContent = n; }
  else el.style.display = 'none';
}

// ========== FOODS CRUD ==========
let currentFoodFilter = 'all';
document.getElementById('foodFilters').addEventListener('click', (e) => {
  const c = e.target.closest('.chip');
  if (!c) return;
  document.querySelectorAll('#foodFilters .chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  currentFoodFilter = c.dataset.fcat;
  renderFoods();
});

function renderFoods() {
  const foods = DB.get('tb_foods', []);
  const filtered = currentFoodFilter === 'all' ? foods : foods.filter(f => f.cat === currentFoodFilter);
  const grid = document.getElementById('afoodCards');
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-utensils"></i><h3>Mahsulot yo\'q</h3><p>"Yangi qo\'shish" tugmasini bosing</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(f => `
    <div class="afood">
      <span class="afood-status" style="background:${f.active ? 'var(--green)' : 'var(--red)'}" title="${f.active ? 'Faol' : 'Faol emas'}"></span>
      <div class="afood-emoji">${f.image ? `<img src="${f.image}" alt="${f.name}">` : f.emoji}</div>
      <h4>${f.name}</h4>
      <p class="cat">${catName(f.cat)}</p>
      <p class="price">${fmt(f.price)} so'm</p>
      <div class="afood-acts">
        <button class="edit" data-edit-food="${f.id}"><i class="fa-solid fa-pen"></i> Tahrirlash</button>
        <button class="del" data-del-food="${f.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('[data-edit-food]').forEach(b =>
    b.addEventListener('click', () => openFoodModal(parseInt(b.dataset.editFood))));
  grid.querySelectorAll('[data-del-food]').forEach(b =>
    b.addEventListener('click', () => deleteFood(parseInt(b.dataset.delFood))));
}

function catName(c) {
  return { burger: 'Burger', pizza: 'Pizza', lavash: 'Lavash', hotdog: 'Hot-Dog', fries: 'Fri', drink: 'Ichimlik', dessert: 'Desert' }[c] || c;
}

document.getElementById('addFoodBtn').addEventListener('click', () => openFoodModal(null));

function openFoodModal(id) {
  const form = document.getElementById('foodForm');
  form.reset();
  document.getElementById('foodId').value = '';
  document.getElementById('foodImageData').value = '';
  resetImgPreview();
  if (id) {
    const f = DB.get('tb_foods', []).find(x => x.id === id);
    if (!f) return;
    document.getElementById('foodModalTitle').textContent = 'Mahsulotni tahrirlash';
    document.getElementById('foodId').value = f.id;
    document.getElementById('foodName').value = f.name;
    document.getElementById('foodCat').value = f.cat;
    document.getElementById('foodEmoji').value = f.emoji;
    document.getElementById('foodPrice').value = f.price;
    document.getElementById('foodRating').value = f.rating;
    document.getElementById('foodTime').value = f.time;
    document.getElementById('foodDesc').value = f.desc;
    document.getElementById('foodActive').checked = f.active !== false;
    if (f.image) setImgPreview(f.image);
  } else {
    document.getElementById('foodModalTitle').textContent = 'Yangi mahsulot';
    document.getElementById('foodActive').checked = true;
  }
  showModal('foodModal');
}

// ========== IMAGE UPLOAD HANDLERS ==========
function setImgPreview(dataUrl) {
  const data = document.getElementById('foodImageData');
  const prev = document.getElementById('imgPreview');
  const rm = document.getElementById('removeImg');
  if (data) data.value = dataUrl;
  if (prev) prev.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
  if (rm) rm.style.display = 'inline-flex';
}
function resetImgPreview() {
  const data = document.getElementById('foodImageData');
  const prev = document.getElementById('imgPreview');
  const rm = document.getElementById('removeImg');
  const file = document.getElementById('foodImage');
  if (data) data.value = '';
  if (prev) prev.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><span>Rasm tanlang (PNG, JPG, WEBP) yoki shu yerga tashlang</span>';
  if (rm) rm.style.display = 'none';
  if (file) file.value = '';
}
function readImage(file) {
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) {
    toast('Faqat rasm fayllari', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast('Rasm hajmi 2MB dan oshmasin', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImgPreview(canvas.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        console.error('Image processing error:', err);
        toast('Rasmni qayta ishlashda xato', 'error');
      }
    };
    img.onerror = () => toast('Rasm yuklanmadi', 'error');
    img.src = e.target.result;
  };
  reader.onerror = () => toast('Faylni o\'qishda xato', 'error');
  reader.readAsDataURL(file);
}

// Attach image upload handlers safely
function initImageUpload() {
  const pickBtn = document.getElementById('pickImg');
  const prev = document.getElementById('imgPreview');
  const fileInput = document.getElementById('foodImage');
  const rmBtn = document.getElementById('removeImg');

  if (!pickBtn || !prev || !fileInput || !rmBtn) {
    console.warn('Image upload elements not found, skipping init');
    return;
  }

  // Click handlers
  pickBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
  prev.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) readImage(e.target.files[0]);
  });
  rmBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetImgPreview();
  });

  // Drag & drop
  prev.addEventListener('dragover', (e) => { e.preventDefault(); prev.classList.add('drag'); });
  prev.addEventListener('dragenter', (e) => { e.preventDefault(); prev.classList.add('drag'); });
  prev.addEventListener('dragleave', () => prev.classList.remove('drag'));
  prev.addEventListener('drop', (e) => {
    e.preventDefault();
    prev.classList.remove('drag');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0]);
  });
}
initImageUpload();

document.getElementById('foodForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const foods = DB.get('tb_foods', []);
  const id = parseInt(document.getElementById('foodId').value);
  const data = {
    name: document.getElementById('foodName').value.trim(),
    cat: document.getElementById('foodCat').value,
    emoji: document.getElementById('foodEmoji').value.trim(),
    image: document.getElementById('foodImageData').value || null,
    price: parseInt(document.getElementById('foodPrice').value),
    rating: parseFloat(document.getElementById('foodRating').value) || 4.5,
    time: parseInt(document.getElementById('foodTime').value) || 15,
    desc: document.getElementById('foodDesc').value.trim(),
    active: document.getElementById('foodActive').checked
  };
  if (id) {
    const i = foods.findIndex(f => f.id === id);
    foods[i] = { ...foods[i], ...data };
    toast('Mahsulot yangilandi', 'success');
  } else {
    data.id = foods.length ? Math.max(...foods.map(f => f.id)) + 1 : 1;
    foods.push(data);
    toast('Mahsulot qo\'shildi', 'success');
  }
  DB.set('tb_foods', foods);
  hideModal('foodModal');
  renderFoods();
  renderDashboard();
});

function deleteFood(id) {
  const f = DB.get('tb_foods', []).find(x => x.id === id);
  if (!f) return;
  confirmAction(`"${f.name}" o'chirilsinmi?`, 'Bu amalni qaytarib bo\'lmaydi.', () => {
    DB.set('tb_foods', DB.get('tb_foods', []).filter(x => x.id !== id));
    renderFoods();
    renderDashboard();
    toast('O\'chirildi', 'success');
  });
}

// ========== ORDERS CRUD ==========
let orderFilter = 'all';
document.querySelectorAll('#sec-orders .filter-row .chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('#sec-orders .filter-row .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    orderFilter = c.dataset.ostat;
    renderOrders();
  });
});

function renderOrders() {
  const orders = DB.get('tb_orders', []);
  const filtered = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const tbody = document.getElementById('ordersTbody');

  // stats
  const stats = [
    ['Jami', orders.length],
    ['Yangi', orders.filter(o => o.status === 'new').length],
    ['Jarayonda', orders.filter(o => ['preparing', 'delivery'].includes(o.status)).length],
    ['Yakunlangan', orders.filter(o => o.status === 'completed').length]
  ];
  document.getElementById('orderStats').innerHTML = stats.map(([l, v]) =>
    `<div class="mini"><span>${l}</span><b>${v}</b></div>`).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-receipt"></i><h3>Buyurtma yo\'q</h3><p>Bu kategoriyada hozircha buyurtmalar yo\'q</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><b>#${o.id}</b></td>
      <td>${o.userName}</td>
      <td>${o.itemsText}</td>
      <td>${o.address || '—'}</td>
      <td>${fmt(o.total)}</td>
      <td>${o.time}</td>
      <td>${statusPill(o.status)}</td>
      <td>
        <button class="ico" data-view-order="${o.id}" title="Ko'rish"><i class="fa-solid fa-eye"></i></button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-view-order]').forEach(b =>
    b.addEventListener('click', () => openOrderDetail(b.dataset.viewOrder)));
}

function openOrderDetail(id) {
  const o = DB.get('tb_orders', []).find(x => x.id === id);
  if (!o) return;
  document.getElementById('orderModalTitle').textContent = 'Buyurtma #' + o.id;
  const date = new Date(o.createdAt).toLocaleString('uz-UZ');
  document.getElementById('orderDetail').innerHTML = `
    <div class="od-head">
      <div>
        <h4>${o.userName}</h4>
        <p>${o.userPhone || '—'} • ${date}</p>
      </div>
      ${statusPill(o.status)}
    </div>
    <div class="od-info">
      <div class="item"><span>Manzil</span><b>${o.address || '—'}</b></div>
      <div class="item"><span>Vaqt</span><b>${o.time}</b></div>
    </div>
    <div class="od-items">
      <h5>Mahsulotlar</h5>
      ${o.items.map(it => `
        <div class="od-item">
          <span class="em">${it.emoji || '🍔'}</span>
          <div class="nm"><h6>${it.name}</h6><p>${fmt(it.price)} × ${it.qty}</p></div>
          <span class="pr">${fmt(it.price * it.qty)}</span>
        </div>
      `).join('')}
    </div>
    <div class="od-total">
      <div class="row"><span>Mahsulotlar</span><b>${fmt(o.subtotal)} so'm</b></div>
      <div class="row"><span>Yetkazib berish</span><b>${fmt(o.deliveryFee)} so'm</b></div>
      <div class="row tot"><span>Jami</span><b>${fmt(o.total)} so'm</b></div>
    </div>
    <div class="od-status-row">
      ${o.status === 'new' ? `<button class="od-status-btn" data-st="preparing">Tayyorlashga olish</button>` : ''}
      ${o.status === 'preparing' ? `<button class="od-status-btn" data-st="delivery">Yo'lga jo'natish</button>` : ''}
      ${o.status === 'delivery' ? `<button class="od-status-btn" data-st="completed">Yakunlash</button>` : ''}
      ${['new', 'preparing'].includes(o.status) ? `<button class="od-status-btn cancel" data-st="cancelled">Bekor qilish</button>` : ''}
    </div>
  `;
  document.querySelectorAll('[data-st]').forEach(b =>
    b.addEventListener('click', () => updateOrderStatus(o.id, b.dataset.st)));
  showModal('orderModal');
}

function updateOrderStatus(id, status) {
  const orders = DB.get('tb_orders', []);
  const o = orders.find(x => x.id === id);
  if (!o) return;
  o.status = status;
  DB.set('tb_orders', orders);
  hideModal('orderModal');
  renderOrders();
  renderDashboard();
  toast('Holat yangilandi', 'success');
}

document.getElementById('clearOrdersBtn').addEventListener('click', () => {
  confirmAction('Barcha buyurtmalar o\'chirilsinmi?', 'Bu amalni qaytarib bo\'lmaydi.', () => {
    DB.set('tb_orders', []);
    renderOrders();
    renderDashboard();
    toast('Tozalandi', 'success');
  });
});

// ========== USERS CRUD ==========
function renderUsers() {
  const users = DB.get('tb_users', []);
  document.getElementById('userStats').innerHTML = `
    <div class="mini"><span>Jami</span><b>${users.length}</b></div>
    <div class="mini"><span>Faol</span><b>${users.filter(u => u.status === 'active').length}</b></div>
    <div class="mini"><span>VIP</span><b>${users.filter(u => u.status === 'vip').length}</b></div>
    <div class="mini"><span>Bloklangan</span><b>${users.filter(u => u.status === 'blocked').length}</b></div>
  `;

  const tbody = document.getElementById('usersTbody');
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-users"></i><h3>Foydalanuvchilar yo\'q</h3><p>Tizimda hozircha foydalanuvchilar mavjud emas</p></div></td></tr>';
    return;
  }
  const statusMap = {
    active: '<span class="pill green">Faol</span>',
    vip: '<span class="pill orange">VIP</span>',
    new: '<span class="pill gray">Yangi</span>',
    blocked: '<span class="pill red">Bloklangan</span>'
  };
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="aav" style="width:34px;height:34px;font-size:13px">${(u.name || 'U')[0].toUpperCase()}</div>
          <b>${u.name}</b>
        </div>
      </td>
      <td>${u.email}</td>
      <td>${u.phone || '—'}</td>
      <td>${u.orders || 0}</td>
      <td>${statusMap[u.status] || statusMap.active}</td>
      <td>
        <button class="ico" data-edit-user="${u.id}" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
        <button class="ico" data-block-user="${u.id}" title="${u.status === 'blocked' ? 'Tiklash' : 'Bloklash'}">
          <i class="fa-solid ${u.status === 'blocked' ? 'fa-unlock' : 'fa-ban'}"></i>
        </button>
        <button class="ico" data-del-user="${u.id}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-edit-user]').forEach(b =>
    b.addEventListener('click', () => openUserModal(parseInt(b.dataset.editUser))));
  tbody.querySelectorAll('[data-block-user]').forEach(b =>
    b.addEventListener('click', () => toggleBlockUser(parseInt(b.dataset.blockUser))));
  tbody.querySelectorAll('[data-del-user]').forEach(b =>
    b.addEventListener('click', () => deleteUser(parseInt(b.dataset.delUser))));
}

document.getElementById('addUserBtn').addEventListener('click', () => openUserModal(null));

function openUserModal(id) {
  const form = document.getElementById('userForm');
  form.reset();
  document.getElementById('userIdH').value = '';
  if (id) {
    const u = DB.get('tb_users', []).find(x => x.id === id);
    if (!u) return;
    document.getElementById('userModalTitle').textContent = 'Foydalanuvchini tahrirlash';
    document.getElementById('userIdH').value = u.id;
    document.getElementById('userName').value = u.name;
    document.getElementById('userEmail').value = u.email;
    document.getElementById('userPhone').value = u.phone || '';
    document.getElementById('userPassword').value = u.password || '';
    document.getElementById('userStatus').value = u.status || 'active';
  } else {
    document.getElementById('userModalTitle').textContent = 'Yangi foydalanuvchi';
  }
  showModal('userModal');
}

document.getElementById('userForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const users = DB.get('tb_users', []);
  const id = parseInt(document.getElementById('userIdH').value);
  const data = {
    name: document.getElementById('userName').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    phone: document.getElementById('userPhone').value.trim(),
    password: document.getElementById('userPassword').value,
    status: document.getElementById('userStatus').value
  };
  if (id) {
    const i = users.findIndex(u => u.id === id);
    users[i] = { ...users[i], ...data };
    toast('Foydalanuvchi yangilandi', 'success');
  } else {
    data.id = Date.now();
    data.orders = 0;
    data.joinDate = new Date().toISOString();
    users.push(data);
    toast('Foydalanuvchi qo\'shildi', 'success');
  }
  DB.set('tb_users', users);
  hideModal('userModal');
  renderUsers();
  renderDashboard();
});

function toggleBlockUser(id) {
  const users = DB.get('tb_users', []);
  const u = users.find(x => x.id === id);
  if (!u) return;
  u.status = u.status === 'blocked' ? 'active' : 'blocked';
  DB.set('tb_users', users);
  renderUsers();
  toast(u.status === 'blocked' ? 'Bloklandi' : 'Tiklandi', 'success');
}

function deleteUser(id) {
  const u = DB.get('tb_users', []).find(x => x.id === id);
  if (!u) return;
  confirmAction(`"${u.name}" o'chirilsinmi?`, 'Foydalanuvchi tizimdan butunlay o\'chiriladi.', () => {
    DB.set('tb_users', DB.get('tb_users', []).filter(x => x.id !== id));
    renderUsers();
    renderDashboard();
    toast('O\'chirildi', 'success');
  });
}

// ========== MESSAGES ==========
let activeMsgId = null;

function renderMessages() {
  const msgs = DB.get('tb_messages', []);
  const list = document.getElementById('msgList');
  if (msgs.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-comments"></i><p>Hozircha habarlar yo\'q</p></div>';
    return;
  }
  list.innerHTML = msgs.map(m => {
    const last = m.messages[m.messages.length - 1];
    return `
      <div class="msg-item ${m.id === activeMsgId ? 'active' : ''}" data-msg="${m.id}">
        <div class="aav ${m.id % 2 === 0 ? 'green' : ''}">${m.avatar || m.userName[0]}</div>
        <div>
          <h4>${m.userName} <small>${last?.time || ''}</small></h4>
          <p>${last?.text || ''}</p>
        </div>
        ${m.unread ? '<span class="unread-dot"></span>' : ''}
      </div>`;
  }).join('');
  list.querySelectorAll('[data-msg]').forEach(el => el.addEventListener('click', () => openChat(parseInt(el.dataset.msg))));
}

function openChat(id) {
  const msgs = DB.get('tb_messages', []);
  const m = msgs.find(x => x.id === id);
  if (!m) return;
  m.unread = false;
  activeMsgId = id;
  DB.set('tb_messages', msgs);
  renderMessages();
  renderDashboard();

  const chat = document.getElementById('msgChat');
  chat.innerHTML = `
    <div class="chat-head">
      <div class="aav green">${m.avatar || m.userName[0]}</div>
      <div>
        <h4>${m.userName}</h4>
        <span class="online">Onlayn</span>
      </div>
      <button class="acirc"><i class="fa-solid fa-phone"></i></button>
    </div>
    <div class="chat-body" id="chatBody">
      ${m.messages.map(b => `<div class="bubble ${b.from === 'admin' ? 'out' : 'in'}">${b.text}</div>`).join('')}
    </div>
    <form class="chat-input" id="chatForm">
      <input type="text" id="chatInput" placeholder="Habar yozing..." autocomplete="off" required />
      <button type="submit"><i class="fa-solid fa-paper-plane"></i></button>
    </form>
  `;
  document.getElementById('chatBody').scrollTop = 9999;
  document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if (!txt) return;
    const all = DB.get('tb_messages', []);
    const mm = all.find(x => x.id === id);
    mm.messages.push({ from: 'admin', text: txt, time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) });
    DB.set('tb_messages', all);
    inp.value = '';
    openChat(id);
  });
}

// ========== SETTINGS ==========
function loadSettings() {
  try {
    const s = DB.get('tb_settings', {});
    const a = DB.get('tb_admin_account', {});
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v; };
    setVal('setAdminName', a.name || '');
    setVal('setAdminUser', a.username || '');
    setVal('setRestName', s.restaurantName || '');
    setVal('setRestAddr', s.address || '');
    setVal('setRestHours', s.hours || '');
    setVal('setDelivery', s.deliveryFee || 0);
    setChk('autoAccept', !!s.autoAccept);
    setChk('soundOn', s.soundOn !== false);

    if (localStorage.getItem('adminTheme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setChk('adminTheme', true);
    }
  } catch (err) { console.error('loadSettings error:', err); }
}

document.getElementById('saveAdminProfile').addEventListener('click', () => {
  const a = DB.get('tb_admin_account', {});
  a.name = document.getElementById('setAdminName').value.trim();
  a.username = document.getElementById('setAdminUser').value.trim();
  DB.set('tb_admin_account', a);
  document.getElementById('adminName').textContent = a.name;
  document.getElementById('adminAv').textContent = a.name[0]?.toUpperCase() || 'A';
  toast('Profil saqlandi', 'success');
});

document.getElementById('saveRest').addEventListener('click', () => {
  const s = DB.get('tb_settings', {});
  s.restaurantName = document.getElementById('setRestName').value.trim();
  s.address = document.getElementById('setRestAddr').value.trim();
  s.hours = document.getElementById('setRestHours').value.trim();
  s.deliveryFee = parseInt(document.getElementById('setDelivery').value) || 0;
  DB.set('tb_settings', s);
  toast('Sozlamalar saqlandi', 'success');
});

document.getElementById('autoAccept').addEventListener('change', (e) => {
  const s = DB.get('tb_settings', {});
  s.autoAccept = e.target.checked;
  DB.set('tb_settings', s);
});
document.getElementById('soundOn').addEventListener('change', (e) => {
  const s = DB.get('tb_settings', {});
  s.soundOn = e.target.checked;
  DB.set('tb_settings', s);
});

document.getElementById('changePass').addEventListener('click', () => {
  const cur = document.getElementById('curPass').value;
  const nw = document.getElementById('newPass').value;
  const a = DB.get('tb_admin_account', {});
  if (cur !== a.password) { toast('Joriy parol noto\'g\'ri', 'error'); return; }
  if (nw.length < 4) { toast('Yangi parol kamida 4 belgi', 'error'); return; }
  a.password = nw;
  DB.set('tb_admin_account', a);
  document.getElementById('curPass').value = '';
  document.getElementById('newPass').value = '';
  toast('Parol o\'zgartirildi', 'success');
});

document.getElementById('adminTheme').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('adminTheme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('adminTheme', 'light');
  }
});

document.getElementById('resetData').addEventListener('click', () => {
  confirmAction('Barcha ma\'lumotlarni tiklash?', 'Mahsulotlar, buyurtmalar, foydalanuvchilar va habarlar o\'chiriladi.', () => {
    ['tb_foods','tb_orders','tb_users','tb_messages','tb_cart','tb_current_user'].forEach(k => DB.remove(k));
    location.reload();
  });
});

// ========== EXPORT ==========
document.getElementById('exportBtn').addEventListener('click', () => {
  const data = {
    foods: DB.get('tb_foods', []),
    orders: DB.get('tb_orders', []),
    users: DB.get('tb_users', []),
    settings: DB.get('tb_settings', {}),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tastybite-export-${Date.now()}.json`;
  a.click();
  toast('Ma\'lumotlar yuklab olindi', 'success');
});

// ========== MODALS HELPERS ==========
function showModal(id) { document.getElementById(id).classList.add('show'); }
function hideModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => hideModal(b.dataset.close)));
document.querySelectorAll('.amodal').forEach(m => m.addEventListener('click', (e) => {
  if (e.target === m) m.classList.remove('show');
}));

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

// ========== GLOBAL SEARCH ==========
const globalSearchEl = document.getElementById('globalSearch');
if (globalSearchEl) {
  globalSearchEl.addEventListener('input', (e) => {
    try {
      const q = e.target.value.toLowerCase();
      const activeSection = document.querySelector('.side-link.active')?.dataset.section;
      if (!q) { if (activeSection) goTo(activeSection); return; }
      document.querySelectorAll('.atable tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      document.querySelectorAll('.afood').forEach(c => {
        c.style.display = c.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    } catch (err) { console.error('search error:', err); }
  });
}

// ========== TOAST ==========
let toastTimer;
function toast(msg, type = '') {
  const t = document.getElementById('atoast');
  t.textContent = msg;
  t.className = 'atoast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'atoast', 2400);
}

// ========== HELPERS ==========
function fmt(n) { return (n || 0).toLocaleString('uz-UZ').replace(/,/g, ' '); }

function refreshAll() {
  try { renderDashboard(); } catch (e) { console.error('renderDashboard error:', e); }
  try { renderFoods(); } catch (e) { console.error('renderFoods error:', e); }
  try { renderOrders(); } catch (e) { console.error('renderOrders error:', e); }
  try { renderUsers(); } catch (e) { console.error('renderUsers error:', e); }
  try { renderMessages(); } catch (e) { console.error('renderMessages error:', e); }
}

// ========== LIVE SYNC ==========
window.addEventListener('storage', (e) => {
  if (!DB.get('tb_admin_session')) return; // only when logged in
  if (['tb_orders','tb_foods','tb_users','tb_messages'].includes(e.key)) {
    try { refreshAll(); } catch (err) { console.error('storage sync error:', err); }
  }
});

// ========== AUTO-REFRESH (yangi buyurtmalar uchun) ==========
let lastOrderCount = DB.get('tb_orders', []).length;
setInterval(() => {
  try {
    if (!DB.get('tb_admin_session')) return; // pause if logged out
    const orders = DB.get('tb_orders', []);
    if (orders.length > lastOrderCount) {
      const s = DB.get('tb_settings', {});
      if (s.soundOn !== false) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.1;
          o.start(); o.stop(ctx.currentTime + 0.15);
        } catch {}
      }
      toast('Yangi buyurtma qabul qilindi! 🔔', 'success');
      if (s.autoAccept) {
        const newOnes = orders.filter(o => o.status === 'new');
        newOnes.forEach(o => o.status = 'preparing');
        DB.set('tb_orders', orders);
      }
      refreshAll();
    }
    lastOrderCount = orders.length;
  } catch (err) {
    console.error('auto-refresh error:', err);
  }
}, 3000);


// ============================================================
// ============ TELEGRAM BOT MENU ============
// ============================================================

// ====== Do'kon boti — token asosida (yagona bot) ======
const APP_SLUG = 'fastfood';
const SHOP_KEY = (CLIENT_ID || 'demo') + '__' + APP_SLUG;
function getBotApi() { return (localStorage.getItem('bo_bot_api') || 'http://localhost:3344').replace(/\/+$/, ''); }
function getBotCfg() { return DB.get('tb_bot_config', null) || {}; }
function saveBotCfg(cfg) { DB.set('tb_bot_config', cfg); }
function _shopName() { try { return (DB.get('tb_settings', {}) || {}).restaurantName || (_clientInfo && _clientInfo.businessName) || null; } catch { return null; } }

function botErr(err) {
  const m = String((err && err.message) || err || '');
  if (/Failed to fetch|NetworkError|load failed|ERR_/i.test(m))
    return "Bot serveriga ulanib bo'lmadi — «cd bot && python3 bot.py» ishlab turibdimi? (" + getBotApi() + ')';
  return m || 'Xato';
}

function renderBot() {
  const cfg = getBotCfg();
  const set = (id, v) => { const el = document.getElementById(id); if (el && !el.value) el.value = v; };
  set('bot2Token', cfg.token || '');
  setBotConnectedUI(!!cfg.connected, cfg.username);
  setChannelUI(cfg);
  refreshBotStatus();
}

function setBotConnectedUI(connected, username) {
  const pill = document.getElementById('bot2Status');
  if (pill) { pill.className = 'bot2-status ' + (connected ? 'on' : 'off'); pill.innerHTML = '<i class="fa-solid fa-circle"></i> ' + (connected ? 'Ulangan' : 'Ulanmagan'); }
  const side = document.getElementById('botBadge'); if (side) side.style.display = connected ? '' : 'none';
  const c = document.getElementById('bot2ConnectBtn'); if (c) c.style.display = connected ? 'none' : '';
  const d = document.getElementById('bot2DisconnectBtn'); if (d) d.style.display = connected ? '' : 'none';
  const box = document.getElementById('bot2BotInfo'); if (box) box.style.display = connected ? '' : 'none';
  const un = document.getElementById('bot2Username'); if (un) un.textContent = username || '@bot';
  const link = document.getElementById('bot2OpenLink'); if (link) { const u = String(username || '').replace(/^@/, ''); link.href = u ? ('https://t.me/' + u) : '#'; }
  const t = document.getElementById('bot2Token'); if (t) t.readOnly = connected;
}
function setChannelUI(cfg) {
  const info = document.getElementById('bot2ChannelInfo'); if (info) info.style.display = cfg.channel ? '' : 'none';
  setText('bot2ChannelName', cfg.channel || '—');
  setText('bot2SentCount', String(cfg.sentCount || 0));
  setText('bot2UserCount', String(cfg.userCount || 0));
}

async function refreshBotStatus() {
  try {
    const res = await fetch(getBotApi() + '/store-bot/status?clientId=' + encodeURIComponent(SHOP_KEY));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return;
    const cfg = getBotCfg();
    cfg.connected = !!data.connected;
    cfg.username = data.username || cfg.username;
    cfg.channel = data.channel || null;
    cfg.sentCount = data.sentCount || 0;
    cfg.userCount = data.userCount || 0;
    saveBotCfg(cfg);
    setBotConnectedUI(cfg.connected, cfg.username);
    setChannelUI(cfg);
  } catch (e) { /* server o'chiq — lokal holat saqlanadi */ }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

// ====== AMALLAR ======
function _btnBusy(btn, on, txt) {
  if (!btn) return;
  btn.disabled = on;
  if (on) { btn.dataset._t = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + (txt || 'Yuborilmoqda...'); }
  else if (btn.dataset._t) { btn.innerHTML = btn.dataset._t; delete btn.dataset._t; }
}

// 1) Botni ulash (token)
async function connectBot() {
  const tokenEl = document.getElementById('bot2Token');
  const token = (tokenEl?.value || getBotCfg().token || '').trim();
  if (!/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token)) { toast("Token formati noto'g'ri. @BotFather dan to'liq nusxa oling.", 'error'); tokenEl?.focus(); return; }
  const payload = { clientId: SHOP_KEY, shopName: _shopName() || "Do'kon", token };
  const btn = document.getElementById('bot2ConnectBtn');
  _btnBusy(btn, true, 'Ulanmoqda...');
  try {
    const res = await fetch(getBotApi() + '/store-bot/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Ulanmadi');
    const cfg = getBotCfg();
    Object.assign(cfg, { token, username: data.username, connected: true });
    saveBotCfg(cfg);
    setBotConnectedUI(true, data.username);
    toast('Bot ulandi! ' + (data.username || '') + ' 🎉', 'success');
    refreshBotStatus();
  } catch (err) { toast(botErr(err), 'error'); }
  finally { _btnBusy(btn, false); }
}

async function disconnectBot() {
  if (!confirm('Botni uzasizmi? Buyurtmalar kanalga yuborilmaydi.')) return;
  try {
    await fetch(getBotApi() + '/store-bot/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY }) }).then(r => r.json().catch(() => ({})));
  } catch (e) {}
  const cfg = getBotCfg(); cfg.connected = false; cfg.channel = null; saveBotCfg(cfg);
  setBotConnectedUI(false); setChannelUI(cfg);
  toast('Bot uzildi', 'info');
}

// 2) Kanalga ulash / uzish / test
async function connectChannel() {
  let channel = (document.getElementById('bot2Channel')?.value || '').trim();
  if (!channel) { toast('Kanal username yoki ID kiriting', 'error'); return; }
  if (!getBotCfg().connected) { toast('Avval botni ulang', 'error'); return; }
  const btn = document.getElementById('bot2ChannelBtn');
  _btnBusy(btn, true, 'Ulanmoqda...');
  try {
    const res = await fetch(getBotApi() + '/store-bot/set-channel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, channel }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Ulanmadi');
    const cfg = getBotCfg(); cfg.channel = data.channel; saveBotCfg(cfg); setChannelUI(cfg);
    toast('Kanal ulandi: ' + data.channel + ' 🎉', 'success');
  } catch (err) { toast(botErr(err), 'error'); }
  finally { _btnBusy(btn, false); }
}
async function disconnectChannel() {
  if (!confirm('Kanalni uzasizmi? Buyurtmalar yuborilmaydi.')) return;
  try {
    await fetch(getBotApi() + '/store-bot/set-channel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, clear: true }) }).then(r => r.json().catch(() => ({})));
  } catch (e) {}
  const cfg = getBotCfg(); cfg.channel = null; saveBotCfg(cfg); setChannelUI(cfg);
  toast('Kanal uzildi', 'info');
}
async function testChannel() {
  if (!getBotCfg().channel) { toast('Avval kanal ulang', 'error'); return; }
  const btn = document.getElementById('bot2ChannelTest');
  _btnBusy(btn, true, 'Yuborilmoqda...');
  try {
    const res = await fetch(getBotApi() + '/store-bot/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, order: { id: 'TEST', userName: 'Test mijoz', phone: '+998 90 000 00 00', address: 'Sinov manzil', items: [{ name: 'Sinov mahsulot', qty: 1, price: 10000 }], total: 10000 } }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Yuborilmadi');
    const cfg = getBotCfg(); cfg.sentCount = data.sentCount || (cfg.sentCount || 0) + 1; saveBotCfg(cfg); setChannelUI(cfg);
    toast('Test habar kanalga yuborildi ✅', 'success');
  } catch (err) { toast(botErr(err), 'error'); }
  finally { _btnBusy(btn, false); }
}

// 3) Mijozlarga ommaviy xabar (broadcast)
async function sendBroadcast() {
  const ta = document.getElementById('bot2BroadcastText');
  const text = (ta?.value || '').trim();
  if (!text) { toast('Xabar matnini kiriting', 'error'); return; }
  if (!getBotCfg().connected) { toast('Avval botni ulang', 'error'); return; }
  const btn = document.getElementById('bot2BroadcastBtn');
  const resEl = document.getElementById('bot2BroadcastResult');
  _btnBusy(btn, true, 'Yuborilmoqda...');
  try {
    const res = await fetch(getBotApi() + '/store-bot/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: SHOP_KEY, text }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Yuborilmadi');
    if (resEl) resEl.textContent = `✅ Yuborildi: ${data.sent} / ${data.total} ta` + (data.failed ? ` (xato: ${data.failed})` : '');
    if (ta) ta.value = '';
    toast(data.total ? `Yuborildi: ${data.sent} ta` : 'Hali hech kim botga /start yozmagan', data.total ? 'success' : 'info');
  } catch (err) { if (resEl) resEl.textContent = ''; toast(botErr(err), 'error'); }
  finally { _btnBusy(btn, false); }
}

// ====== Event wiring (bot bo'limi) ======
document.getElementById('bot2Eye')?.addEventListener('click', () => {
  const t = document.getElementById('bot2Token'); if (!t) return;
  const hidden = t.type === 'password'; t.type = hidden ? 'text' : 'password';
  document.getElementById('bot2Eye').innerHTML = hidden ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});
document.getElementById('bot2ConnectBtn')?.addEventListener('click', connectBot);
document.getElementById('bot2DisconnectBtn')?.addEventListener('click', disconnectBot);
document.getElementById('bot2ChannelBtn')?.addEventListener('click', connectChannel);
document.getElementById('bot2ChannelTest')?.addEventListener('click', testChannel);
document.getElementById('bot2ChannelDisc')?.addEventListener('click', disconnectChannel);
document.getElementById('bot2BroadcastBtn')?.addEventListener('click', sendBroadcast);

// ============ BUYURTMA → KANAL (do'kon boti orqali) ============
// Yangi buyurtma yaratilganda chaqiriladigan global helper
window.notifyBotNewOrder = function (order) {
  try {
    const cfg = getBotCfg();
    if (!cfg.connected || !cfg.channel) return;
    fetch(getBotApi() + '/store-bot/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: SHOP_KEY, order })
    })
      .then(r => r.json().catch(() => ({ ok: false })))
      .then(res => {
        if (res && res.ok) {
          const c = getBotCfg(); c.sentCount = res.sentCount || (c.sentCount || 0) + 1; saveBotCfg(c);
          setChannelUI(c);
        }
      })
      .catch(err => { console.warn('[bot] order yuborilmadi:', err.message); });
  } catch (err) {
    console.error('notifyBotNewOrder error:', err);
  }
};

function fmtMoney(n) {
  return (n || 0).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

// ============ AUTO-DETECT NEW ORDERS ============
// Mavjud auto-refresh logikasi bilan integratsiya: lastOrderCount o'sganda yangi buyurtma kelgan
// Buni uchun bizning lastOrderCount o'zgarishini kuzatamiz va yangilarni botga yuboramiz
let _botLastOrderIds = (DB.get('tb_orders', []) || []).map(o => o.id);
setInterval(() => {
  try {
    const orders = DB.get('tb_orders', []) || [];
    const currentIds = orders.map(o => o.id);
    const newIds = currentIds.filter(id => !_botLastOrderIds.includes(id));
    if (newIds.length > 0) {
      newIds.forEach(id => {
        const order = orders.find(o => o.id === id);
        if (order) window.notifyBotNewOrder(order);
      });
    }
    _botLastOrderIds = currentIds;
  } catch (err) {
    console.error('bot watcher error:', err);
  }
}, 2500);

// ============================================================
// ============ QR KOD ============
// ============================================================
function qrStoreUrl() {
  const saved = DB.get('tb_store_url', null);
  if (saved) return saved;
  try { return new URL('index.html', location.href).href.split('?')[0]; }
  catch { return location.origin; }
}
function qrApiSrc(url, size) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&margin=10&qzone=1&data=' + encodeURIComponent(url);
}
function qrShopName() {
  const s = DB.get('tb_settings', {});
  return (s && s.restaurantName) || 'Restoran';
}
function renderQR() {
  const url = qrStoreUrl();
  const input = document.getElementById('qrUrlInput');
  if (input) input.value = url;
  const sn = document.getElementById('qrStoreName');
  if (sn) sn.textContent = qrShopName();
  const img = document.getElementById('qrImage');
  const loading = document.getElementById('qrLoading');
  if (img) {
    if (loading) { loading.style.display = 'block'; loading.textContent = 'QR yuklanmoqda…'; }
    img.style.display = 'none';
    img.onload = () => { img.style.display = 'block'; if (loading) loading.style.display = 'none'; };
    img.onerror = () => { if (loading) loading.textContent = '⚠️ QR yuklanmadi (internet kerak)'; };
    img.src = qrApiSrc(url, 320);
  }
}
// QR tugmalari — delegatsiya
document.addEventListener('click', (e) => {
  if (e.target.closest('#qrSaveBtn')) {
    let v = (document.getElementById('qrUrlInput').value || '').trim();
    if (!v) { toast('URL kiriting', 'error'); return; }
    if (!/^https?:\/\//i.test(v) && !/^file:/i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
    DB.set('tb_store_url', v);
    toast('QR kod yangilandi', 'success');
    renderQR();
  }
  if (e.target.closest('#qrCopyBtn')) {
    navigator.clipboard.writeText(qrStoreUrl()).then(() => toast('Havola nusxalandi', 'success')).catch(() => toast('Nusxalab bo\'lmadi', 'error'));
  }
  if (e.target.closest('#qrOpenBtn')) { window.open(qrStoreUrl(), '_blank'); }
  if (e.target.closest('#qrDownloadBtn')) {
    (async () => {
      try {
        const res = await fetch(qrApiSrc(qrStoreUrl(), 600));
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'qr-kod.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        toast('QR kod yuklab olindi', 'success');
      } catch { window.open(qrApiSrc(qrStoreUrl(), 600), '_blank'); }
    })();
  }
  if (e.target.closest('#qrPrintBtn')) {
    const url = qrStoreUrl();
    const w = window.open('', '_blank', 'width=480,height=680');
    if (!w) { toast('Chop etish oynasi bloklandi', 'error'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>QR Kod</title></head>'
      + '<body style="font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#0f172a">'
      + '<h2 style="margin:0 0 4px">' + qrShopName() + '</h2>'
      + '<p style="margin:0 0 18px;color:#64748b">Veb-ilovamizni oching</p>'
      + '<img src="' + qrApiSrc(url, 400) + '" style="width:320px;height:320px"/>'
      + '<p style="margin-top:18px;font-size:18px">📷 Telefon kamerasi bilan skaner qiling</p>'
      + '<p style="color:#64748b;word-break:break-all;font-size:12px">' + url + '</p>'
      + '</body></html>');
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (er) {} }, 700);
  }
});
