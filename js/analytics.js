// =============================================================
// ANALYTICS.JS — Arivukadal Sky Yoga
// Vercel Web Analytics — plain HTML / Vanilla JS initializer
// Uses: @vercel/analytics (npm package, v2)
//
// On Vercel:  /_vercel/insights/script.js is served by Vercel CDN
// On localhost: server.js serves it from node_modules
// =============================================================

(function () {
    'use strict';

    // --- Queue setup (required before script loads) ---
    if (!window.va) {
        window.va = function () {
            (window.vaq = window.vaq || []).push(arguments);
        };
    }

    // --- Inject the @vercel/analytics tracking script ---
    function injectVercelAnalytics() {
        var scriptSrc = '/_vercel/insights/script.js';

        // Avoid double injection
        if (document.querySelector('script[src*="_vercel/insights"]')) {
            return;
        }

        var script = document.createElement('script');
        script.src = scriptSrc;
        script.defer = true;
        script.dataset.sdkn = '@vercel/analytics';
        script.dataset.sdkv = '2.0.1';

        script.onerror = function () {
            console.warn(
                '[Vercel Analytics] Failed to load script from ' + scriptSrc + '. ' +
                'Make sure your project is deployed to Vercel and Web Analytics is enabled.'
            );
        };

        document.head.appendChild(script);
    }

    // Inject when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectVercelAnalytics);
    } else {
        injectVercelAnalytics();
    }

})();
