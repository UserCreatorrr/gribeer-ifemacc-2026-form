const N8N_WEBHOOK = 'https://1-n8n.2e26n3.easypanel.host/webhook-test/9ad22ae6-d655-4072-8d7f-d78dce32348f';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body || {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const status = response.status;

    let text = '{}';
    try {
      const bodyTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('body timeout')), 12000)
      );
      text = await Promise.race([response.text(), bodyTimeout]);
    } catch {
      // ignore body read failure
    }

    return res.status(status).send(text);

  } catch (err) {
    console.error('Proxy error:', err);
    if (err.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'timeout' });
    }
    return res.status(500).json({ error: err.message });
  }
};
