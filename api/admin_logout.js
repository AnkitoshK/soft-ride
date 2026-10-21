module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.setHeader('Set-Cookie', 'softride_admin=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
  return res.status(200).json({ ok: true, message: 'Logged out successfully' });
};
