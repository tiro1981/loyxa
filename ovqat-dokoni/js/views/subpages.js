/* ============================================================
   OVQAT DOKONI — Ichki sahifalar (subpages)
   Bitta faylda 6 ta view:
     Views.favorites  — sevimli mahsulotlar
     Views.addresses  — yetkazib berish manzillari
     Views.payments   — to'lov usullari (ma'lumot)
     Views.chat       — admin bilan chat (mock)
     Views.help       — FAQ akkordeon
     Views.privacy    — maxfiylik sozlamalari
   Hammasi appbar({back:true}) va bindBack(root) ishlatadi.
   ============================================================ */
window.Views = window.Views || {};

/* ------------------------------------------------------------
   1) SEVIMLILAR
   Ilova favorites:change hodisasida bu view'ni qayta render qiladi,
   shuning uchun toggle handlerlar faqat Store'ni chaqiradi.
------------------------------------------------------------ */
window.Views.favorites = function (root) {
  const favs = Store.getFavorites();

  const header = Components.appbar({
    title: "Sevimlilar",
    sub: favs.length ? favs.length + " ta mahsulot" : "",
    back: true,
  });

  // Bo'sh holat
  if (!favs.length) {
    root.innerHTML = header + Components.emptyState({
      emoji: "❤️",
      title: "Sevimlilar bo'sh",
      text: "Mahsulot kartasidagi yurakcha orqali qo'shing",
      btn: { label: "Mahsulotlar", onClick: () => UI.go("home") },
    });
    Components.bindBack(root);
    return;
  }

  // Mahsulot to'ri
  root.innerHTML = header + `
    <div class="view-pad">
      <div class="product-grid stagger">
        ${favs.map((p) => Components.productCard(p)).join("")}
      </div>
    </div>`;

  Components.bindBack(root);
  Components.bindProducts(root);
};

/* ------------------------------------------------------------
   2) MANZILLARIM
   address:change da Store.on ishlatmaymiz — har o'zgarishdan keyin
   ichki render() funksiyasini qayta chaqiramiz (stack toza qoladi).
------------------------------------------------------------ */
window.Views.addresses = function (root) {

  // Yangi manzil qo'shish sheet'i — saqlangach ro'yxatni qayta chizadi
  function openAddSheet() {
    UI.sheet(
      '<div class="field"><label>Nomi (Uy / Ish)</label>' +
        '<input class="input" id="na-label" placeholder="Masalan: Uy"></div>' +
      // Avtomatik manzil: viloyat -> tuman (ro'yxat) + qishloq/uy/izoh (qo'lda) — umumiy UzAddress komponenti
      UzAddress.formHTML({ idPrefix: "na" }) +
      '<button class="btn btn--primary btn--block" id="na-save" style="margin-top:6px">Saqlash</button>',
      { title: "Yangi manzil" }
    );
    // Viloyat tanlanganda tumanlar to'ldirilsin (sheet DOM'ga qo'yilgandan keyin)
    UzAddress.bind(document, { idPrefix: "na" });
    document.getElementById("na-save").onclick = function () {
      const label = (document.getElementById("na-label").value || "").trim();
      const addr = UzAddress.read(document, { idPrefix: "na" });
      if (!label || !addr) {
        UI.toast("Nomi, viloyat, tuman va uy raqamini to'ldiring", "err");
        return;
      }
      Store.addAddress({ label: label, icon: "📍", text: addr.text,
        region: addr.region, district: addr.district, village: addr.village, house: addr.house, note: addr.note });
      UI.closeSheet();
      UI.toast("Manzil qo'shildi", "ok");
      render();
    };
  }

  // Asosiy chizish funksiyasi
  function render() {
    const list = Store.getAddresses();

    const header = Components.appbar({
      title: "Manzillarim",
      back: true,
      rightHTML: '<button class="icon-btn" id="addr-add">' + ICONS.plus + "</button>",
    });

    // Bo'sh holat
    if (!list.length) {
      root.innerHTML = header + Components.emptyState({
        emoji: "📍",
        title: "Manzil yo'q",
        text: "Yetkazib berish uchun manzil qo'shing",
        btn: { label: "Manzil qo'shish", onClick: openAddSheet },
      });
      Components.bindBack(root);
      root.querySelector("#addr-add").onclick = openAddSheet;
      return;
    }

    // Manzillar ro'yxati
    const rowsHTML = list.map((a) => `
      <div class="list-row addr-pick" data-id="${a.id}">
        <div class="row-icon" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff">${a.icon || "📍"}</div>
        <div class="row-text">
          <div class="row-title">
            ${a.label}
            ${a.isDefault ? '<span style="margin-left:8px;font-size:11px;font-weight:700;color:var(--green);background:rgba(34,197,94,.14);padding:2px 8px;border-radius:var(--r-pill)">Asosiy</span>' : ""}
          </div>
          <div class="row-sub">${a.text}</div>
        </div>
        <button class="icon-btn addr-del" data-id="${a.id}" aria-label="O'chirish">${ICONS.trash}</button>
      </div>`).join("");

    root.innerHTML = header + `
      <div class="view-pad">
        <div class="list stagger">${rowsHTML}</div>
        <button class="btn btn--ghost btn--block" id="addr-new" style="margin-top:14px">＋ Yangi manzil qo'shish</button>
      </div>`;

    Components.bindBack(root);

    // Plus tugmasi (appbar) + pastdagi tugma
    root.querySelector("#addr-add").onclick = openAddSheet;
    root.querySelector("#addr-new").onclick = openAddSheet;

    // O'chirish — tasdiqlash bilan (qator bosilishidan oldin to'xtatamiz)
    root.querySelectorAll(".addr-del").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        UI.confirm({
          title: "Manzilni o'chirish",
          text: "Bu manzil o'chiriladimi?",
          danger: true,
          okText: "O'chirish",
          onOk: () => {
            Store.removeAddress(id);
            UI.toast("Manzil o'chirildi", "ok");
            render();
          },
        });
      };
    });

    // Qatorni bosish — asosiy qilib belgilaymiz
    root.querySelectorAll(".addr-pick").forEach((row) => {
      row.onclick = () => {
        const id = Number(row.dataset.id);
        Store.setDefaultAddress(id);
        UI.toast("Asosiy manzil tanlandi", "ok");
        render();
      };
    });
  }

  render();
};

