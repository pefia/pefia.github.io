/* Force-play autoplay videos — some browsers defer until interaction */
function bootVideos() {
    document.querySelectorAll('video').forEach(v => {
        v.muted = true;
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        const tryPlay = () => {
            const p = v.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    const onTouch = () => { v.play().catch(() => {}); document.removeEventListener('touchstart', onTouch); document.removeEventListener('click', onTouch); };
                    document.addEventListener('touchstart', onTouch, { once: true, passive: true });
                    document.addEventListener('click', onTouch, { once: true });
                });
            }
        };
        if (v.readyState >= 2) tryPlay();
        else v.addEventListener('loadeddata', tryPlay, { once: true });
        v.addEventListener('canplay', tryPlay, { once: true });
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootVideos);
} else {
    bootVideos();
}
window.addEventListener('pageshow', bootVideos);

/* Navigation */
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navbar = document.querySelector('.navbar');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        const open = hamburger.classList.toggle('open');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navMenu.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            hamburger.classList.remove('open');
            navMenu.classList.remove('active');
        }
    });
}

/* Navbar scroll state */
window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });

/* Smooth scroll for anchor links */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* Active nav link based on current page */
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href').replace('/', '');
    if (href === currentPath || (currentPath === '' && href === '')) {
        link.classList.add('active');
    }
});

/* Contact form */
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('.form-submit');
        const original = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = 'Sending...';

        await new Promise(r => setTimeout(r, 1200));

        btn.innerHTML = 'Message sent — we\'ll be in touch shortly';
        btn.style.background = '#16a34a';

        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = '';
            btn.disabled = false;
            contactForm.reset();
        }, 4000);
    });
}
