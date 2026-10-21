const db = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();
    const subject = String(body.subject || '').trim();

    if (!name || !email || !message) {
      return res.status(422).json({ error: 'Please complete all required fields.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ error: 'Enter a valid email address.' });
    }

    await db.createMessage({ name, email, subject, message });

    return res.status(201).json({
      ok: true,
      message: 'Thank you! Your message has been received by Juli Kumari and the Soft Ride team.'
    });
  } catch (err) {
    console.error('Messages API Error:', err);
    return res.status(500).json({ error: 'Message could not be saved. Please try again.' });
  }
};
