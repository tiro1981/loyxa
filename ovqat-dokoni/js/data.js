/* ============================================================
   OVQAT DOKONI — Mock ma'lumotlar
   ============================================================ */
window.DATA = (function () {

  const categories = [
    { id: "all",      name: "Barchasi",   icon: "🛒", grad: ["#22c55e", "#16a34a"] },
    { id: "meva",     name: "Mevalar",    icon: "🍎", grad: ["#f97316", "#ef4444"] },
    { id: "sabzavot", name: "Sabzavotlar",icon: "🥬", grad: ["#22c55e", "#15803d"] },
    { id: "sut",      name: "Sut mahsul.",icon: "🥛", grad: ["#3b82f6", "#2563eb"] },
    { id: "non",      name: "Non & shirin",icon: "🍞", grad: ["#f59e0b", "#d97706"] },
    { id: "ichimlik", name: "Ichimliklar",icon: "🥤", grad: ["#06b6d4", "#0891b2"] },
    { id: "gosht",    name: "Go'sht",     icon: "🥩", grad: ["#ec4899", "#be185d"] },
    { id: "bakaleya", name: "Bakaleya",   icon: "🌾", grad: ["#a855f7", "#7c3aed"] },
  ];

  const gradOf = (cat) => (categories.find((c) => c.id === cat) || categories[0]).grad;

  // Yaroqlilik muddati: kategoriya bo'yicha standart saqlash kunlari
  const SHELF = { meva: 7, sabzavot: 10, sut: 7, non: 4, ichimlik: 180, gosht: 3, bakaleya: 365 };
  const shelfOf = (cat) => (SHELF[cat] != null ? SHELF[cat] : 30);
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  // Bugundan N kun keyingi sana (dd.mm.yyyy)
  const addDays = (days) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return fmtDate(d); };
  // dd.mm.yyyy -> bugungacha qolgan kunlar
  const daysLeft = (dateStr) => {
    const p = String(dateStr || "").split(".");
    if (p.length !== 3) return null;
    const d = new Date(+p[2], +p[1] - 1, +p[0]);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((d - now) / 86400000);
  };

  let _id = 0;
  const P = (name, price, oldPrice, unit, emoji, category, rating, opts = {}) => {
    const shelf = opts.shelf != null ? opts.shelf : shelfOf(category);
    return {
      id: ++_id, name, price, oldPrice, unit, emoji, category, rating,
      grad: gradOf(category),
      image: opts.image || null,        // real rasm (URL yoki data-URL); null bo'lsa emoji ko'rsatiladi
      shelf,                            // saqlash muddati (kun)
      expiry: opts.expiry || addDays(shelf), // yaroqlilik sanasi (dd.mm.yyyy)
      popular: opts.popular || false,
      stock: opts.stock != null ? opts.stock : 50,
      sold: opts.sold != null ? opts.sold : Math.floor(rating * 40),
      desc: opts.desc || `Yangi va sifatli ${name.toLowerCase()}. Bevosita fermerlardan yetkazib beriladi.`,
    };
  };

  const products = [
    P("Qizil olma",       18000, 24000, "1 kg",   "🍎", "meva", 4.8, { popular: true,  sold: 320 }),
    P("Banan",            22000, null,  "1 kg",   "🍌", "meva", 4.7, { popular: true,  sold: 280 }),
    P("Yer tut",          45000, 52000, "500 g",  "🍓", "meva", 4.9, { popular: true,  sold: 190 }),
    P("Uzum (qora)",      28000, null,  "1 kg",   "🍇", "meva", 4.6, { sold: 140 }),
    P("Apelsin",          24000, 30000, "1 kg",   "🍊", "meva", 4.5, { sold: 160 }),
    P("Tarvuz",           9000,  null,  "1 kg",   "🍉", "meva", 4.8, { popular: true,  sold: 410 }),

    P("Pomidor",          14000, 19000, "1 kg",   "🍅", "sabzavot", 4.6, { popular: true, sold: 350 }),
    P("Bodring",          12000, null,  "1 kg",   "🥒", "sabzavot", 4.5, { sold: 210 }),
    P("Sabzi",            8000,  11000, "1 kg",   "🥕", "sabzavot", 4.7, { sold: 240 }),
    P("Kartoshka",        7000,  null,  "1 kg",   "🥔", "sabzavot", 4.4, { popular: true, sold: 380 }),
    P("Piyoz",            6000,  9000,  "1 kg",   "🧅", "sabzavot", 4.3, { sold: 200 }),
    P("Bulg'or qalampir", 18000, null,  "1 kg",   "🫑", "sabzavot", 4.6, { sold: 130 }),

    P("Sut 2.5%",         12000, null,  "1 L",    "🥛", "sut", 4.8, { popular: true, sold: 290 }),
    P("Tvorog",           26000, 32000, "500 g",  "🧀", "sut", 4.6, { sold: 120 }),
    P("Sariyog'",         38000, null,  "400 g",  "🧈", "sut", 4.7, { sold: 95 }),
    P("Tuxum (10 dona)",  19000, 23000, "10 dona","🥚", "sut", 4.9, { popular: true, sold: 330 }),

    P("Non (patir)",      4000,  null,  "1 dona", "🍞", "non", 4.9, { popular: true, sold: 520 }),
    P("Shokoladli tort",  85000, 99000, "1 kg",   "🍰", "non", 4.7, { sold: 60 }),
    P("Pechenye",         16000, null,  "300 g",  "🍪", "non", 4.5, { sold: 140 }),
    P("Asal",             55000, 68000, "700 g",  "🍯", "non", 4.8, { sold: 80 }),

    P("Coca-Cola",        11000, null,  "1.5 L",  "🥤", "ichimlik", 4.6, { popular: true, sold: 300 }),
    P("Tabiiy sharbat",   15000, 18000, "1 L",    "🧃", "ichimlik", 4.7, { sold: 170 }),
    P("Mineral suv",      4000,  null,  "1.5 L",  "💧", "ichimlik", 4.5, { sold: 260 }),
    P("Ko'k choy",        21000, null,  "200 g",  "🍵", "ichimlik", 4.8, { sold: 110 }),

    P("Mol go'shti",      78000, 89000, "1 kg",   "🥩", "gosht", 4.7, { popular: true, sold: 150 }),
    P("Tovuq fileti",     42000, null,  "1 kg",   "🍗", "gosht", 4.6, { sold: 190 }),
    P("Baliq (losos)",    95000, 110000,"1 kg",   "🐟", "gosht", 4.8, { sold: 70 }),

    P("Guruch (lazer)",   24000, 29000, "1 kg",   "🍚", "bakaleya", 4.7, { popular: true, sold: 280 }),
    P("Makaron",          9000,  null,  "450 g",  "🍝", "bakaleya", 4.5, { sold: 200 }),
    P("Un (oliy nav)",    8000,  null,  "1 kg",   "🌾", "bakaleya", 4.6, { sold: 230 }),
    P("Yog' (kungaboqar)",26000, 31000, "1 L",    "🫗", "bakaleya", 4.6, { sold: 160 }),
  ];

  const ads = [
    { id: 1, tag: "Aksiya", title: "Mevalarga 30% chegirma", subtitle: "Faqat shu hafta!", cta: "Xarid qilish", emoji: "🍓", grad: "linear-gradient(135deg,#f97316,#db2777)", goCategory: "meva" },
    { id: 2, tag: "Bepul", title: "100 000 so'mdan ortiq xaridga bepul yetkazish", subtitle: "Shahar bo'ylab", cta: "Batafsil", emoji: "🚚", grad: "linear-gradient(135deg,#16a34a,#0d9488)" },
    { id: 3, tag: "Yangi", title: "Yangi sabzavotlar keldi", subtitle: "To'g'ridan-to'g'ri fermadan", cta: "Ko'rish", emoji: "🥬", grad: "linear-gradient(135deg,#7c3aed,#2563eb)", goCategory: "sabzavot" },
    { id: 4, tag: "Premium", title: "Sut mahsulotlari -20%", subtitle: "Har kuni yangi", cta: "Buyurtma", emoji: "🥛", grad: "linear-gradient(135deg,#0891b2,#1d4ed8)", goCategory: "sut" },
  ];

  const paymentMethods = [
    { id: "cash",  name: "Naqd pul",  sub: "Yetkazib berishda to'lash", logo: "💵", bg: "linear-gradient(135deg,#22c55e,#15803d)", abbr: "" },
    { id: "card",  name: "Bank kartasi", sub: "Uzcard / Humo / Visa",    logo: "💳", bg: "linear-gradient(135deg,#475569,#1e293b)", abbr: "" },
    { id: "click", name: "Click",     sub: "Click ilovasi orqali",       logo: "",   bg: "linear-gradient(135deg,#0ea5e9,#2563eb)", abbr: "Click" },
    { id: "payme", name: "Payme",     sub: "Payme hamyoni orqali",       logo: "",   bg: "linear-gradient(135deg,#22d3ee,#0e7490)", abbr: "Payme" },
  ];

  const user = {
    name: "Sardor Akbarov",
    phone: "+998 90 123 45 67",
    avatar: "👨🏻",
    bonus: 12400,
  };

  const addresses = [
    { id: 1, label: "Uy", icon: "🏠", text: "Chilonzor 9-kvartal, 23-uy, 14-xonadon", isDefault: true },
    { id: 2, label: "Ish", icon: "💼", text: "Amir Temur ko'chasi 108, ofis 5", isDefault: false },
  ];

  const orders = [
    {
      id: "ORD-1042", date: "14-iyun, 18:30", status: "ontheway",
      items: [ { id: 1, qty: 2 }, { id: 13, qty: 1 }, { id: 17, qty: 3 } ],
      total: 76000, payment: "click", address: "Chilonzor 9-kvartal, 23-uy",
    },
    {
      id: "ORD-1038", date: "12-iyun, 12:10", status: "done",
      items: [ { id: 25, qty: 1 }, { id: 28, qty: 2 }, { id: 23, qty: 1 } ],
      total: 130000, payment: "cash", address: "Amir Temur ko'chasi 108",
    },
    {
      id: "ORD-1031", date: "9-iyun, 09:45", status: "done",
      items: [ { id: 7, qty: 3 }, { id: 10, qty: 5 } ],
      total: 77000, payment: "payme", address: "Chilonzor 9-kvartal, 23-uy",
    },
  ];

  const faqs = [
    { q: "Yetkazib berish qancha vaqt oladi?", a: "Buyurtmangiz odatda 40–90 daqiqa ichida yetkazib beriladi. Tezkor yetkazish (30 daqiqa) ham mavjud." },
    { q: "Yetkazib berish narxi qancha?", a: "Shahar ichida 10 000 so'm. 100 000 so'mdan ortiq xaridlar uchun yetkazish bepul." },
    { q: "Qanday to'lov turlari mavjud?", a: "Naqd pul, bank kartasi, Click va Payme orqali to'lashingiz mumkin." },
    { q: "Mahsulotni qaytarib bera olamanmi?", a: "Ha, sifatsiz mahsulotni yetkazib berilgan vaqtda qaytarib, pulingizni to'liq qaytarib olishingiz mumkin." },
    { q: "Buyurtmani bekor qilsam bo'ladimi?", a: "Buyurtma yo'lga chiqmaguncha uni bepul bekor qilishingiz mumkin." },
  ];

  return { categories, products, ads, paymentMethods, user, addresses, orders, faqs, gradOf, daysLeft, shelfOf };
})();
