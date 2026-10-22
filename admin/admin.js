const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let data = { bookings: [], messages: [] };
let view = 'bookings';

function getDeletedBookings() {
    try {
        return JSON.parse(localStorage.getItem('softride_deleted_bookings') || '[]');
    } catch (e) {
        return [];
    }
}

function saveDeletedBooking(id) {
    const list = getDeletedBookings();
    const strId = String(id).trim();
    if (!list.includes(strId)) {
        list.push(strId);
        localStorage.setItem('softride_deleted_bookings', JSON.stringify(list));
    }
}

function getDeletedMessages() {
    try {
        return JSON.parse(localStorage.getItem('softride_deleted_messages') || '[]');
    } catch (e) {
        return [];
    }
}

function saveDeletedMessage(id) {
    const list = getDeletedMessages();
    const strId = String(id).trim();
    if (!list.includes(strId)) {
        list.push(strId);
        localStorage.setItem('softride_deleted_messages', JSON.stringify(list));
    }
}

function getLocalStatuses() {
    try {
        return JSON.parse(localStorage.getItem('softride_booking_statuses') || '{}');
    } catch (e) {
        return {};
    }
}

function saveLocalStatus(id, status) {
    const map = getLocalStatuses();
    map[String(id).trim()] = status;
    localStorage.setItem('softride_booking_statuses', JSON.stringify(map));
}

