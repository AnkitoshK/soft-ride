const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let data = { bookings: [], messages: [] };
let view = 'bookings';

async function api(url, opts = {}) {
    const token = sessionStorage.getItem('softride_admin_token') || '';
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}`, 'X-Admin-Token': token } : {}),
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
        data = await api('../api/admin_data.php');
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
        try {
            await api('../api/admin_booking_status.php', {
                method: 'POST',
                body: JSON.stringify({ id: e.target.dataset.id, status: e.target.value })
            });
            await load();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    }
});

$('#tableWrap')?.addEventListener('click', async e => {
    // Delete Booking
    const bookingBtn = e.target.closest('.delete-booking');
    if (bookingBtn) {
        const id = bookingBtn.dataset.id;
        if (!confirm(`Are you sure you want to permanently delete booking #${id}?`)) return;
        try {
            await api('../api/admin_booking_delete.php', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            await load();
        } catch (err) {
            alert('Failed to delete booking: ' + err.message);
        }
        return;
    }

    // Delete Message
    const msgBtn = e.target.closest('.delete-message');
    if (msgBtn) {
        const id = msgBtn.dataset.id;
        if (!confirm('Are you sure you want to delete this customer inquiry?')) return;
        try {
            await api('../api/admin_message_delete.php', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            await load();
        } catch (err) {
            alert('Failed to delete message: ' + err.message);
        }
        return;
    }
});

// Run load on start
load();
