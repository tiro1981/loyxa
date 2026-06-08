# Salqin — serverga joylash eslatmasi

## Frontend
Statik fayllar: `index.html`, `admin.html`, `*.js`, `*.css` — nginx orqali beriladi.

API manzili avtomatik: sayt qaysi domendan ochilsa, `/api/...` so'rovlari o'sha domenga ketadi.
Shuning uchun nginx'da `/api` ni Flask serverga proxy qiling:

```nginx
server {
    listen 80;
    server_name sizning-domen.uz;
    root /var/www/salqin;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Admin panelni qo'shimcha himoyalash tavsiya etiladi:
    # location = /admin.html { auth_basic "Admin"; auth_basic_user_file /etc/nginx/.htpasswd; }
}
```

API boshqa domenda bo'lsa, brauzer konsolida:
`localStorage.setItem('si_api_url', 'https://api.sizning-domen.uz')`

## Bot serveri (bot/ — o'zgartirilmagan)
Serverda qilish kerak:
1. `bot/.env` da `DEBUG=0` qiling va `CORS_ORIGIN=https://sizning-domen.uz` ko'rsating
2. Bot tokenini yangilang (eski token oshkor bo'lgan — BotFather'da revoke)
3. `venv/` ni serverga ko'chirmang — serverda qaytadan yarating
4. Production'da `python app.py` o'rniga gunicorn tavsiya etiladi:
   `pip install gunicorn && gunicorn -w 2 -b 127.0.0.1:5000 app:app`

## Deploy'ga KIRMAYDIGAN fayllar
`venv/`, `__pycache__/`, `.DS_Store`, `.idea/`, `.claude/`, `bot/.env` (serverda qo'lda yaratiladi),
`salqin-battlecard.html` (ichki hujjat).

## Birinchi ishga tushirishdan keyin
- Admin panelga kiring (`admin` / `admin123`) va darhol **🔑 Parolni o'zgartirish** tugmasi bilan parolni almashtiring.
- Muhim cheklov: ma'lumotlar localStorage'da — har bir brauzer o'z ma'lumotini ko'radi.
  Admin boshqa qurilmadan mijoz buyurtmalarini ko'rmaydi; buyurtmalar faqat Telegram kanal orqali keladi.
  To'liq do'kon uchun keyingi bosqichda backend baza kerak bo'ladi.
