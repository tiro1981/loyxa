/* Bosh sahifa (home tab) — manzil header, qidiruv, reklama karuseli,
   kategoriya chiplari, chegirmalar va mashhur mahsulotlar. */
window.Views = window.Views || {};

window.Views.home = function (root) {
  // Joriy (asosiy) manzil — header chap blokida ko'rsatiladi
  const addr = Store.defaultAddress();
  const addrLabel = addr ? addr.label : "Manzil";
  // Manzil matnini qisqartirib chiqaramiz (juda uzun bo'lmasin)
  let addrText = addr ? addr.text : "Tanlanmagan";
  if (addrText.length > 22) addrText = addrText.slice(0, 22).trim() + "…";

  const cats = DATA.categories || [];
  const deals = (DATA.products || []).filter((p) => p.oldPrice);

  // Mashhur mahsulotlar avval, keyin qolganlari (takrorsiz)
  const all = DATA.products || [];
  const popularFirst = all.slice().sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));

  // --- HTML ---
  root.innerHTML = `
    <header class="appbar">
      <div class="location">
        <small>Yetkazib berish</small>
        <b>${ICONS.pin} ${addrLabel}, ${addrText}</b>
      </div>
      <div class="spacer"></div>
      <button class="icon-btn" data-go-fav aria-label="Sevimlilar">${ICONS.heart}</button>
      <button class="icon-btn" data-go-bell aria-label="Bildirishnomalar">
        ${ICONS.bell}<span class="dot"></span>
      </button>
    </header>

    <div class="view-pad">
      <div class="searchbar" data-search role="button" tabindex="0">
        ${ICONS.search}
        <input type="text" placeholder="Mahsulot qidirish..." readonly />
      </div>

      <div class="chips">
        ${cats.map((c) => `
          <button class="chip" data-cat="${c.id}">
            <span class="ic">${c.icon}</span>${c.name}
          </button>`).join("")}
      </div>

      ${deals.length ? `
      <section class="section">
        <div class="section-head">
          <div class="section-title">🔥 Chegirmalar</div>
          <button class="link" data-cat="all">Hammasi</button>
        </div>
        <div class="hscroll">
          ${deals.map((p) => Components.productCard(p)).join("")}
        </div>
      </section>` : ""}

      <section class="section">
        <div class="section-head">
          <div class="section-title">⭐ Mashhur mahsulotlar</div>
        </div>
        <div class="product-grid stagger">
          ${popularFirst.map((p) => Components.productCard(p)).join("")}
        </div>
      </section>
    </div>
  `;

  // --- Hodisalarni ulash ---

  // Barcha mahsulot kartalari (add/fav/ochish) — bir marta root'ga
  Components.bindProducts(root);

  // Header iconlari
  const favBtn = root.querySelector("[data-go-fav]");
  if (favBtn) favBtn.onclick = () => UI.go("favorites");
  const bellBtn = root.querySelector("[data-go-bell]");
  if (bellBtn) bellBtn.onclick = () => UI.toast("Yangi bildirishnomalar yo'q", "info");

  // Qidiruv — tugma kabi, bosilsa category'ga fokus bilan o'tamiz
  const sb = root.querySelector("[data-search]");
  if (sb) {
    const openSearch = () => UI.go("category", { focus: true });
    sb.addEventListener("click", openSearch);
    const inp = sb.querySelector("input");
    if (inp) inp.addEventListener("focus", openSearch);
  }

  // Kategoriya chiplari va "Hammasi" linklari
  root.querySelectorAll("[data-cat]").forEach((el) => {
    el.onclick = () => {
      const cat = el.dataset.cat;
      if (cat === "all") UI.go("category", { cat: "all" });
      else UI.go("category", { cat });
    };
  });

};
