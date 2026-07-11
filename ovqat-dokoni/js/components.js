/* ============================================================
   OVQAT DOKONI — Shared render helpers (used by every view)
     Components.appbar({title, back, sub, rightHTML})
     Components.productCard(product)            -> HTML string
     Components.bindProducts(root)              -> wires add/fav/open for all cards in root
     Components.emptyState({emoji, title, text, btn:{label, onClick}})
     Components.money(n) / Components.thumb(p)
   ============================================================ */
window.Components = (function () {
  const money = (n) => UI.sum(n);

  function appbar({ title = "", sub = "", back = false, rightHTML = "" }) {
    return `
      <header class="appbar">
        ${back ? `<button class="icon-btn" data-back>${ICONS.back}</button>` : ""}
        <div style="min-width:0">
          <div class="appbar-title">${title}</div>
          ${sub ? `<div class="appbar-sub">${sub}</div>` : ""}
        </div>
        <div class="spacer"></div>
        ${rightHTML}
      </header>`;
  }

  function thumbStyle(p) {
    return `background:linear-gradient(135deg, ${hex(p.grad[0], .22)}, ${hex(p.grad[1], .12)});`;
  }
  function hex(h, a) {
    const n = parseInt(h.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function productCard(p) {
    const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const fav = Store.isFavorite(p.id);
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-thumb" style="${thumbStyle(p)}">
          ${disc ? `<span class="discount-badge">-${disc}%</span>` : ""}
          <button class="fav-btn ${fav ? "is-fav" : ""}" data-fav aria-label="Sevimli">${ICONS.heart}</button>
          <span class="p-emoji">${p.emoji}</span>
          ${p.image ? `<img class="p-img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.remove()" />` : ""}
        </div>
        <div class="product-body">
          <div class="product-name">${p.name}</div>
          <div class="product-unit">${p.unit} · <span class="rating">${ICONS.star} ${p.rating}</span></div>
          <div class="product-foot">
            <div class="price">
              ${p.oldPrice ? `<span class="price-old">${UI.fmt(p.oldPrice)}</span>` : ""}
              ${UI.fmt(p.price)} <small>so'm</small>
            </div>
            <button class="add-btn" data-add aria-label="Savatga">${ICONS.plus}</button>
          </div>
        </div>
      </article>`;
  }

  /* delegated handlers for any container holding product cards */
  function bindProducts(root) {
    root.addEventListener("click", (e) => {
      const card = e.target.closest(".product-card");
      if (!card) return;
      const id = Number(card.dataset.id);

      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        e.stopPropagation();
        Store.addToCart(id, 1);
        const p = Store.product(id);
        addBtn.classList.remove("added"); void addBtn.offsetWidth; addBtn.classList.add("added");
        UI.flyToCart(card.querySelector(".product-thumb"), p.emoji);
        UI.toast(`${p.name} savatga qo'shildi`, "ok");
        return;
      }
      const favBtn = e.target.closest("[data-fav]");
      if (favBtn) {
        e.stopPropagation();
        Store.toggleFavorite(id);
        favBtn.classList.toggle("is-fav", Store.isFavorite(id));
        return;
      }
      UI.go("product", { id });
    });
  }

  function emptyState({ emoji = "🤷", title = "", text = "", btn }) {
    const id = "es" + Math.random().toString(36).slice(2, 7);
    setTimeout(() => {
      if (btn) { const b = document.getElementById(id); if (b) b.onclick = btn.onClick; }
    });
    return `
      <div class="empty">
        <div class="e-emoji">${emoji}</div>
        <h3>${title}</h3>
        <p>${text}</p>
        ${btn ? `<button class="btn btn--primary" id="${id}" style="margin-top:14px;padding:0 28px">${btn.label}</button>` : ""}
      </div>`;
  }

  /* wire any [data-back] buttons inside root */
  function bindBack(root) {
    root.querySelectorAll("[data-back]").forEach((b) => (b.onclick = () => UI.back()));
  }

  return { appbar, productCard, bindProducts, emptyState, bindBack, money, thumbStyle };
})();
