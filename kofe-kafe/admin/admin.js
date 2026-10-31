/* ============================================================
   KOFE KAFE — admin panel
   Bo'limlar: buyurtmalar (taxta), menyu, mijozlar, statistika, stol QR, sozlamalar.
   Ma'lumot: Cloud "menu" / "orders" / "customers" / "settings" (app="kofe").
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
  function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }
  const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + "-" + (x.getMonth() + 1) + "-" + x.getDate(); };
  const isToday = (iso) => dayKey(iso) === dayKey(Date.now());
  const live = (o) => o.status !== "cancelled";
  const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? "hozir" : m < 60 ? m + " daq oldin" : Math.round(m / 60) + " soat oldin"; };
  const typeLabel = (o) => (o.type === "table" ? "Stol " + esc(o.table) : o.type === "delivery" ? "Yetkazish" : "Olib ketish");
  function thumb(p) { return p.image ? '<img src="' + esc(p.image) + '" alt="">' : esc(p.emoji || "☕"); }
  function storeUrl(table) {
    const u = new URL("../index.html", location.href);
    u.searchParams.set("client", CID);
    if (table) u.searchParams.set("stol", table);
    return u.href;
  }
  const qrImg = (url, size) => "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size + "&margin=8&data=" + encodeURIComponent(url);

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

  // Yangi buyurtma ovozi
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
  const PAGES = [
    { id: "orders",    ic: "🧾", label: "Buyurtmalar", sub: "Yangi → Tayyorlanmoqda → Tayyor" },
    { id: "menu",      ic: "☕", label: "Menyu",       sub: "Mahsulotlar, narxlar va mavjudlik" },
    { id: "customers", ic: "👥", label: "Mijozlar",    sub: "Buyurtmalar va sadoqat kartasi" },
    { id: "stats",     ic: "📈", label: "Statistika",  sub: "Tushum va eng ko'p sotilganlar" },
    { id: "qr",        ic: "🔳", label: "Stol QR",     sub: "Har stol uchun QR kod" },
    { id: "settings",  ic: "⚙️", label: "Sozlamalar",  sub: "Kafe ma'lumotlari va Telegram" },
  ];
  const state = { page: "orders", cat: "all", period: "today", fresh: new Set() };
  function go(page) { state.page = page; closeSide(); render(); window.scrollTo(0, 0); }
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
      '<div class="tk-who">' + esc(o.name) + " · " + esc(o.phone) + (o.note ? " · " + esc(o.note) : "") + (o.address ? "<br>" + esc(o.address) : "") + "</div>" +
      '<div class="tk-f"><span class="pill ' + (o.type === "table" ? "acc" : "") + '">' + typeLabel(o) + "</span><b>" + fmt(o.total) + "</b>" +
      '<span style="display:flex;gap:6px">' + (c.st === "new" ? '<button class="btn btn-line btn-sm btn-bad" data-st="cancelled" data-id="' + esc(o.id) + '">Bekor</button>' : "") +
      '<button class="btn btn-acc btn-sm" data-st="' + c.next + '" data-id="' + esc(o.id) + '">' + c.btn + "</button></span></div></div>";

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
      '<div class="grid-2">' + hourlyCard(today) + topCard(today, "Bugun mashhur") + "</div>"
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
    const list = m.products.filter((p) => state.cat === "all" || p.cat === state.cat);
    return '<div class="chips"><button class="chip' + (state.cat === "all" ? " on" : "") + '" data-cat="all">Hammasi</button>' +
      m.categories.map((c) => '<button class="chip' + (state.cat === c.id ? " on" : "") + '" data-cat="' + esc(c.id) + '">' + esc(c.emoji + " " + c.name) + "</button>").join("") + "</div>" +
      '<div class="card"><div class="rows">' + (list.length ? list.map((p) =>
        '<div class="row' + (p.available === false ? " off" : "") + '"><span class="th">' + thumb(p) + '</span><div class="b"><b>' + esc(p.name) + (p.popular ? " ⭐" : "") + "</b><small>" + esc(((m.categories.find((c) => c.id === p.cat) || {}).name) || "") + (p.available === false ? " · tugagan" : "") + "</small></div>" +
        '<span class="pr">' + fmt(p.price) + "</span>" +
        '<button class="toggle' + (p.available !== false ? " on" : "") + '" data-avail="' + esc(p.id) + '" role="switch" aria-checked="' + (p.available !== false) + '" aria-label="' + esc(p.name) + ' mavjud"></button>' +
        '<button class="btn btn-line btn-sm" data-edit="' + esc(p.id) + '">Tahrirlash</button></div>').join("") : '<div class="empty">Bu kategoriyada mahsulot yo\'q</div>') + "</div></div>";
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
      '<label><input type="checkbox" id="oP"' + (d.popular ? " checked" : "") + "> Mashhur</label></div></div>" +
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
        opts: { s: $("oS").checked, m: $("oM").checked, sw: $("oW").checked }, popular: $("oP").checked,
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

  /* ---------- 3. Mijozlar ---------- */
  function pageCustomers() {
    const every = settings().loyaltyEvery || 5;
    const list = customers().slice().sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
    if (!list.length) return '<div class="card"><div class="empty">Hali mijoz yo\'q. Birinchi buyurtmadan keyin shu yerda ko\'rinadi.</div></div>';
    return '<div class="card"><div class="rows">' + list.map((c) =>
      '<div class="row"><span class="th">' + esc((c.name || "?").charAt(0).toUpperCase()) + '</span><div class="b"><b>' + esc(c.name || "—") + "</b><small>" + esc(c.phone) + " · " + (c.orders || 0) + " ta buyurtma</small></div>" +
      '<span class="pill ' + ((c.stamps || 0) >= every ? "ok" : "acc") + '">☕ ' + Math.min(c.stamps || 0, every) + "/" + every + "</span>" +
      '<span class="pr">' + fmt(c.spent || 0) + "</span></div>").join("") + "</div></div>";
  }

  /* ---------- 4. Statistika ---------- */
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
    return '<div class="seg">' + [["today", "Bugun"], ["week", "7 kun"], ["month", "30 kun"]].map((x) => '<button data-period="' + x[0] + '" class="' + (state.period === x[0] ? "on" : "") + '">' + x[1] + "</button>").join("") + "</div>" +
      '<div class="kpis"><div class="kpi"><small>Tushum, so\'m</small><b>' + fmt(rev) + '</b></div><div class="kpi"><small>Buyurtmalar</small><b>' + list.length + '</b></div>' +
      '<div class="kpi"><small>O\'rtacha chek</small><b>' + fmt(list.length ? rev / list.length : 0) + '</b></div><div class="kpi"><small>Sadoqat sovg\'alari</small><b>' + list.filter((o) => o.discount > 0).length + "</b></div></div>" +
      '<div class="grid-2">' + chart + topCard(list, "Eng ko'p sotilganlar") + "</div>";
  }

  /* ---------- 5. Stol QR ---------- */
  function pageQr() {
    const s = settings();
    const n = Math.max(0, Math.min(60, s.tables || 6));
    return '<div class="card" style="margin-bottom:12px;display:flex;gap:12px;align-items:end;flex-wrap:wrap">' +
      '<div class="f" style="width:160px"><label for="tCount">Stollar soni</label><input id="tCount" type="number" min="0" max="60" value="' + n + '"></div>' +
      '<button class="btn btn-line" id="tSave">Yangilash</button><button class="btn btn-line" onclick="window.print()">Chop etish</button>' +
      '<p style="flex-basis:100%;font-size:13px;color:var(--mut)">Mijoz QR\'ni skanerlasa menyu stol raqami bilan ochiladi — buyurtma o\'sha stolga yoziladi.</p></div>' +
      '<div class="qr-grid"><div class="qr"><img src="' + qrImg(storeUrl(), 300) + '" alt="Kafe QR kodi" loading="lazy"><b>' + esc(s.shopName) + '</b><small>Olib ketish uchun</small></div>' +
      Array.from({ length: n }, (_, i) => '<div class="qr"><img src="' + qrImg(storeUrl(i + 1), 300) + '" alt="Stol ' + (i + 1) + ' QR kodi" loading="lazy"><b>Stol ' + (i + 1) + "</b><small>" + esc(s.shopName) + "</small></div>").join("") + "</div>";
  }

  /* ---------- 6. Sozlamalar ---------- */
  function pageSettings() {
    const s = settings();
    return '<div class="card"><h3>Kafe ma\'lumotlari</h3><div class="form">' +
      '<div class="f"><label for="sName">Kafe nomi</label><input id="sName" value="' + esc(s.shopName) + '"></div>' +
      '<div class="f"><label for="sPhone">Telefon</label><input id="sPhone" value="' + esc(s.phone) + '"></div>' +
      '<div class="f"><label for="sAddr">Manzil</label><input id="sAddr" value="' + esc(s.address) + '"></div>' +
      '<div class="f"><label for="sHours">Ish vaqti</label><input id="sHours" value="' + esc(s.hours) + '"></div>' +
      '<div class="f"><label for="sLoy">Sadoqat: har nechanchi ichimlik bepul</label><input id="sLoy" type="number" min="2" max="20" value="' + esc(s.loyaltyEvery) + '"></div>' +
      '<div class="f"><label>Yetkazib berish</label><div class="checks"><label><input type="checkbox" disabled> Tez orada (2-versiya)</label></div></div>' +
      '</div><div class="modal-f"><button class="btn btn-acc" id="sSave">Saqlash</button></div></div>' +
      '<div class="card" style="margin-top:12px"><h3>Telegram bot</h3><p style="font-size:13.5px;color:var(--mut);margin-bottom:12px">Yangi buyurtma kelganda kafe botingiz kanalga xabar yuboradi. @BotFather\'dan olingan tokenni kiriting.</p>' +
      '<div class="form"><div class="f full"><label for="bToken">Bot tokeni</label><input id="bToken" placeholder="123456:ABC..." autocomplete="off"></div>' +
      '<div class="f full"><label for="bChan">Kanal (ixtiyoriy)</label><input id="bChan" placeholder="@kafe_buyurtmalar"></div></div>' +
      '<p id="bStatus" style="font-size:13.5px;margin-top:10px;color:var(--mut)">Holat tekshirilmoqda…</p>' +
      '<div class="modal-f"><button class="btn btn-line btn-bad" id="bOff">Uzish</button><button class="btn btn-line" id="bChanSave">Kanalni saqlash</button><button class="btn btn-acc" id="bOn">Ulash</button></div></div>';
  }
  async function refreshBot() {
    const el = $("bStatus");
    if (!el || !window.Telegram || !Telegram.status) return;
    const st = await Telegram.status();
    if (!$("bStatus")) return;
    el.textContent = st && st.ok && st.connected
      ? "Ulangan: @" + (st.username || "bot") + (st.channel ? " · kanal " + st.channel : " · kanal ulanmagan")
      : "Bot ulanmagan" + (st && st.error ? " (" + st.error + ")" : "");
    el.style.color = st && st.ok && st.connected ? "var(--ok)" : "var(--mut)";
  }

  /* ---------- modal ---------- */
  const openModal = () => $("modal").classList.add("show");
  const closeModal = () => $("modal").classList.remove("show");

  /* ---------- render ---------- */
  function render() {
    const s = settings();
    $("brandName").textContent = s.shopName;
    document.title = s.shopName + " · Admin";
    const pending = orders().filter((o) => o.status === "new").length;
    $("nav").innerHTML = PAGES.map((p) => '<button class="' + (state.page === p.id ? "on" : "") + '" data-page="' + p.id + '"' + (state.page === p.id ? ' aria-current="page"' : "") + '><span class="ic" aria-hidden="true">' + p.ic + "</span>" + p.label + (p.id === "orders" && pending ? '<span class="n">' + pending + "</span>" : "") + "</button>").join("");
    const pg = PAGES.find((p) => p.id === state.page);
    $("pageTitle").textContent = pg.label;
    $("pageSub").textContent = pg.sub;
    $("headActions").innerHTML = state.page === "menu"
      ? '<button class="btn btn-acc" id="addProduct">+ Mahsulot</button>'
      : state.page === "orders" ? '<a class="btn btn-line" href="' + esc(storeUrl()) + '" target="_blank" rel="noopener">Ilovani ochish</a>' : "";
    $("page").innerHTML = { orders: pageOrders, menu: pageMenu, customers: pageCustomers, stats: pageStats, qr: pageQr, settings: pageSettings }[state.page]();
    if (state.page === "settings") refreshBot();
    const live = Cloud.mode === "cloud";
    $("syncDot").classList.toggle("ok", live);
    $("syncText").textContent = live ? "Sinxron (bulut)" : "Faqat shu qurilma";
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
    if (t.dataset.cat) { state.cat = t.dataset.cat; return render(); }
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
    if (t.id === "tSave") {
      const s = settings();
      s.tables = Math.max(0, Math.min(60, parseInt($("tCount").value, 10) || 0));
      saveSettings(s); toast("Yangilandi"); return render();
    }
    if (t.id === "sSave") {
      const s = settings();
      Object.assign(s, {
        shopName: $("sName").value.trim() || "Kofe Kafe", phone: $("sPhone").value.trim(), address: $("sAddr").value.trim(),
        hours: $("sHours").value.trim(), loyaltyEvery: Math.max(2, Math.min(20, parseInt($("sLoy").value, 10) || 5)), shopNameApplied: true,
      });
      saveSettings(s); toast("Sozlamalar saqlandi"); return render();
    }
    if (t.id === "bOn") {
      const token = $("bToken").value.trim();
      if (!/^\d+:[\w-]{20,}$/.test(token)) return toast("Token formati noto'g'ri");
      t.disabled = true;
      try { await Telegram.connect({ token, shopName: settings().shopName, storeUrl: storeUrl() }); $("bToken").value = ""; toast("Bot ulandi"); }
      catch (err) { toast("Ulanmadi: " + err.message); }
      t.disabled = false; return refreshBot();
    }
    if (t.id === "bOff") { await Telegram.disconnect(); toast("Bot uzildi"); return refreshBot(); }
    if (t.id === "bChanSave") {
      const ch = $("bChan").value.trim();
      if (!ch) return toast("Kanal nomini kiriting");
      try { await Telegram.setChannel(ch); toast("Kanal saqlandi"); } catch (err) { toast("Xato: " + err.message); }
      return refreshBot();
    }
  });
  $("overlay").addEventListener("click", closeSide);
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeSide(); } });

  // Jonli yangilanish: yangi buyurtma kelsa — ovoz va belgi
  let known = new Set(orders().map((o) => o.id));
  if (Cloud.watch) {
    Cloud.watch(["orders", "customers", "menu", "settings"], (key, value) => {
      Cloud.adopt(key, value);
      if (key === "orders") {
        const fresh = (value || []).filter((o) => !known.has(o.id));
        if (fresh.length) { fresh.forEach((o) => state.fresh.add(o.id)); beep(); toast("Yangi buyurtma: #" + fresh[fresh.length - 1].no); }
        known = new Set((value || []).map((o) => o.id));
      }
      if ($("modal").classList.contains("show")) return;
      const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (!typing) render();
    }, 4000);
  }

  render();
})();
