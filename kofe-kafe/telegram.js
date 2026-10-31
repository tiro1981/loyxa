// Kofe Kafe — kafe boti (store-bot) API klienti (ovqat-dokoni/telegram.js asosida).
// Do'kon egasi o'z bot tokenini admin paneldan ulaydi. Buyurtma store-bot
// serveriga (bot/bot.py, port 3344) yuboriladi, server uni kanalga uzatadi.
// Har bir kafe clientId kaliti bilan ajratiladi: <client>__kofe.
const Telegram = (() => {
  // Do'kon kaliti — boot-loader window.__CLIENT_ID (?client= yoki bo_session) bilan mos.
  // Admin bot ulaganda ham, storefront order yuborganda ham bir xil bo'lishi shart.
  const SHOP_KEY = (
    window.__CLIENT_ID ||
    new URLSearchParams(location.search).get('client') ||
    (() => { try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; } })() ||
    'shop'
  ) + '__kofe';

  // Bot server manzili — Cloud("bot_api") (admin sozlaydi, mijozga ham sinxron),
  // aks holda localStorage, aks holda localhost. Har chaqiruvда yangidan o'qiymiz.
  // Yagona markaziy bot server (bot/README.md) — AlwaysData (onlinebiznes) da joylashgan;
  // admin panel "1. Bot server manzili"dan boshqa manzil saqlansa, o'sha ishlatiladi.
  const DEFAULT_BOT_API = 'https://onlinebiznes.alwaysdata.net';
  // Eski (o'chirilgan) AlwaysData akkauntlari — saqlangan bo'lsa ham e'tiborga olinmaydi.
  const DEAD_BOT_HOST = /(^|\/\/)(tiro19|tiro21)\.alwaysdata\.net/i;
  function apiBase() {
    const configured = [
      window.Cloud && Cloud.get('bot_api'),
      localStorage.getItem('bo_bot_api'),
    ].find((u) => u && !DEAD_BOT_HOST.test(u)) || '';
    if (configured) return configured.replace(/\/+$/, '');
    if (/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)) return 'http://localhost:3344';
    return DEFAULT_BOT_API;
  }

  async function request(path, opts = {}) {
    const res = await fetch(apiBase() + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  async function status() {
    try { return await request('/store-bot/status?clientId=' + encodeURIComponent(SHOP_KEY)); }
    catch (err) { return { ok: false, error: err.message }; }
  }
  // Eski kod bilan moslik
  async function health() { return status(); }

  async function connect(cfg) {
    return request('/store-bot/connect', { method: 'POST', body: JSON.stringify({ clientId: SHOP_KEY, ...cfg }) });
  }
  async function disconnect() {
    try { return await request('/store-bot/disconnect', { method: 'POST', body: JSON.stringify({ clientId: SHOP_KEY }) }); }
    catch (err) { return { ok: false, error: err.message }; }
  }
  async function setChannel(channel, clear) {
    return request('/store-bot/set-channel', { method: 'POST', body: JSON.stringify({ clientId: SHOP_KEY, channel, clear }) });
  }
  async function broadcast(text) {
    return request('/store-bot/broadcast', { method: 'POST', body: JSON.stringify({ clientId: SHOP_KEY, text }) });
  }

  async function sendOrder(order) {
    if (!apiBase()) {
      console.error('[Telegram] bot server manzili (bot_api) sozlanmagan — buyurtma kanalga yuborilmadi. Admin paneldan bot serverini saqlang.');
      return { ok: false, error: 'bot_api sozlanmagan' };
    }
    try {
      const payload = {
        id: String(order.id),
        userName: order.userName || order.name,
        phone: order.phone,
        address: order.address,
        payment: order.payment,
        items: (order.items || []).map(i => ({
          name: i.name,
          qty: i.qty,
          // finalPrice = chegirmali narx (mijoz to'laydigan); bo'lmasa oddiy narx
          price: (i.finalPrice != null ? i.finalPrice : (i.price != null ? i.price : 0)),
        })),
        total: order.total,
      };
      console.log('[Telegram] sendOrder →', apiBase() + '/store-bot/order', '| clientId:', SHOP_KEY, '| order:', payload.id);
      const data = await request('/store-bot/order', { method: 'POST', body: JSON.stringify({ clientId: SHOP_KEY, order: payload }) });
      console.log('[Telegram] sendOrder ✓ kanalga yuborildi:', data);
      return { ok: true, ...data };
    } catch (err) {
      console.warn('[Telegram] sendOrder XATO:', err.message, '| bot server:', apiBase(), '| clientId:', SHOP_KEY);
      return { ok: false, error: err.message };
    }
  }

  // Holat o'zgarishi xabarlari hozircha qo'llab-quvvatlanmaydi (no-op)
  async function sendStatusUpdate() { return { ok: true }; }
  function isEnabled() { return true; }

  return { SHOP_KEY, get API_URL() { return apiBase(); }, status, health, connect, disconnect, setChannel, broadcast, sendOrder, sendStatusUpdate, isEnabled };
})();

// MUHIM: window.Telegram'ni ALMASHTIRMAYMIZ — u yerda Telegram Mini App SDK
// (Telegram.WebApp / Telegram.WebView) turadi; Telegram ilovasi viewport hodisalarini
// shu obyekt orqali yuboradi. Faqat o'z metodlarimizni qo'shamiz.
window.Telegram = Object.assign(window.Telegram || {}, Telegram);
