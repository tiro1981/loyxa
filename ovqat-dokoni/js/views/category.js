/* ============================================================
   OVQAT DOKONI — category view
   Mahsulotlar ro'yxati / qidiruv sahifasi.
   params: { cat, q, focus }
     cat   — boshlang'ich kategoriya (all|meva|...)
     q     — boshlang'ich qidiruv matni
     focus — true bo'lsa qidiruv input'iga fokus
   ============================================================ */
window.Views = window.Views || {};

window.Views.category = function (root, params) {
  params = params || {};

  // Ichki holat (UI.go ishlatmaymiz — holat shu yerda saqlanadi)
  let cur = params.cat || "all";
  let q = (params.q || "").trim();

  // --- appbar sarlavhasi ---
  function titleFor() {
    if (q) return "Qidiruv";
    const c = DATA.categories.find((x) => x.id === cur);
    if (!cur || cur === "all") return "Barcha mahsulotlar";
    return c ? c.name : "Mahsulotlar";
  }

  // --- savat tugmasi (o'ng tomonda) ---
  function cartBtn() {
    const n = Store.cartCount();
    return `
      <button class="icon-btn" data-cart aria-label="Savat">
        ${ICONS.cart}
        ${n ? `<span class="count-badge">${n}</span>` : ""}
      </button>`;
  }

  // --- kategoriya chiplari ---
  function chipsHTML() {
    return DATA.categories
      .map(
        (c) => `
        <button class="chip ${c.id === cur ? "is-active" : ""}" data-cat="${c.id}">
          <span class="ic">${c.icon}</span>${c.name}
        </button>`
      )
      .join("");
  }

  // --- joriy filtr bo'yicha mahsulotlar (kategoriya ∩ qidiruv) ---
  function currentProducts() {
    const byCat = Store.productsByCategory(cur);
    const term = q.trim().toLowerCase();
    if (!term) return byCat;
    return byCat.filter((p) => p.name.toLowerCase().includes(term));
  }

  // --- faqat grid qismini render qilish ---
  function renderGrid() {
    const grid = root.querySelector("#catGrid");
    if (!grid) return;
    const list = currentProducts();

    // sarlavhada "N ta mahsulot"
    const countEl = root.querySelector("#catCount");
    if (countEl) countEl.textContent = `${list.length} ta mahsulot`;

    if (!list.length) {
      grid.classList.remove("product-grid");
      grid.innerHTML = Components.emptyState({
        emoji: "🔍",
        title: "Hech narsa topilmadi",
        text: "Boshqa kalit so'z yoki kategoriyani sinab ko'ring.",
      });
      return;
    }

    grid.classList.add("product-grid");
    grid.innerHTML = list.map((p) => Components.productCard(p)).join("");
  }

  // --- chiplar faol holatini yangilash ---
  function syncChips() {
    root.querySelectorAll(".chip[data-cat]").forEach((ch) => {
      ch.classList.toggle("is-active", ch.dataset.cat === cur);
    });
  }

  // --- appbar sarlavhasini yangilash ---
  function syncTitle() {
    const t = root.querySelector(".appbar-title");
    if (t) t.textContent = titleFor();
  }

  // ===== Dastlabki render =====
  root.innerHTML = `
    ${Components.appbar({ title: titleFor(), back: true, rightHTML: cartBtn() })}
    <div class="view-pad">
      <div class="searchbar">
        ${ICONS.search}
        <input id="catSearch" type="text" inputmode="search"
               placeholder="Mahsulot qidirish..." value="${q.replace(/"/g, "&quot;")}" />
      </div>

      <div class="chips hscroll" id="catChips">${chipsHTML()}</div>

      <div class="section-head" style="margin-top:4px">
        <small id="catCount" style="color:var(--text-2);font-size:13px"></small>
      </div>

      <div id="catGrid" class="product-grid stagger"></div>
    </div>`;

  // Birinchi grid
  renderGrid();

  // ===== Hodisalar =====
  Components.bindBack(root);

  // Product kartalariga add/fav/ochish (delegatsiya root'da — bir marta yetarli)
  Components.bindProducts(root);

  // Savat tugmasi
  const cBtn = root.querySelector("[data-cart]");
  if (cBtn) cBtn.onclick = () => UI.go("cart");

  // Qidiruv — jonli filtr (faqat grid qayta render)
  const input = root.querySelector("#catSearch");
  if (input) {
    input.addEventListener("input", () => {
      q = input.value;
      renderGrid();
      syncTitle();
    });
    if (params.focus) {
      // render tugagach fokus
      setTimeout(() => input.focus());
    }
  }

  // Chiplar — kategoriya almashtirgich (UI.go yo'q, ichki holat)
  const chips = root.querySelector("#catChips");
  if (chips) {
    chips.addEventListener("click", (e) => {
      const ch = e.target.closest(".chip[data-cat]");
      if (!ch) return;
      cur = ch.dataset.cat;
      syncChips();
      renderGrid();
      syncTitle();
    });
  }
};
