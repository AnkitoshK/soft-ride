const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Default initial seed data (only used when store does not exist)
const INITIAL_BOOKINGS = [
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
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    name: 'Ramesh Singh',
    email: 'ramesh.singh@example.com',
    subject: 'Outstation cab query to Gaya',
    message: 'Need an Ertiga / SUV for 5 people round-trip from Patna to Bodh Gaya on Saturday.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// Persistent state tracking
const deletedBookingsSet = new Set();
const deletedMessagesSet = new Set();
const statusMap = {};

// In-memory fallback store
const fallbackStore = {
  bookings: [...INITIAL_BOOKINGS],
  messages: [...INITIAL_MESSAGES]
};

function getDataFilePath() {
  if (process.env.VERCEL) {
    return '/tmp/softride_store.json';
  }
  try {
    const localDir = path.join(__dirname, '..', '.data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'softride_store.json');
  } catch (e) {
    return path.join(os.tmpdir(), 'softride_store.json');
  }
}

function loadStoreFromDisk() {
  try {
    const file = getDataFilePath();
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      return data;
    }
  } catch (err) {
    console.warn('Could not read persistent store from disk:', err.message);
  }
  return null;
}

function saveStoreToDisk() {
  try {
    const file = getDataFilePath();
    const data = {
      deleted_bookings: Array.from(deletedBookingsSet),
      deleted_messages: Array.from(deletedMessagesSet),
      bookings: fallbackStore.bookings,
      messages: fallbackStore.messages,
      statuses: statusMap
    };
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write persistent store to disk:', err.message);
  }
}

// Hydrate from disk on startup
(() => {
  const saved = loadStoreFromDisk();
  if (saved) {
    if (Array.isArray(saved.deleted_bookings)) {
      saved.deleted_bookings.forEach(id => deletedBookingsSet.add(String(id).trim()));
    }
    if (Array.isArray(saved.deleted_messages)) {
      saved.deleted_messages.forEach(id => deletedMessagesSet.add(String(id).trim()));
    }
    if (Array.isArray(saved.bookings)) {
      fallbackStore.bookings = saved.bookings;
    }
    if (Array.isArray(saved.messages)) {
      fallbackStore.messages = saved.messages;
    }
    if (saved.statuses && typeof saved.statuses === 'object') {
      Object.assign(statusMap, saved.statuses);
    }
  }
  // Enforce deleted filter immediately
  fallbackStore.bookings = fallbackStore.bookings.filter(
    b => !deletedBookingsSet.has(String(b.id).trim()) && !deletedBookingsSet.has(String(b.booking_code).trim())
  );
  fallbackStore.messages = fallbackStore.messages.filter(
    m => !deletedMessagesSet.has(String(m.id).trim())
  );
})();

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
  const code = String(data.booking_code).trim();
  // Clear from deleted set if re-creating
  deletedBookingsSet.delete(code);

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
    saveStoreToDisk();
    return res.rows[0];
  } else {
    const record = {
      id: code,
      booking_code: code,
      status: 'Pending',
      created_at: new Date().toISOString(),
      ...data
    };
    fallbackStore.bookings.unshift(record);
    saveStoreToDisk();
    return record;
  }
}

async function getAllBookings() {
  if (pool) {
    await ensureTables();
    const res = await pool.query('SELECT * FROM soft_ride_bookings ORDER BY created_at DESC');
    return res.rows
      .filter(r => !deletedBookingsSet.has(String(r.id).trim()) && !deletedBookingsSet.has(String(r.booking_code).trim()))
      .map(r => ({
        ...r,
        id: r.booking_code || String(r.id),
        ride_date: r.ride_date ? new Date(r.ride_date).toISOString().split('T')[0] : '',
        ride_time: String(r.ride_time || '').slice(0, 5),
        status: statusMap[r.booking_code] || statusMap[String(r.id)] || r.status
      }));
  }
  return fallbackStore.bookings
    .filter(b => !deletedBookingsSet.has(String(b.id).trim()) && !deletedBookingsSet.has(String(b.booking_code).trim()))
    .map(b => ({
      ...b,
      status: statusMap[b.booking_code] || statusMap[String(b.id)] || b.status
    }));
}

