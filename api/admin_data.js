const db = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

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
