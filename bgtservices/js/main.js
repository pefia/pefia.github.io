/* Video autoplay: muted autoplay is allowed in all modern browsers.
   iOS Safari and some Android browsers need an explicit play() call.
   Low-power mode on iOS silently refuses autoplay until a user gesture. */
document.addEventListener('DOMContentLoaded', function () {

    function tryPlay(v) {
        v.muted = true;
        var p = v.play();
        if (p) p.catch(function () {});
    }

    /* Hero background video — play immediately, high priority */
    var heroVid = document.querySelector('.hero-video');
    if (heroVid) {
        heroVid.muted = true;
        if (heroVid.readyState >= 2) {
            tryPlay(heroVid);
        } else {
            heroVid.addEventListener('loadeddata', function () { tryPlay(heroVid); }, { once: true });
            heroVid.addEventListener('canplay',    function () { tryPlay(heroVid); }, { once: true });
        }
    }

    /* Side-panel card videos — start loading and play when ready */
    document.querySelectorAll('.video-card video').forEach(function (v) {
        v.load();
        if (v.readyState >= 2) {
            tryPlay(v);
        } else {
            v.addEventListener('canplay', function () { tryPlay(v); }, { once: true });
        }
    });

    /* Kick everything on first gesture (covers iOS Low Power Mode) */
    function kickAll() {
        document.querySelectorAll('video[autoplay]').forEach(tryPlay);
    }
    document.addEventListener('touchstart', kickAll, { once: true, passive: true });
    document.addEventListener('click',      kickAll, { once: true });
});

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
