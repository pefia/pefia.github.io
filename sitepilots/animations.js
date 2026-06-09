/* =====================================================================
   SitePilots — animations.js
   GSAP + ScrollTrigger: hero reveal, pinned scrolljack, parallax,
   staggered sections, magnetic buttons, momentum (Locomotive-style) scroll.
   Fails open: if GSAP is blocked or reduced-motion is on, content stays
   fully visible and interactive.
   ===================================================================== */
(function () {
  "use strict";

  var docEl   = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine    = window.matchMedia("(pointer: fine)").matches;

  /* ------------------------------------------------------------------ */
  /*  Always-on UI (independent of GSAP)                                 */
  /* ------------------------------------------------------------------ */

  // current year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // nav state + top scroll-progress bar
  var nav         = document.getElementById("nav");
  var progressFill = document.querySelector(".scroll-progress span");
  function onScroll() {
    var y   = window.scrollY || window.pageYOffset;
    var max = docEl.scrollHeight - window.innerHeight;
    if (nav) nav.classList.toggle("scrolled", y > 30);
    if (progressFill) progressFill.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var menu   = document.getElementById("mobileMenu");
  if (toggle && menu) {
    function setMenu(open) {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    }
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  // momentum / smooth wheel scrolling (desktop pointer only).
  // We ease the *native* scroll position, so ScrollTrigger pinning stays
  // perfectly in sync and keyboard / scrollbar / anchors keep working.
  if (fine && !reduced) {
    var target = window.scrollY, current = target, ticking = false;
    var maxScroll = function () {
      return Math.max(0, docEl.scrollHeight - window.innerHeight);
    };
    var frame = function () {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.4) { current = target; ticking = false; }
      window.scrollTo(0, Math.round(current));
      if (ticking) requestAnimationFrame(frame);
    };
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return; // let pinch-zoom through
      var dy = e.deltaMode === 1 ? e.deltaY * 16
             : e.deltaMode === 2 ? e.deltaY * window.innerHeight
             : e.deltaY;
      target = Math.min(Math.max(target + dy, 0), maxScroll());
      e.preventDefault();
      if (!ticking) { ticking = true; current = window.scrollY; requestAnimationFrame(frame); }
    }, { passive: false });
    window.addEventListener("scroll", function () {
      if (!ticking) { target = current = window.scrollY; }
    }, { passive: true });
  }

  // counters helper — used by both the static and animated paths
  function finalizeCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Bail out cleanly when GSAP is unavailable or motion is reduced     */
  /* ------------------------------------------------------------------ */
  if (!window.gsap || !window.ScrollTrigger) {
    docEl.classList.add("gsap-failed");
    finalizeCounters();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (reduced) { finalizeCounters(); return; }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  // split an element's text into .word > .char spans (keeps spaces/wrapping)
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = "";
    var chars = [];
    text.split(/(\s+)/).forEach(function (token) {
      if (/^\s+$/.test(token)) { el.appendChild(document.createTextNode(" ")); return; }
      var word = document.createElement("span");
      word.className = "word";
      token.split("").forEach(function (ch) {
        var c = document.createElement("span");
        c.className = "char";
        c.textContent = ch;
        word.appendChild(c);
        chars.push(c);
      });
      el.appendChild(word);
    });
    return chars;
  }

  function reveal(selector, vars) {
    gsap.utils.toArray(selector).forEach(function (el) {
      gsap.from(el, Object.assign({
        y: 50, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 84%" }
      }, vars || {}));
    });
  }

  /* ------------------------------------------------------------------ */
  /*  HERO — load timeline (logo, staggered letters, sub, CTA, stats)    */
  /* ------------------------------------------------------------------ */
  var heroTitle = document.querySelector(".hero-title");
  var heroChars = heroTitle ? splitChars(heroTitle) : [];

  var intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .from(".nav", { y: -28, opacity: 0, duration: 0.8 })
    .from(".brand", { opacity: 0, scale: 0.86, duration: 0.7 }, 0.1)        // logo fade + scale
    .from(".hero-eyebrow", { y: 18, opacity: 0, duration: 0.6 }, 0.35)
    .from(heroChars, {                                                       // letter-by-letter
        yPercent: 130, opacity: 0, rotateX: -90,
        transformOrigin: "50% 100%", transformPerspective: 900,
        duration: 0.85, stagger: 0.025
      }, 0.45)
    .from(".hero-sub", { y: 22, opacity: 0, duration: 0.7 }, "-=0.35")
    .from(".hero-cta", { y: 22, opacity: 0, duration: 0.7 }, "-=0.45")
    .from(".hero-stats .stat", { y: 22, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.45")
    .from(".scroll-cue", { opacity: 0, duration: 0.6 }, "-=0.2");

  /* ------------------------------------------------------------------ */
  /*  HERO — parallax background + cinematic exit                        */
  /* ------------------------------------------------------------------ */
  gsap.to(".hero-bg", {
    yPercent: 20, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
  });
  gsap.to(".hero-inner", {
    yPercent: -10, opacity: 0.25, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
  });

  // hero pointer spotlight
  var hero = document.querySelector(".hero");
  if (hero && fine) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  /* ------------------------------------------------------------------ */
  /*  HOW IT WORKS — pinned scrolljack timeline (desktop) / reveals (sm) */
  /* ------------------------------------------------------------------ */
  reveal(".how-head", { y: 40 });

  var steps = gsap.utils.toArray(".step");
  var mm = gsap.matchMedia();

  mm.add("(min-width: 861px)", function () {
    if (!steps.length) return;
    gsap.set(steps[0], { xPercent: -75, opacity: 0, filter: "blur(8px)" });
    gsap.set(steps[1], { xPercent: 75,  opacity: 0, filter: "blur(8px)" });
    gsap.set(steps[2], { yPercent: 90,  opacity: 0, filter: "blur(8px)" });

    var tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: ".how",
        start: "top top",
        end: "+=2400",
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });
    tl.to(".how-progress-fill", { width: "100%", ease: "none", duration: 1 }, 0)
      .to(steps[0], { xPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.4 }, 0.04)
      .to(steps[1], { xPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.4 }, 0.34)
      .to(steps[2], { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.4 }, 0.64);
  });

  mm.add("(max-width: 860px)", function () {
    steps.forEach(function (step, i) {
      gsap.from(step, {
        x: i % 2 === 0 ? -60 : 60, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: step, start: "top 85%" }
      });
    });
    gsap.from(".how-progress-fill", {
      scaleX: 0, transformOrigin: "left center", duration: 1.2, ease: "power2.out",
      scrollTrigger: { trigger: ".how-progress", start: "top 85%" }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  PORTFOLIO — reveal + parallax depth                                */
  /* ------------------------------------------------------------------ */
  reveal(".portfolio .section-head", { y: 40 });
  gsap.from(".case", {
    y: 70, opacity: 0, duration: 1.1, ease: "power3.out",
    scrollTrigger: { trigger: ".case", start: "top 80%" }
  });

  // generic parallax for [data-parallax] (foreground/background depth)
  gsap.utils.toArray("[data-parallax]").forEach(function (el) {
    var f = parseFloat(el.dataset.parallax) || 0.1;
    gsap.to(el, {
      yPercent: -f * 100, ease: "none",
      scrollTrigger: {
        trigger: el.closest("section") || el,
        start: "top bottom", end: "bottom top", scrub: 1
      }
    });
  });
  gsap.to(".case-glow", {
    yPercent: -24, ease: "none",
    scrollTrigger: { trigger: ".portfolio", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  /* ------------------------------------------------------------------ */
  /*  TESTIMONIAL — card reveal, star pop, background parallax           */
  /* ------------------------------------------------------------------ */
  gsap.from(".quote-card", {
    y: 60, opacity: 0, scale: 0.96, duration: 1.1, ease: "power3.out",
    scrollTrigger: { trigger: ".testimonial", start: "top 72%" }
  });
  gsap.from(".stars svg", {
    scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.1,
    scrollTrigger: { trigger: ".quote-card", start: "top 75%" }
  });
  gsap.to(".quote-bg", {
    yPercent: 22, ease: "none",
    scrollTrigger: { trigger: ".testimonial", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  /* ------------------------------------------------------------------ */
  /*  PRICING — cards slide in from left / center / right                */
  /* ------------------------------------------------------------------ */
  reveal(".pricing .section-head", { y: 40 });
  var cards = gsap.utils.toArray(".price-card");
  if (cards.length === 3) {
    gsap.set(cards[0], { xPercent: -18, y: 50, opacity: 0 });
    gsap.set(cards[1], { y: 80, opacity: 0 });
    gsap.set(cards[2], { xPercent: 18, y: 50, opacity: 0 });
    ScrollTrigger.create({
      trigger: ".price-grid", start: "top 78%", once: true,
      onEnter: function () {
        gsap.to(cards, {
          xPercent: 0, y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.14
        });
      }
    });
  } else {
    reveal(".price-card", {});
  }

  /* ------------------------------------------------------------------ */
  /*  CTA BAND + FOOTER reveals                                          */
  /* ------------------------------------------------------------------ */
  gsap.from(gsap.utils.toArray(".cta-title, .cta-sub, .cta-band .btn"), {
    y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: ".cta-band", start: "top 78%" }
  });
  reveal(".footer-brand", { y: 30 });
  gsap.from(".footer-col", {
    y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: ".footer-top", start: "top 88%" }
  });

  /* ------------------------------------------------------------------ */
  /*  COUNTERS                                                           */
  /* ------------------------------------------------------------------ */
  function runCounter(el) {
    var end = parseFloat(el.dataset.count) || 0;
    var suf = el.dataset.suffix || "";
    var obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.6, ease: "power2.out",
      onUpdate: function () { el.textContent = Math.round(obj.v) + suf; }
    });
  }
  document.querySelectorAll("[data-count]").forEach(function (el) {
    // fire immediately if already on-screen at load (hero stats), else on scroll
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      runCounter(el);
    } else {
      ScrollTrigger.create({
        trigger: el, start: "top 92%", once: true,
        onEnter: function () { runCounter(el); }
      });
    }
  });

  /* ------------------------------------------------------------------ */
  /*  MAGNETIC BUTTONS (desktop)                                         */
  /* ------------------------------------------------------------------ */
  if (fine) {
    gsap.utils.toArray("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("pointerenter", function () {
        gsap.to(btn, { scale: 1.05, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: mx * 0.25, y: my * 0.4, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      });
      btn.addEventListener("pointerleave", function () {
        gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Refresh after full load (fonts can shift layout)                   */
  /* ------------------------------------------------------------------ */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
