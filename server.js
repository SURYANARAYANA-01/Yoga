// =============================================================
// ARIVUKADAL SKY YOGA — BACKEND SERVER
// Static file server & Neon PostgreSQL API endpoints
// =============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// =============================================================
// ENVIRONMENT CONFIGURATION
// =============================================================

// Load .env for local development.
// On Vercel/production, DATABASE_URL should be configured
// through the platform's Environment Variables.
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');

    envContent.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const eqIdx = trimmed.indexOf('=');

        if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const value = trimmed.substring(eqIdx + 1).trim();

            if (!process.env[key]) {
                process.env[key] = value.replace(/^["']|["']$/g, '');
            }
        }
    });
}

// =============================================================
// SERVER CONFIGURATION
// =============================================================

const PORT = parseInt(process.env.PORT, 10) || 3000;

// IMPORTANT:
// Never put the actual database connection string directly
// inside this file.
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error(
        '❌ DATABASE_URL is not configured. ' +
        'Set DATABASE_URL in your environment variables.'
    );

    process.exit(1);
}

// =============================================================
// NEON CONFIGURATION
// =============================================================

let NEON_HOST = '';

try {
    const parsedDatabaseUrl = new URL(DATABASE_URL);

    if (parsedDatabaseUrl.protocol !== 'postgresql:') {
        throw new Error('DATABASE_URL must use the postgresql:// protocol.');
    }

    NEON_HOST = parsedDatabaseUrl.hostname;
} catch (error) {
    console.error('❌ Invalid DATABASE_URL:', error.message);
    process.exit(1);
}

const NEON_SQL_ENDPOINT = `https://${NEON_HOST}/sql`;

// =============================================================
// DATABASE QUERY HELPER
// =============================================================

/**
 * Execute a parameterized SQL query on Neon PostgreSQL
 * using Neon HTTP SQL API.
 *
 * @param {string} query
 * @param {Array} params
 * @returns {Promise<Object>}
 */
async function queryNeon(query, params = []) {
    if (!DATABASE_URL || !NEON_SQL_ENDPOINT) {
        throw new Error('Database is not configured.');
    }

    const response = await fetch(NEON_SQL_ENDPOINT, {
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

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(`Database returned HTTP ${response.status}`);
    }

    if (!response.ok) {
        const errorMessage =
            result?.message ||
            result?.error ||
            `Database request failed with HTTP ${response.status}`;

        throw new Error(errorMessage);
    }

    return result;
}

// =============================================================
// DATABASE INITIALIZATION
// =============================================================

async function initDatabase() {
    const statements = [
        `
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        `,

        `
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            course VARCHAR(255),
            subject VARCHAR(255),
            recipient VARCHAR(100),
            message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        `,

        `
        ALTER TABLE contact_submissions
        ADD COLUMN IF NOT EXISTS course VARCHAR(255);
        `,

        `
        ALTER TABLE contact_submissions
        ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
        `,

        `
        ALTER TABLE contact_submissions
        ADD COLUMN IF NOT EXISTS recipient VARCHAR(100);
        `
    ];

    try {
        for (const sql of statements) {
            await queryNeon(sql);
        }

        console.log(
            '✅ Neon PostgreSQL tables and columns verified successfully.'
        );
    } catch (error) {
        console.error(
            '❌ Database initialization failed:',
            error.message
        );
    }
}

// =============================================================
// MIME TYPES
// =============================================================

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',

    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',

    '.mp4': 'video/mp4',

    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// =============================================================
// REQUEST BODY PARSER
// =============================================================

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;

            // 1 MB request body limit
            if (body.length > 1e6) {
                reject(new Error('Request body too large.'));
                req.destroy();
            }
        });

        req.on('end', () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error('Invalid JSON payload.'));
            }
        });

        req.on('error', reject);
    });
}

// =============================================================
// SECURITY HEADERS
// =============================================================

function getSecurityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
}