/* ------------------------------------------------------------
   3) TO'LOV USULLARI (ma'lumot ko'rinishi, tanlovsiz)
------------------------------------------------------------ */
window.Views.payments = function (root) {

  // Har bir usul uchun qator
  const optionsHTML = DATA.paymentMethods.map((m) => {
    const isActive = m.id === "cash";
    const logoInner = m.logo
      ? m.logo
      : '<span style="color:#fff;font-weight:700;font-size:13px">' + m.abbr + "</span>";
    const right = isActive
      ? '<span style="color:var(--green);display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600">' + ICONS.check + " Faol</span>"
      : '<span class="row-sub">Ulanmagan</span>';
    return `
      <div class="pay-option">
        <div class="pay-logo" style="background:${m.bg}">${logoInner}</div>
        <div class="pay-name"><b>${m.name}</b><small>${m.sub}</small></div>
        ${right}
      </div>`;
  }).join("");

  root.innerHTML =
    Components.appbar({ title: "To'lov usullari", back: true }) +
    `<div class="view-pad">
      <div class="list-row" style="align-items:flex-start;gap:12px">
        <div class="row-icon" style="background:linear-gradient(135deg,#475569,#1e293b);color:#fff">💳</div>
        <div class="row-text">
          <div class="row-title">Saqlangan karta yo'q</div>
          <div class="row-sub">Karta qo'shish tez orada qo'shiladi.</div>
        </div>
      </div>

      <div class="section">
        <div class="section-head"><div class="section-title">Mavjud usullar</div></div>
        <div>${optionsHTML}</div>
      </div>

      <button class="btn btn--ghost btn--block" id="pay-add" style="margin-top:8px">＋ Karta qo'shish</button>
    </div>`;

  Components.bindBack(root);

  root.querySelector("#pay-add").onclick = () =>
    UI.toast("Tez orada qo'shiladi", "info");
};

