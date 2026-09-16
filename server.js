// =============================================================
// ARIVUKADAL SKY YOGA — BACKEND SERVER
// Static file server & Neon PostgreSQL API endpoints
// =============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Automatically load .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim();
            if (!process.env[key]) {
                process.env[key] = val.replace(/^["']|["']$/g, '');
            }
        }
    });
}

const PORT = parseInt(process.env.PORT, 10) || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';

// Parse host from DATABASE_URL
let NEON_HOST = '';
try {
    if (DATABASE_URL) {
        const parsed = new URL(DATABASE_URL);
        NEON_HOST = parsed.hostname;
    }
} catch (e) {
    console.error('Failed to parse DATABASE_URL hostname:', e.message);
}

const NEON_SQL_ENDPOINT = NEON_HOST ? `https://${NEON_HOST}/sql` : '';

/**
 * Execute parameterized query on Neon PostgreSQL via HTTP
 */
async function queryNeon(query, params = []) {
    if (!DATABASE_URL || !NEON_SQL_ENDPOINT) {
        throw new Error('DATABASE_URL is not configured in .env');
    }

    const response = await fetch(NEON_SQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Neon-Connection-String': DATABASE_URL
        },
        body: JSON.stringify({ query, params })
    });

    const result = await response.json();
    if (!response.ok) {
        const errorMsg = result?.message || result?.error || `Neon HTTP ${response.status}`;
        throw new Error(errorMsg);
    }

    return result;
}

// Ensure database tables and columns on server startup
async function initDatabase() {
    const stmts = [
        `CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS contact_submissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            course VARCHAR(255),
            subject VARCHAR(255),
            recipient VARCHAR(100),
            message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS course VARCHAR(255);`,
        `ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS subject VARCHAR(255);`,
        `ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS recipient VARCHAR(100);`
    ];

    try {
        for (const sql of stmts) {
            await queryNeon(sql);
        }
        console.log('✅ Neon PostgreSQL tables & columns verified/initialized successfully.');
    } catch (err) {
        console.warn('⚠️ Notice initializing Neon DB tables:', err.message);
    }
}

// MIME types dictionary for static files
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

/**
 * Helper to parse JSON request body
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1e6) { // 1MB limit
                req.destroy();
                reject(new Error('Request body too large'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON payload'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Helper to send JSON response with CORS headers
 */
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // -------------------------------------------------------------
    // API ROUTES
    // -------------------------------------------------------------

    // 1. GET /api/reviews — Fetch recent reviews
    if (req.method === 'GET' && pathname === '/api/reviews') {
        try {
            const result = await queryNeon(
                'SELECT id, name, rating, comment, created_at FROM reviews ORDER BY created_at DESC LIMIT 50;'
            );
            return sendJson(res, 200, {
                ok: true,
                data: result.rows || []
            });
        } catch (err) {
            console.error('Error fetching reviews:', err);
            return sendJson(res, 500, {
                ok: false,
                error: err.message || 'Failed to fetch reviews'
            });
        }
    }

    // 2. POST /api/reviews — Submit a new review
    if (req.method === 'POST' && pathname === '/api/reviews') {
        try {
            const body = await parseRequestBody(req);
            const name = (body.name || '').trim();
            const rating = parseInt(body.rating, 10);
            const comment = (body.comment || '').trim();

            if (!name || name.length < 2) {
                return sendJson(res, 400, { ok: false, error: 'Name must be at least 2 characters long.' });
            }
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return sendJson(res, 400, { ok: false, error: 'Rating must be between 1 and 5 stars.' });
            }
            if (!comment || comment.length < 5) {
                return sendJson(res, 400, { ok: false, error: 'Review must be at least 5 characters long.' });
            }

            const result = await queryNeon(
                'INSERT INTO reviews (name, rating, comment) VALUES ($1, $2, $3) RETURNING id, name, rating, comment, created_at;',
                [name, rating, comment]
            );

            return sendJson(res, 201, {
                ok: true,
                message: 'Review submitted successfully',
                data: result.rows && result.rows[0] ? result.rows[0] : null
            });
        } catch (err) {
            console.error('Error submitting review:', err);
            return sendJson(res, 500, {
                ok: false,
                error: err.message || 'Failed to submit review'
            });
        }
    }

    // 3. POST /api/contact — Submit contact form
    if (req.method === 'POST' && pathname === '/api/contact') {
        try {
            const body = await parseRequestBody(req);
            const name = (body.name || '').trim();
            const email = (body.email || '').trim();
            const phone = (body.phone || '').trim();
            const subject = (body.subject || '').trim();
            const recipient = (body.recipient || '').trim();
            const course = (body.course || '').trim();
            const message = (body.message || '').trim();

            if (!name) {
                return sendJson(res, 400, { ok: false, error: 'Name is required.' });
            }
            if (!email && !phone) {
                return sendJson(res, 400, { ok: false, error: 'Please provide either an email address or phone number.' });
            }

            const result = await queryNeon(
                'INSERT INTO contact_submissions (name, email, phone, subject, recipient, course, message) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at;',
                [name, email, phone, subject, recipient, course, message]
            );

            return sendJson(res, 201, {
                ok: true,
                message: 'Contact form submitted successfully',
                data: result.rows && result.rows[0] ? result.rows[0] : null
            });
        } catch (err) {
            console.error('Error submitting contact form:', err);
            return sendJson(res, 500, {
                ok: false,
                error: err.message || 'Failed to submit contact form'
            });
        }
    }

    // -------------------------------------------------------------
    // STATIC FILE SERVER
    // -------------------------------------------------------------
    if (req.method === 'GET' || req.method === 'HEAD') {
        if (pathname === '/') {
            pathname = '/index.html';
        }

        // Prevent directory traversal
        const safePath = path.normalize(path.join(__dirname, pathname));
        if (!safePath.startsWith(__dirname)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        fs.stat(safePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }

            const ext = path.extname(safePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stats.size,
                'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
            });

            if (req.method === 'HEAD') {
                res.end();
                return;
            }

            const stream = fs.createReadStream(safePath);
            stream.pipe(res);
        });
        return;
    }

    // Unhandled method
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('405 Method Not Allowed');
});

server.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🧘 Arivukadal Sky Yoga server running at:`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Neon DB Host: ${NEON_HOST || 'Not configured'}`);
    console.log(`====================================================`);
    await initDatabase();
});
