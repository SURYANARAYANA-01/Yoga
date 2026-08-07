// ===========================================
// CONTACT PAGE
// Arivukadal Sky Yoga
// ===========================================

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const formData = {

            fullName: contactForm.elements[0].value.trim(),

            phone: contactForm.elements[1].value.trim(),

            email: contactForm.elements[2].value.trim(),

            subject: contactForm.elements[3].value.trim(),

            message: contactForm.elements[4].value.trim(),

            submittedAt: new Date().toLocaleString()

        };

        // Simple Validation

        if (

            formData.fullName === "" ||

            formData.phone === "" ||

            formData.email === "" ||

            formData.subject === "" ||

            formData.message === ""

        ) {

            alert("Please fill in all fields.");

            return;

        }

        // Save Temporarily

        let messages = JSON.parse(localStorage.getItem("contactMessages")) || [];

        messages.push(formData);

        localStorage.setItem("contactMessages", JSON.stringify(messages));

        // Success

        alert("Thank you! Your message has been sent successfully.");

        // Reset Form

        contactForm.reset();

        // ===================================
        // TODO
        // Send data to Backend API
        // fetch('/api/contact', {...})
        // ===================================

    });

}

// ===========================================
// WHATSAPP BUTTON
// ===========================================

const whatsappBtn = document.querySelector(".contact-info .btn");

if (whatsappBtn) {

    whatsappBtn.addEventListener("click", function (e) {

        e.preventDefault();

        const phone = "918754513113";

        const message = encodeURIComponent(

            "Hello Arivukadal Sky Yoga, I would like to know more about your yoga classes."

        );

        window.open(

            `https://wa.me/${phone}?text=${message}`,

            "_blank"

        );

    });

}

// ===========================================
// FUTURE FEATURES
// ===========================================

// Google Maps Integration

// Email API

// Backend Contact API

// Toast Notifications

// Spam Protection

// reCAPTCHA