module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Set-Cookie', 'softride_admin=; Path=/; HttpOnly; Max-Age=0');
  return res.status(200).json({ ok: true });
};
