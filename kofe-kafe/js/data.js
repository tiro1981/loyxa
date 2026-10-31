/* ============================================================
   KOFE KAFE — standart ma'lumotlar (mijoz ilovasi va admin panel uchun umumiy)
   Haqiqiy menyu Cloud "menu" kalitida saqlanadi; bu yerda faqat birinchi
   ochilishdagi namunaviy menyu va mahsulot variantlari turadi.
   ============================================================ */
window.KOFE = (function () {
  // Kategoriyalar: drink=true — sadoqat kartasiga marka qo'shadigan ichimliklar
  const CATEGORIES = [
    { id: "issiq",  name: "Issiq",   emoji: "☕", drink: true },
    { id: "sovuq",  name: "Sovuq",   emoji: "🧊", drink: true },
    { id: "choy",   name: "Choy",    emoji: "🍵", drink: true },
    { id: "desert", name: "Desert",  emoji: "🍰", drink: false },
    { id: "snack",  name: "Gazak",   emoji: "🥐", drink: false },
  ];

  // opts: s = hajm, m = sut turi, sw = shirinlik
  const PRODUCTS = [
    { id: 1,  cat: "issiq",  name: "Espresso",      price: 15000, emoji: "☕", desc: "Qisqa va kuchli, ikki shot arabika.", opts: { s: false, m: false, sw: true }, popular: true },
    { id: 2,  cat: "issiq",  name: "Americano",     price: 18000, emoji: "☕", desc: "Espresso va issiq suv — yengil, toza ta'm.", opts: { s: true, m: false, sw: true } },
    { id: 3,  cat: "issiq",  name: "Cappuccino",    price: 22000, emoji: "☕", desc: "Ikki shot espresso, iliq sut va qalin sut ko'pigi.", opts: { s: true, m: true, sw: true }, popular: true },
    { id: 4,  cat: "issiq",  name: "Latte",         price: 24000, emoji: "🥛", desc: "Ko'proq sut, yumshoq va kremli.", opts: { s: true, m: true, sw: true } },
    { id: 5,  cat: "issiq",  name: "Flat White",    price: 25000, emoji: "☕", desc: "Kuchli espresso va yupqa sut qatlami.", opts: { s: false, m: true, sw: true } },
    { id: 6,  cat: "issiq",  name: "Mocha",         price: 27000, emoji: "🍫", desc: "Espresso, shokolad va sut.", opts: { s: true, m: true, sw: true } },
    { id: 7,  cat: "sovuq",  name: "Iced Latte",    price: 26000, emoji: "🧊", desc: "Muzli latte — yozgi klassika.", opts: { s: true, m: true, sw: true }, popular: true },
    { id: 8,  cat: "sovuq",  name: "Cold Brew",     price: 25000, emoji: "🧊", desc: "12 soat sovuq damlangan qahva.", opts: { s: true, m: false, sw: true } },
    { id: 9,  cat: "sovuq",  name: "Frappe",        price: 29000, emoji: "🥤", desc: "Muz, qahva va sut ko'pigi.", opts: { s: true, m: true, sw: true } },
    { id: 10, cat: "choy",   name: "Ko'k choy",     price: 12000, emoji: "🍵", desc: "Choynakda, limon bilan.", opts: { s: false, m: false, sw: true } },
    { id: 11, cat: "choy",   name: "Matcha latte",  price: 28000, emoji: "🍵", desc: "Yapon matchasi va sut.", opts: { s: true, m: true, sw: true }, isNew: true },
    { id: 12, cat: "desert", name: "Cheesecake",    price: 30000, emoji: "🍰", desc: "Klassik Nyu-York cheesecake.", opts: {} },
    { id: 13, cat: "desert", name: "Tiramisu",      price: 32000, emoji: "🍮", desc: "Mascarpone va espresso bilan.", opts: {} },
    { id: 14, cat: "snack",  name: "Kruassan",      price: 16000, emoji: "🥐", desc: "Sariyog'li, yangi pishgan.", opts: {} },
    { id: 15, cat: "snack",  name: "Sendvich",      price: 28000, emoji: "🥪", desc: "Tovuq, pishloq va ko'katlar.", opts: {} },
  ].map((p) => Object.assign({ available: true, image: null }, p));

  // Variantlar va narxga qo'shimchalar (so'm)
  const SIZES = [
    { id: "S", label: "S", vol: "250 ml", add: 0 },
    { id: "M", label: "M", vol: "350 ml", add: 4000 },
    { id: "L", label: "L", vol: "450 ml", add: 7000 },
  ];
  const MILKS = [
    { id: "oddiy", label: "Oddiy",  add: 0 },
    { id: "yulaf", label: "Yulaf",  add: 5000 },
    { id: "bodom", label: "Bodom",  add: 6000 },
  ];
  const SWEET = [
    { id: 0, label: "Shakarsiz" },
    { id: 1, label: "1 qoshiq" },
    { id: 2, label: "2 qoshiq" },
  ];

  const SETTINGS = {
    shopName: "Kofe Kafe",
    phone: "+998 90 000 00 00",
    address: "Toshkent sh.",
    hours: "08:00 – 22:00",
    loyaltyEvery: 5,      // har 5-chi ichimlik bepul
    delivery: false,      // v1: yetkazib berish faqat tanlov sifatida (o'chirilgan)
  };

  const STATUS = {
    new:       { label: "Yangi",          tone: "warn" },
    preparing: { label: "Tayyorlanmoqda", tone: "acc" },
    ready:     { label: "Tayyor",         tone: "ok" },
    done:      { label: "Berildi",        tone: "mut" },
    cancelled: { label: "Bekor qilindi",  tone: "bad" },
  };

  const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Bitta savat qatori narxi (variantlar bilan)
  function linePrice(p, sel) {
    let x = p.price;
    if (p.opts && p.opts.s && sel.size) x += (SIZES.find((s) => s.id === sel.size) || { add: 0 }).add;
    if (p.opts && p.opts.m && sel.milk) x += (MILKS.find((m) => m.id === sel.milk) || { add: 0 }).add;
    return x;
  }
  function optsLabel(p, sel) {
    const out = [];
    if (p.opts && p.opts.s && sel.size) { const s = SIZES.find((z) => z.id === sel.size); if (s) out.push(s.label + " " + s.vol); }
    if (p.opts && p.opts.m && sel.milk) { const m = MILKS.find((z) => z.id === sel.milk); if (m) out.push(m.label + " sut"); }
    if (p.opts && p.opts.sw && sel.sweet != null) { const w = SWEET.find((z) => z.id === sel.sweet); if (w) out.push(w.label); }
    return out.join(", ");
  }

  return { CATEGORIES, PRODUCTS, SIZES, MILKS, SWEET, SETTINGS, STATUS, fmt, esc, linePrice, optsLabel };
})();
