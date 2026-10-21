const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let data = { bookings: [], messages: [] };
let view = 'bookings';

async function api(url, opts = {}) {
    let r;
    try {
        r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    } catch (err) {
        // Fallback for extensionless endpoint if .php failed
        const altUrl = url.endsWith('.php') ? url.replace(/\.php$/, '') : url + '.php';
        r = await fetch(altUrl, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    }
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Request failed');
    return j;
}

function logged(on) {
    $('#login').hidden = on;
    $('#dashboard').hidden = !on;
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
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(x => `
                        <tr>
                            <td>
                                <strong>#${esc(x.booking_code || x.id)}</strong><br>
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
                                <select class="status ${esc(x.status)}" data-id="${esc(x.booking_code || x.id)}">
                                    ${['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => `<option value="${s}" ${s === x.status ? 'selected' : ''}>${s}</option>`).join('')}
                                </select>
                            </td>
                        </tr>
                    `).join('')}
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
                            <td><button class="delete" data-id="${x.id}" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Delete</button></td>
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
    try {
        await api('../api/admin_login.php', {
            method: 'POST',
            body: JSON.stringify({
                username: $('#username').value,
                password: $('#password').value
            })
        });
        await load();
    } catch (err) {
        $('#loginError').textContent = err.message;
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

$('#logout')?.addEventListener('click', async () => {
    try {
        await api('../api/admin_logout.php', { method: 'POST' });
    } catch (e) {}
    location.reload();
});

$('#tableWrap')?.addEventListener('change', async e => {
    if (e.target.matches('select.status')) {
        await api('../api/admin_booking_status.php', {
            method: 'POST',
            body: JSON.stringify({ id: e.target.dataset.id, status: e.target.value })
        });
        load();
    }
});

$('#tableWrap')?.addEventListener('click', async e => {
    if (e.target.matches('.delete')) {
        if (!confirm('Are you sure you want to delete this message?')) return;
        await api('../api/admin_message_delete.php', {
            method: 'POST',
            body: JSON.stringify({ id: e.target.dataset.id })
        });
        load();
    }
});

load();