async function api(url, opts = {}) {
    const token = sessionStorage.getItem('softride_admin_token') || '';
    const deletedB = getDeletedBookings();
    const deletedM = getDeletedMessages();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}`, 'X-Admin-Token': token } : {}),
        'X-Deleted-Bookings': JSON.stringify(deletedB),
        'X-Deleted-Messages': JSON.stringify(deletedM),
        ...(opts.headers || {})
    };

    let r;
    try {
        r = await fetch(url, { ...opts, credentials: 'include', headers });
    } catch (err) {
        // Fallback for extensionless endpoint if .php failed
        const altUrl = url.endsWith('.php') ? url.replace(/\.php$/, '') : url + '.php';
        r = await fetch(altUrl, { ...opts, credentials: 'include', headers });
    }

    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Request failed with status ' + r.status);
    return j;
}

function logged(on) {
    const loginSection = $('#login');
    const dashboardSection = $('#dashboard');
    if (loginSection) loginSection.hidden = on;
    if (dashboardSection) dashboardSection.hidden = !on;
}

async function load() {
    try {
        const res = await api('../api/admin_data.php');

        // Merge server deleted lists if provided
        if (Array.isArray(res.deletedBookings)) {
            const current = new Set(getDeletedBookings());
            res.deletedBookings.forEach(id => current.add(String(id).trim()));
            localStorage.setItem('softride_deleted_bookings', JSON.stringify(Array.from(current)));
        }
        if (Array.isArray(res.deletedMessages)) {
            const current = new Set(getDeletedMessages());
            res.deletedMessages.forEach(id => current.add(String(id).trim()));
            localStorage.setItem('softride_deleted_messages', JSON.stringify(Array.from(current)));
        }

        const deletedB = new Set(getDeletedBookings());
        const deletedM = new Set(getDeletedMessages());
        const statuses = getLocalStatuses();

        let bookings = (res.bookings || []).filter(b => {
            const id = String(b.id || '').trim();
            const code = String(b.booking_code || '').trim();
            return !deletedB.has(id) && !deletedB.has(code);
        });

        // Merge any locally created bookings from booking.html
        try {
            const clientBookings = JSON.parse(localStorage.getItem('softride_client_bookings') || '[]');
            clientBookings.forEach(cb => {
                const code = String(cb.booking_code || cb.id || '').trim();
                if (!deletedB.has(code) && !bookings.some(b => String(b.booking_code || b.id || '').trim() === code)) {
                    bookings.unshift(cb);
                }
            });
        } catch (e) {}

        // Apply any status overrides
        bookings = bookings.map(b => {
            const code = String(b.booking_code || b.id || '').trim();
            return {
                ...b,
                status: statuses[code] || statuses[String(b.id)] || b.status
            };
        });

        let messages = (res.messages || []).filter(m => {
            return !deletedM.has(String(m.id).trim());
        });

        data = {
            bookings,
            messages,
            isPostgres: res.isPostgres
        };

        logged(true);
        $('#total').textContent = data.bookings.length;
        $('#pending').textContent = data.bookings.filter(x => x.status === 'Pending').length;
        $('#confirmed').textContent = data.bookings.filter(x => x.status === 'Confirmed').length;
        $('#messageCount').textContent = data.messages.length;
        render();
    } catch (e) {
        // Not authenticated
        logged(false);
    }
}

function render() {
    const q = ($('#search')?.value || '').toLowerCase();
    $('#crumb').textContent = view.toUpperCase();
    $('#viewTitle').textContent = view === 'bookings' ? 'Ride Bookings' : 'Customer Messages';

    if (view === 'bookings') {
        const rows = data.bookings.filter(x => [x.id, x.booking_code, x.customer_name, x.phone, x.pickup, x.dropoff, x.status].join(' ').toLowerCase().includes(q));
        $('#search').placeholder = 'Search bookings, customers, phone…';
        $('#tableWrap').innerHTML = rows.length ? `
            <table>
                <thead>
                    <tr>
                        <th>BOOKING / CUSTOMER</th>
                        <th>JOURNEY</th>
                        <th>RIDE & PAX</th>
                        <th>DATE & TIME</th>
                        <th>FARE</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(x => {
                        const code = x.booking_code || x.id;
                        return `
                        <tr>
                            <td>
                                <strong>#${esc(code)}</strong><br>
                                ${esc(x.customer_name)}<br>
                                <a href="tel:${esc(x.phone)}" style="color:#0284c7;text-decoration:none;">${esc(x.phone)}</a><br>
                                <small style="color:#64748b;">${esc(x.email)}</small>
                            </td>
                            <td>
                                <strong>From:</strong> ${esc(x.pickup)}<br>
                                <strong>To:</strong> ${esc(x.dropoff)}<br>
                                <small style="color:#64748b;">Distance: ${esc(x.distance || '—')} km</small>
                            </td>
                            <td>
                                <strong>${esc(x.vehicle)}</strong><br>
                                ${esc(x.passengers || 1)} Pax • ${esc(x.luggage || 'None')}<br>
                                <small style="color:#64748b;">Pay: ${esc(String(x.payment || 'Cash').toUpperCase())}</small>
                            </td>
                            <td>
                                ${esc(x.ride_date)}<br>
                                <strong>${esc(x.ride_time)}</strong>
                            </td>
                            <td>
                                <strong style="font-size:16px;color:#1e293b;">₹${esc(x.fare)}</strong>
                            </td>
                            <td>
                                <select class="status ${esc(x.status)}" data-id="${esc(code)}">
                                    ${['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => `<option value="${s}" ${s === x.status ? 'selected' : ''}>${s}</option>`).join('')}
                                </select>
                            </td>
                            <td>
                                <button class="btn-delete delete-booking" data-id="${esc(code)}" title="Delete booking entry">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;}).join('')}
                </tbody>
            </table>
        ` : '<div class="empty" style="padding:40px;text-align:center;color:#64748b;">No bookings found matching query.</div>';
    } else {
        const rows = data.messages.filter(x => [x.name, x.email, x.subject, x.message].join(' ').toLowerCase().includes(q));
        $('#search').placeholder = 'Search messages by sender, email…';
        $('#tableWrap').innerHTML = rows.length ? `
            <table>
                <thead>
                    <tr>
                        <th>FROM</th>
                        <th>SUBJECT</th>
                        <th>MESSAGE</th>
                        <th>RECEIVED</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(x => `
                        <tr>
                            <td>
                                <strong>${esc(x.name)}</strong><br>
                                <a href="mailto:${esc(x.email)}" style="color:#0284c7;">${esc(x.email)}</a>
                            </td>
                            <td><strong>${esc(x.subject || 'Inquiry')}</strong></td>
                            <td style="max-width:300px;line-height:1.5;">${esc(x.message)}</td>
                            <td><small style="color:#64748b;">${new Date(x.created_at).toLocaleString()}</small></td>
                            <td>
                                <button class="btn-delete delete-message" data-id="${esc(x.id)}" title="Delete message">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<div class="empty" style="padding:40px;text-align:center;color:#64748b;">No messages found yet.</div>';
    }
}

