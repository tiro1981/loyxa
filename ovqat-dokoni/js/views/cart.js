/* Savat view — foydalanuvchi tanlagan mahsulotlar, promokod va yakuniy hisob.
   Ilova cart:change hodisasida bu view'ni avtomatik qayta render qiladi,
   shuning uchun handlerlar faqat Store'ni chaqiradi. */
window.Views = window.Views || {};

window.Views.cart = function (root) {
  const items = Store.getCart();

  // Appbar — back KERAK EMAS (root tab). Bo'sh savatda subtitle/tugma yashirin.
  const header = Components.appbar({
    title: "Savat",
    sub: items.length ? items.length + " ta mahsulot" : "",
    rightHTML: items.length ? '<button class="link" id="clearCart">Tozalash</button>' : "",
  });

  // Bo'sh holat
  if (!items.length) {
    root.innerHTML = header + Components.emptyState({
      emoji: "🛒",
      title: "Savat bo'sh",
      text: "Hozircha mahsulot yo'q. Keling, xarid qilamiz!",
      btn: { label: "Xaridni boshlash", onClick: () => UI.go("home") },
    });
    return;
  }

  // Hisob-kitob qiymatlari
  const subtotal = Store.cartSubtotal();
  const discount = Store.discount();
  const fee = Store.deliveryFee();
  const total = Store.cartTotal();
  const toFree = Store.FREE_FROM - subtotal; // bepulgacha qolgan summa

  // Mahsulot kartalari
  const itemsHTML = items.map((p) => `
    <div class="cart-item">
      <div class="cart-thumb" style="${Components.thumbStyle(p)}">${p.emoji}</div>
      <div class="cart-info">
        <div class="ci-name">${p.name}</div>
        <div class="ci-price">${UI.fmt(p.price)} so'm · ${p.unit}</div>
        <div class="ci-total">${UI.sum(p.price * p.qty)}</div>
      </div>
      <div class="stepper">
        <button class="minus" data-id="${p.id}" data-qty="${p.qty - 1}">${p.qty <= 1 ? ICONS.trash : ICONS.minus}</button>
        <b>${p.qty}</b>
        <button class="plus" data-id="${p.id}" data-qty="${p.qty + 1}">${ICONS.plus}</button>
      </div>
    </div>`).join("");

  // Yetkazib berish qatori — bepul bo'lsa <b>Bepul</b>
  const feeRow = fee === 0
    ? `<div class="summary-row free"><span>Yetkazib berish</span><b>Bepul</b></div>`
    : `<div class="summary-row"><span>Yetkazib berish</span><span>${UI.sum(fee)}</span></div>`;

  // Bepulgacha oz qolganda yo'naltiruvchi matn
  const freeHint = (toFree > 0 && fee !== 0)
    ? `<div class="summary-row" style="opacity:.75;font-size:13px"><span>Yana ${UI.sum(toFree)} xarid qilsangiz yetkazish bepul!</span></div>`
    : "";

  root.innerHTML = header + `
    <div class="view-pad">
      <div class="list stagger">
        ${itemsHTML}
      </div>

      <div class="promo">
        <input id="promoInput" placeholder="Promokod (FRESH10)" />
        <button id="promoApply">Qo'llash</button>
      </div>

      <div class="summary">
        <div class="summary-row"><span>Mahsulotlar</span><span>${UI.sum(subtotal)}</span></div>
        ${discount > 0 ? `<div class="summary-row"><span>Chegirma</span><span>-${UI.sum(discount)}</span></div>` : ""}
        ${feeRow}
        ${freeHint}
        <div class="summary-divider"></div>
        <div class="summary-total"><span>Jami</span><b>${UI.sum(total)}</b></div>
      </div>
    </div>

    <div class="dock">
      <button class="btn btn--primary btn--block" id="goCheckout">Rasmiylashtirish · ${UI.sum(total)}</button>
    </div>`;

  // Steppers — minus/plus tugmalari Store.setQty ni chaqiradi (0 -> o'chiradi)
  root.querySelectorAll(".stepper button").forEach((btn) => {
    btn.onclick = () => Store.setQty(btn.dataset.id, parseInt(btn.dataset.qty, 10));
  });

  // Promokod qo'llash
  const promoApply = root.querySelector("#promoApply");
  if (promoApply) {
    promoApply.onclick = () => {
      const val = (root.querySelector("#promoInput").value || "").trim();
      if (Store.applyPromo(val)) UI.toast("Promokod qo'llandi", "ok");
      else UI.toast("Kod xato", "err");
    };
  }

  // Rasmiylashtirish
  root.querySelector("#goCheckout").onclick = () => UI.go("checkout");

  // Savatni tozalash — tasdiqlash bilan
  const clearBtn = root.querySelector("#clearCart");
  if (clearBtn) {
    clearBtn.onclick = () => UI.confirm({
      title: "Savatni tozalash",
      text: "Barcha mahsulotlar o'chiriladi?",
      danger: true,
      okText: "Tozalash",
      onOk: () => Store.clearCart(),
    });
  }
};
