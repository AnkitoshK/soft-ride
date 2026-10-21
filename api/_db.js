const { Pool } = require('pg');

let pool = null;
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  } catch (err) {
    console.error('Failed to initialize Postgres pool:', err.message);
  }
}

// In-memory fallback store
const fallbackStore = {
  bookings: [
    {
      id: 'SR9A4F12',
      booking_code: 'SR9A4F12',
      customer_name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.sharma@example.com',
      pickup: 'Patna Airport (PAT)',
      dropoff: 'Gandhi Maidan, Patna',
      distance: 8,
      vehicle: 'Sedan',
      fare: 150,
      ride_date: '2026-10-22',
      ride_time: '10:30',
      passengers: 2,
      luggage: 'medium',
      payment: 'cash',
      status: 'Confirmed',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'SR8B2C44',
      booking_code: 'SR8B2C44',
      customer_name: 'Rahul Verma',
      phone: '+91 91234 56789',
      email: 'rahul.verma@example.com',
      pickup: 'Ara Junction',
      dropoff: 'Boring Road, Patna',
      distance: 55,
      vehicle: 'SUV',
      fare: 990,
      ride_date: '2026-10-22',
      ride_time: '14:00',
      passengers: 4,
      luggage: 'large',
      payment: 'upi',
      status: 'Pending',
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ],
  messages: [
    {
      id: 1,
      name: 'Ramesh Singh',
      email: 'ramesh.singh@example.com',
      subject: 'Outstation cab query to Gaya',
      message: 'Need an Ertiga / SUV for 5 people round-trip from Patna to Bodh Gaya on Saturday.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]
};

let tablesInitialized = false;

async function ensureTables() {
  if (!pool || tablesInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS soft_ride_bookings (
        id SERIAL PRIMARY KEY,
        booking_code VARCHAR(32) NOT NULL UNIQUE,
        pickup VARCHAR(255) NOT NULL,
        dropoff VARCHAR(255) NOT NULL,
        distance NUMERIC(8,2) NOT NULL DEFAULT 0,
        instructions TEXT,
        vehicle VARCHAR(80) NOT NULL,
        fare NUMERIC(10,2) NOT NULL DEFAULT 0,
        ride_date DATE NOT NULL,
        ride_time TIME NOT NULL,
        passengers SMALLINT NOT NULL DEFAULT 1,
        luggage VARCHAR(80),
        customer_name VARCHAR(160) NOT NULL,
        phone VARCHAR(40) NOT NULL,
        email VARCHAR(190) NOT NULL,
        payment VARCHAR(40),
        status VARCHAR(40) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS soft_ride_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        email VARCHAR(190) NOT NULL,
        subject VARCHAR(200),
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesInitialized = true;
  } catch (err) {
    console.error('Error creating Postgres tables:', err.message);
  }
}

async function createBooking(data) {
  if (pool) {
    await ensureTables();
    const res = await pool.query(
      `INSERT INTO soft_ride_bookings (
        booking_code, pickup, dropoff, distance, instructions,
        vehicle, fare, ride_date, ride_time, passengers,
        luggage, customer_name, phone, email, payment
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        data.booking_code,
        data.pickup,
        data.dropoff,
        data.distance || 0,
        data.instructions || '',
        data.vehicle,
        data.fare || 0,
        data.ride_date,
        data.ride_time,
        data.passengers || 1,
        data.luggage || '',
        data.customer_name,
        data.phone,
        data.email,
        data.payment || 'cash'
      ]
    );
    return res.rows[0];
  } else {
    const record = {
      id: data.booking_code,
      booking_code: data.booking_code,
      status: 'Pending',
      created_at: new Date().toISOString(),
      ...data
    };
    fallbackStore.bookings.unshift(record);
    return record;
  }
}

async function getAllBookings() {
  if (pool) {
    await ensureTables();
    const res = await pool.query('SELECT * FROM soft_ride_bookings ORDER BY created_at DESC');
    return res.rows.map(r => ({
      ...r,
      id: r.booking_code || String(r.id),
      ride_date: r.ride_date ? new Date(r.ride_date).toISOString().split('T')[0] : '',
      ride_time: String(r.ride_time || '').slice(0, 5)
    }));
  }
  return fallbackStore.bookings;
}

async function updateBookingStatus(codeOrId, status) {
  if (pool) {
    await ensureTables();
    await pool.query(
      'UPDATE soft_ride_bookings SET status = $1 WHERE booking_code = $2 OR id::text = $2',
      [status, String(codeOrId)]
    );
    return true;
  }
  const item = fallbackStore.bookings.find(b => b.booking_code === codeOrId || String(b.id) === String(codeOrId));
  if (item) item.status = status;
  return true;
}

async function createMessage(data) {
  if (pool) {
    await ensureTables();
    const res = await pool.query(
      'INSERT INTO soft_ride_messages (name, email, subject, message) VALUES ($1,$2,$3,$4) RETURNING *',
      [data.name, data.email, data.subject || '', data.message]
    );
    return res.rows[0];
  } else {
    const record = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...data
    };
    fallbackStore.messages.unshift(record);
    return record;
  }
}

async function getAllMessages() {
  if (pool) {
    await ensureTables();
    const res = await pool.query('SELECT * FROM soft_ride_messages ORDER BY created_at DESC');
    return res.rows;
  }
  return fallbackStore.messages;
}

async function deleteMessage(id) {
  if (pool) {
    await ensureTables();
    await pool.query('DELETE FROM soft_ride_messages WHERE id = $1', [id]);
    return true;
  }
  fallbackStore.messages = fallbackStore.messages.filter(m => String(m.id) !== String(id));
  return true;
}

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  createMessage,
  getAllMessages,
  deleteMessage,
  isPostgres: () => Boolean(pool)
};
