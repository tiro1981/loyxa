/* ============================================================
   OVQAT DOKONI — Mahsulot batafsil sahifasi (to'liq ekran)
   Views.product(root, { id })
   ============================================================ */
window.Views = window.Views || {};

window.Views.product = function (root, params) {
  const p = Store.product(params.id);

  // Mahsulot topilmasa — bo'sh holat
  if (!p) {
    root.innerHTML = Components.appbar({ back: true, title: "Mahsulot" }) +
      `<div class="view-pad">` +
      Components.emptyState({
        emoji: "🔍",
        title: "Mahsulot topilmadi",
        text: "Bu mahsulot mavjud emas yoki o'chirilgan.",
        btn: { label: "Asosiyga", onClick: () => UI.go("home") },
      }) + `</div>`;
    Components.bindBack(root);
    return;
  }

  // Maxsus CSS — faqat bir marta qo'shilsin
  if (!document.getElementById("pdpCss")) {
    const st = document.createElement("style");
    st.id = "pdpCss";
    st.textContent = `
      .pdp-hero{position:relative;height:260px;border-radius:24px;display:grid;place-items:center;margin:0 var(--sp-4) 18px;overflow:hidden}
      .pdp-emoji{font-size:110px;line-height:1;filter:drop-shadow(0 12px 22px rgba(0,0,0,.18))}
      .pdp-title{font-size:24px;font-weight:800;line-height:1.2;margin:0 0 8px}
      .pdp-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--text-3);font-size:13px;margin-bottom:16px}
      .pdp-meta .rating{color:var(--text);font-weight:700}
      .pdp-price{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:20px}
      .pdp-price .now{font-size:28px;font-weight:800;line-height:1}
      .pdp-price .price-old{font-size:16px}
      .pdp-disc{background:var(--primary);color:var(--primary-ink);font-weight:800;font-size:12px;padding:4px 9px;border-radius:999px}
      .pdp-desc{color:var(--text-2);font-size:14.5px;line-height:1.6;margin:0}
      .pdp-stock{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;font-weight:700;padding:8px 13px;border-radius:12px;background:var(--surface-2)}
      .pdp-stock.ok{color:#16a34a}
      .pdp-stock.low{color:#f59e0b}
      .pdp-dock{display:flex;align-items:center;gap:12px}
      .pdp-dock .stepper{flex:0 0 auto;height:52px;border-radius:16px}
      .pdp-dock .stepper button{width:36px;height:36px}
      .pdp-add{flex:1;display:flex;align-items:center;justify-content:center;gap:8px}
      .pdp-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
      .pdp-info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0 4px}
      .pi{display:flex;align-items:center;gap:11px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:14px}
      .pi-ic{width:38px;height:38px;flex:none;display:grid;place-items:center;font-size:18px;border-radius:11px;background:var(--surface-2)}
      .pi small{display:block;font-size:11px;color:var(--text-3);font-weight:600;margin-bottom:1px}
      .pi b{font-size:13.5px;font-weight:700}
      .pi.warn{border-color:rgba(245,158,11,.45)}.pi.warn .pi-ic{background:rgba(245,158,11,.15)}.pi.warn b{color:var(--amber)}
      .pi.danger{border-color:rgba(239,68,68,.45)}.pi.danger .pi-ic{background:rgba(239,68,68,.15)}.pi.danger b{color:var(--red)}
    `;
    document.head.appendChild(st);
  }

  const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const fav = Store.isFavorite(p.id);

  // O'xshash mahsulotlar — shu kategoriyadan, joriy mahsulotsiz
  const similar = Store.productsByCategory(p.category)
    .filter((x) => x.id !== p.id)
    .slice(0, 8);

  // Sevimli tugmasi (appbar o'ngida)
  const favBtnHTML = `<button class="icon-btn" data-favtop aria-label="Sevimli" style="${fav ? "color:#ef4444" : ""}">${ICONS.heart}</button>`;

  // Stock holati
  let stockHTML = "";
  if (p.stock <= 0) {
    stockHTML = `<div class="pdp-stock low">⚠️ Hozircha tugagan</div>`;
  } else if (p.stock <= 5) {
    stockHTML = `<div class="pdp-stock low">⚠️ Faqat ${p.stock} dona qoldi</div>`;
  } else {
    stockHTML = `<div class="pdp-stock ok">Sotuvda bor ✓</div>`;
  }

  // Yaroqlilik muddati + qo'shimcha ma'lumotlar paneli
  const cat = (DATA.categories || []).find((c) => c.id === p.category);
  const dleft = DATA.daysLeft ? DATA.daysLeft(p.expiry) : null;
  const expCls = dleft == null ? "" : dleft <= 0 ? "danger" : dleft <= 3 ? "warn" : "";
  const expExtra = dleft == null ? "" : dleft <= 0 ? " · muddati o'tgan" : ` · ${dleft} kun qoldi`;
  const infoHTML = `
    <div class="pdp-info">
      <div class="pi ${expCls}"><span class="pi-ic">📅</span><div><small>Yaroqlilik muddati</small><b>${p.expiry || "—"}${expExtra}</b></div></div>
      <div class="pi"><span class="pi-ic">${cat ? cat.icon : "🏷️"}</span><div><small>Kategoriya</small><b>${cat ? cat.name : p.category}</b></div></div>
      <div class="pi"><span class="pi-ic">⚖️</span><div><small>O'lcham birligi</small><b>${p.unit}</b></div></div>
      <div class="pi"><span class="pi-ic">📦</span><div><small>Zaxirada</small><b>${p.stock} dona</b></div></div>
    </div>`;

  root.innerHTML = `
    ${Components.appbar({ back: true, title: "", rightHTML: favBtnHTML })}

    <div class="pdp-hero" style="${Components.thumbStyle(p)}">
      ${disc ? `<span class="discount-badge">-${disc}%</span>` : ""}
      <span class="pdp-emoji">${p.emoji}</span>
      ${p.image ? `<img class="pdp-img" src="${p.image}" alt="${p.name}" onerror="this.remove()" />` : ""}
    </div>

    <div class="view-pad" style="padding-top:0;padding-bottom:120px">
      <h1 class="pdp-title">${p.name}</h1>

      <div class="pdp-meta">
        <span>${p.unit}</span>
        <span>·</span>
        <span class="rating">${ICONS.star} ${p.rating}</span>
        <span>·</span>
        <span>${UI.fmt(p.sold)} marta sotilgan</span>
      </div>

      <div class="pdp-price">
        <span class="now">${UI.sum(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${UI.fmt(p.oldPrice)}</span>` : ""}
        ${disc ? `<span class="pdp-disc">-${disc}%</span>` : ""}
      </div>

      ${stockHTML}

      ${infoHTML}

      <div class="section" style="margin-top:22px">
        <div class="section-head"><div class="section-title">Tavsif</div></div>
        <p class="pdp-desc">${p.desc}</p>
      </div>

      ${similar.length ? `
      <div class="section" style="margin-top:8px">
        <div class="section-head"><div class="section-title">O'xshash mahsulotlar</div></div>
      </div>
      <div class="hscroll">
        ${similar.map((x) => Components.productCard(x)).join("")}
      </div>` : ""}
    </div>

    <div class="dock pdp-dock">
      <div class="stepper" id="pdpStep">
        <button class="minus" data-dec aria-label="Kamaytirish">${ICONS.minus}</button>
        <b id="pdpQty">1</b>
        <button class="plus" data-inc aria-label="Ko'paytirish">${ICONS.plus}</button>
      </div>
      <button class="btn btn--primary pdp-add" id="pdpAdd">
        ${ICONS.cart}<span id="pdpAddLabel">Savatga · ${UI.sum(p.price)}</span>
      </button>
    </div>
  `;

  Components.bindBack(root);
  // O'xshash mahsulot kartalariga add/fav/ochish hodisalarini ulash
  if (similar.length) Components.bindProducts(root);

  // --- Sevimli tugmasi (appbar) ---
  const favTop = root.querySelector("[data-favtop]");
  favTop.onclick = () => {
    Store.toggleFavorite(p.id);
    favTop.style.color = Store.isFavorite(p.id) ? "#ef4444" : "";
  };

  // --- Miqdor (qty) boshqaruvi ---
  let qty = 1;
  const qtyEl = root.querySelector("#pdpQty");
  const labelEl = root.querySelector("#pdpAddLabel");
  const thumb = root.querySelector(".pdp-hero");

  function syncQty() {
    qtyEl.textContent = qty;
    labelEl.textContent = `Savatga · ${UI.sum(p.price * qty)}`;
  }

  root.querySelector("[data-dec]").onclick = () => {
    if (qty > 1) { qty--; syncQty(); }
  };
  root.querySelector("[data-inc]").onclick = () => {
    qty++; syncQty();
  };

  // --- Savatga qo'shish ---
  root.querySelector("#pdpAdd").onclick = () => {
    Store.addToCart(p.id, qty);
    UI.flyToCart(thumb, p.emoji);
    UI.toast(`${p.name} (${qty} ${p.unit}) savatga qo'shildi`, "ok");
  };
};
