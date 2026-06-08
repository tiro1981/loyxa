/* ============================================
   MODA STYLE — Storefront Script (v1.1)
   ============================================ */

const STORE_KEY = 'moda_store_v1';
const CART_KEY = 'moda_cart_v1';
const INSTALL_DISMISS_KEY = 'moda_install_dismissed';

/* ============ PWA: Service Worker ============ */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}

/* ============ PWA: Install Prompt ============ */
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const dismissed = localStorage.getItem(INSTALL_DISMISS_KEY);
    if (dismissed && (Date.now() - +dismissed) < 7 * 86400000) return;
    const prompt = document.getElementById('installPrompt');
    if (prompt) setTimeout(() => prompt.classList.add('show'), 2500);
});

window.addEventListener('appinstalled', () => {
    const prompt = document.getElementById('installPrompt');
    if (prompt) prompt.classList.remove('show');
    if (typeof toast === 'function') toast('Ilova o\'rnatildi! 🎉', 'success');
});

document.addEventListener('DOMContentLoaded', () => {
    const ipInstall = document.getElementById('ipInstall');
    const ipClose = document.getElementById('ipClose');
    const prompt = document.getElementById('installPrompt');
    if (ipInstall) ipInstall.onclick = async () => {
        if (!deferredInstallPrompt) {
            toast('Brauzer menyusidan "Bosh ekranga qo\'shish" ni tanlang', 'info');
            return;
        }
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') prompt.classList.remove('show');
        deferredInstallPrompt = null;
    };
    if (ipClose) ipClose.onclick = () => {
        prompt.classList.remove('show');
        localStorage.setItem(INSTALL_DISMISS_KEY, Date.now() + '');
    };
});

