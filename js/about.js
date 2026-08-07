// ==========================================
// ABOUT PAGE JAVASCRIPT
// Arivukadal Sky Yoga
// ==========================================

// Wait until page loads
document.addEventListener("DOMContentLoaded", () => {

    // ===========================
    // Scroll Reveal Animation
    // ===========================

    const revealElements = document.querySelectorAll(
        ".about-content, .about-image, .mission-card, .why-card, .cta-section"
    );

    const revealOnScroll = () => {

        const triggerBottom = window.innerHeight * 0.85;

        revealElements.forEach((element) => {

            const elementTop = element.getBoundingClientRect().top;

            if (elementTop < triggerBottom) {

                element.classList.add("show");

            }

        });

    };

    window.addEventListener("scroll", revealOnScroll);

    revealOnScroll();

    // ===========================
    // Active Navigation
    // ===========================

    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".nav-links a").forEach((link) => {

        if (link.getAttribute("href") === currentPage) {

            link.classList.add("active");

        }

    });

    // ===========================
    // Image Hover Effect
    // ===========================

    const image = document.querySelector(".image-placeholder");

    if (image) {

        image.addEventListener("mouseenter", () => {

            image.style.transform = "translateY(-10px) scale(1.02)";

        });

        image.addEventListener("mouseleave", () => {

            image.style.transform = "translateY(0px) scale(1)";

        });

    }

});

// ==========================================
// Future Features
// ==========================================

// Counter Animation
// Timeline Animation
// Founder Image Animation
// Backend Content API
// CMS Integration
// Language Switch