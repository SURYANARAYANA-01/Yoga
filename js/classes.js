// ==========================================
// CLASSES PAGE JAVASCRIPT
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
    // SCROLL REVEAL
    // ==========================================

    const revealItems = document.querySelectorAll(

        ".class-card, .benefit-card, .schedule-table, .cta-content"

    );

    function revealOnScroll() {

        const trigger = window.innerHeight * 0.85;

        revealItems.forEach(item => {

            const top = item.getBoundingClientRect().top;

            if (top < trigger) {

                item.style.opacity = "1";

                item.style.transform = "translateY(0)";

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
    // CARD HOVER EFFECT
    // ==========================================

    const cards = document.querySelectorAll(".class-card");

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.style.transform = "translateY(-12px)";

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform = "translateY(0px)";

        });

    });

    // ==========================================
    // TABLE ROW HOVER
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
    // BOOK BUTTON
    // ==========================================

    const bookButtons = document.querySelectorAll(".class-card .btn");

    bookButtons.forEach(button => {

        button.addEventListener("click", function () {

            localStorage.setItem(

                "selectedCourse",

                this.parentElement.querySelector("h3").innerText

            );

        });

    });

});

// ==========================================
// FUTURE FEATURES
// ==========================================

// Course Filtering

// Search Classes

// Backend API Integration

// Booking API

// Toast Notifications

// Online Seat Availability