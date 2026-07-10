/* Profil ekrani (profile tab) — foydalanuvchi kartasi, statistika,
   tezkor amallar (qgrid) va sozlamalar ro'yxati. */
window.Views = window.Views || {};

window.Views.profile = function (root) {
  // Foydalanuvchi va statistik ma'lumotlar
  const u = Store.user;
  const ordersCount = Store.getMyOrders().length;
  const favCount = Store.getFavorites().length;
  const bonus = UI.fmt(u.bonus);
  const isDark = Store.theme === "dark";

  // --- HTML ---
  root.innerHTML = `
    <header class="appbar">
      <div class="appbar-title">Profil</div>
      <div class="spacer"></div>
    </header>

    <!-- Foydalanuvchi kartasi (yashil gradient) -->
    <div class="profile-hero">
      <div class="profile-card">
        <div class="profile-row">
          <div class="avatar">${u.avatar}</div>
          <div>
            <div class="pname">${u.name}</div>
            <div class="pphone">${u.phone}</div>
          </div>
          <button class="profile-edit" id="pf-edit" aria-label="Tahrirlash">${ICONS.edit}</button>
        </div>
        <div class="pstats">
          <div class="ps"><b id="pf-orders">${ordersCount}</b><small>Buyurtmalar</small></div>
          <div class="ps"><b id="pf-fav">${favCount}</b><small>Sevimli</small></div>
          <div class="ps"><b id="pf-bonus">${bonus}</b><small>Bonus</small></div>
        </div>
      </div>
    </div>

    <!-- Tezkor amallar -->
    <section class="section view-pad">
      <div class="qgrid stagger">
        <div class="qcard" data-go="favorites">
          <div class="qic" style="background:linear-gradient(135deg,#22c55e,#ec4899)">${ICONS.heart}</div>
          <b>Sevimlilar</b>
          <small>Yoqtirgan taomlar</small>
        </div>

        <div class="qcard" data-go="addresses">
          <div class="qic" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">${ICONS.location}</div>
          <b>Manzillarim</b>
          <small>Yetkazish manzillari</small>
        </div>

        <div class="qcard" data-go="payments">
          <div class="qic" style="background:linear-gradient(135deg,#f97316,#ea580c)">${ICONS.card}</div>
          <b>To'lov usullari</b>
          <small>Naqd, karta, Click, Payme</small>
        </div>

        <div class="qcard" id="pf-theme">
          <div class="qic" style="background:linear-gradient(135deg,#6366f1,#4f46e5)">${ICONS.moon}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <b>Tungi rejim</b>
            <span class="toggle${isDark ? " on" : ""}" id="pf-toggle"></span>
          </div>
          <small>Qorong'i ko'rinish</small>
        </div>
      </div>
    </section>

    <!-- Sozlamalar ro'yxati -->
    <section class="section view-pad">
      <div class="list stagger">
        <div class="list-row" data-go="chat">
          <div class="row-icon" style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">${ICONS.chat}</div>
          <div class="row-text">
            <div class="row-title">Admin bilan chat</div>
            <div class="row-sub">Savol va murojaat</div>
          </div>
          <span class="chevron">${ICONS.chevron}</span>
        </div>

        <div class="list-row" data-go="help">
          <div class="row-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">${ICONS.help}</div>
          <div class="row-text">
            <div class="row-title">Yordam</div>
            <div class="row-sub">Tez-tez so'raladigan savollar</div>
          </div>
          <span class="chevron">${ICONS.chevron}</span>
        </div>

        <div class="list-row" data-go="privacy">
          <div class="row-icon" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">${ICONS.shield}</div>
          <div class="row-text">
            <div class="row-title">Maxfiylik</div>
            <div class="row-sub">Hisob xavfsizligi</div>
          </div>
          <span class="chevron">${ICONS.chevron}</span>
        </div>

        <div class="list-row" id="pf-logout">
          <div class="row-icon" style="background:linear-gradient(135deg,#ef4444,#dc2626)">${ICONS.logout}</div>
          <div class="row-text">
            <div class="row-title" style="color:#ef4444">Chiqish</div>
            <div class="row-sub">Hisobdan chiqish</div>
          </div>
          <span class="chevron">${ICONS.chevron}</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:20px;font-size:12px;color:var(--text-3)">
        Ovqat Dokoni · v1.0.0
      </div>
    </section>
  `;

  // --- Hodisalarni ulash ---

  // Tezkor amallar va sozlamalar — data-go bilan ko'rsatilgan view'ga o'tish
  root.querySelectorAll("[data-go]").forEach((el) => {
    el.onclick = () => UI.go(el.dataset.go);
  });

  // Profilni tahrirlash — sheet ichida forma
  const editBtn = root.querySelector("#pf-edit");
  if (editBtn) {
    editBtn.onclick = () => {
      UI.sheet(
        `<div class="field">
           <label>Ism</label>
           <input class="input" id="pe-name" value="${u.name}" placeholder="Ismingiz">
         </div>
         <div class="field">
           <label>Telefon</label>
           <input class="input" id="pe-phone" value="${u.phone}" placeholder="+998 90 000 00 00">
         </div>
         <button class="btn btn--primary btn--block" id="pe-save" style="margin-top:6px">Saqlash</button>`,
        { title: "Profilni tahrirlash" }
      );
      document.getElementById("pe-save").onclick = () => {
        const name = (document.getElementById("pe-name").value || "").trim();
        const phone = (document.getElementById("pe-phone").value || "").trim();
        if (!name || !phone) {
          UI.toast("Barcha maydonlarni to'ldiring", "err");
          return;
        }
        Store.updateUser({ name, phone });
        UI.closeSheet();
        UI.toast("Profil yangilandi", "ok");
        // View'ni qayta render qilamiz (yangi ism/telefon ko'rinsin)
        Views.profile(root);
      };
    };
  }

  // Tungi rejim — toggle (butun view'ni qayta render qilmasdan)
  const themeCard = root.querySelector("#pf-theme");
  const toggle = root.querySelector("#pf-toggle");
  if (themeCard && toggle) {
    themeCard.onclick = () => {
      Store.toggleTheme();
      toggle.classList.toggle("on", Store.theme === "dark");
    };
  }

  // Chiqish — tasdiqlash oynasi
  const logout = root.querySelector("#pf-logout");
  if (logout) {
    logout.onclick = () => {
      UI.confirm({
        danger: true,
        title: "Chiqish",
        text: "Hisobdan chiqmoqchimisiz?",
        okText: "Chiqish",
        cancelText: "Bekor qilish",
        onOk: () => UI.toast("Hisobdan chiqdingiz", "info"),
      });
    };
  }
};
