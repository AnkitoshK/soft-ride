// Smooth scrolling for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 25px rgba(0,0,0,0.4)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    }
});

// Highlight active nav link
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
        link.classList.add('active');
    }
});

// Hero book ride forwarder
const bookBtn = document.getElementById('bookBtn');
if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pickup = document.getElementById('pickup')?.value.trim();
        const drop = document.getElementById('drop')?.value.trim();
        const url = new URL('booking.html', window.location.href);
        if (pickup) url.searchParams.set('pickup', pickup);
        if (drop) url.searchParams.set('drop', drop);
        window.location.href = url.toString();
    });
}

// Carry pickup and destination from home quick-booking cards
document.querySelectorAll('a[href="booking.html"], a[href="booking.html#book"]').forEach(link => {
    link.addEventListener('click', () => {
        const pickup = document.getElementById('pickup')?.value.trim();
        const drop = document.getElementById('drop')?.value.trim();
        if (pickup || drop) {
            const url = new URL(link.href, window.location.href);
            if (pickup) url.searchParams.set('pickup', pickup);
            if (drop) url.searchParams.set('drop', drop);
            link.href = url.toString();
        }
    });
});

// Review navigation
const reviews = [
    { name: 'Rohit Sharma', city: 'Patna, Bihar', quote: '"Soft Ride made my daily airport commute so easy. Chauffeur arrived 10 minutes early and the car was spotless!"', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=85' },
    { name: 'Priya Singh', city: 'Ranchi & Ara', quote: '"As a solo woman traveler, I felt completely safe. Juli Kumari\'s dispatch team followed up throughout the trip."', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=85' },
    { name: 'Amit Kumar', city: 'Gaya, Bihar', quote: '"Booked an Innova Crysta for our family pilgrimage to Bodh Gaya. Super smooth, honest pricing, and AC was great."', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=85' },
    { name: 'Sneha Verma', city: 'Muzaffarpur, Bihar', quote: '"Best taxi service in Bihar! Transparent per-km rates, no bargaining, and courteous drivers."', img: 'https://images.unsplash.com/photo-1677622051307-505a89d63c9f?auto=format&fit=crop&w=240&q=85' }
];

let currentReviewIndex = 0;
const reviewsGrid = document.getElementById('reviewsGrid');

if (reviewsGrid) {
    function renderReviews() {
        reviewsGrid.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const idx = (currentReviewIndex + i) % reviews.length;
            const r = reviews[idx];
            reviewsGrid.innerHTML += `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-avatar"><img src="${r.img}" alt="${r.name}"></div>
                        <div class="review-info"><h4>${r.name}</h4><p>${r.city}</p></div>
                    </div>
                    <p class="quote">${r.quote}</p>
                    <div class="review-stars">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                    </div>
                </div>
            `;
        }
    }

    document.getElementById('prevReview')?.addEventListener('click', () => {
        currentReviewIndex = (currentReviewIndex - 1 + reviews.length) % reviews.length;
        renderReviews();
    });

    document.getElementById('nextReview')?.addEventListener('click', () => {
        currentReviewIndex = (currentReviewIndex + 1) % reviews.length;
        renderReviews();
    });
}

// Contact form sends messages to Soft Ride API
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

        const fields = contactForm.querySelectorAll('input, textarea');
        const name = fields[0]?.value?.trim();
        const email = fields[1]?.value?.trim();
        const subject = fields[2]?.value?.trim();
        const message = fields[3]?.value?.trim();

        const oldNotice = contactForm.querySelector('.form-notice');
        if (oldNotice) oldNotice.remove();

        const status = document.createElement('div');
        status.className = 'form-notice';
        status.style.padding = '14px 18px';
        status.style.borderRadius = '10px';
        status.style.marginBottom = '20px';
        status.style.fontSize = '14px';

        try {
            let response;
            try {
                response = await fetch('api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });
            } catch (err) {
                response = await fetch('api/messages.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });
            }

            if (!response.ok && response.status === 404) {
                response = await fetch('api/messages.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });
            }

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not send message');

            contactForm.reset();
            status.style.background = '#dcfce7';
            status.style.color = '#15803d';
            status.style.border = '1px solid #bbf7d0';
            status.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Thank you, ${name}!</strong> Your message has been routed to <strong>Juli Kumari</strong>. We will contact you at <em>${email}</em> shortly.`;
        } catch (error) {
            status.style.background = '#fee2e2';
            status.style.color = '#b91c1c';
            status.style.border = '1px solid #fecaca';
            status.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            contactForm.prepend(status);
        }
    });
}

// Accessible responsive navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
            navLinks.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}