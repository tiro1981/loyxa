/* ============================================================
   OVQAT DOKONI — App runtime: router, ICONS, UI helpers
   Views register as: window.Views.home(root, params) -> renders into root
   Navigate with: UI.go("home")  / UI.go("checkout")  / UI.back()
   ============================================================ */

/* ---------------- ICONS (inline SVG) ---------------- */
window.ICONS = (function () {
  const s = (p, o = {}) =>
    `<svg viewBox="0 0 24 24" fill="${o.fill || "none"}" stroke="${o.stroke || "currentColor"}" stroke-width="${o.sw || 2}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  return {
    home:    s('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
    cart:    s('<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h2.5l2.2 12.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>'),
    receipt: s('<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21Z"/><path d="M9 8h6M9 12h6"/>'),
    user:    s('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    search:  s('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>'),
    bell:    s('<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    heart:   s('<path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z"/>'),
    pin:     s('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>'),
    card:    s('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/>'),
    moon:    s('<path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/>'),
    chat:    s('<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z"/>'),
    help:    s('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7"/><path d="M12 17h.01"/>'),
    shield:  s('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>'),
    logout:  s('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'),
    plus:    s('<path d="M12 5v14M5 12h14"/>'),
    minus:   s('<path d="M5 12h14"/>'),
    trash:   s('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7"/>'),
    back:    s('<path d="m15 5-7 7 7 7"/>'),
    chevron: s('<path d="m9 6 6 6-6 6"/>'),
    check:   s('<path d="m5 13 4 4L19 7"/>', { sw: 2.6 }),
    star:    s('<path d="m12 3 2.5 5.5L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.5-.8Z"/>', { fill: "currentColor", stroke: "none" }),
    clock:   s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    box:     s('<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
    truck:   s('<path d="M2 6h11v9H2zM13 9h4l3 3v3h-7z"/><circle cx="6.5" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
    edit:    s('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>'),
    location:s('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>'),
    tag:     s('<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.4"/>'),
    gift:    s('<rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13M12 8S9 3 6.5 5 9 8 12 8Zm0 0s3-5 5.5-3S15 8 12 8Z"/>'),
    phone:   s('<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L19 11l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/>'),
    mic:     s('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    close:   s('<path d="M6 6l12 12M18 6 6 18"/>'),
    filter:  s('<path d="M3 5h18M6 12h12M10 19h4"/>'),
    info:    s('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  };
})();

/* ---------------- UI helpers ---------------- */
window.UI = (function () {
  const app = () => document.getElementById("app");
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sum = (n) => fmt(n) + " so'm";

  /* toast */
  function toast(msg, type = "ok") {
    const layer = document.getElementById("toastLayer");
    const el = document.createElement("div");
    el.className = "toast " + type;
    const ic = type === "ok" ? ICONS.check : type === "err" ? ICONS.close : ICONS.info;
    el.innerHTML = `<span class="ti">${ic}</span><span>${msg}</span>`;
    layer.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 2200);
  }

  /* bottom sheet */
  function sheet(html, { title } = {}) {
    const layer = document.getElementById("sheetLayer");
    layer.innerHTML = `
      <div class="sheet-backdrop" data-close></div>
      <div class="sheet">
        <div class="sheet-handle"></div>
        ${title ? `<div class="sheet-body" style="padding-bottom:0"><div class="sheet-title">${title}</div></div>` : ""}
        <div class="sheet-body">${html}</div>
      </div>`;
    layer.classList.add("open");
    layer.querySelector("[data-close]").onclick = closeSheet;
    return layer.querySelector(".sheet");
  }
  function closeSheet() {
    const layer = document.getElementById("sheetLayer");
    const sh = layer.querySelector(".sheet");
    if (sh) sh.style.transform = "translateY(100%)";
    layer.querySelector(".sheet-backdrop").style.opacity = "0";
    setTimeout(() => { layer.classList.remove("open"); layer.innerHTML = ""; }, 360);
  }

  /* confirm dialog (uses sheet) */
  function confirm(opts) {
    const { title = "Tasdiqlang", text = "", okText = "Ha", cancelText = "Bekor qilish", danger = false, onOk } = opts;
    const sh = sheet(`
      <p style="color:var(--text-2);font-size:14.5px;line-height:1.5;margin-bottom:18px">${text}</p>
      <div style="display:flex;gap:10px">
        <button class="btn btn--ghost" style="flex:1" data-cancel>${cancelText}</button>
        <button class="btn ${danger ? "btn--danger" : "btn--primary"}" style="flex:1" data-ok>${okText}</button>
      </div>`, { title });
    sh.querySelector("[data-cancel]").onclick = closeSheet;
    sh.querySelector("[data-ok]").onclick = () => { closeSheet(); onOk && onOk(); };
  }

  /* fly-to-cart animation */
  function flyToCart(fromEl, emoji) {
    const target = document.querySelector('.tab[data-tab="cart"]');
    if (!fromEl || !target) return;
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "fly-dot";
    dot.textContent = emoji || "🛒";
    dot.style.left = a.left + a.width / 2 - 11 + "px";
    dot.style.top = a.top + a.height / 2 - 11 + "px";
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    dot.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(1.2)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(.3)`, opacity: 0.4 },
      ],
      { duration: 650, easing: "cubic-bezier(.5,-0.3,.7,1)" }
    ).onfinish = () => {
      dot.remove();
      const ic = target.querySelector("svg");
      if (ic) { ic.classList.remove("badge-pop"); void ic.offsetWidth; ic.classList.add("badge-pop"); }
    };
  }

  return { toast, sheet, closeSheet, confirm, flyToCart, fmt, sum, go, back };
})();

