/* ============================================================
   KOFE KAFE — admin panel
   Bo'limlar: buyurtmalar (taxta + tarix), menyu (mahsulot + kategoriya), mijozlar,
   xabarlar (mijoz bilan chat), statistika, Telegram bot, QR kod, sozlamalar.
   Telegram bot va QR — platformadagi boshqa admin panellar bilan bir xil tizim
   (ovqat-dokoni/admin/js/admin.js: viewBot / viewQr).
   Ma'lumot: Cloud "menu" / "orders" / "customers" / "messages" / "settings" (app="kofe").
   ============================================================ */
(function () {
  "use strict";
  const K = window.KOFE;
  const { fmt, esc } = K;
  const CID = window.__CLIENT_ID || "demo";

  /* ---------- ma'lumot ---------- */
  function menu() {
    const m = Cloud.get("menu", null);
    if (m && Array.isArray(m.products)) return m;
    return { categories: K.CATEGORIES.slice(), products: K.PRODUCTS.map((p) => Object.assign({}, p)) };
  }
  const saveMenu = (m) => Cloud.set("menu", m);
  const orders = () => Cloud.get("orders", []) || [];
  const customers = () => Cloud.get("customers", []) || [];
  const messages = () => Cloud.get("messages", []) || [];
  function settings() { return Object.assign({}, K.SETTINGS, Cloud.get("settings", null) || {}); }
  const saveSettings = (s) => Cloud.set("settings", s);

  // Birinchi ochilishda namunaviy menyu bulutga yoziladi (egasi darrov tahrirlay olsin)
  if (!Cloud.get("menu", null)) saveMenu(menu());

  // Obunada kiritilgan nom dashboarddan ?shop=... bilan keladi — bir marta qo'llanadi
  (function applyShopParam() {
    const shop = (new URLSearchParams(location.search).get("shop") || "").trim().slice(0, 60);
    const s = settings();
    if (shop && !s.shopNameApplied) saveSettings(Object.assign(s, { shopName: shop, shopNameApplied: true }));
  })();

  /* ---------- yordamchilar ---------- */
  const $ = (id) => document.getElementById(id);
  let toastT;
  function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400); }
  const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + "-" + (x.getMonth() + 1) + "-" + x.getDate(); };
  const isToday = (iso) => dayKey(iso) === dayKey(Date.now());
  const live = (o) => o.status !== "cancelled";
  const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? "hozir" : m < 60 ? m + " daq oldin" : m < 1440 ? Math.round(m / 60) + " soat oldin" : Math.round(m / 1440) + " kun oldin"; };
  const hm = (iso) => { const d = new Date(iso); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  const dmy = (iso) => { const d = new Date(iso); return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + " " + hm(iso); };
  const typeLabel = (o) => (o.type === "table" ? "Stol " + esc(o.table) : o.type === "delivery" ? "Yetkazish" : "Olib ketish");
  const normPhone = (p) => (p || "").replace(/\D/g, "").slice(-9);
  function thumb(p) { return p.image ? '<img src="' + esc(p.image) + '" alt="">' : esc(p.emoji || "☕"); }

  /* ---------- QR — platformaning standart tizimi (api.qrserver.com) ---------- */
  function qrStoreUrl(table) {
    try {
      const u = new URL("../index.html", location.href);
      u.searchParams.set("client", CID);
      if (table) u.searchParams.set("stol", table);
      return u.href;
    } catch (e) { return "../index.html"; }
  }
  function qrApiSrc(url, size) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size + "&margin=10&qzone=1&data=" + encodeURIComponent(url);
  }
  async function qrDownload(url, name) {
    try {
      const res = await fetch(qrApiSrc(url, 600));
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast("QR kod yuklab olindi");
    } catch (e) { window.open(qrApiSrc(url, 600), "_blank"); }
  }
  function qrPrint(items) {
    const w = window.open("", "_blank", "width=520,height=720");
    if (!w) return toast("Chop etish oynasi bloklandi");
    const name = settings().shopName;
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>QR kod</title><style>body{font-family:system-ui,sans-serif;color:#1B120D;margin:0}.p{text-align:center;padding:40px;page-break-after:always}.p:last-child{page-break-after:auto}img{width:300px;height:300px}h2{margin:0 0 4px}p{margin:0}</style></head><body>' +
      items.map((it) => '<div class="p"><h2>' + esc(name) + '</h2><p style="color:#6b5a4c;margin-bottom:16px">' + esc(it.label) + '</p><img src="' + qrApiSrc(it.url, 400) + '"><p style="margin-top:16px;font-size:18px">📷 Telefon kamerasi bilan skaner qiling</p><p style="color:#6b5a4c;font-size:12px;word-break:break-all;margin-top:6px">' + esc(it.url) + "</p></div>").join("") +
      "</body></html>");
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (er) {} }, 900);
  }

  /* ---------- Telegram bot holati ---------- */
  let botStatus = null;
  let botTokenShown = false;
  function botErr(e) {
    const m = (e && e.message) ? e.message : String(e || "Xatolik");
    if (/Failed to fetch|NetworkError|load failed/i.test(m)) return "Bot serveri topilmadi (" + (window.Telegram ? Telegram.API_URL : "") + ")";
    return m;
  }
  async function botRefresh() {
    if (!window.Telegram || !Telegram.status) return;
    const st = await Telegram.status();
    botStatus = st && st.ok ? st : { error: st && st.error };
    if (state.page === "bot") render();
  }

  // Buyurtma holatini o'zgartirish — avval serverdagi eng yangi ro'yxatni o'qiymiz
  async function setStatus(id, status) {
    const list = (await Cloud.fetchKey("orders", [])) || [];
    const o = list.find((x) => x.id === id);
    if (!o) return toast("Buyurtma topilmadi");
    o.status = status;
    o[status + "At"] = new Date().toISOString();
    Cloud.set("orders", list);
    render();
  }

  // Yangi buyurtma / xabar ovozi
  let audioCtx;
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18].forEach((t) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.15);
        o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.16);
      });
    } catch (e) {}
  }

  /* ---------- navigatsiya ---------- */
  function unreadChats() {
    const by = {};
    messages().forEach((m) => { (by[normPhone(m.phone)] = by[normPhone(m.phone)] || []).push(m); });
    return Object.values(by).filter((list) => list.some((m) => m.from === "user" && !m.read)).length;
  }
  // Chiziqli SVG ikonkalar (currentColor) — menyu uchun
  const sv = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const ICO = {
    orders: sv('<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5Z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
    menu: sv('<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>'),
    customers: sv('<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>'),
    messages: sv('<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z"/>'),
    stats: sv('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
    bot: sv('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'),
    qr: sv('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4"/>'),
    settings: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
    ext: sv('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  };
  const PAGES = [
    { id: "orders",    group: "Ish joyi",  label: "Buyurtmalar", sub: "Yangi → Tayyorlanmoqda → Tayyor", badge: () => orders().filter((o) => o.status === "new").length },
    { id: "menu",      group: "Ish joyi",  label: "Menyu",       sub: "Mahsulotlar, kategoriyalar va mavjudlik" },
    { id: "customers", group: "Mijozlar",  label: "Mijozlar",    sub: "Buyurtmalar va sadoqat kartasi" },
    { id: "messages",  group: "Mijozlar",  label: "Xabarlar",    sub: "Mijozlar bilan yozishma", badge: unreadChats },
    { id: "stats",     group: "Mijozlar",  label: "Statistika",  sub: "Tushum va eng ko'p sotilganlar" },
    { id: "bot",       group: "Ulanishlar", label: "Telegram bot", sub: "Buyurtmalar kanalga yuboriladi" },
    { id: "qr",        group: "Ulanishlar", label: "QR kod",      sub: "Kafe va stollar uchun QR kodlar" },
    { id: "settings",  group: "Ulanishlar", label: "Sozlamalar",  sub: "Kafe ma'lumotlari" },
  ];
  const state = { page: "orders", cat: "all", q: "", hist: "all", hq: "", period: "today", chat: null, fresh: new Set() };
  function go(page) { state.page = page; closeSide(); render(); window.scrollTo(0, 0); if (page === "bot") botRefresh(); }
  const closeSide = () => { $("side").classList.remove("open"); $("overlay").classList.remove("show"); };

  /* ---------- 1. Buyurtmalar ---------- */
  function pageOrders() {
    const all = orders();
    const today = all.filter((o) => isToday(o.createdAt));
    const yest = all.filter((o) => dayKey(o.createdAt) === dayKey(Date.now() - 864e5));
    const rev = today.filter(live).reduce((a, o) => a + o.total, 0);
    const revY = yest.filter(live).reduce((a, o) => a + o.total, 0);
    const cnt = today.filter(live).length;
    const pending = all.filter((o) => o.status === "new" || o.status === "preparing").length;
    const diff = revY ? Math.round(((rev - revY) / revY) * 100) : null;
    const cols = [
      { st: "new", title: "Yangi", next: "preparing", btn: "Qabul qilish" },
      { st: "preparing", title: "Tayyorlanmoqda", next: "ready", btn: "Tayyor" },
      { st: "ready", title: "Tayyor", next: "done", btn: "Berildi" },
    ];
    const ticket = (o, c) =>
      '<div class="tk' + (state.fresh.has(o.id) ? " fresh" : "") + '"><div class="tk-h"><b>#' + o.no + "</b><small>" + ago(o.createdAt) + "</small></div>" +
      "<ul>" + o.items.map((i) => "<li>" + esc(i.qty + "× " + i.name) + (i.opts ? ' <span style="color:var(--mut)">(' + esc(i.opts) + ")</span>" : "") + "</li>").join("") + "</ul>" +
      '<div class="tk-who">' + esc(o.name) + " · " + esc(o.phone) + (o.note ? " · " + esc(o.note) : "") + (o.tip ? " · choychaq " + fmt(o.tip) : "") + (o.address ? "<br>" + esc(o.address) : "") + "</div>" +
      '<div class="tk-f"><span class="pill ' + (o.type === "table" ? "acc" : "") + '">' + typeLabel(o) + "</span><b>" + fmt(o.total) + "</b>" +
      '<span style="display:flex;gap:6px">' + (c.st === "new" ? '<button class="btn btn-line btn-sm btn-bad" data-st="cancelled" data-id="' + esc(o.id) + '">Bekor</button>' : "") +
      '<button class="btn btn-acc btn-sm" data-st="' + c.next + '" data-id="' + esc(o.id) + '">' + c.btn + "</button></span></div></div>";

    // Tarix: barcha buyurtmalar, holat filtri va qidiruv bilan
    const q = state.hq.trim().toLowerCase();
    const hist = all
      .filter((o) => state.hist === "all" || o.status === state.hist)
      .filter((o) => !q || ("#" + o.no + " " + o.name + " " + o.phone).toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
    const HF = [["all", "Hammasi"], ["new", "Yangi"], ["preparing", "Tayyorlanmoqda"], ["ready", "Tayyor"], ["done", "Berildi"], ["cancelled", "Bekor"]];

    return (
      '<div class="kpis">' +
      '<div class="kpi"><small>Bugungi buyurtmalar</small><b>' + cnt + "</b><span>" + yest.filter(live).length + " ta kecha</span></div>" +
      '<div class="kpi"><small>Daromad, so\'m</small><b>' + fmt(rev) + "</b><span" + (diff == null ? ">kecha ma'lumot yo'q" : ' class="' + (diff >= 0 ? "up" : "down") + '">' + (diff >= 0 ? "+" : "") + diff + "% kechagidan") + "</span></div>" +
      '<div class="kpi"><small>O\'rtacha chek</small><b>' + fmt(cnt ? rev / cnt : 0) + "</b><span>so'm</span></div>" +
      '<div class="kpi"><small>Kutilmoqda</small><b>' + pending + "</b><span>tayyorlash kerak</span></div></div>" +
      '<div class="board">' + cols.map((c) => {
        const list = all.filter((o) => o.status === c.st).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return '<div class="col"><div class="col-h">' + c.title + "<span>" + list.length + "</span></div>" +
          (list.length ? list.map((o) => ticket(o, c)).join("") : '<div class="col-empty">Bo\'sh</div>') + "</div>";
      }).join("") + "</div>" +
      '<div class="grid-2">' + hourlyCard(today) + topCard(today, "Bugun mashhur") + "</div>" +
      '<div class="card" style="margin-top:12px"><div class="card-top"><h3>Buyurtmalar tarixi</h3><input class="search" id="histQ" type="search" placeholder="#raqam, ism yoki telefon" value="' + esc(state.hq) + '" aria-label="Buyurtma qidirish"></div>' +
      '<div class="chips">' + HF.map((f) => '<button class="chip' + (state.hist === f[0] ? " on" : "") + '" data-hist="' + f[0] + '">' + f[1] + "</button>").join("") + "</div>" +
      (hist.length ? '<div class="rows">' + hist.map((o) => {
        const st = K.STATUS[o.status] || K.STATUS.new;
        return '<div class="row"><span class="th" style="font-size:13px;font-weight:700;color:var(--head)">#' + o.no + '</span><div class="b"><b>' + esc(o.name) + " · " + esc(o.items.map((i) => i.qty + "× " + i.name).join(", ")) + "</b><small>" + dmy(o.createdAt) + " · " + typeLabel(o) + " · " + esc(o.phone) + "</small></div>" +
          '<span class="pill ' + st.tone + '">' + st.label + '</span><span class="pr">' + fmt(o.total) + "</span></div>";
      }).join("") + "</div>" : '<div class="empty" style="padding:24px 0">Buyurtma topilmadi</div>') + "</div>"
    );
  }
  function hourlyCard(list) {
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08–22
    const counts = hours.map((h) => list.filter((o) => live(o) && new Date(o.createdAt).getHours() === h).length);
    const max = Math.max(1, ...counts);
    return '<div class="card"><h3>Bugungi buyurtmalar (soatlar bo\'yicha)</h3><div class="bars">' +
      hours.map((h, i) => '<div class="bar" title="' + h + ':00 — ' + counts[i] + ' ta"><i style="height:' + Math.round((counts[i] / max) * 100) + '%"></i><small>' + h + "</small></div>").join("") + "</div></div>";
  }
  function topCard(list, title) {
    const map = {};
    list.filter(live).forEach((o) => o.items.forEach((i) => { map[i.name] = (map[i.name] || 0) + i.qty; }));
    const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = top.length ? top[0][1] : 1;
    return '<div class="card"><h3>' + title + "</h3>" + (top.length
      ? top.map(([n, q]) => '<div class="top-row"><div>' + esc(n) + "<span>" + q + ' ta</span></div><div class="track"><i style="width:' + Math.round((q / max) * 100) + '%"></i></div></div>').join("")
      : '<div class="empty" style="padding:24px 0">Hali sotuv yo\'q</div>') + "</div>";
  }

  /* ---------- 2. Menyu ---------- */
  function pageMenu() {
    const m = menu();
    const q = state.q.trim().toLowerCase();
    const list = m.products
      .filter((p) => state.cat === "all" || p.cat === state.cat)
      .filter((p) => !q || p.name.toLowerCase().includes(q));
    return '<div class="card-top" style="margin-bottom:12px"><input class="search" id="menuQ" type="search" placeholder="Mahsulot qidirish" value="' + esc(state.q) + '" aria-label="Mahsulot qidirish">' +
      '<button class="btn btn-line" id="manageCats">Kategoriyalar</button></div>' +
      '<div class="chips"><button class="chip' + (state.cat === "all" ? " on" : "") + '" data-cat="all">Hammasi · ' + m.products.length + "</button>" +
      m.categories.map((c) => '<button class="chip' + (state.cat === c.id ? " on" : "") + '" data-cat="' + esc(c.id) + '">' + esc(c.emoji + " " + c.name) + " · " + m.products.filter((p) => p.cat === c.id).length + "</button>").join("") + "</div>" +
      '<div class="card"><div class="rows">' + (list.length ? list.map((p) =>
        '<div class="row' + (p.available === false ? " off" : "") + '"><span class="th">' + thumb(p) + '</span><div class="b"><b>' + esc(p.name) + (p.popular ? ' <span class="pill acc">HIT</span>' : "") + (p.isNew ? ' <span class="pill ok">YANGI</span>' : "") + "</b><small>" + esc(((m.categories.find((c) => c.id === p.cat) || {}).name) || "Kategoriyasiz") + (p.available === false ? " · tugagan" : "") + "</small></div>" +
        '<span class="pr">' + fmt(p.price) + "</span>" +
        '<button class="toggle' + (p.available !== false ? " on" : "") + '" data-avail="' + esc(p.id) + '" role="switch" aria-checked="' + (p.available !== false) + '" aria-label="' + esc(p.name) + ' mavjud"></button>' +
        '<button class="btn btn-line btn-sm" data-edit="' + esc(p.id) + '">Tahrirlash</button></div>').join("") : '<div class="empty">Mahsulot topilmadi</div>') + "</div></div>";
  }
  function editProduct(id) {
    const m = menu();
    const p = id != null ? m.products.find((x) => String(x.id) === String(id)) : null;
    const d = p || { name: "", cat: (m.categories[0] || {}).id, price: "", emoji: "☕", desc: "", opts: { s: true, m: true, sw: true }, available: true, image: null };
    let img = d.image || null;
    $("modalBox").innerHTML =
      '<div class="modal-h"><h2 id="modalTitle">' + (p ? "Mahsulotni tahrirlash" : "Yangi mahsulot") + '</h2><button class="ib" data-close aria-label="Yopish">×</button></div>' +
      '<div class="form">' +
      '<div class="f full"><label>Rasm</label><div class="img-up"><span class="th" id="eImgTh">' + (img ? '<img src="' + esc(img) + '" alt="">' : esc(d.emoji)) + '</span>' +
      '<label class="btn btn-line btn-sm" style="cursor:pointer">Rasm tanlash<input type="file" id="eImg" accept="image/*" hidden></label><button class="btn btn-line btn-sm btn-bad" id="eImgDel" type="button">O\'chirish</button></div></div>' +
      '<div class="f"><label for="eName">Nomi</label><input id="eName" value="' + esc(d.name) + '" placeholder="Cappuccino"></div>' +
      '<div class="f"><label for="eCat">Kategoriya</label><select id="eCat">' + m.categories.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === d.cat ? " selected" : "") + ">" + esc(c.name) + "</option>").join("") + "</select></div>" +
      '<div class="f"><label for="ePrice">Narxi (so\'m)</label><input id="ePrice" type="number" min="0" step="500" value="' + esc(d.price) + '"></div>' +
      '<div class="f"><label for="eEmoji">Emoji (rasm bo\'lmasa)</label><input id="eEmoji" maxlength="4" value="' + esc(d.emoji) + '"></div>' +
      '<div class="f full"><label for="eDesc">Tavsif</label><textarea id="eDesc" rows="2">' + esc(d.desc) + "</textarea></div>" +
      '<div class="f full"><label>Variantlar</label><div class="checks">' +
      '<label><input type="checkbox" id="oS"' + (d.opts && d.opts.s ? " checked" : "") + "> Hajm (S/M/L)</label>" +
      '<label><input type="checkbox" id="oM"' + (d.opts && d.opts.m ? " checked" : "") + "> Sut turi</label>" +
      '<label><input type="checkbox" id="oW"' + (d.opts && d.opts.sw ? " checked" : "") + "> Shirinlik</label>" +
      '<label><input type="checkbox" id="oP"' + (d.popular ? " checked" : "") + "> Mashhur (HIT)</label>" +
      '<label><input type="checkbox" id="oN"' + (d.isNew ? " checked" : "") + "> Yangi</label></div></div>" +
      '<div class="f full"><span class="err" id="eErr"></span></div></div>' +
      '<div class="modal-f">' + (p ? '<button class="btn btn-line btn-bad" id="eDel" style="margin-right:auto">O\'chirish</button>' : "") +
      '<button class="btn btn-line" data-close>Bekor qilish</button><button class="btn btn-acc" id="eSave">Saqlash</button></div>';
    openModal();

    $("eImg").onchange = (e) => {
      const f = e.target.files[0];
      if (!f || !f.type.startsWith("image/")) return;
      if (f.size > 5 * 1024 * 1024) return toast("Rasm 5MB dan oshmasin");
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          const sc = Math.min(1, 600 / Math.max(im.width, im.height));
          const c = document.createElement("canvas");
          c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          img = c.toDataURL("image/jpeg", 0.82);
          $("eImgTh").innerHTML = '<img src="' + img + '" alt="">';
        };
        im.src = r.result;
      };
      r.readAsDataURL(f);
    };
    $("eImgDel").onclick = () => { img = null; $("eImgTh").textContent = $("eEmoji").value || "☕"; };
    $("eSave").onclick = () => {
      const name = $("eName").value.trim();
      const price = parseInt($("ePrice").value, 10);
      if (name.length < 2) return ($("eErr").textContent = "Mahsulot nomini kiriting");
      if (!(price > 0)) return ($("eErr").textContent = "Narxni kiriting");
      const mm = menu();
      const data = {
        name, price, cat: $("eCat").value, emoji: $("eEmoji").value.trim() || "☕", desc: $("eDesc").value.trim(), image: img,
        opts: { s: $("oS").checked, m: $("oM").checked, sw: $("oW").checked }, popular: $("oP").checked, isNew: $("oN").checked,
      };
      if (p) Object.assign(mm.products.find((x) => String(x.id) === String(p.id)), data);
      else mm.products.push(Object.assign({ id: mm.products.reduce((a, x) => Math.max(a, Number(x.id) || 0), 0) + 1, available: true }, data));
      saveMenu(mm);
      closeModal(); toast("Saqlandi"); render();
    };
    if (p) $("eDel").onclick = () => {
      if (!confirm('"' + p.name + '" o\'chirilsinmi?')) return;
      const mm = menu();
      mm.products = mm.products.filter((x) => String(x.id) !== String(p.id));
      saveMenu(mm); closeModal(); toast("O'chirildi"); render();
    };
  }
  // Kategoriyalar: nomi, emoji, sadoqat kartasiga hisoblanadimi (ichimlik)
  function manageCategories() {
    const draw = () => {
      const m = menu();
      $("modalBox").innerHTML =
        '<div class="modal-h"><h2 id="modalTitle">Kategoriyalar</h2><button class="ib" data-close aria-label="Yopish">×</button></div>' +
        '<div class="rows">' + m.categories.map((c, i) =>
          '<div class="row cat-row"><input class="cat-emoji" data-ci="' + i + '" data-k="emoji" value="' + esc(c.emoji) + '" maxlength="4" aria-label="Emoji">' +
          '<input class="cat-name" data-ci="' + i + '" data-k="name" value="' + esc(c.name) + '" aria-label="Kategoriya nomi">' +
          '<label class="checks" style="font-size:13px"><input type="checkbox" data-ci="' + i + '" data-k="drink"' + (c.drink ? " checked" : "") + "> Ichimlik</label>" +
          '<button class="btn btn-line btn-sm btn-bad" data-catdel="' + i + '">O\'chirish</button></div>').join("") + "</div>" +
        '<p style="font-size:12.5px;color:var(--mut);margin-top:10px">"Ichimlik" belgilangan kategoriyadagi har bir mahsulot sadoqat kartasiga marka qo\'shadi.</p>' +
        '<div class="modal-f"><button class="btn btn-line" id="catAdd" style="margin-right:auto">+ Kategoriya</button><button class="btn btn-acc" data-close>Tayyor</button></div>';
      $("modalBox").querySelectorAll("[data-ci]").forEach((inp) => {
        inp.onchange = () => {
          const mm = menu(); const c = mm.categories[Number(inp.dataset.ci)];
          if (inp.dataset.k === "drink") c.drink = inp.checked;
          else c[inp.dataset.k] = inp.value.trim() || c[inp.dataset.k];
          saveMenu(mm); render();
        };
      });
      $("modalBox").querySelectorAll("[data-catdel]").forEach((b) => {
        b.onclick = () => {
          const mm = menu(); const c = mm.categories[Number(b.dataset.catdel)];
          const n = mm.products.filter((p) => p.cat === c.id).length;
          if (n) return toast("Avval bu kategoriyadagi " + n + " ta mahsulotni boshqa kategoriyaga o'tkazing");
          mm.categories.splice(Number(b.dataset.catdel), 1);
          saveMenu(mm); if (state.cat === c.id) state.cat = "all"; draw(); render();
        };
      });
      $("catAdd").onclick = () => {
        const mm = menu();
        mm.categories.push({ id: "c" + Date.now().toString(36), name: "Yangi kategoriya", emoji: "🍽️", drink: false });
        saveMenu(mm); draw(); render();
      };
    };
    draw(); openModal();
  }

  /* ---------- 3. Mijozlar ---------- */
  function pageCustomers() {
    const every = settings().loyaltyEvery || 5;
    const list = customers().slice().sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
    if (!list.length) return '<div class="card"><div class="empty">Hali mijoz yo\'q. Birinchi buyurtmadan keyin shu yerda ko\'rinadi.</div></div>';
    return '<div class="card"><div class="rows">' + list.map((c) =>
      '<div class="row"><span class="th">' + esc((c.name || "?").charAt(0).toUpperCase()) + '</span><div class="b"><b>' + esc(c.name || "—") + "</b><small>" + esc(c.phone) + " · " + (c.orders || 0) + " ta buyurtma" + (c.lastAt ? " · " + ago(c.lastAt) : "") + "</small></div>" +
      '<span class="pill ' + ((c.stamps || 0) >= every ? "ok" : "acc") + '">☕ ' + Math.min(c.stamps || 0, every) + "/" + every + "</span>" +
      '<span class="pr">' + fmt(c.spent || 0) + '</span><button class="btn btn-line btn-sm" data-openchat="' + esc(c.phone) + '">Yozish</button></div>').join("") + "</div></div>";
  }

  /* ---------- 4. Xabarlar (mijoz bilan chat) ---------- */
  function conversations() {
    const by = {};
    messages().forEach((m) => {
      const k = normPhone(m.phone);
      (by[k] = by[k] || { phone: m.phone, name: m.name, list: [] }).list.push(m);
      if (m.from === "user" && m.name) by[k].name = m.name;
    });
    customers().forEach((c) => { const k = normPhone(c.phone); if (by[k] && !by[k].name) by[k].name = c.name; });
    return Object.entries(by).map(([k, v]) => Object.assign({ key: k }, v))
      .sort((a, b) => b.list[b.list.length - 1].at.localeCompare(a.list[a.list.length - 1].at));
  }
  function pageMessages() {
    const convs = conversations();
    if (state.chat && !convs.find((c) => c.key === state.chat)) {
      const cu = customers().find((c) => normPhone(c.phone) === state.chat);
      if (cu) convs.unshift({ key: state.chat, phone: cu.phone, name: cu.name, list: [] });
    }
    if (!state.chat && convs.length) state.chat = convs[0].key;
    const cur = convs.find((c) => c.key === state.chat);
    if (!convs.length) return '<div class="card"><div class="empty">Hali xabar yo\'q. Mijozlar ilovadagi "Profil → Admin bilan chat" orqali yozadi.</div></div>';
    return '<div class="chat"><div class="chat-list">' + convs.map((c) => {
      const last = c.list[c.list.length - 1];
      const unread = c.list.filter((m) => m.from === "user" && !m.read).length;
      return '<button class="chat-li' + (c.key === state.chat ? " on" : "") + '" data-chat="' + esc(c.key) + '"><span class="th">' + esc((c.name || "?").charAt(0).toUpperCase()) + '</span><span class="b"><b>' + esc(c.name || c.phone) + "</b><small>" + esc(last ? last.text : "Yangi suhbat") + "</small></span>" +
        (unread ? '<span class="n">' + unread + "</span>" : last ? "<small>" + hm(last.at) + "</small>" : "") + "</button>";
    }).join("") + '</div><div class="chat-conv">' +
      (cur ? '<div class="chat-h"><b>' + esc(cur.name || "Mijoz") + "</b><small>" + esc(cur.phone) + '</small></div><div class="chat-body" id="chatBody">' +
        (cur.list.length ? cur.list.map((m) => '<div class="bub ' + (m.from === "admin" ? "me" : "them") + '">' + esc(m.text) + "<small>" + dmy(m.at) + "</small></div>").join("") : '<div class="empty" style="padding:30px 0">Birinchi xabarni yozing</div>') +
        '</div><form class="chat-f" id="chatForm"><input id="chatInput" placeholder="Javob yozing..." autocomplete="off" aria-label="Javob"><button class="btn btn-acc" type="submit">Yuborish</button></form>' : "") +
      "</div></div>";
  }
  async function markRead(key) {
    const list = (await Cloud.fetchKey("messages", [])) || [];
    let changed = false;
    list.forEach((m) => { if (normPhone(m.phone) === key && m.from === "user" && !m.read) { m.read = true; changed = true; } });
    if (changed) { Cloud.set("messages", list); render(); }
  }
  async function sendAdminMessage(text) {
    const conv = conversations().find((c) => c.key === state.chat);
    const cu = customers().find((c) => normPhone(c.phone) === state.chat);
    const phone = conv ? conv.phone : cu ? cu.phone : state.chat;
    const list = (await Cloud.fetchKey("messages", [])) || [];
    list.push({ id: "m" + Date.now().toString(36), phone, name: conv ? conv.name : cu ? cu.name : "", from: "admin", text, at: new Date().toISOString() });
    Cloud.set("messages", list.slice(-1000));
    render();
  }

  /* ---------- 5. Statistika ---------- */
  function pageStats() {
    const all = orders().filter(live);
    const days = state.period === "today" ? 1 : state.period === "week" ? 7 : 30;
    const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (days - 1));
    const list = all.filter((o) => new Date(o.createdAt) >= from);
    const rev = list.reduce((a, o) => a + o.total, 0);
    let chart;
    if (days === 1) chart = hourlyCard(list);
    else {
      const ds = Array.from({ length: days }, (_, i) => { const d = new Date(from); d.setDate(from.getDate() + i); return d; });
      const sums = ds.map((d) => list.filter((o) => dayKey(o.createdAt) === dayKey(d)).reduce((a, o) => a + o.total, 0));
      const max = Math.max(1, ...sums);
      chart = '<div class="card"><h3>Kunlik tushum</h3><div class="bars">' + ds.map((d, i) =>
        '<div class="bar" title="' + d.getDate() + "." + (d.getMonth() + 1) + " — " + fmt(sums[i]) + ' so\'m"><i style="height:' + Math.round((sums[i] / max) * 100) + '%"></i><small>' + (days === 7 || i % 5 === 0 ? d.getDate() : "") + "</small></div>").join("") + "</div></div>";
    }
    const byType = { pickup: 0, table: 0, delivery: 0 };
    list.forEach((o) => { byType[o.type] = (byType[o.type] || 0) + 1; });
    return '<div class="seg">' + [["today", "Bugun"], ["week", "7 kun"], ["month", "30 kun"]].map((x) => '<button data-period="' + x[0] + '" class="' + (state.period === x[0] ? "on" : "") + '">' + x[1] + "</button>").join("") + "</div>" +
      '<div class="kpis"><div class="kpi"><small>Tushum, so\'m</small><b>' + fmt(rev) + '</b></div><div class="kpi"><small>Buyurtmalar</small><b>' + list.length + "</b><span>" + byType.pickup + " olib ketish · " + byType.table + ' stol</span></div>' +
      '<div class="kpi"><small>O\'rtacha chek</small><b>' + fmt(list.length ? rev / list.length : 0) + '</b></div><div class="kpi"><small>Sadoqat sovg\'alari</small><b>' + list.filter((o) => o.discount > 0).length + "</b></div></div>" +
      '<div class="grid-2">' + chart + topCard(list, "Eng ko'p sotilganlar") + "</div>";
  }

  /* ---------- 6. Telegram bot (boshqa panellar bilan bir xil) ---------- */
  function pageBot() {
    const st = botStatus || {};
    const connected = !!st.connected;
    const username = st.username || "";
    const channel = st.channel || "";
    return '<div class="bot-top"><span class="bot-pill ' + (connected ? "on" : "off") + '"><i></i>' + (botStatus ? (connected ? "Ulangan" : "Ulanmagan") : "Tekshirilmoqda…") + "</span>" +
      '<span class="bot-stat"><b>' + fmt(st.userCount || 0) + '</b> obunachi</span><span class="bot-stat"><b>' + fmt(st.sentCount || 0) + "</b> yuborilgan</span>" +
      (st.error ? '<span class="bot-err">' + esc(botErr({ message: st.error })) + "</span>" : "") + "</div>" +
      '<div class="grid-2" style="margin-top:0">' +
      '<div class="card"><h3>1. Botni ulash</h3><div class="f"><label for="botToken">Bot tokeni</label><div class="token-row"><input id="botToken" type="' + (botTokenShown ? "text" : "password") + '" placeholder="123456789:AAE-..." autocomplete="off"><button class="ib" id="botEye" type="button" aria-label="Tokenni ko\'rsatish">👁</button></div>' +
      '<p class="hint">@BotFather → /newbot → tokenni nusxalab joylang</p></div>' +
      '<div class="modal-f" style="justify-content:flex-start"><button class="btn btn-acc" id="botConnect">Botni ulash</button><button class="btn btn-line btn-bad" id="botDisconnect">Uzish</button></div>' +
      (connected && username ? '<div class="bot-card"><span>✈️</span><div><b>' + esc(username) + '</b><small>Faol — buyurtmalarni yuboradi</small></div><a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="https://t.me/' + esc(username.replace(/^@/, "")) + '">Ochish</a></div>' : "") +
      "</div>" +
      '<div class="card"><h3>2. Buyurtma kanali</h3><div class="f"><label for="botChannel">Kanal username yoki ID</label><input id="botChannel" placeholder="@kanal_nomi" value="' + esc(channel) + '">' +
      '<p class="hint">Botni kanalga admin qiling, so\'ng shu yerga username yozing</p></div>' +
      '<div class="modal-f" style="justify-content:flex-start"><button class="btn btn-acc" id="botSetChannel">Kanalni ulash</button><button class="btn btn-line" id="botTest">Test xabar</button></div>' +
      '<p class="hint" style="margin-top:10px">' + (channel ? "🟢 Ulangan: " + esc(channel) : "⚪ Kanal ulanmagan") + "</p></div></div>" +
      '<div class="card" style="margin-top:12px"><h3>3. Mijozlarga ommaviy xabar</h3><div class="f"><textarea id="botBroadcast" rows="3" placeholder="Barcha bot obunachilariga yuboriladigan xabar (masalan: bugun barcha latte −20%)"></textarea></div>' +
      '<div class="modal-f"><button class="btn btn-acc" id="botBroadcastBtn">Hammaga yuborish</button></div></div>' +
      '<div class="card" style="margin-top:12px"><h3>Qanday ishlaydi?</h3><ol class="steps">' +
      "<li><b>@BotFather</b> dan <b>/newbot</b> orqali bot yarating va tokenni oling.</li>" +
      "<li>Tokenni yuqoriga joylab <b>Botni ulang</b>.</li>" +
      "<li>Telegram kanal oching va botni kanalga <b>admin</b> qiling.</li>" +
      "<li>Kanal username'ini (masalan <code>@kafe_buyurtmalar</code>) kiritib <b>Kanalni ulang</b>.</li>" +
      "<li>Endi har bir yangi buyurtma avtomatik kanalga yuboriladi. ✅</li></ol></div>";
  }

  /* ---------- 7. QR kod (standart tizim + stol QR) ---------- */
  function pageQr() {
    const s = settings();
    const n = Math.max(0, Math.min(60, s.tables != null ? s.tables : 6));
    const url = qrStoreUrl();
    return '<div class="qr-wrap"><div class="card qr-prev"><div class="qr-frame"><img id="qrImage" src="' + qrApiSrc(url, 320) + '" alt="Kafe QR kodi"></div>' +
      '<b class="qr-name">' + esc(s.shopName) + '</b><small>📷 Telefon bilan skaner qiling</small></div>' +
      '<div class="card qr-info"><span class="pill acc">VEB-ILOVA QR KODI</span><h3 style="margin-top:10px">Mijozlar QR kodni skaner qilib ilovangizni ochadi</h3>' +
      '<p class="hint">Telefon kamerasi bilan skaner qilinganda kafengizning veb-ilovasi avtomatik ochiladi. QR kodni kassa, vitrina, menyu yoki reklama varaqasiga joylashtiring.</p>' +
      '<div class="f" style="margin-top:12px"><label for="qrUrl">Ilova manzili (URL)</label><input id="qrUrl" readonly value="' + esc(url) + '"></div>' +
      '<p class="hint">Bu havola QR kodga yozilgan (<code>?client=</code> bilan). Mijoz skanerlasa shu sahifa ochiladi.</p>' +
      '<div class="qr-actions"><button class="btn btn-line" id="qrCopy">Nusxalash</button><button class="btn btn-line" id="qrDown">Yuklab olish</button><button class="btn btn-line" id="qrPrint">Chop etish</button><a class="btn btn-line" href="' + esc(url) + '" target="_blank" rel="noopener">Ochish</a></div></div></div>' +
      '<div class="qr-steps"><div><span>1️⃣</span><b>QR kodni joylashtiring</b><small>Kassa, stol, vitrina yoki reklamaga</small></div><div><span>2️⃣</span><b>Mijoz skaner qiladi</b><small>Telefon kamerasi yoki QR-skaner orqali</small></div><div><span>3️⃣</span><b>Ilova ochiladi</b><small>Mijoz to\'g\'ridan-to\'g\'ri buyurtma beradi</small></div></div>' +
      '<div class="card" style="margin-top:12px"><div class="card-top"><div><h3 style="margin:0">Stol QR kodlari</h3><p class="hint">Stol QR\'i skanerlansa menyu stol raqami bilan ochiladi — buyurtma o\'sha stolga yoziladi.</p></div>' +
      '<div style="display:flex;gap:8px;align-items:end"><div class="f" style="width:110px"><label for="tCount">Stollar soni</label><input id="tCount" type="number" min="0" max="60" value="' + n + '"></div><button class="btn btn-line" id="tSave">Yangilash</button>' + (n ? '<button class="btn btn-line" id="tPrint">Hammasini chop etish</button>' : "") + "</div></div>" +
      (n ? '<div class="qr-grid">' + Array.from({ length: n }, (_, i) => '<div class="qr"><img src="' + qrApiSrc(qrStoreUrl(i + 1), 300) + '" alt="Stol ' + (i + 1) + ' QR kodi" loading="lazy"><b>Stol ' + (i + 1) + '</b><button class="btn btn-sm qr-dl" data-tqr="' + (i + 1) + '">Yuklab olish</button></div>').join("") + "</div>" : '<div class="empty" style="padding:20px 0">Stollar soni 0 — faqat umumiy QR ishlatiladi</div>') +
      "</div>";
  }

  /* ---------- 8. Sozlamalar ---------- */
  function pageSettings() {
    const s = settings();
    return '<div class="card"><h3>Kafe ma\'lumotlari</h3><div class="form">' +
      '<div class="f"><label for="sName">Kafe nomi</label><input id="sName" value="' + esc(s.shopName) + '"></div>' +
      '<div class="f"><label for="sPhone">Telefon</label><input id="sPhone" value="' + esc(s.phone) + '"></div>' +
      '<div class="f"><label for="sAddr">Manzil</label><input id="sAddr" value="' + esc(s.address) + '"></div>' +
      '<div class="f"><label for="sHours">Ish vaqti</label><input id="sHours" value="' + esc(s.hours) + '"></div>' +
      '<div class="f"><label for="sLoy">Sadoqat: har nechanchi ichimlik bepul</label><input id="sLoy" type="number" min="2" max="20" value="' + esc(s.loyaltyEvery) + '"></div>' +
      '<div class="f"><label for="sFeat">Kun ichimligi (bosh sahifa kartasi)</label><select id="sFeat"><option value="">Avtomatik (birinchi mashhur)</option>' +
      menu().products.map((p) => '<option value="' + esc(p.id) + '"' + (String(s.featured) === String(p.id) ? " selected" : "") + ">" + esc(p.name) + "</option>").join("") + "</select></div>" +
      '<div class="f"><label>Yetkazib berish</label><div class="checks"><label><input type="checkbox" disabled> Tez orada (2-versiya)</label></div></div>' +
      '</div><div class="modal-f"><button class="btn btn-acc" id="sSave">Saqlash</button></div></div>' +
      '<div class="card" style="margin-top:12px"><h3>Ma\'lumotlarni tozalash</h3><p class="hint" style="margin-bottom:12px">Sinov buyurtmalarini o\'chirish uchun. Menyu va sozlamalar saqlanib qoladi.</p>' +
      '<button class="btn btn-line btn-bad" id="clearOrders">Barcha buyurtmalarni o\'chirish</button></div>';
  }

  /* ---------- modal ---------- */
  const openModal = () => $("modal").classList.add("show");
  const closeModal = () => $("modal").classList.remove("show");

  /* ---------- render ---------- */
  function render() {
    const s = settings();
    $("brandName").textContent = s.shopName;
    document.title = s.shopName + " · Admin";
    let lastGroup = "";
    $("nav").innerHTML = PAGES.map((p) => {
      const n = p.badge ? p.badge() : 0;
      const head = p.group !== lastGroup ? '<div class="nav-group">' + p.group + "</div>" : "";
      lastGroup = p.group;
      return head + '<button class="' + (state.page === p.id ? "on" : "") + '" data-page="' + p.id + '"' + (state.page === p.id ? ' aria-current="page"' : "") + ">" + ICO[p.id] + "<span>" + p.label + "</span>" + (n ? '<span class="n">' + n + "</span>" : "") + "</button>";
    }).join("");
    $("sideCafe").innerHTML = '<span class="cafe-av">' + esc((s.shopName || "K").trim().charAt(0).toUpperCase()) + '</span><span class="cafe-b"><b>' + esc(s.shopName) + '</b><small><i class="dot' + (Cloud.mode === "cloud" ? " ok" : "") + '"></i>' + (Cloud.mode === "cloud" ? "Sinxron" : "Faqat shu qurilma") + '</small></span><a class="cafe-open" href="' + esc(qrStoreUrl()) + '" target="_blank" rel="noopener" title="Ilovani ochish" aria-label="Ilovani ochish">' + ICO.ext + "</a>";
    const pg = PAGES.find((p) => p.id === state.page);
    $("pageTitle").textContent = pg.label;
    $("pageSub").textContent = pg.sub;
    $("headActions").innerHTML = state.page === "menu"
      ? '<button class="btn btn-acc" id="addProduct">+ Mahsulot</button>'
      : state.page === "orders" ? '<a class="btn btn-line" href="' + esc(qrStoreUrl()) + '" target="_blank" rel="noopener">Ilovani ochish</a>' : "";
    $("page").innerHTML = { orders: pageOrders, menu: pageMenu, customers: pageCustomers, messages: pageMessages, stats: pageStats, bot: pageBot, qr: pageQr, settings: pageSettings }[state.page]();

    // sahifaga xos ulanishlar
    const sq = (id, key) => { const el = $(id); if (el) el.oninput = () => { state[key] = el.value; const pos = el.selectionStart; render(); const n = $(id); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }; };
    sq("histQ", "hq"); sq("menuQ", "q");
    if (state.page === "messages") {
      const body = $("chatBody"); if (body) body.scrollTop = body.scrollHeight;
      const f = $("chatForm");
      if (f) f.onsubmit = (e) => { e.preventDefault(); const v = $("chatInput").value.trim(); if (v) sendAdminMessage(v); };
      if (state.chat) {
        const conv = conversations().find((c) => c.key === state.chat);
        if (conv && conv.list.some((m) => m.from === "user" && !m.read)) markRead(state.chat);
      }
    }
  }

  /* ---------- hodisalar ---------- */
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.page) return go(t.dataset.page);
    if (t.id === "menuBtn") { $("side").classList.add("open"); $("overlay").classList.add("show"); return; }
    if (t.id === "sideClose") return closeSide();
    if (t.dataset.st) {
      if (t.dataset.st === "cancelled" && !confirm("Buyurtma bekor qilinsinmi?")) return;
      state.fresh.delete(t.dataset.id);
      return setStatus(t.dataset.id, t.dataset.st);
    }
    if (t.dataset.hist) { state.hist = t.dataset.hist; return render(); }
    if (t.dataset.cat) { state.cat = t.dataset.cat; return render(); }
    if (t.id === "manageCats") return manageCategories();
    if (t.dataset.avail) {
      const m = menu();
      const p = m.products.find((x) => String(x.id) === t.dataset.avail);
      p.available = p.available === false;
      saveMenu(m);
      toast(p.name + (p.available ? " — mavjud" : " — tugagan"));
      return render();
    }
    if (t.dataset.edit) return editProduct(t.dataset.edit);
    if (t.id === "addProduct") return editProduct(null);
    if (t.hasAttribute("data-close")) return closeModal();
    if (t.dataset.period) { state.period = t.dataset.period; return render(); }
    if (t.dataset.chat) { state.chat = t.dataset.chat; return render(); }
    if (t.dataset.openchat) { state.chat = normPhone(t.dataset.openchat); return go("messages"); }

    // QR
    if (t.id === "qrCopy") return navigator.clipboard.writeText(qrStoreUrl()).then(() => toast("Havola nusxalandi"), () => toast("Nusxalab bo'lmadi"));
    if (t.id === "qrDown") return qrDownload(qrStoreUrl(), "qr-kod.png");
    if (t.id === "qrPrint") return qrPrint([{ url: qrStoreUrl(), label: "Veb-ilovamizni oching" }]);
    if (t.dataset.tqr) return qrDownload(qrStoreUrl(t.dataset.tqr), "stol-" + t.dataset.tqr + "-qr.png");
    if (t.id === "tPrint") {
      const n = settings().tables != null ? settings().tables : 6;
      return qrPrint(Array.from({ length: n }, (_, i) => ({ url: qrStoreUrl(i + 1), label: "Stol " + (i + 1) })));
    }
    if (t.id === "tSave") {
      const s = settings();
      s.tables = Math.max(0, Math.min(60, parseInt($("tCount").value, 10) || 0));
      saveSettings(s); toast("Yangilandi"); return render();
    }

    // Sozlamalar
    if (t.id === "sSave") {
      const s = settings();
      Object.assign(s, {
        shopName: $("sName").value.trim() || "Kofe Kafe", phone: $("sPhone").value.trim(), address: $("sAddr").value.trim(),
        hours: $("sHours").value.trim(), loyaltyEvery: Math.max(2, Math.min(20, parseInt($("sLoy").value, 10) || 5)), featured: $("sFeat").value || null, shopNameApplied: true,
      });
      saveSettings(s); toast("Sozlamalar saqlandi"); return render();
    }
    if (t.id === "clearOrders") {
      if (!confirm("Barcha buyurtmalar o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.")) return;
      Cloud.set("orders", []); toast("Buyurtmalar o'chirildi"); return render();
    }

    // Telegram bot
    if (t.id === "botEye") { botTokenShown = !botTokenShown; const i = $("botToken"); i.type = botTokenShown ? "text" : "password"; return; }
    if (t.id === "botConnect") {
      const token = ($("botToken").value || "").trim();
      if (!/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token)) return toast("Token formati noto'g'ri");
      if (!window.Telegram || !Telegram.connect) return toast("Telegram klienti yuklanmadi");
      t.disabled = true; const old = t.textContent; t.textContent = "Ulanmoqda…";
      try { const r = await Telegram.connect({ token, shopName: settings().shopName, storeUrl: qrStoreUrl() }); toast("Bot ulandi" + (r && r.username ? ": " + r.username : "")); }
      catch (err) { toast(botErr(err)); }
      t.disabled = false; t.textContent = old;
      return botRefresh();
    }
    if (t.id === "botDisconnect") { if (window.Telegram) await Telegram.disconnect(); toast("Bot uzildi"); return botRefresh(); }
    if (t.id === "botSetChannel") {
      const ch = ($("botChannel").value || "").trim();
      if (!ch) return toast("Kanal username kiriting");
      try { await Telegram.setChannel(ch); toast("Kanal ulandi: " + ch); } catch (err) { toast(botErr(err)); }
      return botRefresh();
    }
    if (t.id === "botTest") {
      const r = await Telegram.sendOrder({ id: "TEST-" + Math.floor(1000 + Math.random() * 9000), userName: "Test mijoz", phone: "+998 90 000 00 00", address: "Stol 1", payment: "Joyida", items: [{ name: "Cappuccino (M 350 ml)", qty: 1, price: 26000 }], total: 26000 });
      return toast(r && r.ok ? "Test xabar kanalga yuborildi" : botErr({ message: (r && r.error) || "Yuborilmadi" }));
    }
    if (t.id === "botBroadcastBtn") {
      const text = ($("botBroadcast").value || "").trim();
      if (!text) return toast("Xabar matnini kiriting");
      try { const r = await Telegram.broadcast(text); toast("Yuborildi: " + (r.sent || 0) + "/" + (r.total || 0)); $("botBroadcast").value = ""; }
      catch (err) { toast(botErr(err)); }
    }
  });
  $("overlay").addEventListener("click", closeSide);
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeSide(); } });

  // Jonli yangilanish: yangi buyurtma yoki xabar kelsa — ovoz va belgi
  let known = new Set(orders().map((o) => o.id));
  let knownMsg = messages().length;
  if (Cloud.watch) {
    Cloud.watch(["orders", "customers", "menu", "settings", "messages"], (key, value) => {
      Cloud.adopt(key, value);
      if (key === "orders") {
        const fresh = (value || []).filter((o) => !known.has(o.id));
        if (fresh.length) { fresh.forEach((o) => state.fresh.add(o.id)); beep(); toast("Yangi buyurtma: #" + fresh[fresh.length - 1].no); }
        known = new Set((value || []).map((o) => o.id));
      }
      if (key === "messages") {
        const list = value || [];
        const last = list[list.length - 1];
        if (list.length > knownMsg && last && last.from === "user") { beep(); toast("Yangi xabar: " + String(last.text || "").slice(0, 40)); }
        knownMsg = list.length;
      }
      if ($("modal").classList.contains("show")) return;
      const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (!typing) render();
    }, 4000);
  }

  render();
})();
