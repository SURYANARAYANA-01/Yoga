// =============================================================
// GALLERY.JS — Arivukadal Sky Yoga SPA
// Category filter for the #gallery section
// =============================================================

(function () {
    'use strict';

    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems  = document.querySelectorAll('#galleryGrid .gallery-item');

    if (!filterButtons.length || !galleryItems.length) return;

    // --------------------------------------------------------
    // Filter handler
    // --------------------------------------------------------
    function applyFilter (filter) {
        galleryItems.forEach(function (item) {
            const category = item.getAttribute('data-category');

            if (filter === 'all' || category === filter) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // --------------------------------------------------------
    // Button click handler
    // --------------------------------------------------------
    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            // Update active state
            filterButtons.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            // Apply filter
            const filter = btn.getAttribute('data-filter') || 'all';
            applyFilter(filter);
        });
    });

    // --------------------------------------------------------
    // Initialise — show all on load
    // --------------------------------------------------------
    applyFilter('all');

}());