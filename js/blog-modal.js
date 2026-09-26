/**
 * blog-modal.js
 * Opens a full-article modal when "Read More" is clicked on any blog card.
 * All article content is stored as data-attributes on the button itself.
 */
(function () {
  'use strict';

  const modal     = document.getElementById('blogModal');
  const closeBtn  = document.getElementById('blogModalClose');
  const modalImg  = document.getElementById('blogModalImg');
  const modalTag  = document.getElementById('blogModalTag');
  const modalDate = document.getElementById('blogModalDate');
  const modalTitle= document.getElementById('blogModalTitle');
  const modalBody = document.getElementById('blogModalBody');

  if (!modal) return;

  function openModal(btn) {
    const title   = btn.dataset.blogTitle   || '';
    const tag     = btn.dataset.blogTag     || '';
    const date    = btn.dataset.blogDate    || '';
    const imgSrc  = btn.dataset.blogImg     || '';
    const content = btn.dataset.blogContent || '';

    modalImg.src          = imgSrc;
    modalImg.alt          = title;
    modalTag.textContent  = tag;
    modalDate.textContent = date;
    modalTitle.textContent= title;
    modalBody.innerHTML   = content;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    modalBody.innerHTML = '';
    modalImg.src = '';
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.blog-read-more');
    if (btn) { e.preventDefault(); openModal(btn); }
  });

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();
