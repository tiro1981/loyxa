/* ============================================================
   OVQAT DOKONI — Mock ma'lumotlar
   ============================================================ */
window.DATA = (function () {

  // Har bir mijoz (do'kon) o'z katalogiga ega bo'lishi kerak. Mijozni aniqlash:
  // QR/subdomen orqali kelganda ?client=..., aks holda joriy sessiya (bo_session).
  // Shu tufayli QR skaner qilingan storefront aynan o'sha do'kon katalogini ko'rsatadi.
  // Mijoz (do'kon) id'si — boot-loader window.__CLIENT_ID ga qo'yadi (?client= yoki bo_session).
  const CLIENT_ID = window.__CLIENT_ID || (function () {
    try {
      const q = new URLSearchParams(location.search).get("client");
      if (q) return q;
      const s = JSON.parse(localStorage.getItem("bo_session") || "{}");
      if (s && s.clientId) return s.clientId;
    } catch (e) {}
    return "demo";
  })();

  const defaultCategories = [
    { id: "all",      name: "Barchasi",   icon: "🛒", grad: ["#22c55e", "#16a34a"] },
    { id: "meva",     name: "Mevalar",    icon: "🍎", grad: ["#f97316", "#ef4444"] },
    { id: "sabzavot", name: "Sabzavotlar",icon: "🥬", grad: ["#22c55e", "#15803d"] },
    { id: "sut",      name: "Sut mahsul.",icon: "🥛", grad: ["#3b82f6", "#2563eb"] },
    { id: "non",      name: "Non & shirin",icon: "🍞", grad: ["#f59e0b", "#d97706"] },
    { id: "ichimlik", name: "Ichimliklar",icon: "🥤", grad: ["#06b6d4", "#0891b2"] },
    { id: "gosht",    name: "Go'sht",     icon: "🥩", grad: ["#ec4899", "#be185d"] },
    { id: "bakaleya", name: "Bakaleya",   icon: "🌾", grad: ["#a855f7", "#7c3aed"] },
  ];

  // Saqlangan katalogni yuklaymiz — admin paneldan qo'shilgan mahsulotlar
  // storefront'da ham ko'rinadi (ikkalasi shu localStorage kalitini baham ko'radi).
  let products = [];
  let categories = defaultCategories;
  try {
    const _saved = (window.Cloud ? Cloud.get("catalog", null) : null);  // serverdan (yoki localStorage fallback)
    if (_saved && Array.isArray(_saved.products)) products = _saved.products;
    if (_saved && Array.isArray(_saved.categories) && _saved.categories.length) categories = _saved.categories;
  } catch (e) {}

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

  // Reklama bannerlari — bo'sh.
  const ads = [];

  const paymentMethods = [
    { id: "cash",  name: "Naqd pul",  sub: "Yetkazib berishda to'lash", logo: "💵", bg: "linear-gradient(135deg,#22c55e,#15803d)", abbr: "" },
    { id: "card",  name: "Bank kartasi", sub: "Uzcard / Humo / Visa",    logo: "💳", bg: "linear-gradient(135deg,#475569,#1e293b)", abbr: "" },
    { id: "click", name: "Click",     sub: "Click ilovasi orqali",       logo: "",   bg: "linear-gradient(135deg,#0ea5e9,#2563eb)", abbr: "Click" },
    { id: "payme", name: "Payme",     sub: "Payme hamyoni orqali",       logo: "",   bg: "linear-gradient(135deg,#22d3ee,#0e7490)", abbr: "Payme" },
  ];

  // Foydalanuvchi — bo'sh profil (mijoz o'z ma'lumotini kiritadi)
  const user = {
    name: "Mehmon",
    phone: "",
    avatar: "👤",
    bonus: 0,
  };

  // Saqlangan manzillar — bo'sh
  const addresses = [];

  // Buyurtmalar tarixi — bo'sh
  const orders = [];

  const faqs = [
    { q: "Yetkazib berish qancha vaqt oladi?", a: "Buyurtmangiz odatda 40–90 daqiqa ichida yetkazib beriladi. Tezkor yetkazish (30 daqiqa) ham mavjud." },
    { q: "Yetkazib berish narxi qancha?", a: "Shahar ichida 10 000 so'm. 100 000 so'mdan ortiq xaridlar uchun yetkazish bepul." },
    { q: "Qanday to'lov turlari mavjud?", a: "Naqd pul, bank kartasi, Click va Payme orqali to'lashingiz mumkin." },
    { q: "Mahsulotni qaytarib bera olamanmi?", a: "Ha, sifatsiz mahsulotni yetkazib berilgan vaqtda qaytarib, pulingizni to'liq qaytarib olishingiz mumkin." },
    { q: "Buyurtmani bekor qilsam bo'ladimi?", a: "Buyurtma yo'lga chiqmaguncha uni bepul bekor qilishingiz mumkin." },
  ];

  // Katalogni serverga (Cloud) saqlash — admin panel har o'zgarishdan keyin chaqiradi
  function saveCatalog() {
    try { if (window.Cloud) Cloud.set("catalog", { products, categories }); } catch (e) {}
  }
  // Ilk ishga tushirishda standart kategoriyalarni serverga yozib qo'yamiz
  if (window.Cloud && !Cloud.get("catalog")) saveCatalog();

  return { clientId: CLIENT_ID, categories, products, ads, paymentMethods, user, addresses, orders, faqs, gradOf, daysLeft, shelfOf, saveCatalog };
})();
