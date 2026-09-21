// =============================================================
// VERCEL SERVERLESS FUNCTION: /api/reviews
// Handles: GET (fetch reviews) & POST (submit review)
// Works automatically on Vercel deployment and connects to Neon DB
// =============================================================

module.exports = async function handler(req, res) {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nxKGALJYgC83@ep-summer-credit-a5tzhrjm-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
    let host = 'ep-summer-credit-a5tzhrjm-pooler.us-east-2.aws.neon.tech';
    try {
        if (DATABASE_URL) {
            const u = new URL(DATABASE_URL);
            host = u.hostname;
        }
    } catch (e) {}
    const endpoint = `https://${host}/sql`;

    async function queryNeon(query, params = []) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': DATABASE_URL
            },
            body: JSON.stringify({ query, params })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result?.message || result?.error || `HTTP ${response.status}`);
        }
        return result;
    }

    // 1. GET — Fetch reviews
    if (req.method === 'GET') {
        try {
            const result = await queryNeon(
                'SELECT id, name, rating, comment, created_at FROM reviews ORDER BY created_at DESC LIMIT 50;',
                []
            );
            return res.status(200).json({
                ok: true,
                data: result.rows || []
            });
        } catch (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({
                ok: false,
                error: err.message || 'Failed to fetch reviews'
            });
        }
    }

    // 2. POST — Submit review
    if (req.method === 'POST') {
        try {
            let body = req.body;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) {}
            }
            body = body || {};

            const name = (body.name || '').trim();
            const rating = parseInt(body.rating, 10);
            const comment = (body.comment || '').trim();

            if (!name || name.length < 2) {
                return res.status(400).json({ ok: false, error: 'Name must be at least 2 characters long.' });
            }
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({ ok: false, error: 'Rating must be between 1 and 5 stars.' });
            }
            if (!comment || comment.length < 5) {
                return res.status(400).json({ ok: false, error: 'Review must be at least 5 characters long.' });
            }

            const result = await queryNeon(
                'INSERT INTO reviews (name, rating, comment) VALUES ($1, $2, $3) RETURNING id, name, rating, comment, created_at;',
                [name, rating, comment]
            );

            return res.status(201).json({
                ok: true,
                message: 'Review submitted successfully',
                data: result.rows && result.rows[0] ? result.rows[0] : null
            });
        } catch (err) {
            console.error('Error submitting review:', err);
            return res.status(500).json({
                ok: false,
                error: err.message || 'Failed to submit review'
            });
        }
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
