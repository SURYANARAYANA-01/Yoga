// ==========================================
// TIMETABLE PAGE JAVASCRIPT
// Arivukadal Sky Yoga
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ACTIVE NAVIGATION
    // ==========================================

    const currentPage = window.location.pathname.split("/").pop();

    const navLinks = document.querySelectorAll(".nav-links a");

    navLinks.forEach(link => {

        if (link.getAttribute("href") === currentPage) {

            link.classList.add("active");

        }

    });

    // ==========================================
    // SCROLL REVEAL ANIMATION
    // ==========================================

    const revealItems = document.querySelectorAll(

        ".timing-card, .guide-card, .faq-item, .schedule-table, .cta-content"

    );

    function revealOnScroll() {

        const trigger = window.innerHeight * 0.85;

        revealItems.forEach(item => {

            const top = item.getBoundingClientRect().top;

            if (top < trigger) {

                item.style.opacity = "1";

                item.style.transform = "translateY(0px)";

            }

        });

    }

    revealItems.forEach(item => {

        item.style.opacity = "0";

        item.style.transform = "translateY(40px)";

        item.style.transition = "all .7s ease";

    });

    window.addEventListener("scroll", revealOnScroll);

    revealOnScroll();

    // ==========================================
    // TIMING CARD EFFECT
    // ==========================================

    const cards = document.querySelectorAll(".timing-card");

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.style.transform = "translateY(-12px)";

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform = "translateY(0px)";

        });

    });

    // ==========================================
    // TABLE ROW HIGHLIGHT
    // ==========================================

    const rows = document.querySelectorAll(".schedule-table tbody tr");

    rows.forEach(row => {

        row.addEventListener("mouseenter", () => {

            row.style.background = "#eef9fd";

        });

        row.addEventListener("mouseleave", () => {

            row.style.background = "";

        });

    });

    // ==========================================
    // CTA BUTTON
    // ==========================================

    const bookButton = document.querySelector(".cta-content .btn");

    if (bookButton) {

        bookButton.addEventListener("click", () => {

            localStorage.setItem("selectedPage", "Timetable");

        });

    }

});

// ==========================================
// FUTURE FEATURES
// ==========================================

// Live Class Availability

// Calendar Integration

// Booking API

// Email Reminder

// WhatsApp Reminder

// Holiday Schedule