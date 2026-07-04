/* ============================================================
   KOFE — Storefront (v1.0) — Kofe App maketiga mos
   ============================================================ */
'use strict';

const CART_KEY = 'kofe_cart_v1';
const PROFILE_KEY = 'kofe_profile_v1';
const FAV_KEY = 'kofe_favs_v1';
const SHIPPING_BASE = 12000;

function onReady(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
function onLoad(fn){ if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn); }
if ('serviceWorker' in navigator) onLoad(() => navigator.serviceWorker.register('sw.js').catch(() => {}));

/* ============ Kofe rasmi (radial gradient — internet shart emas) ============ */
function coffeeImg(c1, c2) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>`
        + `<defs><radialGradient id='g' cx='38%' cy='30%' r='75%'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></radialGradient></defs>`
        + `<circle cx='100' cy='100' r='97' fill='#efe6d4'/>`
        + `<circle cx='100' cy='100' r='80' fill='url(#g)'/>`
        + `<ellipse cx='78' cy='72' rx='22' ry='14' fill='rgba(255,255,255,.18)'/>`
        + `</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
const SIZES = [{ k: 'S', vol: '0.25L', d: -2000 }, { k: 'M', vol: '0.35L', d: 0 }, { k: 'L', vol: '0.45L', d: 4000 }];
const MILKS = [{ k: 'Oddiy', d: 0 }, { k: 'Yog\'siz', d: 0 }, { k: 'Bodom', d: 3000 }, { k: 'Soya', d: 3000 }];

/* ============ Default demo data ============ */
const DEFAULT_DATA = {
    products: [
        { id: 1, name: "Espresso", category: "issiq", price: 18000, sub: "Quyuq, klassik zarba", desc: "Bir zarbada tayyorlanadigan quyuq, kuchli kofe. Haqiqiy kofe ta'mini sevuvchilar uchun.", c1: "#5a3a20", c2: "#2a1a0e", rating: 4.7, sold: 320, drink: true, popular: true, active: true },
        { id: 2, name: "Cappuccino", category: "issiq", price: 22000, sub: "Espresso, sut, ko'pik", desc: "Espresso, bug'langan sut va qalin sut ko'pigi uyg'unligi. Mayin va muvozanatli ta'm.", c1: "#c9a06a", c2: "#8a6440", rating: 4.8, sold: 540, drink: true, popular: true, active: true },
        { id: 3, name: "Caffè Latte", category: "issiq", price: 24000, sub: "Ko'p sutli, yumshoq", desc: "Espresso ustiga bug'langan sut va yupqa ko'pik. Yumshoq va muvozanatli ta'm — kuningizni yoqimli boshlash uchun.", c1: "#d8b98a", c2: "#a07d50", rating: 4.8, sold: 610, drink: true, popular: true, active: true },
        { id: 4, name: "Mocha", category: "issiq", price: 26000, sub: "Shokoladli kofe", desc: "Espresso, issiq shokolad va sut. Shirin va yoqimli — desert o'rniga ham a'lo.", c1: "#7a4a2a", c2: "#3d2412", rating: 4.6, sold: 410, drink: true, popular: false, active: true },
        { id: 5, name: "Americano", category: "issiq", price: 19000, sub: "Suvli espresso", desc: "Espressoga issiq suv qo'shilgan yengil kofe. Kun bo'yi ichish uchun mos.", c1: "#5a3a20", c2: "#2f1d10", rating: 4.5, sold: 280, drink: true, popular: false, active: true },
        { id: 6, name: "Cold Brew", category: "sovuq", price: 25000, sub: "Sovuq damlangan", desc: "12 soat sovuqda damlangan yumshoq va kam nordon kofe. Muz bilan taqdim etiladi.", c1: "#8a6a45", c2: "#4a3320", rating: 4.7, sold: 360, drink: true, popular: true, active: true },
        { id: 7, name: "Iced Latte", category: "sovuq", price: 26000, sub: "Muzli latte", desc: "Sovuq sut, espresso va muz. Issiq kunlar uchun salqin va mayin tanlov.", c1: "#cbb089", c2: "#9a7a52", rating: 4.7, sold: 300, drink: true, popular: false, active: true },
        { id: 8, name: "Qora choy", category: "choy", price: 12000, sub: "An'anaviy choy", desc: "Xushbo'y qora choy. Yolg'iz yoki shirinliklar bilan mukammal.", c1: "#b5732f", c2: "#7a4a1e", rating: 4.4, sold: 190, drink: false, popular: false, active: true },
        { id: 9, name: "Cheesecake", category: "desert", price: 32000, sub: "Nyu-York uslubi", desc: "Mayin va kremli cheesecake. Kofe uchun ideal hamroh.", c1: "#e8d9b0", c2: "#c9b586", rating: 4.9, sold: 220, drink: false, popular: false, active: true },
        { id: 10, name: "Croissant", category: "desert", price: 18000, sub: "Yog'li, mayin", desc: "Yangi pishirilgan fransuz kruassani. Qatlamli va yumshoq.", c1: "#d8a860", c2: "#a5763a", rating: 4.6, sold: 260, drink: false, popular: false, active: true },
    ],
    orders: [],
    customers: [],
    categories: [
        { id: 'issiq', name: "Issiq", active: true },
        { id: 'sovuq', name: "Sovuq", active: true },
        { id: 'desert', name: "Desert", active: true },
        { id: 'choy', name: "Choy", active: true },
    ],
    coupons: [{ code: 'KOFE20', type: 'percent', value: 20, active: true }],
    settings: { storeName: "Kofe", address: "Chilonzor, Toshkent", phone: "+998 90 123 45 67", email: "info@kofe.uz", payments: { naqd: true, payme: true, uzcard: true }, shipping: [{ zone: "Toshkent", price: 12000 }] },
    chats: [],
};
const UZ_REGIONS = window.UZ_REGIONS || {};

