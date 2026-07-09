/* ============================================================
   uzbekistan-regions.js — O'zbekiston manzil bazasi + umumiy manzil-tanlash komponenti
   Barcha ilovalar (ovqat, kiyim, kitob, app) AYNAN shu faylni ishlatadi —
   shuning uchun manzil qo'shish hamma joyda bir xil ishlaydi.

   YONDASHUV (ataylab): viloyat va tuman — ANIQ ochiluvchi ro'yxat (dropdown);
   qishloq/mahalla, uy raqami va izoh — qo'lda kiritiladi. Sababi: 14 viloyat va ~208
   tuman aniq ma'lum, ammo butun mamlakat bo'yicha mahalla/qishloqlarning to'liq, ishonchli
   ro'yxati yo'q — uni to'qib chiqarish "soxta ma'lumot bo'lmasin" talabiga zid bo'lardi.
   ============================================================ */

/* O'zbekiston: viloyat -> tumanlar (shahar-tumanlar ham kiritilgan).
   Manba: O'zbekiston ma'muriy-hududiy bo'linishi. */
window.UZ_REGIONS = {
  "Toshkent shahri": [
    "Bektemir", "Chilonzor", "Mirobod", "Mirzo Ulug'bek", "Olmazor", "Sergeli",
    "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yashnobod", "Yangihayot", "Yunusobod"
  ],
  "Toshkent viloyati": [
    "Angren shahri", "Bekobod", "Bekobod shahri", "Bo'ka", "Bo'stonliq", "Chinoz",
    "Chirchiq shahri", "Ohangaron", "Ohangaron shahri", "Olmaliq shahri", "Oqqo'rg'on",
    "O'rtachirchiq", "Parkent", "Piskent", "Quyichirchiq", "Qibray", "Nurafshon shahri",
    "Yangiyo'l", "Yangiyo'l shahri", "Yuqorichirchiq", "Zangiota"
  ],
  "Andijon viloyati": [
    "Andijon shahri", "Andijon tumani", "Asaka", "Baliqchi", "Bo'z", "Buloqboshi",
    "Izboskan", "Jalaquduq", "Xo'jaobod", "Qo'rg'ontepa", "Marhamat", "Oltinko'l",
    "Paxtaobod", "Shahrixon", "Ulug'nor", "Xonobod shahri"
  ],
  "Buxoro viloyati": [
    "Buxoro shahri", "Buxoro tumani", "G'ijduvon", "Jondor", "Kogon", "Kogon shahri",
    "Olot", "Peshku", "Qorako'l", "Qorovulbozor", "Romitan", "Shofirkon", "Vobkent"
  ],
  "Farg'ona viloyati": [
    "Farg'ona shahri", "Farg'ona tumani", "Beshariq", "Bog'dod", "Buvayda", "Dang'ara",
    "Furqat", "Qo'shtepa", "Quva", "Quvasoy shahri", "Marg'ilon shahri", "Oltiariq",
    "Rishton", "So'x", "Toshloq", "Uchko'prik", "O'zbekiston", "Yozyovon"
  ],
  "Jizzax viloyati": [
    "Jizzax shahri", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol",
    "Mirzacho'l", "Paxtakor", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin", "Sharof Rashidov"
  ],
  "Xorazm viloyati": [
    "Urganch shahri", "Urganch tumani", "Xiva shahri", "Xiva tumani", "Bog'ot", "Gurlan",
    "Hazorasp", "Xonqa", "Qo'shko'pir", "Shovot", "Tuproqqal'a", "Yangiariq", "Yangibozor"
  ],
  "Namangan viloyati": [
    "Namangan shahri", "Namangan tumani", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq",
    "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on", "Davlatobod"
  ],
  "Navoiy viloyati": [
    "Navoiy shahri", "Zarafshon shahri", "Karmana", "Konimex", "Navbahor", "Nurota",
    "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi"
  ],
  "Qashqadaryo viloyati": [
    "Qarshi shahri", "Qarshi tumani", "Shahrisabz shahri", "Shahrisabz tumani", "Chiroqchi",
    "Dehqonobod", "G'uzor", "Qamashi", "Kasbi", "Kitob", "Koson", "Mirishkor",
    "Muborak", "Nishon", "Yakkabog'", "Ko'kdala"
  ],
  "Qoraqalpog'iston Respublikasi": [
    "Nukus shahri", "Nukus tumani", "Amudaryo", "Beruniy", "Bo'zatov", "Chimboy",
    "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Qanliko'l", "Qo'ng'irot", "Qorao'zak",
    "Shumanay", "Taxtako'pir", "To'rtko'l", "Xo'jayli"
  ],
  "Samarqand viloyati": [
    "Samarqand shahri", "Samarqand tumani", "Bulung'ur", "Ishtixon", "Jomboy",
    "Kattaqo'rg'on shahri", "Kattaqo'rg'on tumani", "Qo'shrabot", "Narpay", "Nurobod",
    "Oqdaryo", "Pastdarg'om", "Paxtachi", "Payariq", "Toyloq", "Urgut"
  ],
  "Sirdaryo viloyati": [
    "Guliston shahri", "Guliston tumani", "Yangiyer shahri", "Shirin shahri", "Boyovut",
    "Sayxunobod", "Sardoba", "Sirdaryo", "Mirzaobod", "Oqoltin", "Xovos"
  ],
  "Surxondaryo viloyati": [
    "Termiz shahri", "Termiz tumani", "Angor", "Bandixon", "Boysun", "Denov",
    "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Qiziriq", "Qumqo'rg'on", "Sariosiyo",
    "Sherobod", "Sho'rchi", "Uzun"
  ]
};

