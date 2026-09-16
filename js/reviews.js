// =============================================================
// REVIEWS.JS — Arivukadal Sky Yoga
// Supabase client-side reviews + dynamic rating stats + modal form
// =============================================================

(function () {
    'use strict';

    // -------------------------------------------------------
    // Supabase Credentials
    // -------------------------------------------------------
    const SUPABASE_URL      = window.SUPABASE_URL || 'https://vwifxaufztllmwggbyil.supabase.co';
    const SUPABASE_ANON_KEY = window.SUPABASE_KEY || 'sb_publishable_3hptE6qzba565zpEuZv29w_gnr25Vb7';
    // -------------------------------------------------------

    // -------------------------------------------------------
    // DOM elements
    // -------------------------------------------------------
    const ratingSummaryBar  = document.getElementById('ratingSummaryBar');
    const ratingTier        = document.getElementById('ratingTier');
    const summaryStarsFg    = document.getElementById('summaryStarsFg');
    const summaryAvg        = document.getElementById('summaryAvg');
    const summaryCountText  = document.getElementById('summaryCountText');

    const reviewsLoading    = document.getElementById('reviewsLoading');
    const reviewsEmptyState = document.getElementById('reviewsEmptyState');
    const reviewsErrorState = document.getElementById('reviewsErrorState');
    const reviewsGrid       = document.getElementById('reviewsGrid');

    // Modal elements
    const reviewModal       = document.getElementById('reviewModal');
    const closeReviewModal  = document.getElementById('closeReviewModal');
    const writeReviewBtn    = document.getElementById('writeReviewBtn');
    const openModalBtns     = document.querySelectorAll('.open-review-modal-btn');

    // Form elements
    const reviewForm        = document.getElementById('reviewForm');
    const submitBtn         = document.getElementById('reviewSubmitBtn');
    const nameInput         = document.getElementById('reviewName');
    const commentInput      = document.getElementById('reviewComment');
    const charCountEl       = document.getElementById('charCount');
    const ratingError       = document.getElementById('ratingError');
    const formError         = document.getElementById('formError');
    const reviewSuccessMsg  = document.getElementById('reviewSuccessMsg');

    // Avatar color palette for cycling
    const AVATAR_COLORS = [
        'linear-gradient(135deg, #6DB8D4, #3E8FB0)', // Sky Blue (Primary)
        'linear-gradient(135deg, #7B2D42, #5A1E2E)', // Maroon (Secondary)
        'linear-gradient(135deg, #E6C244, #B89619)', // Accent Yellow
        'linear-gradient(135deg, #4B5563, #374151)'  // Neutral Dark Gray
    ];

    let allReviews = [];

    // Exit early if the reviews section isn't present
    if (!reviewsGrid) return;

    // -------------------------------------------------------
    // Supabase client init
    // -------------------------------------------------------
    let supabase = window.supabaseClient;
    if (!supabase && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // -------------------------------------------------------
    // Modal Open / Close Logic
    // -------------------------------------------------------
    function openModal() {
        if (!reviewModal) return;
        reviewModal.classList.add('open');
        reviewModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus first field
        if (nameInput) setTimeout(() => nameInput.focus(), 100);
    }

    function closeModal() {
        if (!reviewModal) return;
        reviewModal.classList.remove('open');
        reviewModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Reset form & states after animation
        setTimeout(() => {
            if (reviewForm) reviewForm.reset();
            if (reviewForm) reviewForm.style.display = 'block';
            if (reviewSuccessMsg) reviewSuccessMsg.style.display = 'none';
            if (charCountEl) charCountEl.textContent = '0';
            if (ratingError) ratingError.classList.remove('show');
            if (formError)   formError.classList.remove('show');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
            }
        }, 300);
    }

    if (writeReviewBtn) writeReviewBtn.addEventListener('click', openModal);
    openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeReviewModal) closeReviewModal.addEventListener('click', closeModal);

    if (reviewModal) {
        reviewModal.addEventListener('click', function (e) {
            if (e.target === reviewModal) closeModal();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && reviewModal && reviewModal.classList.contains('open')) {
            closeModal();
        }
    });

    // -------------------------------------------------------
    // Form Character counter & Star Keyboard Nav
    // -------------------------------------------------------
    if (commentInput && charCountEl) {
        commentInput.addEventListener('input', function () {
            charCountEl.textContent = commentInput.value.length;
        });
    }

    const starLabels = document.querySelectorAll('.star-rating-widget label');
    starLabels.forEach(function (label) {
        label.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                label.click();
            }
        });
    });

    // -------------------------------------------------------
    // Helper Utilities
    // -------------------------------------------------------
    function getSelectedRating() {
        const checked = document.querySelector('input[name="rating"]:checked');
        return checked ? parseInt(checked.value) : 0;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getInitial(name) {
        return name ? name.trim().charAt(0).toUpperCase() : '?';
    }

    function getAvatarBg(name) {
        let hash = 0;
        const str = name || '';
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % AVATAR_COLORS.length;
        return AVATAR_COLORS[index];
    }

    function timeAgo(isoString) {
        if (!isoString) return 'Recently';
        const now = new Date();
        const past = new Date(isoString);
        const diffSec = Math.floor((now - past) / 1000);

        if (diffSec < 45) return 'Just now';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 30) return `${diffDay}d ago`;
        const diffMth = Math.floor(diffDay / 30);
        if (diffMth < 12) return `${diffMth}mo ago`;
        const diffYr = Math.floor(diffDay / 365);
        return `${diffYr}y ago`;
    }

    function getRatingTierWord(avg) {
        if (avg >= 4.7) return 'Exceptional';
        if (avg >= 4.3) return 'Excellent';
        if (avg >= 4.0) return 'Great';
        if (avg >= 3.5) return 'Very Good';
        if (avg >= 3.0) return 'Good';
        return 'Rated';
    }

    function renderCardStars(rating) {
        const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 0));
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= numRating
                ? '<span class="s-fill" aria-hidden="true">★</span>'
                : '<span class="s-empty" aria-hidden="true">☆</span>';
        }
        return html;
    }

    // -------------------------------------------------------
    // Calculate & Update Rating Summary Bar
    // -------------------------------------------------------
    function updateSummaryBar(reviews) {
        if (!ratingSummaryBar) return;

        if (!reviews || reviews.length === 0) {
            if (ratingTier) ratingTier.textContent = 'Welcome';
            if (summaryAvg)  summaryAvg.textContent = '5.0';
            if (summaryCountText) summaryCountText.textContent = 'Be the first one to write a review!';
            if (summaryStarsFg) summaryStarsFg.style.width = '100%';
            ratingSummaryBar.style.display = 'flex';
            return;
        }

        const count = reviews.length;
        const totalRating = reviews.reduce((sum, r) => sum + (parseInt(r.rating, 10) || 0), 0);
        const avg = totalRating / count;
        const roundedAvg = (Math.round(avg * 10) / 10).toFixed(1);
        const tierWord = getRatingTierWord(parseFloat(roundedAvg));

        if (ratingTier) ratingTier.textContent = tierWord;
        if (summaryAvg)  summaryAvg.textContent = roundedAvg;
        if (summaryCountText) {
            summaryCountText.textContent = `Based on ${count} review${count > 1 ? 's' : ''}`;
        }

        // Percentage for clip star overlay
        const starPercent = Math.min(100, Math.max(0, (avg / 5) * 100));
        if (summaryStarsFg) {
            summaryStarsFg.style.width = `${starPercent}%`;
        }

        ratingSummaryBar.style.display = 'flex';
    }

    // -------------------------------------------------------
    // Build Review Card Element
    // -------------------------------------------------------
    function buildReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'review-card glass';

        const initial = getInitial(review.name);
        const bgStyle = getAvatarBg(review.name);
        const relativeTime = timeAgo(review.created_at);
        const isLongText = (review.comment || '').length > 130;

        card.innerHTML = `
            <div class="review-card-top">
                <div class="reviewer-avatar" style="background:${bgStyle};">${initial}</div>
                <div class="reviewer-info">
                    <div class="reviewer-name">${escapeHtml(review.name)}</div>
                    <div class="reviewer-time">${relativeTime}</div>
                </div>
            </div>
            <div class="card-stars" aria-label="${review.rating} out of 5 stars">
                ${renderCardStars(review.rating)}
            </div>
            <p class="review-text-body">${escapeHtml(review.comment)}</p>
            ${isLongText ? '<button type="button" class="read-more-btn">Read more</button>' : ''}
        `;

        if (isLongText) {
            const readMoreBtn = card.querySelector('.read-more-btn');
            const textBody = card.querySelector('.review-text-body');
            readMoreBtn.addEventListener('click', function () {
                const isExpanded = textBody.classList.toggle('expanded');
                readMoreBtn.textContent = isExpanded ? 'Read less' : 'Read more';
            });
        }

        return card;
    }

    // -------------------------------------------------------
    // Render All Review Cards Grid
    // -------------------------------------------------------
    function renderGrid(reviews) {
        if (!reviewsGrid) return;
        reviewsGrid.innerHTML = '';

        if (!reviews || reviews.length === 0) {
            if (reviewsGrid) reviewsGrid.style.display = 'none';
            if (reviewsEmptyState) reviewsEmptyState.style.display = 'block';
            return;
        }

        if (reviewsEmptyState) reviewsEmptyState.style.display = 'none';

        reviews.forEach(review => {
            reviewsGrid.appendChild(buildReviewCard(review));
        });

        reviewsGrid.style.display = 'grid';
    }

    // -------------------------------------------------------
    // Fetch Reviews from Supabase
    // -------------------------------------------------------
    async function loadReviews() {
        updateSummaryBar([]); // Ensure summary bar is visible immediately
        if (reviewsLoading) reviewsLoading.style.display = 'flex';
        if (reviewsEmptyState) reviewsEmptyState.style.display = 'none';
        if (reviewsErrorState) reviewsErrorState.style.display = 'none';
        if (reviewsGrid) reviewsGrid.style.display = 'none';

        if (!supabase) {
            if (reviewsLoading) reviewsLoading.style.display = 'none';
            if (!credsReady) {
                if (reviewsErrorState) {
                    const errText = reviewsErrorState.querySelector('#reviewsErrorText');
                    if (errText) errText.innerHTML = '⚙️ Reviews will appear here once Supabase credentials are configured in <code>js/reviews.js</code>.';
                    reviewsErrorState.style.display = 'block';
                }
            } else {
                if (reviewsErrorState) {
                    const errText = reviewsErrorState.querySelector('#reviewsErrorText');
                    if (errText) errText.textContent = 'Could not connect to database.';
                    reviewsErrorState.style.display = 'block';
                }
            }
            return;
        }

        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('id, name, rating, comment, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (reviewsLoading) reviewsLoading.style.display = 'none';

            allReviews = data || [];
            updateSummaryBar(allReviews);
            renderGrid(allReviews);

        } catch (err) {
            console.error('Error fetching reviews:', err);
            if (reviewsLoading) reviewsLoading.style.display = 'none';
            if (reviewsErrorState) {
                const errText = reviewsErrorState.querySelector('#reviewsErrorText');
                if (errText) errText.textContent = 'Could not load reviews right now. Please refresh the page.';
                reviewsErrorState.style.display = 'block';
            }
        }
    }

    // -------------------------------------------------------
    // Submit Form Handler (Inside Modal)
    // -------------------------------------------------------
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (ratingError) ratingError.classList.remove('show');
            if (formError)   formError.classList.remove('show');

            const name    = nameInput ? nameInput.value.trim() : '';
            const rating  = getSelectedRating();
            const comment = commentInput ? commentInput.value.trim() : '';

            let valid = true;
            if (!name || name.length < 2) valid = false;
            if (!rating || rating < 1 || rating > 5) {
                if (ratingError) ratingError.classList.add('show');
                valid = false;
            }
            if (!comment || comment.length < 5 || comment.length > 500) valid = false;

            if (!valid) {
                if (formError) {
                    formError.textContent = 'Please fill in all fields correctly before submitting.';
                    formError.classList.add('show');
                }
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting…';
            }

            if (!supabase) {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Review';
                }
                if (formError) {
                    formError.textContent = '⚙️ Supabase credentials not configured in js/reviews.js yet.';
                    formError.classList.add('show');
                }
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .insert([{ name, rating, comment }])
                    .select()
                    .single();

                if (error) throw error;

                // Show success view inside modal
                if (reviewForm) reviewForm.style.display = 'none';
                if (reviewSuccessMsg) reviewSuccessMsg.style.display = 'flex';

                // Prepend new review to state
                const newReview = {
                    id: data.id || Date.now(),
                    name,
                    rating,
                    comment,
                    created_at: data.created_at || new Date().toISOString()
                };

                allReviews.unshift(newReview);
                updateSummaryBar(allReviews);
                renderGrid(allReviews);

                // Auto close modal after 1.8 seconds
                setTimeout(() => {
                    closeModal();
                }, 1800);

            } catch (err) {
                console.error('Error submitting review:', err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Review';
                }
                if (formError) {
                    formError.textContent = 'Failed to submit review. Please try again.';
                    formError.classList.add('show');
                }
            }
        });
    }

    // Initialize on page load
    loadReviews();

}());