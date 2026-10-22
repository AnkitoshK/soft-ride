const db = require('./_db');
const { isAuthenticated } = require('./_auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token,X-Deleted-Messages');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { id } = body || {};

    if (!id) {
      return res.status(422).json({ error: 'Missing message ID.' });
    }

    await db.deleteMessage(id);
    return res.status(200).json({
      ok: true,
      id,
      message: 'Message inquiry deleted successfully',
      deletedMessages: db.getDeletedMessageIds()
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete message.' });
  }
};