/* ---------------- Router ---------------- */
const TABS = ["home", "cart", "orders", "profile"];
const navStack = []; // history of {view, params}

function renderTabbar() {
  const cur = (navStack[navStack.length - 1] || {}).view;
  const items = [
    { id: "home", label: "Asosiy", icon: ICONS.home },
    { id: "cart", label: "Savat", icon: ICONS.cart },
    { id: "orders", label: "Buyurtma", icon: ICONS.receipt },
    { id: "profile", label: "Profil", icon: ICONS.user },
  ];
  const count = Store.cartCount();
  document.getElementById("tabbar").innerHTML = items
    .map((t) => {
      const active = t.id === cur || (t.id === "home" && !TABS.includes(cur));
      const badge = t.id === "cart" && count ? `<span class="tab-badge">${count}</span>` : "";
      return `<button class="tab ${active ? "is-active" : ""}" data-tab="${t.id}"><span class="tab-ic">${t.icon}${badge}</span><span>${t.label}</span></button>`;
    })
    .join("");
  document.querySelectorAll(".tab").forEach((el) => (el.onclick = () => go(el.dataset.tab)));
}

function go(view, params = {}) {
  // tab navigation resets the stack to that root
  if (TABS.includes(view)) navStack.length = 0;
  navStack.push({ view, params });
  render();
}
function back() {
  if (navStack.length > 1) { navStack.pop(); render(); }
  else go("home");
}

function render() {
  const entry = navStack[navStack.length - 1] || { view: "home", params: {} };
  const root = document.getElementById("view");
  const fn = (window.Views || {})[entry.view] || window.Views.home;
  root.scrollTop = 0;
  root.innerHTML = "";
  root.classList.remove("view-enter"); void root.offsetWidth; root.classList.add("view-enter");
  try { fn(root, entry.params); }
  catch (e) { console.error("View error:", entry.view, e); root.innerHTML = `<div class="empty"><div class="e-emoji">⚠️</div><h3>Xatolik</h3><p>${e.message}</p></div>`; }
  renderTabbar();
}

/* keep tabbar badge + active view in sync with store */
Store.on("cart:change", () => {
  renderTabbar();
  const cur = (navStack[navStack.length - 1] || {}).view;
  if (cur === "cart") render();
});
Store.on("favorites:change", () => {
  const cur = (navStack[navStack.length - 1] || {}).view;
  if (cur === "favorites") render();
});
Store.on("orders:change", () => {
  const cur = (navStack[navStack.length - 1] || {}).view;
  if (cur === "orders") render();
});

/* ---------------- Boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  go("home");
});
