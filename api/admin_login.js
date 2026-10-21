const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RideAdmin@2026';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { username, password } = body || {};

    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      // In serverless, set a cookie or return success token
      res.setHeader('Set-Cookie', 'softride_admin=authenticated; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400');
      return res.status(200).json({ ok: true, admin: 'Juli Kumari / Admin', token: 'softride-admin-token' });
    }

    return res.status(401).json({ error: 'Invalid username or password.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
};
