const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RideAdmin@2026';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();

    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      res.setHeader('Set-Cookie', 'softride_admin=authenticated; Path=/; SameSite=Lax; Max-Age=86400');
      return res.status(200).json({
        ok: true,
        token: 'softride-admin-token',
        admin: 'Juli Kumari / Admin'
      });
    }

    return res.status(401).json({ error: 'Invalid username or password.' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
};
