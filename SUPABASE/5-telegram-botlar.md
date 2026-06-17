# PROMPT — Telegram botlarga "Ilovani ochish" (web_app) tugmasini qo'shish

> Bu fayl ikkita alohida prompt: (1) Platforma boti, (2) Web ilova boti.
> Har birini repoga ulangan AI'ga alohida bering.
>
> ASOSIY TUSHUNCHA: Mini App'ni Telegram **ICHIDA** ochish uchun tugma oddiy
> URL tugmasi EMAS, balki **`web_app` turidagi tugma** bo'lishi SHART
> (`InlineKeyboardButton(web_app=WebAppInfo(url=...))`). Oddiy url tugmasi
> "Open link?" so'rab, tashqi brauzerga chiqaradi. URL HTTPS bo'lishi shart.

---

## PROMPT 1 — Platforma boti

VAZIFA: `bot/bot.py` dagi platforma botining `/start` javobini o'zgartir. Mijoz
`/start` yuborganda — xush kelibsiz matni va ostida Mini App'ni (onlinebiznes.uz)
Telegram ichida ochadigan `web_app` tugmasi chiqsin.

KONTEKST:
- Fayl: `bot/bot.py`. Platforma botining `/start` handleri: `cmd_start` (taxminan 484-qator,
  `@router.message(CommandStart())`).
- Hozir `cmd_start` do'kon egasini "Bot ID" so'rab ulashga yo'naltiradi (FSM:
  `Connect.awaiting_id`). DIQQAT: bu eski ulanish oqimi. Uni YO'QOTMA — boshqa buyruqqa
  ko'chir (masalan `/connect`) yoki saqlab qol; `/start` esa endi mijozга Mini App
  tugmasini ko'rsatsin.

QILINADIGAN O'ZGARISHLAR (bot/bot.py):

1) Yuqoridagi importlarga (aiogram.types dan) qo'sh (agar yo'q bo'lsa):
       from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

2) `cmd_start` ni shunday qil (FSM state o'rnatishni olib tashlab, web_app tugma qo'shamiz):
       PLATFORM_APP_URL = "https://onlinebiznes.uz/"   # platforma mini app kirish sahifasi

       @router.message(CommandStart())
       async def cmd_start(message: Message, state: FSMContext) -> None:
           await state.clear()
           name = md_strip(message.from_user.first_name) or "do'st"
           kb = InlineKeyboardMarkup(inline_keyboard=[[
               InlineKeyboardButton(
                   text="🚀 Ilovani ochish",
                   web_app=WebAppInfo(url=PLATFORM_APP_URL),
               )
           ]])
           await message.answer(
               f"👋 Assalomu alaykum, {name}!\n\n"
               f"Bu — onlinebiznes.uz rasmiy boti. Platformani ochish uchun "
               f"pastdagi tugmani bosing.",
               reply_markup=kb,
               parse_mode=None,
           )

3) Agar do'kon ulash (Bot ID) oqimi hali kerak bo'lsa — uni `/connect` buyrug'iga ko'chir:
       @router.message(Command("connect"))
       async def cmd_connect(message: Message, state: FSMContext) -> None:
           await state.set_state(Connect.awaiting_id)
           await message.answer("📋 Admin paneldan olingan *Bot ID* ni yuboring.\n\nMisol: `BOT-CL001-X7K9P`")
   (Eski cmd_start dagi matn shu yerga ko'chadi. Kerak bo'lmasa — butunlay olib tashla.)

4) TEKSHIRUV: platforma botiga `/start` yuboring → matn + "🚀 Ilovani ochish" tugmasi
   chiqsin → tugma bosilganda Mini App Telegram ichida ochilsin ("Open link?" chiqmasin).

---

## PROMPT 2 — Web ilova boti (har bir do'kon uchun)

