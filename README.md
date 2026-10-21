# 🚕 Soft Ride - Modern Cab Booking & Fleet Dispatch Platform

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org)
[![Postgres](https://img.shields.io/badge/Postgres-Compatible-blue.svg?logo=postgresql)](https://vercel.com/docs/storage/vercel-postgres)

> **Soft Ride** is a production-grade, full-stack cab booking and fleet dispatch web platform designed for urban commutes, airport transfers, corporate travel, outstation journeys, and luxury rentals across Ara, Patna, Bihar, and Eastern India.

---

## 👩‍💼 Executive Leadership & Contact

* **Founder & Managing Director:** **Juli Kumari**
* **Direct Helpline & Dispatch:** **[+91 9142491242](tel:+919142491242)**
* **Official WhatsApp:** **[+91 9142491242](https://wa.me/919142491242?text=Hello%20Juli%20Kumari,%20I%20want%20to%20book%20a%20Soft%20Ride%20cab)**
* **Official Email:** `julikumari.softride@gmail.com` / `info@softride.com`
* **Headquarters:** Ara & Exhibition Road, Patna, Bihar - 800001, India

---

## ✨ Features

- ⚡ **5-Step Interactive Booking Engine:**
  - **Step 1 (Location):** Pickup & drop entries with quick-route chips (Patna Airport → Gandhi Maidan, Patna Jn → Danapur, Patna → Ara, Patna → Gaya, Patna → Muzaffarpur).
  - **Step 2 (Fleet Selection):** Real-time vehicle cards with seat, luggage, AC info, and per-km pricing (Sedan ₹12/km, SUV ₹18/km, Van/Crysta ₹25/km, Luxury ₹40/km).
  - **Step 3 (Schedule & Luggage):** Date & time picker with min-date enforcement and passenger sizing.
  - **Step 4 (Passenger Details):** Contact info with instant validation and direct dispatch helpline notice.
  - **Step 5 (Confirmation & Fare Breakdown):** Total transparent fare computation with no hidden fees.
- 🧾 **Official Printable Travel Pass & Receipt:**
  - Branded Soft Ride receipt with unique `#SR...` booking reference code.
  - One-click **Print / Download PDF Receipt** (`window.print()`).
  - One-click **WhatsApp Direct Confirmation** to Juli Kumari (`+91 9142491242`) with pre-filled ride itinerary.
- 🚖 **Comprehensive Fleet & Services Pages:**
  - Dedicated pages for Fleet, Services (City Ride, Airport Transfer, Corporate, Outstation, Luxury, Hourly Rentals), Pricing, Client Reviews, and Contact.
- 🔔 **24/7 Top Bar & Floating Quick Action Buttons:**
  - Fixed WhatsApp & direct phone call buttons on all pages.
- 🔐 **Full-Featured Admin & Dispatch Console (`/admin`):**
  - Secure credential-based sign in (`admin` / `RideAdmin@2026`).
  - Live statistics: Total Bookings, Pending, Confirmed, Inquiries.
  - Interactive status dropdown (Pending ➔ Confirmed ➔ Completed ➔ Cancelled).
  - Real-time search across passengers, phone, booking ID, and routes.
  - **Export to CSV:** Download all ride records in 1-click.
  - Delete and manage customer inquiry messages.
- 🚀 **Dual-Engine Fullstack Architecture:**
  - **Serverless Node.js Engine (for Vercel & Cloud Platforms):** Serverless handlers in `/api/*.js` supporting Vercel Postgres / Neon with resilient fallback store.
  - **PHP / PDO Engine (for Local XAMPP, Apache, cPanel):** Complete backend in `/api/*.php` with MySQL support.

---

## 🛠️ Tech Stack

* **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism, Micro-animations), Vanilla JavaScript (ES6+), Font Awesome 6, Google Poppins Font.
* **Serverless Backend:** Node.js Serverless Functions (`/api/bookings.js`, `/api/messages.js`, `/api/admin_*.js`).
* **Database:** 
  * **Vercel Postgres / Neon / PostgreSQL** via `pg` connection pool.
  * In-memory / state resilience fallback if DB credentials are not yet set.
  * **MySQL** schema (`database.sql`) for Apache/XAMPP environments.
* **Hosting & CI/CD:** Vercel & GitHub.

---

## 🚀 Getting Started Locally

### Option 1: Node.js (Recommended for Vercel-like experience)

1. Clone repository:
   ```bash
   git clone https://github.com/AnkitoshK/soft-ride.git
   cd soft-ride
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm start
   ```
4. Open your browser:
   - Website: `http://localhost:3005`
   - Admin Portal: `http://localhost:3005/admin/index.html`

### Option 2: PHP / Apache (XAMPP / WAMP)

1. Move the folder to `htdocs/soft-ride`.
2. Import `database.sql` into MySQL (`softride` database).
3. Open `http://localhost/soft-ride/` in your browser.

---

## ☁️ Deploy to Vercel

### Step 1: Deploy from GitHub or CLI
You can deploy this repository to Vercel with zero configuration:
```bash
npx vercel
```
Or import the repository directly in the [Vercel Dashboard](https://vercel.com/new).

### Step 2: Add Vercel Postgres (Optional for persistent database)
1. In your project dashboard on Vercel, navigate to the **Storage** tab.
2. Click **Create Database** and select **Postgres** (Neon powered).
3. Connect the Postgres database to your project. Vercel automatically injects:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
4. Deploy / Redeploy! Soft Ride automatically initializes the database tables (`soft_ride_bookings` and `soft_ride_messages`) upon the first request.

*Note: If no database is connected, Soft Ride operates with its built-in in-memory fallback store so your live demo runs with 100% uptime immediately.*

---

## 🗄️ Database Schema

```sql
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
```

---

## 🔑 Admin Console Credentials

* **URL:** `/admin/index.html`
* **Default Username:** `admin`
* **Default Password:** `RideAdmin@2026`

To change admin credentials, set the following environment variables in Vercel or your `.env` file:
```env
ADMIN_USER=your_custom_username
ADMIN_PASSWORD=your_strong_password
```

---

## 📞 Support & Contacts

For bookings, urgent fleet dispatch, or enterprise tie-ups:
* **Contact Person:** **Juli Kumari**
* **Helpline:** **+91 9142491242**
* **Email:** `julikumari.softride@gmail.com`
* **Location:** Ara & Patna, Bihar, India
* **Web:** Soft Ride 2026
