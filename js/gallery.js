// =============================================================
// GALLERY.JS — Arivukadal Sky Yoga SPA
// Real photo gallery filtering & accessible fullscreen lightbox
// =============================================================

(function () {
    'use strict';

    // Prevent duplicate event handlers on multiple init triggers
    if (window.__arivukadalGalleryInitialized) {
        return;
    }
    window.__arivukadalGalleryInitialized = true;

    let galleryGrid = null;
    let filterButtons = [];
    let allItems = [];
    let visibleItems = [];
    let currentIndex = 0;
    let lightboxEl = null;
    let lightboxImg = null;
    let lightboxCounter = null;
    let isLightboxOpen = false;
    let lastActiveElement = null;

    /**
     * Build and inject the lightbox markup once into <body>
     */
    function createLightbox() {
        let existing = document.getElementById('galleryLightbox');
        if (existing) {
            lightboxEl = existing;
        } else {
            lightboxEl = document.createElement('div');
            lightboxEl.id = 'galleryLightbox';
            lightboxEl.className = 'lightbox';
            lightboxEl.setAttribute('role', 'dialog');
            lightboxEl.setAttribute('aria-modal', 'true');
            lightboxEl.setAttribute('aria-label', 'Image preview');
            lightboxEl.setAttribute('aria-hidden', 'true');
            lightboxEl.setAttribute('tabindex', '-1');

            lightboxEl.innerHTML = `
                <button type="button" class="lightbox-close" aria-label="Close preview">&times;</button>
                <button type="button" class="lightbox-prev" aria-label="Previous image">&#10094;</button>
                <button type="button" class="lightbox-next" aria-label="Next image">&#10095;</button>
                <div class="lightbox-content">
                    <img class="lightbox-img" src="" alt="Enlarged photo view">
                    <div class="lightbox-counter"></div>
                </div>
            `;
            document.body.appendChild(lightboxEl);
        }

        lightboxImg = lightboxEl.querySelector('.lightbox-img');
        lightboxCounter = lightboxEl.querySelector('.lightbox-counter');

        // Lightbox element click handling (delegation & backdrop)
        lightboxEl.addEventListener('click', function (e) {
            if (e.target.closest('.lightbox-close')) {
                closeLightbox();
            } else if (e.target.closest('.lightbox-prev')) {
                prevImage();
            } else if (e.target.closest('.lightbox-next')) {
                nextImage();
            } else if (e.target === lightboxEl || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });
    }

    /**
     * Open lightbox at index in the visible items list
     */
    function openLightbox(index) {
        if (!visibleItems.length || index < 0 || index >= visibleItems.length) return;

        lastActiveElement = document.activeElement;
        currentIndex = index;
        updateLightboxContent();

        isLightboxOpen = true;
        lightboxEl.classList.add('active');
        lightboxEl.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        document.body.style.overflow = 'hidden';

        const closeBtn = lightboxEl.querySelector('.lightbox-close');
        if (closeBtn) closeBtn.focus();
    }

    /**
     * Close the lightbox
     */
    function closeLightbox() {
        if (!isLightboxOpen) return;

        isLightboxOpen = false;
        lightboxEl.classList.remove('active');
        lightboxEl.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-open');
        document.body.style.overflow = '';

        if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
            lastActiveElement.focus();
        }
    }

    /**
     * Update current lightbox image and counter
     */
    function updateLightboxContent() {
        if (!visibleItems.length || currentIndex < 0 || currentIndex >= visibleItems.length) return;

        const currentItem = visibleItems[currentIndex];
        const img = currentItem.querySelector('img');
        if (!img) return;

        lightboxImg.style.opacity = '0.4';
        lightboxImg.style.transform = 'scale(0.97)';

        const newSrc = img.getAttribute('src');
        const newAlt = img.getAttribute('alt') || 'Yoga photo';

        lightboxImg.src = newSrc;
        lightboxImg.alt = newAlt;

        lightboxCounter.textContent = `${currentIndex + 1} / ${visibleItems.length}`;

        requestAnimationFrame(() => {
            lightboxImg.style.opacity = '1';
            lightboxImg.style.transform = 'scale(1)';
        });
    }

    /**
     * Show previous visible image
     */
    function prevImage() {
        if (!visibleItems.length) return;
        currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
        updateLightboxContent();
    }

    /**
     * Show next visible image
     */
    function nextImage() {
        if (!visibleItems.length) return;
        currentIndex = (currentIndex + 1) % visibleItems.length;
        updateLightboxContent();
    }

    /**
     * Apply category filter
     */
    function applyFilter(filter) {
        visibleItems = [];

        allItems.forEach(function (item) {
            const category = item.getAttribute('data-category');
            const matches = (filter === 'all' || category === filter);

            if (matches) {
                item.classList.remove('is-hidden');
                item.style.display = '';
                visibleItems.push(item);
                requestAnimationFrame(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'scale(1)';
                });
            } else {
                item.classList.add('is-hidden');
                item.style.display = 'none';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9)';
            }
        });

        // If lightbox is open while filter changes, update index safely
        if (isLightboxOpen) {
            if (visibleItems.length > 0) {
                currentIndex = 0;
                updateLightboxContent();
            } else {
                closeLightbox();
            }
        }
    }

    /**
     * Initialize the gallery
     */
    function initGallery() {
        galleryGrid = document.getElementById('galleryGrid');
        filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
        if (!galleryGrid) return;

        allItems = Array.from(galleryGrid.querySelectorAll('.gallery-item'));
        if (!allItems.length) return;

        // Make all gallery items accessible and interactive
        allItems.forEach(function (item, index) {
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            const img = item.querySelector('img');
            const altText = img ? img.getAttribute('alt') : 'Yoga photo';
            item.setAttribute('aria-label', `View ${altText}`);

            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const vIndex = visibleItems.indexOf(item);
                    if (vIndex !== -1) {
                        openLightbox(vIndex);
                    }
                }
            });
        });

        // Gallery grid click delegation
        galleryGrid.addEventListener('click', function (e) {
            const item = e.target.closest('.gallery-item');
            if (item) {
                const vIndex = visibleItems.indexOf(item);
                if (vIndex !== -1) {
                    openLightbox(vIndex);
                }
            }
        });

        // Filter buttons click handler
        filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterButtons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter') || 'all';
                applyFilter(filter);
            });
        });

        // Global keyboard controls
        document.addEventListener('keydown', function (e) {
            if (!isLightboxOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevImage();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextImage();
            }
        });

        // Inject lightbox DOM
        createLightbox();

        // Initial filter state
        applyFilter('all');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGallery);
    } else {
        initGallery();
    }
    document.addEventListener('sectionsLoaded', initGallery);

}());