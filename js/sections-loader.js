// =============================================================
// SECTIONS-LOADER.JS — Arivukadal Sky Yoga
// Fetches modular section files (sections/*.html) and mounts them into <main>
// =============================================================

(function () {
    'use strict';

    const SECTION_FILES = [
        'sections/hero.html',
        'sections/about.html',
        'sections/classes.html',
        'sections/timetable.html',
        'sections/gallery.html',
        'sections/pricing.html',
        'sections/reviews.html',
        'sections/blog.html',
        'sections/contact.html'
    ];

    async function loadSections() {
        const main = document.getElementById('mainContent');
        if (!main) return;

        try {
            const responses = await Promise.all(
                SECTION_FILES.map(file => fetch(file).then(res => {
                    if (!res.ok) throw new Error('Failed to fetch ' + file);
                    return res.text();
                }))
            );

            main.innerHTML = responses.join('\n');

            // Dispatch event so other scripts know DOM is ready
            document.dispatchEvent(new CustomEvent('sectionsLoaded'));

        } catch (err) {
            console.error('Error loading modular sections:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSections);
    } else {
        loadSections();
    }
}());
