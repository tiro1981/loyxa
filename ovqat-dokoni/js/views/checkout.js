// Views.checkout — buyurtmani rasmiylashtirish ekrani
window.Views = window.Views || {};

window.Views.checkout = function (root, params) {
  // Savat bo'sh bo'lsa — savat ekraniga qaytaramiz
  if (!Store.getCart().length) {
    UI.go('cart');
    return;
  }

  // Ichki holat
  const def = Store.defaultAddress();
  let sel = {
    payment: 'cash',
    address: (def && def.id) || null,
    note: ''
  };

  // Tanlangan manzil obyektini topish (text uchun)
  function currentAddress() {
    const all = Store.getAddresses();
    return all.find(function (a) { return String(a.id) === String(sel.address); }) || all[0] || null;
  }

  // Manzil ro'yxati HTML — radio-tanlov ko'rinishida
  function addressListHTML() {
    const list = Store.getAddresses();
    if (!list.length) {
      return '<div class="row-sub" style="padding:8px 4px">Manzil yo\'q. Quyidan qo\'shing.</div>';
    }
    return list.map(function (a) {
      const on = String(a.id) === String(sel.address);
      return (
        '<div class="list-row addr-row" data-addr="' + a.id + '">' +
          '<div class="row-icon" style="' + (on
            ? 'background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff'
            : '') + '">' + (a.icon || '📍') + '</div>' +
          '<div class="row-text">' +
            '<div class="row-title">' + a.label + '</div>' +
            '<div class="row-sub">' + a.text + '</div>' +
            (a.fullName ? '<div class="row-sub">' + a.fullName + (a.phone ? ' · ' + a.phone : '') + '</div>' : '') +
          '</div>' +
          '<div class="pay-radio' + (on ? ' on' : '') + '"></div>' +
        '</div>'
      );
    }).join('');
  }

  // To'lov usullari HTML
  function paymentsHTML() {
    return DATA.paymentMethods.map(function (m) {
      const on = m.id === sel.payment;
      const logoInner = m.logo
        ? m.logo
        : '<span style="color:#fff;font-weight:700;font-size:13px">' + m.abbr + '</span>';
      return (
        '<div class="pay-option' + (on ? ' sel' : '') + '" data-pay="' + m.id + '">' +
          '<div class="pay-logo" style="background:' + m.bg + '">' + logoInner + '</div>' +
          '<div class="pay-name"><b>' + m.name + '</b><small>' + m.sub + '</small></div>' +
          '<div class="pay-radio' + (on ? ' on' : '') + '"></div>' +
        '</div>'
      );
    }).join('');
  }

  // Hisob-kitob (summary) HTML — cart.js dagidek
  function summaryHTML() {
    const sub = Store.cartSubtotal();
    const disc = Store.discount();
    const fee = Store.deliveryFee();
    const total = Store.cartTotal();
    return (
      '<div class="summary">' +
        '<div class="summary-row"><span>Mahsulotlar</span><span>' + UI.sum(sub) + '</span></div>' +
        (disc > 0
          ? '<div class="summary-row free"><span>Chegirma</span><span>−' + UI.sum(disc) + '</span></div>'
          : '') +
        '<div class="summary-row' + (fee === 0 ? ' free' : '') + '">' +
          '<span>Yetkazib berish</span>' +
          '<span>' + (fee === 0 ? 'Bepul' : UI.sum(fee)) + '</span>' +
        '</div>' +
        '<div class="summary-divider"></div>' +
        '<div class="summary-total"><span>Jami</span><span>' + UI.sum(total) + '</span></div>' +
      '</div>'
    );
  }

  // Asosiy razmetka
  root.innerHTML =
    Components.appbar({ title: 'Rasmiylashtirish', back: true }) +
    '<div class="view-pad">' +

      // 1) Yetkazib berish manzili
      '<div class="section">' +
        '<div class="section-head"><div class="section-title">📍 Yetkazib berish manzili</div></div>' +
        '<div class="list" id="co-addr">' + addressListHTML() + '</div>' +
        '<button class="btn btn--ghost btn--block" id="co-add-addr" style="margin-top:10px">＋ Yangi manzil qo\'shish</button>' +
      '</div>' +

      // 2) To'lov usuli
      '<div class="section">' +
        '<div class="section-head"><div class="section-title">💳 To\'lov usuli</div></div>' +
        '<div id="co-pay">' + paymentsHTML() + '</div>' +
      '</div>' +

      // 3) Izoh
      '<div class="section">' +
        '<div class="section-head"><div class="section-title">📝 Izoh (ixtiyoriy)</div></div>' +
        '<div class="field">' +
          '<textarea class="input" id="co-note" placeholder="Kuryer uchun izoh..."></textarea>' +
        '</div>' +
      '</div>' +

      // 4) Hisob-kitob
      '<div class="section" id="co-summary">' + summaryHTML() + '</div>' +

    '</div>' +

    // Pastki dok — tasdiqlash tugmasi
    '<div class="dock">' +
      '<button class="btn btn--primary btn--block" id="co-confirm">' +
        'Buyurtmani tasdiqlash · ' + UI.sum(Store.cartTotal()) +
      '</button>' +
    '</div>';

  Components.bindBack(root);

  // --- Manzil tanlash (re-render qilmasdan .sel/.on almashtirish) ---
  const addrWrap = root.querySelector('#co-addr');
  addrWrap.addEventListener('click', function (e) {
    const row = e.target.closest('.addr-row');
    if (!row) return;
    sel.address = row.getAttribute('data-addr');
    // Holatni DOM'da yangilaymiz
    addrWrap.querySelectorAll('.addr-row').forEach(function (r) {
      const on = r === row;
      r.querySelector('.pay-radio').classList.toggle('on', on);
      const ic = r.querySelector('.row-icon');
      if (on) {
        ic.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
        ic.style.color = '#fff';
      } else {
        ic.style.background = '';
        ic.style.color = '';
      }
    });
  });

  // --- Yangi manzil qo'shish (sheet ichida forma) ---
  root.querySelector('#co-add-addr').addEventListener('click', function () {
    UI.sheet(
      '<div class="field"><label>Ism Familiya</label>' +
        '<input class="input" id="na-fullname" required></div>' +
      // Avtomatik manzil: viloyat -> tuman (ro'yxat) + qishloq/uy/izoh (qo'lda) — umumiy UzAddress komponenti
      UzAddress.formHTML({ idPrefix: 'na' }) +
      '<div class="field"><label>Telefon</label>' +
        '<input class="input" id="na-phone" type="tel" placeholder="+998 90 123 45 67"></div>' +
      '<button class="btn btn--primary btn--block" id="na-save" style="margin-top:6px">Saqlash</button>',
      { title: 'Yangi manzil' }
    );
    // Viloyat tanlanganda tumanlar to'ldirilsin
    UzAddress.bind(document, { idPrefix: 'na' });
    document.getElementById('na-fullname').value = (Store.user && Store.user.name) || '';
    document.getElementById('na-phone').value = (Store.user && Store.user.phone) || '+998 ';
    document.getElementById('na-save').addEventListener('click', function () {
      const fullName = (document.getElementById('na-fullname').value || '').trim();
      const phone = (document.getElementById('na-phone').value || '').trim();
      const addr = UzAddress.read(document, { idPrefix: 'na' });
      if (!fullName || !phone || !addr) {
        UI.toast('Ism familiya, telefon, viloyat, tuman va uy raqamini to\'ldiring', 'err');
        return;
      }
      if (phone.replace(/\D/g, '').length < 9) {
        UI.toast('Telefon raqam noto\'g\'ri', 'err');
        return;
      }
      const label = 'Manzil ' + (Store.getAddresses().length + 1);
      Store.addAddress({ label: label, icon: '📍', text: addr.text, fullName: fullName, phone: phone,
        region: addr.region, district: addr.district, village: addr.village, house: addr.house, note: addr.note });
      // addAddress qiymat qaytarmaydi — oxirgi qo'shilgan manzilni tanlaymiz
      const list = Store.getAddresses();
      const last = list[list.length - 1];
      if (last) sel.address = last.id;
      UI.closeSheet();
      // Ro'yxatni yangilaymiz
      addrWrap.innerHTML = addressListHTML();
      UI.toast('Manzil qo\'shildi', 'ok');
    });
  });

  // --- To'lov usulini tanlash (re-render qilmasdan) ---
  const payWrap = root.querySelector('#co-pay');
  payWrap.addEventListener('click', function (e) {
    const opt = e.target.closest('.pay-option');
    if (!opt) return;
    sel.payment = opt.getAttribute('data-pay');
    payWrap.querySelectorAll('.pay-option').forEach(function (o) {
      const on = o === opt;
      o.classList.toggle('sel', on);
      o.querySelector('.pay-radio').classList.toggle('on', on);
    });
  });

  // --- Izoh ---
  root.querySelector('#co-note').addEventListener('input', function (e) {
    sel.note = e.target.value;
  });

  // --- Buyurtmani tasdiqlash ---
  root.querySelector('#co-confirm').addEventListener('click', function () {
    const addr = currentAddress();
    if (!addr) {
      UI.toast('Avval manzil tanlang', 'err');
      return;
    }
    const order = Store.placeOrder({
      payment: sel.payment,
      address: addr.text,
      addressObj: addr,
      note: sel.note
    });

    // Buyurtmani Telegram kanaliga yuborish (bot ulangan bo'lsa)
    if (window.Telegram && Telegram.isEnabled()) {
      var tgItems = (order.items || []).map(function (it) {
        var p = Store.product(it.id) || {};
        return { name: p.name || ('#' + it.id), qty: it.qty, price: p.price || 0 };
      });
      Telegram.sendOrder({
        id: order.id,
        userName: order.userName || '',
        phone: order.phone || '',
        address: order.address,
        items: tgItems,
        total: order.total
      });
    }

    // Muvaffaqiyat oynasi
    UI.sheet(
      '<div class="success-wrap">' +
        '<div class="success-ring"><div class="circle">' + ICONS.check + '</div></div>' +
        '<h3 style="margin:14px 0 6px">Buyurtma qabul qilindi! 🎉</h3>' +
        '<p class="row-sub" style="margin-bottom:18px">' + order.id + ' · ' + UI.sum(order.total) + '</p>' +
        '<button class="btn btn--primary btn--block" id="co-track">Buyurtmani kuzatish</button>' +
        '<button class="btn btn--ghost btn--block" id="co-home" style="margin-top:10px">Bosh sahifa</button>' +
      '</div>',
      { title: '' }
    );

    document.getElementById('co-track').addEventListener('click', function () {
      UI.closeSheet();
      UI.go('orders');
    });
    document.getElementById('co-home').addEventListener('click', function () {
      UI.closeSheet();
      UI.go('home');
    });
  });
};
