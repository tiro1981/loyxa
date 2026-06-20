# PROMPT — Ro'yxatdan o'tishda Telegram bot orqali telefon tasdiqlash (OTP)

> Repoga ulangan AI'ga bering. SMS o'rniga platforma boti 4 xonali kod yuboradi.
> Avval ikki qiymatni tayyorlab qo'ying:
>   - BOT_USERNAME = platforma botingiz @username (masalan: onlinebiznes_bot)
>   - BOT_SERVER   = bot/bot.py ishlab turgan HTTPS manzil (masalan: https://loyxa-bot.onrender.com)

---

MAQSAD: Mijoz ro'yxatdan o'tishda foydalanuvchi nomi, telefon va parol kiritadi →
sayt uни Telegram botga yo'naltiradi → bot "Telefon yuborish" tugmasini ko'rsatadi →
mijoz raqamini yuboradi → bot 4 xonali kod yuboradi → mijoz kodni saytga kiritadi →
sayt tasdiqlaydi va akkaunt yaratiladi (avval emas).

OQIM:
1. (Sayt) register forma to'ldiriladi → validatsiya → akkaunt HALI yaratilmaydi.
2. (Sayt) tasdiqlash bosqichi ko'rsatiladi: "Botni ochish" tugmasi + 4 katakli kod kiritish.
3. (Telegram) mijoz `t.me/BOT_USERNAME?start=verify` ni ochadi → "📱 Telefon yuborish" tugmasi.
4. (Telegram) mijoz kontaktini yuboradi → bot 4 xonali kod yuboradi.
5. (Sayt) mijoz kodni kiritadi → "Tasdiqlash" → sayt `POST BOT_SERVER/verify/check {phone, code}`.
6. (Sayt) javob ok bo'lsa — eski akkaunt yaratish kodi ishlaydi (bo_subscriptions + bo_session + dashboard).

=====================================================================
QISM A — BOT (bot/bot.py)
=====================================================================

1) Importlar (yuqorida bo'lsin, yo'qlari qo'shilsin):
       import re, random, time
       from aiogram import F
       from aiogram.types import (Message, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove)
       from aiogram.filters import CommandStart, CommandObject

2) Tasdiqlash kodlari uchun xotira (fayl yuqorisida, global):
       VERIFY_CODES = {}        # normalizatsiya qilingan_telefon -> {"code","chatId","ts"}
       CODE_TTL = 600           # 10 daqiqa

       def norm_phone(p):
           d = re.sub(r"\D", "", str(p or ""))
           return d[-9:] if len(d) >= 9 else d   # oxirgi 9 raqam bo'yicha solishtiramiz

3) /start ?start=verify — telefon so'rash (mavjud cmd_start dan OLDIN registratsiya qil):
       @router.message(CommandStart(deep_link=True))
       async def cmd_start_verify(message: Message, command: CommandObject, state: FSMContext) -> None:
           if (command.args or "").strip() == "verify":
               kb = ReplyKeyboardMarkup(
                   keyboard=[[KeyboardButton(text="📱 Telefon raqamni yuborish", request_contact=True)]],
                   resize_keyboard=True, one_time_keyboard=True,
               )
               await message.answer(
                   "Ro'yxatdan o'tishni tasdiqlash uchun pastdagi tugma bilan telefon raqamingizni yuboring.",
                   reply_markup=kb, parse_mode=None,
               )
               return
           # boshqa payload bo'lsa — oddiy start (mini app / mavjud cmd_start)
           await cmd_start(message, state)

4) Kontakt qabul qilish → kod yuborish:
       @router.message(F.contact)
       async def on_contact(message: Message) -> None:
           phone = norm_phone(message.contact.phone_number)
           code = f"{random.randint(0, 9999):04d}"
           VERIFY_CODES[phone] = {"code": code, "chatId": message.chat.id, "ts": time.time()}
           await message.answer(
               f"✅ Tasdiqlash kodingiz: {code}\n\nShu kodni saytga kiriting. (10 daqiqa amal qiladi)",
               reply_markup=ReplyKeyboardRemove(), parse_mode=None,
           )

5) HTTP endpoint — kodni tekshirish:
       async def handle_verify_check(request: web.Request) -> web.Response:
           try:
               body = await request.json()
           except Exception:
               return web.json_response({"ok": False, "error": "Invalid JSON"}, status=400)
           phone = norm_phone(body.get("phone"))
           code = str(body.get("code") or "").strip()
           rec = VERIFY_CODES.get(phone)
           if not rec:
               return web.json_response({"ok": False, "error": "Kod topilmadi. Botda telefon yuboring."})
           if time.time() - rec["ts"] > CODE_TTL:
               VERIFY_CODES.pop(phone, None)
               return web.json_response({"ok": False, "error": "Kod muddati tugadi."})
           if code != rec["code"]:
               return web.json_response({"ok": False, "error": "Kod noto'g'ri."})
           VERIFY_CODES.pop(phone, None)   # bir martalik
           return web.json_response({"ok": True})

6) Route'ni ro'yxatga qo'sh (boshqa app.router.add_post(...) lar yoniga, setup joyida):
       app.router.add_post("/verify/check", handle_verify_check)
   (CORS allaqachon cors_middleware orqali yoqilgan — qo'shimcha kerak emas.)

ESLATMA: `F.contact` handleri faqat kontakt xabariga ishlaydi; do'kon botlari (store-bot)
alohida Dispatcher'da, shuning uchun bu platforma botiga ta'sir qiladi — to'g'ri.

=====================================================================
QISM B — SAYT (js/auth.js + kirish.html)
=====================================================================

1) js/auth.js yuqorisiga config qo'sh:
       const BOT_USERNAME = "BOT_USERNAME";          // @siz, masalan: onlinebiznes_bot
       const BOT_SERVER   = "BOT_SERVER";            // masalan: https://loyxa-bot.onrender.com
       const digitsOnly = (s) => (String(s||"").replace(/\D/g,""));

