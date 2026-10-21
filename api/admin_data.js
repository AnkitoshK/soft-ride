const db = require('./_db');
const { isAuthenticated } = require('./_auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to access the admin portal.' });
  }

  try {
    const bookings = await db.getAllBookings();
    const messages = await db.getAllMessages();

    return res.status(200).json({
      bookings,
      messages,
      isPostgres: db.isPostgres(),
      adminName: 'Juli Kumari',
      helpline: '+91 9142491242'
    });
  } catch (err) {
    console.error('admin_data error:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin data' });
  }
};
