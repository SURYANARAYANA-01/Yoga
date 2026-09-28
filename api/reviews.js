// =============================================================
// VERCEL SERVERLESS FUNCTION: /api/reviews
// Handles: GET (fetch reviews) & POST (submit review)
// Connects securely to Neon PostgreSQL
// =============================================================

module.exports = async function handler(req, res) {

    // ---------------------------------------------------------
    // CORS / Security Headers
    // ---------------------------------------------------------
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );
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
    // Only GET and POST requests are allowed
    // ---------------------------------------------------------
    if (req.method !== 'GET' && req.method !== 'POST') {
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
    // Neon database query helper
    // ---------------------------------------------------------
    async function queryNeon(query, params = []) {

        const response = await fetch(endpoint, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': DATABASE_URL
            },

            body: JSON.stringify({
                query,
                params
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

            throw new Error('Invalid database response.');
        }

        // -----------------------------------------------------
        // Handle database errors
        //
        // Do not expose Neon/database error details to users.
        // -----------------------------------------------------
        if (!response.ok) {
            console.error(
                'Neon database request failed:',
                response.status
            );

            throw new Error('Database request failed.');
        }

        return result;
    }

    // =========================================================
    // GET — Fetch reviews
    // =========================================================
    if (req.method === 'GET') {

        try {

            const result = await queryNeon(
                'SELECT id, name, rating, comment, created_at ' +
                'FROM reviews ' +
                'ORDER BY created_at DESC ' +
                'LIMIT 50;',
                []
            );

            return res.status(200).json({
                ok: true,
                data: result.rows || []
            });

        } catch (error) {

            console.error(
                'Error fetching reviews:',
                error.message
            );

            return res.status(500).json({
                ok: false,
                error: 'Failed to fetch reviews.'
            });
        }
    }

    // =========================================================
    // POST — Submit review
    // =========================================================
    if (req.method === 'POST') {

        try {

            let body = req.body;

            // -------------------------------------------------
            // Handle stringified JSON body
            // -------------------------------------------------
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

            // -------------------------------------------------
            // Extract input
            // -------------------------------------------------
            const name = String(
                body.name || ''
            ).trim();

            const rating = Number.parseInt(
                body.rating,
                10
            );

            const comment = String(
                body.comment || ''
            ).trim();

            // -------------------------------------------------
            // Validate name
            // -------------------------------------------------
            if (!name || name.length < 2) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'Name must be at least 2 characters long.'
                });
            }

            if (name.length > 255) {

                return res.status(400).json({
                    ok: false,
                    error: 'Name is too long.'
                });
            }

            // -------------------------------------------------
            // Validate rating
            // -------------------------------------------------
            if (
                Number.isNaN(rating) ||
                rating < 1 ||
                rating > 5
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'Rating must be between 1 and 5 stars.'
                });
            }

            // -------------------------------------------------
            // Validate review comment
            // -------------------------------------------------
            if (!comment || comment.length < 5) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'Review must be at least 5 characters long.'
                });
            }

            if (comment.length > 5000) {

                return res.status(400).json({
                    ok: false,
                    error: 'Review is too long.'
                });
            }

            // -------------------------------------------------
            // Insert review into Neon PostgreSQL
            //
            // Parameterized query prevents SQL injection.
            // -------------------------------------------------
            const result = await queryNeon(
                'INSERT INTO reviews ' +
                '(name, rating, comment) ' +
                'VALUES ($1, $2, $3) ' +
                'RETURNING id, name, rating, comment, created_at;',
                [
                    name,
                    rating,
                    comment
                ]
            );

            // -------------------------------------------------
            // Success
            // -------------------------------------------------
            return res.status(201).json({
                ok: true,
                message: 'Review submitted successfully.',
                data:
                    result.rows && result.rows[0]
                        ? result.rows[0]
                        : null
            });

        } catch (error) {

            // Log actual error server-side only
            console.error(
                'Error submitting review:',
                error.message
            );

            // Return generic error to client
            return res.status(500).json({
                ok: false,
                error: 'Failed to submit review.'
            });
        }
    }

    // ---------------------------------------------------------
    // Fallback
    // ---------------------------------------------------------
    return res.status(405).json({
        ok: false,
        error: 'Method not allowed'
    });
};