VAZIFA: Web ilova boti (do'kon boti) mijoz `/start` bosganda — "Ilovani ochish uchun
pastdagi tugmani bosing" matni va ostida o'sha do'konning web ilovasini Telegram
ichida ochadigan `web_app` tugmasi chiqarsin. Bot qaysi ilova boshqaruv paneliga
ulangan bo'lsa — aynan o'sha web ilova (o'sha client) ochilishi kerak.

KONTEKST:
- Backend: `bot/bot.py` dagi `store_start_handler` (taxminan 352-qator) — hozir tugmasiz
  oddiy salom yuboradi.
- Do'kon boti `/store-bot/connect` (taxminan 772-qator) orqali ulanadi; saqlanadigan
  `cfg` da: token, shopName, channel, ... bor, LEKIN web ilova URL'i YO'Q.
- Frontend: har bir web ilovaning admin panelida botni ulaydigan `fetch(".../store-bot/connect")`
  chaqiruvi bor; payload `{ clientId, shopName, token }`. Admin panel o'z web ilova
  URL'ini biladi (masalan `qrStoreUrl()` yoki shu kabi funksiya — `index.html?client=<id>`).

QILINADIGAN O'ZGARISHLAR:

A) FRONTEND (web ilova admin paneli — qaysi ilova bo'lsa, o'shaning admin JS fayli):
   `/store-bot/connect` ga yuboriladigan payload'ga web ilova URL'ini qo'sh:
       const payload = {
         clientId: SHOP_KEY,            // yoki CLIENT_ID — mavjud kod qanday bo'lsa
         shopName: _shopName(),
         token,
         storeUrl: qrStoreUrl(),        // <-- QO'SHILDI: shu do'konning web ilova URL'i (?client=... bilan, https)
       };
   (Agar `qrStoreUrl()` yo'q bo'lsa — web ilova URL'ini quradigan mavjud funksiyani
    ishlat; URL HTTPS va `?client=<id>` ni o'z ichiga olishi shart.)

B) BACKEND (bot/bot.py — connect):
   `handle_store_connect` ichidagi `cfg = {...}` ga `storeUrl` ni saqla:
       cfg = {
           "token": token,
           "shopName": str(body.get("shopName") or prev.get("shopName") or "Do'kon"),
           "storeUrl": str(body.get("storeUrl") or prev.get("storeUrl") or ""),  # <-- QO'SHILDI
           "channel": prev.get("channel"),
           ... (qolgani o'zgarmaydi)
       }

C) BACKEND (bot/bot.py — store_start_handler):
   Importlar yuqorida bo'lsin: `from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo`
   `store_start_handler` ni shunday qil:
       async def store_start_handler(message: "Message", cfg: dict) -> None:
           shop = cfg.get("shopName") or "do'konimiz"
           url = (cfg.get("storeUrl") or "").strip()
           name = (getattr(message.from_user, "first_name", "") or "").strip()
           hello = f"Salom, {name}! " if name else "Salom! "
           if url.startswith("https://"):
               kb = InlineKeyboardMarkup(inline_keyboard=[[
                   InlineKeyboardButton(text="🛍 Ilovani ochish", web_app=WebAppInfo(url=url))
               ]])
               await message.answer(
                   f"👋 {hello}{shop} ga xush kelibsiz!\n\n"
                   f"Buyurtma berish uchun ilovani oching — pastdagi tugmani bosing.",
                   reply_markup=kb, parse_mode=None,
               )
           else:
               # URL hali ulanmagan — eski tugmasiz matn
               await message.answer(
                   f"👋 {hello}{shop} ga xush kelibsiz!\n\n"
                   f"Buyurtma berish uchun do'kon ilovasidan foydalaning.",
                   parse_mode=None,
               )

   ESLATMA: storeUrl `cfg` da saqlangani uchun bot qaysi do'konga (client) ulangan
   bo'lsa, aynan o'sha ilova URL'i tugmaga tushadi — talab shu.

D) DEPLOY + TEKSHIRUV:
   - Avval web ilova frontendini deploy qiling (storeUrl payloadga qo'shilsin).
   - Web ilova admin panelidan botni QAYTA ulang (token bilan) — endi storeUrl ham
     serverga boradi va cfg ga saqlanadi.
   - Do'kon botiga `/start` yuboring → matn + "🛍 Ilovani ochish" tugmasi → bosilганда
     o'sha web ilova Telegram ichida ochilsin.
   - Boshqa ilova paneliga ulangan bot — o'z ilovasini ochishini tekshiring (URL har xil).

---

## Umumiy eslatmalar

- `web_app` tugma faqat **HTTPS** URL bilan ishlaydi (onlinebiznes.uz — https ✓).
- Telegram botni serverda qayta ishga tushirgandan (yoki deploy) keyin `/start` ni
  qayta yuboring. Telegram tugmalarni keshlamaydi — darhol yangi javob keladi.
- Agar tugma bosilганда baribir "Open link?" chiqsa — demak tugma `web_app` emas,
  oddiy `url` tugmasi bo'lib qolgan. Kodda `web_app=WebAppInfo(url=...)` ekanini tekshiring.
