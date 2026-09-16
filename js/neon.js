// =============================================================
// NEON.JS — Arivukadal Sky Yoga
// Neon Serverless PostgreSQL client over HTTP (Vanilla JS / Browser)
// =============================================================

(function (window) {
    'use strict';

    const NEON_HOST = 'ep-summer-credit-a5tzhrjm-pooler.us-east-2.aws.neon.tech';
    const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_nxKGALJYgC83@ep-summer-credit-a5tzhrjm-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
    const NEON_SQL_ENDPOINT = `https://${NEON_HOST}/sql`;

    /**
     * Executes parameterized SQL query via Neon Serverless HTTP API
     * @param {string} query - SQL query string
     * @param {Array} params - Query parameters for prepared statement
     * @returns {Promise<{rows: Array, rowCount: number, error: any}>}
     */
    async function sql(query, params = []) {
        try {
            const response = await fetch(NEON_SQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Neon-Connection-String': NEON_CONNECTION_STRING
                },
                body: JSON.stringify({ query, params })
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    data: null,
                    rows: [],
                    rowCount: 0,
                    error: result || new Error(`HTTP ${response.status}`)
                };
            }

            return {
                data: result.rows || [],
                rows: result.rows || [],
                rowCount: result.rowCount || 0,
                error: null
            };
        } catch (err) {
            console.error('Neon SQL execution error:', err);
            return {
                data: null,
                rows: [],
                rowCount: 0,
                error: err
            };
        }
    }

    // Expose client to global window scope
    window.neonClient = {
        sql,
        NEON_HOST,
        NEON_CONNECTION_STRING
    };

})(window);
