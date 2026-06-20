#!/usr/bin/env bash
# SMS Habar botini ishga tushirish
set -e
cd "$(dirname "$0")"

# .env bo'lsa o'qiymiz (BOT_TOKEN va h.k.)
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

python3 -m pip install -q -r requirements.txt
python3 bot.py