/* ---------- Default Demo Data ---------- */
const DEFAULT_DATA = {
    products: [
        { id: 1, name: "Klassik oq ko'ylak", category: "erkaklar", price: 285000, oldPrice: 350000, stock: 24, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600", sizes: ["S","M","L","XL"], colors: ["#ffffff","#e5e7eb"], desc: "Yuqori sifatli paxtadan tikilgan klassik oq ko'ylak. Ofis va rasmiy tadbirlar uchun ideal tanlov.", active: true, sold: 142, created: "2026-04-12" },
        { id: 2, name: "Qora teri kurtka", category: "erkaklar", price: 1450000, oldPrice: null, stock: 12, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600", sizes: ["M","L","XL","XXL"], colors: ["#000000","#3f3f46"], desc: "Sof teridan tikilgan zamonaviy kurtka. Qish va kuz uchun mos.", active: true, sold: 87, created: "2026-03-22" },
        { id: 3, name: "Jeans shimi slim-fit", category: "erkaklar", price: 320000, oldPrice: 420000, stock: 38, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", sizes: ["28","30","32","34","36"], colors: ["#1e3a8a","#000000"], desc: "Slim-fit ko'rinishidagi sifatli jeans shim.", active: true, sold: 215, created: "2026-04-01" },
        { id: 4, name: "Gulli yozgi ko'ylak", category: "ayollar", price: 245000, oldPrice: 290000, stock: 18, image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600", sizes: ["XS","S","M","L"], colors: ["#fda4af","#fde047"], desc: "Engil va qulay yozgi ko'ylak. Gulli naqshli.", active: true, sold: 178, created: "2026-04-18" },
        { id: 5, name: "Elegant kechki libos", category: "ayollar", price: 890000, oldPrice: null, stock: 8, image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600", sizes: ["XS","S","M","L"], colors: ["#000000","#7c2d12"], desc: "Maxsus tadbirlar uchun elegant kechki libos.", active: true, sold: 56, created: "2026-03-05" },
        { id: 6, name: "Trikotaj sviter", category: "ayollar", price: 380000, oldPrice: null, stock: 22, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600", sizes: ["S","M","L"], colors: ["#f5f5dc","#d4d4d8","#fda4af"], desc: "Yumshoq va issiq trikotaj sviter.", active: true, sold: 112, created: "2026-02-20" },
        { id: 7, name: "Bolalar futbolkasi", category: "bolalar", price: 89000, oldPrice: 120000, stock: 45, image: "https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=600", sizes: ["3-4","5-6","7-8","9-10"], colors: ["#3b82f6","#ef4444","#22c55e"], desc: "100% paxta, bolalar uchun qulay futbolka.", active: true, sold: 320, created: "2026-04-25" },
        { id: 8, name: "Bolalar sport kostyumi", category: "bolalar", price: 290000, oldPrice: null, stock: 16, image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600", sizes: ["5-6","7-8","9-10","11-12"], colors: ["#1e40af","#374151"], desc: "Bolalar uchun qulay sport kostyumi.", active: true, sold: 89, created: "2026-03-15" },
        { id: 9, name: "Nike krossovkalari", category: "poyabzal", price: 980000, oldPrice: 1150000, stock: 20, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", sizes: ["39","40","41","42","43","44"], colors: ["#ffffff","#000000","#dc2626"], desc: "Original Nike sport krossovkalari.", active: true, sold: 198, created: "2026-04-08" },
        { id: 10, name: "Ayollar baland poshnali tuflisi", category: "poyabzal", price: 520000, oldPrice: null, stock: 14, image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600", sizes: ["36","37","38","39","40"], colors: ["#000000","#dc2626","#fbbf24"], desc: "Elegant baland poshnali tufli.", active: true, sold: 76, created: "2026-03-28" },
        { id: 11, name: "Erkak charm tuflisi", category: "poyabzal", price: 680000, oldPrice: 820000, stock: 18, image: "https://images.unsplash.com/photo-1614252369475-531eba835c4d?w=600", sizes: ["40","41","42","43","44"], colors: ["#1c1917","#78350f"], desc: "Klassik charm tufli, ofis uchun.", active: true, sold: 124, created: "2026-02-10" },
        { id: 12, name: "Charm sumka", category: "aksessuar", price: 450000, oldPrice: null, stock: 11, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600", sizes: ["Standart"], colors: ["#1c1917","#a16207"], desc: "Sifatli charm ayollar sumkasi.", active: true, sold: 92, created: "2026-04-15" },
        { id: 13, name: "Kuyov uchun galstuk", category: "aksessuar", price: 120000, oldPrice: 160000, stock: 30, image: "https://images.unsplash.com/photo-1606509036041-bc59b6e64f7e?w=600", sizes: ["Standart"], colors: ["#7c2d12","#1e3a8a","#000000"], desc: "Ipakdan tikilgan elegant galstuk.", active: true, sold: 145, created: "2026-03-12" },
        { id: 14, name: "Quyosh ko'zoynagi", category: "aksessuar", price: 180000, oldPrice: null, stock: 27, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600", sizes: ["Standart"], colors: ["#000000","#92400e"], desc: "UV himoyali quyosh ko'zoynagi.", active: true, sold: 168, created: "2026-04-22" },
        { id: 15, name: "Charm kamar", category: "aksessuar", price: 145000, oldPrice: 195000, stock: 35, image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600", sizes: ["S","M","L","XL"], colors: ["#1c1917","#78350f"], desc: "Sifatli charm kamar, erkaklar uchun.", active: true, sold: 210, created: "2026-02-28" },
        { id: 16, name: "Sport futbolkasi", category: "erkaklar", price: 165000, oldPrice: null, stock: 0, image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600", sizes: ["M","L","XL"], colors: ["#1e40af","#000000"], desc: "Nafas oluvchi sport futbolkasi.", active: false, sold: 67, created: "2026-01-15" },
    ],

    orders: [
        { id: 1001, customerId: 1, name: "Aliyev Akmal", phone: "+998901234567", address: "Toshkent, Chilonzor 12", items: [{ pid: 1, name: "Klassik oq ko'ylak", qty: 2, price: 285000, size: "L" },{ pid: 13, name: "Kuyov uchun galstuk", qty: 1, price: 120000, size: "Standart" }], total: 690000, payment: "karta", status: "yetkazildi", note: "", date: "2026-05-18" },
        { id: 1002, customerId: 2, name: "Karimova Madina", phone: "+998935551122", address: "Samarqand, Markaziy ko'cha 8", items: [{ pid: 5, name: "Elegant kechki libos", qty: 1, price: 890000, size: "M" }], total: 890000, payment: "click", status: "jarayonda", note: "Tezda yetkazib bering", date: "2026-05-19" },
        { id: 1003, customerId: 3, name: "Toshmatov Bobur", phone: "+998901112233", address: "Buxoro, Mustaqillik 45", items: [{ pid: 9, name: "Nike krossovkalari", qty: 1, price: 980000, size: "42" },{ pid: 3, name: "Jeans shimi slim-fit", qty: 1, price: 320000, size: "32" }], total: 1300000, payment: "karta", status: "yetkazilmoqda", note: "", date: "2026-05-20" },
        { id: 1004, customerId: 4, name: "Yusupova Nilufar", phone: "+998977778899", address: "Toshkent, Yunusobod 3", items: [{ pid: 4, name: "Gulli yozgi ko'ylak", qty: 1, price: 245000, size: "S" },{ pid: 12, name: "Charm sumka", qty: 1, price: 450000, size: "Standart" }], total: 695000, payment: "naqd", status: "yangi", note: "", date: "2026-05-21" },
        { id: 1005, customerId: 5, name: "Xolmatov Sardor", phone: "+998931234455", address: "Andijon, Bobur ko'chasi 21", items: [{ pid: 2, name: "Qora teri kurtka", qty: 1, price: 1450000, size: "L" }], total: 1450000, payment: "karta", status: "yangi", note: "Qadoqlash maxsus", date: "2026-05-21" },
        { id: 1006, customerId: 6, name: "Rahimova Zilola", phone: "+998901119988", address: "Farg'ona, Al-Forobiy 7", items: [{ pid: 10, name: "Ayollar baland poshnali tuflisi", qty: 1, price: 520000, size: "38" }], total: 520000, payment: "click", status: "yetkazildi", note: "", date: "2026-05-15" },
        { id: 1007, customerId: 7, name: "Nazarov Jasur", phone: "+998935557766", address: "Namangan, Yangi yo'l 15", items: [{ pid: 11, name: "Erkak charm tuflisi", qty: 1, price: 680000, size: "42" },{ pid: 15, name: "Charm kamar", qty: 1, price: 145000, size: "L" }], total: 825000, payment: "naqd", status: "yetkazildi", note: "", date: "2026-05-14" },
        { id: 1008, customerId: 8, name: "Saidova Gulnoza", phone: "+998901234511", address: "Toshkent, Mirzo Ulug'bek 9", items: [{ pid: 6, name: "Trikotaj sviter", qty: 2, price: 380000, size: "M" }], total: 760000, payment: "karta", status: "jarayonda", note: "", date: "2026-05-20" },
        { id: 1009, customerId: 9, name: "Tursunov Oybek", phone: "+998935551199", address: "Qashqadaryo, Karshi 5", items: [{ pid: 7, name: "Bolalar futbolkasi", qty: 3, price: 89000, size: "7-8" },{ pid: 8, name: "Bolalar sport kostyumi", qty: 1, price: 290000, size: "9-10" }], total: 557000, payment: "click", status: "yangi", note: "", date: "2026-05-21" },
        { id: 1010, customerId: 10, name: "Mirzayeva Sevara", phone: "+998901188822", address: "Toshkent, Yashnobod 14", items: [{ pid: 14, name: "Quyosh ko'zoynagi", qty: 2, price: 180000, size: "Standart" }], total: 360000, payment: "naqd", status: "bekor", note: "Mijoz bekor qildi", date: "2026-05-12" },
    ],

    customers: [
        { id: 1, name: "Aliyev Akmal", email: "akmal.aliyev@mail.uz", phone: "+998901234567", address: "Toshkent, Chilonzor 12", joined: "2025-11-10", active: true },
        { id: 2, name: "Karimova Madina", email: "madina.karimova@gmail.com", phone: "+998935551122", address: "Samarqand, Markaziy ko'cha 8", joined: "2025-12-04", active: true },
        { id: 3, name: "Toshmatov Bobur", email: "bobur.t@mail.ru", phone: "+998901112233", address: "Buxoro, Mustaqillik 45", joined: "2026-01-15", active: true },
        { id: 4, name: "Yusupova Nilufar", email: "nilufar.y@gmail.com", phone: "+998977778899", address: "Toshkent, Yunusobod 3", joined: "2026-01-22", active: true },
        { id: 5, name: "Xolmatov Sardor", email: "sardor.x@mail.uz", phone: "+998931234455", address: "Andijon, Bobur ko'chasi 21", joined: "2026-02-08", active: true },
    ],

    categories: [
        { id: 'erkaklar', name: "Erkaklar", icon: "👔", desc: "Erkaklar uchun kiyim-kechak", active: true },
        { id: 'ayollar', name: "Ayollar", icon: "👗", desc: "Ayollar uchun kiyim-kechak", active: true },
        { id: 'bolalar', name: "Bolalar", icon: "🧒", desc: "Bolalar uchun kiyim", active: true },
        { id: 'poyabzal', name: "Poyabzal", icon: "👟", desc: "Turli xil poyabzallar", active: true },
        { id: 'aksessuar', name: "Aksessuar", icon: "👜", desc: "Sumkalar, kamarlar va boshqalar", active: true },
    ],

    coupons: [
        { id: 1, code: "YANGI10", type: "percent", value: 10, maxUses: 100, used: 23, expires: "2026-12-31", active: true },
        { id: 2, code: "SUMMER20", type: "percent", value: 20, maxUses: 50, used: 12, expires: "2026-08-31", active: true },
        { id: 3, code: "VIP30", type: "percent", value: 30, maxUses: 20, used: 7, expires: "2026-07-15", active: true },
        { id: 4, code: "FREESHIP", type: "fixed", value: 30000, maxUses: 200, used: 89, expires: "2026-06-30", active: true },
    ],

    settings: {
        storeName: "Moda Style",
        address: "Toshkent sh., Amir Temur ko'chasi 42",
        phone: "+998 90 123 45 67",
        email: "info@modastyle.uz",
        workHours: "Dush-Yak: 09:00 - 21:00",
        payments: { naqd: true, uzcard: true, payme: true, click: true },
        shipping: [
            { zone: "Toshkent shahri", price: 25000 },
            { zone: "Toshkent viloyati", price: 40000 },
            { zone: "Boshqa viloyatlar", price: 60000 },
        ],
    },

    // Foydalanuvchi <-> Admin chat suhbatlari
    chats: [],
};

/* ---------- Uzbekistan regions & districts ---------- */
const UZ_REGIONS = {
    "Toshkent shahri": ["Bektemir", "Chilonzor", "Mirobod", "Mirzo Ulug'bek", "Olmazor", "Sergeli", "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yashnobod", "Yangihayot", "Yunusobod"],
    "Toshkent viloyati": ["Angren", "Bekobod", "Bo'ka", "Bo'stonliq", "Chinoz", "Nurafshon", "Ohangaron", "Olmaliq", "Parkent", "Piskent", "Quyichirchiq", "Yangiyo'l", "Yuqorichirchiq", "Zangiota"],
    "Andijon viloyati": ["Andijon shahri", "Asaka", "Baliqchi", "Bo'z", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinko'l", "Paxtaobod", "Qo'rg'ontepa", "Shahrixon", "Ulug'nor", "Xo'jaobod"],
    "Buxoro viloyati": ["Buxoro shahri", "G'ijduvon", "Jondor", "Kogon", "Olot", "Peshku", "Qorako'l", "Qorovulbozor", "Romitan", "Shofirkon", "Vobkent"],
    "Farg'ona viloyati": ["Farg'ona shahri", "Bag'dod", "Beshariq", "Buvayda", "Dang'ara", "Furqat", "Marg'ilon", "Oltiariq", "Qo'qon", "Quva", "Quvasoy", "Rishton", "So'x", "Toshloq", "Uchko'prik", "Yozyovon", "O'zbekiston"],
    "Jizzax viloyati": ["Jizzax shahri", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Mirzacho'l", "Paxtakor", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin"],
    "Xorazm viloyati": ["Urganch", "Bog'ot", "Gurlan", "Hazorasp", "Xiva", "Xonqa", "Qo'shko'pir", "Shovot", "Yangiariq", "Yangibozor"],
    "Namangan viloyati": ["Namangan shahri", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"],
    "Navoiy viloyati": ["Navoiy shahri", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi", "Zarafshon"],
    "Qashqadaryo viloyati": ["Qarshi", "Chiroqchi", "Dehqonobod", "G'uzor", "Kasbi", "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Shahrisabz", "Yakkabog'"],
    "Qoraqalpog'iston Respublikasi": ["Nukus", "Amudaryo", "Beruniy", "Chimboy", "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Qanliko'l", "Qo'ng'irot", "Qorao'zak", "Shumanay", "Taxiatosh", "Taxtako'pir", "To'rtko'l", "Xo'jayli"],
    "Samarqand viloyati": ["Samarqand shahri", "Bulung'ur", "Ishtixon", "Jomboy", "Kattaqo'rg'on", "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Payariq", "Pastdarg'om", "Qo'shrabot", "Toyloq", "Urgut"],
    "Sirdaryo viloyati": ["Guliston", "Boyovut", "Mirzaobod", "Oqoltin", "Sayxunobod", "Sardoba", "Shirin", "Xovos", "Yangiyer"],
    "Surxondaryo viloyati": ["Termiz", "Angor", "Bandixon", "Boysun", "Denov", "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Qiziriq", "Qumqo'rg'on", "Sariosiyo", "Sherobod", "Sho'rchi", "Uzun"],
};

/* ---------- Storage ---------- */
const Store = {
    load() {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) {
            this.save(DEFAULT_DATA);
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
        try {
            const parsed = JSON.parse(raw);
            // Ensure required keys exist (forward-compatible)
            return { ...DEFAULT_DATA, ...parsed };
        } catch {
            this.save(DEFAULT_DATA);
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    },
    save(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); },
    reset() { localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULT_DATA)); },
    clear() { localStorage.removeItem(STORE_KEY); localStorage.removeItem(CART_KEY); }
};

/* ---------- Utilities ---------- */
function money(n) {
    if (n == null || isNaN(n)) return "0 so'm";
    return Math.round(n).toLocaleString('en-US').replace(/,/g, ' ') + " so'm";
}
function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function toast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.className = 'toast ' + type;
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ---------- Telegram bot xabarnomasi (admin panelda ulangan bo'lsa) ---------- */
function notifyTelegramBot(order) {
    try {
        const cfg = JSON.parse(localStorage.getItem('moda_bot_config') || 'null');
        if (!cfg || !cfg.token) return;
        const SHOP_KEY = (new URLSearchParams(location.search).get('client') || (() => { try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; } })() || 'shop') + '__kiyim';
        const BOT_HTTP = (localStorage.getItem('bo_bot_api') || localStorage.getItem('moda_bot_http_url') || 'http://localhost:3344').replace(/\/+$/, '');
        fetch(`${BOT_HTTP}/store-bot/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: SHOP_KEY,
                order: {
                    id: String(order.id),
                    userName: order.name,
                    phone: order.phone,
                    address: order.address,
                    items: (order.items || []).map(i => ({
                        name: i.name + (i.size ? ' (' + i.size + ')' : ''),
                        qty: i.qty,
                        price: i.price,
                    })),
                    total: order.total,
                }
            })
        })
            .then(r => r.json().catch(() => ({ ok: false })))
            .then(res => {
                if (res && res.ok) {
                    cfg.sentCount = (cfg.sentCount || 0) + 1;
                    localStorage.setItem('moda_bot_config', JSON.stringify(cfg));
                } else {
                    console.warn('[bot] yuborilmadi:', res && res.error);
                }
            })
            .catch(err => console.warn('[bot] HTTP xato (3344):', err.message));
    } catch (e) {
        console.warn('notifyTelegramBot error:', e);
    }
}

/* ---------- Custom confirm dialog (replaces window.confirm) ---------- */
function showDialog({ title = 'Tasdiqlash', message = '', icon = '⚠️', okText = 'Tasdiqlash', cancelText = 'Bekor qilish', danger = false } = {}) {
    return new Promise(resolve => {
        const bg = document.getElementById('dialogBg');
        if (!bg) return resolve(false);
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMsg').textContent = message;
        document.getElementById('dialogIco').textContent = icon;
        const ok = document.getElementById('dialogOk');
        const cancel = document.getElementById('dialogCancel');
        ok.textContent = okText;
        cancel.textContent = cancelText;
        ok.style.background = danger ? 'var(--danger)' : '';
        ok.style.color = danger ? '#fff' : '';
        bg.classList.add('show');
        const done = val => {
            bg.classList.remove('show');
            ok.onclick = null;
            cancel.onclick = null;
            bg.onclick = null;
            ok.style.background = '';
            ok.style.color = '';
            resolve(val);
        };
        ok.onclick = () => done(true);
        cancel.onclick = () => done(false);
        bg.onclick = e => { if (e.target === bg) done(false); };
    });
}

/* ============================================
   STOREFRONT (runs only on index.html)
   ============================================ */
if (document.querySelector('.app .screen[data-screen="home"]')) {
    const FAV_KEY = 'moda_favs_v1';
    const PROFILE_KEY = 'moda_profile_v1';
    const ADDR_KEY = 'moda_addrs_v1';
    const THEME_KEY = 'moda_theme';
    const NOTIF_KEY = 'moda_notif_seen';
    const PROMO_KEY = 'moda_promo';
    const SHIPPING_BASE = 25000;

    let data = Store.load();
    let cart = safeParse(CART_KEY, []);
    let favorites = safeParse(FAV_KEY, []);
    let profile = safeParse(PROFILE_KEY, {});
    let addresses = safeParse(ADDR_KEY, []);
    let activePromo = safeParse(PROMO_KEY, null);

    function safeParse(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }

    let fState = { cat: 'all', search: '', minPrice: null, maxPrice: null, sort: 'new' };
    let orderStatusFilter = 'all';
    let currentScreen = 'home';

    /* ---------- Persist helpers ---------- */
    const saveCart = () => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); };
    const saveFavs = () => { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); updateProfileStats(); };
    const saveProfile = () => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); renderProfile(); };
    const saveAddrs = () => { localStorage.setItem(ADDR_KEY, JSON.stringify(addresses)); renderAddresses(); updateAddressCount(); };
    const savePromo = () => {
        if (activePromo) localStorage.setItem(PROMO_KEY, JSON.stringify(activePromo));
        else localStorage.removeItem(PROMO_KEY);
    };

    /* ---------- Theme ---------- */
    function applyTheme(dark) {
        document.documentElement.classList.toggle('dark', dark);
        document.body.classList.toggle('dark', dark);
        document.getElementById('themeSwitch').checked = dark;
        document.getElementById('themeLabel').textContent = dark ? 'Qorong\'i rejim yoqilgan' : 'Yoritilgan rejim';
        localStorage.setItem(THEME_KEY, dark ? '1' : '0');
    }
    applyTheme(localStorage.getItem(THEME_KEY) === '1');

    /* ---------- Screen navigation ---------- */
    const NAV_ORDER = ['home', 'cart', 'orders', 'profile'];
    function switchScreen(name) {
        currentScreen = name;
        document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
        document.querySelectorAll('.bn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
        // Sliding pill indicator
        const inner = document.querySelector('.bnav-inner');
        if (inner) inner.style.setProperty('--active', NAV_ORDER.indexOf(name));
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (name === 'cart') renderCart();
        if (name === 'orders') renderOrders();
        if (name === 'profile') renderProfile();
    }
    document.querySelectorAll('.bn').forEach(b => b.onclick = () => switchScreen(b.dataset.nav));
    document.querySelectorAll('[data-go]').forEach(el => el.onclick = () => switchScreen(el.dataset.go));

    /* ---------- Sheets ---------- */
    const sheetBg = document.getElementById('sheetBg');
    function openSheet(id) {
        document.querySelectorAll('.sheet').forEach(s => s.classList.remove('show'));
        const sheet = document.getElementById(id);
        if (!sheet) return;
        sheet.classList.add('show');
        sheetBg.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeSheet() {
        document.querySelectorAll('.sheet').forEach(s => s.classList.remove('show'));
        sheetBg.classList.remove('show');
        document.body.style.overflow = '';
    }
    sheetBg.onclick = closeSheet;
    document.querySelectorAll('[data-close-sheet]').forEach(b => b.onclick = closeSheet);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

    /* ============ CATEGORY CHIPS ============ */
    function renderChips() {
        const wrap = document.getElementById('catChips');
        const cats = [{ id: 'all', name: 'Hammasi', icon: '✨' }, ...data.categories.filter(c => c.active !== false)];
        wrap.innerHTML = cats.map(c => `
            <button class="chip ${c.id === fState.cat ? 'active' : ''}" data-chip="${c.id}">
                <span>${c.icon || ''}</span> ${c.name}
            </button>`).join('');
        wrap.querySelectorAll('.chip').forEach(c => c.onclick = () => {
            fState.cat = c.dataset.chip;
            renderChips();
            renderProductGrid();
            updateFilterIndicator();
        });
    }

    /* ============ PRODUCTS ============ */
    function getFilteredProducts() {
        let list = data.products.filter(p => p.active);
        if (fState.cat !== 'all') list = list.filter(p => p.category === fState.cat);
        if (fState.search) {
            const q = fState.search.toLowerCase().trim();
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.desc || '').toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }
        if (fState.minPrice) list = list.filter(p => p.price >= fState.minPrice);
        if (fState.maxPrice) list = list.filter(p => p.price <= fState.maxPrice);

        switch (fState.sort) {
            case 'price-asc': list.sort((a,b) => a.price - b.price); break;
            case 'price-desc': list.sort((a,b) => b.price - a.price); break;
            case 'popular': list.sort((a,b) => b.sold - a.sold); break;
            default: list.sort((a,b) => new Date(b.created) - new Date(a.created));
        }
        return list;
    }

    function escapeHtml(s) {
        return (s ?? '').toString().replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function productCard(p) {
        const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        const isFav = favorites.includes(p.id);
        const outOfStock = p.stock === 0;
        return `
            <div class="p-card" data-pid="${p.id}">
                <div class="p-img">
                    ${discount ? `<span class="p-discount">-${discount}%</span>` : ''}
                    <button class="p-fav ${isFav ? 'on' : ''}" data-fav="${p.id}" aria-label="Sevimli">${isFav ? '❤️' : '🤍'}</button>
                    <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
                    ${outOfStock ? '<div class="p-stockout">Tugagan</div>' : ''}
                </div>
                <div class="p-body">
                    <div class="p-cat">${escapeHtml(p.category)}</div>
                    <div class="p-name">${escapeHtml(p.name)}</div>
                    <div class="p-row">
                        <div class="p-prices">
                            <span class="p-price">${money(p.price)}</span>
                            ${p.oldPrice ? `<span class="p-old">${money(p.oldPrice)}</span>` : ''}
                        </div>
                        ${outOfStock ? '' : `<button class="p-add" data-add="${p.id}" aria-label="Qo'shish">+</button>`}
                    </div>
                </div>
            </div>`;
    }

    function renderProductGrid() {
        const list = getFilteredProducts();
        const grid = document.getElementById('productGrid');
        const empty = document.getElementById('emptyHome');
        document.getElementById('gridCount').textContent = list.length;
        if (list.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            grid.innerHTML = list.map(productCard).join('');
        }
    }

    function renderTrending() {
        const top = [...data.products].filter(p => p.active && p.stock > 0).sort((a,b) => b.sold - a.sold).slice(0, 8);
        document.getElementById('trendingScroll').innerHTML = top.map(p => `
            <div class="trend-card" data-pid="${p.id}">
                <div class="img">
                    <span class="fire-badge">🔥 Hit</span>
                    <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
                </div>
                <div class="body">
                    <h4>${escapeHtml(p.name)}</h4>
                    <div class="price">${money(p.price)}</div>
                </div>
            </div>`).join('');
    }

    /* ============ PRODUCT DETAIL ============ */
    function openProductDetail(id) {
        const p = data.products.find(x => x.id === id);
        if (!p) return;
        const imgs = (Array.isArray(p.images) && p.images.length) ? p.images : (p.image ? [p.image] : []);
        const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        const isFav = favorites.includes(p.id);
        const sizesHtml = (p.sizes || []).map((s,i) => `<button class="size-btn ${i===0?'active':''}" data-size="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');
        const colorsHtml = (p.colors || []).map((c,i) => `<button class="color-dot ${i===0?'active':''}" data-color="${c}" style="background:${c}"></button>`).join('');
        const outOfStock = p.stock === 0;

        document.getElementById('productDetail').innerHTML = `
            <div class="sheet-body">
                <div class="pd-gallery">
                    <button class="pd-fav ${isFav ? 'on' : ''}" data-fav="${p.id}">${isFav ? '❤️' : '🤍'}</button>
                    <div class="pd-slider" id="pdSlider">
                        ${imgs.map(src => `<div class="pd-slide"><img src="${src}" alt="${escapeHtml(p.name)}" draggable="false"></div>`).join('')}
                    </div>
                    ${imgs.length > 1 ? `<span class="pd-count" id="pdCount">1 / ${imgs.length}</span>` : ''}
                    ${imgs.length > 1 ? `<div class="pd-dots" id="pdDots">${imgs.map((_, i) => `<span class="pd-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></span>`).join('')}</div>` : ''}
                </div>
                <div class="pd-cat">${escapeHtml(p.category)}</div>
                <h2 class="pd-name">${escapeHtml(p.name)}</h2>
                <div class="pd-prices">
                    <span class="pd-price">${money(p.price)}</span>
                    ${p.oldPrice ? `<span class="pd-old">${money(p.oldPrice)}</span>` : ''}
                    ${discount ? `<span class="pd-discount">-${discount}%</span>` : ''}
                </div>
                ${sizesHtml ? `<div class="pd-section"><h4>O'lcham</h4><div class="size-row">${sizesHtml}</div></div>` : ''}
                ${colorsHtml ? `<div class="pd-section"><h4>Rang</h4><div class="color-row">${colorsHtml}</div></div>` : ''}
                <div class="pd-section">
                    <h4>Tavsif</h4>
                    <p class="pd-desc">${escapeHtml(p.desc || 'Tavsif mavjud emas.')}</p>
                </div>
                <div class="pd-section">
                    <p style="font-size:12px;color:var(--text-muted)">Zaxirada: ${p.stock} dona • Sotilgan: ${p.sold} ta</p>
                </div>
            </div>
            <div class="sheet-foot">
                <button class="btn-primary full" id="addFromDetail" ${outOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                    ${outOfStock ? 'Mahsulot tugagan' : 'Savatga qo\'shish'}
                </button>
            </div>`;
        openSheet('productSheet');

        // Rasm galereyasi — yonga surish (swipe) + nuqtalar
        const slider = document.getElementById('pdSlider');
        if (slider && imgs.length > 1) {
            const dots = [...document.querySelectorAll('#pdDots .pd-dot')];
            const countEl = document.getElementById('pdCount');
            const sync = () => {
                const i = Math.round(slider.scrollLeft / slider.clientWidth);
                dots.forEach((d, k) => d.classList.toggle('active', k === i));
                if (countEl) countEl.textContent = `${Math.min(i + 1, imgs.length)} / ${imgs.length}`;
            };
            slider.addEventListener('scroll', sync, { passive: true });
            dots.forEach((d, k) => d.onclick = () => slider.scrollTo({ left: k * slider.clientWidth, behavior: 'smooth' }));
            // Desktop: sichqoncha bilan ham surish
            let down = false, startX = 0, startScroll = 0, moved = false;
            slider.addEventListener('pointerdown', e => { down = true; moved = false; startX = e.clientX; startScroll = slider.scrollLeft; });
            slider.addEventListener('pointermove', e => {
                if (!down) return;
                const dx = e.clientX - startX;
                if (Math.abs(dx) > 4) moved = true;
                slider.scrollLeft = startScroll - dx;
            });
            const endDrag = () => {
                if (!down) return; down = false;
                if (moved) slider.scrollTo({ left: Math.round(slider.scrollLeft / slider.clientWidth) * slider.clientWidth, behavior: 'smooth' });
            };
            slider.addEventListener('pointerup', endDrag);
            slider.addEventListener('pointerleave', endDrag);
        }

        document.querySelectorAll('#productDetail .size-btn').forEach(b => b.onclick = () => {
            document.querySelectorAll('#productDetail .size-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
        });
        document.querySelectorAll('#productDetail .color-dot').forEach(c => c.onclick = () => {
            document.querySelectorAll('#productDetail .color-dot').forEach(x => x.classList.remove('active'));
            c.classList.add('active');
        });
        const addBtn = document.getElementById('addFromDetail');
        if (addBtn && !outOfStock) addBtn.onclick = () => {
            const size = document.querySelector('#productDetail .size-btn.active')?.dataset.size || '';
            addToCart(p.id, size);
            closeSheet();
        };
    }

    /* ============ CART ============ */
    function addToCart(id, size = '') {
        const p = data.products.find(x => x.id === id);
        if (!p) return;
        if (p.stock === 0) { toast('Mahsulot tugagan', 'error'); return; }
        const sz = size || (p.sizes && p.sizes[0]) || '';
        const existing = cart.find(c => c.id === id && c.size === sz);
        if (existing) {
            if (existing.qty >= p.stock) { toast('Zaxira yetarli emas', 'error'); return; }
            existing.qty += 1;
        } else {
            cart.push({ id, name: p.name, price: p.price, image: p.image, size: sz, qty: 1 });
        }
        saveCart();
        toast(p.name + " savatga qo'shildi", 'success');
    }

    function updateCartBadge() {
        const count = cart.reduce((s, i) => s + i.qty, 0);
        const badge = document.getElementById('cartBadge');
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.toggle('show', count > 0);
    }

    function calcDiscount(sub) {
        if (!activePromo) return 0;
        const coupon = data.coupons.find(c => c.code === activePromo);
        if (!coupon || !coupon.active) return 0;
        if (coupon.type === 'percent') return Math.round(sub * coupon.value / 100);
        return Math.min(coupon.value, sub);
    }

    function renderCart() {
        const list = document.getElementById('cartList');
        const empty = document.getElementById('emptyCart');
        const foot = document.getElementById('cartFooter');
        if (cart.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
            foot.style.display = 'none';
            return;
        }
        empty.style.display = 'none';
        foot.style.display = 'block';
        list.innerHTML = cart.map((c, i) => `
            <div class="cart-card">
                <div class="cart-img"><img src="${c.image}" alt="${escapeHtml(c.name)}"></div>
                <div class="cart-mid">
                    <div>
                        <div class="cname">${escapeHtml(c.name)}</div>
                        ${c.size ? `<div class="csize">O'lcham: ${escapeHtml(c.size)}</div>` : ''}
                    </div>
                    <div class="cart-bottom">
                        <div class="qty">
                            <button data-cdec="${i}" aria-label="Kamaytirish">−</button>
                            <span>${c.qty}</span>
                            <button data-cinc="${i}" aria-label="Ko'paytirish">+</button>
                        </div>
                        <div class="cprice">${money(c.price * c.qty)}</div>
                    </div>
                </div>
            </div>`).join('');

        const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const discount = calcDiscount(sub);
        const total = sub + SHIPPING_BASE - discount;

        document.getElementById('cartSub').textContent = money(sub);
        document.getElementById('cartShip').textContent = money(SHIPPING_BASE);
        document.getElementById('cartTotal').textContent = money(total);
        const discountRow = document.getElementById('cartDiscountRow');
        if (discount > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('cartDiscount').textContent = '− ' + money(discount);
        } else {
            discountRow.style.display = 'none';
        }
        if (activePromo) document.getElementById('promoInput').value = activePromo;
    }

    document.getElementById('clearCartBtn').onclick = async () => {
        if (cart.length === 0) return;
        const ok = await showDialog({
            title: 'Savatchani tozalash',
            message: 'Barcha mahsulotlar savatchadan olib tashlanadi.',
            icon: '🗑',
            okText: 'Tozalash',
            danger: true,
        });
        if (!ok) return;
        cart = [];
        activePromo = null;
        savePromo();
        saveCart();
        renderCart();
        toast('Savatcha tozalandi', 'info');
    };

    document.getElementById('promoApply').onclick = () => {
        const code = document.getElementById('promoInput').value.trim().toUpperCase();
        if (!code) { activePromo = null; savePromo(); renderCart(); return; }
        const coupon = data.coupons.find(c => c.code === code);
        if (!coupon) { toast('Promo-kod topilmadi', 'error'); return; }
        if (!coupon.active) { toast('Promo-kod faol emas', 'error'); return; }
        if (coupon.expires && new Date(coupon.expires) < new Date()) { toast('Promo-kod muddati tugagan', 'error'); return; }
        if (coupon.used >= coupon.maxUses) { toast('Promo-kod limiti tugagan', 'error'); return; }
        activePromo = code;
        savePromo();
        renderCart();
        toast(`Promo-kod qo'llandi: -${coupon.type === 'percent' ? coupon.value + '%' : money(coupon.value)}`, 'success');
    };

    document.getElementById('checkoutBtn').onclick = () => {
        if (cart.length === 0) { toast("Savatcha bo'sh", 'error'); return; }
        const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const discount = calcDiscount(sub);
        const total = sub + SHIPPING_BASE - discount;
        document.getElementById('orderSum').innerHTML = `
            ${cart.map(c => `<div><span>${escapeHtml(c.name)} × ${c.qty}</span><span>${money(c.price * c.qty)}</span></div>`).join('')}
            ${discount > 0 ? `<div><span>Chegirma</span><span style="color:var(--success)">− ${money(discount)}</span></div>` : ''}
            <div><span>Yetkazib berish</span><span>${money(SHIPPING_BASE)}</span></div>
            <div class="tot"><span>Jami</span><span>${money(total)}</span></div>`;
        const def = addresses.find(a => a.default) || addresses[0];
        const form = document.getElementById('checkoutForm');
        if (profile.name) form.name.value = profile.name;
        if (def) {
            form.phone.value = def.phone || profile.phone || '';
            form.address.value = def.full || '';
        } else if (profile.phone) form.phone.value = profile.phone;
        openSheet('checkoutSheet');
    };

    document.getElementById('placeOrderBtn').onclick = () => {
        const form = document.getElementById('checkoutForm');
        const fd = new FormData(form);
        const name = (fd.get('name') || '').toString().trim();
        const phone = (fd.get('phone') || '').toString().trim();
        const address = (fd.get('address') || '').toString().trim();
        if (!name || !phone || !address) {
            toast("Iltimos, barcha maydonlarni to'ldiring", 'error');
            return;
        }
        if (phone.replace(/\D/g, '').length < 9) {
            toast("Telefon raqam noto'g'ri", 'error');
            return;
        }
        const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const discount = calcDiscount(sub);
        const order = {
            id: Math.max(1000, ...data.orders.map(o => o.id)) + 1,
            customerId: null,
            name, phone, address,
            items: cart.map(c => ({ pid: c.id, name: c.name, qty: c.qty, price: c.price, size: c.size })),
            total: sub + SHIPPING_BASE - discount,
            payment: fd.get('payment'),
            status: 'yangi',
            note: '',
            date: new Date().toISOString().slice(0,10),
            self: true,
            promo: activePromo || null,
            discount,
        };
        data.orders.unshift(order);
        Store.save(data);

        // Telegram botga buyurtmani yuborish (admin panelda ulangan bo'lsa)
        notifyTelegramBot(order);

        if (!profile.name) {
            profile = { name, phone };
            saveProfile();
        }

        cart = [];
        activePromo = null;
        savePromo();
        saveCart();
        closeSheet();
        switchScreen('orders');
        toast('Buyurtmangiz qabul qilindi! 🎉', 'success');
        form.reset();
    };

    // Cart qty events
    document.addEventListener('click', e => {
        const inc = e.target.dataset.cinc;
        const dec = e.target.dataset.cdec;
        if (inc != null) {
            const item = cart[+inc];
            const product = data.products.find(p => p.id === item.id);
            if (product && item.qty >= product.stock) { toast('Zaxira yetarli emas', 'error'); return; }
            item.qty++;
            saveCart();
            renderCart();
        }
        if (dec != null) {
            const i = +dec;
            cart[i].qty--;
            if (cart[i].qty <= 0) cart.splice(i, 1);
            saveCart();
            renderCart();
        }
    });

    // Product card clicks
    document.addEventListener('click', e => {
        const fav = e.target.closest('[data-fav]');
        const add = e.target.closest('[data-add]');
        const card = e.target.closest('.p-card, .trend-card');

        if (fav) {
            e.stopPropagation();
            const id = +fav.dataset.fav;
            if (favorites.includes(id)) favorites = favorites.filter(x => x !== id);
            else favorites.push(id);
            saveFavs();
            renderProductGrid();
            renderTrending();
            const sheet = document.getElementById('productSheet');
            if (sheet.classList.contains('show')) openProductDetail(id);
            return;
        }
        if (add) {
            e.stopPropagation();
            addToCart(+add.dataset.add);
            return;
        }
        if (card && !e.target.closest('button')) {
            openProductDetail(+card.dataset.pid);
        }
    });

    /* ============ SEARCH ============ */
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    let searchTimer;
    searchInput.oninput = e => {
        searchClear.style.display = e.target.value ? 'flex' : 'none';
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            fState.search = e.target.value;
            renderProductGrid();
        }, 200);
    };
    searchClear.onclick = () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        fState.search = '';
        renderProductGrid();
        searchInput.focus();
    };

    /* ============ FILTER SHEET ============ */
    function updateFilterIndicator() {
        const active = (fState.cat !== 'all') || fState.minPrice || fState.maxPrice || fState.sort !== 'new';
        document.getElementById('filterDot').style.display = active ? 'block' : 'none';
    }

    document.getElementById('filterBtn').onclick = () => {
        document.getElementById('filterCats').innerHTML = [{id:'all',name:'Hammasi'}, ...data.categories]
            .map(c => `<button class="fc ${c.id === fState.cat ? 'active' : ''}" data-fcat="${c.id}">${escapeHtml(c.name)}</button>`).join('');
        document.getElementById('priceMin').value = fState.minPrice || '';
        document.getElementById('priceMax').value = fState.maxPrice || '';
        document.querySelectorAll('#filterSort .fc').forEach(b => b.classList.toggle('active', b.dataset.sort === fState.sort));

        document.querySelectorAll('#filterCats .fc').forEach(b => b.onclick = () => {
            document.querySelectorAll('#filterCats .fc').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
        });
        document.querySelectorAll('#filterSort .fc').forEach(b => b.onclick = () => {
            document.querySelectorAll('#filterSort .fc').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
        });
        openSheet('filterSheet');
    };

    document.getElementById('filterApply').onclick = () => {
        const cat = document.querySelector('#filterCats .fc.active')?.dataset.fcat || 'all';
        const sort = document.querySelector('#filterSort .fc.active')?.dataset.sort || 'new';
        const mn = +document.getElementById('priceMin').value || null;
        const mx = +document.getElementById('priceMax').value || null;
        if (mn && mx && mn > mx) { toast("Min narx max'dan katta bo'lmasligi kerak", 'error'); return; }
        fState = { ...fState, cat, sort, minPrice: mn, maxPrice: mx };
        renderChips();
        renderProductGrid();
        updateFilterIndicator();
        closeSheet();
        toast("Filter qo'llandi", 'info');
    };

    document.getElementById('filterReset').onclick = () => {
        fState = { cat: 'all', search: fState.search, minPrice: null, maxPrice: null, sort: 'new' };
        renderChips();
        renderProductGrid();
        updateFilterIndicator();
        closeSheet();
        toast('Filter tozalandi', 'info');
    };

    document.getElementById('emptyReset').onclick = () => {
        fState = { cat: 'all', search: '', minPrice: null, maxPrice: null, sort: 'new' };
        searchInput.value = '';
        searchClear.style.display = 'none';
        renderChips();
        renderProductGrid();
        updateFilterIndicator();
    };

    /* ============ HERO CTA & SEE-ALL ============ */
    document.getElementById('heroCta').onclick = () => {
        fState.sort = 'new';
        fState.cat = 'all';
        renderChips();
        renderProductGrid();
        document.getElementById('gridTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    document.getElementById('seeAllTrending').onclick = () => {
        fState.sort = 'popular';
        renderProductGrid();
        updateFilterIndicator();
        document.getElementById('gridTitle').textContent = 'Mashhur mahsulotlar';
        document.getElementById('gridTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* ============ NOTIFICATIONS ============ */
    function timeAgo(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        const diff = Date.now() - d.getTime();
        const min = Math.floor(diff / 60000);
        if (min < 1) return 'Hozir';
        if (min < 60) return min + ' daqiqa oldin';
        const hr = Math.floor(min / 60);
        if (hr < 24) return hr + ' soat oldin';
        const day = Math.floor(hr / 24);
        if (day === 1) return 'Kecha';
        if (day < 7) return day + ' kun oldin';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function getNotifications() {
        const notifs = [];
        // 1. Admin chat messages — eng yuqorida
        const chat = (data.chats || []).find(c => c.key === chatUserKey);
        if (chat && Array.isArray(chat.messages)) {
            const adminMsgs = chat.messages.filter(m => m.from === 'admin');
            const lastAdmin = adminMsgs[adminMsgs.length - 1];
            if (lastAdmin) {
                notifs.push({
                    icon: '💬',
                    title: chat.unreadUser > 0 ? 'Admin sizga yozdi' : 'Admin javobi',
                    text: lastAdmin.text.length > 90 ? lastAdmin.text.slice(0, 90) + '…' : lastAdmin.text,
                    time: timeAgo(lastAdmin.time),
                    action: 'chat',
                    unread: chat.unreadUser > 0,
                });
            }
        }
        // 2. Order status updates
        data.orders.filter(o => o.self).slice(0, 6).forEach(o => {
            notifs.push({
                icon: o.status === 'yetkazildi' ? '✅' : o.status === 'yangi' ? '🛍️' : o.status === 'bekor' ? '❌' : '🚚',
                title: `Buyurtma #${o.id}`,
                text: o.status === 'yetkazildi' ? 'Yetkazib berildi' :
                      o.status === 'yangi' ? 'Qabul qilindi' :
                      o.status === 'jarayonda' ? 'Tayyorlanmoqda' :
                      o.status === 'yetkazilmoqda' ? "Yo'lda" :
                      o.status === 'bekor' ? 'Bekor qilindi' : 'Holat yangilandi',
                time: formatDate(o.date),
            });
        });
        // 3. Promos
        notifs.push({ icon: '🎁', title: 'Yangi promotsiya', text: 'YANGI10 kod bilan 10% chegirma', time: 'Bugun' });
        notifs.push({ icon: '🔥', title: 'Yangi kolleksiya', text: "Bahor kolleksiyasi keldi — birinchi bo'lib ko'ring", time: 'Kecha' });
        return notifs;
    }

    document.getElementById('bellBtn').onclick = () => {
        const list = getNotifications();
        document.getElementById('notifBody').innerHTML = list.length === 0
            ? '<div class="empty-state"><div class="emp-ico">🔕</div><h4>Bildirishnomalar yo\'q</h4><p>Hozircha yangi bildirishnomalar yo\'q</p></div>'
            : list.map(n => `
                <div class="notif-item ${n.unread ? 'unread' : ''}" ${n.action ? `data-action="${n.action}"` : ''}>
                    <div class="notif-icon">${n.icon}</div>
                    <div class="notif-content">
                        <strong>${escapeHtml(n.title)}</strong>
                        <small>${escapeHtml(n.text)}</small>
                        <span class="notif-time">${escapeHtml(n.time)}</span>
                    </div>
                    ${n.unread ? '<span class="notif-dot"></span>' : ''}
                </div>`).join('');
        // Click-through for chat notification
        document.querySelectorAll('#notifBody [data-action="chat"]').forEach(el => {
            el.style.cursor = 'pointer';
            el.onclick = () => { closeSheet(); setTimeout(openChat, 280); };
        });
        document.getElementById('bellDot').style.display = 'none';
        localStorage.setItem(NOTIF_KEY, Date.now() + '');
        openSheet('notifSheet');
    };

    function checkUnseenNotifs() {
        const last = +(localStorage.getItem(NOTIF_KEY) || 0);
        const chat = (data.chats || []).find(c => c.key === chatUserKey);
        const hasUnreadChat = chat && chat.unreadUser > 0;
        const hasOrder = data.orders.some(o => o.self && new Date(o.date).getTime() > last - 86400000);
        document.getElementById('bellDot').style.display = (hasUnreadChat || hasOrder) ? 'block' : 'none';
    }

    /* ============ ORDERS ============ */
    document.querySelectorAll('#orderTabs .ot').forEach(t => t.onclick = () => {
        document.querySelectorAll('#orderTabs .ot').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        orderStatusFilter = t.dataset.ostatus;
        renderOrders();
    });

    function renderOrders() {
        const myOrders = data.orders.filter(o => o.self);
        let list = myOrders;
        if (orderStatusFilter !== 'all') list = list.filter(o => o.status === orderStatusFilter);
        const ul = document.getElementById('ordersList');
        const empty = document.getElementById('emptyOrders');
        if (list.length === 0) {
            ul.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';
        ul.innerHTML = list.map(o => {
            const thumbs = o.items.slice(0, 3).map(i => {
                const p = data.products.find(x => x.id === i.pid);
                return p ? `<img src="${p.image}" alt="">` : '';
            }).join('');
            const more = o.items.length > 3 ? `<div class="more">+${o.items.length - 3}</div>` : '';
            const statusLabel = { yangi: 'Yangi', jarayonda: 'Jarayonda', yetkazilmoqda: "Yo'lda", yetkazildi: 'Yetkazildi', bekor: 'Bekor' }[o.status] || o.status;
            return `
                <div class="order-card">
                    <div class="oc-head">
                        <div class="oc-id">#${o.id}</div>
                        <span class="status-pill ${o.status}">${statusLabel}</span>
                    </div>
                    <div class="oc-meta">${formatDate(o.date)} • ${o.items.length} mahsulot</div>
                    <div class="oc-thumbs">${thumbs}${more}</div>
                    <div class="oc-foot">
                        <div class="oc-total">${money(o.total)}</div>
                        <button class="oc-btn" data-order-detail="${o.id}">Batafsil</button>
                    </div>
                </div>`;
        }).join('');
    }

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-order-detail]');
        if (!btn) return;
        const o = data.orders.find(x => x.id === +btn.dataset.orderDetail);
        if (!o) return;
        const statusLabel = { yangi: 'Yangi', jarayonda: 'Jarayonda', yetkazilmoqda: "Yo'lda", yetkazildi: 'Yetkazildi', bekor: 'Bekor' }[o.status] || o.status;
        const payLabel = { naqd: '💵 Naqd', uzcard: '💳 Uzcard / Humo', karta: '💳 Karta', click: '⚡ Click', payme: '📱 Payme' }[o.payment] || o.payment;
        document.getElementById('productDetail').innerHTML = `
            <div class="sheet-body">
                <div style="text-align:center;margin-bottom:18px">
                    <span class="status-pill ${o.status}" style="font-size:12px;padding:6px 14px">${statusLabel}</span>
                    <h2 style="font-family:'Manrope',sans-serif;font-size:22px;font-weight:800;margin-top:10px;letter-spacing:-0.02em">Buyurtma #${o.id}</h2>
                    <p style="color:var(--text-muted);font-size:13px;margin-top:2px">${formatDate(o.date)}</p>
                </div>
                <div style="background:var(--surface-2);border-radius:16px;padding:14px;margin-bottom:14px">
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0"><span style="color:var(--text-muted)">Manzil</span><strong style="text-align:right;max-width:60%">${escapeHtml(o.address)}</strong></div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0"><span style="color:var(--text-muted)">Telefon</span><strong>${escapeHtml(o.phone)}</strong></div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0"><span style="color:var(--text-muted)">To'lov</span><strong>${payLabel}</strong></div>
                </div>
                <h4 style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Mahsulotlar</h4>
                ${o.items.map(i => {
                    const p = data.products.find(x => x.id === i.pid);
                    return `
                    <div style="display:flex;gap:10px;padding:10px;background:var(--surface-2);border-radius:12px;margin-bottom:6px;align-items:center">
                        <img src="${p ? p.image : ''}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;background:var(--surface-3)">
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:600;font-size:13px">${escapeHtml(i.name)}</div>
                            <div style="font-size:11px;color:var(--text-muted)">O'lcham: ${escapeHtml(i.size || '—')} • ${i.qty} dona</div>
                        </div>
                        <div style="font-weight:800;font-size:14px;font-family:'Manrope',sans-serif">${money(i.price * i.qty)}</div>
                    </div>`;
                }).join('')}
                <div style="display:flex;justify-content:space-between;padding:16px;background:var(--accent-soft);color:var(--accent);border-radius:14px;margin-top:10px;font-weight:800;font-size:16px;font-family:'Manrope',sans-serif">
                    <span>Jami:</span><span>${money(o.total)}</span>
                </div>
            </div>`;
        openSheet('productSheet');
    });

    /* ============ PROFILE ============ */
    function renderProfile() {
        document.getElementById('profileAvatar').textContent = (profile.name || 'M').charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = profile.name || 'Foydalanuvchi';
        document.getElementById('profilePhone').textContent = profile.phone || "Profilni to'ldiring";
        updateAddressCount();
        updateProfileStats();
    }

    function updateAddressCount() {
        const el = document.getElementById('addrCount');
        if (!el) return;
        el.textContent = addresses.length > 0 ? `${addresses.length} ta manzil` : 'Yetkazib berish manzillari';
    }

    function updateProfileStats() {
        const myOrders = data.orders.filter(o => o.self);
        const spent = myOrders.filter(o => o.status === 'yetkazildi').reduce((s, o) => s + o.total, 0);
        document.getElementById('psOrders').textContent = myOrders.length;
        document.getElementById('psFav').textContent = favorites.length;
        const bonus = Math.floor(spent / 10000);
        document.getElementById('psSpent').textContent = bonus;
    }

    document.getElementById('themeSwitch').onchange = e => applyTheme(e.target.checked);
    document.getElementById('themeToggle').onclick = e => {
        if (e.target.tagName === 'INPUT' || e.target.classList.contains('slider')) return;
        const sw = document.getElementById('themeSwitch');
        sw.checked = !sw.checked;
        applyTheme(sw.checked);
    };

    document.getElementById('profileEdit').onclick = () => {
        document.getElementById('pfName').value = profile.name || '';
        document.getElementById('pfPhone').value = profile.phone || '';
        document.getElementById('pfEmail').value = profile.email || '';
        openSheet('profileSheet');
    };
    document.getElementById('saveProfileBtn').onclick = () => {
        const name = document.getElementById('pfName').value.trim();
        const phone = document.getElementById('pfPhone').value.trim();
        const email = document.getElementById('pfEmail').value.trim();
        if (!name) { toast('Ismni kiriting', 'error'); return; }
        profile = { name, phone, email };
        saveProfile();
        closeSheet();
        toast('Profil yangilandi', 'success');
    };

    /* ============ ADDRESSES ============ */
    document.getElementById('openAddresses').onclick = () => { renderAddresses(); openSheet('addrSheet'); };

    function renderAddresses() {
        const body = document.getElementById('addrBody');
        if (addresses.length === 0) {
            body.innerHTML = `<div class="empty-state"><div class="emp-ico">📍</div><h4>Manzillar yo'q</h4><p>Birinchi manzilingizni qo'shing</p></div>`;
            return;
        }
        body.innerHTML = addresses.map((a, i) => `
            <div class="addr-card ${a.default ? 'default' : ''}" data-addr="${i}">
                <div class="addr-ico">${a.label === 'Uy' ? '🏠' : a.label === 'Ish' ? '🏢' : '📍'}</div>
                <div class="addr-mid">
                    <div class="addr-label">${escapeHtml(a.label)} ${a.default ? '<span class="badge">Asosiy</span>' : ''}</div>
                    <div class="addr-full">${escapeHtml(a.full)}</div>
                    <div style="font-size:11px;color:var(--text-soft);margin-top:2px">${escapeHtml(a.phone)}</div>
                </div>
                <div class="addr-acts">
                    <button data-edit-addr="${i}" aria-label="Tahrirlash">✏️</button>
                    <button data-del-addr="${i}" aria-label="O'chirish">🗑</button>
                </div>
            </div>`).join('');
        body.querySelectorAll('.addr-card').forEach(c => c.onclick = (e) => {
            if (e.target.closest('button')) return;
            const i = +c.dataset.addr;
            addresses.forEach((a, idx) => a.default = idx === i);
            saveAddrs();
            toast('Asosiy manzil o\'zgartirildi', 'success');
        });
        body.querySelectorAll('[data-edit-addr]').forEach(b => b.onclick = (e) => {
            e.stopPropagation();
            editAddr(+b.dataset.editAddr);
        });
        body.querySelectorAll('[data-del-addr]').forEach(b => b.onclick = (e) => {
            e.stopPropagation();
            delAddr(+b.dataset.delAddr);
        });
    }

    /* ---------- Region/District dropdowns ---------- */
    function populateRegionSelect(selectedRegion = '') {
        const sel = document.getElementById('addrRegion');
        sel.innerHTML = '<option value="">Tanlang...</option>' +
            Object.keys(UZ_REGIONS).map(r => `<option value="${escapeHtml(r)}" ${r === selectedRegion ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('');
    }
    function populateDistrictSelect(region, selectedDistrict = '') {
        const sel = document.getElementById('addrDistrict');
        if (!region || !UZ_REGIONS[region]) {
            sel.innerHTML = '<option value="">Avval viloyatni tanlang</option>';
            sel.disabled = true;
            return;
        }
        sel.disabled = false;
        sel.innerHTML = '<option value="">Tanlang...</option>' +
            UZ_REGIONS[region].map(d => `<option value="${escapeHtml(d)}" ${d === selectedDistrict ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('');
    }
    document.getElementById('addrRegion').onchange = e => {
        populateDistrictSelect(e.target.value);
    };

    function editAddr(i) {
        const a = addresses[i];
        document.getElementById('addrId').value = i;
        document.getElementById('addrLabel').value = a.label || '';
        populateRegionSelect(a.region || '');
        populateDistrictSelect(a.region || '', a.district || '');
        document.getElementById('addrStreet').value = a.street || a.full || '';
        document.getElementById('addrPhone').value = a.phone || '';
        document.getElementById('addrDefault').checked = !!a.default;
        document.getElementById('addrFormTitle').textContent = 'Manzilni tahrirlash';
        openSheet('addrFormSheet');
    }
    async function delAddr(i) {
        const ok = await showDialog({
            title: 'Manzilni o\'chirish',
            message: 'Ushbu manzil ro\'yxatdan olib tashlanadi.',
            icon: '🗑',
            okText: 'O\'chirish',
            danger: true,
        });
        if (!ok) return;
        addresses.splice(i, 1);
        if (!addresses.some(a => a.default) && addresses.length > 0) addresses[0].default = true;
        saveAddrs();
        toast('Manzil o\'chirildi', 'info');
    }

    document.getElementById('addAddrBtn').onclick = () => {
        document.getElementById('addrForm').reset();
        document.getElementById('addrId').value = '';
        populateRegionSelect('');
        populateDistrictSelect('');
        document.getElementById('addrFormTitle').textContent = 'Yangi manzil';
        openSheet('addrFormSheet');
    };

    document.getElementById('saveAddrBtn').onclick = () => {
        const id = document.getElementById('addrId').value;
        const region = document.getElementById('addrRegion').value.trim();
        const district = document.getElementById('addrDistrict').value.trim();
        const street = document.getElementById('addrStreet').value.trim();
        const phone = document.getElementById('addrPhone').value.trim();

        if (!region) { toast("Viloyat / shaharni tanlang", 'error'); return; }
        if (!district) { toast("Tumanni tanlang", 'error'); return; }
        if (!street) { toast("Ko'cha va uy raqamini kiriting", 'error'); return; }
        if (!phone || phone.replace(/\D/g, '').length < 9) { toast("Telefon raqamni to'g'ri kiriting", 'error'); return; }

        const obj = {
            label: document.getElementById('addrLabel').value.trim() || 'Manzil',
            region, district, street,
            full: `${region}, ${district}, ${street}`,
            phone,
            default: document.getElementById('addrDefault').checked,
        };
        if (obj.default) addresses.forEach(a => a.default = false);
        if (id !== '') addresses[+id] = obj;
        else addresses.push(obj);
        if (!addresses.some(a => a.default) && addresses.length > 0) addresses[0].default = true;
        saveAddrs();
        openSheet('addrSheet');
        toast(id ? 'Manzil yangilandi' : "Manzil qo'shildi", 'success');
    };

    /* ============ FAVORITES ============ */
    document.getElementById('openFavorites').onclick = () => {
        const favProds = data.products.filter(p => favorites.includes(p.id));
        const body = document.getElementById('favBody');
        if (favProds.length === 0) {
            body.innerHTML = `<div class="empty-state"><div class="emp-ico">❤️</div><h4>Sevimlilar yo'q</h4><p>Yoqqan mahsulotlarga ❤️ bosing</p></div>`;
        } else {
            body.innerHTML = `<div class="product-grid">${favProds.map(productCard).join('')}</div>`;
        }
        openSheet('favSheet');
    };

    /* ============ MISC PROFILE ACTIONS ============ */
    document.getElementById('aboutLink').onclick = () => openSheet('aboutSheet');
    document.getElementById('openPayment').onclick = () => toast('Tez kunda qo\'shiladi', 'info');
    document.getElementById('openChat').onclick = () => openChat();

    document.getElementById('logoutBtn').onclick = async () => {
        const ok = await showDialog({
            title: 'Hisobdan chiqish',
            message: 'Profilingiz ushbu qurilmadan o\'chiriladi. Sevimlilar va savatcha saqlanadi.',
            icon: '👋',
            okText: 'Chiqish',
            danger: true,
        });
        if (!ok) return;
        profile = {};
        localStorage.removeItem(PROFILE_KEY);
        renderProfile();
        toast('Hisobdan chiqildi', 'info');
    };

    /* ============ CHAT (user ↔ admin) ============ */
    const CHAT_USER_KEY = 'moda_chat_user';
    let chatUserKey = localStorage.getItem(CHAT_USER_KEY);
    if (!chatUserKey) {
        chatUserKey = 'u_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem(CHAT_USER_KEY, chatUserKey);
    }

    function getMyChat() {
        if (!Array.isArray(data.chats)) data.chats = [];
        let chat = data.chats.find(c => c.key === chatUserKey);
        if (!chat) {
            chat = {
                key: chatUserKey,
                userName: profile.name || 'Mehmon',
                userPhone: profile.phone || '',
                messages: [],
                lastActive: new Date().toISOString(),
                unreadAdmin: 0, // admin uchun o'qilmagan (userdan kelgan)
                unreadUser: 0,  // user uchun o'qilmagan (admindan kelgan)
            };
            data.chats.unshift(chat);
            Store.save(data);
        }
        // Profile yangilangan bo'lsa name/phone yangilab qo'yamiz
        if (profile.name && chat.userName !== profile.name) chat.userName = profile.name;
        if (profile.phone && chat.userPhone !== profile.phone) chat.userPhone = profile.phone;
        return chat;
    }

    function formatTime(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    function dayLabel(iso) {
        const d = new Date(iso);
        const today = new Date(); today.setHours(0,0,0,0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const day = new Date(d); day.setHours(0,0,0,0);
        if (day.getTime() === today.getTime()) return 'Bugun';
        if (day.getTime() === yesterday.getTime()) return 'Kecha';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function renderChat() {
        const chat = getMyChat();
        const body = document.getElementById('chatBody');
        if (!chat.messages || chat.messages.length === 0) {
            body.innerHTML = `
                <div class="chat-empty">
                    <div class="emp-ico">💬</div>
                    <h4>Suhbatni boshlang</h4>
                    <p>Admin sizga 5 daqiqada javob beradi. Savol yoki murojaatingizni yozing.</p>
                </div>`;
            return;
        }
        let html = '';
        let lastDay = '';
        chat.messages.forEach(m => {
            const dl = dayLabel(m.time);
            if (dl !== lastDay) {
                html += `<div class="chat-day">${dl}</div>`;
                lastDay = dl;
            }
            html += `
                <div class="chat-msg from-${m.from}">
                    ${escapeHtml(m.text)}
                    <span class="chat-time">${formatTime(m.time)}</span>
                </div>`;
        });
        body.innerHTML = html;
        // scroll to bottom
        requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
    }

    function openChat() {
        // Re-load data in case admin updated
        data = Store.load();
        const chat = getMyChat();
        chat.unreadUser = 0; // mark admin xabarlar o'qildi
        Store.save(data);
        updateChatUnreadDot();
        renderChat();
        openSheet('chatSheet');
        setTimeout(() => document.getElementById('chatInput').focus(), 350);
    }

    function sendChatMessage(text) {
        text = text.trim();
        if (!text) return;
        data = Store.load();
        const chat = getMyChat();
        chat.messages.push({
            from: 'user',
            text,
            time: new Date().toISOString(),
        });
        chat.lastActive = new Date().toISOString();
        chat.unreadAdmin = (chat.unreadAdmin || 0) + 1;
        Store.save(data);
        renderChat();
    }

    document.getElementById('chatForm').onsubmit = e => {
        e.preventDefault();
        const inp = document.getElementById('chatInput');
        const v = inp.value;
        if (!v.trim()) return;
        sendChatMessage(v);
        inp.value = '';
        inp.focus();
    };

    function updateChatUnreadDot() {
        const dot = document.getElementById('chatUnreadDot');
        if (!dot) return;
        const chat = (data.chats || []).find(c => c.key === chatUserKey);
        const has = chat && chat.unreadUser > 0;
        dot.style.display = has ? 'inline-block' : 'none';
    }

    // Cross-tab sync: admin javob bersa darhol ko'rinadi
    window.addEventListener('storage', e => {
        if (e.key !== STORE_KEY) return;
        data = Store.load();
        updateChatUnreadDot();
        checkUnseenNotifs();
        const sheet = document.getElementById('chatSheet');
        if (sheet && sheet.classList.contains('show')) {
            const chat = getMyChat();
            chat.unreadUser = 0;
            Store.save(data);
            renderChat();
        } else {
            // Yangi admin xabari kelganda toast ko'rsatamiz
            const chat = (data.chats || []).find(c => c.key === chatUserKey);
            if (chat && chat.unreadUser > 0) {
                const last = chat.messages[chat.messages.length - 1];
                if (last && last.from === 'admin') {
                    toast('💬 Admin sizga javob yozdi', 'info');
                    // Bell dotni animatsiyalash
                    const dot = document.getElementById('bellDot');
                    if (dot) {
                        dot.style.display = 'block';
                        dot.classList.remove('shake');
                        void dot.offsetWidth;
                        dot.classList.add('shake');
                    }
                }
            }
        }
    });

    /* ============ INIT ============ */
    renderChips();
    renderTrending();
    renderProductGrid();
    updateCartBadge();
    updateFilterIndicator();
    checkUnseenNotifs();
    renderProfile();
    updateChatUnreadDot();

    // Active screen on bottom nav
    document.querySelectorAll('.bn').forEach(b => b.classList.toggle('active', b.dataset.nav === 'home'));
}