/* ============================================================
   UzAddress — umumiy manzil-tanlash yordamchisi
   Har bir ilova shu API'ni ishlatadi (bir xil oqim):
     1) UzAddress.formHTML(opts)  -> cascade forma HTML'i
     2) (DOM'ga qo'ygach) UzAddress.bind(root, opts)  -> viloyat->tuman bog'lash
     3) UzAddress.read(root, opts) -> {region, district, village, house, note, text} yoki null
   ============================================================ */
window.UzAddress = {
  regions: function () { return Object.keys(window.UZ_REGIONS); },
  districts: function (region) { return window.UZ_REGIONS[region] || []; },

  // Cascade forma HTML'i. opts orqali har ilova o'z input/select/label klasslarini beradi
  // (ko'rinish native bo'lsin), idPrefix bilan bir sahifada bir nechta forma to'qnashmaydi.
  formHTML: function (opts) {
    opts = opts || {};
    var p = opts.idPrefix || "uzaddr";
    var selCls = opts.selectClass || opts.inputClass || "input";
    var inpCls = opts.inputClass || "input";
    var labCls = opts.labelClass || "";
    var fieldOpen = opts.fieldWrapOpen || '<div class="field">';
    var fieldClose = opts.fieldWrapClose || "</div>";
    var lab = function (t, forId) {
      return labCls
        ? '<label class="' + labCls + '" for="' + forId + '">' + t + "</label>"
        : "<label for=\"" + forId + "\">" + t + "</label>";
    };
    var regionOpts = ['<option value="">Viloyatni tanlang</option>']
      .concat(this.regions().map(function (r) { return '<option value="' + r + '">' + r + "</option>"; }))
      .join("");

    return "" +
      fieldOpen + lab("Viloyat", p + "-region") +
        '<select id="' + p + '-region" class="' + selCls + '">' + regionOpts + "</select>" +
      fieldClose +
      fieldOpen + lab("Tuman", p + "-district") +
        '<select id="' + p + '-district" class="' + selCls + '" disabled>' +
          '<option value="">Avval viloyatni tanlang</option>' +
        "</select>" +
      fieldClose +
      fieldOpen + lab("Qishloq / mahalla", p + "-village") +
        '<input id="' + p + '-village" class="' + inpCls + '" type="text" placeholder="Mahalla yoki qishloq nomi" autocomplete="off">' +
      fieldClose +
      fieldOpen + lab("Uy / xonadon raqami", p + "-house") +
        '<input id="' + p + '-house" class="' + inpCls + '" type="text" placeholder="Masalan: 12-uy, 5-xonadon" autocomplete="off">' +
      fieldClose +
      fieldOpen + lab("Izoh (ixtiyoriy)", p + "-note") +
        '<input id="' + p + '-note" class="' + inpCls + '" type="text" placeholder="Mo\'ljal, qavat, eshik rangi..." autocomplete="off">' +
      fieldClose;
  },

  // Viloyat tanlanganda tuman ro'yxatini to'ldiradi. Formani DOM'ga qo'shgach chaqiriladi.
  bind: function (root, opts) {
    opts = opts || {};
    var p = opts.idPrefix || "uzaddr";
    root = root || document;
    var reg = root.querySelector("#" + p + "-region");
    var dist = root.querySelector("#" + p + "-district");
    if (!reg || !dist) return;
    var self = this;
    reg.addEventListener("change", function () {
      var ds = self.districts(reg.value);
      if (ds.length) {
        dist.innerHTML = ['<option value="">Tumanni tanlang</option>']
          .concat(ds.map(function (d) { return '<option value="' + d + '">' + d + "</option>"; }))
          .join("");
        dist.disabled = false;
      } else {
        dist.innerHTML = '<option value="">Avval viloyatni tanlang</option>';
        dist.disabled = true;
      }
    });
  },

  // Forma qiymatlarini o'qib bitta manzil satriga jamlaydi.
  // Majburiy: viloyat, tuman, uy raqami. Bittasi bo'sh bo'lsa null qaytaradi.
  read: function (root, opts) {
    opts = opts || {};
    var p = opts.idPrefix || "uzaddr";
    root = root || document;
    var get = function (s) {
      var el = root.querySelector("#" + p + "-" + s);
      return el ? (el.value || "").trim() : "";
    };
    var region = get("region"), district = get("district"),
        village = get("village"), house = get("house"), note = get("note");
    if (!region || !district || !house) return null;
    var parts = [region, district];
    if (village) parts.push(village);
    parts.push(house);
    var text = parts.join(", ");
    if (note) text += " (" + note + ")";
    return { region: region, district: district, village: village, house: house, note: note, text: text };
  }
};
