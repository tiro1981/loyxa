/* ============================================================
   KOFE KAFE — mijoz ilovasi ("Katta kartalar" maketi, kofe-kafe-reja-2-variant.pdf)
   Ko'rinishlar: home (bosh), menu, product, cart (chek), orders, profile, chat.
   Ma'lumot: Cloud "menu" / "orders" / "customers" / "messages" / "settings" (app="kofe").
   Savat va profil — shu qurilmada (localStorage, mijoz ID bo'yicha).
   ============================================================ */
(function () {
  "use strict";
  const K = window.KOFE;
  const { fmt, esc } = K;
  const CID = window.__CLIENT_ID || "demo";
  const params = new URLSearchParams(location.search);
  const TABLE = (params.get("stol") || "").replace(/\D/g, "").slice(0, 3);   // stol QR: ?stol=5

  const LS_CART = "kofe_cart__" + CID;
  const LS_PROFILE = "kofe_profile__" + CID;
  const LS_MYORDERS = "kofe_myorders__" + CID;
  const LS_CHATSEEN = "kofe_chatseen__" + CID;
  const TIPS = [0, 2000, 5000, 10000];

  /* ---------- ikonkalar ---------- */
  const sv = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  const I = {
    home: sv('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
    cart: sv('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h2.5l2.2 12.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>'),
    orders: sv('<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5Z"/><path d="M9 8h6M9 12h6"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>'),
    plus: sv('<path d="M12 5v14M5 12h14"/>'),
    back: sv('<path d="m15 5-7 7 7 7"/>'),
    bell: sv('<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    chat: sv('<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z"/>'),
    send: sv('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'),
    pin: sv('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>'),
    card: sv('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/>'),
    globe: sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    check: sv('<path d="m5 12 5 5 9-10"/>'),
    x: sv('<path d="M18 6 6 18M6 6l12 12"/>'),
  };

  /* ---------- ma'lumot ---------- */
  function menu() {
    const m = Cloud.get("menu", null);
    if (m && Array.isArray(m.products)) return m;
    return { categories: K.CATEGORIES, products: K.PRODUCTS };
  }
  function settings() { return Object.assign({}, K.SETTINGS, Cloud.get("settings", null) || {}); }
  function product(id) { return menu().products.find((p) => String(p.id) === String(id)); }
  function category(id) { return menu().categories.find((c) => c.id === id); }
  function isDrink(p) { const c = category(p.cat); return !!(c && c.drink); }
  const avail = (p) => p.available !== false;

  const ls = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  let cart = ls.get(LS_CART, []);
  const saveCart = () => { ls.set(LS_CART, cart); renderTabs(); };
  const profile = () => ls.get(LS_PROFILE, { name: "", phone: "", address: "" });
  const normPhone = (p) => (p || "").replace(/\D/g, "").slice(-9);

  function customer() {
    const ph = normPhone(profile().phone);
    if (!ph) return null;
    return (Cloud.get("customers", []) || []).find((c) => normPhone(c.phone) === ph) || null;
  }
  function myOrders() {
    const ids = ls.get(LS_MYORDERS, []);
    const ph = normPhone(profile().phone);
    return (Cloud.get("orders", []) || [])
      .filter((o) => ids.includes(o.id) || (ph && normPhone(o.phone) === ph))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  // Admin bilan yozishma (Cloud "messages", telefon raqami bo'yicha)
  function myMessages() {
    const ph = normPhone(profile().phone);
    if (!ph) return [];
    return (Cloud.get("messages", []) || []).filter((m) => normPhone(m.phone) === ph);
  }
  function unreadAdmin() {
    const seen = ls.get(LS_CHATSEEN, "");
    return myMessages().filter((m) => m.from === "admin" && m.at > seen).length;
  }
  // "Kun ichimligi": admin tanlagan mahsulot, bo'lmasa birinchi mashhur ichimlik
  function featured() {
    const ps = menu().products.filter(avail);
    const id = settings().featured;
    return ps.find((p) => String(p.id) === String(id)) || ps.find((p) => p.popular && isDrink(p)) || ps[0] || null;
  }

  /* ---------- holat va navigatsiya ---------- */
  const state = { view: "home", cat: "all", q: "", searching: false, pid: null, sel: null, qty: 1, type: TABLE ? "table" : "pickup", tip: 0 };
  const $view = document.getElementById("view");
  function go(view, extra) {
    Object.assign(state, { view }, extra || {});
    render();
    window.scrollTo(0, 0);
  }

  let toastT;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }
  const thumb = (p) => (p.image ? '<img src="' + esc(p.image) + '" alt="">' : esc(p.emoji || "☕"));
  const initial = (n) => esc(((n || "").trim().charAt(0) || "?").toUpperCase());
  const dm = (iso) => { const d = new Date(iso); return d.getDate() + "-" + ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"][d.getMonth()]; };

  /* ---------- 1. Bosh sahifa ---------- */
  function viewHome() {
    const s = settings();
    const pr = profile();
    const m = menu();
    const f = featured();
    const hello = pr.name ? "Salom," : (new Date().getHours() < 12 ? "Xayrli tong" : "Xush kelibsiz");
    return (
      '<div class="top"><div class="hello"><span class="av">' + (pr.name ? initial(pr.name) : "☕") + '</span><div><small>' + esc(hello) + (TABLE ? " · Stol " + esc(TABLE) : "") + "</small><b>" + esc(pr.name || s.shopName) + "</b></div></div>" +
      '<button class="ib" data-go="orders" aria-label="Buyurtmalarim">' + I.bell + (myOrders().some((o) => o.status === "ready") ? '<i class="ib-dot"></i>' : "") + "</button></div>" +
      (f ? '<div class="hero-card"><div class="hero-txt"><small>Kun ichimligi</small><h2>' + esc(f.name) + "</h2><p>" + fmt(f.price) + " so'm</p>" +
        '<button class="pill-btn" data-p="' + esc(f.id) + '">Buyurtma</button></div><div class="hero-art">' + thumb(f) + "</div></div>" : "") +
      '<div class="sec-head"><h2>Toifalar</h2><button data-go="menu">Hammasi</button></div>' +
      '<div class="tiles">' + m.categories.map((c) =>
        '<button class="tile" data-tocat="' + esc(c.id) + '"><span class="tile-ic">' + esc(c.emoji) + "</span><span><b>" + esc(c.name) + "</b><small>" + m.products.filter((p) => p.cat === c.id && avail(p)).length + " ta</small></span></button>").join("") + "</div>" +
      loyaltyStrip()
    );
  }
  function loyaltyStrip() {
    const every = settings().loyaltyEvery || 5;
    const c = customer();
    const have = c ? Math.min(c.stamps || 0, every) : 0;
    return '<div class="loy-strip"><div><b>Har ' + every + "-chi qahva sovg'a</b><small>Sadoqat kartangiz: " + have + "/" + every + '</small></div><div class="dots">' +
      Array.from({ length: every }, (_, i) => '<i class="' + (i < have ? "on" : "") + '"></i>').join("") + "</div></div>";
  }

  /* ---------- 2. Menyu ---------- */
  function viewMenu() {
    const m = menu();
    const q = state.q.trim().toLowerCase();
    let list = m.products.filter((p) => state.cat === "all" || p.cat === state.cat);
    if (q) list = m.products.filter((p) => (p.name + " " + (p.desc || "")).toLowerCase().includes(q));
    return (
      '<div class="top"><h1>Menyu</h1><button class="ib" id="toggleSearch" aria-label="Qidirish" aria-expanded="' + state.searching + '">' + (state.searching ? I.x : I.search) + "</button></div>" +
      (state.searching ? '<label class="search">' + I.search + '<input id="q" type="search" placeholder="Latte, cappuccino, desert..." value="' + esc(state.q) + '" aria-label="Qidirish"></label>' : "") +
      '<div class="tabs" role="tablist"><button role="tab" class="' + (state.cat === "all" ? "on" : "") + '" data-cat="all">Hammasi</button>' +
      m.categories.map((c) => '<button role="tab" class="' + (state.cat === c.id ? "on" : "") + '" data-cat="' + esc(c.id) + '">' + esc(c.name) + "</button>").join("") + "</div>" +
      (list.length ? '<div class="grid">' + list.map(card).join("") + "</div>"
        : '<div class="empty"><div class="e">🔍</div><h3>Hech narsa topilmadi</h3><p>Boshqa so\'z bilan qidirib ko\'ring.</p></div>')
    );
  }
  function card(p) {
    const off = !avail(p);
    const tag = off ? '<span class="tag off">Tugagan</span>' : p.popular ? '<span class="tag">HIT</span>' : p.isNew ? '<span class="tag">YANGI</span>' : "";
    return '<button class="pcard' + (off ? " off" : "") + '" data-p="' + esc(p.id) + '"><span class="pimg">' + tag + thumb(p) +
      (off ? "" : '<span class="padd" aria-hidden="true">' + I.plus + "</span>") + '</span><b>' + esc(p.name) + "</b><small>" + fmt(p.price) + "</small></button>";
  }

  /* ---------- 3. Mahsulot ---------- */
  function defaultSel(p) {
    return { size: p.opts && p.opts.s ? "M" : null, milk: p.opts && p.opts.m ? "oddiy" : null, sweet: p.opts && p.opts.sw ? 1 : null };
  }
  function viewProduct() {
    const p = product(state.pid);
    if (!p) { state.view = "menu"; return viewMenu(); }
    const sel = state.sel;
    const unit = K.linePrice(p, sel);
    const o = p.opts || {};
    const chips = (title, items, key, isOn, sub) =>
      '<div class="opt"><small>' + title + '</small><div class="chips">' +
      items.map((it) => '<button data-opt="' + key + '" data-v="' + esc(it.id) + '" class="chip' + (isOn(it) ? " on" : "") + '">' + esc(it.label) + (sub(it) ? " <i>" + esc(sub(it)) + "</i>" : "") + "</button>").join("") + "</div></div>";
    return (
      '<div class="hero">' + thumb(p) + '<button class="ib" data-back aria-label="Orqaga">' + I.back + "</button>" + (p.popular ? '<span class="tag">HIT</span>' : p.isNew ? '<span class="tag">YANGI</span>' : "") + "</div>" +
      '<div class="p-title"><h1>' + esc(p.name) + '</h1><span class="pr">' + fmt(unit) + "</span></div>" +
      '<p class="p-desc">' + esc(p.desc || "") + "</p>" +
      (o.s ? chips("Hajmi", K.SIZES, "size", (it) => sel.size === it.id, (it) => it.vol) : "") +
      (o.m ? chips("Sut turi", K.MILKS, "milk", (it) => sel.milk === it.id, (it) => (it.add ? "+" + fmt(it.add) : "")) : "") +
      (o.sw ? chips("Shirinlik", K.SWEET, "sweet", (it) => sel.sweet === it.id, () => "") : "") +
      '<div style="height:80px"></div><div class="dock">' +
      '<div class="stepper"><button data-qty="-1" aria-label="Kamaytirish">−</button><span>' + state.qty + '</span><button data-qty="1" aria-label="Ko\'paytirish">+</button></div>' +
      '<button class="btn-main" id="addCart"' + (avail(p) ? "" : " disabled") + "><span>" + (avail(p) ? "Savatga qo'shish" : "Mavjud emas") + "</span><span>" + fmt(unit * state.qty) + "</span></button></div>"
    );
  }

  /* ---------- 4. Savat (chek) ---------- */
  function cartLines() {
    return cart.map((l) => {
      const p = product(l.pid);
      if (!p) return null;
      return Object.assign({}, l, { p, unit: K.linePrice(p, l.sel), label: K.optsLabel(p, l.sel) });
    }).filter(Boolean);
  }
  // Sadoqat: markalar yetarli bo'lsa eng arzon ichimlik sovg'a
  function loyaltyDiscount(lines) {
    const every = settings().loyaltyEvery || 5;
    const c = customer();
    if (!c || (c.stamps || 0) < every) return { amount: 0, use: 0 };
    const drinks = lines.filter((l) => isDrink(l.p) && avail(l.p));
    if (!drinks.length) return { amount: 0, use: 0 };
    return { amount: Math.min.apply(null, drinks.map((l) => l.unit)), use: every };
  }
  const eta = (lines) => Math.min(25, 3 + lines.reduce((a, l) => a + l.qty, 0) * 2);
  function viewCart() {
    const lines = cartLines();
    const s = settings();
    if (!lines.length) {
      return '<div class="top"><h1>Savat</h1></div><div class="empty"><div class="e">☕</div><h3>Savat bo\'sh</h3><p>Menyudan ichimlik tanlang.</p><div style="height:16px"></div><button class="pill-btn" data-go="menu">Menyuni ochish</button></div>';
    }
    const subtotal = lines.reduce((a, l) => a + l.unit * l.qty, 0);
    const disc = loyaltyDiscount(lines);
    const total = Math.max(0, subtotal - disc.amount) + state.tip;
    const pr = profile();
    const typeTxt = TABLE ? "Stol " + esc(TABLE) : state.type === "delivery" ? "Yetkazib berish" : "Olib ketish";
    return (
      '<div class="top"><div><h1>Savat</h1><small class="sub">' + lines.reduce((a, l) => a + l.qty, 0) + " ta mahsulot</small></div></div>" +
      '<div class="receipt"><small class="r-cap">Buyurtma cheki</small>' +
      lines.map((l, i) =>
        '<div class="r-line"><div class="r-b"><b>' + esc(l.p.name) + (l.p.opts && l.p.opts.s && l.sel.size ? " " + esc(l.sel.size) : "") + "</b><small>" + esc(l.label || "") + '</small></div>' +
        '<div class="r-q"><button data-cq="' + i + '" data-d="-1" aria-label="Kamaytirish">−</button><span>' + l.qty + '</span><button data-cq="' + i + '" data-d="1" aria-label="Ko\'paytirish">+</button></div>' +
        "<span class=\"r-p\">" + fmt(l.unit * l.qty) + "</span></div>").join("") +
      (disc.amount ? '<div class="r-line r-gift"><div class="r-b"><b>Sadoqat sovg\'asi</b><small>Har ' + (s.loyaltyEvery || 5) + '-chi ichimlik bepul</small></div><span class="r-p">−' + fmt(disc.amount) + "</span></div>" : "") +
      (state.tip ? '<div class="r-line"><div class="r-b"><b>Choychaq</b></div><span class="r-p">' + fmt(state.tip) + "</span></div>" : "") +
      '<div class="r-cut"></div><div class="r-total"><b>Jami</b><b>' + fmt(total) + " so'm</b></div>" +
      '<small class="r-note">' + typeTxt + " · tayyor bo'lish ~" + eta(lines) + " daqiqa</small></div>" +
      '<div class="opt"><small>Qanday olasiz</small><div class="chips">' +
      (TABLE ? '<button class="chip on" disabled>Stol ' + esc(TABLE) + "</button>"
        : '<button class="chip' + (state.type === "pickup" ? " on" : "") + '" data-type="pickup">Olib ketaman</button>') +
      '<button class="chip' + (s.delivery && state.type === "delivery" ? " on" : "") + '" data-type="delivery"' + (s.delivery ? "" : " disabled") + ">Yetkazish" + (s.delivery ? "" : " · tez orada") + "</button></div></div>" +
      '<div class="opt"><small>Choychaq</small><div class="chips">' + TIPS.map((t) => '<button class="chip' + (state.tip === t ? " on" : "") + '" data-tip="' + t + '">' + (t ? fmt(t) : "Yo'q") + "</button>").join("") + "</div></div>" +
      '<div class="card form-card">' +
      '<div class="field"><label for="fName">Ismingiz</label><input id="fName" autocomplete="name" value="' + esc(pr.name) + '" placeholder="Aziza"></div>' +
      '<div class="field"><label for="fPhone">Telefon</label><input id="fPhone" type="tel" autocomplete="tel" inputmode="tel" value="' + esc(pr.phone) + '" placeholder="+998 90 123 45 67"></div>' +
      (state.type === "delivery" ? '<div class="field"><label for="fAddr">Manzil</label><input id="fAddr" autocomplete="street-address" value="' + esc(pr.address || "") + '" placeholder="Ko\'cha, uy"></div>' : "") +
      '<div class="field"><label for="fNote">Izoh (ixtiyoriy)</label><input id="fNote" placeholder="Masalan: muzsiz"></div>' +
      '<span class="err" id="fErr" role="alert"></span></div>' +
      '<div style="height:80px"></div><div class="dock"><button class="btn-main" id="placeOrder"><span>To\'lash</span><span>' + fmt(total) + "</span></button></div>"
    );
  }

  async function placeOrder(btn) {
    const name = document.getElementById("fName").value.trim();
    const phone = document.getElementById("fPhone").value.trim();
    const addrEl = document.getElementById("fAddr");
    const address = addrEl ? addrEl.value.trim() : "";
    const note = document.getElementById("fNote").value.trim();
    const err = document.getElementById("fErr");
    if (name.length < 2) { err.textContent = "Ismingizni kiriting"; return; }
    if (normPhone(phone).length < 9) { err.textContent = "Telefon raqamini to'liq kiriting"; return; }
    if (state.type === "delivery" && address.length < 4) { err.textContent = "Manzilni kiriting"; return; }
    err.textContent = "";
    ls.set(LS_PROFILE, Object.assign(profile(), { name, phone }, address ? { address } : {}));

    const lines = cartLines().filter((l) => avail(l.p));
    if (!lines.length) { toast("Savatdagi mahsulotlar hozir mavjud emas"); return; }
    btn.disabled = true;

    const disc = loyaltyDiscount(lines);
    const subtotal = lines.reduce((a, l) => a + l.unit * l.qty, 0);
    const type = TABLE ? "table" : state.type;
    const orders = (await Cloud.fetchKey("orders", [])) || [];
    const nextNo = orders.reduce((m, o) => Math.max(m, o.no || 0), 1000) + 1;
    const order = {
      id: "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      no: nextNo,
      createdAt: new Date().toISOString(),
      name, phone, note,
      type, table: TABLE || null, address: type === "delivery" ? address : "",
      items: lines.map((l) => ({ pid: l.p.id, name: l.p.name, opts: l.label, qty: l.qty, price: l.unit, drink: isDrink(l.p) })),
      subtotal, discount: disc.amount, tip: state.tip, total: Math.max(0, subtotal - disc.amount) + state.tip,
      eta: eta(lines),
      status: "new",
    };
    orders.push(order);
    Cloud.set("orders", orders);

    // Sadoqat: ishlatilgan markalar ayiriladi, har bir ichimlik uchun marka qo'shiladi
    const customers = (await Cloud.fetchKey("customers", [])) || [];
    const ph = normPhone(phone);
    let cu = customers.find((c) => normPhone(c.phone) === ph);
    if (!cu) { cu = { phone, name, stamps: 0, orders: 0, spent: 0, free: 0, createdAt: order.createdAt }; customers.push(cu); }
    cu.name = name;
    cu.stamps = Math.max(0, (cu.stamps || 0) - disc.use) + order.items.filter((i) => i.drink).reduce((a, i) => a + i.qty, 0);
    if (disc.amount) cu.free = (cu.free || 0) + 1;
    cu.orders = (cu.orders || 0) + 1;
    cu.spent = (cu.spent || 0) + order.total;
    cu.lastAt = order.createdAt;
    Cloud.set("customers", customers);

    const mine = ls.get(LS_MYORDERS, []);
    mine.push(order.id);
    ls.set(LS_MYORDERS, mine.slice(-50));
    cart = [];
    state.tip = 0;
    saveCart();

    // Telegram xabari — buyurtma allaqachon saqlangan, xato bo'lsa ham yo'qolmaydi
    if (window.Telegram && Telegram.sendOrder) {
      Telegram.sendOrder({
        id: "#" + order.no, userName: name, phone,
        address: type === "table" ? "Stol " + TABLE : type === "delivery" ? "Yetkazish: " + address : "Olib ketish",
        payment: "Joyida" + (order.tip ? " · choychaq " + fmt(order.tip) : "") + (note ? " · " + note : ""),
        items: order.items.map((i) => ({ name: i.name + (i.opts ? " (" + i.opts + ")" : ""), qty: i.qty, price: i.price })),
        total: order.total,
      });
    }
    toast("Buyurtma #" + order.no + " qabul qilindi");
    go("orders");
  }

  /* ---------- 5. Buyurtmalar ---------- */
  const STEPS = [["new", "Qabul"], ["preparing", "Tayyorlash"], ["ready", "Tayyor"]];
  function viewOrders() {
    const list = myOrders();
    if (!list.length) {
      return '<div class="top"><h1>Buyurtmalar</h1></div><div class="empty"><div class="e">🧾</div><h3>Hali buyurtma yo\'q</h3><p>Birinchi qahvangizni buyurtma qiling.</p><div style="height:16px"></div><button class="pill-btn" data-go="menu">Menyuni ochish</button></div>';
    }
    const active = list.filter((o) => ["new", "preparing", "ready"].includes(o.status));
    const past = list.filter((o) => !["new", "preparing", "ready"].includes(o.status));
    const statusCard = (o) => {
      const idx = STEPS.findIndex((s) => s[0] === o.status);
      const left = Math.max(1, Math.round((o.eta || 8) - (Date.now() - new Date(o.createdAt)) / 60000));
      const title = o.status === "ready" ? "Tayyor! Olib keting" : o.status === "preparing" ? "Tayyorlanmoqda" : "Qabul qilindi";
      return '<div class="status-card"><small>№' + o.no + " · " + (o.type === "table" ? "Stol " + esc(o.table) : o.type === "delivery" ? "Yetkazish" : "Olib ketish") + "</small><h2>" + title + "</h2>" +
        "<p>" + (o.status === "ready" ? "Kassadan olishingiz mumkin" : "Taxminan " + left + " daqiqa") + "</p>" +
        '<div class="steps">' + STEPS.map((s, k) => '<div class="step' + (k < idx ? " done" : k === idx ? " cur" : "") + '"><i>' + (k < idx ? I.check : "") + "</i><span>" + s[1] + "</span></div>").join("") + "</div>" +
        '<div class="sc-items">' + o.items.map((i) => esc(i.qty + "× " + i.name)).join(", ") + " · <b>" + fmt(o.total) + " so'm</b></div></div>";
    };
    return (
      '<div class="top"><h1>Buyurtmalar</h1></div>' + active.map(statusCard).join("") +
      (past.length ? '<div class="sec-head"><h2>Oldingi</h2></div><div class="grid">' + past.map((o) =>
        '<div class="ocard' + (o.status === "cancelled" ? " off" : "") + '"><small>' + dm(o.createdAt) + (o.status === "cancelled" ? " · bekor" : "") + "</small><b>" + esc(o.items[0].name) + (o.items.length > 1 ? " +" + (o.items.length - 1) : "") + "</b><span>" + fmt(o.total) + '</span><button class="pill-btn sm" data-reorder="' + esc(o.id) + '">Qayta</button></div>').join("") + "</div>" : "")
    );
  }

  /* ---------- 6. Profil ---------- */
  function viewProfile() {
    const pr = profile();
    const c = customer();
    const s = settings();
    const every = s.loyaltyEvery || 5;
    const orders = c ? c.orders || 0 : myOrders().length;
    const tier = orders >= 10 ? "Doimiy mehmon" : orders >= 1 ? "Mehmon" : "Yangi mehmon";
    const unread = unreadAdmin();
    return (
      '<div class="prof"><span class="avatar">' + (pr.name ? initial(pr.name) : "☕") + "</span><h2>" + esc(pr.name || "Mehmon") + "</h2><small>" + esc(pr.phone ? tier : "Ism va telefoningizni kiriting") + "</small></div>" +
      '<div class="stats"><div><b>' + orders + "</b><small>Buyurtma</small></div><div><b>" + (c ? Math.min(c.stamps || 0, every) : 0) + "/" + every + "</b><small>Marka</small></div><div><b>" + (c ? c.free || 0 : 0) + "</b><small>Bepul</small></div></div>" +
      '<div class="tiles">' +
      '<button class="tile col" data-sheet="addr">' + I.pin + "<b>Manzillar</b></button>" +
      '<button class="tile col" data-sheet="pay">' + I.card + "<b>To'lovlar</b></button>" +
      '<button class="tile col" data-sheet="lang">' + I.globe + "<b>Til</b></button>" +
      '<button class="tile col" data-go="chat">' + I.chat + "<b>Xabarlar</b>" + (unread ? '<span class="cnt-dot">' + unread + "</span>" : "") + "</button></div>" +
      sheet() +
      '<div class="card info-card"><div class="sum-row"><span>Ish vaqti</span><span>' + esc(s.hours) + '</span></div><div class="sum-row"><span>Manzil</span><span>' + esc(s.address) + '</span></div><div class="sum-row"><span>Telefon</span><span>' + esc(s.phone) + "</span></div></div>" +
      '<p class="foot-note">' + esc(s.shopName) + " · v2.0</p>"
    );
  }
  // Profil plitkalari ostida ochiladigan kichik panel
  function sheet() {
    const pr = profile();
    if (state.sheet === "addr") {
      return '<div class="card form-card"><h3>Ma\'lumotlarim</h3>' +
        '<div class="field"><label for="pName">Ism</label><input id="pName" value="' + esc(pr.name) + '"></div>' +
        '<div class="field"><label for="pPhone">Telefon</label><input id="pPhone" type="tel" inputmode="tel" value="' + esc(pr.phone) + '"></div>' +
        '<div class="field"><label for="pAddr">Manzil (yetkazish uchun)</label><input id="pAddr" value="' + esc(pr.address || "") + '" placeholder="Ko\'cha, uy"></div>' +
        '<button class="pill-btn" id="saveProfile" style="width:100%">Saqlash</button></div>';
    }
    if (state.sheet === "pay") return '<div class="card"><h3>To\'lovlar</h3><p class="muted">Hozircha to\'lov joyida — naqd yoki karta orqali. Onlayn to\'lov (Click, Payme) tez orada qo\'shiladi.</p></div>';
    if (state.sheet === "lang") return '<div class="card"><h3>Til</h3><div class="chips"><button class="chip on">O\'zbekcha</button><button class="chip" disabled>Русский · tez orada</button><button class="chip" disabled>English · tez orada</button></div></div>';
    return "";
  }

  /* ---------- 7. Admin bilan chat ---------- */
  function viewChat() {
    const pr = profile();
    const head = '<div class="top"><div class="hello"><button class="ib" data-go="profile" aria-label="Orqaga">' + I.back + '</button><div><b style="font-size:19px">Admin bilan chat</b><small>' + esc(settings().shopName) + "</small></div></div></div>";
    if (normPhone(pr.phone).length < 9 || (pr.name || "").length < 2) {
      return head + '<div class="card form-card"><p class="muted" style="margin-bottom:12px">Yozishish uchun ismingiz va telefon raqamingizni kiriting — admin sizga shu orqali javob beradi.</p>' +
        '<div class="field"><label for="cName">Ismingiz</label><input id="cName" value="' + esc(pr.name) + '"></div>' +
        '<div class="field"><label for="cPhone">Telefon</label><input id="cPhone" type="tel" inputmode="tel" value="' + esc(pr.phone) + '" placeholder="+998 90 123 45 67"></div>' +
        '<span class="err" id="cErr" role="alert"></span><button class="pill-btn" id="chatProfile" style="width:100%">Davom etish</button></div>';
    }
    const list = myMessages();
    ls.set(LS_CHATSEEN, new Date().toISOString());
    return head + '<div class="chat-body" id="chatBody">' +
      (list.length ? list.map((m) => '<div class="bub ' + (m.from === "user" ? "me" : "them") + '">' + esc(m.text) + "<small>" + new Date(m.at).toTimeString().slice(0, 5) + "</small></div>").join("")
        : '<div class="empty" style="padding:30px 0"><div class="e">💬</div><p>Savolingizni yozing — admin javob beradi.</p></div>') +
      '</div><form class="chat-form" id="chatForm"><input id="chatInput" placeholder="Xabar yozing..." autocomplete="off" aria-label="Xabar"><button class="send" type="submit" aria-label="Yuborish">' + I.send + "</button></form>";
  }
  async function sendMessage(text) {
    const pr = profile();
    const list = (await Cloud.fetchKey("messages", [])) || [];
    list.push({ id: "m" + Date.now().toString(36), phone: pr.phone, name: pr.name, from: "user", text, at: new Date().toISOString(), read: false });
    Cloud.set("messages", list.slice(-1000));
    render();
  }

  /* ---------- render ---------- */
  function renderTabs() {
    const n = cart.reduce((a, l) => a + l.qty, 0);
    const unread = unreadAdmin();
    const tabs = [["home", "Menyu", I.home], ["cart", "Savat", I.cart], ["orders", "Buyurtma", I.orders], ["profile", "Profil", I.user]];
    const cur = ["menu", "product"].includes(state.view) ? "home" : state.view === "chat" ? "profile" : state.view;
    document.getElementById("tabbar").innerHTML = tabs.map((t) =>
      '<button class="tab' + (cur === t[0] ? " on" : "") + '" data-go="' + t[0] + '" aria-label="' + t[1] + '"' + (cur === t[0] ? ' aria-current="page"' : "") + ">" + t[2] + "<span>" + t[1] + "</span>" +
      (t[0] === "cart" && n ? '<i class="cnt">' + n + "</i>" : "") + (t[0] === "profile" && unread ? '<i class="cnt">' + unread + "</i>" : "") + "</button>").join("");
  }
  function render() {
    const s = settings();
    document.title = s.shopName + " — Menyu";
    const html = { home: viewHome, menu: viewMenu, product: viewProduct, cart: viewCart, orders: viewOrders, profile: viewProfile, chat: viewChat }[state.view] || viewHome;
    $view.innerHTML = '<div class="view">' + html() + "</div>";
    renderTabs();
    const cb = document.getElementById("chatBody");
    if (cb) window.scrollTo(0, document.body.scrollHeight);
    const cf = document.getElementById("chatForm");
    if (cf) cf.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = document.getElementById("chatInput").value.trim();
      if (v) sendMessage(v);
    });
    const q = document.getElementById("q");
    if (q) {
      if (state.searching && !state.q) q.focus();
      q.addEventListener("input", () => {
        state.q = q.value;
        const pos = q.selectionStart;
        render();
        const nq = document.getElementById("q");
        nq.focus();
        try { nq.setSelectionRange(pos, pos); } catch (e) {}
      });
    }
  }

  /* ---------- hodisalar ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t || t.disabled) return;
    if (t.dataset.go) return go(t.dataset.go, { sheet: null });
    if (t.dataset.tocat) return go("menu", { cat: t.dataset.tocat, q: "", searching: false });
    if (t.dataset.cat) { state.cat = t.dataset.cat; state.q = ""; return render(); }
    if (t.id === "toggleSearch") { state.searching = !state.searching; if (!state.searching) state.q = ""; return render(); }
    if (t.dataset.p) {
      const p = product(t.dataset.p);
      if (!p || !avail(p)) return toast("Bu mahsulot hozircha mavjud emas");
      return go("product", { pid: p.id, sel: defaultSel(p), qty: 1 });
    }
    if (t.hasAttribute("data-back")) return go("menu");
    if (t.dataset.opt) {
      const v = t.dataset.opt === "sweet" ? Number(t.dataset.v) : t.dataset.v;
      state.sel = Object.assign({}, state.sel, { [t.dataset.opt]: v });
      return render();
    }
    if (t.dataset.qty) { state.qty = Math.max(1, Math.min(20, state.qty + Number(t.dataset.qty))); return render(); }
    if (t.id === "addCart") {
      const p = product(state.pid);
      const key = JSON.stringify(state.sel);
      const ex = cart.find((l) => String(l.pid) === String(p.id) && JSON.stringify(l.sel) === key);
      if (ex) ex.qty += state.qty; else cart.push({ pid: p.id, sel: state.sel, qty: state.qty });
      saveCart();
      toast(p.name + " savatga qo'shildi");
      return go("menu");
    }
    if (t.dataset.cq != null) {
      const i = Number(t.dataset.cq);
      cart[i].qty += Number(t.dataset.d);
      if (cart[i].qty <= 0) cart.splice(i, 1);
      saveCart();
      return render();
    }
    if (t.dataset.type) { state.type = t.dataset.type; return render(); }
    if (t.dataset.tip != null) { state.tip = Number(t.dataset.tip); return render(); }
    if (t.id === "placeOrder") return placeOrder(t);
    if (t.dataset.reorder) {
      const o = myOrders().find((x) => x.id === t.dataset.reorder);
      if (!o) return;
      let added = 0;
      o.items.forEach((i) => {
        const p = product(i.pid);
        if (!p || !avail(p)) return;
        cart.push({ pid: p.id, sel: defaultSel(p), qty: i.qty });
        added++;
      });
      saveCart();
      if (!added) return toast("Bu buyurtmadagi mahsulotlar hozir mavjud emas");
      toast("Savatga qo'shildi");
      return go("cart");
    }
    if (t.dataset.sheet) { state.sheet = state.sheet === t.dataset.sheet ? null : t.dataset.sheet; return render(); }
    if (t.id === "chatProfile") {
      const name = document.getElementById("cName").value.trim();
      const phone = document.getElementById("cPhone").value.trim();
      if (name.length < 2) { document.getElementById("cErr").textContent = "Ismingizni kiriting"; return; }
      if (normPhone(phone).length < 9) { document.getElementById("cErr").textContent = "Telefon raqamini to'liq kiriting"; return; }
      ls.set(LS_PROFILE, Object.assign(profile(), { name, phone }));
      return render();
    }
    if (t.id === "saveProfile") {
      ls.set(LS_PROFILE, { name: document.getElementById("pName").value.trim(), phone: document.getElementById("pPhone").value.trim(), address: document.getElementById("pAddr").value.trim() });
      state.sheet = null;
      toast("Saqlandi");
      return render();
    }
  });

  // Admin menyuni, buyurtma holatini yoki javobni o'zgartirsa — jonli yangilanadi
  if (Cloud.watch) {
    Cloud.watch(["menu", "orders", "customers", "settings", "messages"], (key, value) => {
      Cloud.adopt(key, value);
      const typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
      if (!typing) render();
    }, 5000);
  }

  render();
})();
