const db = require('./_db');
const { isAuthenticated } = require('./_auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token,X-Deleted-Bookings,X-Deleted-Messages');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to access the admin portal.' });
  }

  try {
    // Sync any deleted booking IDs passed from client
    const headerDeletedBookings = req.headers['x-deleted-bookings'];
    if (headerDeletedBookings) {
      try {
        const ids = JSON.parse(headerDeletedBookings);
        db.syncDeletedBookings(ids);
      } catch (e) {
        db.syncDeletedBookings(String(headerDeletedBookings).split(',').map(s => s.trim()));
      }
    }

    // Sync any deleted message IDs passed from client
    const headerDeletedMessages = req.headers['x-deleted-messages'];
    if (headerDeletedMessages) {
      try {
        const ids = JSON.parse(headerDeletedMessages);
        db.syncDeletedMessages(ids);
      } catch (e) {
        db.syncDeletedMessages(String(headerDeletedMessages).split(',').map(s => s.trim()));
      }
    }

    const bookings = await db.getAllBookings();
    const messages = await db.getAllMessages();

    return res.status(200).json({
      bookings,
      messages,
      deletedBookings: db.getDeletedBookingIds(),
      deletedMessages: db.getDeletedMessageIds(),
      isPostgres: db.isPostgres(),
      adminName: 'Juli Kumari',
      helpline: '+91 9142491242'
    });
  } catch (err) {
    console.error('admin_data error:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin data' });
  }
};
