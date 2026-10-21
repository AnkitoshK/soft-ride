// ===== BOOKING FORM LOGIC =====

let currentStep = 1;
let selectedVehicle = null;
let selectedPrice = 0;
let lastBooking = null;

// Initialize Query Params & Defaults
const bookingQuery = new URLSearchParams(window.location.search);
if (bookingQuery.has('pickup') && document.getElementById('pickup')) {
    document.getElementById('pickup').value = bookingQuery.get('pickup');
}
if (bookingQuery.has('drop') && document.getElementById('drop')) {
    document.getElementById('drop').value = bookingQuery.get('drop');
}
if (bookingQuery.has('distance') && document.getElementById('distance')) {
    document.getElementById('distance').value = bookingQuery.get('distance');
}

// Set minimum date to today
const dateInput = document.getElementById('rideDate');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today;
}

// ===== VEHICLE SELECTION =====
const vehicleCards = document.querySelectorAll('.vehicle-card');
vehicleCards.forEach(card => {
    card.addEventListener('click', function() {
        vehicleCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        selectedVehicle = this.getAttribute('data-vehicle');
        selectedPrice = parseInt(this.getAttribute('data-price'), 10) || 12;
    });
});

// Auto-select vehicle from URL if specified
if (bookingQuery.has('vehicle')) {
    const reqVehicle = bookingQuery.get('vehicle').toLowerCase();
    vehicleCards.forEach(card => {
        if (card.getAttribute('data-vehicle')?.toLowerCase() === reqVehicle) {
            card.click();
        }
    });
}

// Helper: Auto-set popular routes
function setRoute(pickup, drop, distance) {
    const pickupEl = document.getElementById('pickup');
    const dropEl = document.getElementById('drop');
    const distanceEl = document.getElementById('distance');
    if (pickupEl) pickupEl.value = pickup;
    if (dropEl) dropEl.value = drop;
    if (distanceEl) distanceEl.value = distance;
    // Animate inputs
    [pickupEl, dropEl, distanceEl].forEach(el => {
        if (el) {
            el.style.backgroundColor = '#fef08a';
            setTimeout(() => { el.style.backgroundColor = ''; }, 600);
        }
    });
}

// ===== STEP NAVIGATION =====
function nextStep(step) {
    if (!validateStep(currentStep)) return;

    document.getElementById('step' + currentStep).classList.remove('active');
    document.getElementById('step' + step).classList.add('active');
    updateProgress(step);
    currentStep = step;

    if (step === 5) {
        populateSummary();
    }
    window.scrollTo({ top: 200, behavior: 'smooth' });
}

function prevStep(step) {
    document.getElementById('step' + currentStep).classList.remove('active');
    document.getElementById('step' + step).classList.add('active');
    updateProgress(step);
    currentStep = step;
    window.scrollTo({ top: 200, behavior: 'smooth' });
}

function updateProgress(step) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((s, index) => {
        const stepNum = index + 1;
        s.classList.remove('active', 'completed');
        if (stepNum === step) {
            s.classList.add('active');
        } else if (stepNum < step) {
            s.classList.add('completed');
        }
    });
}

// ===== VALIDATE STEP =====
function validateStep(step) {
    if (step === 1) {
        const pickup = document.getElementById('pickup').value.trim();
        const drop = document.getElementById('drop').value.trim();
        if (!pickup || !drop) {
            alert('Please enter both pickup and drop locations!');
            if (!pickup) document.getElementById('pickup').classList.add('error');
            if (!drop) document.getElementById('drop').classList.add('error');
            return false;
        }
        return true;
    }
    if (step === 2) {
        if (!selectedVehicle) {
            alert('Please select a vehicle category!');
            return false;
        }
        return true;
    }
    if (step === 3) {
        const date = document.getElementById('rideDate').value;
        const time = document.getElementById('rideTime').value;
        const passengers = document.getElementById('passengers').value;
        if (!date || !time || !passengers) {
            alert('Please select ride date, pickup time, and passengers count!');
            return false;
        }
        return true;
    }
    if (step === 4) {
        const name = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const payment = document.getElementById('payment').value;
        if (!name || !phone || !email || !payment) {
            alert('Please fill all contact and payment details!');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address!');
            return false;
        }
        const phoneRegex = /^[0-9+\-\s]{10,}$/;
        if (!phoneRegex.test(phone)) {
            alert('Please enter a valid phone number (at least 10 digits)!');
            return false;
        }
        return true;
    }
    return true;
}

// ===== POPULATE SUMMARY =====
function populateSummary() {
    const pickup = document.getElementById('pickup').value;
    const drop = document.getElementById('drop').value;
    const distanceVal = parseFloat(document.getElementById('distance').value) || 10;
    const totalFare = distanceVal * (selectedPrice || 12);

    document.getElementById('sumPickup').textContent = pickup;
    document.getElementById('sumDrop').textContent = drop;
    document.getElementById('sumDistance').textContent = distanceVal + ' km';
    document.getElementById('sumVehicle').textContent = selectedVehicle;
    document.getElementById('sumDate').textContent = document.getElementById('rideDate').value;
    document.getElementById('sumTime').textContent = document.getElementById('rideTime').value;
    document.getElementById('sumPassengers').textContent = document.getElementById('passengers').value + ' Passenger(s)';
    document.getElementById('sumName').textContent = document.getElementById('fullName').value;
    document.getElementById('sumPhone').textContent = document.getElementById('phone').value;
    document.getElementById('sumEmail').textContent = document.getElementById('email').value;
    document.getElementById('sumPayment').textContent = (document.getElementById('payment').value || 'cash').toUpperCase();
    document.getElementById('sumTotal').textContent = '₹' + totalFare;
}

