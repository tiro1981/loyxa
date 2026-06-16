// Ovqat Dokoni — do'kon boti (store-bot) API klienti.
// Do'kon egasi o'z bot tokenini admin paneldan ulaydi. Buyurtma store-bot
// serveriga (bot/bot.py, port 3344) yuboriladi, server uni kanalga uzatadi.
// Har bir do'kon clientId kaliti bilan ajratiladi: <client>__ovqat.
const Telegram = (() => {
  // Do'kon kaliti — dashboarddan ?client=... bo'lsa o'sha, aks holda 'shop'
  const SHOP_KEY = (
    new URLSearchParams(location.search).get('client') ||
    (() => { try { return JSON.parse(localStorage.getItem('bo_session') || '{}').clientId; } catch { return null; } })() ||
    'shop'
  ) + '__ovqat';

  // Bot server manzili (platforma sozlamasi bilan bir xil kalit)
  const API_URL = (
    localStorage.getItem('bo_bot_api') ||
    localStorage.getItem('ovqat_bot_http_url') ||
    'http://localhost:3344'
  ).replace(/\/+$/, '');

  async function request(path, opts = {}) {
    const res = await fetch(API_URL + path, {
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
    try {
      const payload = {
        id: String(order.id),
        userName: order.userName || order.name,
        phone: order.phone,
        address: order.address,
        items: (order.items || []).map(i => ({
          name: i.name,
          qty: i.qty,
          // finalPrice = chegirmali narx (mijoz to'laydigan); bo'lmasa oddiy narx
          price: (i.finalPrice != null ? i.finalPrice : (i.price != null ? i.price : 0)),
        })),
        total: order.total,
      };
      const data = await request('/store-bot/order', { method: 'POST', body: JSON.stringify({ clientId: SHOP_KEY, order: payload }) });
      return { ok: true, ...data };
    } catch (err) {
      console.warn('[Telegram] sendOrder failed:', err.message);
      return { ok: false, error: err.message };
    }
  }

  // Holat o'zgarishi xabarlari hozircha qo'llab-quvvatlanmaydi (no-op)
  async function sendStatusUpdate() { return { ok: true }; }
  function isEnabled() { return true; }

  return { SHOP_KEY, API_URL, status, health, connect, disconnect, setChannel, broadcast, sendOrder, sendStatusUpdate, isEnabled };
})();

window.Telegram = Telegram;
