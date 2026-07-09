#!/usr/bin/env bash
# ============================================================
#  AlwaysData ga bot kodini yuklash (lokal mashinangizdan ishga tushiring)
#  Foydalanish:  bash deploy.sh
# ============================================================
set -euo pipefail

# ---- 1) Shu yerni TO'LDIRING ----
ACCOUNT="tiro21"        # AlwaysData login (ssh-<ACCOUNT>.alwaysdata.net) — tiro19 o'chirilgan, joriy akkaunt tiro21
REMOTE_DIR="bot"        # serverdagi papka:  ~/bot
# ---------------------------------

SSH_HOST="${ACCOUNT}@ssh-${ACCOUNT}.alwaysdata.net"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Yuklanmoqda: ${LOCAL_DIR}  ->  ${SSH_HOST}:~/${REMOTE_DIR}/"

# Kod va konfiguratsiyani yuklaymiz. .venv / cache / DS_Store yuborilmaydi.
# Jonli holat fayllari (*.json) serverda bo'lsa USTIDAN YOZILMAYDI (--ignore-existing yo'q,
# shuning uchun ularni alohida, faqat yo'q bo'lsa yuklaymiz — pastdagi 2-rsync).
rsync -avz --human-readable \
  --exclude '.venv/' \
  --exclude '__pycache__/' \
  --exclude '.DS_Store' \
  --exclude '.git/' \
  --exclude '*.json' \
  --exclude '.env' \
  "${LOCAL_DIR}/" "${SSH_HOST}:${REMOTE_DIR}/"

# Holat (state) JSON fayllari — faqat serverda hali yo'q bo'lsa yuklanadi (jonli ma'lumotni saqlash uchun)
rsync -avz --ignore-existing \
  "${LOCAL_DIR}/"*.json \
  "${SSH_HOST}:${REMOTE_DIR}/" || true

echo "==> Fayllar yuklandi. Endi serverda venv qurib, botni ishga tushiring (DEPLOY.md ga qarang)."
