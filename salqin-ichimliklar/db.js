// Salqin Ichimliklar — umumiy ma'lumotlar bazasi (localStorage)
// Foydalanuvchi va admin paneli orasida bir xil ma'lumotlardan foydalanadi.

const DB = (() => {
  const KEYS = {
    products: 'si_products',
    orders: 'si_orders',
    users: 'si_users',
    cart: 'si_cart',
    session: 'si_session',
    adminSession: 'si_admin_session',
    settings: 'si_settings',
    seenStatuses: 'si_seen_statuses',
    theme: 'si_theme',
    chat: 'si_chat',
    adminCreds: 'si_admin_creds',
  };

  // Serverga (Cloud/Supabase) ko'chiriladigan UMUMIY kalitlar — Cloud client_id bo'yicha
  // avtomatik ajratadi, shu sabab har do'kon o'z mahsulot/buyurtma/foydalanuvchilariga
  // ega bo'ladi (multi-tenant). Qurilmaga xos kalitlar (savat si_cart, login si_session,
  // si_admin_session, tema si_theme) localStorage'da qoladi.
  const CLOUD_KEYS = new Set([
    'si_products', 'si_orders', 'si_users',
    'si_settings', 'si_chat', 'si_seen_statuses', 'si_admin_creds',
  ]);

  // ---------- SHA-256 (sinxron, sof JS — crypto.subtle HTTPS talab qilgani uchun) ----------
  function sha256(ascii) {
    function rightRotate(v, a) { return (v >>> a) | (v << (32 - a)); }
    const mathPow = Math.pow, maxWord = mathPow(2, 32);
    let result = '', i, j;
    const words = [], asciiBitLength = ascii.length * 8;
    let hash = sha256.h = sha256.h || [];
    const k = sha256.k = sha256.k || [];
    let primeCounter = k.length;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return ''; // faqat ASCII; boshqa belgilar oldindan UTF-8 ga aylantiriladi
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength);
    for (j = 0; j < words.length;) {
      const w = words.slice(j, j += 16);
      const oldHash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
              w[i - 16]
              + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
              + w[i - 7]
              + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
            ) | 0);
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash.slice(0, 7));
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }
  // UTF-8 qo'llab-quvvatlash uchun o'rab olamiz
  const hashPass = (s) => sha256(unescape(encodeURIComponent(String(s ?? ''))));

  // ---------- HTML escape (XSS himoyasi) ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const ADMIN_DEFAULT_LOGIN = 'admin';
  const ADMIN_DEFAULT_HASH = () => hashPass('admin123');

  const read = (k, fallback) => {
    // Umumiy kalitlar serverdan (Cloud) keshdan o'qiladi; qolganlari localStorage'dan.
    if (CLOUD_KEYS.has(k) && window.Cloud) {
      const v = Cloud.get(k, undefined);
      return (v === undefined || v === null) ? fallback : v;
    }
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (k, v) => {
    // Umumiy kalitlar serverga (Cloud) yoziladi; qolganlari localStorage'ga.
    if (CLOUD_KEYS.has(k) && window.Cloud) { Cloud.set(k, v); return; }
    const json = JSON.stringify(v);
    try {
      localStorage.setItem(k, json);
    } catch (err) {
      // Test rejimi: kvota tugaganda ham ilova ishlab tursin.
      // Asosan si_orders va si_chat shishadi — eski yarmini olib tashlab qaytadan urinish.
      const isQuota = err && (err.name === 'QuotaExceededError' || err.code === 22 || /quota/i.test(err.message || ''));
      if (!isQuota) throw err;
      console.warn('[DB] kvota oshib ketdi, eski yozuvlar tozalanmoqda:', k);
      try {
        if (Array.isArray(v) && v.length > 4) {
          // si_chat push bilan to'ladi (eng yangilari oxirida) — oxirgi yarmini saqlaymiz.
          // Boshqalari (orders) unshift bilan to'ladi (eng yangilari boshida) — birinchi yarmi saqlanadi.
          const half = Math.floor(v.length / 2);
          const trimmed = k === KEYS.chat ? v.slice(-half) : v.slice(0, half);
          localStorage.setItem(k, JSON.stringify(trimmed));
          return;
        }
        // Boshqa ko'p joy egallaydigan kalitlarni tozalash
        ['si_chat', 'si_orders', 'si_bot_feed', 'si_seen_statuses'].forEach(key => {
          if (key !== k) localStorage.removeItem(key);
        });
        localStorage.setItem(k, json);
      } catch (err2) {
        console.error('[DB] kvota tozalashdan keyin ham yozib bo\'lmadi:', err2);
        throw err2;
      }
    }
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ============================================================
  // Realistik SVG illyustratsiyalar — fotosurat uslubidagi stakanlar
  // ============================================================
  function svgGlass(opts) {
    const { liquid, type = 'glass', label = '', garnish = 'none' } = opts;

    const garnishMarkup = {
      orange: `
        <g transform='translate(135,40)'>
          <circle r='28' fill='#fb923c' stroke='#c2410c' stroke-width='1.5'/>
          <circle r='22' fill='#fdba74'/>
          <g stroke='#fb923c' stroke-width='1.5'>
            <line x1='-20' y1='0' x2='20' y2='0'/>
            <line x1='0' y1='-20' x2='0' y2='20'/>
            <line x1='-14' y1='-14' x2='14' y2='14'/>
            <line x1='-14' y1='14' x2='14' y2='-14'/>
          </g>
        </g>`,
      lemon: `
        <g transform='translate(135,40)'>
          <ellipse rx='26' ry='22' fill='#facc15' stroke='#a16207' stroke-width='1.5'/>
          <ellipse rx='20' ry='16' fill='#fde047'/>
        </g>`,
      apple: `
        <g transform='translate(135,40)'>
          <circle r='25' fill='#84cc16'/>
          <circle r='25' fill='url(#shineG)' opacity='.4'/>
          <path d='M 0 -25 Q 4 -32 10 -30' stroke='#65a30d' stroke-width='3' fill='none' stroke-linecap='round'/>
          <path d='M 10 -28 Q 18 -36 14 -22' fill='#65a30d'/>
        </g>`,
      lime: `
        <g transform='translate(135,40)'>
          <circle r='25' fill='#22c55e' stroke='#15803d' stroke-width='1.5'/>
          <circle r='19' fill='#4ade80'/>
        </g>`,
      cherry: `
        <g transform='translate(135,38)'>
          <circle cx='-8' cy='4' r='10' fill='#dc2626'/>
          <circle cx='8' cy='6' r='10' fill='#b91c1c'/>
          <path d='M-8 -6 Q 0 -22 12 -16' stroke='#15803d' stroke-width='2' fill='none'/>
        </g>`,
      none: ''
    }[garnish] || '';

    // Stakan/shisha shakli
    let containerMarkup = '';
    if (type === 'glass') {
      // Sharbat stakani — apelsin sharbati kabi
      containerMarkup = `
        <path d='M 60 50 L 65 230 Q 65 250 85 250 L 165 250 Q 185 250 185 230 L 190 50 Z'
              fill='url(#liquidG)' stroke='#0f172a' stroke-width='2'/>
        <path d='M 60 50 L 190 50' stroke='#0f172a' stroke-width='3' fill='none'/>
        <path d='M 64 50 L 70 230 Q 70 245 85 245' stroke='rgba(255,255,255,.7)' stroke-width='3' fill='none'/>
        <ellipse cx='80' cy='80' rx='6' ry='25' fill='rgba(255,255,255,.5)'/>
        <line x1='110' y1='30' x2='130' y2='180' stroke='#fbbf24' stroke-width='6' stroke-linecap='round'/>
        <line x1='110' y1='30' x2='105' y2='15' stroke='#fbbf24' stroke-width='6' stroke-linecap='round'/>`;
    } else if (type === 'bottle') {
      // Shisha — gazli ichimliklar uchun
      containerMarkup = `
        <rect x='105' y='20' width='40' height='20' fill='#1e293b' rx='3'/>
        <path d='M 95 40 L 95 60 Q 80 75 80 95 L 80 235 Q 80 255 100 255 L 150 255 Q 170 255 170 235 L 170 95 Q 170 75 155 60 L 155 40 Z'
              fill='url(#liquidG)' stroke='#0f172a' stroke-width='2'/>
        <ellipse cx='95' cy='130' rx='4' ry='40' fill='rgba(255,255,255,.5)'/>
        <rect x='90' y='150' width='70' height='40' fill='rgba(255,255,255,.92)' rx='2'/>
        <text x='125' y='177' text-anchor='middle' fill='${liquid}' font-family='Arial Black' font-weight='900' font-size='14'>${label}</text>`;
    } else if (type === 'can') {
      // Banka — energetik
      containerMarkup = `
        <ellipse cx='125' cy='40' rx='45' ry='8' fill='#94a3b8'/>
        <rect x='80' y='40' width='90' height='210' fill='url(#liquidG)' stroke='#0f172a' stroke-width='2'/>
        <ellipse cx='125' cy='250' rx='45' ry='8' fill='#475569'/>
        <ellipse cx='95' cy='130' rx='4' ry='60' fill='rgba(255,255,255,.4)'/>
        <rect x='85' y='100' width='80' height='60' fill='rgba(255,255,255,.92)' rx='3'/>
        <text x='125' y='138' text-anchor='middle' fill='${liquid}' font-family='Arial Black' font-weight='900' font-size='16'>${label}</text>`;
    } else if (type === 'water') {
      // Suv shishasi
      containerMarkup = `
        <rect x='110' y='20' width='30' height='20' fill='#0ea5e9' rx='3'/>
        <path d='M 95 40 Q 95 55 85 70 L 85 240 Q 85 255 105 255 L 145 255 Q 165 255 165 240 L 165 70 Q 155 55 155 40 Z'
              fill='url(#liquidG)' stroke='#0f172a' stroke-width='2' opacity='.85'/>
        <ellipse cx='95' cy='150' rx='5' ry='60' fill='rgba(255,255,255,.6)'/>
        <rect x='90' y='130' width='70' height='40' fill='rgba(255,255,255,.95)' rx='2'/>
        <text x='125' y='157' text-anchor='middle' fill='#0ea5e9' font-family='Arial Black' font-weight='900' font-size='13'>${label}</text>`;
    }

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 280'>
        <defs>
          <linearGradient id='liquidG' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0' stop-color='${liquid}' stop-opacity='.95'/>
            <stop offset='.5' stop-color='${liquid}' stop-opacity='1'/>
            <stop offset='1' stop-color='${liquid}' stop-opacity='.75'/>
          </linearGradient>
          <radialGradient id='shineG' cx='30%' cy='30%' r='70%'>
            <stop offset='0' stop-color='#fff' stop-opacity='.7'/>
            <stop offset='1' stop-color='#fff' stop-opacity='0'/>
          </radialGradient>
        </defs>
        ${containerMarkup}
        ${garnishMarkup}
      </svg>
    `);
  }

  // Eski API saqlanib qoldi — fallback uchun
  function svgDrink(color, label) {
    return svgGlass({ liquid: color, type: 'bottle', label });
  }

  // ----- Seed boshlang'ich ma'lumotlar -----
  function seed() {
    // MUHIM: tekshiruv read() orqali (Cloud yoki localStorage) — aks holda Cloud rejimida
    // localStorage bo'sh bo'lgani uchun har yuklanishda serverdagi ma'lumot o'chib ketardi.
    if (!read(KEYS.products, null)) write(KEYS.products, []);
    if (!read(KEYS.orders, null))   write(KEYS.orders, []);
    if (!read(KEYS.users, null))    write(KEYS.users, []);
    if (!read(KEYS.settings, null)) write(KEYS.settings, { shopName: 'Salqin', currency: "so'm" });
  }

  // ----- Mahsulotlar -----
  const products = {
    all: () => read(KEYS.products, []),
    get: (id) => products.all().find(p => p.id === id),
    add: (p) => {
      const list = products.all();
      const item = { id: uid(), createdAt: Date.now(), ...p };
      list.unshift(item);
      write(KEYS.products, list);
      return item;
    },
    update: (id, patch) => {
      const list = products.all().map(p => p.id === id ? { ...p, ...patch } : p);
      write(KEYS.products, list);
    },
    remove: (id) => write(KEYS.products, products.all().filter(p => p.id !== id)),
    categoriesOnly: () => {
      const set = new Set(products.all().map(p => p.category).filter(Boolean));
      return Array.from(set);
    },
    categories: () => ['Barchasi', ...products.categoriesOnly()],
    finalPrice: (p) => Math.round(p.price * (1 - (p.discount || 0) / 100)),
  };

  // ----- Foydalanuvchilar -----
  const users = {
    all: () => read(KEYS.users, []),
    get: (id) => users.all().find(u => u.id === id),
    findByPhone: (phone) => users.all().find(u => u.phone === phone),
    register: ({ name, phone, password, address = '' }) => {
      if (users.findByPhone(phone)) throw new Error('Bu telefon raqami avval ro\'yxatdan o\'tgan');
      const list = users.all();
      // Parol ochiq matnda saqlanmaydi — faqat SHA-256 hash
      const u = { id: uid(), name, phone, passHash: hashPass(password), address, createdAt: Date.now() };
      list.push(u);
      write(KEYS.users, list);
      return u;
    },
    login: (phone, password) => {
      const u = users.findByPhone(phone);
      const ok = u && (u.passHash
        ? u.passHash === hashPass(password)
        : u.password === password); // eski (ochiq matnli) yozuvlar uchun
      if (!ok) throw new Error('Telefon yoki parol noto\'g\'ri');
      // Eski yozuvni hashlangan ko'rinishga migratsiya qilamiz
      if (!u.passHash) {
        const list = users.all().map(x => {
          if (x.id !== u.id) return x;
          const { password: _omit, ...rest } = x;
          return { ...rest, passHash: hashPass(password) };
        });
        write(KEYS.users, list);
      }
      write(KEYS.session, { userId: u.id, at: Date.now() });
      return u;
    },
    logout: () => localStorage.removeItem(KEYS.session),
    current: () => {
      const s = read(KEYS.session, null);
      return s ? users.get(s.userId) : null;
    },
    update: (id, patch) => {
      const list = users.all().map(u => u.id === id ? { ...u, ...patch } : u);
      write(KEYS.users, list);
    },
    remove: (id) => write(KEYS.users, users.all().filter(u => u.id !== id)),
  };

  // ----- Savat -----
  const cart = {
    all: () => read(KEYS.cart, []),
    count: () => cart.all().reduce((s, i) => s + i.qty, 0),
    total: () => cart.all().reduce((s, i) => s + i.qty * products.finalPrice(products.get(i.productId) || { price: 0 }), 0),
    add: (productId, qty = 1) => {
      const list = cart.all();
      const ex = list.find(i => i.productId === productId);
      if (ex) ex.qty += qty;
      else list.push({ productId, qty });
      write(KEYS.cart, list);
    },
    setQty: (productId, qty) => {
      let list = cart.all().map(i => i.productId === productId ? { ...i, qty } : i);
      list = list.filter(i => i.qty > 0);
      write(KEYS.cart, list);
    },
    remove: (productId) => write(KEYS.cart, cart.all().filter(i => i.productId !== productId)),
    clear: () => write(KEYS.cart, []),
  };

  // ----- Buyurtmalar -----
  const orders = {
    all: () => read(KEYS.orders, []),
    byUser: (userId) => orders.all().filter(o => o.userId === userId),
    place: ({ userId, name, phone, address, note, payment, paymentMeta }) => {
      const items = cart.all().map(i => {
        const p = products.get(i.productId);
        return {
          productId: p.id,
          name: p.name,
          qty: i.qty,
          price: p.price,
          discount: p.discount || 0,
          finalPrice: products.finalPrice(p),
          // Diqqat: rasm bu yerda saqlanmaydi — localStorage kvotasini tejash uchun
          // ko'rinish vaqtida productId orqali products dan olinadi.
        };
      });
      if (!items.length) throw new Error('Savat bo\'sh');
      const total = items.reduce((s, i) => s + i.qty * i.finalPrice, 0);
      const now = Date.now();
      const order = {
        id: uid(),
        userId, name, phone, address, note, payment,
        paymentMeta: paymentMeta || null,
        items, total,
        status: 'yangi',
        statusHistory: [{ status: 'yangi', at: now }],
        createdAt: now,
      };
      const list = orders.all();
      list.unshift(order);
      write(KEYS.orders, list);

      // Stockdan ayirish
      items.forEach(i => {
        const p = products.get(i.productId);
        if (p) products.update(p.id, { stock: Math.max(0, (p.stock || 0) - i.qty) });
      });

      cart.clear();
      return order;
    },
    update: (id, patch) => {
      const list = orders.all().map(o => {
        if (o.id !== id) return o;
        const next = { ...o, ...patch };
        if (patch.status && patch.status !== o.status) {
          next.statusHistory = [...(o.statusHistory || []), { status: patch.status, at: Date.now() }];
        }
        return next;
      });
      write(KEYS.orders, list);
    },
    remove: (id) => write(KEYS.orders, orders.all().filter(o => o.id !== id)),
  };

  // ----- Bildirishnomalar (status o'zgarishlari foydalanuvchi ko'rmaganlar) -----
  const notifications = {
    seenMap: () => read(KEYS.seenStatuses, {}),
    // Foydalanuvchi uchun yangi status o'zgarishlari ro'yxati
    forUser: (userId) => {
      if (!userId) return [];
      const seen = notifications.seenMap();
      const out = [];
      orders.byUser(userId).forEach(o => {
        (o.statusHistory || []).forEach(h => {
          if (h.status === 'yangi') return;
          const key = `${o.id}:${h.status}`;
          if (!seen[key]) {
            out.push({ orderId: o.id, status: h.status, at: h.at, key });
          }
        });
      });
      return out.sort((a, b) => b.at - a.at);
    },
    markAllSeen: (userId) => {
      const seen = notifications.seenMap();
      orders.byUser(userId).forEach(o => {
        (o.statusHistory || []).forEach(h => {
          if (h.status !== 'yangi') seen[`${o.id}:${h.status}`] = Date.now();
        });
      });
      write(KEYS.seenStatuses, seen);
    },
  };

  // ----- Admin -----
  // Eslatma: bu himoya faqat client-side (localStorage). Jiddiy himoya uchun
  // admin.html ni server darajasida (nginx basic auth / backend auth) yoping.
  const admin = {
    _creds: () => read(KEYS.adminCreds, null) || { login: ADMIN_DEFAULT_LOGIN, hash: ADMIN_DEFAULT_HASH() },
    login: (l, p) => {
      const c = admin._creds();
      if (l === c.login && hashPass(p) === c.hash) {
        write(KEYS.adminSession, { at: Date.now() });
        return true;
      }
      throw new Error('Admin login yoki parol noto\'g\'ri');
    },
    changePassword: (oldPass, newPass) => {
      const c = admin._creds();
      if (hashPass(oldPass) !== c.hash) throw new Error('Joriy parol noto\'g\'ri');
      if (!newPass || newPass.length < 6) throw new Error('Yangi parol kamida 6 belgidan iborat bo\'lsin');
      write(KEYS.adminCreds, { login: c.login, hash: hashPass(newPass) });
      return true;
    },
    isDefaultPassword: () => admin._creds().hash === ADMIN_DEFAULT_HASH(),
    logout: () => localStorage.removeItem(KEYS.adminSession),
    isAuthed: () => !!read(KEYS.adminSession, null),
  };

  // ----- Statistika -----
  const stats = {
    revenueIn: (from, to) => orders.all()
      .filter(o => o.status !== 'bekor' && o.createdAt >= from && o.createdAt <= to)
      .reduce((s, o) => s + o.total, 0),
    countIn: (from, to) => orders.all()
      .filter(o => o.createdAt >= from && o.createdAt <= to).length,
    today() {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      return this.revenueIn(d.getTime(), Date.now());
    },
    week() {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - 6);
      return this.revenueIn(d.getTime(), Date.now());
    },
    month() {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(1);
      return this.revenueIn(d.getTime(), Date.now());
    },
    last7Days() {
      const arr = [];
      const today = new Date(); today.setHours(0,0,0,0);
      for (let i = 6; i >= 0; i--) {
        const day = new Date(today); day.setDate(today.getDate() - i);
        const next = new Date(day); next.setDate(day.getDate() + 1);
        arr.push({
          label: day.toLocaleDateString('uz-UZ', { weekday: 'short', day: '2-digit' }),
          revenue: this.revenueIn(day.getTime(), next.getTime() - 1),
          count: this.countIn(day.getTime(), next.getTime() - 1),
        });
      }
      return arr;
    },
    topProducts(limit = 5) {
      const tally = {};
      orders.all().forEach(o => {
        if (o.status === 'bekor') return;
        o.items.forEach(i => {
          if (!tally[i.productId]) tally[i.productId] = { name: i.name, qty: 0, revenue: 0 };
          tally[i.productId].qty += i.qty;
          tally[i.productId].revenue += i.qty * i.finalPrice;
        });
      });
      return Object.values(tally).sort((a, b) => b.qty - a.qty).slice(0, limit);
    },
  };

  // ----- Chat (foydalanuvchi <-> admin) -----
  const chat = {
    all: () => read(KEYS.chat, []),
    byUser: (userId) => chat.all().filter(m => m.userId === userId),
    send: (userId, userName, text, from = 'user') => {
      const list = chat.all();
      const msg = { id: uid(), userId, userName, text, from, at: Date.now(), seen: false };
      list.push(msg);
      write(KEYS.chat, list);
      return msg;
    },
    unreadForAdmin: () => chat.all().filter(m => m.from === 'user' && !m.seen).length,
    unreadForUser: (userId) => chat.all().filter(m => m.userId === userId && m.from === 'admin' && !m.seen).length,
    markSeenByAdmin: (userId) => {
      const list = chat.all().map(m => m.userId === userId && m.from === 'user' ? { ...m, seen: true } : m);
      write(KEYS.chat, list);
    },
    markSeenByUser: (userId) => {
      const list = chat.all().map(m => m.userId === userId && m.from === 'admin' ? { ...m, seen: true } : m);
      write(KEYS.chat, list);
    },
    users: () => {
      const msgs = chat.all();
      const map = {};
      msgs.forEach(m => {
        if (!map[m.userId]) map[m.userId] = { userId: m.userId, userName: m.userName, lastMsg: m, unread: 0 };
        map[m.userId].lastMsg = m;
        if (m.from === 'user' && !m.seen) map[m.userId].unread++;
      });
      return Object.values(map).sort((a, b) => b.lastMsg.at - a.lastMsg.at);
    },
  };

  // ----- O'zbekiston viloyatlari va tumanlari -----
  const regions = {
    "Toshkent shahri": ["Bektemir","Chilonzor","Mirobod","Mirzo Ulug'bek","Olmazor","Sergeli","Shayhontohur","Uchtepa","Yakkasaroy","Yashnobod","Yunusobod"],
    "Toshkent viloyati": ["Angren","Bekobod","Olmaliq","Chirchiq","Ohangaron","Nurafshon","Yangiyo'l","Bo'ka","Bo'stonliq","Chinoz","Qibray","Oqqo'rg'on","Parkent","Piskent","Toshkent tumani","Zangiota","Yuqorichirchiq","O'rtachirchiq","Quyichirchiq"],
    "Andijon viloyati": ["Andijon","Xonobod","Asaka","Baliqchi","Bo'z","Buloqboshi","Izboskan","Jalolquduq","Marhamat","Oltinko'l","Paxtaobod","Shahrixon","Ulug'nor","Xo'jaobod","Qo'rg'ontepa"],
    "Buxoro viloyati": ["Buxoro","Kogon","G'ijduvon","Jondor","Olot","Peshku","Qorako'l","Qorovulbozor","Romitan","Shofirkon","Vobkent"],
    "Farg'ona viloyati": ["Farg'ona","Marg'ilon","Quvasoy","Qo'qon","Beshariq","Bog'dod","Dang'ara","Furqat","Oltiariq","Quva","Rishton","So'x","Toshloq","Uchko'prik","O'zbekiston","Yozyovon"],
    "Jizzax viloyati": ["Jizzax","Arnasoy","Baxmal","Do'stlik","Forish","G'allaorol","Mirzacho'l","Paxtakor","Yangiobod","Zafarobod","Zaamin","Zarbdor"],
    "Xorazm viloyati": ["Urganch","Xiva","Bog'ot","Gurlan","Qo'shko'pir","Shovot","Xazarasp","Xonqa","Yangiariq","Yangibozor","Tuproqqal'a"],
    "Namangan viloyati": ["Namangan","Chortoq","Chust","Kosonsoy","Mingbuloq","Norin","Pop","To'raqo'rg'on","Uchqo'rg'on","Yangiqo'rg'on"],
    "Navoiy viloyati": ["Navoiy","Zarafshon","Karmana","Konimex","Navbahor","Nurota","Qiziltepa","Tomdi","Uchquduq","Xatirchi"],
    "Qashqadaryo viloyati": ["Qarshi","Shahrisabz","Chiroqchi","Dehqonobod","G'uzor","Kasbi","Kitob","Koson","Mirishkor","Muborak","Nishon","Yakkabog'","Qamashi"],
    "Samarqand viloyati": ["Samarqand","Kattaqo'rg'on","Bulung'ur","Ishtixon","Jomboy","Narpay","Nurobod","Oqdaryo","Pastdarg'om","Payariq","Paxtachi","Qo'shrabot","Toyloq","Urgut"],
    "Sirdaryo viloyati": ["Guliston","Yangiyer","Boyovut","Oqoltin","Sardoba","Sayxunobod","Sirdaryo","Xovos","Mirzaobod"],
    "Surxondaryo viloyati": ["Termiz","Angor","Bandixon","Boysun","Denov","Jarqo'rg'on","Kizirik","Muzrabot","Oltinsoy","Sariosiyo","Sherobod","Sho'rchi","Uzun","Qumqo'rg'on"],
    "Qoraqalpog'iston": ["Nukus","Mo'ynoq","Amudaryo","Beruniy","Chimboy","Ellikqal'a","Kegeyli","Qanliko'l","Qo'ng'irot","Shumanay","Taxtako'pir","To'rtko'l","Xo'jayli"],
  };

  // ----- Mavzu -----
  const theme = {
    get: () => localStorage.getItem(KEYS.theme) || 'dark',
    set: (t) => localStorage.setItem(KEYS.theme, t),
    toggle: () => { const t = theme.get() === 'light' ? 'dark' : 'light'; theme.set(t); return t; },
  };

  // ----- Formatlash yordamchilari -----
  const fmt = {
    money: (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0)) + " so'm",
    date: (ts) => new Date(ts).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }),
    dateOnly: (ts) => new Date(ts).toLocaleDateString('uz-UZ'),
    timeAgo: (ts) => {
      const s = Math.round((Date.now() - ts) / 1000);
      if (s < 60) return 'hozir';
      if (s < 3600) return Math.floor(s / 60) + ' daqiqa oldin';
      if (s < 86400) return Math.floor(s / 3600) + ' soat oldin';
      return Math.floor(s / 86400) + ' kun oldin';
    },
  };

  seed();
  return { products, users, cart, orders, notifications, admin, stats, chat, regions, theme, fmt, esc, svgDrink, svgGlass };
})();
