/* ============================================================
   OVQAT DOKONI — ADMIN PANEL mantiqi
   Sof vanilla JS. window.DATA mijoz ilovasidan keladi.
   ============================================================ */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     0) Yordamchilar
     ---------------------------------------------------------- */

  // Pul formati: 2450000 -> "2 450 000"
  const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  // To'liq so'm: "2 450 000 so'm"
  const sum = (n) => fmt(n) + " so'm";
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (id) => document.getElementById(id);

  /* ----------------------------------------------------------
     1) SVG ikonkalar (currentColor)
     ---------------------------------------------------------- */
  const ICON = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    box:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    receipt:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2-3-2z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/></svg>',
    users:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    chat:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    cal:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    bell:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    moon:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    menu:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    plus:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    edit:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    close:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    back:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    revenue:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    expense:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
    profit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    cart:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    bot:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="3.5" r="1.5"/><circle cx="8.5" cy="13.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="13.5" r="1.2" fill="currentColor" stroke="none"/><path d="M9 17h6"/></svg>',
    qr:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14" y2="14.01"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="14" y1="21" x2="14" y2="21.01"/><line x1="21" y1="21" x2="21" y2="21.01"/><line x1="17.5" y1="17.5" x2="17.5" y2="17.51"/></svg>',
    broadcast:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
    link:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    print:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    copy:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    power:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
  };

  /* ----------------------------------------------------------
     2) Mock ma'lumotlar (admin uchun)
     ---------------------------------------------------------- */

  // Haftalik daromad va harajat (Du–Ya) — real ma'lumot kelguncha bo'sh (0)
  const WEEK = {
    days: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
    revenue: [0, 0, 0, 0, 0, 0, 0],
    expense: [0, 0, 0, 0, 0, 0, 0],
  };
  // Sof foyda = daromad - harajat
  WEEK.profit = WEEK.revenue.map((r, i) => r - WEEK.expense[i]);

  // KPI (bugungi) — real ma'lumot kelguncha 0
  const KPI = {
    revenue: 0, revenueUp: 0,
    expense: 0, expenseUp: 0,
    profit: 0, profitUp: 0,
    orders: 0, ordersUp: 0,
  };

  // To'lov usullari taqsimoti (buyurtmalar soni) — boshlang'ich 0
  const PAY_DIST = [
    { id: "cash",  name: "Naqd pul",     val: 0, color: "#22c55e" },
    { id: "card",  name: "Bank kartasi", val: 0, color: "#3b82f6" },
    { id: "click", name: "Click",        val: 0, color: "#0ea5e9" },
    { id: "payme", name: "Payme",        val: 0, color: "#22d3ee" },
  ];

  // Mijozlar — bo'sh (foydalanuvchilar ro'yxatdan o'tgach to'ladi)
  const USERS = [];

  // Buyurtmalardagi mijoz ismlari
  const ORDER_CUSTOMERS = [];

  // Habarlar (suhbatlar) — bo'sh (mijozlar yozgach to'ladi)
  const CHATS = [];

  // Do'kon sozlamalari
  const SETTINGS = {
    shopName: "Ovqat Dokoni",
    phone: "+998 71 200 70 70",
    address: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 12",
    hours: "08:00 – 23:00",
    delivery: 10000,
    freeFrom: 100000,
    minOrder: 30000,
    pay: { cash: true, card: true, click: true, payme: false },
  };

  /* ----------------------------------------------------------
     3) Holat (state)
     ---------------------------------------------------------- */

  // Mahsulotlarni nusxalab olamiz (admin in-memory bilan ishlaydi)
  // To'g'ridan-to'g'ri umumiy katalogga (DATA.products/categories) ishlaymiz —
  // o'zgarishlar saveCatalog() orqali localStorage'ga saqlanadi va storefront ko'radi.
  const products = window.DATA && window.DATA.products ? window.DATA.products : [];
  const categories = window.DATA && window.DATA.categories ? window.DATA.categories : [];
  const orders = (window.DATA && window.DATA.orders ? window.DATA.orders : []).map((o) => ({ ...o }));
  // Katalogni saqlash yordamchisi
  const saveCatalog = () => { if (window.DATA && window.DATA.saveCatalog) window.DATA.saveCatalog(); };

  let nextProductId = products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  const STATUS_LABEL = { pending: "Kutilmoqda", ontheway: "Yo'lda", done: "Yetkazildi", cancel: "Bekor qilindi" };

  const NAV = [
    { id: "dashboard", label: "Dashboard",        icon: "dashboard", title: "Boshqaruv paneli" },
    { id: "products",  label: "Mahsulotlar",      icon: "box",       title: "Mahsulotlar" },
    { id: "orders",    label: "Buyurtmalar",      icon: "receipt",   title: "Buyurtmalar" },
    { id: "users",     label: "Foydalanuvchilar", icon: "users",     title: "Foydalanuvchilar" },
    { id: "messages",  label: "Habarlar",         icon: "chat",      title: "Habarlar", badge: () => CHATS.reduce((s, c) => s + c.unread, 0) },
    { id: "bot",       label: "Telegram bot",     icon: "bot",       title: "Telegram bot" },
    { id: "qrcode",    label: "QR kod",           icon: "qr",        title: "QR Kod" },
    { id: "settings",  label: "Sozlamalar",       icon: "settings",  title: "Sozlamalar" },
  ];
  // Mobil tab-bar uchun (5 ta asosiy)
  const TABS = ["dashboard", "products", "orders", "messages", "settings"];

  let activeSection = "dashboard";
  let prodFilter = "all";    // mahsulot kategoriya filtri
  let orderFilter = "all";   // buyurtma status filtri
  let activeChat = CHATS[0] ? CHATS[0].id : null;
  let modalImage = null;     // mahsulot modalida yuklangan rasm (data-URL)

  // Telegram bot — lokal config (UI uchun) + serverdan kelgan oxirgi holat
  const BOT_KEY = "ovqat_bot_config";
  function botLocal() { try { return JSON.parse(localStorage.getItem(BOT_KEY) || "{}"); } catch (e) { return {}; } }
  function botSave(patch) {
    const c = { ...botLocal(), ...patch };
    try { localStorage.setItem(BOT_KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }
  let botStatus = null;      // store-bot serveridan oxirgi holat
  let botTokenShown = false; // token ko'rinishi (eye toggle)

  /* ----------------------------------------------------------
     4) Toast
     ---------------------------------------------------------- */
  function toast(msg, type) {
    type = type || "ok";
    const z = el("toastZone");
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.innerHTML = '<span class="ico"></span><span>' + msg + "</span>";
    z.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(10px)";
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  /* ----------------------------------------------------------
     5) Modal
     ---------------------------------------------------------- */
  function openModal(html) {
    el("modal").innerHTML = html;
    el("modalBack").classList.add("open");
  }
  function closeModal() {
    el("modalBack").classList.remove("open");
  }
  el("modalBack").addEventListener("click", (e) => {
    if (e.target === el("modalBack")) closeModal();
  });

  /* ----------------------------------------------------------
     6) SVG grafik generatorlari
     ---------------------------------------------------------- */

  // Grouped bar: daromad + harajat (7 kun)
  function barChart() {
    const W = 620, H = 260, padL = 50, padR = 14, padT = 18, padB = 34;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const all = WEEK.revenue.concat(WEEK.expense);
    const max = Math.ceil(Math.max(...all) / 500000) * 500000 || 500000;
    const y = (v) => padT + innerH - (v / max) * innerH;
    const groupW = innerW / WEEK.days.length;
    const barW = Math.min(20, groupW / 3.2);
    const gap = 5;

    let g = "";
    // Grid chiziqlar + y belgilar
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = (max / steps) * i;
      const yy = y(v);
      g += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" stroke="var(--grid-line)" stroke-width="1"/>';
      g += '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10" fill="var(--text-3)">' + fmt(v / 1000) + 'k</text>';
    }
    // Ustunlar
    WEEK.days.forEach((d, i) => {
      const cx = padL + groupW * i + groupW / 2;
      const x1 = cx - barW - gap / 2;
      const x2 = cx + gap / 2;
      const rH = innerH - (y(WEEK.revenue[i]) - padT);
      const eH = innerH - (y(WEEK.expense[i]) - padT);
      g += '<rect class="barEl" x="' + x1 + '" y="' + y(WEEK.revenue[i]) + '" width="' + barW + '" height="' + rH + '" rx="4" fill="url(#gRev)" style="transform-origin:' + cx + 'px ' + (padT + innerH) + 'px"><title>' + d + ': ' + sum(WEEK.revenue[i]) + '</title></rect>';
      g += '<rect class="barEl" x="' + x2 + '" y="' + y(WEEK.expense[i]) + '" width="' + barW + '" height="' + eH + '" rx="4" fill="url(#gExp)" style="transform-origin:' + cx + 'px ' + (padT + innerH) + 'px"><title>' + d + ': ' + sum(WEEK.expense[i]) + '</title></rect>';
      g += '<text x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11" fill="var(--text-3)" font-weight="600">' + d + '</text>';
    });

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      '<defs>' +
        '<linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#16a34a"/></linearGradient>' +
        '<linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#ef4444"/></linearGradient>' +
      '</defs>' + g + '</svg>';
  }

  // Area/line chart: sof foyda (7 kun)
  function lineChart() {
    const W = 620, H = 240, padL = 50, padR = 16, padT = 18, padB = 30;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const data = WEEK.profit;
    const max = Math.ceil(Math.max(...data) / 500000) * 500000 || 500000;
    const min = 0;
    const x = (i) => padL + (innerW / (data.length - 1)) * i;
    const y = (v) => padT + innerH - ((v - min) / (max - min)) * innerH;

    let grid = "";
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = (max / steps) * i;
      const yy = y(v);
      grid += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" stroke="var(--grid-line)" stroke-width="1"/>';
      grid += '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10" fill="var(--text-3)">' + fmt(v / 1000) + 'k</text>';
    }

    // Liniya yo'li
    let line = "M" + x(0) + " " + y(data[0]);
    for (let i = 1; i < data.length; i++) line += " L" + x(i) + " " + y(data[i]);
    const area = line + " L" + x(data.length - 1) + " " + (padT + innerH) + " L" + x(0) + " " + (padT + innerH) + " Z";

    // Nuqtalar + kun belgilari
    let dots = "";
    data.forEach((v, i) => {
      dots += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4.5" fill="var(--surface)" stroke="#22c55e" stroke-width="2.5"><title>' + WEEK.days[i] + ': ' + sum(v) + '</title></circle>';
      dots += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--text-3)" font-weight="600">' + WEEK.days[i] + '</text>';
    });

    // chiziq uzunligi (animatsiya uchun taxminiy)
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      '<defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(34,197,94,.35)"/><stop offset="1" stop-color="rgba(34,197,94,0)"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#gArea)"/>' +
      '<path class="lineEl" d="' + line + '" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + '</svg>';
  }

  // Mini sparkline (KPI kartalar uchun)
  function spark(values, color) {
    const W = 84, H = 34, pad = 3;
    const max = Math.max(...values), min = Math.min(...values);
    const rng = max - min || 1;
    const x = (i) => pad + ((W - pad * 2) / (values.length - 1)) * i;
    const y = (v) => H - pad - ((v - min) / rng) * (H - pad * 2);
    let d = "M" + x(0) + " " + y(values[0]);
    for (let i = 1; i < values.length; i++) d += " L" + x(i) + " " + y(values[i]);
    const area = d + " L" + x(values.length - 1) + " " + H + " L" + x(0) + " " + H + " Z";
    const gid = "sp" + Math.random().toString(36).slice(2, 7);
    return '<svg class="kspark" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".3"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // Donut: to'lov taqsimoti
  function donutChart() {
    const total = PAY_DIST.reduce((s, p) => s + p.val, 0);
    const R = 56, C = 70, sw = 18;
    const circ = 2 * Math.PI * R;
    let off = 0;
    let arcs = "";
    PAY_DIST.forEach((p) => {
      const frac = total ? p.val / total : 0;
      const len = frac * circ;
      arcs += '<circle cx="' + C + '" cy="' + C + '" r="' + R + '" fill="none" stroke="' + p.color + '" stroke-width="' + sw + '" ' +
        'stroke-dasharray="' + len + ' ' + (circ - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 ' + C + ' ' + C + ')" stroke-linecap="butt"><title>' + p.name + ': ' + p.val + '</title></circle>';
      off += len;
    });
    return '<svg viewBox="0 0 140 140">' +
      '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="var(--surface-2)" stroke-width="' + sw + '"/>' +
      arcs +
      '<text x="70" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text)">' + total + '</text>' +
      '<text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--text-3)">buyurtma</text>' +
      '</svg>';
  }

  /* ----------------------------------------------------------
     7) BO'LIMLAR (render funksiyalari)
     ---------------------------------------------------------- */

  // --- DASHBOARD ---
  function viewDashboard() {
    const top5 = products.slice().sort((a, b) => b.sold - a.sold).slice(0, 5);
    const maxSold = top5[0] ? top5[0].sold : 1;

    const kpiHTML =
      kpiCard("revenue", "💰", "Kunlik daromad", sum(KPI.revenue), KPI.revenueUp, "rgba(34,197,94,.16)", "#22c55e", WEEK.revenue) +
      kpiCard("expense", "🧾", "Harajatlar", sum(KPI.expense), KPI.expenseUp, "rgba(239,68,68,.16)", "#ef4444", WEEK.expense) +
      kpiCard("profit", "📈", "Sof foyda", sum(KPI.profit), KPI.profitUp, "rgba(34,197,94,.16)", "#22c55e", WEEK.profit) +
      kpiCard("orders", "🛒", "Buyurtmalar", KPI.orders + " ta", KPI.ordersUp, "rgba(59,130,246,.16)", "#3b82f6", [0, 0, 0, 0, 0, 0, 0]);

    const topHTML = top5.map((p) =>
      '<div class="top-item">' +
        '<span class="emo">' + p.emoji + '</span>' +
        '<div class="ti-mid">' +
          '<div class="ti-name">' + p.name + '</div>' +
          '<div class="ti-bar"><i style="width:' + ((p.sold / maxSold) * 100).toFixed(0) + '%"></i></div>' +
        '</div>' +
        '<span class="ti-num">' + p.sold + ' ta</span>' +
      '</div>'
    ).join("");

    const ordersHTML = orders.map((o) =>
      '<tr><td><b>' + o.id + '</b></td><td class="muted">' + o.date + '</td>' +
      '<td class="num">' + sum(o.total) + '</td>' +
      '<td><span class="pill ' + o.status + '"><span class="pdot"></span>' + STATUS_LABEL[o.status] + '</span></td></tr>'
    ).join("");

    const donutLegend = PAY_DIST.map((p) =>
      '<div class="dl-row"><i style="background:' + p.color + '"></i><span class="dl-name">' + p.name + '</span><span class="dl-val">' + p.val + '</span></div>'
    ).join("");

    return '' +
      '<div class="kpi-grid">' + kpiHTML + '</div>' +

      '<div class="dash-row dash-2">' +
        '<div class="card">' +
          '<div class="card-head"><h3>Haftalik daromad va harajat</h3><div class="grow"></div></div>' +
          '<div class="legend"><span><i style="background:#22c55e"></i>Daromad</span><span><i style="background:#ef4444"></i>Harajat</span></div>' +
          '<div class="chart-wrap">' + barChart() + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><h3>To\'lov usullari</h3></div>' +
          '<div class="donut-wrap">' + donutChart() + '<div class="donut-legend">' + donutLegend + '</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="dash-row dash-2">' +
        '<div class="card">' +
          '<div class="card-head"><h3>Sof foyda tendensiyasi</h3></div>' +
          '<div class="chart-wrap">' + lineChart() + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><h3>Eng ko\'p sotilgan mahsulotlar</h3></div>' +
          '<div class="top-list">' + topHTML + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head"><h3>So\'nggi buyurtmalar</h3><div class="grow"></div><a class="muted" style="font-size:13px" data-go="orders">Barchasi →</a></div>' +
        '<div class="table-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Sana</th><th>Summa</th><th>Holat</th></tr></thead><tbody>' + ordersHTML + '</tbody></table></div>' +
      '</div>';
  }

  function kpiCard(id, emoji, label, val, up, bg, color, sparkData) {
    const dir = up >= 0 ? "up" : "down";
    const sign = up >= 0 ? "+" : "";
    const arrow = up >= 0 ? "▲" : "▼";
    return '<div class="kpi">' +
      '<div class="kic" style="background:' + bg + ';color:' + color + '">' + emoji + '</div>' +
      '<div class="klabel">' + label + '</div>' +
      '<div class="kval">' + val + '</div>' +
      '<div class="ktrend ' + dir + '">' + arrow + ' ' + sign + up + '% <span style="font-weight:500;opacity:.7">kechagi</span></div>' +
      spark(sparkData, color) +
    '</div>';
  }

  // --- MAHSULOTLAR ---
  function viewProducts() {
    const cats = [{ id: "all", name: "Barchasi", icon: "🛒" }].concat(categories.filter((c) => c.id !== "all"));
    const chips = cats.map((c) =>
      '<button class="chip' + (prodFilter === c.id ? " is-active" : "") + '" data-pfilter="' + c.id + '">' + c.icon + ' ' + c.name + '</button>'
    ).join("");

    const list = prodFilter === "all" ? products : products.filter((p) => p.category === prodFilter);
    const rows = list.length ? list.map((p) => {
      const cat = categories.find((c) => c.id === p.category);
      const lowStock = p.stock <= 10;
      return '<tr>' +
        '<td><div class="cell-prod"><span class="emo">' + (p.image ? '<img src="' + p.image + '" alt=""/>' : p.emoji) + '</span><b>' + p.name + '</b></div></td>' +
        '<td class="muted">' + (cat ? cat.icon + " " + cat.name : p.category) + '</td>' +
        '<td class="num">' + sum(p.price) + '</td>' +
        '<td><span class="' + (lowStock ? "" : "") + '" style="font-weight:700;color:' + (lowStock ? "var(--red)" : "var(--text)") + '">' + p.stock + ' ta</span></td>' +
        '<td class="num">' + p.sold + '</td>' +
        '<td><div class="act-btns">' +
          '<button class="iact ok" data-edit="' + p.id + '" title="Tahrirlash">' + ICON.edit + '</button>' +
          '<button class="iact danger" data-del="' + p.id + '" title="O\'chirish">' + ICON.trash + '</button>' +
        '</div></td>' +
      '</tr>';
    }).join("") : '<tr><td colspan="6"><div class="empty"><div class="e-emo">📦</div><h4>Mahsulot topilmadi</h4></div></td></tr>';

    return '' +
      '<div class="sec-head">' +
        '<div class="chips">' + chips + '</div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--ghost" id="addCatBtn">' + ICON.plus + ' Kategoriya</button>' +
        '<button class="btn btn--primary" id="addProdBtn">' + ICON.plus + ' Mahsulot qo\'shish</button>' +
      '</div>' +
      '<div class="card"><div class="table-wrap"><table class="tbl">' +
        '<thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Zaxira</th><th>Sotildi</th><th>Amallar</th></tr></thead>' +
        '<tbody id="prodTbody">' + rows + '</tbody>' +
      '</table></div></div>';
  }

  // Mahsulot qo'shish / tahrirlash modali
  function productModal(editId) {
    const p = editId ? products.find((x) => x.id === editId) : null;
    modalImage = p ? (p.image || null) : null;
    const catOpts = categories.filter((c) => c.id !== "all").map((c) =>
      '<option value="' + c.id + '"' + (p && p.category === c.id ? " selected" : "") + '>' + c.icon + " " + c.name + '</option>'
    ).join("");
    const prevInner = modalImage ? '<img src="' + modalImage + '" alt=""/>' : (p ? p.emoji : "📷");

    openModal(
      '<div class="modal-head"><h3>' + (p ? "Mahsulotni tahrirlash" : "Yangi mahsulot") + '</h3><button class="modal-x" data-mclose>' + ICON.close + '</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
        '<div class="field span2"><label>Mahsulot rasmi</label>' +
          '<label class="img-up">' +
            '<input type="file" id="f_img" accept="image/*" hidden/>' +
            '<span class="img-preview" id="imgPrev">' + prevInner + '</span>' +
            '<span class="img-up-text"><b>Rasm yuklash</b><small>JPG yoki PNG · bosing</small></span>' +
            '<span class="img-up-btn">' + ICON.plus + '</span>' +
          '</label>' +
        '</div>' +
        '<div class="field span2"><label>Nomi</label><input class="input" id="f_name" value="' + (p ? p.name : "") + '" placeholder="Masalan: Qizil olma"/></div>' +
        '<div class="field"><label>Kategoriya</label><select class="input" id="f_cat">' + catOpts + '</select></div>' +
        '<div class="field"><label>Emoji (rasm bo\'lmasa)</label><input class="input" id="f_emoji" value="' + (p ? p.emoji : "🍎") + '" placeholder="🍎"/></div>' +
        '<div class="field"><label>Narx (so\'m)</label><input class="input" id="f_price" type="number" value="' + (p ? p.price : "") + '" placeholder="18000"/></div>' +
        '<div class="field"><label>Eski narx (ixtiyoriy)</label><input class="input" id="f_old" type="number" value="' + (p && p.oldPrice ? p.oldPrice : "") + '" placeholder="24000"/></div>' +
        '<div class="field"><label>Birlik</label><input class="input" id="f_unit" value="' + (p ? p.unit : "1 kg") + '" placeholder="1 kg"/></div>' +
        '<div class="field"><label>Zaxira (ta)</label><input class="input" id="f_stock" type="number" value="' + (p ? p.stock : 50) + '" placeholder="50"/></div>' +
        '<div class="field span2"><label>Yaroqlilik muddati</label><input class="input" id="f_expiry" value="' + (p && p.expiry ? p.expiry : "") + '" placeholder="kk.oo.yyyy (masalan 31.12.2026)"/></div>' +
      '</div></div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn--ghost" data-mclose>Bekor qilish</button>' +
        '<button class="btn btn--primary" id="saveProd" data-edit="' + (editId || "") + '">Saqlash</button>' +
      '</div>'
    );

    // Rasm yuklash (FileReader -> data-URL)
    const fileInp = $("#f_img");
    if (fileInp) fileInp.addEventListener("change", function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast("Rasm hajmi 2MB dan kichik bo'lsin", "err"); return; }
      const reader = new FileReader();
      reader.onload = function () {
        modalImage = reader.result;
        const prev = el("imgPrev");
        if (prev) prev.innerHTML = '<img src="' + modalImage + '" alt=""/>';
      };
      reader.readAsDataURL(file);
    });
  }

  // Yangi mahsulot uchun standart yaroqlilik sanasi (kategoriya bo'yicha)
  function defaultExpiry(cat) {
    const days = window.DATA && window.DATA.shelfOf ? window.DATA.shelfOf(cat) : 30;
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days);
    const p2 = (n) => String(n).padStart(2, "0");
    return p2(d.getDate()) + "." + p2(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function saveProduct(editId) {
    const name = $("#f_name").value.trim();
    const cat = $("#f_cat").value;
    const emoji = $("#f_emoji").value.trim() || "🛒";
    const price = parseInt($("#f_price").value, 10);
    const old = parseInt($("#f_old").value, 10);
    const unit = $("#f_unit").value.trim() || "1 dona";
    const stock = parseInt($("#f_stock").value, 10);
    const expiry = $("#f_expiry").value.trim();
    const image = modalImage || null;

    if (!name) { toast("Mahsulot nomini kiriting", "err"); return; }
    if (!price || price <= 0) { toast("To'g'ri narx kiriting", "err"); return; }

    const grad = window.DATA && window.DATA.gradOf ? window.DATA.gradOf(cat) : ["#22c55e", "#16a34a"];

    if (editId) {
      const p = products.find((x) => x.id === editId);
      Object.assign(p, { name, category: cat, emoji, price, oldPrice: old || null, unit, stock: stock || 0, grad, image, expiry: expiry || p.expiry });
      toast("Mahsulot yangilandi", "ok");
    } else {
      products.push({
        id: nextProductId++, name, category: cat, emoji, price,
        oldPrice: old || null, unit, stock: stock || 0, sold: 0,
        rating: 4.5, popular: false, grad, image,
        expiry: expiry || defaultExpiry(cat),
        desc: "Yangi va sifatli " + name.toLowerCase() + ".",
      });
      toast("Mahsulot qo'shildi", "ok");
    }
    saveCatalog();
    closeModal();
    render(); // jadvalni yangilash
  }

  function deleteProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    openModal(
      '<div class="modal-head"><h3>O\'chirishni tasdiqlang</h3><button class="modal-x" data-mclose>' + ICON.close + '</button></div>' +
      '<div class="modal-body"><p style="color:var(--text-2);line-height:1.6">"<b>' + p.emoji + " " + p.name + '</b>" mahsulotini ro\'yxatdan o\'chirmoqchimisiz? Bu amalni qaytarib bo\'lmaydi.</p></div>' +
      '<div class="modal-foot"><button class="btn btn--ghost" data-mclose>Bekor qilish</button><button class="btn btn--danger" id="confirmDel" data-id="' + id + '">O\'chirish</button></div>'
    );
  }

  // --- KATEGORIYA QO'SHISH ---
  function categoryModal() {
    openModal(
      '<div class="modal-head"><h3>Yangi kategoriya</h3><button class="modal-x" data-mclose>' + ICON.close + '</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
        '<div class="field"><label>Emoji belgisi</label><input class="input" id="c_icon" value="🍏" placeholder="🍏"/></div>' +
        '<div class="field"><label>Nomi</label><input class="input" id="c_name" placeholder="Masalan: Muzqaymoq"/></div>' +
      '</div></div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn--ghost" data-mclose>Bekor qilish</button>' +
        '<button class="btn btn--primary" id="saveCat">Saqlash</button>' +
      '</div>'
    );
  }

  function saveCategory() {
    const name = $("#c_name").value.trim();
    const icon = $("#c_icon").value.trim() || "🛒";
    if (!name) { toast("Kategoriya nomini kiriting", "err"); return; }
    // Takrorlanmas id
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const id = "cat_" + (slug || "yangi") + "_" + (categories.length + 1);
    categories.push({ id: id, name: name, icon: icon, grad: ["#22c55e", "#16a34a"] });
    saveCatalog();
    closeModal();
    prodFilter = id;           // yangi kategoriyani darhol ko'rsatamiz
    toast("Kategoriya qo'shildi", "ok");
    render();
  }

  // --- BUYURTMALAR ---
  function viewOrders() {
    const filters = [["all", "Barchasi"], ["pending", "Kutilmoqda"], ["ontheway", "Yo'lda"], ["done", "Yetkazildi"], ["cancel", "Bekor"]];
    const chips = filters.map(([id, lbl]) =>
      '<button class="chip' + (orderFilter === id ? " is-active" : "") + '" data-ofilter="' + id + '">' + lbl + '</button>'
    ).join("");

    const list = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);
    const rows = list.length ? list.map((o, i) => {
      const count = o.items.reduce((s, it) => s + it.qty, 0);
      const cust = ORDER_CUSTOMERS[i % ORDER_CUSTOMERS.length];
      const payName = (window.DATA.paymentMethods.find((m) => m.id === o.payment) || {}).name || o.payment;
      return '<tr>' +
        '<td><b>' + o.id + '</b></td>' +
        '<td>' + cust + '</td>' +
        '<td class="muted">' + o.date + '</td>' +
        '<td class="num">' + count + ' ta</td>' +
        '<td class="num">' + sum(o.total) + '</td>' +
        '<td class="muted">' + payName + '</td>' +
        '<td><select class="status-sel" data-ostatus="' + o.id + '">' +
          ["pending", "ontheway", "done", "cancel"].map((s) => '<option value="' + s + '"' + (o.status === s ? " selected" : "") + '>' + STATUS_LABEL[s] + '</option>').join("") +
        '</select></td>' +
      '</tr>';
    }).join("") : '<tr><td colspan="7"><div class="empty"><div class="e-emo">🧾</div><h4>Buyurtma topilmadi</h4></div></td></tr>';

    return '' +
      '<div class="sec-head"><div class="chips">' + chips + '</div></div>' +
      '<div class="card"><div class="table-wrap"><table class="tbl">' +
        '<thead><tr><th>ID</th><th>Mijoz</th><th>Sana</th><th>Mahsulot</th><th>Summa</th><th>To\'lov</th><th>Holat</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div></div>';
  }

  // --- FOYDALANUVCHILAR ---
  function viewUsers() {
    const rows = USERS.map((u) =>
      '<tr>' +
        '<td><div class="cell-prod"><span class="u-av">' + u.av + '</span><b>' + u.name + '</b></div></td>' +
        '<td class="muted">' + u.phone + '</td>' +
        '<td class="num">' + u.orders + '</td>' +
        '<td class="num">' + sum(u.spent) + '</td>' +
        '<td class="muted">' + u.joined + '</td>' +
        '<td><span class="pill ' + u.status + '"><span class="pdot"></span>' + (u.status === "faol" ? "Faol" : "Bloklangan") + '</span></td>' +
      '</tr>'
    ).join("");
    return '' +
      '<div class="sec-head"><h2>Jami ' + USERS.length + ' ta foydalanuvchi</h2></div>' +
      '<div class="card"><div class="table-wrap"><table class="tbl">' +
        '<thead><tr><th>Foydalanuvchi</th><th>Telefon</th><th>Buyurtmalar</th><th>Jami sarflagan</th><th>Ro\'yxatdan o\'tgan</th><th>Holat</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div></div>';
  }

  // --- HABARLAR ---
  function viewMessages() {
    const list = CHATS.map((c) =>
      '<div class="chat-li' + (c.id === activeChat ? " is-active" : "") + '" data-chat="' + c.id + '">' +
        '<span class="u-av">' + c.av + '</span>' +
        '<div class="cl-mid">' +
          '<div class="cl-name">' + c.name + '<small>' + c.time + '</small></div>' +
          '<div class="cl-last">' + c.msgs[c.msgs.length - 1].t + '</div>' +
        '</div>' +
        (c.unread ? '<span class="unread">' + c.unread + '</span>' : "") +
      '</div>'
    ).join("");

    const chat = CHATS.find((c) => c.id === activeChat);
    const bubbles = chat ? chat.msgs.map((m) =>
      '<div class="bubble ' + (m.me ? "me" : "them") + '">' + m.t + '<small>' + m.time + '</small></div>'
    ).join("") : '<div class="conv-empty">Suhbatni tanlang</div>';

    const conv = chat ?
      '<div class="conv-head">' +
        '<button class="back-chat" id="chatBack">' + ICON.back + '</button>' +
        '<span class="u-av">' + chat.av + '</span>' +
        '<div><div class="ch-name">' + chat.name + '</div><div class="ch-stat">Onlayn</div></div>' +
      '</div>' +
      '<div class="conv-body" id="convBody">' + bubbles + '</div>' +
      '<div class="conv-foot">' +
        '<input id="chatInput" placeholder="Javob yozing..." autocomplete="off"/>' +
        '<button class="send-btn" id="chatSend">' + ICON.send + '</button>' +
      '</div>'
      : '<div class="conv-empty">Suhbatni tanlang</div>';

    return '<div class="chat-layout" id="chatLayout">' +
      '<div class="chat-list">' + list + '</div>' +
      '<div class="chat-conv">' + conv + '</div>' +
    '</div>';
  }

  // --- SOZLAMALAR ---
  function viewSettings() {
    const isDark = (document.documentElement.getAttribute("data-theme") || "dark") === "dark";
    const payRows = window.DATA.paymentMethods.map((m) => {
      const on = SETTINGS.pay[m.id];
      return '<div class="set-row">' +
        '<span class="sr-ic">' + (m.logo || "💳") + '</span>' +
        '<div class="sr-text"><div class="sr-title">' + m.name + '</div><div class="sr-sub">' + m.sub + '</div></div>' +
        '<button class="toggle' + (on ? " on" : "") + '" data-pay="' + m.id + '"></button>' +
      '</div>';
    }).join("");

    return '<div class="dash-row dash-2b">' +
      '<div class="card"><div class="card-head"><h3>Do\'kon ma\'lumotlari</h3></div><div class="card-pad">' +
        '<div class="form-grid">' +
          '<div class="field span2"><label>Do\'kon nomi</label><input class="input" id="s_name" value="' + SETTINGS.shopName + '"/></div>' +
          '<div class="field"><label>Telefon</label><input class="input" id="s_phone" value="' + SETTINGS.phone + '"/></div>' +
          '<div class="field"><label>Ish vaqti</label><input class="input" id="s_hours" value="' + SETTINGS.hours + '"/></div>' +
          '<div class="field span2"><label>Manzil</label><input class="input" id="s_addr" value="' + SETTINGS.address + '"/></div>' +
          '<div class="field"><label>Yetkazib berish (so\'m)</label><input class="input" id="s_del" type="number" value="' + SETTINGS.delivery + '"/></div>' +
          '<div class="field"><label>Bepul chegarasi (so\'m)</label><input class="input" id="s_free" type="number" value="' + SETTINGS.freeFrom + '"/></div>' +
          '<div class="field span2"><label>Minimal buyurtma (so\'m)</label><input class="input" id="s_min" type="number" value="' + SETTINGS.minOrder + '"/></div>' +
        '</div>' +
        '<button class="btn btn--primary btn--block" id="saveSettings" style="margin-top:16px">Saqlash</button>' +
      '</div></div>' +

      '<div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>To\'lov usullari</h3></div><div class="card-pad" style="padding-top:4px;padding-bottom:6px">' + payRows + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Ko\'rinish</h3></div><div class="card-pad">' +
          '<div class="set-row" style="border:none;padding-top:4px">' +
            '<span class="sr-ic">' + (isDark ? "🌙" : "☀️") + '</span>' +
            '<div class="sr-text"><div class="sr-title">Tungi rejim</div><div class="sr-sub">Qorong\'i mavzu yoqilgan</div></div>' +
            '<button class="toggle' + (isDark ? " on" : "") + '" id="themeToggle"></button>' +
          '</div>' +
        '</div></div>' +
      '</div>' +
    '</div>';
  }

  /* ----------------------------------------------------------
     7b) Telegram bot bo'limi
     ---------------------------------------------------------- */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

  function viewBot() {
    const cfg = botLocal();
    const st = botStatus || {};
    const connected = (st.connected != null) ? st.connected : !!cfg.connected;
    const username = st.username || cfg.username || "";
    const channel = st.channel || cfg.channel || "";
    const userCount = (st.userCount != null) ? st.userCount : (cfg.userCount || 0);
    const sentCount = (st.sentCount != null) ? st.sentCount : (cfg.sentCount || 0);
    const tokenVal = cfg.token || "";

    return '<div class="bot-wrap">' +

      '<div class="bot-topbar">' +
        '<div class="bot-status ' + (connected ? "on" : "off") + '" id="botStatusPill">' +
          '<span class="bdot"></span><span id="botStatusText">' + (connected ? "Ulangan" : "Ulanmagan") + '</span>' +
        '</div>' +
        '<div class="bot-stats">' +
          '<span class="bot-stat"><span class="bi">' + ICON.users + '</span><b id="botUserCount">' + fmt(userCount) + '</b> obunachi</span>' +
          '<span class="bot-stat"><span class="bi">' + ICON.send + '</span><b id="botSentCount">' + fmt(sentCount) + '</b> yuborilgan</span>' +
        '</div>' +
      '</div>' +

      '<div class="bot-grid">' +

        '<div class="card"><div class="card-head"><h3>1. Botni ulash</h3></div><div class="card-pad">' +
          '<div class="field"><label>Bot tokeni</label>' +
            '<div class="bot-token">' +
              '<input class="input" id="botToken" type="password" placeholder="123456789:AAE-..." value="' + esc(tokenVal) + '"/>' +
              '<button class="bot-eye" id="botEye" type="button" aria-label="Ko\'rsatish">' + ICON.search + '</button>' +
            '</div>' +
            '<p class="bot-hint">@BotFather → /newbot → tokenni nusxalab joylang</p>' +
          '</div>' +
          '<div class="bot-actions">' +
            '<button class="btn btn--primary" id="botConnect">' + ICON.send + ' Botni ulash</button>' +
            '<button class="btn btn--danger" id="botDisconnect">' + ICON.power + ' Uzish</button>' +
          '</div>' +
          (connected && username ?
            '<div class="bot-connected">' +
              '<span class="bot-av">✈️</span>' +
              '<div class="bot-meta"><div class="bot-name">' + esc(username) + '</div><div class="bot-sub">Faol — buyurtmalarni yuboradi</div></div>' +
              '<a class="btn btn--ghost" id="botOpen" target="_blank" rel="noopener" href="https://t.me/' + esc(username.replace(/^@/, "")) + '">Ochish</a>' +
            '</div>' : '') +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>2. Buyurtma kanali</h3></div><div class="card-pad">' +
          '<div class="field"><label>Kanal username yoki ID</label>' +
            '<input class="input" id="botChannel" placeholder="@kanal_nomi" value="' + esc(channel) + '"/>' +
            '<p class="bot-hint">Botni kanalga admin qiling, so\'ng shu yerga username yozing</p>' +
          '</div>' +
          '<div class="bot-actions">' +
            '<button class="btn btn--primary" id="botSetChannel">' + ICON.link + ' Kanalni ulash</button>' +
            '<button class="btn btn--ghost" id="botTestChannel">' + ICON.send + ' Test xabar</button>' +
          '</div>' +
          '<div class="bot-chan-state ' + (channel ? "on" : "") + '" id="botChanState">' + (channel ? "🟢 Ulangan: " + esc(channel) : "⚪ Kanal ulanmagan") + '</div>' +
        '</div></div>' +

      '</div>' +

      '<div class="card"><div class="card-head"><h3>3. Mijozlarga ommaviy xabar</h3></div><div class="card-pad">' +
        '<textarea class="input" id="botBroadcast" rows="3" placeholder="Barcha bot obunachilariga yuboriladigan xabar..."></textarea>' +
        '<button class="btn btn--primary btn--block" id="botBroadcastBtn" style="margin-top:12px">' + ICON.broadcast + ' Hammaga yuborish</button>' +
      '</div></div>' +

      '<div class="card bot-help"><div class="card-pad">' +
        '<h4>Qanday ishlaydi?</h4>' +
        '<ol class="bot-steps">' +
          '<li><b>@BotFather</b> dan <b>/newbot</b> orqali bot yarating va tokenni oling.</li>' +
          '<li>Tokenni yuqoriga joylab <b>Botni ulang</b>.</li>' +
          '<li>Telegram kanal oching, botni kanalga <b>admin</b> qiling.</li>' +
          '<li>Kanal username (masalan <code>@mening_dokonim</code>) ni kiritib <b>Kanalni ulang</b>.</li>' +
          '<li>Endi har bir yangi buyurtma avtomatik kanalga yuboriladi. ✅</li>' +
        '</ol>' +
        '<p class="bot-note">Bot serveri: <code id="botApiUrl">—</code>. Server ishlamasa, sozlamalar saqlanadi va server yoqilganda ishlaydi.</p>' +
      '</div></div>' +

    '</div>';
  }

  /* ----------------------------------------------------------
     7c) QR kod bo'limi — platformaning standart QR tizimi
     ---------------------------------------------------------- */
  function viewQr() {
    return '<div class="qr-wrap">' +

      '<div class="card qr-preview-card"><div class="card-pad">' +
        '<div class="qr-frame" id="qrFrame">' +
          '<img id="qrImage" alt="QR kod"/>' +
          '<div class="qr-loading" id="qrLoading">QR yuklanmoqda…</div>' +
        '</div>' +
        '<div class="qr-store-name" id="qrStoreName">' + esc(SETTINGS.shopName || "Ovqat Dokoni") + '</div>' +
        '<div class="qr-scan-hint">📷 Telefon bilan skaner qiling</div>' +
      '</div></div>' +

      '<div class="card qr-info-card"><div class="card-pad">' +
        '<span class="qr-badge">' + ICON.link + ' VEB-ILOVA QR KODI</span>' +
        '<h3>Mijozlar QR kodni skaner qilib ilovangizni ochadi</h3>' +
        '<p>Telefon kamerasi bilan skaner qilinganda do\'koningizning veb-ilovasi avtomatik ochiladi. QR kodni stol, vitrina, menyu yoki reklama varaqasiga joylashtiring.</p>' +

        '<label class="qr-label">Ilova manzili (URL)</label>' +
        '<div class="qr-url-row">' +
          '<input class="input" type="text" id="qrUrlInput" placeholder="https://mening-domenim.uz"/>' +
          '<button class="btn btn--primary" id="qrSaveBtn">Saqlash</button>' +
        '</div>' +
        '<p class="qr-url-note">Standart manzil — shu ilovaning havolasi. O\'z domeningizni kiriting (masalan <code>https://mening-dokonim.uz</code>) — QR avtomatik yangilanadi.</p>' +

        '<div class="qr-actions">' +
          '<button class="btn btn--ghost" id="qrCopyBtn">' + ICON.copy + ' Nusxalash</button>' +
          '<button class="btn btn--ghost" id="qrDownloadBtn">' + ICON.download + ' Yuklab olish</button>' +
          '<button class="btn btn--ghost" id="qrPrintBtn">' + ICON.print + ' Chop etish</button>' +
          '<button class="btn btn--ghost" id="qrOpenBtn">' + ICON.link + ' Ochish</button>' +
        '</div>' +
      '</div></div>' +
    '</div>' +

      '<div class="qr-steps">' +
        '<div class="qr-step"><span class="qr-step-ic">1️⃣</span><div><strong>QR kodni joylashtiring</strong><p>Stol, vitrina, menyu yoki reklamaga</p></div></div>' +
        '<div class="qr-step"><span class="qr-step-ic">2️⃣</span><div><strong>Mijoz skaner qiladi</strong><p>Telefon kamerasi yoki QR-skaner orqali</p></div></div>' +
        '<div class="qr-step"><span class="qr-step-ic">3️⃣</span><div><strong>Ilova ochiladi</strong><p>Mijoz to\'g\'ridan-to\'g\'ri buyurtma beradi</p></div></div>' +
      '</div>';
  }

  /* ----------------------------------------------------------
     8) Render va navigatsiya
     ---------------------------------------------------------- */
  const VIEWS = {
    dashboard: viewDashboard,
    products: viewProducts,
    orders: viewOrders,
    users: viewUsers,
    messages: viewMessages,
    bot: viewBot,
    qrcode: viewQr,
    settings: viewSettings,
  };

  function render() {
    const meta = NAV.find((n) => n.id === activeSection);
    el("pageTitle").textContent = meta ? meta.title : "";
    el("content").innerHTML = '<div class="section is-active">' + VIEWS[activeSection]() + "</div>";
    bindSectionEvents();
    animateCharts();
  }

  function setSection(id) {
    activeSection = id;
    // Nav holatini yangilash
    document.querySelectorAll("[data-nav]").forEach((n) => n.classList.toggle("is-active", n.dataset.nav === id));
    document.querySelectorAll("[data-tab]").forEach((n) => n.classList.toggle("is-active", n.dataset.tab === id));
    render();
    el("content").scrollIntoView({ block: "start" });
    if (id === "bot") botRefreshStatus();
  }

  // Grafik animatsiyalari (CSS keyframe sinflari)
  function animateCharts() {
    // Bar va line elementlari render bo'lgach animatsiya uchun klass beriladi
    requestAnimationFrame(() => {
      el("content").querySelectorAll(".barEl").forEach((b, i) => {
        b.style.transition = "transform .6s var(--ease)";
        b.style.transform = "scaleY(0)";
        setTimeout(() => { b.style.transform = "scaleY(1)"; }, 30 + i * 25);
      });
      const line = el("content").querySelector(".lineEl");
      if (line) {
        const len = line.getTotalLength();
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        line.style.transition = "stroke-dashoffset 1.1s var(--ease)";
        setTimeout(() => { line.style.strokeDashoffset = "0"; }, 60);
      }
      // Top barlar
      el("content").querySelectorAll(".ti-bar i").forEach((b) => {
        const w = b.style.width; b.style.width = "0";
        setTimeout(() => { b.style.width = w; }, 80);
      });
    });
  }

  /* ----------------------------------------------------------
     9) Hodisalarni ulash
     ---------------------------------------------------------- */
  function bindSectionEvents() {
    const root = el("content");

    // Dashboard ichidagi "Barchasi →" havola
    root.querySelectorAll("[data-go]").forEach((a) => a.addEventListener("click", () => setSection(a.dataset.go)));

    // Mahsulot filtri
    root.querySelectorAll("[data-pfilter]").forEach((c) => c.addEventListener("click", () => { prodFilter = c.dataset.pfilter; render(); }));
    // Buyurtma filtri
    root.querySelectorAll("[data-ofilter]").forEach((c) => c.addEventListener("click", () => { orderFilter = c.dataset.ofilter; render(); }));

    // Mahsulot qo'shish
    const addBtn = el("addProdBtn");
    if (addBtn) addBtn.addEventListener("click", () => productModal(null));
    // Kategoriya qo'shish
    const addCat = el("addCatBtn");
    if (addCat) addCat.addEventListener("click", () => categoryModal());
    // Tahrirlash / o'chirish
    root.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => productModal(parseInt(b.dataset.edit, 10))));
    root.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteProduct(parseInt(b.dataset.del, 10))));

    // Buyurtma status o'zgartirish
    root.querySelectorAll("[data-ostatus]").forEach((s) => s.addEventListener("change", () => {
      const o = orders.find((x) => x.id === s.dataset.ostatus);
      if (o) { o.status = s.value; toast(o.id + " holati yangilandi", "ok"); }
    }));

    // Habarlar
    root.querySelectorAll("[data-chat]").forEach((c) => c.addEventListener("click", () => {
      activeChat = parseInt(c.dataset.chat, 10);
      const ch = CHATS.find((x) => x.id === activeChat);
      if (ch) ch.unread = 0;
      render();
      updateNavBadges();
      const layout = el("chatLayout");
      if (layout) layout.classList.add("show-conv"); // mobil: suhbatga o'tish
    }));
    const chatBack = el("chatBack");
    if (chatBack) chatBack.addEventListener("click", () => el("chatLayout").classList.remove("show-conv"));
    const chatSend = el("chatSend");
    if (chatSend) {
      const send = () => {
        const inp = el("chatInput");
        const txt = inp.value.trim();
        if (!txt) return;
        const ch = CHATS.find((x) => x.id === activeChat);
        ch.msgs.push({ me: true, t: txt, time: "Hozir" });
        ch.time = "Hozir";
        render();
        el("chatLayout").classList.add("show-conv");
        const body = el("convBody");
        if (body) body.scrollTop = body.scrollHeight;
        el("chatInput").focus();
      };
      chatSend.addEventListener("click", send);
      el("chatInput").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    }

    // Sozlamalar
    const saveS = el("saveSettings");
    if (saveS) saveS.addEventListener("click", () => {
      SETTINGS.shopName = el("s_name").value;
      SETTINGS.phone = el("s_phone").value;
      SETTINGS.hours = el("s_hours").value;
      SETTINGS.address = el("s_addr").value;
      SETTINGS.delivery = parseInt(el("s_del").value, 10) || 0;
      SETTINGS.freeFrom = parseInt(el("s_free").value, 10) || 0;
      SETTINGS.minOrder = parseInt(el("s_min").value, 10) || 0;
      toast("Sozlamalar saqlandi", "ok");
    });
    root.querySelectorAll("[data-pay]").forEach((t) => t.addEventListener("click", () => {
      const id = t.dataset.pay;
      SETTINGS.pay[id] = !SETTINGS.pay[id];
      t.classList.toggle("on", SETTINGS.pay[id]);
      toast((window.DATA.paymentMethods.find((m) => m.id === id) || {}).name + (SETTINGS.pay[id] ? " yoqildi" : " o'chirildi"), "info");
    }));
    const themeToggle = el("themeToggle");
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

    /* --- Telegram bot bo'limi --- */
    if (el("botConnect")) {
      const apiEl = el("botApiUrl");
      if (apiEl && window.Telegram) apiEl.textContent = Telegram.API_URL;

      const eye = el("botEye");
      if (eye) eye.addEventListener("click", () => {
        const inp = el("botToken");
        botTokenShown = !botTokenShown;
        inp.type = botTokenShown ? "text" : "password";
      });

      el("botConnect").addEventListener("click", async () => {
        const btn = el("botConnect");
        const token = (el("botToken").value || "").trim();
        if (!/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token)) { toast("Token formati noto'g'ri", "err"); return; }
        botSave({ token: token });
        if (!window.Telegram) { toast("Telegram klienti yuklanmadi", "err"); return; }
        btn.disabled = true;
        const old = btn.innerHTML; btn.innerHTML = "Ulanmoqda…";
        try {
          const r = await Telegram.connect({ token: token, shopName: SETTINGS.shopName, storeUrl: qrStoreUrl() });
          botSave({ connected: true, username: r.username });
          toast("Bot ulandi" + (r.username ? ": " + r.username : ""), "ok");
        } catch (e) {
          toast(botErr(e), "err");
        } finally {
          btn.disabled = false; btn.innerHTML = old;
        }
        await botRefreshStatus();
      });

      const disc = el("botDisconnect");
      if (disc) disc.addEventListener("click", async () => {
        if (window.Telegram) await Telegram.disconnect();
        botSave({ connected: false, username: "", channel: "" });
        toast("Bot uzildi", "info");
        await botRefreshStatus();
      });

      const setCh = el("botSetChannel");
      if (setCh) setCh.addEventListener("click", async () => {
        const ch = (el("botChannel").value || "").trim();
        if (!ch) { toast("Kanal username kiriting", "err"); return; }
        if (!window.Telegram) { toast("Telegram klienti yuklanmadi", "err"); return; }
        try { await Telegram.setChannel(ch); botSave({ channel: ch }); toast("Kanal ulandi: " + ch, "ok"); }
        catch (e) { toast(botErr(e), "err"); }
        await botRefreshStatus();
      });

      const testCh = el("botTestChannel");
      if (testCh) testCh.addEventListener("click", async () => {
        if (!window.Telegram) { toast("Telegram klienti yuklanmadi", "err"); return; }
        const order = {
          id: "TEST-" + Math.floor(1000 + Math.random() * 9000),
          userName: "Test mijoz", phone: "+998 90 000 00 00", address: "Test manzil",
          items: [{ name: "Test mahsulot", qty: 1, price: 10000 }], total: 10000,
        };
        const r = await Telegram.sendOrder(order);
        if (r && r.ok) toast("Test xabar kanalga yuborildi", "ok");
        else toast(botErr({ message: (r && r.error) || "Yuborilmadi" }), "err");
      });

      const bc = el("botBroadcastBtn");
      if (bc) bc.addEventListener("click", async () => {
        const text = (el("botBroadcast").value || "").trim();
        if (!text) { toast("Xabar matnini kiriting", "err"); return; }
        if (!window.Telegram) { toast("Telegram klienti yuklanmadi", "err"); return; }
        try {
          const r = await Telegram.broadcast(text);
          toast("Yuborildi: " + (r.sent || 0) + "/" + (r.total || 0), "ok");
          el("botBroadcast").value = "";
        } catch (e) { toast(botErr(e), "err"); }
      });
    }

    /* --- QR kod bo'limi (platformaning standart tizimi) --- */
    if (el("qrSaveBtn")) {
      el("qrSaveBtn").addEventListener("click", () => {
        let v = (el("qrUrlInput").value || "").trim();
        if (!v) { toast("URL kiriting", "err"); return; }
        if (!/^https?:\/\//i.test(v) && !/^file:/i.test(v)) v = "https://" + v.replace(/^\/+/, "");
        try { localStorage.setItem(qrStoreUrlKey(), v); } catch (e) {}
        toast("QR kod yangilandi", "ok");
        renderQrImg();
      });
      el("qrCopyBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(qrStoreUrl())
          .then(() => toast("Havola nusxalandi", "ok"))
          .catch(() => toast("Nusxalab bo'lmadi", "err"));
      });
      el("qrOpenBtn").addEventListener("click", () => window.open(qrStoreUrl(), "_blank"));
      el("qrDownloadBtn").addEventListener("click", async () => {
        try {
          const res = await fetch(qrApiSrc(qrStoreUrl(), 600));
          const blob = await res.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob); a.download = "qr-kod.png";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 3000);
          toast("QR kod yuklab olindi", "ok");
        } catch (e) { window.open(qrApiSrc(qrStoreUrl(), 600), "_blank"); }
      });
      el("qrPrintBtn").addEventListener("click", () => {
        const url = qrStoreUrl();
        const w = window.open("", "_blank", "width=480,height=680");
        if (!w) { toast("Chop etish oynasi bloklandi", "err"); return; }
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>QR Kod</title></head>' +
          '<body style="font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#0f172a">' +
          '<h2 style="margin:0 0 4px">' + esc(qrShopName()) + '</h2>' +
          '<p style="margin:0 0 18px;color:#64748b">Veb-ilovamizni oching</p>' +
          '<img src="' + qrApiSrc(url, 400) + '" style="width:320px;height:320px"/>' +
          '<p style="margin-top:18px;font-size:18px">📷 Telefon kamerasi bilan skaner qiling</p>' +
          '<p style="color:#64748b;word-break:break-all;font-size:12px">' + esc(url) + '</p>' +
          '</body></html>');
        w.document.close();
        setTimeout(() => { try { w.focus(); w.print(); } catch (er) {} }, 700);
      });
      renderQrImg();
    }
  }

  // Modal ichidagi hodisalar (delegatsiya)
  el("modal").addEventListener("click", (e) => {
    if (e.target.closest("[data-mclose]")) { closeModal(); return; }
    const save = e.target.closest("#saveProd");
    if (save) { const id = save.dataset.edit ? parseInt(save.dataset.edit, 10) : null; saveProduct(id); return; }
    const sc = e.target.closest("#saveCat");
    if (sc) { saveCategory(); return; }
    const del = e.target.closest("#confirmDel");
    if (del) {
      const id = parseInt(del.dataset.id, 10);
      const p = products.find((x) => x.id === id);
      const idx = products.indexOf(p);
      if (idx > -1) products.splice(idx, 1);
      saveCatalog();
      closeModal();
      toast("Mahsulot o'chirildi", "ok");
      render();
    }
  });

  /* ----------------------------------------------------------
     10) Mavzu (theme) — localStorage
     ---------------------------------------------------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("admin-theme", t); } catch (e) {}
    el("themeBtn").innerHTML = t === "dark" ? ICON.moon : ICON.sun;
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    if (activeSection === "settings") render(); // toggle holatini yangilash
  }

  /* ----------------------------------------------------------
     11) Skelet (sidebar / tabbar / topbar)
     ---------------------------------------------------------- */
  function buildNav() {
    el("nav").innerHTML = NAV.map((n) => {
      const badge = n.badge && n.badge() ? '<span class="badge">' + n.badge() + "</span>" : "";
      return '<a class="nav-item' + (n.id === activeSection ? " is-active" : "") + '" data-nav="' + n.id + '">' +
        '<span class="nic">' + ICON[n.icon] + '</span>' + n.label + badge + '</a>';
    }).join("");
    el("nav").querySelectorAll("[data-nav]").forEach((a) => a.addEventListener("click", () => setSection(a.dataset.nav)));

    // Mobil tab-bar
    el("tabbar").innerHTML = TABS.map((id) => {
      const n = NAV.find((x) => x.id === id);
      const badge = n.badge && n.badge() ? '<span class="badge">' + n.badge() + "</span>" : "";
      return '<a class="mt-item' + (id === activeSection ? " is-active" : "") + '" data-tab="' + id + '">' +
        ICON[n.icon] + badge + '<span>' + n.label + '</span></a>';
    }).join("");
    el("tabbar").querySelectorAll("[data-tab]").forEach((a) => a.addEventListener("click", () => setSection(a.dataset.tab)));
  }

  function updateNavBadges() {
    // Habarlar badge'ini qayta hisoblash
    buildNav();
  }

  function initTopbar() {
    el("searchIco").innerHTML = ICON.search;
    el("calIco").innerHTML = ICON.cal;
    el("bellBtn").insertAdjacentHTML("afterbegin", ICON.bell);
    el("burger").innerHTML = ICON.menu;
    el("themeBtn").addEventListener("click", toggleTheme);
    el("bellBtn").addEventListener("click", () => toast("Yangi bildirishnoma yo'q", "info"));
    el("burger").addEventListener("click", () => {
      // Mobil: tab-bar allaqachon ko'rinadi; burger oddiy menyu — bo'limlarni ko'rsatamiz
      toast("Bo'limlar pastdagi menyuda", "info");
    });

    // Global qidiruv — mahsulot bo'yicha
    el("globalSearch").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;
      if (activeSection !== "products") { activeSection = "products"; }
      prodFilter = "all";
      setSection("products");
      // Jadvalni filtrlash
      const tb = el("prodTbody");
      if (!tb) return;
      const matched = products.filter((p) => p.name.toLowerCase().includes(q));
      tb.innerHTML = matched.length ? matched.map((p) => {
        const cat = categories.find((c) => c.id === p.category);
        return '<tr><td><div class="cell-prod"><span class="emo">' + (p.image ? '<img src="' + p.image + '" alt=""/>' : p.emoji) + '</span><b>' + p.name + '</b></div></td>' +
          '<td class="muted">' + (cat ? cat.icon + " " + cat.name : p.category) + '</td>' +
          '<td class="num">' + sum(p.price) + '</td><td style="font-weight:700">' + p.stock + ' ta</td>' +
          '<td class="num">' + p.sold + '</td>' +
          '<td><div class="act-btns"><button class="iact ok" data-edit="' + p.id + '">' + ICON.edit + '</button>' +
          '<button class="iact danger" data-del="' + p.id + '">' + ICON.trash + '</button></div></td></tr>';
      }).join("") : '<tr><td colspan="6"><div class="empty"><div class="e-emo">🔍</div><h4>Hech narsa topilmadi</h4></div></td></tr>';
      tb.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => productModal(parseInt(b.dataset.edit, 10))));
      tb.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteProduct(parseInt(b.dataset.del, 10))));
    });
  }

  /* ----------------------------------------------------------
     11b) Telegram bot — server bilan ishlash
     ---------------------------------------------------------- */
  function botErr(e) {
    const m = (e && e.message) ? e.message : String(e || "Xatolik");
    if (/Failed to fetch|NetworkError|load failed|Load failed/i.test(m)) {
      return "Bot serveri topilmadi (" + (window.Telegram ? Telegram.API_URL : "") + ") — serverni ishga tushiring";
    }
    return m;
  }

  async function botRefreshStatus() {
    if (!window.Telegram) { botStatus = null; if (activeSection === "bot") render(); return; }
    const txt = el("botStatusText");
    if (txt) txt.textContent = "Tekshirilmoqda…";
    const st = await Telegram.status();
    botStatus = (st && st.ok) ? st : null;
    if (st && st.ok) {
      botSave({ connected: st.connected, username: st.username, channel: st.channel, userCount: st.userCount, sentCount: st.sentCount });
    }
    if (activeSection === "bot") render();
  }

  /* ----------------------------------------------------------
     11c) QR kod — platformaning standart tizimi (api.qrserver.com)
     ---------------------------------------------------------- */
  // Joriy mijoz (do'kon) id'si — QR aynan shu do'kon storefront'iga olib borishi uchun
  function qrClientId() {
    if (window.DATA && DATA.clientId) return DATA.clientId;
    try {
      const q = new URLSearchParams(location.search).get("client");
      if (q) return q;
      const s = JSON.parse(localStorage.getItem("bo_session") || "{}");
      if (s && s.clientId) return s.clientId;
    } catch (e) {}
    return "demo";
  }
  function qrStoreUrlKey() { return "ovqat_store_url__" + qrClientId(); }
  function qrStoreUrl() {
    try {
      const saved = localStorage.getItem(qrStoreUrlKey());
      if (saved) return saved;
      // Standart: shu do'kon storefront'i + mijoz konteksti (?client=...)
      const u = new URL("../index.html", location.href);
      const cid = qrClientId();
      if (cid) u.searchParams.set("client", cid);
      return u.href;
    } catch (e) { return "../index.html"; }
  }
  function qrApiSrc(url, size) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size +
      "&margin=10&qzone=1&data=" + encodeURIComponent(url);
  }
  function qrShopName() { return SETTINGS.shopName || "Ovqat Dokoni"; }

  function renderQrImg() {
    const url = qrStoreUrl();
    const input = el("qrUrlInput"); if (input) input.value = url;
    const sn = el("qrStoreName"); if (sn) sn.textContent = qrShopName();
    const img = el("qrImage");
    const loading = el("qrLoading");
    if (img) {
      if (loading) { loading.style.display = "block"; loading.textContent = "QR yuklanmoqda…"; }
      img.style.display = "none";
      img.onload = () => { img.style.display = "block"; if (loading) loading.style.display = "none"; };
      img.onerror = () => { if (loading) loading.textContent = "⚠️ QR yuklanmadi (internet kerak)"; };
      img.src = qrApiSrc(url, 320);
    }
  }

  /* ----------------------------------------------------------
     12) Ishga tushirish
     ---------------------------------------------------------- */
  function init() {
    // Mavzuni tiklash
    let saved = "dark";
    try { saved = localStorage.getItem("admin-theme") || "dark"; } catch (e) {}
    applyTheme(saved);

    initTopbar();
    buildNav();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
