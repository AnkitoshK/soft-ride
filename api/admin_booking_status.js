const db = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { id, status } = body || {};

    if (!id || !status) {
      return res.status(422).json({ error: 'Missing booking ID or status.' });
    }

    await db.updateBookingStatus(id, status);
    return res.status(200).json({ ok: true, id, status });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update booking status.' });
  }
};