// Export Bookings to CSV
function exportCSV() {
    if (!data.bookings.length) {
        alert('No bookings available to export.');
        return;
    }
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Email', 'Pickup', 'Dropoff', 'Distance (km)', 'Vehicle', 'Fare', 'Date', 'Time', 'Passengers', 'Luggage', 'Payment', 'Status'];
    const rows = data.bookings.map(b => [
        `"${b.booking_code || b.id}"`,
        `"${b.customer_name || ''}"`,
        `"${b.phone || ''}"`,
        `"${b.email || ''}"`,
        `"${(b.pickup || '').replace(/"/g, '""')}"`,
        `"${(b.dropoff || '').replace(/"/g, '""')}"`,
        b.distance || 0,
        `"${b.vehicle || ''}"`,
        b.fare || 0,
        `"${b.ride_date || ''}"`,
        `"${b.ride_time || ''}"`,
        b.passengers || 1,
        `"${b.luggage || ''}"`,
        `"${b.payment || ''}"`,
        `"${b.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SoftRide_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
$('#loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    $('#loginError').textContent = '';
    const submitBtn = $('#loginForm button');
    if (submitBtn) submitBtn.disabled = true;

    try {
        const res = await api('../api/admin_login.php', {
            method: 'POST',
            body: JSON.stringify({
                username: $('#username').value,
                password: $('#password').value
            })
        });

        if (res.token) {
            sessionStorage.setItem('softride_admin_token', res.token);
        }

        await load();
    } catch (err) {
        $('#loginError').textContent = err.message || 'Login failed. Invalid username or password.';
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

document.querySelectorAll('.nav').forEach(b => {
    b.onclick = () => {
        view = b.dataset.view;
        document.querySelectorAll('.nav').forEach(n => n.classList.toggle('active', n === b));
        render();
    };
});

$('#refresh')?.addEventListener('click', load);
$('#search')?.addEventListener('input', render);
$('#exportBtn')?.addEventListener('click', exportCSV);

// Sign Out Handler
$('#logout')?.addEventListener('click', async () => {
    sessionStorage.removeItem('softride_admin_token');
    try {
        await api('../api/admin_logout.php', { method: 'POST' });
    } catch (e) {}
    logged(false);
    if ($('#password')) $('#password').value = '';
    alert('Logged out successfully.');
});

// Table interactions: Status update & Delete actions
$('#tableWrap')?.addEventListener('change', async e => {
    if (e.target.matches('select.status')) {
        const id = String(e.target.dataset.id || '').trim();
        const status = e.target.value;

        saveLocalStatus(id, status);
        const item = data.bookings.find(b => String(b.booking_code || b.id).trim() === id);
        if (item) item.status = status;
        $('#pending').textContent = data.bookings.filter(x => x.status === 'Pending').length;
        $('#confirmed').textContent = data.bookings.filter(x => x.status === 'Confirmed').length;

        try {
            await api('../api/admin_booking_status.php', {
                method: 'POST',
                body: JSON.stringify({ id, status })
            });
            await load();
        } catch (err) {
            console.warn('Status update notice:', err.message);
        }
    }
});

$('#tableWrap')?.addEventListener('click', async e => {
    // Delete Booking
    const bookingBtn = e.target.closest('.delete-booking');
    if (bookingBtn) {
        const id = String(bookingBtn.dataset.id || '').trim();
        if (!confirm(`Are you sure you want to permanently delete booking #${id}?`)) return;

        // 1. Permanently record deletion locally so it NEVER returns after refresh
        saveDeletedBooking(id);

        // 2. Remove from locally stored client bookings
        try {
            const clientBookings = JSON.parse(localStorage.getItem('softride_client_bookings') || '[]');
            const filtered = clientBookings.filter(b => String(b.booking_code || b.id).trim() !== id);
            localStorage.setItem('softride_client_bookings', JSON.stringify(filtered));
        } catch (e) {}

        // 3. Instant UI feedback (optimistic update)
        data.bookings = data.bookings.filter(b => String(b.booking_code || b.id).trim() !== id && String(b.id).trim() !== id);
        $('#total').textContent = data.bookings.length;
        $('#pending').textContent = data.bookings.filter(x => x.status === 'Pending').length;
        $('#confirmed').textContent = data.bookings.filter(x => x.status === 'Confirmed').length;
        render();

        // 4. Send delete to backend to update server file/db
        try {
            await api('../api/admin_booking_delete.php', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
        } catch (err) {
            console.warn('Backend delete sync completed with notice:', err.message);
        }
        await load();
        return;
    }

    // Delete Message
    const msgBtn = e.target.closest('.delete-message');
    if (msgBtn) {
        const id = String(msgBtn.dataset.id || '').trim();
        if (!confirm('Are you sure you want to delete this customer inquiry?')) return;

        // 1. Permanently record deletion locally
        saveDeletedMessage(id);

        // 2. Instant UI feedback
        data.messages = data.messages.filter(m => String(m.id).trim() !== id);
        $('#messageCount').textContent = data.messages.length;
        render();

        // 3. Send delete to backend
        try {
            await api('../api/admin_message_delete.php', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
        } catch (err) {
            console.warn('Backend delete sync completed with notice:', err.message);
        }
        await load();
        return;
    }
});

// Run load on start
load();
