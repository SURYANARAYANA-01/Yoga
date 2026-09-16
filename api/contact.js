// =============================================================
// VERCEL SERVERLESS FUNCTION: /api/contact
// Saves contact form submission to Neon PostgreSQL
// =============================================================

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nxKGALJYgC83@ep-summer-credit-a5tzhrjm-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
    const host = 'ep-summer-credit-a5tzhrjm-pooler.us-east-2.aws.neon.tech';
    const endpoint = `https://${host}/sql`;

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) {}
        }
        body = body || {};

        const name = (body.name || '').trim();
        const email = (body.email || '').trim();
        const phone = (body.phone || '').trim();
        const subject = (body.subject || '').trim();
        const recipient = (body.recipient || '').trim();
        const course = (body.course || '').trim();
        const message = (body.message || '').trim();

        if (!name) {
            return res.status(400).json({ ok: false, error: 'Name is required.' });
        }
        if (!email && !phone) {
            return res.status(400).json({ ok: false, error: 'Please provide either an email or phone number.' });
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': DATABASE_URL
            },
            body: JSON.stringify({
                query: 'INSERT INTO contact_submissions (name, email, phone, subject, recipient, course, message) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at;',
                params: [name, email, phone, subject, recipient, course, message]
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result?.message || result?.error || `HTTP ${response.status}`);
        }

        return res.status(201).json({
            ok: true,
            message: 'Contact form submitted successfully',
            data: result.rows && result.rows[0] ? result.rows[0] : null
        });
    } catch (err) {
        console.error('Error submitting contact form:', err);
        return res.status(500).json({
            ok: false,
            error: err.message || 'Failed to submit contact form'
        });
    }
};