/* ============ Store (Cloud/Supabase) ============ */
const Store = {
    load() { const p = window.Cloud ? Cloud.get("store", null) : null; if (!p) { this.save(DEFAULT_DATA); return JSON.parse(JSON.stringify(DEFAULT_DATA)); } return { ...DEFAULT_DATA, ...p }; },
    save(d) { if (window.Cloud) Cloud.set("store", d); },
};

/* ============ Helpers ============ */
function money(n) { if (n == null || isNaN(n)) return "0 so'm"; return Math.round(n).toLocaleString('en-US').replace(/,/g, ' ') + " so'm"; }
function money0(n) { return Math.round(n).toLocaleString('en-US').replace(/,/g, ' '); }
function escapeHtml(s) { return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function toast(msg, type = '') { const t = document.getElementById('toast'); if (!t) return; t.className = 'toast ' + type; t.textContent = msg; requestAnimationFrame(() => t.classList.add('show')); clearTimeout(window.__tt); window.__tt = setTimeout(() => t.classList.remove('show'), 2400); }

function notifyTelegramBot(order) {
    try {
        const cfg = JSON.parse(localStorage.getItem('kofe_bot_config') || 'null');
        if (!cfg || !cfg.token) return;
        const SHOP_KEY = (new URLSearchParams(location.search).get('client') || (() => { try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; } })() || 'shop') + '__kofe';
        const BOT_HTTP = (localStorage.getItem('bo_bot_api') || localStorage.getItem('kofe_bot_http_url') || 'http://localhost:3344').replace(/\/+$/, '');
        fetch(`${BOT_HTTP}/store-bot/order`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: SHOP_KEY, order: { id: String(order.id), userName: order.name, phone: order.phone, address: order.address, items: (order.items || []).map(i => ({ name: i.name, qty: i.qty, price: i.price })), total: order.total } }) })
            .then(r => r.json().catch(() => ({ ok: false })))
            .then(res => { if (res && res.ok) { cfg.sentCount = (cfg.sentCount || 0) + 1; localStorage.setItem('kofe_bot_config', JSON.stringify(cfg)); } })
            .catch(err => console.warn('[bot] HTTP xato:', err.message));
    } catch (e) { console.warn('notifyTelegramBot error:', e); }
}

function showDialog({ title = 'Tasdiqlash', message = '', icon = '⚠️', okText = 'Tasdiqlash' } = {}) {
    return new Promise(resolve => {
        const bg = document.getElementById('dialogBg'); if (!bg) return resolve(false);
        document.getElementById('dialogTitle').textContent = title; document.getElementById('dialogMsg').textContent = message; document.getElementById('dialogIco').textContent = icon;
        const ok = document.getElementById('dialogOk'), cancel = document.getElementById('dialogCancel'); ok.textContent = okText;
        bg.classList.add('show');
        const done = v => { bg.classList.remove('show'); ok.onclick = null; cancel.onclick = null; resolve(v); };
        ok.onclick = () => done(true); cancel.onclick = () => done(false);
    });
}

