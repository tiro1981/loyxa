// Salqin — Python Telegram bot API kliyenti
// Frontend buyurtmani Python serverga yuboradi, server esa kanalga uzatadi.
// Bot tokeni va kanal sozlamalari server tomonida (.env) — bu yerda yo'q.
const Telegram = (() => {
  // API URL ni o'zgartirish uchun: localStorage.setItem('si_api_url', 'https://...')
  const API_URL = (localStorage.getItem('si_api_url') || 'http://localhost:5000')
    .replace(/\/$/, '');

  async function request(path, opts = {}) {
    try {
      const res = await fetch(API_URL + path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async function health() {
    try { return await request('/api/health'); }
    catch (err) { return { ok: false, error: err.message }; }
  }

  async function sendOrder(order) {
    try {
      const data = await request('/api/order', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      console.log('[Telegram] order sent:', data);
      return { ok: true, ...data };
    } catch (err) {
      console.warn('[Telegram] sendOrder failed:', err.message);
      return { ok: false, error: err.message };
    }
  }

  async function sendStatusUpdate(order) {
    try {
      const data = await request('/api/status', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          status: order.status,
          name: order.name,
          phone: order.phone,
        }),
      });
      return { ok: true, ...data };
    } catch (err) {
      console.warn('[Telegram] sendStatusUpdate failed:', err.message);
      return { ok: false, error: err.message };
    }
  }

  // Backward-compatibility — har doim "yoqilgan" deb hisoblaymiz
  // (server o'zi tekshiradi va xato qaytaradi).
  function isEnabled() { return true; }

  return { sendOrder, sendStatusUpdate, health, isEnabled, API_URL };
})();
