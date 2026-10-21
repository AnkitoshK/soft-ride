const db = require('./_db');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const required = ['pickup', 'dropoff', 'vehicle', 'rideDate', 'rideTime', 'name', 'phone', 'email'];

    for (const key of required) {
      if (!body[key] || String(body[key]).trim() === '') {
        return res.status(422).json({ error: `Please complete all required fields (${key}).` });
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return res.status(422).json({ error: 'Enter a valid email address.' });
    }

    const code = 'SR' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const bookingData = {
      booking_code: code,
      pickup: String(body.pickup).trim(),
      dropoff: String(body.dropoff).trim(),
      distance: parseFloat(body.distance) || 0,
      instructions: String(body.instructions || '').trim(),
      vehicle: String(body.vehicle).trim(),
      fare: parseFloat(body.fare) || 0,
      ride_date: body.rideDate,
      ride_time: body.rideTime,
      passengers: parseInt(body.passengers, 10) || 1,
      luggage: String(body.luggage || '').trim(),
      customer_name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email).trim(),
      payment: String(body.payment || 'cash').trim()
    };

    const saved = await db.createBooking(bookingData);

    return res.status(201).json({
      id: code,
      success: true,
      message: 'Booking confirmed successfully!',
      booking: saved,
      smsSent: false,
      smsConfigured: false,
      contactPerson: 'Juli Kumari',
      helpline: '+91 9142491242'
    });
  } catch (err) {
    console.error('Booking API Error:', err);
    return res.status(500).json({ error: 'Booking could not be saved. Please try again.' });
  }
};
