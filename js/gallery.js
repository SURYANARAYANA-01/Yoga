// =============================================================
// GALLERY.JS — Arivukadal Sky Yoga SPA
// Category filter with smooth scale & fade animation
// =============================================================

(function () {
    'use strict';

    function initGallery() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const galleryItems  = document.querySelectorAll('#galleryGrid .gallery-item');

        if (!filterButtons.length || !galleryItems.length) return;

        galleryItems.forEach(function(item) {
            item.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        });

        function applyFilter (filter) {
            galleryItems.forEach(function (item) {
                const category = item.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    item.style.display = '';
                    requestAnimationFrame(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    });
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.85)';
                    setTimeout(() => {
                        if (item.style.opacity === '0') {
                            item.style.display = 'none';
                        }
                    }, 300);
                }
            });
        }

        filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterButtons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter') || 'all';
                applyFilter(filter);
            });
        });

        applyFilter('all');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGallery);
    } else {
        initGallery();
    }
    document.addEventListener('sectionsLoaded', initGallery);

}());