2) registerForm submit handlerini O'ZGARTIR: validatsiya va bandlik tekshiruvidan keyin,
   akkauntni DARHOL yaratmasdan, tasdiqlash bosqichiga o't. Buning uchun akkaunt yaratish
   qismini (subs.push ... dashboard'ga redirect) alohida funksiyaga ko'chir:

       // Tasdiqlangач chaqiriladi — ESKI yaratish kodi shu yerga ko'chadi:
       function finishRegistration(username, phone, password) {
           const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
           const clientId = 'CL-' + (1000 + subs.length + 1);
           const now = new Date().toISOString();
           const newClient = { id: clientId, username, businessName: username, phone, password,
               app: null, appName: null, appId: null, price: null, subdomain: null,
               status: 'registered', createdAt: now };
           subs.push(newClient);
           localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
           localStorage.setItem('bo_session', JSON.stringify({ type:'client', clientId, id:clientId,
               username, businessName: username, loggedAt: Date.now() }));
           const appParam = new URLSearchParams(window.location.search).get('app');
           window.showToast && window.showToast("Ro'yxatdan o'tdingiz! Xush kelibsiz.", 'success');
           setTimeout(() => { window.location.href = appParam
               ? ('dashboard.html?subscribe=' + encodeURIComponent(appParam)) : 'dashboard.html'; }, 800);
       }

   submit handler ichida, barcha validatsiya va bandlik tekshiruvi MUVAFFAQIYATLI bo'lgach,
   eski "akkaunt yaratish" o'rniga:
       openVerifyStep(username, phone, password);

3) Tasdiqlash bosqichi (js/auth.js ga qo'sh) — botni ochish + kod kiritish + tekshirish:
       function openVerifyStep(username, phone, password) {
           const box = document.getElementById('verifyStep');
           const link = document.getElementById('verifyBotLink');
           const input = document.getElementById('verifyCode');
           const btn = document.getElementById('verifyConfirm');
           const formEl = document.getElementById('registerForm');
           if (!box || !link || !input || !btn) { // fallback: UI bo'lmasa to'g'ridan-to'g'ri yaratish
               finishRegistration(username, phone, password); return;
           }
           formEl && (formEl.style.display = 'none');
           box.style.display = 'block';
           link.href = `https://t.me/${BOT_USERNAME}?start=verify`;
           btn.onclick = async () => {
               const code = digitsOnly(input.value);
               if (code.length !== 4) { window.showToast && window.showToast("4 xonali kod kiriting", 'error'); return; }
               btn.disabled = true;
               try {
                   const r = await fetch(BOT_SERVER.replace(/\/+$/,'') + '/verify/check', {
                       method: 'POST', headers: {'Content-Type':'application/json'},
                       body: JSON.stringify({ phone, code }),
                   });
                   const data = await r.json().catch(() => ({}));
                   if (data.ok) { finishRegistration(username, phone, password); }
                   else { window.showToast && window.showToast(data.error || "Kod tasdiqlanmadi", 'error'); btn.disabled = false; }
               } catch (e) {
                   window.showToast && window.showToast("Server bilan ulanib bo'lmadi", 'error'); btn.disabled = false;
               }
           };
       }

4) kirish.html — registerForm'dan KEYIN tasdiqlash bloki qo'sh (boshida yashirin):
       <div id="verifyStep" style="display:none">
         <h3>Telefonni tasdiqlang</h3>
         <p class="auth-sub">1) Botni oching va telefon raqamingizni yuboring. 2) Kelgan 4 xonali kodni kiriting.</p>
         <a id="verifyBotLink" href="#" target="_blank" class="btn btn-primary btn-block">
           <i class="fa-brands fa-telegram"></i> Telegram botni ochish
         </a>
         <div class="auth-input" style="margin-top:12px">
           <i class="fa-solid fa-key"></i>
           <input type="tel" id="verifyCode" inputmode="numeric" maxlength="4" placeholder="4 xonali kod">
         </div>
         <button id="verifyConfirm" class="btn btn-primary btn-block" style="margin-top:10px">Tasdiqlash</button>
       </div>

=====================================================================
TEKSHIRUV
=====================================================================
1. Saytda ro'yxatdan o'tish: nom, telefon (o'z Telegram raqamingiz), parol → davom et.
2. "Telegram botni ochish" → botda /start → "📱 Telefon yuborish" → kontakt yubor.
3. Bot 4 xonali kod yuboradi → saytga kirit → "Tasdiqlash".
4. Akkaunt yaratilib, dashboard ochilsin ✅.
5. Noto'g'ri kod / muddati o'tgан kod rad etilishini tekshir.

MUHIM SHARTLAR
- Saytda kiritilgan telefon Telegram'da yuborgan raqam bilan BIR XIL bo'lishi kerak
  (oxirgi 9 raqam bo'yicha solishtiriladi) — bu raqam egaligini tasdiqlaydi.
- BOT_SERVER HTTPS va internetdan ochiq bo'lsin; bot/bot.py ishlab tursin.
- Kod bir martalik va 10 daqiqa amal qiladi (bot tomonida).
- Bu tasdiqlash hozir localStorage akkauntiga ulangan; ilovalar Supabase'ga ko'chgach,
  foydalanuvchilarni ham serverda saqlash tavsiya etiladi (alohida ish).
