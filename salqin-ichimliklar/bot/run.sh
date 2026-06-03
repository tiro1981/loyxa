#!/usr/bin/env bash
# Salqin Telegram bot — ishga tushirish skripti
set -e

cd "$(dirname "$0")"

# Virtual environment yaratish (agar yo'q bo'lsa)
if [ ! -d "venv" ]; then
  echo "🐍 venv yaratilmoqda..."
  python3 -m venv venv
fi

# Aktivatsiya
source venv/bin/activate

# Kutubxonalarni o'rnatish
echo "📦 Bog'liqliklar tekshirilmoqda..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# .env borligini tekshirish
if [ ! -f ".env" ]; then
  echo "⚠  .env fayli topilmadi. .env.example dan nusxa olib to'ldiring:"
  echo "   cp .env.example .env"
  exit 1
fi

echo "🚀 Server ishga tushirilmoqda..."
python app.py