/* ============================================================ */
onReady(() => {
    if (!document.querySelector('.phone')) return;

    let data = Store.load();
    let cart = safeParse(CART_KEY, []);
    let profile = safeParse(PROFILE_KEY, {});
    let favorites = safeParse(FAV_KEY, []);
    function safeParse(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } }
    const saveCart = () => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateBadge(); };
    const saveFavs = () => localStorage.setItem(FAV_KEY, JSON.stringify(favorites));

    let homeChip = 'Hammasi';
    let menuCat = 'issiq';
    let menuSearch = '';
    let navStack = ['home'];
    let currentProduct = null, selSize = 1, selMilk = 0;
    let payMethod = 'payme', timeMode = 'tez';

    function catName(id) { return (data.categories.find(c => c.id === id) || {}).name || id; }

    /* ---------- Navigation ---------- */
    function show(name, push = true) {
        const el = document.querySelector(`.screen[data-screen="${name}"]`); if (!el) return;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        el.classList.add('active'); el.querySelector('.scroll')?.scrollTo(0, 0);
        if (push && navStack[navStack.length - 1] !== name) navStack.push(name);
        document.querySelectorAll('.bn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
        // Pastki nav faqat asosiy ekranlarda (maketdagidek)
        const showNav = ['home', 'menu', 'profile'].includes(name);
        const nav = document.querySelector('.bnav');
        if (nav) nav.style.display = showNav ? '' : 'none';
        const ns = el.querySelector('.nav-space');
        if (ns) ns.style.display = showNav ? '' : 'none';
        if (name === 'home') renderHome();
        if (name === 'menu') renderMenu();
        if (name === 'cart') renderCart();
        if (name === 'checkout') renderCheckout();
        if (name === 'profile') renderProfile();
        if (name === 'orders') renderOrders();
    }
    function goBase(name) { navStack = [name]; show(name, false); }
    function goBack(fb) { navStack.pop(); show(navStack[navStack.length - 1] || fb || 'home', false); }
    document.querySelectorAll('.bn').forEach(b => b.onclick = () => goBase(b.dataset.nav));
    document.querySelectorAll('[data-nav]').forEach(b => { if (!b.classList.contains('bn')) b.onclick = () => goBase(b.dataset.nav); });
    document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => goBack(b.dataset.back));
    document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => show(b.dataset.go));
    document.getElementById('homeSearch').onclick = () => goBase('menu');
    document.getElementById('filterBtn').onclick = () => goBase('menu');
    document.getElementById('popAll').onclick = () => goBase('menu');

    /* ---------- HOME ---------- */
    const HOME_CHIPS = ['Hammasi', 'Espresso', 'Latte', 'Sovuq', 'Desert'];
    function renderHome() {
        document.getElementById('homeAvatar').textContent = initials();
        const cw = document.getElementById('homeChips');
        cw.innerHTML = HOME_CHIPS.map(c => `<button class="chip ${c === homeChip ? 'active' : ''}" data-chip="${c}">${c}</button>`).join('');
        cw.querySelectorAll('.chip').forEach(c => c.onclick = () => { homeChip = c.dataset.chip; renderHome(); });
        let list = data.products.filter(p => p.active && p.popular);
        if (homeChip !== 'Hammasi') {
            const q = homeChip.toLowerCase();
            list = data.products.filter(p => p.active && (p.name.toLowerCase().includes(q) || catName(p.category).toLowerCase().includes(q)));
        }
        document.getElementById('popGrid').innerHTML = list.map(pcard).join('');
    }
    function pcard(p) {
        return `<div class="pcard" data-pid="${p.id}">
            <div class="pcard-img" style="background:radial-gradient(circle at 38% 30%, ${p.c1}, ${p.c2})"></div>
            <div class="pcard-name">${escapeHtml(p.name)}</div>
            <div class="pcard-sub">${escapeHtml(p.sub || '')}</div>
            <div class="pcard-row"><div class="pcard-price">${money0(p.price)} <small>so'm</small></div><button class="add-dark" data-quick="${p.id}">+</button></div>
        </div>`;
    }

    /* ---------- MENU ---------- */
    function renderMenu() {
        const tw = document.getElementById('menuTabs');
        tw.innerHTML = data.categories.filter(c => c.active !== false).map(c => `<button class="mtab ${c.id === menuCat ? 'active' : ''}" data-mtab="${c.id}">${escapeHtml(c.name)}</button>`).join('');
        tw.querySelectorAll('.mtab').forEach(t => t.onclick = () => { menuCat = t.dataset.mtab; renderMenu(); });
        let list = data.products.filter(p => p.active && p.category === menuCat);
        if (menuSearch) { const q = menuSearch.toLowerCase(); list = data.products.filter(p => p.active && (p.name.toLowerCase().includes(q) || (p.sub || '').toLowerCase().includes(q))); }
        const wrap = document.getElementById('menuList'), empty = document.getElementById('menuEmpty');
        if (!list.length) { wrap.innerHTML = ''; empty.style.display = ''; return; }
        empty.style.display = 'none';
        wrap.innerHTML = list.map(p => `<div class="mrow" data-pid="${p.id}">
            <div class="mrow-img" style="background:radial-gradient(circle at 38% 30%, ${p.c1}, ${p.c2})"></div>
            <div class="mrow-info"><div class="mrow-name">${escapeHtml(p.name)}</div><div class="mrow-sub">${escapeHtml(p.sub || '')}</div><div class="mrow-price">${money(p.price)}</div></div>
            <button class="mrow-add" data-quick="${p.id}">+</button>
        </div>`).join('');
    }
    document.getElementById('menuSearch').oninput = e => { menuSearch = e.target.value; renderMenu(); };

    /* ---------- PRODUCT DETAIL ---------- */
    function openProduct(id) {
        const p = data.products.find(x => x.id === +id); if (!p) return;
        currentProduct = p; selSize = 1; selMilk = 0;
        document.getElementById('prodFav').classList.toggle('on', favorites.includes(p.id));
        const sizeHtml = p.drink ? `<div class="pd-lbl">O'lchamni tanlang</div><div class="size-row">${SIZES.map((s, i) => `<button class="size-opt ${i === 1 ? 'active' : ''}" data-size="${i}"><strong>${s.k}</strong><small>${s.vol}</small></button>`).join('')}</div>` : '';
        const milkHtml = p.drink ? `<div class="pd-lbl">Sut turi</div><div class="opt-row">${MILKS.map((m, i) => `<button class="opt ${i === 0 ? 'active' : ''}" data-milk="${i}">${m.k}</button>`).join('')}</div>` : '';
        document.getElementById('prodBody').innerHTML = `
            <div class="pd-img" style="background:radial-gradient(circle at 38% 30%, ${p.c1}, ${p.c2})"></div>
            <div class="pd-head"><h2 class="pd-name">${escapeHtml(p.name)}</h2><span class="pd-rate"><span class="st">★</span> ${p.rating || '—'}</span></div>
            <p class="pd-desc">${escapeHtml(p.desc || '')}</p>
            ${sizeHtml}${milkHtml}`;
        renderProdFoot();
        document.querySelectorAll('#prodBody .size-opt').forEach(b => b.onclick = () => { selSize = +b.dataset.size; document.querySelectorAll('#prodBody .size-opt').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderProdFoot(); });
        document.querySelectorAll('#prodBody .opt').forEach(b => b.onclick = () => { selMilk = +b.dataset.milk; document.querySelectorAll('#prodBody .opt').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderProdFoot(); });
        show('product');
    }
    function curPrice() { const p = currentProduct; if (!p) return 0; return p.price + (p.drink ? SIZES[selSize].d + MILKS[selMilk].d : 0); }
    function renderProdFoot() {
        document.getElementById('prodFoot').innerHTML = `<div class="pf-price"><small>Narxi</small><b>${money0(curPrice())} <small>so'm</small></b></div>
            <button class="btn-dark" id="pdAdd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg> Savatga qo'shish</button>`;
        document.getElementById('pdAdd').onclick = () => { addToCart(currentProduct, selSize, selMilk); goBack('home'); };
    }
    document.getElementById('prodFav').onclick = () => {
        if (!currentProduct) return; const id = currentProduct.id; const i = favorites.indexOf(id);
        if (i >= 0) { favorites.splice(i, 1); toast('Sevimlilardan olindi'); } else { favorites.push(id); toast('Sevimlilarga qo\'shildi', 'success'); }
        saveFavs(); document.getElementById('prodFav').classList.toggle('on', favorites.includes(id));
    };

    /* ---------- CART ---------- */
    function lineKey(id, s, m) { return id + '|' + s + '|' + m; }
    function addToCart(p, s = 1, m = 0) {
        const price = p.price + (p.drink ? SIZES[s].d + MILKS[m].d : 0);
        const key = lineKey(p.id, s, m);
        const ex = cart.find(c => c.key === key);
        if (ex) ex.qty += 1;
        else cart.push({ key, id: p.id, name: p.name, price, c1: p.c1, c2: p.c2, qty: 1, size: p.drink ? SIZES[s].k : '', milk: p.drink ? MILKS[m].k : '' });
        saveCart(); toast(p.name + " savatga qo'shildi", 'success');
    }
    function updateBadge() { const n = cart.reduce((s, i) => s + i.qty, 0); const b = document.getElementById('navCartBadge'); if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; } }
    function cartSub() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
    function renderCart() {
        const wrap = document.getElementById('cartList'), empty = document.getElementById('cartEmpty'), foot = document.getElementById('cartFoot'), promo = document.getElementById('promoRow');
        document.getElementById('cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0) + ' ta mahsulot';
        if (!cart.length) { wrap.innerHTML = ''; empty.style.display = ''; foot.style.display = 'none'; promo.style.display = 'none'; return; }
        empty.style.display = 'none'; foot.style.display = ''; promo.style.display = '';
        wrap.innerHTML = cart.map(c => {
            const variant = [c.size, c.milk ? c.milk + ' sut' : ''].filter(Boolean).join(' · ');
            return `<div class="citem">
                <div class="citem-img" style="background:radial-gradient(circle at 38% 30%, ${c.c1}, ${c.c2})"></div>
                <div class="citem-info"><div class="citem-name">${escapeHtml(c.name)}</div>${variant ? `<div class="citem-var">${escapeHtml(variant)}</div>` : ''}<div class="citem-price">${money(c.price * c.qty)}</div></div>
                <div class="qty"><button class="qbtn" data-dec="${c.key}">−</button><span class="qn">${c.qty}</span><button class="qbtn plus" data-inc="${c.key}">+</button></div>
            </div>`;
        }).join('');
        const sub = cartSub();
        document.getElementById('sumProd').textContent = money(sub);
        document.getElementById('sumShip').textContent = money(SHIPPING_BASE);
        document.getElementById('sumTotal').textContent = money(sub + SHIPPING_BASE);
    }
    document.getElementById('promoApply').onclick = e => { e.stopPropagation(); toast('Promokod KOFE20 qo\'llandi', 'success'); };
    document.getElementById('toCheckout').onclick = () => { if (cart.length) show('checkout'); };

    /* ---------- CHECKOUT ---------- */
    function renderCheckout() {
        document.getElementById('coTotal').textContent = money(cartSub() + SHIPPING_BASE);
        document.querySelectorAll('.time-opt').forEach(t => t.classList.toggle('active', t.dataset.time === timeMode));
        document.querySelectorAll('.pay-opt').forEach(o => { const on = o.dataset.pay === payMethod; o.classList.toggle('active', on); o.querySelector('.radio').classList.toggle('on', on); });
    }
    document.querySelectorAll('.time-opt').forEach(t => t.onclick = () => { timeMode = t.dataset.time; renderCheckout(); });
    document.querySelectorAll('.pay-opt').forEach(o => o.onclick = () => { payMethod = o.dataset.pay; renderCheckout(); });
    document.querySelector('.addr-edit').onclick = () => toast('Manzilni tahrirlash tez orada');
    document.getElementById('placeOrder').onclick = () => {
        if (!cart.length) { toast('Savatcha bo\'sh', 'error'); return; }
        const sub = cartSub();
        const num = Math.max(2417, ...data.orders.map(o => +String(o.id).replace(/\D/g, '') || 0)) + 1;
        const order = {
            id: 'A-' + num, customerId: null, name: profile.name || 'Aziz Karimov', phone: profile.phone || '+998 90 123 45 67',
            address: 'Chilonzor 12-kvartal, 45-uy', items: cart.map(c => ({ pid: c.id, name: c.name + (c.size ? ' (' + c.size + ')' : ''), qty: c.qty, price: c.price })),
            total: sub + SHIPPING_BASE, payment: payMethod, status: 'yangi', date: new Date().toISOString().slice(0, 10), self: true,
        };
        data.orders.unshift(order); Store.save(data); notifyTelegramBot(order);
        cart = []; saveCart();
        document.getElementById('statusTitle').textContent = 'Buyurtma #' + order.id;
        navStack = ['home', 'cart', 'checkout', 'status'];
        show('status', false);
        toast('Buyurtma qabul qilindi! ☕', 'success');
    };

    /* ---------- PROFILE ---------- */
    function initials() { const n = (profile.name || 'Aziz Karimov').trim().split(/\s+/); return ((n[0]?.[0] || '') + (n[1]?.[0] || '')).toUpperCase() || 'AK'; }
    function renderProfile() {
        document.getElementById('profAvatar').textContent = initials();
        document.getElementById('profName').textContent = profile.name || 'Aziz Karimov';
        document.getElementById('profPhone').textContent = profile.phone || '+998 90 123 45 67';
        document.getElementById('loyPts').textContent = profile.points || 120;
    }
    document.getElementById('profEdit').onclick = () => toast('Profilni tahrirlash tez orada');
    document.getElementById('pmAddr').onclick = () => toast('Manzillar: Chilonzor 12-kvartal');
    document.getElementById('pmPay').onclick = () => toast('To\'lov usullari: Payme, UZCARD, Naqd');
    document.getElementById('pmSettings').onclick = () => toast('Sozlamalar tez orada');
    document.getElementById('logoutBtn').onclick = async () => { if (await showDialog({ title: 'Chiqish', message: 'Hisobdan chiqmoqchimisiz?', icon: '👋', okText: 'Chiqish' })) { toast('Hisobdan chiqildi'); goBase('home'); } };
    document.getElementById('locBtn').onclick = () => toast('Chilonzor, Toshkent');

    /* ---------- ORDERS ---------- */
    const STLABEL = { yangi: 'Yangi', jarayonda: 'Jarayonda', yetkazildi: 'Yetkazildi', bekor: 'Bekor' };
    function renderOrders() {
        const list = data.orders.filter(o => o.self);
        const wrap = document.getElementById('ordersList'), empty = document.getElementById('ordersEmpty');
        if (!list.length) { wrap.innerHTML = ''; empty.style.display = ''; return; }
        empty.style.display = 'none';
        wrap.innerHTML = list.map(o => {
            const st = o.status === 'yangi' ? 'jarayonda' : o.status;
            const items = o.items.map(i => i.name + ' ×' + i.qty).join(', ');
            return `<div class="ocard" data-oid="${o.id}">
                <div class="ocard-top"><span class="ocard-id">#${o.id}</span><span class="ocard-badge ${st}">${STLABEL[o.status] || o.status}</span></div>
                <div class="ocard-items">${escapeHtml(items)}</div>
                <div class="ocard-bot"><span class="ocard-total">${money(o.total)}</span><span class="ocard-date">${o.date}</span></div>
            </div>`;
        }).join('');
        wrap.querySelectorAll('.ocard').forEach(c => c.onclick = () => { document.getElementById('statusTitle').textContent = 'Buyurtma #' + c.dataset.oid; navStack = ['home', 'profile', 'orders', 'status']; show('status', false); });
    }

    /* ---------- Delegated clicks ---------- */
    document.addEventListener('click', e => {
        const quick = e.target.closest('[data-quick]');
        if (quick) { e.stopPropagation(); const p = data.products.find(x => x.id === +quick.dataset.quick); if (p) addToCart(p, 1, 0); return; }
        const inc = e.target.closest('[data-inc]'); if (inc) { const c = cart.find(x => x.key === inc.dataset.inc); if (c) { c.qty++; saveCart(); renderCart(); } return; }
        const dec = e.target.closest('[data-dec]'); if (dec) { const c = cart.find(x => x.key === dec.dataset.dec); if (c) { c.qty--; if (c.qty <= 0) cart = cart.filter(x => x.key !== c.key); saveCart(); renderCart(); } return; }
        const card = e.target.closest('[data-pid]'); if (card) openProduct(card.dataset.pid);
    });

    /* ---------- Init ---------- */
    updateBadge();
    show('home', false);
});
