// =============================================================
// MAIN.JS — Arivukadal Sky Yoga SPA
// Handles: sticky header · scroll-spy · hamburger · reveal
// =============================================================

(function () {
    'use strict';

    // --------------------------------------------------------
    // Element refs
    // --------------------------------------------------------
    const header      = document.getElementById('siteHeader');
    const hamburger   = document.getElementById('hamburger');
    const navLinks    = document.getElementById('navLinks');
    const navOverlay  = document.getElementById('navOverlay');
    const allNavLinks = navLinks ? navLinks.querySelectorAll('a[data-section]') : [];
    const sections    = document.querySelectorAll('section[id]');

    // --------------------------------------------------------
    // Sticky header — add .active class on scroll
    // --------------------------------------------------------
    function updateHeader () {
        if (!header) return;
        if (window.scrollY > 20) {
            header.classList.add('active');
        } else {
            header.classList.remove('active');
        }
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader(); // run once on load

    // --------------------------------------------------------
    // Hamburger menu toggle
    // --------------------------------------------------------
    function openMenu () {
        hamburger.classList.add('open');
        navLinks.classList.add('open');
        navOverlay.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu () {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        navOverlay.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', function () {
            const isOpen = hamburger.classList.contains('open');
            isOpen ? closeMenu() : openMenu();
        });
    }

    // Close on overlay click
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    // Close when a nav link is clicked
    allNavLinks.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && hamburger && hamburger.classList.contains('open')) {
            closeMenu();
            hamburger.focus();
        }
    });

    // --------------------------------------------------------
    // Scroll-spy — highlight active nav link
    // --------------------------------------------------------
    const observerOptions = {
        root: null,
        rootMargin: '-' + (getHeaderHeight() + 10) + 'px 0px -60% 0px',
        threshold: 0
    };

    function getHeaderHeight () {
        return parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--header-h')) || 90;
    }

    const spyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                allNavLinks.forEach(function (link) {
                    if (link.getAttribute('data-section') === id) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(function (section) {
        spyObserver.observe(section);
    });

    // --------------------------------------------------------
    // Reveal on scroll — respect prefers-reduced-motion
    // --------------------------------------------------------
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealElements = document.querySelectorAll('.reveal');

    if (prefersReducedMotion) {
        // Skip animation — make everything visible immediately
        revealElements.forEach(function (el) {
            el.classList.add('visible');
        });
    } else {
        const revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -80px 0px',
            threshold: 0.08
        });

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    }

    // --------------------------------------------------------
    // Smooth scroll for anchor links (polyfill for older browsers)
    // --------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = anchor.getAttribute('href').replace('#', '');
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;
            e.preventDefault();
            const offset = getHeaderHeight();
            const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        });
    });

}());