/* ------------------------------------------------------------
   4) ADMIN BILAN CHAT (mock)
------------------------------------------------------------ */
window.Views.chat = function (root) {

  // Maxsus CSS — faqat bir marta qo'shamiz
  if (!document.getElementById("chatStyle")) {
    const st = document.createElement("style");
    st.id = "chatStyle";
    st.textContent = `
      .chat-wrap{display:flex;flex-direction:column;gap:10px;padding:16px;padding-bottom:90px;}
      .bubble{max-width:78%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.4;
        word-wrap:break-word;animation:bubbleIn .26s var(--ease) both;}
      .bubble.them{align-self:flex-start;background:var(--surface-2);color:var(--text);
        border-bottom-left-radius:6px;}
      .bubble.me{align-self:flex-end;color:#04130a;font-weight:600;
        background:linear-gradient(135deg,var(--green),var(--green-600));
        border-bottom-right-radius:6px;}
      .bubble .b-time{display:block;font-size:10px;opacity:.6;margin-top:4px;}
      .chat-input{display:flex;align-items:center;gap:8px;width:100%;}
      .chat-input .searchbar{flex:1;margin:0;}
      .chat-send{flex:0 0 auto;width:48px;height:48px;border:none;border-radius:50%;cursor:pointer;
        display:flex;align-items:center;justify-content:center;color:#04130a;
        background:linear-gradient(135deg,var(--green),var(--green-600));}
      .chat-send svg{width:22px;height:22px;}
      @keyframes bubbleIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
    `;
    document.head.appendChild(st);
  }

  // Joriy vaqt (HH:MM)
  function now() {
    const d = new Date();
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  // Xabarlar umumiy "messages" (Cloud) da saqlanadi — admin ham shu yerdan o'qiydi/yozadi.
  function cloudMsgs() {
    const m = window.Cloud ? Cloud.get("messages", null) : null;
    return Array.isArray(m) ? m : [];
  }
  function saveMsgs(list) { if (window.Cloud) Cloud.set("messages", list); }

  function bubbleHTML(who, text, time) {
    return `<div class="bubble ${who}">${text}<span class="b-time">${time || now()}</span></div>`;
  }
  // Mavjud suhbat; tarix bo'sh bo'lsa — saqlanmaydigan xush kelibsiz xabari
  function renderMsgs() {
    const msgs = cloudMsgs();
    if (!msgs.length) {
      return bubbleHTML("them", "Assalomu alaykum! Sizga qanday yordam bera olaman? 😊", now())
        + bubbleHTML("them", "Buyurtma, yetkazib berish yoki to'lov bo'yicha savollaringiz bo'lsa, yozing.", now());
    }
    return msgs.map((m) => bubbleHTML(m.from === "user" ? "me" : "them", m.text, m.time)).join("");
  }

  root.innerHTML =
    Components.appbar({
      title: "Admin bilan chat",
      sub: "Onlayn · odatda 5 daqiqada javob",
      back: true,
    }) +
    `<div class="chat-wrap" id="chatWrap">${renderMsgs()}</div>
    <div class="dock">
      <div class="chat-input">
        <div class="searchbar">
          ${ICONS.chat}
          <input id="chatField" placeholder="Xabar yozing..." autocomplete="off" />
        </div>
        <button class="chat-send" id="chatSend" aria-label="Yuborish">${ICONS.chevron}</button>
      </div>
    </div>`;

  Components.bindBack(root);

  const wrap = root.querySelector("#chatWrap");
  const field = root.querySelector("#chatField");

  function toBottom() { wrap.scrollTop = wrap.scrollHeight; }

  // Yuborish — xabar umumiy "messages" ga yoziladi, admin panelда ko'rinadi (mock javob yo'q)
  function send() {
    const val = (field.value || "").trim();
    if (!val) return;
    const all = cloudMsgs();
    if (!all.length) wrap.innerHTML = "";   // xush kelibsiz xabarini tozalaymiz
    const t = now();
    all.push({ from: "user", text: val, time: t });
    saveMsgs(all);
    wrap.insertAdjacentHTML("beforeend", bubbleHTML("me", val, t));
    toBottom();
    field.value = "";
    field.focus();
  }

  root.querySelector("#chatSend").onclick = send;
  field.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  });

  toBottom();
};

