// ==========================================
// GALLERY PAGE JAVASCRIPT
// Arivukadal Sky Yoga
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // ==========================
    // Active Navigation
    // ==========================

    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".nav-links a").forEach(function(link){

        if(link.getAttribute("href") === currentPage){

            link.classList.add("active");

        }

    });

    // ==========================
    // Scroll Reveal
    // ==========================

    const revealItems = document.querySelectorAll(
        ".gallery-card, .video-card, .student-card, .instagram-box, .cta-content"
    );

    function revealOnScroll(){

        const trigger = window.innerHeight * 0.85;

        revealItems.forEach(function(item){

            const top = item.getBoundingClientRect().top;

            if(top < trigger){

                item.style.opacity = "1";
                item.style.transform = "translateY(0px)";

            }

        });

    }

    revealItems.forEach(function(item){

        item.style.opacity = "0";
        item.style.transform = "translateY(40px)";
        item.style.transition = "all 0.7s ease";

    });

    window.addEventListener("scroll", revealOnScroll);

    revealOnScroll();

    // ==========================
    // Category Buttons
    // ==========================

    const categoryButtons = document.querySelectorAll(".category-buttons button");

    if(categoryButtons.length > 0){

        categoryButtons.forEach(function(button){

            button.addEventListener("click", function(){

                categoryButtons.forEach(function(btn){

                    btn.classList.remove("active");

                });

                this.classList.add("active");

            });

        });

    }

    // ==========================
    // Gallery Cards
    // ==========================

    const galleryCards = document.querySelectorAll(".gallery-card");

    if(galleryCards.length > 0){

        galleryCards.forEach(function(card, index){

            card.addEventListener("click", function(){

                alert("Gallery Image " + (index + 1));

            });

        });

    }

    // ==========================
    // Video Cards
    // ==========================

    const videoCards = document.querySelectorAll(".video-card");

    if(videoCards.length > 0){

        videoCards.forEach(function(video){

            video.addEventListener("click", function(){

                alert("Video Player Coming Soon");

            });

        });

    }

    // ==========================
    // Instagram Button
    // ==========================

    const instagramBtn = document.querySelector(".instagram-box .btn");

    if(instagramBtn){

        instagramBtn.addEventListener("click", function(e){

            e.preventDefault();

            alert("Instagram Link Coming Soon");

        });

    }

});