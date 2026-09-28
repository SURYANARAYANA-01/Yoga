// =============================================================
// VERCEL SERVERLESS FUNCTION: /api/contact
// Saves contact form submission to Neon PostgreSQL
// =============================================================

module.exports = async function handler(req, res) {

    // ---------------------------------------------------------
    // CORS / Security Headers
    // ---------------------------------------------------------
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
    );

    // ---------------------------------------------------------
    // Handle CORS preflight
    // ---------------------------------------------------------
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // ---------------------------------------------------------
    // Only POST requests are allowed
    // ---------------------------------------------------------
    if (req.method !== 'POST') {
        return res.status(405).json({
            ok: false,
            error: 'Method not allowed'
        });
    }

    // ---------------------------------------------------------
    // Get database connection from Vercel Environment Variable
    //
    // IMPORTANT:
    // Never hard-code DATABASE_URL or the Neon hostname here.
    // ---------------------------------------------------------
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        console.error('DATABASE_URL is not configured.');

        return res.status(500).json({
            ok: false,
            error: 'Database is not configured.'
        });
    }

    // ---------------------------------------------------------
    // Validate DATABASE_URL and extract Neon hostname
    // ---------------------------------------------------------
    let host;

    try {
        const databaseUrl = new URL(DATABASE_URL);

        if (databaseUrl.protocol !== 'postgresql:') {
            throw new Error('Invalid database protocol.');
        }

        host = databaseUrl.hostname;

    } catch (error) {
        console.error('Invalid DATABASE_URL configuration.');

        return res.status(500).json({
            ok: false,
            error: 'Database configuration is invalid.'
        });
    }

    const endpoint = `https://${host}/sql`;

    // ---------------------------------------------------------
    // Process contact submission
    // ---------------------------------------------------------
    try {

        let body = req.body;

        // Handle stringified JSON body
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (error) {
                return res.status(400).json({
                    ok: false,
                    error: 'Invalid JSON payload.'
                });
            }
        }

        body = body || {};

        // -----------------------------------------------------
        // Extract and sanitize input
        // -----------------------------------------------------
        const name = String(body.name || '').trim();
        const email = String(body.email || '').trim();
        const phone = String(body.phone || '').trim();
        const subject = String(body.subject || '').trim();
        const recipient = String(body.recipient || '').trim();
        const course = String(body.course || '').trim();
        const message = String(body.message || '').trim();

        // -----------------------------------------------------
        // Validation
        // -----------------------------------------------------

        if (!name) {
            return res.status(400).json({
                ok: false,
                error: 'Name is required.'
            });
        }

        if (name.length > 255) {
            return res.status(400).json({
                ok: false,
                error: 'Name is too long.'
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                ok: false,
                error:
                    'Please provide either an email or phone number.'
            });
        }

        if (email.length > 255) {
            return res.status(400).json({
                ok: false,
                error: 'Email address is too long.'
            });
        }

        if (phone.length > 50) {
            return res.status(400).json({
                ok: false,
                error: 'Phone number is too long.'
            });
        }

        if (subject.length > 255) {
            return res.status(400).json({
                ok: false,
                error: 'Subject is too long.'
            });
        }

        if (recipient.length > 100) {
            return res.status(400).json({
                ok: false,
                error: 'Recipient is too long.'
            });
        }

        if (course.length > 255) {
            return res.status(400).json({
                ok: false,
                error: 'Course value is too long.'
            });
        }

        if (message.length > 5000) {
            return res.status(400).json({
                ok: false,
                error: 'Message is too long.'
            });
        }

        // -----------------------------------------------------
        // Insert data into Neon PostgreSQL
        //
        // Parameterized query prevents SQL injection.
        // -----------------------------------------------------
        const response = await fetch(endpoint, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': DATABASE_URL
            },

            body: JSON.stringify({
                query:
                    'INSERT INTO contact_submissions ' +
                    '(name, email, phone, subject, recipient, course, message) ' +
                    'VALUES ($1, $2, $3, $4, $5, $6, $7) ' +
                    'RETURNING id, created_at;',

                params: [
                    name,
                    email,
                    phone,
                    subject,
                    recipient,
                    course,
                    message
                ]
            })
        });

        // -----------------------------------------------------
        // Parse Neon response
        // -----------------------------------------------------
        let result;

        try {
            result = await response.json();
        } catch (error) {
            console.error(
                'Invalid response received from Neon.'
            );

            return res.status(500).json({
                ok: false,
                error: 'Database request failed.'
            });
        }

        // -----------------------------------------------------
        // Handle database errors
        //
        // Do NOT send Neon error details to the browser.
        // -----------------------------------------------------
        if (!response.ok) {
            console.error(
                'Neon contact submission failed:',
                response.status
            );

            return res.status(500).json({
                ok: false,
                error: 'Failed to save contact submission.'
            });
        }

        // -----------------------------------------------------
        // Success
        // -----------------------------------------------------
        return res.status(201).json({
            ok: true,
            message: 'Contact form submitted successfully.',
            data:
                result.rows && result.rows[0]
                    ? result.rows[0]
                    : null
        });

    } catch (error) {

        // Log the actual error on the server only
        console.error(
            'Error submitting contact form:',
            error.message
        );

        // Return generic error to client
        return res.status(500).json({
            ok: false,
            error: 'Failed to submit contact form.'
        });
    }
};