// =============================================================
// JSON RESPONSE HELPER
// =============================================================

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',

        // Keep this as * if your frontend/API are hosted separately.
        'Access-Control-Allow-Origin': '*',

        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',

        'Access-Control-Allow-Headers': 'Content-Type',

        ...getSecurityHeaders()
    });

    res.end(JSON.stringify(data));
}

// =============================================================
// ERROR RESPONSE
// =============================================================

function sendServerError(res, message = 'Internal server error.') {
    return sendJson(res, 500, {
        ok: false,
        error: message
    });
}

// =============================================================
// HTTP SERVER
// =============================================================

const server = http.createServer(async (req, res) => {
    let parsedUrl;

    try {
        parsedUrl = new URL(
            req.url,
            `http://${req.headers.host || 'localhost'}`
        );
    } catch {
        res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
            ...getSecurityHeaders()
        });

        res.end('400 Bad Request');
        return;
    }

    let pathname;

    try {
        pathname = decodeURIComponent(parsedUrl.pathname);
    } catch {
        res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
            ...getSecurityHeaders()
        });

        res.end('400 Bad Request');
        return;
    }

    // =========================================================
    // CORS PREFLIGHT
    // =========================================================

    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            ...getSecurityHeaders()
        });

        res.end();
        return;
    }

    // =========================================================
    // API ROUTES
    // =========================================================

    // ---------------------------------------------------------
    // 1. GET /api/reviews
    // ---------------------------------------------------------

    if (
        req.method === 'GET' &&
        pathname === '/api/reviews'
    ) {
        try {
            const result = await queryNeon(
                `
                SELECT
                    id,
                    name,
                    rating,
                    comment,
                    created_at
                FROM reviews
                ORDER BY created_at DESC
                LIMIT 50;
                `
            );

            return sendJson(res, 200, {
                ok: true,
                data: result.rows || []
            });
        } catch (error) {
            console.error(
                'Error fetching reviews:',
                error.message
            );

            return sendServerError(
                res,
                'Failed to fetch reviews.'
            );
        }
    }

    // ---------------------------------------------------------
    // 2. POST /api/reviews
    // ---------------------------------------------------------

    if (
        req.method === 'POST' &&
        pathname === '/api/reviews'
    ) {
        try {
            const body = await parseRequestBody(req);

            const name = String(body.name || '').trim();
            const rating = Number.parseInt(body.rating, 10);
            const comment = String(body.comment || '').trim();

            // Validation
            if (!name || name.length < 2) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Name must be at least 2 characters long.'
                });
            }

            if (name.length > 255) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Name is too long.'
                });
            }

            if (
                Number.isNaN(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Rating must be between 1 and 5 stars.'
                });
            }

            if (!comment || comment.length < 5) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Review must be at least 5 characters long.'
                });
            }

            if (comment.length > 5000) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Review is too long.'
                });
            }

            const result = await queryNeon(
                `
                INSERT INTO reviews
                    (name, rating, comment)
                VALUES
                    ($1, $2, $3)
                RETURNING
                    id,
                    name,
                    rating,
                    comment,
                    created_at;
                `,
                [
                    name,
                    rating,
                    comment
                ]
            );

            return sendJson(res, 201, {
                ok: true,
                message: 'Review submitted successfully.',
                data:
                    result.rows && result.rows[0]
                        ? result.rows[0]
                        : null
            });
        } catch (error) {
            console.error(
                'Error submitting review:',
                error.message
            );

            return sendServerError(
                res,
                'Failed to submit review.'
            );
        }
    }

    // ---------------------------------------------------------
    // 3. POST /api/contact
    // ---------------------------------------------------------

    if (
        req.method === 'POST' &&
        pathname === '/api/contact'
    ) {
        try {
            const body = await parseRequestBody(req);

            const name = String(body.name || '').trim();
            const email = String(body.email || '').trim();
            const phone = String(body.phone || '').trim();
            const subject = String(body.subject || '').trim();
            const recipient = String(body.recipient || '').trim();
            const course = String(body.course || '').trim();
            const message = String(body.message || '').trim();

            // Validation
            if (!name) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Name is required.'
                });
            }

            if (name.length > 255) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Name is too long.'
                });
            }

            if (!email && !phone) {
                return sendJson(res, 400, {
                    ok: false,
                    error:
                        'Please provide either an email address or phone number.'
                });
            }

            if (email && email.length > 255) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Email address is too long.'
                });
            }

            if (phone && phone.length > 50) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Phone number is too long.'
                });
            }

            if (course.length > 255) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Course value is too long.'
                });
            }

            if (subject.length > 255) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Subject is too long.'
                });
            }

            if (recipient.length > 100) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Recipient value is too long.'
                });
            }

            if (message.length > 5000) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Message is too long.'
                });
            }

            const result = await queryNeon(
                `
                INSERT INTO contact_submissions
                    (
                        name,
                        email,
                        phone,
                        subject,
                        recipient,
                        course,
                        message
                    )
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id,
                    created_at;
                `,
                [
                    name,
                    email,
                    phone,
                    subject,
                    recipient,
                    course,
                    message
                ]
            );

            return sendJson(res, 201, {
                ok: true,
                message:
                    'Contact form submitted successfully.',
                data:
                    result.rows && result.rows[0]
                        ? result.rows[0]
                        : null
            });
        } catch (error) {
            console.error(
                'Error submitting contact form:',
                error.message
            );

            return sendServerError(
                res,
                'Failed to submit contact form.'
            );
        }
    }

    // =========================================================
    // STATIC FILE SERVER
    // =========================================================

    if (
        req.method === 'GET' ||
        req.method === 'HEAD'
    ) {
        if (pathname === '/') {
            pathname = '/index.html';
        }

        // Prevent directory traversal
        const safePath = path.resolve(
            __dirname,
            `.${pathname}`
        );

        const rootDirectory = path.resolve(__dirname);

        if (
            safePath !== rootDirectory &&
            !safePath.startsWith(rootDirectory + path.sep)
        ) {
            res.writeHead(403, {
                'Content-Type':
                    'text/plain; charset=utf-8',
                ...getSecurityHeaders()
            });

            res.end('403 Forbidden');
            return;
        }

        fs.stat(safePath, (error, stats) => {
            if (
                error ||
                !stats ||
                !stats.isFile()
            ) {
                res.writeHead(404, {
                    'Content-Type':
                        'text/plain; charset=utf-8',
                    ...getSecurityHeaders()
                });

                res.end('404 Not Found');
                return;
            }

            const extension =
                path.extname(safePath).toLowerCase();

            const contentType =
                MIME_TYPES[extension] ||
                'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stats.size,

                'Cache-Control':
                    extension === '.html'
                        ? 'no-cache'
                        : 'public, max-age=3600',

                ...getSecurityHeaders()
            });

            if (req.method === 'HEAD') {
                res.end();
                return;
            }

            const stream =
                fs.createReadStream(safePath);

            stream.on('error', () => {
                if (!res.headersSent) {
                    res.writeHead(500, {
                        'Content-Type':
                            'text/plain; charset=utf-8',
                        ...getSecurityHeaders()
                    });
                }

                res.end('500 Internal Server Error');
            });

            stream.pipe(res);
        });

        return;
    }

    // =========================================================
    // UNHANDLED HTTP METHOD
    // =========================================================

    res.writeHead(405, {
        'Content-Type':
            'text/plain; charset=utf-8',
        'Allow': 'GET, HEAD, POST, OPTIONS',
        ...getSecurityHeaders()
    });

    res.end('405 Method Not Allowed');
});

// =============================================================
// SERVER START
// =============================================================

server.listen(PORT, async () => {
    console.log(
        '===================================================='
    );

    console.log(
        '🧘 Arivukadal Sky Yoga server running at:'
    );

    console.log(
        `   Local: http://localhost:${PORT}`
    );

    // Do NOT print DATABASE_URL.
    // Only the database hostname is shown.
    console.log(
        `   Database: Neon PostgreSQL (${NEON_HOST})`
    );

    console.log(
        '===================================================='
    );

    await initDatabase();
});