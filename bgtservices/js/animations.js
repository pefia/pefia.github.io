/* Scroll reveal — IntersectionObserver */
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* Stat counter */
const statIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;
        const suffix = el.dataset.suffix || '';
        const dur = 1600;
        const start = performance.now();

        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        statIO.unobserve(el);
    });
}, { threshold: 0.6 });

document.querySelectorAll('[data-target]').forEach(el => statIO.observe(el));

/* Parallax on hero background video — subtle */
const heroVideo = document.querySelector('.hero-video');
if (heroVideo && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    window.addEventListener('scroll', () => {
        const s = window.scrollY;
        if (s < window.innerHeight) {
            heroVideo.style.transform = `translateY(${s * 0.28}px)`;
        }
    }, { passive: true });
}

/* Service card images — staggered reveal with scale */
const cardIO = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${i * 60}ms`;
            entry.target.classList.add('visible');
            cardIO.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll('.service-card').forEach(card => cardIO.observe(card));
