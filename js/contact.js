// =============================================================
// CONTACT.JS — Arivukadal Sky Yoga
// WhatsApp form redirect — no backend, no localStorage
// =============================================================

(function () {
    'use strict';

    // --------------------------------------------------------
    // Phone numbers
    // --------------------------------------------------------
    const PHONES = {
        founder:   '918754513113',
        cofounder: '918884887795'
    };

    // --------------------------------------------------------
    // DOM refs
    // --------------------------------------------------------
    const contactForm        = document.getElementById('contactForm');
    const founderLabel       = document.getElementById('founderLabel');
    const cofounderLabel     = document.getElementById('cofounderLabel');
    const recipientFounder   = document.getElementById('recipientFounder');
    const recipientCofounder = document.getElementById('recipientCofounder');

    // --------------------------------------------------------
    // Recipient toggle — visual .selected class
    // --------------------------------------------------------
    function updateRecipientUI () {
        if (!founderLabel || !cofounderLabel) return;

        if (recipientFounder && recipientFounder.checked) {
            founderLabel.classList.add('selected');
            cofounderLabel.classList.remove('selected');
        } else {
            cofounderLabel.classList.add('selected');
            founderLabel.classList.remove('selected');
        }
    }

    if (recipientFounder) {
        recipientFounder.addEventListener('change', updateRecipientUI);
    }
    if (recipientCofounder) {
        recipientCofounder.addEventListener('change', updateRecipientUI);
    }

    // Allow clicking the whole label box to select
    [founderLabel, cofounderLabel].forEach(function (label) {
        if (!label) return;
        label.addEventListener('click', function () {
            setTimeout(updateRecipientUI, 0);
        });
    });

    updateRecipientUI(); // set initial state

    // --------------------------------------------------------
    // Helper — open WhatsApp in new tab
    // --------------------------------------------------------
    function openWhatsApp (phone, message) {
        const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // --------------------------------------------------------
    // Contact form submit → WhatsApp redirect
    // --------------------------------------------------------
    if (!contactForm) return;

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name    = (document.getElementById('contactName')    || {}).value || '';
        const phone   = (document.getElementById('contactPhone')   || {}).value || '';
        const email   = (document.getElementById('contactEmail')   || {}).value || '';
        const subject = (document.getElementById('contactSubject') || {}).value || '';
        const message = (document.getElementById('contactMessage') || {}).value || '';

        // Basic validation
        if (
            name.trim()    === '' ||
            phone.trim()   === '' ||
            email.trim()   === '' ||
            subject.trim() === '' ||
            message.trim() === ''
        ) {
            alert('Please fill in all fields before sending.');
            return;
        }

        // Determine selected recipient
        const selectedPhone = (recipientCofounder && recipientCofounder.checked)
            ? PHONES.cofounder
            : PHONES.founder;

        const recipientName = (recipientCofounder && recipientCofounder.checked)
            ? 'Co-Founder'
            : 'Founder';

        // Build formatted WhatsApp message
        const waMessage = [
            '🙏 *New Enquiry — Arivukadal Sky Yoga*',
            '',
            '*To:* ' + recipientName,
            '*Name:* ' + name.trim(),
            '*Phone:* ' + phone.trim(),
            '*Email:* ' + email.trim(),
            '',
            '*Subject:* ' + subject.trim(),
            '',
            '*Message:*',
            message.trim()
        ].join('\n');

        openWhatsApp(selectedPhone, waMessage);

        // Reset form after redirect opens
        contactForm.reset();
        updateRecipientUI();
    });

}());