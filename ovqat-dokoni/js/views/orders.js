/* ============================================================
   OVQAT DOKONI — Buyurtmalar ko'rinishi (orders)
   Views.orders(root) — buyurtmalar ro'yxati: "Faol" va "Tarix" tablari.
   Ilova orders:change hodisasida butun view'ni qayta render qiladi.
   ============================================================ */
window.Views = window.Views || {};

window.Views.orders = function (root, params) {
  // Joriy tab ichki o'zgaruvchida saqlanadi: 'active' (faol) yoki 'history' (tarix)
  let tab = "active";

  // Status -> matn va klass
  const STATUS = {
    pending:   { label: "Tayyorlanmoqda", cls: "status-pending" },
    ontheway:  { label: "Yo'lda",         cls: "status-ontheway" },
    done:      { label: "Yetkazildi",     cls: "status-done" },
    cancel:    { label: "Bekor qilingan", cls: "status-cancel" },
  };

  // Timeline qadamlari (4 ta)
  const STEPS = [
    { label: "Qabul qilindi",  icon: ICONS.box },
    { label: "Tayyorlanmoqda", icon: ICONS.clock },
    { label: "Yo'lda",         icon: ICONS.truck },
    { label: "Yetkazildi",     icon: ICONS.check },
  ];

  const isActive  = (o) => o.status === "pending" || o.status === "ontheway";
  const isHistory = (o) => o.status === "done"    || o.status === "cancel";

  // --- Maxsus CSS (faqat bir marta qo'shiladi) ---
  if (!document.getElementById("orders-css")) {
    const style = document.createElement("style");
    style.id = "orders-css";
    style.textContent = `
      .orders-seg { display: flex; gap: 10px; padding: 2px var(--sp-4) 6px; }
      .orders-seg .chip { flex: 1; justify-content: center; }
      .sheet-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
      .si-row { display: flex; align-items: center; gap: 12px; }
      .si-emoji { width: 40px; height: 40px; border-radius: 10px; background: var(--surface-2); display: grid; place-items: center; font-size: 20px; flex-shrink: 0; }
      .si-name { font-size: 14px; font-weight: 700; }
      .si-qty { font-size: 12.5px; color: var(--text-3); margin-top: 1px; }
      .si-price { margin-left: auto; font-size: 14px; font-weight: 800; }
      .sheet-meta { display: flex; flex-direction: column; gap: 12px; padding-top: 14px; border-top: 1px solid var(--border); }
      .sm-row { display: flex; align-items: flex-start; gap: 10px; }
      .sm-ic { color: var(--text-3); flex-shrink: 0; margin-top: 1px; }
      .sm-ic svg { width: 17px; }
      .sm-label { font-size: 12px; color: var(--text-3); }
      .sm-val { font-size: 14px; font-weight: 700; margin-top: 1px; }
      .sheet-total { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
      .sheet-total b { font-size: 18px; font-weight: 900; }
    `;
    document.head.appendChild(style);
  }

  // --- Bir buyurtma kartasi HTML ---
  function orderCard(o) {
    const st = STATUS[o.status] || STATUS.pending;

    // Faol buyurtmalar uchun timeline
    let track = "";
    if (isActive(o)) {
      // pending -> 2-qadam active (index 1); ontheway -> 3-qadam active (index 2)
      const activeIdx = o.status === "pending" ? 1 : 2;
      let html = "";
      STEPS.forEach((s, i) => {
        const cls = i < activeIdx ? "done" : i === activeIdx ? "active" : "";
        if (i > 0) {
          // Oldingi qadam tugagan bo'lsa bar to'ldiriladi
          const fill = i <= activeIdx ? "fill" : "";
          html += `<div class="bar ${fill}"></div>`;
        }
        html += `
          <div class="step ${cls}">
            <span class="dot">${s.icon}</span>
            <small>${s.label}</small>
          </div>`;
      });
      track = `<div class="otrack">${html}</div>`;
    }

    // Mahsulot emojilari (4 tagacha, ortig'i "+N")
    const emojis = o.items.map((it) => { const p = Store.product(it.id); return p ? p.emoji : "📦"; });
    const shown = emojis.slice(0, 4).map((e) => `<span>${e}</span>`).join("");
    const extra = emojis.length > 4 ? `<span>+${emojis.length - 4}</span>` : "";

    // Jami mahsulot soni
    const count = o.items.reduce((n, it) => n + it.qty, 0);

    return `
      <article class="order-card" data-order="${o.id}">
        <div class="order-top">
          <div>
            <div class="order-id">Buyurtma #${o.id}</div>
            <div class="order-date">${o.date}</div>
          </div>
          <span class="status-pill ${st.cls}">${st.label}</span>
        </div>
        ${track}
        <div class="order-emojis">${shown}${extra}</div>
        <div class="order-foot">
          <span class="o-count">Jami ${count} ta mahsulot</span>
          <span class="o-total">${UI.sum(o.total)}</span>
        </div>
      </article>`;
  }

  // --- Ro'yxatni chizish (faqat list qismi qayta chiziladi) ---
  function renderList() {
    const wrap = root.querySelector("#ordersList");
    if (!wrap) return;

    const orders = Store.getMyOrders().filter(tab === "active" ? isActive : isHistory);

    if (!orders.length) {
      wrap.innerHTML = Components.emptyState({
        emoji: tab === "active" ? "📦" : "🧾",
        title: tab === "active" ? "Faol buyurtma yo'q" : "Tarix bo'sh",
        text: tab === "active"
          ? "Hozircha jarayondagi buyurtmangiz yo'q."
          : "Yakunlangan buyurtmalar bu yerda ko'rinadi.",
        btn: { label: "Xarid qilish", onClick: () => UI.go("home") },
      });
      return;
    }

    wrap.innerHTML = `<div class="list stagger">${orders.map(orderCard).join("")}</div>`;
  }

  // --- Buyurtma tafsilotlari (sheet) ---
  function openDetails(o) {
    const st = STATUS[o.status] || STATUS.pending;
    const pm = DATA.paymentMethods.find((m) => m.id === o.payment);
    const payName = pm ? pm.name : o.payment;

    // Mahsulotlar ro'yxati
    const itemsHTML = o.items.map((it) => {
      const p = Store.product(it.id);
      if (!p) return "";
      return `
        <div class="si-row">
          <span class="si-emoji">${p.emoji}</span>
          <div style="min-width:0">
            <div class="si-name">${p.name}</div>
            <div class="si-qty">${p.unit} · x${it.qty}</div>
          </div>
          <span class="si-price">${UI.sum(p.price * it.qty)}</span>
        </div>`;
    }).join("");

    UI.sheet(`
      <div style="margin-bottom:14px">
        <span class="status-pill ${st.cls}">${st.label}</span>
      </div>
      <div class="sheet-items">${itemsHTML}</div>
      <div class="sheet-meta">
        <div class="sm-row">
          <span class="sm-ic">${ICONS.location}</span>
          <div>
            <div class="sm-label">Yetkazish manzili</div>
            <div class="sm-val">${o.address || "—"}</div>
          </div>
        </div>
        <div class="sm-row">
          <span class="sm-ic">${ICONS.card}</span>
          <div>
            <div class="sm-label">To'lov usuli</div>
            <div class="sm-val">${payName}</div>
          </div>
        </div>
      </div>
      <div class="sheet-total">
        <span style="color:var(--text-2);font-weight:700">Jami</span>
        <b>${UI.sum(o.total)}</b>
      </div>
    `, { title: "Buyurtma #" + o.id });
  }

  // --- Boshlang'ich HTML ---
  root.innerHTML = `
    ${Components.appbar({ title: "Buyurtmalarim" })}
    <div class="orders-seg">
      <button class="chip is-active" data-tab="active">Faol</button>
      <button class="chip" data-tab="history">Tarix</button>
    </div>
    <div class="view-pad section">
      <div id="ordersList"></div>
    </div>`;

  Components.bindBack(root); // appbar back bo'lmasa ham xavfsiz

  // Tab almashish — faqat ro'yxat qayta chiziladi
  root.querySelectorAll(".orders-seg .chip").forEach((btn) => {
    btn.onclick = () => {
      tab = btn.dataset.tab;
      root.querySelectorAll(".orders-seg .chip").forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
      renderList();
    };
  });

  // Kartaga bosilganda tafsilotlar
  root.querySelector("#ordersList").addEventListener("click", (e) => {
    const card = e.target.closest(".order-card");
    if (!card) return;
    const o = Store.getMyOrders().find((x) => x.id === card.dataset.order);
    if (o) openDetails(o);
  });

  renderList();
};
