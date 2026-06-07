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

/* ── Hero scroll-away animation ─────────────────── */
(function () {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    var hero = document.getElementById('hero');
    var heroContent = document.querySelector('.hero-content');
    if (!hero || !heroContent) return;

    window.addEventListener('scroll', function () {
        var s = window.scrollY;
        var heroH = hero.offsetHeight;
        if (s < heroH) {
            var progress = Math.min(s / (heroH * 0.5), 1);
            heroContent.style.opacity = 1 - progress;
            heroContent.style.transform = 'translateY(' + (s * -0.12) + 'px)';
        }
    }, { passive: true });
}());

/* ── Reviews carousel ────────────────────────────── */
(function initReviews() {
    var REVIEWS = [
        {
            text: 'James and his team did a brilliant job removing a large oak from our back garden. Professional, incredibly tidy, and finished exactly on time. Wouldn’t hesitate to recommend to anyone in Surrey.',
            name: 'Sarah T.', location: 'Dorking, Surrey', service: 'Tree Removal',
            initials: 'ST', bg: '#3b6f76'
        },
        {
            text: 'Our hedges hadn’t been touched in years and Boxhill Gardening completely transformed them. Excellent precision, a friendly team and very fair pricing. We’ve already booked them again.',
            name: 'Mark & Lisa W.', location: 'Reigate, Surrey', service: 'Hedge Trimming',
            initials: 'MW', bg: '#4a7c6b'
        },
        {
            text: 'Regular garden maintenance has made such a difference. The team take real pride in their work and our lawn has never looked better. Great communication throughout.',
            name: 'David H.', location: 'Guildford, Surrey', service: 'Garden Maintenance',
            initials: 'DH', bg: '#556b3c'
        },
        {
            text: 'Two stubborn stumps that had been an eyesore for years — both ground down cleanly and everything tidied up perfectly. Efficient, professional, and exactly what was quoted.',
            name: 'Emma P.', location: 'Woking, Surrey', service: 'Stump Grinding',
            initials: 'EP', bg: '#3b6f76'
        },
        {
            text: 'Had a full run of fencing replaced along our boundary. The quality of the timber and the finish is outstanding. A proper job done properly — very pleased indeed.',
            name: 'James & Helen R.', location: 'Epsom, Surrey', service: 'Fencing',
            initials: 'JR', bg: '#4c687a'
        },
        {
            text: 'Our patio and driveway look brand new after the pressure wash. Fast, thorough and very reasonably priced. Already booked them in again for next spring.',
            name: 'Caroline N.', location: 'Leatherhead, Surrey', service: 'Pressure Washing',
            initials: 'CN', bg: '#6b4a3c'
        }
    ];

    var track    = document.getElementById('reviewsTrack');
    var dotsEl   = document.getElementById('reviewsDots');
    var prevBtn  = document.getElementById('reviewsPrev');
    var nextBtn  = document.getElementById('reviewsNext');
    var viewport = document.getElementById('reviewsViewport');
    if (!track) return;

    /* Build cards */
    REVIEWS.forEach(function (r) {
        var card = document.createElement('article');
        card.className = 'review-card';
        card.innerHTML =
            '<div class="review-card-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>' +
            '<span class="review-card-service">' + r.service + '</span>' +
            '<p class="review-card-text">“' + r.text + '”</p>' +
            '<div class="review-card-author">' +
                '<div class="review-avatar" style="background:' + r.bg + '">' + r.initials + '</div>' +
                '<div>' +
                    '<div class="review-name">' + r.name + '</div>' +
                    '<div class="review-location">' + r.location + '</div>' +
                '</div>' +
            '</div>';
        track.appendChild(card);
    });

    var perPage, totalPages, current = 0, autoTimer;
    var GAP = 24;

    function calcLayout() {
        var w = window.innerWidth;
        perPage    = w >= 1024 ? 3 : (w >= 640 ? 2 : 1);
        totalPages = Math.ceil(REVIEWS.length / perPage);
    }

    function cardW() {
        if (!viewport) return 300;
        return Math.floor((viewport.clientWidth - GAP * (perPage - 1)) / perPage);
    }

    function setSizes() {
        var w = cardW();
        track.querySelectorAll('.review-card').forEach(function (c) {
            c.style.width = w + 'px';
            c.style.flex  = '0 0 ' + w + 'px';
        });
    }

    function buildDots() {
        dotsEl.innerHTML = '';
        for (var i = 0; i < totalPages; i++) {
            var dot = document.createElement('button');
            dot.className   = 'reviews-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to page ' + (i + 1));
            (function (idx) {
                dot.addEventListener('click', function () { goTo(idx); resetAuto(); });
            }(i));
            dotsEl.appendChild(dot);
        }
    }

    function goTo(page) {
        current = ((page % totalPages) + totalPages) % totalPages;
        var offset = current * perPage * (cardW() + GAP);
        track.style.transform = 'translateX(-' + offset + 'px)';
        dotsEl.querySelectorAll('.reviews-dot').forEach(function (d, i) {
            d.classList.toggle('active', i === current);
        });
    }

    function resetAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(function () { goTo(current + 1); }, 5000);
    }

    calcLayout();
    setSizes();
    buildDots();
    goTo(0);
    resetAuto();

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); resetAuto(); });

    if (viewport) {
        viewport.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
        viewport.addEventListener('mouseleave', resetAuto);

        var touchX = 0;
        viewport.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
        viewport.addEventListener('touchend', function (e) {
            var diff = touchX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
        });
    }

    window.addEventListener('resize', function () {
        var prev = perPage;
        calcLayout();
        setSizes();
        if (perPage !== prev) { current = 0; buildDots(); }
        goTo(current);
    }, { passive: true });
}());

/* ── Scroll progress bar ────────────────────────────── */
(function () {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;
    var doc = document.documentElement;
    window.addEventListener('scroll', function () {
        var pct = (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100;
        bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
}());

/* ── Section title underline grow-in ────────────────── */
(function () {
    var titleIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('line-reveal');
                titleIO.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.section-title').forEach(function (el) {
        titleIO.observe(el);
    });
}());
