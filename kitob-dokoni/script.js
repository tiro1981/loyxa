/* ============================================================
   BOOKZ — Storefront (v2.0) — Bookz UI maketiga mos
   ============================================================ */
'use strict';

const STORE_KEY = 'kitob_store_v1';
const CART_KEY = 'kitob_cart_v1';
const PROFILE_KEY = 'kitob_profile_v1';
const ADDR_KEY = 'kitob_addrs_v1';
const PROMO_KEY = 'kitob_promo';
const THEME_KEY = 'kitob_theme';
const LANG_KEY = 'kitob_lang';
const SHIPPING_BASE = 25000;

function onReady(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
function onLoad(fn){ if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn); }

/* ============ PWA (service worker) ============ */
if ('serviceWorker' in navigator) onLoad(() => navigator.serviceWorker.register('sw.js').catch(() => {}));

/* ============ Kitob muqovasi (o'zicha yetarli SVG) ============ */
function bookCover(title, author, c1, c2) {
    const words = String(title).split(' ');
    let l1 = title, l2 = '';
    if (words.length > 2) { const m = Math.ceil(words.length / 2); l1 = words.slice(0, m).join(' '); l2 = words.slice(m).join(' '); }
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560' viewBox='0 0 400 560'>`
        + `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>`
        + `<rect width='400' height='560' rx='22' fill='url(#g)'/>`
        + `<text x='30' y='70' fill='rgba(255,255,255,.78)' font-family='Inter,Arial,sans-serif' font-size='19' font-weight='700' letter-spacing='2'>${esc(author.toUpperCase())}</text>`
        + `<text x='30' y='${l2 ? 262 : 292}' fill='#fff' font-family='Inter,Arial,sans-serif' font-size='40' font-weight='800'>${esc(l1)}</text>`
        + (l2 ? `<text x='30' y='308' fill='#fff' font-family='Inter,Arial,sans-serif' font-size='40' font-weight='800'>${esc(l2)}</text>` : '')
        + `</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/* ============ Default demo data ============ */
const DEFAULT_DATA = {
    products: [
        { id: 1, name: "O'tkan kunlar", author: "Abdulla Qodiriy", category: "badiiy", price: 45000, oldPrice: 55000, image: bookCover("O'tkan kunlar", "Abdulla Qodiriy", "#7f1d2e", "#b91c3c"), desc: "O'zbek adabiyotining ilk romani. Otabek va Kumushbibi sevgisi orqali XIX asr Turkiston hayoti tasvirlangan.", pages: 416, rating: 4.9, stock: 40, sold: 842, active: true, created: "2026-06-20" },
        { id: 2, name: "Sarob", author: "Abdulla Qahhor", category: "badiiy", price: 38000, image: bookCover("Sarob", "Abdulla Qahhor", "#e11d48", "#f97316"), desc: "Ijtimoiy-psixologik roman insonning ichki kurashi, orzu va haqiqat o'rtasidagi ziddiyatni mahorat bilan ochib beradi.", pages: 912, rating: 4.5, stock: 25, sold: 736, active: true, created: "2026-06-18" },
        { id: 3, name: "Ikki eshik orasi", author: "O'tkir Hoshimov", category: "badiiy", price: 52000, image: bookCover("Ikki eshik orasi", "O'tkir Hoshimov", "#4c1d95", "#6d5bd0"), desc: "Urush va urushdan keyingi yillar — bir necha avlod taqdiri orqali xalq hayoti va ma'naviyati aks etgan roman.", pages: 544, rating: 4.9, stock: 30, sold: 690, active: true, created: "2026-06-25" },
        { id: 4, name: "Shum bola", author: "G'afur G'ulom", category: "bolalar", price: 29000, image: bookCover("Shum bola", "G'afur G'ulom", "#0f766e", "#14b8a6"), desc: "Sho'x va topqir bola boshidan kechirgan qiziqarli sarguzashtlar. Bolalar va kattalar sevib o'qiydigan asar.", pages: 176, rating: 4.7, stock: 50, sold: 615, active: true, created: "2026-06-10" },
        { id: 5, name: "Kecha va kunduz", author: "Cho'lpon", category: "badiiy", price: 41000, image: bookCover("Kecha va kunduz", "Cho'lpon", "#0c4a4a", "#0e7490"), desc: "Zebi obrazida o'zbek ayolining fojiali taqdiri, mustamlaka davri jamiyati ochib berilgan mumtoz roman.", pages: 288, rating: 4.8, stock: 18, sold: 588, active: true, created: "2026-06-28" },
        { id: 6, name: "Mehrobdan chayon", author: "Abdulla Qodiriy", category: "tarix", price: 43000, image: bookCover("Mehrobdan chayon", "Abdulla Qodiriy", "#b45309", "#f59e0b"), desc: "Xon saroyi kotibi Anvar hayoti orqali o'rta asr saroy hayoti, mehr-muhabbat va xiyonat tasvirlangan roman.", pages: 320, rating: 4.6, stock: 22, sold: 421, active: true, created: "2026-06-12" },
        { id: 7, name: "Navoiy", author: "Oybek", category: "tarix", price: 47000, image: bookCover("Navoiy", "Oybek", "#1e3a8a", "#3b82f6"), desc: "Buyuk shoir va davlat arbobi Alisher Navoiy hayoti va ijodiga bag'ishlangan tarixiy roman.", pages: 480, rating: 4.7, stock: 27, sold: 356, active: true, created: "2026-06-05" },
        { id: 8, name: "Sinchalak", author: "Abdulla Qahhor", category: "badiiy", price: 33000, image: bookCover("Sinchalak", "Abdulla Qahhor", "#831843", "#db2777"), desc: "Qishloq hayoti, mehnat va inson xarakterlari haqidagi qissa. Sodda tilda chuqur ma'no.", pages: 208, rating: 4.4, stock: 35, sold: 298, active: true, created: "2026-06-02" },
    ],
    orders: [],
    customers: [],
    categories: [
        { id: 'badiiy', name: "Badiiy", icon: "📖", active: true },
        { id: 'ilmiy', name: "Ilmiy", icon: "🔬", active: true },
        { id: 'tarix', name: "Tarix", icon: "🏛️", active: true },
        { id: 'bolalar', name: "Bolalar", icon: "🧸", active: true },
        { id: 'sheriyat', name: "She'riyat", icon: "🖋️", active: true },
        { id: 'biznes', name: "Biznes", icon: "💼", active: true },
    ],
    coupons: [],
    settings: {
        storeName: "Bookz", address: "Toshkent sh., Amir Temur ko'chasi 42",
        phone: "+998 90 123 45 67", email: "info@bookz.uz", workHours: "Dush-Yak: 09:00 - 21:00",
        payments: { naqd: true, karta: true },
        shipping: [{ zone: "Toshkent shahri", price: 25000 }, { zone: "Toshkent viloyati", price: 40000 }, { zone: "Boshqa viloyatlar", price: 60000 }],
    },
    chats: [],
};

const UZ_REGIONS = window.UZ_REGIONS || {};

/* ============ Store (Cloud/Supabase) ============ */
const Store = {
    load() {
        const parsed = window.Cloud ? Cloud.get("store", null) : null;
        if (!parsed) { this.save(DEFAULT_DATA); return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
        return { ...DEFAULT_DATA, ...parsed };
    },
    save(data) { if (window.Cloud) Cloud.set("store", data); },
};

/* ============ Helpers ============ */
function money(n) { if (n == null || isNaN(n)) return "0 so'm"; return Math.round(n).toLocaleString('en-US').replace(/,/g, ' ') + " so'm"; }
function escapeHtml(s) { return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function toast(msg, type = 'success') {
    const t = document.getElementById('toast'); if (!t) return;
    t.className = 'toast ' + type; t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(window.__tt); window.__tt = setTimeout(() => t.classList.remove('show'), 2500);
}
function stars(r) {
    r = Math.round(r || 0);
    let s = ''; for (let i = 1; i <= 5; i++) s += i <= r ? '★' : `<span class="off">★</span>`;
    return s;
}

/* ============ Telegram bot (admin panelda ulangan bo'lsa) ============ */
function notifyTelegramBot(order) {
    try {
        const cfg = JSON.parse(localStorage.getItem('kitob_bot_config') || 'null');
        if (!cfg || !cfg.token) return;
        const SHOP_KEY = (new URLSearchParams(location.search).get('client') || (() => { try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; } })() || 'shop') + '__kitob';
        const BOT_HTTP = (localStorage.getItem('bo_bot_api') || localStorage.getItem('kitob_bot_http_url') || 'http://localhost:3344').replace(/\/+$/, '');
        fetch(`${BOT_HTTP}/store-bot/order`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: SHOP_KEY,
                order: { id: String(order.id), userName: order.name, phone: order.phone, address: order.address,
                    items: (order.items || []).map(i => ({ name: i.name, qty: i.qty, price: i.price })), total: order.total }
            })
        }).then(r => r.json().catch(() => ({ ok: false })))
          .then(res => { if (res && res.ok) { cfg.sentCount = (cfg.sentCount || 0) + 1; localStorage.setItem('kitob_bot_config', JSON.stringify(cfg)); } })
          .catch(err => console.warn('[bot] HTTP xato:', err.message));
    } catch (e) { console.warn('notifyTelegramBot error:', e); }
}

/* ============ Confirm dialog ============ */
function showDialog({ title = 'Tasdiqlash', message = '', icon = '⚠️', okText = 'Tasdiqlash', cancelText = 'Bekor qilish' } = {}) {
    return new Promise(resolve => {
        const bg = document.getElementById('dialogBg'); if (!bg) return resolve(false);
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMsg').textContent = message;
        document.getElementById('dialogIco').textContent = icon;
        const ok = document.getElementById('dialogOk'), cancel = document.getElementById('dialogCancel');
        ok.textContent = okText; cancel.textContent = cancelText;
        bg.classList.add('show');
        const done = v => { bg.classList.remove('show'); ok.onclick = null; cancel.onclick = null; resolve(v); };
        ok.onclick = () => done(true); cancel.onclick = () => done(false);
    });
}

/* ============================================================
   ASOSIY ILOVA
   ============================================================ */
onReady(() => {
    if (!document.querySelector('.phone')) return;

    let data = Store.load();
    let cart = safeParse(CART_KEY, []);
    let profile = safeParse(PROFILE_KEY, {});
    let addresses = safeParse(ADDR_KEY, []);
    let activePromo = safeParse(PROMO_KEY, null);
    let payMethod = localStorage.getItem('kitob_pay') || 'naqd';
    let chatMsgs = safeParse('kitob_chat', []);
    let lang = localStorage.getItem(LANG_KEY) || "O'zbek";

    function safeParse(key, fb) { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } }
    const saveCart = () => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); };
    const saveProfile = () => localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    const savePromo = () => { if (activePromo) localStorage.setItem(PROMO_KEY, JSON.stringify(activePromo)); else localStorage.removeItem(PROMO_KEY); };

    let fState = { cat: 'all', search: '', minPrice: null, maxPrice: null, sort: 'new', author: null, rating: 0 };
    let orderFilter = 'all';
    let navStack = ['home'];

    /* ---------- Theme ---------- */
    function applyTheme(dark) {
        document.documentElement.classList.toggle('dark', dark);
        document.body.classList.toggle('dark', dark);
        const sw = document.getElementById('themeSwitch'); if (sw) sw.checked = dark;
        localStorage.setItem(THEME_KEY, dark ? '1' : '0');
        const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = dark ? '#0b0d14' : '#f4f5f9';
    }
    applyTheme(localStorage.getItem(THEME_KEY) !== '0');

    /* ---------- Navigation ---------- */
    function showScreen(name, push = true) {
        const el = document.querySelector(`.screen[data-screen="${name}"]`);
        if (!el) return;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        el.querySelector('.scroll')?.scrollTo(0, 0);
        if (push) { if (navStack[navStack.length - 1] !== name) navStack.push(name); }
        // bottom nav active
        document.querySelectorAll('.bn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
        // render per screen
        if (name === 'home') { renderChips(); renderPopular(); renderGrid(); }
        if (name === 'cart') renderCart();
        if (name === 'profile') renderProfile();
        if (name === 'orders') renderOrders();
        if (name === 'search') { renderRecent(); renderReco(); }
        if (name === 'profileInfo') fillProfileForm();
        if (name === 'language') renderLang();
    }
    function goBase(name) { navStack = [name]; showScreen(name, false); }
    function goBack(fallback) {
        navStack.pop();
        const prev = navStack[navStack.length - 1] || fallback || 'home';
        showScreen(prev, false);
    }

    document.querySelectorAll('.bn').forEach(b => b.onclick = () => goBase(b.dataset.nav));
    document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => showScreen(b.dataset.go));
    document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => goBack(b.dataset.back));
    document.querySelectorAll('[data-open-menu]').forEach(b => b.onclick = () => showScreen('menu'));
    document.getElementById('menuBtn').onclick = () => showScreen('menu');
    document.getElementById('homeSearchOpen').onclick = () => showScreen('search');
    document.getElementById('popAll').onclick = () => { fState.cat = 'all'; document.querySelector('.scroll')?.scrollTo(0, 0); };

    /* ---------- Sheets ---------- */
    const sheetBg = document.getElementById('sheetBg');
    function openSheet(id) { document.querySelectorAll('.sheet.show').forEach(s => s.classList.remove('show')); document.getElementById(id)?.classList.add('show'); sheetBg.classList.add('show'); }
    function closeSheet() { document.querySelectorAll('.sheet.show').forEach(s => s.classList.remove('show')); sheetBg.classList.remove('show'); }
    sheetBg.onclick = closeSheet;
    document.querySelectorAll('[data-close-sheet]').forEach(b => b.onclick = closeSheet);

    /* ---------- Cover fallback ---------- */
    function cover(p) { return p.image || bookCover(p.name || 'Kitob', p.author || '', '#7f1d2e', '#b91c3c'); }
    function catName(id) { return (data.categories.find(c => c.id === id) || {}).name || id; }

    /* ---------- Home: chips ---------- */
    function renderChips() {
        const wrap = document.getElementById('catChips');
        const cats = [{ id: 'all', name: 'Hammasi', icon: '✨' }, ...data.categories.filter(c => c.active !== false)];
        wrap.innerHTML = cats.map(c => `<button class="chip ${c.id === fState.cat ? 'active' : ''}" data-chip="${c.id}"><span>${c.icon || ''}</span> ${escapeHtml(c.name)}</button>`).join('');
        wrap.querySelectorAll('.chip').forEach(c => c.onclick = () => { fState.cat = c.dataset.chip; renderChips(); renderGrid(); });
    }

    function getFiltered() {
        let list = data.products.filter(p => p.active);
        if (fState.cat !== 'all') list = list.filter(p => p.category === fState.cat);
        if (fState.author) list = list.filter(p => p.author === fState.author);
        if (fState.rating) list = list.filter(p => (p.rating || 0) >= fState.rating);
        if (fState.search) { const q = fState.search.toLowerCase().trim(); list = list.filter(p => p.name.toLowerCase().includes(q) || (p.author || '').toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q)); }
        if (fState.minPrice) list = list.filter(p => p.price >= fState.minPrice);
        if (fState.maxPrice) list = list.filter(p => p.price <= fState.maxPrice);
        switch (fState.sort) {
            case 'price-asc': list.sort((a, b) => a.price - b.price); break;
            case 'price-desc': list.sort((a, b) => b.price - a.price); break;
            case 'popular': list.sort((a, b) => b.sold - a.sold); break;
            case 'sale': list = list.filter(p => p.oldPrice).sort((a, b) => b.sold - a.sold); break;
            default: list.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
        }
        return list;
    }

    /* ---------- Home: popular ---------- */
    function renderPopular() {
        const top = [...data.products].filter(p => p.active && p.stock > 0).sort((a, b) => b.sold - a.sold).slice(0, 8);
        document.getElementById('popScroll').innerHTML = top.map(p => {
            return `<div class="pop-card" data-pid="${p.id}">
                <div class="pop-cover"><img src="${cover(p)}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
                <div class="pop-meta">
                    <div class="pop-info"><div class="pm-name">${escapeHtml(p.name)}</div><div class="pm-price">${money(p.price)}</div></div>
                </div>
            </div>`;
        }).join('');
    }

    /* ---------- Home: grid ---------- */
    function bookCard(p) {
        const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        return `<div class="book-card" data-pid="${p.id}">
            <div class="bc-cover">
                ${disc ? `<span class="bc-disc">-${disc}%</span>` : ''}
                <img src="${cover(p)}" alt="${escapeHtml(p.name)}" loading="lazy">
            </div>
            <div class="bc-body">
                <div class="bc-author">${escapeHtml(p.author || catName(p.category))}</div>
                <div class="bc-name">${escapeHtml(p.name)}</div>
                ${p.rating ? `<div class="bc-rate">★ ${p.rating}</div>` : ''}
                <div class="bc-row">
                    <div><span class="bc-price">${money(p.price).replace(" so'm", '')}</span><span class="bc-price" style="font-size:12px;font-weight:600"> so'm</span>${p.oldPrice ? `<span class="bc-old">${money(p.oldPrice).replace(" so'm", '')}</span>` : ''}</div>
                    <button class="bc-add" data-add="${p.id}">+</button>
                </div>
            </div>
        </div>`;
    }
    function renderGrid() {
        const list = getFiltered();
        const grid = document.getElementById('bookGrid'), empty = document.getElementById('emptyHome');
        document.getElementById('gridCount').textContent = list.length;
        if (!list.length) { grid.innerHTML = ''; empty.style.display = ''; return; }
        empty.style.display = 'none';
        grid.innerHTML = list.map(bookCard).join('');
    }

    /* ---------- Product detail ---------- */
    function openDetail(id) {
        const p = data.products.find(x => x.id === +id); if (!p) return;
        const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        const out = p.stock === 0;
        document.getElementById('productDetail').innerHTML = `
            <div class="pd-body">
                <div class="pd-cover">
                    <img src="${cover(p)}" alt="${escapeHtml(p.name)}">
                </div>
                <div class="pd-cat">${escapeHtml(catName(p.category))}</div>
                <h2 class="pd-name">${escapeHtml(p.name)}</h2>
                ${p.author ? `<div class="pd-author">${escapeHtml(p.author)}</div>` : ''}
                ${(p.pages || p.rating) ? `<div class="pd-stats">
                    ${p.pages ? `<div class="pd-stat"><strong>${p.pages}</strong><small>Sahifa</small></div>` : ''}
                    <div class="pd-stat"><strong>${p.sold >= 500 ? '500+' : p.sold}</strong><small>Sotildi</small></div>
                    ${p.rating ? `<div class="pd-stat"><strong>${p.rating} ★</strong><small>Reyting</small></div>` : ''}
                </div>` : ''}
                <div class="pd-prices">
                    <span class="pd-price">${money(p.price)}</span>
                    ${p.oldPrice ? `<span class="pd-old">${money(p.oldPrice)}</span>` : ''}
                    ${disc ? `<span class="pd-disc">-${disc}%</span>` : ''}
                </div>
                <div class="pd-sec"><h4>Tavsif</h4><p class="pd-desc">${escapeHtml(p.desc || 'Tavsif mavjud emas.')}</p></div>
            </div>
            <div class="sheet-foot">
                <button class="btn-primary full" id="pdAdd" ${out ? 'disabled style="opacity:.5"' : ''}>${out ? 'Kitob tugagan' : 'Bu kitobni sotib olish'}</button>
            </div>`;
        openSheet('productSheet');
        const add = document.getElementById('pdAdd');
        if (add && !out) add.onclick = () => { addToCart(p.id); closeSheet(); };
    }

    /* ---------- Cart ---------- */
    function addToCart(id) {
        const p = data.products.find(x => x.id === +id); if (!p) return;
        if (p.stock === 0) { toast('Kitob tugagan', 'error'); return; }
        const ex = cart.find(c => c.id === p.id);
        if (ex) { if (ex.qty >= p.stock) { toast('Zaxira yetarli emas', 'error'); return; } ex.qty += 1; }
        else cart.push({ id: p.id, name: p.name, price: p.price, image: cover(p), qty: 1 });
        saveCart();
        toast(p.name + " savatga qo'shildi", 'success');
    }
    function updateCartBadge() {
        const n = cart.reduce((s, i) => s + i.qty, 0);
        const b = document.getElementById('cartBadge');
        if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; }
    }
    function calcDiscount(sub) {
        if (!activePromo) return 0;
        return activePromo.type === 'percent' ? Math.round(sub * activePromo.value / 100) : Math.min(activePromo.value, sub);
    }
    function renderCart() {
        const wrap = document.getElementById('cartList'), empty = document.getElementById('emptyCart'), foot = document.getElementById('cartFoot');
        if (!cart.length) { wrap.innerHTML = ''; empty.style.display = ''; foot.style.display = 'none'; return; }
        empty.style.display = 'none'; foot.style.display = '';
        wrap.innerHTML = cart.map(c => `<div class="cart-item">
            <div class="ci-cover"><img src="${c.image}" alt=""></div>
            <div class="ci-info">
                <div class="ci-name">${escapeHtml(c.name)}</div>
                <div class="ci-price">${money(c.price * c.qty)}</div>
                <div class="ci-qty">
                    <button class="qbtn" data-cdec="${c.id}">−</button>
                    <span class="qn">${c.qty}</span>
                    <button class="qbtn" data-cinc="${c.id}">+</button>
                </div>
            </div>
            <button class="ci-remove" data-crem="${c.id}">×</button>
        </div>`).join('');
        const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const disc = calcDiscount(sub), total = sub + SHIPPING_BASE - disc;
        document.getElementById('cartSub').textContent = money(sub);
        document.getElementById('cartShip').textContent = money(SHIPPING_BASE);
        document.getElementById('cartTotal').textContent = money(total);
        const dr = document.getElementById('cartDiscRow');
        if (disc > 0) { dr.style.display = ''; document.getElementById('cartDisc').textContent = '− ' + money(disc); } else dr.style.display = 'none';
    }
    document.getElementById('clearCartBtn').onclick = async () => {
        if (!cart.length) return;
        if (await showDialog({ title: 'Savatni tozalash', message: 'Barcha kitoblar olib tashlansinmi?', icon: '🗑️', okText: 'Tozalash' })) { cart = []; saveCart(); renderCart(); }
    };
    document.getElementById('promoApply').onclick = () => {
        const code = document.getElementById('promoInput').value.trim().toUpperCase();
        if (!code) return;
        const c = (data.coupons || []).find(x => x.code?.toUpperCase() === code);
        if (!c || !c.active) { toast('Promo-kod topilmadi', 'error'); return; }
        activePromo = { code: c.code, type: c.type, value: c.value }; savePromo(); renderCart();
        toast('Promo-kod qo\'llandi', 'success');
    };

    /* ---------- Checkout ---------- */
    document.getElementById('checkoutBtn').onclick = () => {
        if (!cart.length) { toast('Savat bo\'sh', 'error'); return; }
        const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const disc = calcDiscount(sub), total = sub + SHIPPING_BASE - disc;
        document.getElementById('orderSum').innerHTML =
            cart.map(c => `<div><span>${escapeHtml(c.name)} × ${c.qty}</span><span>${money(c.price * c.qty)}</span></div>`).join('')
            + (disc > 0 ? `<div><span>Chegirma</span><span style="color:var(--success)">− ${money(disc)}</span></div>` : '')
            + `<div><span>Yetkazib berish</span><span>${money(SHIPPING_BASE)}</span></div>`
            + `<div class="tot"><span>Jami</span><span>${money(total)}</span></div>`;
        const form = document.getElementById('checkoutForm');
        if (profile.name) form.name.value = profile.name;
        if (profile.phone) form.phone.value = profile.phone;
        const def = addresses.find(a => a.default) || addresses[0];
        if (def) form.address.value = def.text || def.full || '';
        const payRadio = form.querySelector(`input[name=payment][value="${payMethod === 'naqd' ? 'naqd' : 'karta'}"]`);
        if (payRadio) payRadio.checked = true;
        openSheet('checkoutSheet');
    };
    document.getElementById('placeOrderBtn').onclick = () => {
        const form = document.getElementById('checkoutForm');
        const fd = new FormData(form);
        const name = (fd.get('name') || '').toString().trim();
        const phone = (fd.get('phone') || '').toString().trim();
        const address = (fd.get('address') || '').toString().trim();
        if (!name || !phone || !address) { toast('Barcha maydonlarni to\'ldiring', 'error'); return; }
        if (phone.replace(/\D/g, '').length < 9) { toast('Telefon raqam noto\'g\'ri', 'error'); return; }
        const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const disc = calcDiscount(sub);
        const order = {
            id: Math.max(1000, ...data.orders.map(o => o.id)) + 1,
            customerId: null, name, phone, address,
            items: cart.map(c => ({ pid: c.id, name: c.name, qty: c.qty, price: c.price })),
            total: sub + SHIPPING_BASE - disc, payment: fd.get('payment'),
            status: 'yangi', note: '', date: new Date().toISOString().slice(0, 10),
            self: true, promo: activePromo || null, discount: disc,
        };
        data.orders.unshift(order);
        Store.save(data);
        notifyTelegramBot(order);
        if (!profile.name) { profile = { name, phone }; saveProfile(); }
        cart = []; activePromo = null; savePromo(); saveCart();
        closeSheet();
        navStack = ['home', 'menu', 'profile', 'orders'];
        showScreen('orders', false);
        toast('Buyurtmangiz qabul qilindi! 🎉', 'success');
        form.reset();
    };

    /* ---------- Orders ---------- */
    const STATUS_LABEL = { yangi: 'Yangi', jarayonda: 'Jarayonda', yetkazilmoqda: 'Yo\'lda', yetkazildi: 'Yetkazildi', bekor: 'Bekor' };
    function renderOrders() {
        let list = data.orders.filter(o => o.self);
        if (orderFilter === 'jarayonda') list = list.filter(o => ['yangi', 'jarayonda', 'yetkazilmoqda'].includes(o.status));
        else if (orderFilter === 'yetkazildi') list = list.filter(o => o.status === 'yetkazildi');
        const wrap = document.getElementById('ordersList'), empty = document.getElementById('emptyOrders');
        if (!list.length) { wrap.innerHTML = ''; empty.style.display = ''; return; }
        empty.style.display = 'none';
        wrap.innerHTML = list.map(o => {
            const first = data.products.find(p => p.id === (o.items[0] || {}).pid);
            const img = first ? cover(first) : bookCover(o.items[0]?.name || 'Kitob', '', '#7f1d2e', '#b91c3c');
            const st = o.status === 'yangi' ? 'jarayonda' : o.status;
            return `<div class="order-card" data-oid="${o.id}">
                <div class="oc-cover"><img src="${img}" alt=""></div>
                <div class="oc-info">
                    <div class="oc-name">${escapeHtml(o.items[0]?.name || 'Buyurtma')}</div>
                    <div class="oc-id">Buyurtma ID: ${o.id}</div>
                    <div class="oc-price">${money(o.total)}</div>
                </div>
                <span class="oc-badge ${st}">${STATUS_LABEL[o.status] || o.status}</span>
            </div>`;
        }).join('');
        wrap.querySelectorAll('.order-card').forEach(c => c.onclick = () => openOrderDetail(+c.dataset.oid));
    }
    document.querySelectorAll('#orderTabs .ftab').forEach(t => t.onclick = () => {
        document.querySelectorAll('#orderTabs .ftab').forEach(x => x.classList.remove('active'));
        t.classList.add('active'); orderFilter = t.dataset.ostatus; renderOrders();
    });

    function openOrderDetail(oid) {
        const o = data.orders.find(x => x.id === oid); if (!o) return;
        const steps = [
            { k: 'berildi', t: 'Buyurtma berildi', d: 'Buyurtmangiz muvaffaqiyatli qabul qilindi' },
            { k: 'tolov', t: 'To\'lov', d: 'To\'lovingiz muvaffaqiyatli amalga oshirildi' },
            { k: 'tasdiq', t: 'Tasdiqlandi', d: 'Buyurtmangiz tasdiqlandi. Tez orada yetkaziladi' },
            { k: 'jarayon', t: 'Jarayonda', d: 'Buyurtmangiz yetkazishga tayyorlanmoqda' },
            { k: 'yetkaz', t: 'Yetkazildi', d: 'Buyurtmangiz sizga yetkazildi' },
        ];
        const order = ['yangi', 'jarayonda', 'yetkazilmoqda', 'yetkazildi'];
        let reached = 3; // yangi -> first 2 done
        if (o.status === 'yangi') reached = 2;
        else if (o.status === 'jarayonda') reached = 4;
        else if (o.status === 'yetkazilmoqda') reached = 4;
        else if (o.status === 'yetkazildi') reached = 5;
        else if (o.status === 'bekor') reached = 2;
        document.getElementById('orderTimeline').innerHTML = steps.map((s, i) => {
            const done = i < reached;
            return `<div class="tl-item ${done ? 'done' : 'pending'}">
                <div class="tl-dot ${done ? 'done' : 'pending'}">${done ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>` : '<i></i>'}</div>
                <div class="tl-body"><div class="tl-head"><span class="tl-title">${s.t}</span></div><div class="tl-desc">${s.d}</div></div>
            </div>`;
        }).join('');
        document.getElementById('orderItems').innerHTML =
            o.items.map(i => `<div class="od-line"><span>${escapeHtml(i.name)} × ${i.qty}</span><b>${money(i.price * i.qty)}</b></div>`).join('')
            + `<div class="od-line"><span>Yetkazib berish</span><b>${money(SHIPPING_BASE)}</b></div>`
            + `<div class="od-line tot"><span>Jami</span><b>${money(o.total)}</b></div>`;
        showScreen('orderDetail');
    }
    document.getElementById('reviewBtn').onclick = () => toast('Sharhingiz uchun rahmat! ⭐', 'success');

    /* ---------- Search ---------- */
    const RECENT = ['San\'at tarixi', 'Roman', 'Informatika', 'Bolalar', 'She\'riyat', 'Ilmiy'];
    function renderRecent() {
        document.getElementById('recentTags').innerHTML = RECENT.map(t => `<button class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');
        document.querySelectorAll('#recentTags .tag').forEach(t => t.onclick = () => { document.getElementById('searchInput').value = t.dataset.tag; doSearch(t.dataset.tag); });
    }
    function renderReco() {
        const top = [...data.products].filter(p => p.active).sort((a, b) => b.rating - a.rating).slice(0, 6);
        document.getElementById('recoScroll').innerHTML = top.map(p => `<div class="pop-card" data-pid="${p.id}">
            <div class="pop-cover"><img src="${cover(p)}" alt=""></div>
            <div class="pop-meta"><div class="pop-info"><div class="pm-name">${escapeHtml(p.name)}</div><div class="reco-price">${money(p.price)} · ★ ${p.rating}</div></div></div>
        </div>`).join('');
    }
    function doSearch(q) {
        const def = document.getElementById('searchDefault'), res = document.getElementById('searchResults'), empty = document.getElementById('emptySearch');
        document.getElementById('searchClear').style.display = q ? '' : 'none';
        if (!q.trim()) { def.style.display = ''; res.style.display = 'none'; empty.style.display = 'none'; return; }
        def.style.display = 'none';
        const ql = q.toLowerCase();
        const list = data.products.filter(p => p.active && (p.name.toLowerCase().includes(ql) || (p.author || '').toLowerCase().includes(ql) || catName(p.category).toLowerCase().includes(ql)));
        if (!list.length) { res.style.display = 'none'; empty.style.display = ''; return; }
        empty.style.display = 'none'; res.style.display = '';
        res.innerHTML = list.map(bookCard).join('');
    }
    document.getElementById('searchInput').oninput = e => doSearch(e.target.value);
    document.getElementById('searchClear').onclick = () => { document.getElementById('searchInput').value = ''; doSearch(''); };

    /* ---------- Filter sheet ---------- */
    document.getElementById('filterBtn').onclick = () => {
        const authors = [...new Set(data.products.map(p => p.author).filter(Boolean))];
        document.getElementById('filterAuthors').innerHTML = authors.map(a => `<button class="tag ${fState.author === a ? 'active' : ''}" data-fauthor="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join('');
        document.getElementById('filterCats').innerHTML = [{ id: 'all', name: 'Hammasi' }, ...data.categories].map(c => `<button class="tag ${fState.cat === c.id ? 'active' : ''}" data-fcat="${c.id}">${escapeHtml(c.name)}</button>`).join('');
        document.getElementById('priceMin').value = fState.minPrice || '';
        document.getElementById('priceMax').value = fState.maxPrice || '';
        document.querySelectorAll('#rateRow .star').forEach(s => s.classList.toggle('on', +s.dataset.rate <= fState.rating));
        document.querySelectorAll('#filterSheet .ftab').forEach(t => t.classList.toggle('active', t.dataset.fsort === fState.sort || (fState.sort === 'new' && t.dataset.fsort === 'new')));
        openSheet('filterSheet');
    };
    document.querySelectorAll('#filterSheet .ftab').forEach(t => t.onclick = () => {
        document.querySelectorAll('#filterSheet .ftab').forEach(x => x.classList.remove('active')); t.classList.add('active'); fState.sort = t.dataset.fsort;
    });
    document.getElementById('filterAuthors').onclick = e => { const b = e.target.closest('[data-fauthor]'); if (!b) return; const a = b.dataset.fauthor; fState.author = fState.author === a ? null : a; document.querySelectorAll('#filterAuthors .tag').forEach(x => x.classList.toggle('active', x.dataset.fauthor === fState.author)); };
    document.getElementById('filterCats').onclick = e => { const b = e.target.closest('[data-fcat]'); if (!b) return; fState.cat = b.dataset.fcat; document.querySelectorAll('#filterCats .tag').forEach(x => x.classList.toggle('active', x.dataset.fcat === fState.cat)); };
    document.querySelectorAll('#rateRow .star').forEach(s => s.onclick = () => { fState.rating = fState.rating === +s.dataset.rate ? 0 : +s.dataset.rate; document.querySelectorAll('#rateRow .star').forEach(x => x.classList.toggle('on', +x.dataset.rate <= fState.rating)); });
    document.getElementById('filterApply').onclick = () => {
        fState.minPrice = +document.getElementById('priceMin').value || null;
        fState.maxPrice = +document.getElementById('priceMax').value || null;
        closeSheet(); goBase('home'); toast('Filtr qo\'llandi', 'success');
    };
    document.getElementById('filterReset').onclick = () => {
        fState = { cat: 'all', search: '', minPrice: null, maxPrice: null, sort: 'new', author: null, rating: 0 };
        closeSheet(); goBase('home'); toast('Filtr tozalandi', 'info');
    };

    /* ---------- Profil paneli ---------- */
    const PAY_LABEL = { naqd: 'Naqd pul (karta tez orada)', karta: 'Karta (Uzcard / Humo)', click: 'Click', payme: 'Payme' };
    function userInitials() { const n = (profile.name || 'Dilnoza Rahimova').trim().split(/\s+/); return ((n[0]?.[0] || '') + (n[1]?.[0] || '')).toUpperCase() || 'DR'; }
    function renderProfile() {
        document.getElementById('profAvatar').textContent = userInitials();
        document.getElementById('profName').textContent = profile.name || 'Dilnoza Rahimova';
        document.getElementById('profEmail').textContent = profile.email || profile.phone || 'dilnoza.r@mail.uz';
        document.getElementById('langVal').textContent = lang;
        const def = addresses.find(a => a.default) || addresses[0];
        document.getElementById('addrSub').textContent = addresses.length ? (def ? (def.name || 'Manzil') + ' · ' + (def.text || '').slice(0, 24) : addresses.length + ' ta manzil') : 'Yetkazib berish manzillari';
        document.getElementById('paySub').textContent = PAY_LABEL[payMethod] || 'Naqd pul';
    }
    document.getElementById('themeSwitch').onchange = e => applyTheme(e.target.checked);
    document.getElementById('helpRow').onclick = () => toast('Yordam: +998 90 123 45 67 · info@bookz.uz', 'info');
    document.getElementById('privacyRow').onclick = () => toast('Ma\'lumotlaringiz xavfsiz saqlanadi', 'info');

    /* ---------- Manzillarim ---------- */
    const saveAddrs = () => localStorage.setItem(ADDR_KEY, JSON.stringify(addresses));
    function renderAddrList() {
        const wrap = document.getElementById('addrList');
        if (!addresses.length) { wrap.innerHTML = `<div class="ai-empty"><div class="emp-ico">📍</div>Hozircha manzil yo'q<br>Yangi manzil qo'shing</div>`; return; }
        wrap.innerHTML = addresses.map((a, i) => `<div class="addr-item">
            <span class="ai-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
            <div class="ai-body"><div class="ai-name">${escapeHtml(a.name || 'Manzil')}${a.default ? '<span class="ai-badge">Asosiy</span>' : ''}</div><div class="ai-text">${escapeHtml(a.text || '')}</div></div>
            <div class="ai-acts">
                <button class="ai-btn" data-aedit="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="ai-btn del" data-adel="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div>
        </div>`).join('');
    }
    document.getElementById('addrRow').onclick = () => { renderAddrList(); openSheet('addrSheet'); };
    document.getElementById('addAddrBtn').onclick = () => openAddrForm(null);
    function openAddrForm(idx) {
        document.getElementById('addrFormTitle').textContent = idx == null ? 'Yangi manzil' : 'Manzilni tahrirlash';
        document.getElementById('addrId').value = idx == null ? '' : idx;
        const a = idx == null ? {} : addresses[idx];
        document.getElementById('addrName').value = a.name || '';
        const geo = document.getElementById('addrGeo');
        geo.innerHTML = window.UzAddress ? UzAddress.formHTML({ idPrefix: 'ba', inputClass: 'field', selectClass: 'field', labelClass: 'fl', fieldWrapOpen: '<div class="addr-fld">', fieldWrapClose: '</div>' }) : '';
        if (window.UzAddress) {
            UzAddress.bind(geo, { idPrefix: 'ba' });
            if (a.region) {
                const rs = geo.querySelector('#ba-region'); rs.value = a.region; rs.dispatchEvent(new Event('change'));
                const ds = geo.querySelector('#ba-district'); if (ds) ds.value = a.district || '';
                geo.querySelector('#ba-village').value = a.village || '';
                geo.querySelector('#ba-house').value = a.house || '';
                geo.querySelector('#ba-note').value = a.note || '';
            }
        }
        openSheet('addrFormSheet');
    }
    document.getElementById('saveAddrBtn').onclick = () => {
        const name = document.getElementById('addrName').value.trim() || 'Uy';
        const geo = document.getElementById('addrGeo');
        const res = window.UzAddress ? UzAddress.read(geo, { idPrefix: 'ba' }) : null;
        if (!res) { toast('Viloyat, tuman va uy raqamini to\'ldiring', 'error'); return; }
        const idx = document.getElementById('addrId').value;
        const obj = { name, region: res.region, district: res.district, village: res.village, house: res.house, note: res.note, text: res.text };
        if (idx === '') { obj.default = addresses.length === 0; addresses.push(obj); }
        else { obj.default = addresses[+idx].default; addresses[+idx] = obj; }
        saveAddrs(); renderProfile(); renderAddrList();
        toast('Manzil saqlandi', 'success'); openSheet('addrSheet');
    };
    document.getElementById('addrList').addEventListener('click', e => {
        const ed = e.target.closest('[data-aedit]'); if (ed) { openAddrForm(+ed.dataset.aedit); return; }
        const dl = e.target.closest('[data-adel]');
        if (dl) { const i = +dl.dataset.adel; const wasDef = addresses[i].default; addresses.splice(i, 1); if (wasDef && addresses.length) addresses[0].default = true; saveAddrs(); renderAddrList(); renderProfile(); toast('Manzil o\'chirildi', 'info'); }
    });

    /* ---------- To'lov usullari ---------- */
    document.getElementById('payRow').onclick = () => {
        document.querySelectorAll('#paySheet .pm-opt').forEach(o => o.classList.toggle('active', o.dataset.pay === payMethod));
        openSheet('paySheet');
    };
    document.querySelectorAll('#paySheet .pm-opt:not(.soon)').forEach(o => o.onclick = () => {
        payMethod = o.dataset.pay; localStorage.setItem('kitob_pay', payMethod);
        document.querySelectorAll('#paySheet .pm-opt').forEach(x => x.classList.toggle('active', x === o));
        renderProfile(); closeSheet(); toast('To\'lov usuli: Naqd pul', 'success');
    });

    /* ---------- Admin bilan chat ---------- */
    function renderChat() {
        const b = document.getElementById('chatBody');
        if (!chatMsgs.length) b.innerHTML = `<div class="msg them">Assalomu alaykum! Savolingiz bo'lsa yozing 😊</div>`;
        else b.innerHTML = `<div class="msg them">Assalomu alaykum! Savolingiz bo'lsa yozing 😊</div>` + chatMsgs.map(m => `<div class="msg ${m.from}">${escapeHtml(m.text)}</div>`).join('');
        b.scrollTop = b.scrollHeight;
    }
    document.getElementById('chatRow').onclick = () => { renderChat(); openSheet('chatSheet'); };
    document.getElementById('chatForm').onsubmit = e => {
        e.preventDefault();
        const inp = document.getElementById('chatInput'); const t = inp.value.trim(); if (!t) return;
        chatMsgs.push({ from: 'me', text: t }); inp.value = '';
        localStorage.setItem('kitob_chat', JSON.stringify(chatMsgs)); renderChat();
        setTimeout(() => { chatMsgs.push({ from: 'them', text: 'Rahmat! Tez orada javob beramiz.' }); localStorage.setItem('kitob_chat', JSON.stringify(chatMsgs)); renderChat(); }, 900);
    };

    function fillProfileForm() {
        document.getElementById('pfName').value = profile.name || 'Dilnoza Rahimova';
        document.getElementById('pfGender').value = profile.gender || 'Ayol';
        document.getElementById('pfBirth').value = profile.birth || '05.03.1996';
        document.getElementById('pfEmail').value = profile.email || 'dilnoza.r@mail.uz';
        document.getElementById('pfPhone').value = profile.phone || '+998 90 123 45 67';
    }
    document.getElementById('saveProfileBtn').onclick = () => {
        profile.name = document.getElementById('pfName').value.trim();
        profile.gender = document.getElementById('pfGender').value.trim();
        profile.birth = document.getElementById('pfBirth').value.trim();
        profile.email = document.getElementById('pfEmail').value.trim();
        profile.phone = document.getElementById('pfPhone').value.trim();
        saveProfile();
        renderProfile();
        showSuccess('Saqlandi', 'Profil ma\'lumotlaringiz yangilandi');
    };

    /* ---------- Language ---------- */
    let pendingLang = lang;
    function renderLang() {
        pendingLang = lang;
        document.querySelectorAll('#langList .lang-row').forEach(r => r.classList.toggle('selected', r.dataset.lang === lang));
    }
    document.querySelectorAll('#langList .lang-row').forEach(r => r.onclick = () => {
        pendingLang = r.dataset.lang;
        document.querySelectorAll('#langList .lang-row').forEach(x => x.classList.toggle('selected', x === r));
    });
    document.getElementById('langSearch').oninput = e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#langList .lang-row').forEach(r => r.style.display = r.dataset.lang.toLowerCase().includes(q) ? '' : 'none');
    };
    document.getElementById('saveLangBtn').onclick = () => { lang = pendingLang; localStorage.setItem(LANG_KEY, lang); document.getElementById('langVal').textContent = lang; toast('Til saqlandi: ' + lang, 'success'); goBack('profile'); };

    /* ---------- Logout ---------- */
    async function doLogout() {
        if (await showDialog({ title: 'Chiqish', message: 'Hisobdan chiqmoqchimisiz?', icon: '🚪', okText: 'Chiqish' })) {
            profile = {}; saveProfile(); renderProfile();
            goBase('home'); toast('Hisobdan chiqildi', 'info');
        }
    }
    document.getElementById('logoutBtn').onclick = doLogout;
    document.getElementById('bellBtn').onclick = () => toast('Yangi bildirishnomalar yo\'q', 'info');
    document.getElementById('menuReviews').onclick = () => toast('Sharhlar bo\'limi tez orada', 'info');
    document.getElementById('menuFindStore').onclick = () => toast(data.settings.address, 'info');
    document.getElementById('menuDelivery').onclick = () => toast('Yetkazib berish: 1-2 kun', 'info');

    /* ---------- Success modal ---------- */
    const successBg = document.getElementById('successBg');
    function showSuccess(title, msg) {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMsg').textContent = msg;
        successBg.classList.add('show');
    }
    document.getElementById('successClose').onclick = () => successBg.classList.remove('show');
    document.getElementById('successBack').onclick = () => { successBg.classList.remove('show'); goBack('settings'); };
    document.getElementById('successNext').onclick = () => successBg.classList.remove('show');
    successBg.onclick = e => { if (e.target === successBg) successBg.classList.remove('show'); };

    /* ---------- Global delegated clicks (add / open detail / cart qty) ---------- */
    document.addEventListener('click', e => {
        const add = e.target.closest('[data-add]');
        if (add) { e.stopPropagation(); addToCart(add.dataset.add); return; }
        const inc = e.target.closest('[data-cinc]');
        if (inc) { const c = cart.find(x => x.id === +inc.dataset.cinc); const p = data.products.find(x => x.id === +inc.dataset.cinc); if (c && (!p || c.qty < p.stock)) { c.qty++; saveCart(); renderCart(); } return; }
        const dec = e.target.closest('[data-cdec]');
        if (dec) { const c = cart.find(x => x.id === +dec.dataset.cdec); if (c) { c.qty--; if (c.qty <= 0) cart = cart.filter(x => x.id !== c.id); saveCart(); renderCart(); } return; }
        const rem = e.target.closest('[data-crem]');
        if (rem) { cart = cart.filter(x => x.id !== +rem.dataset.crem); saveCart(); renderCart(); return; }
        const pcard = e.target.closest('[data-pid]');
        if (pcard) openDetail(pcard.dataset.pid);
    });

    /* ---------- Init ---------- */
    updateCartBadge();
    showScreen('home', false);
});