// ===== FORM SUBMISSION & RECEIPT =====
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const button = bookingForm.querySelector('[type="submit"]');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering Ride with Dispatch…';

        const pickup = document.getElementById('pickup').value.trim();
        const drop = document.getElementById('drop').value.trim();
        const distanceVal = parseFloat(document.getElementById('distance').value) || 10;
        const totalFare = distanceVal * (selectedPrice || 12);
        const rideDate = document.getElementById('rideDate').value;
        const rideTime = document.getElementById('rideTime').value;
        const passengers = document.getElementById('passengers').value;
        const luggage = document.getElementById('luggage').value;
        const name = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const payment = document.getElementById('payment').value;
        const instructions = document.getElementById('instructions')?.value?.trim() || '';

        const payload = {
            pickup,
            dropoff: drop,
            distance: distanceVal,
            instructions,
            vehicle: selectedVehicle,
            fare: totalFare,
            rideDate,
            rideTime,
            passengers,
            luggage,
            name,
            phone,
            email,
            payment
        };

        try {
            // Support both Node.js serverless and PHP endpoints
            let response;
            try {
                response = await fetch('api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                // Fallback to api/bookings.php
                response = await fetch('api/bookings.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok && response.status === 404) {
                response = await fetch('api/bookings.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to save booking');

            const bookingCode = '#' + (result.id || 'SR' + Math.floor(100000 + Math.random() * 900000));
            document.getElementById('bookingId').textContent = bookingCode;

            // Populate official receipt
            if (document.getElementById('recId')) document.getElementById('recId').textContent = bookingCode;
            if (document.getElementById('recDateTime')) document.getElementById('recDateTime').textContent = rideDate + ' at ' + rideTime;
            if (document.getElementById('recPickup')) document.getElementById('recPickup').textContent = pickup;
            if (document.getElementById('recDrop')) document.getElementById('recDrop').textContent = drop;
            if (document.getElementById('recVehicle')) document.getElementById('recVehicle').textContent = selectedVehicle;
            if (document.getElementById('recPaxLug')) document.getElementById('recPaxLug').textContent = passengers + ' Passenger(s) • ' + luggage;
            if (document.getElementById('recName')) document.getElementById('recName').textContent = name;
            if (document.getElementById('recPhone')) document.getElementById('recPhone').textContent = phone;
            if (document.getElementById('recKm')) document.getElementById('recKm').textContent = distanceVal + ' km';
            if (document.getElementById('recFare')) document.getElementById('recFare').textContent = '₹' + totalFare;

            lastBooking = {
                id: bookingCode,
                name,
                phone,
                pickup,
                drop,
                vehicle: selectedVehicle,
                date: rideDate,
                time: rideTime,
                fare: totalFare
            };

            const smsNotice = document.getElementById('smsNotice');
            if (smsNotice) {
                smsNotice.innerHTML = `Your booking reference is <strong>${bookingCode}</strong>. Dispatch head <strong>Juli Kumari</strong> (+91 9142491242) has received your request and driver details will be shared via call & WhatsApp.`;
            }

            document.getElementById('step5').classList.remove('active');
            document.getElementById('successStep').classList.add('active');
            document.querySelectorAll('.progress-step').forEach(s => {
                s.classList.remove('active');
                s.classList.add('completed');
            });
            window.scrollTo({ top: 150, behavior: 'smooth' });
        } catch (error) {
            alert('Booking notice: ' + error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-check"></i> Confirm Booking';
        }
    });
}

// WhatsApp Share Handler
function shareReceiptWhatsApp() {
    if (!lastBooking) {
        alert('Booking details not loaded yet.');
        return;
    }
    const text = encodeURIComponent(
        `*SOFT RIDE CAB BOOKING PASS*\n` +
        `--------------------------\n` +
        `*Booking ID:* ${lastBooking.id}\n` +
        `*Passenger:* ${lastBooking.name}\n` +
        `*Phone:* ${lastBooking.phone}\n` +
        `*Pickup:* ${lastBooking.pickup}\n` +
        `*Drop:* ${lastBooking.drop}\n` +
        `*Vehicle:* ${lastBooking.vehicle}\n` +
        `*Schedule:* ${lastBooking.date} at ${lastBooking.time}\n` +
        `*Total Fare:* ₹${lastBooking.fare}\n` +
        `--------------------------\n` +
        `Hello Juli Kumari, please confirm my driver assignment.`
    );
    window.open(`https://wa.me/919142491242?text=${text}`, '_blank');
}

// ===== RESET BOOKING =====
function resetBooking() {
    bookingForm.reset();
    selectedVehicle = null;
    selectedPrice = 0;
    currentStep = 1;
    vehicleCards.forEach(c => c.classList.remove('selected'));

    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
    updateProgress(1);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rideDate').value = today;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Remove error class on input
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('error');
    });
});