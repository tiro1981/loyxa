/* ============================================================
   OVQAT DOKONI — Holat boshqaruvi (state) + localStorage
   API:
     Store.getCart() -> [{id, qty, ...product}]
     Store.addToCart(id, qty=1)  Store.setQty(id, qty)  Store.removeFromCart(id)  Store.clearCart()
     Store.cartCount()  Store.cartSubtotal()  Store.deliveryFee()  Store.cartTotal()
     Store.toggleFavorite(id)  Store.isFavorite(id)  Store.getFavorites()
     Store.getOrders()  Store.placeOrder({payment, address, note})
     Store.getAddresses()  Store.addAddress(a)  Store.removeAddress(id)  Store.setDefaultAddress(id)  Store.defaultAddress()
     Store.theme  Store.toggleTheme()  Store.setTheme(t)
     Store.user  Store.updateUser(patch)
     Store.product(id)  Store.productsByCategory(cat)  Store.search(q)
     Store.on(evt, cb)  Store.off(evt, cb)  Store.emit(evt, data)
   Events: cart:change | favorites:change | orders:change | theme:change | address:change | user:change
   ============================================================ */
window.Store = (function () {
  // Holat (cart, orders, ...) Cloud (Supabase) orqali serverda saqlanadi — kalit "state".
  // Cloud client_id bo'yicha avtomatik ajratadi (boot-loader Cloud.init bilan).

  const defaults = {
    cart: [],            // [{id, qty}]
    favorites: [],       // [id]
    orders: DATA.orders.slice(),
    addresses: DATA.addresses.slice(),
    theme: "dark",
    user: { ...DATA.user },
    promo: null,
  };

  let state = load();

  function load() {
    try {
      const saved = (window.Cloud ? Cloud.get("state", null) : null);  // serverdan (yoki localStorage fallback)
      if (!saved) return structuredClone(defaults);
      return { ...structuredClone(defaults), ...saved };
    } catch (e) {
      return structuredClone(defaults);
    }
  }
  function save() {
    try { if (window.Cloud) Cloud.set("state", state); } catch (e) {}
  }

  /* --- events --- */
  const listeners = {};
  function on(evt, cb) { (listeners[evt] = listeners[evt] || []).push(cb); }
  function off(evt, cb) { if (listeners[evt]) listeners[evt] = listeners[evt].filter((f) => f !== cb); }
  function emit(evt, data) { (listeners[evt] || []).forEach((cb) => cb(data)); }

  /* --- products --- */
  const product = (id) => DATA.products.find((p) => p.id === Number(id));
  const productsByCategory = (cat) =>
    !cat || cat === "all" ? DATA.products : DATA.products.filter((p) => p.category === cat);
  const search = (q) => {
    q = (q || "").trim().toLowerCase();
    if (!q) return DATA.products;
    return DATA.products.filter((p) => p.name.toLowerCase().includes(q));
  };

  /* --- cart --- */
  function getCart() {
    return state.cart
      .map((c) => { const p = product(c.id); return p ? { ...p, qty: c.qty } : null; })
      .filter(Boolean);
  }
  function addToCart(id, qty = 1) {
    id = Number(id);
    const line = state.cart.find((c) => c.id === id);
    if (line) line.qty += qty; else state.cart.push({ id, qty });
    save(); emit("cart:change");
  }
  function setQty(id, qty) {
    id = Number(id);
    const line = state.cart.find((c) => c.id === id);
    if (!line) return;
    line.qty = qty;
    if (line.qty <= 0) state.cart = state.cart.filter((c) => c.id !== id);
    save(); emit("cart:change");
  }
  function removeFromCart(id) {
    state.cart = state.cart.filter((c) => c.id !== Number(id));
    save(); emit("cart:change");
  }
  function clearCart() { state.cart = []; state.promo = null; save(); emit("cart:change"); }
  function qtyOf(id) { const l = state.cart.find((c) => c.id === Number(id)); return l ? l.qty : 0; }
  const cartCount = () => state.cart.reduce((n, c) => n + c.qty, 0);
  const cartSubtotal = () => getCart().reduce((s, p) => s + p.price * p.qty, 0);
  const FREE_FROM = 100000, DELIVERY = 10000;
  function deliveryFee() { const sub = cartSubtotal(); return sub === 0 || sub >= FREE_FROM ? 0 : DELIVERY; }
  function discount() {
    if (!state.promo) return 0;
    return Math.round(cartSubtotal() * 0.1); // FRESH10 -> 10%
  }
  function applyPromo(code) {
    code = (code || "").trim().toUpperCase();
    if (code === "FRESH10") { state.promo = code; save(); return true; }
    return false;
  }
  function cartTotal() { return Math.max(0, cartSubtotal() - discount()) + deliveryFee(); }

  /* --- favorites --- */
  const getFavorites = () => state.favorites.map(product).filter(Boolean);
  const isFavorite = (id) => state.favorites.includes(Number(id));
  function toggleFavorite(id) {
    id = Number(id);
    if (isFavorite(id)) state.favorites = state.favorites.filter((x) => x !== id);
    else state.favorites.push(id);
    save(); emit("favorites:change");
  }

  /* --- orders ---
     Buyurtmalar umumiy "orders" kalitida saqlanadi (admin ham shu yerdan o'qiydi).
     Shu tufayli storefront'da berilgan buyurtma admin panelida ko'rinadi.
     MUHIM: shuning uchun getOrders() DO'KONNING BARCHA buyurtmalarini qaytaradi —
     mijoz tomonida (Buyurtmalarim) buni HECH QACHON to'g'ridan-to'g'ri ko'rsatmang,
     aks holda mijozlar bir-birining ismi/telefoni/manzilini ko'rib qoladi.
     Buning o'rniga getMyOrders() dan foydalaning — u shu QURILMAGA xos, doimiy
     deviceId bo'yicha filtrlaydi. */
  function ordersAll() {
    const cloud = window.Cloud ? Cloud.get("orders", null) : null;
    if (Array.isArray(cloud)) return cloud;
    return state.orders || [];
  }
  function ordersSave(list) {
    if (window.Cloud) Cloud.set("orders", list);
    state.orders = list;   // mahalliy nusxa (mijoz "Buyurtmalarim" ko'rinishi uchun)
  }
  const getOrders = () => ordersAll();

  // Shu qurilmaga xos, bir martalik va doimiy mijoz ID'si (localStorage'da, Cloud'ga
  // yozilmaydi — faqat shu telefon/brauzerda qoladi). "Buyurtmalarim" shu ID bo'yicha
  // filtrlanadi, shunda har bir mijoz faqat O'Z buyurtmasini ko'radi.
  function deviceGuestId() {
    const key = "ovqat_guest_id__" + DATA.clientId;
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        id = "guest_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      return "guest_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    }
  }
  const getMyOrders = () => ordersAll().filter((o) => o.deviceId === deviceGuestId());

  /* --- customers ---
     Mijozlar umumiy "customers" kalitida saqlanadi (admin ham shu yerdan o'qiydi). */
  function customersAll() {
    const cloud = window.Cloud ? Cloud.get("customers", null) : null;
    return Array.isArray(cloud) ? cloud : [];
  }
  function customersSave(list) { if (window.Cloud) Cloud.set("customers", list); }
  function upsertCustomer({ fullName, phone }) {
    if (!fullName || !phone) return;
    const norm = (p) => (p || "").replace(/\D/g, "");
    const list = customersAll();
    const idx = list.findIndex((c) => norm(c.phone) === norm(phone));
    if (idx >= 0) {
      list[idx] = { ...list[idx], name: fullName, phone };
    } else {
      list.push({ id: Date.now(), name: fullName, phone, joined: nowLabel(), status: "faol" });
    }
    customersSave(list);
  }

  function placeOrder({ payment, address, addressObj, note } = {}) {
    // Buyurtma item'lari o'zini-o'zi yetarli (nom/narx) — bot kanalга yuborganda kerak
    const items = state.cart.map((c) => {
      const p = product(c.id) || {};
      return { id: c.id, qty: c.qty, name: p.name || ("#" + c.id), price: p.price || 0 };
    });
    const all = ordersAll().slice();
    const addr = addressObj || defaultAddress();
    const order = {
      id: "ORD-" + (1043 + all.length),
      date: nowLabel(),
      status: "pending",
      items,
      total: cartTotal(),
      payment: payment || "cash",
      address: address || (addr && addr.text) || "",
      note: note || "",
      userName: (addr && addr.fullName) || (state.user && state.user.name) || "Mijoz",
      phone: (addr && addr.phone) || (state.user && state.user.phone) || "",
      deviceId: deviceGuestId(),
    };
    all.unshift(order);
    ordersSave(all);
    upsertCustomer({ fullName: order.userName, phone: order.phone });
    clearCart();
    save(); emit("orders:change");
    return order;
  }
  function nowLabel() {
    const months = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${d.getDate()}-${months[d.getMonth()]}, ${hh}:${mm}`;
  }

  /* --- addresses --- */
  const getAddresses = () => state.addresses;
  const defaultAddress = () => state.addresses.find((a) => a.isDefault) || state.addresses[0];
  function addAddress(a) {
    const id = Math.max(0, ...state.addresses.map((x) => x.id)) + 1;
    state.addresses.push({ id, isDefault: state.addresses.length === 0, ...a });
    save(); emit("address:change");
    if (a && a.fullName && a.phone) upsertCustomer({ fullName: a.fullName, phone: a.phone });
  }
  function removeAddress(id) {
    state.addresses = state.addresses.filter((a) => a.id !== Number(id));
    if (state.addresses.length && !state.addresses.some((a) => a.isDefault)) state.addresses[0].isDefault = true;
    save(); emit("address:change");
  }
  function setDefaultAddress(id) {
    state.addresses.forEach((a) => (a.isDefault = a.id === Number(id)));
    save(); emit("address:change");
  }

  /* --- theme --- */
  function setTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute("data-theme", t);
    save(); emit("theme:change", t);
  }
  function toggleTheme() { setTheme(state.theme === "dark" ? "light" : "dark"); }

  /* --- user --- */
  function updateUser(patch) { state.user = { ...state.user, ...patch }; save(); emit("user:change"); }

  // apply persisted theme immediately
  document.documentElement.setAttribute("data-theme", state.theme);

  return {
    get state() { return state; },
    get theme() { return state.theme; },
    get user() { return state.user; },
    get promo() { return state.promo; },
    product, productsByCategory, search,
    getCart, addToCart, setQty, removeFromCart, clearCart, qtyOf,
    cartCount, cartSubtotal, deliveryFee, discount, cartTotal, applyPromo,
    getFavorites, isFavorite, toggleFavorite,
    getOrders, getMyOrders, placeOrder,
    customersAll, upsertCustomer,
    getAddresses, defaultAddress, addAddress, removeAddress, setDefaultAddress,
    setTheme, toggleTheme,
    updateUser,
    on, off, emit,
    FREE_FROM, DELIVERY,
  };
})();
