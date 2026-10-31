/* ============================================================
   KOFE KAFE — mijoz ilovasi
   Ko'rinishlar: menu (bosh), product, cart, orders, profile.
   Ma'lumot: Cloud "menu" / "orders" / "customers" / "settings" (app="kofe").
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

  /* ---------- ikonkalar ---------- */
  const sv = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  const I = {
    menu: sv('<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>'),
    cart: sv('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h2.5l2.2 12.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>'),
    orders: sv('<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5Z"/><path d="M9 8h6M9 12h6"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>'),
    plus: sv('<path d="M12 5v14M5 12h14"/>'),
    back: sv('<path d="m15 5-7 7 7 7"/>'),
    bell: sv('<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
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

  const ls = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  let cart = ls.get(LS_CART, []);
  const saveCart = () => { ls.set(LS_CART, cart); renderTabs(); };
  const profile = () => ls.get(LS_PROFILE, { name: "", phone: "" });
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

  /* ---------- holat va navigatsiya ---------- */
  const state = { view: "menu", cat: "all", q: "", pid: null, sel: null, qty: 1, type: TABLE ? "table" : "pickup" };
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

  function thumb(p) {
    return p.image ? '<img src="' + esc(p.image) + '" alt="">' : esc(p.emoji || "☕");
  }
  function minPrice(p) { return p.price; }

  /* ---------- 1. Menyu (bosh) ---------- */
  function viewMenu() {
    const s = settings();
    const m = menu();
    const c = customer();
    const every = s.loyaltyEvery || 5;
    const have = c ? (c.stamps || 0) % every : 0;
    const q = state.q.trim().toLowerCase();
    let list = m.products.filter((p) => state.cat === "all" || p.cat === state.cat);
    if (q) list = list.filter((p) => (p.name + " " + (p.desc || "")).toLowerCase().includes(q));
    const showPopular = state.cat === "all" && !q;
    const popular = m.products.filter((p) => p.popular && p.available !== false);
    const hour = new Date().getHours();
    const hello = hour < 12 ? "Xayrli tong" : hour < 18 ? "Xush kelibsiz" : "Xayrli kech";

    return (
      '<div class="top"><div><small>' + esc(hello) + (TABLE ? " · Stol " + esc(TABLE) : "") + '</small><h1>' + esc(s.shopName) + '</h1></div>' +
      '<button class="ib" data-go="orders" aria-label="Buyurtmalarim">' + I.bell + "</button></div>" +
      '<label class="search">' + I.search + '<input id="q" type="search" placeholder="Latte, cappuccino, desert..." value="' + esc(state.q) + '" aria-label="Qidirish"></label>' +
      '<div class="chips" role="tablist">' +
      '<button class="chip' + (state.cat === "all" ? " on" : "") + '" data-cat="all">Hammasi</button>' +
      m.categories.map((ct) => '<button class="chip' + (state.cat === ct.id ? " on" : "") + '" data-cat="' + esc(ct.id) + '">' + esc(ct.emoji + " " + ct.name) + "</button>").join("") +
      "</div>" +
      (showPopular
        ? '<div class="promo"><div><h3>Har ' + every + "-chi qahva sovg'a</h3><p>Sadoqat kartangizda " + have + "/" + every + "</p></div><div class=\"big\">🎁</div></div>"
        : "") +
      (showPopular && popular.length
        ? '<div class="sec-head"><h2>Mashhur</h2></div><div class="list">' + popular.map(itemRow).join("") + "</div><div style=\"height:20px\"></div>"
        : "") +
      '<div class="sec-head"><h2>' + (q ? "Natijalar" : state.cat === "all" ? "Menyu" : esc((category(state.cat) || {}).name || "")) + "</h2></div>" +
      (list.length
        ? '<div class="list">' + list.map(itemRow).join("") + "</div>"
        : '<div class="empty"><div class="e">🔍</div><h3>Hech narsa topilmadi</h3><p>Boshqa so\'z bilan qidirib ko\'ring.</p></div>')
    );
  }
  function itemRow(p) {
    const off = p.available === false;
    return (
      '<button class="item' + (off ? " off" : "") + '" data-p="' + esc(p.id) + '">' +
      '<span class="thumb">' + thumb(p) + "</span>" +
      '<span class="item-b"><b>' + esc(p.name) + "</b><small>" + esc(p.desc || "") + "</small>" +
      (off ? '<span class="tag-off">Hozircha mavjud emas</span>' : '<div class="price">' + fmt(minPrice(p)) + " <span>so'm</span></div>") +
      "</span>" + (off ? "" : '<span class="add" aria-hidden="true">' + I.plus + "</span>") + "</button>"
    );
  }

  /* ---------- 2. Mahsulot ---------- */
  function defaultSel(p) {
    return { size: p.opts && p.opts.s ? "M" : null, milk: p.opts && p.opts.m ? "oddiy" : null, sweet: p.opts && p.opts.sw ? 1 : null };
  }
  function viewProduct() {
    const p = product(state.pid);
    if (!p) { state.view = "menu"; return viewMenu(); }
    const sel = state.sel;
    const unit = K.linePrice(p, sel);
    const seg = (title, items, key, isOn, sub) =>
      '<div class="opt"><small>' + title + '</small><div class="seg">' +
      items.map((it) => '<button data-opt="' + key + '" data-v="' + esc(it.id) + '" class="' + (isOn(it) ? "on" : "") + '">' + esc(it.label) + (sub(it) ? "<small>" + esc(sub(it)) + "</small>" : "") + "</button>").join("") +
      "</div></div>";
    const o = p.opts || {};
    return (
      '<div class="hero">' + thumb(p) + '<button class="ib" data-back aria-label="Orqaga">' + I.back + "</button></div>" +
      '<div class="p-title"><h1>' + esc(p.name) + '</h1><span class="pr">' + fmt(unit) + " so'm</span></div>" +
      '<p class="p-desc">' + esc(p.desc || "") + "</p>" +
      (o.s ? seg("Hajmi", K.SIZES, "size", (it) => sel.size === it.id, (it) => it.vol + (it.add ? " · +" + fmt(it.add) : "")) : "") +
      (o.m ? seg("Sut turi", K.MILKS, "milk", (it) => sel.milk === it.id, (it) => (it.add ? "+" + fmt(it.add) : "")) : "") +
      (o.sw ? seg("Shirinlik", K.SWEET, "sweet", (it) => sel.sweet === it.id, () => "") : "") +
      '<div class="dock">' +
      '<div class="stepper"><button data-qty="-1" aria-label="Kamaytirish">−</button><span>' + state.qty + '</span><button data-qty="1" aria-label="Ko\'paytirish">+</button></div>' +
      '<button class="btn-main" id="addCart"' + (p.available === false ? " disabled" : "") + "><span>" + (p.available === false ? "Mavjud emas" : "Savatga qo'shish") + "</span><span>" + fmt(unit * state.qty) + "</span></button>" +
      "</div>"
    );
  }

  /* ---------- 3. Savat ---------- */
  function cartLines() {
    return cart.map((l) => {
      const p = product(l.pid);
      if (!p) return null;
      return Object.assign({}, l, { p, unit: K.linePrice(p, l.sel), label: K.optsLabel(p, l.sel) });
    }).filter(Boolean);
  }
  // Sadoqat: har N-chi ichimlik bepul — markalar yetarli bo'lsa eng arzon ichimlik sovg'a
  function loyaltyDiscount(lines) {
    const every = settings().loyaltyEvery || 5;
    const c = customer();
    const stamps = c ? c.stamps || 0 : 0;
    if (stamps < every) return { amount: 0, use: 0 };
    const drinks = lines.filter((l) => isDrink(l.p) && l.p.available !== false);
    if (!drinks.length) return { amount: 0, use: 0 };
    const cheapest = Math.min.apply(null, drinks.map((l) => l.unit));
    return { amount: cheapest, use: every };
  }
  function viewCart() {
    const lines = cartLines();
    const s = settings();
    if (!lines.length) {
      return '<div class="top"><h1>Savat</h1></div><div class="empty"><div class="e">☕</div><h3>Savat bo\'sh</h3><p>Menyudan ichimlik tanlang.</p><div style="height:16px"></div><button class="btn-ghost" data-go="menu">Menyuni ochish</button></div>';
    }
    const subtotal = lines.reduce((a, l) => a + l.unit * l.qty, 0);
    const disc = loyaltyDiscount(lines);
    const total = Math.max(0, subtotal - disc.amount);
    const c = customer();
    const every = s.loyaltyEvery || 5;
    const have = c ? Math.min((c.stamps || 0), every) : 0;
    const pr = profile();
    const stampsHtml = Array.from({ length: every }, (_, i) =>
      '<span class="stamp' + (i < have ? " on" : "") + (i === every - 1 ? " gift" : "") + '">' + (i === every - 1 ? "🎁" : "☕") + "</span>").join("");

    return (
      '<div class="top"><div><h1>Savat</h1><small>' + lines.length + " ta mahsulot</small></div></div>" +
      '<div class="list">' + lines.map((l, i) =>
        '<div class="cart-row"><span class="thumb" style="width:52px;height:52px;font-size:26px">' + thumb(l.p) + '</span>' +
        '<div class="item-b"><b>' + esc(l.p.name) + "</b><small>" + esc(l.label || "") + '</small><div class="price">' + fmt(l.unit * l.qty) + " <span>so'm</span></div></div>" +
        '<div class="stepper"><button data-cq="' + i + '" data-d="-1" aria-label="Kamaytirish">−</button><span>' + l.qty + '</span><button data-cq="' + i + '" data-d="1" aria-label="Ko\'paytirish">+</button></div></div>'
      ).join("") + "</div>" +
      '<div class="seg-2">' +
      (TABLE
        ? '<button class="on" disabled>Stol ' + esc(TABLE) + "</button>"
        : '<button data-type="pickup" class="' + (state.type === "pickup" ? "on" : "") + '">Olib ketaman</button>') +
      '<button data-type="delivery" ' + (s.delivery ? 'class="' + (state.type === "delivery" ? "on" : "") + '"' : "disabled title=\"Tez orada\"") + ">Yetkazish" + (s.delivery ? "" : " · tez orada") + "</button>" +
      "</div>" +
      '<div class="card"><div class="loy-head"><b>Sadoqat kartasi</b><span>' + have + "/" + every + (disc.amount ? " · sovg'a tayyor!" : "") + '</span></div><div class="stamps">' + stampsHtml + "</div></div>" +
      '<div class="card">' +
      '<div class="field"><label for="fName">Ismingiz</label><input id="fName" autocomplete="name" value="' + esc(pr.name) + '" placeholder="Aziza"></div>' +
      '<div class="field"><label for="fPhone">Telefon</label><input id="fPhone" type="tel" autocomplete="tel" inputmode="tel" value="' + esc(pr.phone) + '" placeholder="+998 90 123 45 67"></div>' +
      (state.type === "delivery" ? '<div class="field"><label for="fAddr">Manzil</label><input id="fAddr" autocomplete="street-address" placeholder="Ko\'cha, uy"></div>' : "") +
      '<div class="field" style="margin:0"><label for="fNote">Izoh (ixtiyoriy)</label><input id="fNote" placeholder="Masalan: muzsiz"></div>' +
      '<div class="field" style="margin:4px 0 0"><span class="err" id="fErr"></span></div>' +
      "</div>" +
      '<div class="card">' +
      '<div class="sum-row"><span>Mahsulotlar</span><span>' + fmt(subtotal) + " so'm</span></div>" +
      (disc.amount ? '<div class="sum-row"><span>Sadoqat sovg\'asi</span><span class="ok">−' + fmt(disc.amount) + " so'm</span></div>" : "") +
      '<div class="sum-row total"><span>Jami</span><span>' + fmt(total) + " so'm</span></div>" +
      "</div><div style=\"height:70px\"></div>" +
      '<div class="dock"><button class="btn-main" id="placeOrder"><span>Buyurtma berish</span><span>' + fmt(total) + "</span></button></div>"
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
    ls.set(LS_PROFILE, { name, phone });

    const lines = cartLines().filter((l) => l.p.available !== false);
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
      subtotal, discount: disc.amount, total: Math.max(0, subtotal - disc.amount),
      status: "new",
    };
    orders.push(order);
    Cloud.set("orders", orders);

    // Sadoqat: ishlatilgan markalar ayiriladi, har bir ichimlik uchun marka qo'shiladi
    const customers = (await Cloud.fetchKey("customers", [])) || [];
    const ph = normPhone(phone);
    let cu = customers.find((c) => normPhone(c.phone) === ph);
    if (!cu) { cu = { phone, name, stamps: 0, orders: 0, spent: 0, createdAt: order.createdAt }; customers.push(cu); }
    cu.name = name;
    cu.stamps = Math.max(0, (cu.stamps || 0) - disc.use) + order.items.filter((i) => i.drink).reduce((a, i) => a + i.qty, 0);
    cu.orders = (cu.orders || 0) + 1;
    cu.spent = (cu.spent || 0) + order.total;
    cu.lastAt = order.createdAt;
    Cloud.set("customers", customers);

    const mine = ls.get(LS_MYORDERS, []);
    mine.push(order.id);
    ls.set(LS_MYORDERS, mine.slice(-50));
    cart = [];
    saveCart();

    // Telegram xabari — buyurtma allaqachon saqlangan, xato bo'lsa ham yo'qolmaydi
    if (window.Telegram && Telegram.sendOrder) {
      Telegram.sendOrder({
        id: "#" + order.no, userName: name, phone,
        address: type === "table" ? "Stol " + TABLE : type === "delivery" ? "Yetkazish: " + address : "Olib ketish",
        payment: "Joyida" + (note ? " · " + note : ""),
        items: order.items.map((i) => ({ name: i.name + (i.opts ? " (" + i.opts + ")" : ""), qty: i.qty, price: i.price })),
        total: order.total,
      });
    }
    toast("Buyurtma #" + order.no + " qabul qilindi");
    go("orders");
  }

  /* ---------- 4. Buyurtmalarim ---------- */
  const STEPS = ["new", "preparing", "ready", "done"];
  function viewOrders() {
    const list = myOrders();
    if (!list.length) {
      return '<div class="top"><h1>Buyurtmalarim</h1></div><div class="empty"><div class="e">🧾</div><h3>Hali buyurtma yo\'q</h3><p>Birinchi qahvangizni buyurtma qiling.</p><div style="height:16px"></div><button class="btn-ghost" data-go="menu">Menyuni ochish</button></div>';
    }
    return (
      '<div class="top"><h1>Buyurtmalarim</h1></div><div class="list">' +
      list.map((o) => {
        const st = K.STATUS[o.status] || K.STATUS.new;
        const idx = STEPS.indexOf(o.status);
        const active = o.status !== "done" && o.status !== "cancelled";
        const when = new Date(o.createdAt);
        return (
          '<div class="order"><div class="order-h"><b>#' + o.no + " · " + String(when.getDate()).padStart(2, "0") + "." + String(when.getMonth() + 1).padStart(2, "0") + " " + when.toTimeString().slice(0, 5) + '</b><span class="badge ' + st.tone + '">' + st.label + "</span></div>" +
          '<div class="order-items">' + o.items.map((i) => esc(i.qty + "× " + i.name + (i.opts ? " (" + i.opts + ")" : ""))).join("<br>") + "</div>" +
          (active ? '<div class="track">' + STEPS.slice(0, 3).map((_, k) => '<i class="' + (k <= idx ? "on" : "") + '"></i>').join("") + "</div>" : "") +
          '<div class="order-f"><b>' + fmt(o.total) + " so'm</b>" + (active ? '<span style="font-size:13px;color:var(--mut)">' + (o.type === "table" ? "Stol " + esc(o.table) : o.type === "delivery" ? "Yetkazish" : "Olib ketish") + "</span>" : '<button class="btn-ghost" data-reorder="' + esc(o.id) + '">Qayta buyurtma</button>') + "</div></div>"
        );
      }).join("") + "</div>"
    );
  }

  /* ---------- 5. Profil ---------- */
  function viewProfile() {
    const pr = profile();
    const c = customer();
    const s = settings();
    const every = s.loyaltyEvery || 5;
    const have = c ? Math.min(c.stamps || 0, every) : 0;
    return (
      '<div class="top"><h1>Profil</h1></div>' +
      '<div class="prof"><div class="avatar">' + esc((pr.name || "?").charAt(0).toUpperCase()) + "</div><div><h2 style=\"font-size:19px\">" + esc(pr.name || "Mehmon") + '</h2><small style="color:var(--mut)">' + esc(pr.phone || "Telefon kiritilmagan") + "</small></div></div>" +
      '<div class="card"><div class="loy-head"><b>Sadoqat kartasi</b><span>' + have + "/" + every + '</span></div><div class="stamps">' +
      Array.from({ length: every }, (_, i) => '<span class="stamp' + (i < have ? " on" : "") + (i === every - 1 ? " gift" : "") + '">' + (i === every - 1 ? "🎁" : "☕") + "</span>").join("") +
      '</div><p style="font-size:13px;color:var(--mut);margin-top:10px">Har ' + every + "-chi ichimlik bepul. Jami buyurtmalar: " + (c ? c.orders || 0 : 0) + "</p></div>" +
      '<div class="card"><div class="field"><label for="pName">Ism</label><input id="pName" value="' + esc(pr.name) + '"></div>' +
      '<div class="field"><label for="pPhone">Telefon</label><input id="pPhone" type="tel" inputmode="tel" value="' + esc(pr.phone) + '"></div>' +
      '<button class="btn-ghost" id="saveProfile" style="width:100%">Saqlash</button></div>' +
      '<div class="card"><div class="sum-row"><span>Ish vaqti</span><span>' + esc(s.hours) + '</span></div><div class="sum-row"><span>Manzil</span><span>' + esc(s.address) + '</span></div><div class="sum-row"><span>Telefon</span><span>' + esc(s.phone) + "</span></div></div>" +
      '<p class="foot-note">' + esc(s.shopName) + " · v1.0</p>"
    );
  }

  /* ---------- render ---------- */
  function renderTabs() {
    const n = cart.reduce((a, l) => a + l.qty, 0);
    const tabs = [["menu", "Menyu", I.menu], ["cart", "Savat", I.cart], ["orders", "Buyurtmalar", I.orders], ["profile", "Profil", I.user]];
    const cur = state.view === "product" ? "menu" : state.view;
    document.getElementById("tabbar").innerHTML = tabs.map((t) =>
      '<button class="tab' + (cur === t[0] ? " on" : "") + '" data-go="' + t[0] + '"' + (cur === t[0] ? ' aria-current="page"' : "") + ">" + t[2] + "<span>" + t[1] + "</span>" +
      (t[0] === "cart" && n ? '<span class="cnt">' + n + "</span>" : "") + "</button>").join("");
  }
  function render() {
    const s = settings();
    document.title = s.shopName + " — Menyu";
    const html = { menu: viewMenu, product: viewProduct, cart: viewCart, orders: viewOrders, profile: viewProfile }[state.view] || viewMenu;
    $view.innerHTML = '<div class="view">' + html() + "</div>";
    renderTabs();
    const q = document.getElementById("q");
    if (q) q.addEventListener("input", () => {
      state.q = q.value;
      const pos = q.selectionStart;
      render();
      const nq = document.getElementById("q");
      nq.focus();
      try { nq.setSelectionRange(pos, pos); } catch (e) {}
    });
  }

  /* ---------- hodisalar ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.go) return go(t.dataset.go);
    if (t.dataset.cat) { state.cat = t.dataset.cat; return render(); }
    if (t.dataset.p) {
      const p = product(t.dataset.p);
      if (!p || p.available === false) return toast("Bu mahsulot hozircha mavjud emas");
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
    if (t.dataset.type && !t.disabled) { state.type = t.dataset.type; return render(); }
    if (t.id === "placeOrder") return placeOrder(t);
    if (t.dataset.reorder) {
      const o = myOrders().find((x) => x.id === t.dataset.reorder);
      if (!o) return;
      let added = 0;
      o.items.forEach((i) => {
        const p = product(i.pid);
        if (!p || p.available === false) return;
        cart.push({ pid: p.id, sel: defaultSel(p), qty: i.qty });
        added++;
      });
      saveCart();
      if (!added) return toast("Bu buyurtmadagi mahsulotlar hozir mavjud emas");
      toast("Savatga qo'shildi");
      return go("cart");
    }
    if (t.id === "saveProfile") {
      const name = document.getElementById("pName").value.trim();
      const phone = document.getElementById("pPhone").value.trim();
      ls.set(LS_PROFILE, { name, phone });
      toast("Profil saqlandi");
      return render();
    }
  });

  // Admin menyuni yoki buyurtma holatini o'zgartirsa — jonli yangilanadi
  if (Cloud.watch) {
    Cloud.watch(["menu", "orders", "customers", "settings"], (key, value) => {
      Cloud.adopt(key, value);
      const typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
      if (!typing) render();
    }, 5000);
  }

  render();
})();