async function updateBookingStatus(codeOrId, status) {
  const strId = String(codeOrId).trim();
  statusMap[strId] = status;

  if (pool) {
    await ensureTables();
    await pool.query(
      'UPDATE soft_ride_bookings SET status = $1 WHERE booking_code = $2 OR id::text = $2',
      [status, strId]
    );
  }
  const item = fallbackStore.bookings.find(b => String(b.booking_code).trim() === strId || String(b.id).trim() === strId);
  if (item) item.status = status;
  saveStoreToDisk();
  return true;
}

async function deleteBooking(id) {
  const strId = String(id).trim();
  deletedBookingsSet.add(strId);

  if (pool) {
    await ensureTables();
    await pool.query('DELETE FROM soft_ride_bookings WHERE id::text = $1 OR booking_code = $1', [strId]);
  }
  fallbackStore.bookings = fallbackStore.bookings.filter(
    b => String(b.id).trim() !== strId && String(b.booking_code).trim() !== strId
  );
  saveStoreToDisk();
  return true;
}

async function createMessage(data) {
  if (pool) {
    await ensureTables();
    const res = await pool.query(
      'INSERT INTO soft_ride_messages (name, email, subject, message) VALUES ($1,$2,$3,$4) RETURNING *',
      [data.name, data.email, data.subject || '', data.message]
    );
    saveStoreToDisk();
    return res.rows[0];
  } else {
    const record = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...data
    };
    fallbackStore.messages.unshift(record);
    saveStoreToDisk();
    return record;
  }
}

async function getAllMessages() {
  if (pool) {
    await ensureTables();
    const res = await pool.query('SELECT * FROM soft_ride_messages ORDER BY created_at DESC');
    return res.rows.filter(m => !deletedMessagesSet.has(String(m.id).trim()));
  }
  return fallbackStore.messages.filter(m => !deletedMessagesSet.has(String(m.id).trim()));
}

async function deleteMessage(id) {
  const strId = String(id).trim();
  deletedMessagesSet.add(strId);

  if (pool) {
    await ensureTables();
    await pool.query('DELETE FROM soft_ride_messages WHERE id::text = $1', [strId]);
  }
  fallbackStore.messages = fallbackStore.messages.filter(m => String(m.id).trim() !== strId);
  saveStoreToDisk();
  return true;
}

function syncDeletedBookings(ids = []) {
  if (!Array.isArray(ids)) return;
  let changed = false;
  for (const id of ids) {
    const s = String(id).trim();
    if (s && !deletedBookingsSet.has(s)) {
      deletedBookingsSet.add(s);
      changed = true;
    }
  }
  if (changed) {
    fallbackStore.bookings = fallbackStore.bookings.filter(
      b => !deletedBookingsSet.has(String(b.id).trim()) && !deletedBookingsSet.has(String(b.booking_code).trim())
    );
    saveStoreToDisk();
  }
}

function syncDeletedMessages(ids = []) {
  if (!Array.isArray(ids)) return;
  let changed = false;
  for (const id of ids) {
    const s = String(id).trim();
    if (s && !deletedMessagesSet.has(s)) {
      deletedMessagesSet.add(s);
      changed = true;
    }
  }
  if (changed) {
    fallbackStore.messages = fallbackStore.messages.filter(
      m => !deletedMessagesSet.has(String(m.id).trim())
    );
    saveStoreToDisk();
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  createMessage,
  getAllMessages,
  deleteMessage,
  syncDeletedBookings,
  syncDeletedMessages,
  getDeletedBookingIds: () => Array.from(deletedBookingsSet),
  getDeletedMessageIds: () => Array.from(deletedMessagesSet),
  isPostgres: () => Boolean(pool)
};
