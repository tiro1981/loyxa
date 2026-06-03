"""Salqin bot — sozlamalar (.env dan o'qiladi)."""
import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.environ.get('BOT_TOKEN', '8469478756:AAFaMcGcX0_AfwFJ87Mu8XckQdi3ezHYcho').strip()
CHANNEL_ID = os.environ.get('CHANNEL_ID', '-1002800570487').strip()

HOST = os.environ.get('HOST', '0.0.0.0')
PORT = int(os.environ.get('PORT', 5003))
DEBUG = os.environ.get('DEBUG', '1') in ('1', 'true', 'True')

CORS_ORIGIN = os.environ.get('CORS_ORIGIN', '').strip() or '*'


def is_configured() -> bool:
    return bool(BOT_TOKEN and CHANNEL_ID)