/* ------------------------------------------------------------
   5) YORDAM — FAQ akkordeon
------------------------------------------------------------ */
window.Views.help = function (root) {

  // Maxsus CSS — bir marta
  if (!document.getElementById("faqStyle")) {
    const st = document.createElement("style");
    st.id = "faqStyle";
    st.textContent = `
      .faq-item{background:var(--surface);border-radius:var(--r-md);margin-bottom:10px;
        overflow:hidden;border:1px solid var(--border);}
      .faq-q{display:flex;align-items:center;gap:12px;padding:16px;cursor:pointer;
        font-weight:600;font-size:14px;color:var(--text);}
      .faq-q .chevron{margin-left:auto;flex:0 0 auto;transition:transform .26s var(--ease);
        color:var(--text-3);}
      .faq-a{max-height:0;overflow:hidden;transition:max-height .3s var(--ease);}
      .faq-a-inner{padding:0 16px 16px;font-size:13.5px;line-height:1.55;color:var(--text-2);}
      .faq-item.open .faq-a{max-height:320px;}
      .faq-item.open .chevron{transform:rotate(90deg);}
    `;
    document.head.appendChild(st);
  }

  const itemsHTML = DATA.faqs.map((f, i) => `
    <div class="faq-item" data-faq="${i}">
      <div class="faq-q">
        <span>${f.q}</span>
        <span class="chevron">${ICONS.chevron}</span>
      </div>
      <div class="faq-a"><div class="faq-a-inner">${f.a}</div></div>
    </div>`).join("");

  root.innerHTML =
    Components.appbar({ title: "Yordam", back: true }) +
    `<div class="view-pad">
      <div class="section-head"><div class="section-title">Ko'p so'raladigan savollar</div></div>
      ${itemsHTML}
      <button class="btn btn--primary btn--block" id="help-contact" style="margin-top:18px">Bog'lanish</button>
    </div>`;

  Components.bindBack(root);

  // Akkordeon — bosilganda ochiladi/yopiladi
  root.querySelectorAll(".faq-item").forEach((item) => {
    item.querySelector(".faq-q").onclick = () => {
      item.classList.toggle("open");
    };
  });

  root.querySelector("#help-contact").onclick = () => UI.go("chat");
};

/* ------------------------------------------------------------
   6) MAXFIYLIK — sozlamalar (toggle'lar)
------------------------------------------------------------ */
window.Views.privacy = function (root) {

  // Toggle qatorlari (mahalliy holat — faqat UI uchun)
  const toggles = [
    { key: "bio",       icon: "🔒", title: "Biometrik kirish",      sub: "Face ID / barmoq izi orqali",   on: true },
    { key: "push",      icon: "🔔", title: "Push bildirishnomalar", sub: "Buyurtma va aksiyalar",          on: true },
    { key: "geo",       icon: "📍", title: "Joylashuvni ulashish",  sub: "Tezroq yetkazish uchun",         on: false },
    { key: "marketing", icon: "✉️", title: "Marketing xabarlari",   sub: "Chegirma va takliflar",          on: false },
  ];

  const togglesHTML = toggles.map((t) => `
    <div class="list-row priv-toggle" data-key="${t.key}">
      <div class="row-icon">${t.icon}</div>
      <div class="row-text">
        <div class="row-title">${t.title}</div>
        <div class="row-sub">${t.sub}</div>
      </div>
      <div class="toggle ${t.on ? "on" : ""}" data-key="${t.key}"></div>
    </div>`).join("");

  root.innerHTML =
    Components.appbar({ title: "Maxfiylik", back: true }) +
    `<div class="view-pad">
      <div class="section">
        <div class="section-head"><div class="section-title">Sozlamalar</div></div>
        <div class="list">${togglesHTML}</div>
      </div>

      <div class="section">
        <div class="section-head"><div class="section-title">Xavfsizlik</div></div>
        <div class="list">
          <div class="list-row" id="priv-pass">
            <div class="row-icon" style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff">${ICONS.shield}</div>
            <div class="row-text">
              <div class="row-title">Parolni o'zgartirish</div>
              <div class="row-sub">Hisobingiz xavfsizligi</div>
            </div>
            <span class="chevron">${ICONS.chevron}</span>
          </div>
        </div>
      </div>

      <button class="btn btn--danger btn--block" id="priv-wipe" style="margin-top:8px">Barcha ma'lumotlarni o'chirish</button>
    </div>`;

  Components.bindBack(root);

  // Toggle'lar — bosilganda almashadi + toast
  root.querySelectorAll(".priv-toggle").forEach((row) => {
    row.onclick = () => {
      const tg = row.querySelector(".toggle");
      const on = tg.classList.toggle("on");
      const title = row.querySelector(".row-title").textContent;
      UI.toast(title + (on ? " yoqildi" : " o'chirildi"), on ? "ok" : "info");
    };
  });

  // Parolni o'zgartirish
  root.querySelector("#priv-pass").onclick = () => UI.toast("Tez orada", "info");

  // Barcha ma'lumotlarni o'chirish — tasdiqlash bilan
  root.querySelector("#priv-wipe").onclick = () =>
    UI.confirm({
      title: "Ma'lumotlarni o'chirish",
      text: "Barcha shaxsiy ma'lumotlaringiz o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.",
      danger: true,
      okText: "O'chirish",
      onOk: () => UI.toast("So'rov yuborildi", "ok"),
    });
};
