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
    // Contact form submit → Save to Supabase & WhatsApp redirect
    // --------------------------------------------------------
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const nameEl    = document.getElementById('contactName');
        const phoneEl   = document.getElementById('contactPhone');
        const emailEl   = document.getElementById('contactEmail');
        const subjectEl = document.getElementById('contactSubject');
        const messageEl = document.getElementById('contactMessage');
        const sendBtn   = document.getElementById('contactSendBtn');

        const name    = (nameEl    || {}).value || '';
        const phone   = (phoneEl   || {}).value || '';
        const email   = (emailEl   || {}).value || '';
        const subject = (subjectEl || {}).value || '';
        const message = (messageEl || {}).value || '';

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

        // Save submission to Supabase
        const client = window.supabaseClient || (typeof supabase !== 'undefined' && supabase.createClient ? supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY) : null);
        if (client) {
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<span>⏳</span> Sending...';
            }
            try {
                const { error } = await client
                    .from('contact_submissions')
                    .insert([
                        {
                            name: name.trim(),
                            phone: phone.trim(),
                            email: email.trim(),
                            subject: subject.trim(),
                            message: message.trim(),
                            recipient: recipientName
                        }
                    ]);
                if (error) {
                    console.warn('Supabase contact submission notice:', error.message);
                }
            } catch (err) {
                console.warn('Supabase contact insert error:', err);
            } finally {
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '<span>💬</span> Send via WhatsApp';
                }
            }
        }

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