"""Salqin — Telegram bot HTTP API serveri.

Frontend (Salqin web ilovasi) shu serverga buyurtma yuboradi,
server esa Telegram kanalga chek rasmi + matn yuboradi.

Endpointlar:
  GET  /api/health   — bot va kanal sozlamalari tekshiriladi
  POST /api/order    — yangi buyurtma (chek rasmi + caption yuboriladi)
  POST /api/status   — buyurtma statusi o'zgargani haqida xabar
"""
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

import config
import bot
import receipt

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)
log = logging.getLogger('salqin-bot')

app = Flask(__name__)
CORS(app, resources={r'/api/*': {'origins': config.CORS_ORIGIN}})


@app.route('/')
def index():
    return jsonify({
        'service': 'salqin-telegram-bot',
        'configured': config.is_configured(),
        'endpoints': ['/api/health', '/api/order', '/api/status'],
    })


@app.route('/api/health', methods=['GET'])
def health():
    if not config.is_configured():
        return jsonify({
            'ok': False,
            'error': 'BOT_TOKEN yoki CHANNEL_ID sozlanmagan'
        }), 500
    try:
        me = bot.get_me()
        if not me.get('ok'):
            return jsonify({'ok': False, 'error': me.get('description')}), 502
        return jsonify({
            'ok': True,
            'bot': {
                'username': me['result'].get('username'),
                'first_name': me['result'].get('first_name'),
            },
            'channel': config.CHANNEL_ID,
        })
    except Exception as e:
        log.exception('health check failed')
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/api/order', methods=['POST'])
def new_order():
    order = request.get_json(silent=True) or {}
    if not order:
        return jsonify({'ok': False, 'error': 'JSON body kerak'}), 400
    if not config.is_configured():
        return jsonify({'ok': False, 'error': 'Bot sozlanmagan'}), 500

    oid = (order.get('id') or 'NEW')[-5:].upper()
    log.info(f'📨 yangi buyurtma #{oid} · {order.get("name")} · {order.get("total")} so\'m')

    try:
        caption = bot.build_caption(order)
        photo = receipt.generate(order)
        result = bot.send_photo(photo, caption)
        if not result.get('ok'):
            log.warning(f'Telegram xato: {result}')
            return jsonify({
                'ok': False,
                'error': result.get('description', 'Telegram error')
            }), 502
        log.info(f'✅ #{oid} kanalga yuborildi (msg {result["result"]["message_id"]})')
        return jsonify({
            'ok': True,
            'message_id': result['result']['message_id'],
        })
    except Exception as e:
        log.exception('order send failed')
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/api/status', methods=['POST'])
def status_update():
    payload = request.get_json(silent=True) or {}
    if not config.is_configured():
        return jsonify({'ok': False, 'error': 'Bot sozlanmagan'}), 500

    oid = (payload.get('orderId') or '—')[-5:].upper()
    log.info(f'🔄 status #{oid} → {payload.get("status")}')

    try:
        msg = bot.build_status_message(payload)
        result = bot.send_message(msg)
        if not result.get('ok'):
            return jsonify({
                'ok': False,
                'error': result.get('description', 'Telegram error')
            }), 502
        return jsonify({'ok': True})
    except Exception as e:
        log.exception('status send failed')
        return jsonify({'ok': False, 'error': str(e)}), 500


if __name__ == '__main__':
    if not config.BOT_TOKEN:
        log.warning('⚠  BOT_TOKEN sozlanmagan! .env faylga qo\'shing.')
    if not config.CHANNEL_ID:
        log.warning('⚠  CHANNEL_ID sozlanmagan! .env faylga qo\'shing.')
    if config.is_configured():
        try:
            me = bot.get_me()
            if me.get('ok'):
                log.info(f'🤖 Bot: @{me["result"].get("username")} ulandi')
        except Exception:
            log.warning('Bot ulanishini tekshirishda xato')
    log.info(f'🚀 Server: http://{config.HOST}:{config.PORT}')
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
