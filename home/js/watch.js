document.addEventListener('DOMContentLoaded', async () => {
    const movieCache = new Map();
    const categories = [
        'hero', 'top movie', 'coming-soon', 'hollywood',
        'bollywood', 'web series', 'tamil', 'action',
        'kids', 'hindi dubbed south', 'hindi dubbed',
        'bengali', 'marathi', 'punjabi'
    ];

    const categoryStates = {};
    categories.forEach(category => {
        categoryStates[category] = {
            loadedMovieIds: new Set(),
            offset: 0,
            initialLimit: 10,
            scrollLimit: 5,
            isLoading: false,
            hasMore: true
        };
    });

    const elements = {
        movieDetail: document.getElementById('movie-detail'),
        moviePoster: document.getElementById('movie-poster'),
        movieTitle: document.getElementById('movie-title'),
        movieDescription: document.getElementById('movie-description'),
        movieRating: document.getElementById('movie-rating'),
        movieQuality: document.getElementById('movie-quality'),
        movieYear: document.getElementById('movie-year'),
        movieDuration: document.getElementById('movie-duration'),
        movieGenres: document.getElementById('movie-genres'),
        similarMovies: document.getElementById('similar-movies'),
        playTrailerBtn: document.querySelector('.play-btn'),
        watchNowBtn: document.querySelector('.btn.btn-primary'),
        shareMovieBtn: document.querySelector('.share'),
        downloadBtn: document.getElementById('ransomware-link'),
        trailerModal: document.getElementById('trailer-modal'),
        closeModal: document.querySelector('.close-modal'),
        reviewForm: document.getElementById('review-form'),
        userReviews: document.getElementById('user-reviews'),
        loadingSpinner: document.getElementById('loading-spinner')
    };

    for (const [key, element] of Object.entries(elements)) {
        if (!element && !['playTrailerBtn', 'watchNowBtn', 'shareMovieBtn', 'closeModal'].includes(key)) {
            console.warn(`DOM element ${key} not found`);
            showError(`Failed to initialize ${key} component`);
        }
    }

    if (elements.playTrailerBtn) {
        elements.playTrailerBtn.addEventListener('click', showTrailer);
    }
    if (elements.watchNowBtn) {
        elements.watchNowBtn.addEventListener('click', watchMovie);
    }
    if (elements.shareMovieBtn) {
        elements.shareMovieBtn.addEventListener('click', shareMovie);
    }
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDownloadOptions();
        });
    }
    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', closeModal);
        elements.closeModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
                closeModal();
            }
        });
    }
    if (elements.trailerModal) {
        elements.trailerModal.addEventListener('click', (e) => {
            if (e.target === elements.trailerModal) {
                closeModal();
            }
        });
        elements.trailerModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }
    if (elements.reviewForm) {
        elements.reviewForm.addEventListener('submit', handleReviewSubmit);
    }

    let selectedRating = 0;
    if (elements.reviewForm) {
        const starRating = elements.reviewForm.querySelector('.star-rating');
        if (starRating) {
            const stars = starRating.querySelectorAll('i');
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    selectedRating = parseInt(star.dataset.rating);
                    stars.forEach((s, index) => {
                        s.classList.toggle('active', index < selectedRating);
                        s.setAttribute('aria-checked', (index < selectedRating).toString());
                    });
                });
                star.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === 'Space') {
                        star.click();
                    }
                });
            });
        }
    }

    await loadMainMovie();
    setupCategoryToggles();
    setupMoreButtons();
    loadSimilarMovies();
    loadUserReviews();

    async function fetchData(url, sectionId) {
        if (movieCache.has(url)) {
            return movieCache.get(url);
        }
        try {
            elements.loadingSpinner?.classList.add('active');
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}, URL: ${url}`);
            }
            const text = await response.text();
            if (!text) {
                throw new Error(`Empty response from ${url}`);
            }
            const data = JSON.parse(text);
            if (data.error) {
                throw new Error(data.error);
            }
            movieCache.set(url, data);
            return data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            showError(`Failed to load ${sectionId || 'content'}. Please try again later.`);
            return null;
        } finally {
            elements.loadingSpinner?.classList.remove('active');
        }
    }

    async function loadMainMovie() {
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('v');
        if (!movieId) {
            showError('No movie ID provided in the URL.');
            return;
        }
        const data = await fetchData(`/home/details/${movieId}`, 'movie-detail');
        if (data) {
            categories.forEach(category => {
                categoryStates[category].loadedMovieIds.add(data.watchUrl.split('v=')[1]);
            });
            updateMainMovie(data);
            updateDocumentMeta(data);
            if (elements.movieDetail) {
                elements.movieDetail.dataset.movieId = movieId;
                elements.movieDetail.dataset.movieTitle = data.title;
                elements.movieDetail.style.setProperty('--background-image', `url(${data.posterUrl})`);
            }
        }
    }

    function updateMainMovie(movie) {
        if (elements.movieTitle) elements.movieTitle.textContent = movie.title;
        if (elements.moviePoster) {
            elements.moviePoster.src = movie.posterUrl || 'https://via.placeholder.com/1280x720';
            elements.moviePoster.alt = `${movie.title} poster`;
        }
        if (elements.movieDescription) elements.movieDescription.textContent = movie.description || 'No description available.';
        if (elements.movieRating) elements.movieRating.textContent = movie.avgRating !== 'N/A' ? movie.avgRating : (movie.rating !== 'N/A' ? movie.rating : 'PG 13');
        if (elements.movieQuality) elements.movieQuality.textContent = movie.quality || 'HD';
        if (elements.movieYear) elements.movieYear.textContent = movie.release_year !== 'N/A' ? movie.release_year : 'Unknown';
        if (elements.movieDuration) elements.movieDuration.textContent = formatDuration(movie.duration);
        if (elements.downloadBtn) {
            elements.downloadBtn.setAttribute('href', '#');
            elements.downloadBtn.setAttribute('data-poster-url', movie.posterUrl || '');
        }
        if (elements.movieGenres) {
            elements.movieGenres.innerHTML = '';
            const genres = movie.genre ? movie.genre.split(',').map(g => g.trim()) : ['Unknown'];
            genres.forEach((genre, index) => {
                const link = document.createElement('a');
                link.href = `#${genre.toLowerCase()}`;
                link.textContent = genre;
                link.setAttribute('aria-label', `View ${genre} movies`);
                elements.movieGenres.appendChild(link);
                if (index < genres.length - 1) elements.movieGenres.appendChild(document.createTextNode(', '));
            });
        }
    }

    function updateDocumentMeta(movie) {
        document.title = `${movie.title} (${movie.release_year || 'Unknown'}) | Nexfix`;
        const metaTags = [
            { name: 'description', content: movie.description || 'Watch this movie on Nexfix' },
            { property: 'og:title', content: `${movie.title} | Nexfix` },
            { property: 'og:description', content: movie.description || 'Watch this movie on Nexfix' },
            { property: 'og:image', content: movie.posterUrl || 'https://via.placeholder.com/1280x720' },
            { property: 'og:url', content: window.location.href },
            { name: 'twitter:card', content: 'summary_large_image' }
        ];
        metaTags.forEach(tag => {
            let element = document.querySelector(`meta[${tag.name ? 'name' : 'property'}="${tag.name || tag.property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(tag.name ? 'name' : 'property', tag.name || tag.property);
                document.head.appendChild(element);
            }
            element.setAttribute('content', tag.content);
        });
    }

    async function loadSimilarMovies() {
        const movieId = elements.movieDetail?.dataset.movieId;
        if (!movieId) {
            showError('No movie ID for similar movies');
            return;
        }
        const data = await fetchData(`/home/details/${movieId}/similar`, 'similar-movies');
        if (data && Array.isArray(data) && data.length > 0 && elements.similarMovies) {
            elements.similarMovies.innerHTML = data.slice(0, 6).map(movie => `
                <div class="movie-card-enhanced" role="listitem">
                    <a href="${movie.watchUrl}" class="movie-link" aria-label="View ${movie.title}">
                        <figure class="card-banner">
                            <img src="${movie.posterUrl}" alt="${movie.title} poster">
                            <div class="poster-overlay">
                                <h3 class="poster-title">${movie.title}</h3>
                                <div class="poster-meta">
                                    <span><ion-icon name="star"></ion-icon>${movie.avgRating || movie.rating || 'N/A'}</span>
                                    <span><ion-icon name="time"></ion-icon>${formatDuration(movie.duration)}</span>
                                </div>
                            </div>
                            <div class="card-overlay">
                                <div class="badge-overlay">
                                    <span class="badge badge-fill">${movie.avgRating || movie.rating || 'N/A'}</span>
                                    <span class="badge badge-outline">${movie.quality || 'HD'}</span>
                                </div>
                                <button class="quick-view" aria-label="Quick view ${movie.title}">
                                    <i class='bx bx-play-circle'></i>
                                    <span>Quick View</span>
                                </button>
                            </div>
                        </figure>
                    </a>
                    <button class="btn-wishlist-sm" aria-label="Add ${movie.title} to watchlist">
                        <i class='bx bx-bookmark-plus'></i>
                    </button>
                </div>
            `).join('');
            elements.similarMovies.querySelectorAll('.quick-view').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const movieId = button.closest('.movie-card-enhanced').querySelector('a').href.split('v=')[1];
                    fetchData(`/home/details/${movieId}`, 'similar-movies').then(movie => showQuickView(movie));
                });
            });
            elements.similarMovies.querySelectorAll('.btn-wishlist-sm').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const movieId = button.closest('.movie-card-enhanced').querySelector('a').href.split('v=')[1];
                    toggleMovieWatchlist(movieId, button);
                });
            });
        } else if (elements.similarMovies) {
            elements.similarMovies.innerHTML = `
                <div class="no-similar">
                    <p>No similar movies found.</p>
                </div>
            `;
        }
    }

    async function loadUserReviews() {
        const movieId = elements.movieDetail?.dataset.movieId;
        if (!movieId) {
            showError('No movie ID for reviews');
            return;
        }
        const data = await fetchData(`/home/reviews/${movieId}`, 'user-reviews');
        if (data && Array.isArray(data) && data.length > 0 && elements.userReviews) {
            elements.userReviews.innerHTML = data.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-avatar">
                            <img src="/assets/images/default-avatar.jpg" alt="${review.user_name}'s avatar">
                        </div>
                        <div class="reviewer-info">
                            <span class="reviewer-name">${review.user_name}</span>
                            <div class="review-rating">
                                ${renderStars(review.rating)}
                                <span class="review-date">${formatDate(review.review_date)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.review_text}</p>
                    </div>
                </div>
            `).join('');
        } else if (elements.userReviews) {
            elements.userReviews.innerHTML = `
                <div class="no-reviews">
                    <i class='bx bx-message-rounded-minus'></i>
                    <p>No reviews yet. Be the first to review!</p>
                </div>
            `;
        }
    }

    async function handleReviewSubmit(e) {
        e.preventDefault();
        if (selectedRating === 0) {
            showNotification('Please select a rating.');
            return;
        }
        const reviewText = elements.reviewForm.querySelector('textarea')?.value?.trim();
        const movieId = elements.movieDetail?.dataset.movieId;
        const movieTitle = elements.movieDetail?.dataset.movieTitle;
        if (!reviewText || !movieId || !movieTitle) {
            showNotification('Please provide a review and ensure movie details are loaded.');
            return;
        }
        try {
            elements.loadingSpinner?.classList.add('active');
            const response = await fetch('/home/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: movieId,
                    movie_title: movieTitle,
                    user_name: "Anonymous",
                    user_id: null,
                    rating: selectedRating,
                    review_text: reviewText
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit review');
            }
            showNotification(`Thank you for reviewing "${movieTitle}"!`);
            elements.reviewForm.reset();
            elements.reviewForm.querySelectorAll('.star-rating i').forEach(star => {
                star.classList.remove('active');
                star.setAttribute('aria-checked', 'false');
            });
            selectedRating = 0;
            await loadUserReviews();
        } catch (error) {
            showError(`Failed to submit review: ${error.message}`);
        } finally {
            elements.loadingSpinner?.classList.remove('active');
        }
    }

    async function showDownloadOptions() {
        const movieId = elements.movieDetail?.dataset.movieId;
        const movieTitle = elements.movieDetail?.dataset.movieTitle;

        if (!movieId || !movieTitle) {
            showError('Movie information is missing.');
            return;
        }

        let downloadOptions = [];
        try {
            elements.loadingSpinner?.classList.add('active');
            const data = await fetchData(`/home/downloads/${movieId}`, 'download-options');
            if (data && Array.isArray(data) && data.length > 0) {
                downloadOptions = data;
            } else {
                const posterUrl = elements.downloadBtn?.dataset.posterUrl;
                if (posterUrl) {
                    downloadOptions = [{ quality: 'Poster', url: posterUrl }];
                } else {
                    showNotification('No download options or poster available for this movie.');
                    return;
                }
            }
        } catch (error) {
            const posterUrl = elements.downloadBtn?.dataset.posterUrl;
            if (posterUrl) {
                downloadOptions = [{ quality: 'Poster', url: posterUrl }];
            } else {
                showError(`Failed to load download options: ${error.message}`);
                return;
            }
        } finally {
            elements.loadingSpinner?.classList.remove('active');
        }

        const popup = document.createElement('div');
        popup.className = 'download-popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-labelledby', 'download-popup-title');
        popup.innerHTML = `
            <div class="download-popup-content">
                <h2 id="download-popup-title" class="visually-hidden">Download Options</h2>
                <span class="download-popup-close" aria-label="Close download options" tabindex="0">×</span>
                <div class="download-buttons">
                    ${downloadOptions.map(option => `
                        <button class="download-quality-btn" data-url="${option.url}" aria-label="Download in ${option.quality} quality">
                            <i class='bx bx-download'></i>
                            <span>${option.quality}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        document.body.style.overflow = 'hidden';

        const closePopup = () => {
            popup.classList.add('fade-out');
            setTimeout(() => {
                popup.remove();
                document.body.style.overflow = 'auto';
            }, 300);
        };

        popup.querySelector('.download-popup-close').addEventListener('click', closePopup);
        popup.querySelector('.download-popup-close').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
                closePopup();
            }
        });
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closePopup();
            }
        });
        popup.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePopup();
            }
        });

        popup.querySelectorAll('.download-quality-btn').forEach(button => {
            button.addEventListener('click', () => {
                const url = button.dataset.url;
                window.location.href = url;
                closePopup();
            });
        });
    }

    async function showTrailer() {
        const detailEl = document.getElementById('movie-detail');
        const trailerModal = document.getElementById('trailer-modal');
        const iframe = document.getElementById('trailer-video');

        if (!detailEl || !trailerModal || !iframe) {
            showError('Movie details or trailer modal not loaded.');
            return;
        }

        const movieId = detailEl.dataset.movieId;
        const movieTitle = detailEl.dataset.movieTitle;

        if (!movieId || !movieTitle) {
            showError('Movie information is missing.');
            return;
        }

        async function attemptPlayTrailer(url) {
            let youtubeId = null;
            if (url) {
                const urlPatterns = [
                    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
                ];
                for (const pattern of urlPatterns) {
                    const match = url.match(pattern);
                    if (match) {
                        youtubeId = match[1];
                        break;
                    }
                }
            }

            if (!youtubeId) {
                showNotification('The provided trailer URL is invalid or not a YouTube link.');
                return false;
            }

            iframe.setAttribute('allow', 'autoplay; encrypted-media');
            iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;

            return new Promise((resolve) => {
                iframe.onload = () => {
                    trailerModal.style.display = 'block';
                    trailerModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    resolve(true);
                };
                iframe.onerror = () => {
                    showNotification('This video cannot be embedded. Please provide a different YouTube URL.');
                    iframe.src = '';
                    resolve(false);
                };
            });
        }

        try {
            elements.loadingSpinner?.classList.add('active');
            const response = await fetch(`/home/trailers/${movieId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch trailer: ${response.status}`);
            }

            const data = await response.json();
            let trailerUrl = data.trailer_url;

            if (!trailerUrl || !(await attemptPlayTrailer(trailerUrl))) {
                trailerUrl = await showTrailerPopup(movieTitle);

                if (trailerUrl) {
                    const saveResponse = await fetch('/home/trailers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            video_id: movieId,
                            movie_title: movieTitle,
                            trailer_url: trailerUrl,
                            trailer_source: "YouTube"
                        })
                    });

                    if (!saveResponse.ok) {
                        const errorData = await saveResponse.json();
                        throw new Error(errorData.detail || 'Failed to save trailer URL');
                    }

                    if (!(await attemptPlayTrailer(trailerUrl))) {
                        showNotification('The new trailer URL cannot be embedded. Please try another.');
                        return;
                    }
                } else {
                    showNotification('No trailer URL provided.');
                    return;
                }
            }
        } catch (error) {
            showError(`Failed to load trailer: ${error.message}`);
        } finally {
            elements.loadingSpinner?.classList.remove('active');
        }
    }

    function showTrailerPopup(movieTitle) {
        return new Promise((resolve) => {
            const popup = document.createElement('div');
            popup.className = 'trailer-popup';
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-labelledby', 'trailer-popup-title');
            popup.innerHTML = `
                <div class="trailer-popup-content">
                    <span class="trailer-popup-close" aria-label="Close trailer submission" tabindex="0">×</span>
                    <h2 id="trailer-popup-title">Contribute Trailer</h2>
                    <p>Please provide a valid YouTube trailer URL for "<strong>${movieTitle}</strong>" to enhance our collection.</p>
                    <form id="trailer-form" aria-label="Submit trailer URL">
                        <input type="url" id="trailer-url" placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)" required aria-label="YouTube trailer URL">
                        <button type="submit" class="btn btn-primary">Submit Trailer</button>
                    </form>
                </div>
            `;
            document.body.appendChild(popup);
            document.body.style.overflow = 'hidden';

            const closePopup = () => {
                popup.classList.add('fade-out');
                setTimeout(() => {
                    popup.remove();
                    document.body.style.overflow = 'auto';
                    resolve(null);
                }, 300);
            };

            popup.querySelector('.trailer-popup-close').addEventListener('click', closePopup);
            popup.querySelector('.trailer-popup-close').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Space') {
                    closePopup();
                }
            });
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    closePopup();
                }
            });
            popup.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closePopup();
                }
            });

            popup.querySelector('#trailer-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const url = popup.querySelector('#trailer-url').value.trim();
                if (url) {
                    popup.remove();
                    document.body.style.overflow = 'auto';
                    resolve(url);
                } else {
                    showNotification('Please enter a valid URL.');
                }
            });
        });
    }

    function formatDuration(minutes) {
        if (!minutes || minutes === 'N/A') return 'Unknown';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="bx bxs-star" aria-hidden="true"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<i class="bx bxs-star-half" aria-hidden="true"></i>';
            } else {
                stars += '<i class="bx bx-star" aria-hidden="true"></i>';
            }
        }
        return stars;
    }

    function closeModal() {
        if (elements.trailerModal) {
            const iframe = document.getElementById('trailer-video');
            if (iframe) iframe.src = '';
            elements.trailerModal.classList.add('fade-out');
            setTimeout(() => {
                elements.trailerModal.style.display = 'none';
                elements.trailerModal.classList.remove('active', 'fade-out');
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    function watchMovie() {
        const movieId = elements.movieDetail?.dataset.movieId;
        if (movieId) {
            window.location.href = `/watch?v=${movieId}`;
        }
    }

    function toggleMovieWatchlist(movieId, button) {
        const isInWatchlist = button.classList.toggle('active');
        button.innerHTML = `<i class='bx ${isInWatchlist ? 'bxs-bookmark' : 'bx-bookmark-plus'}'></i>`;
        button.setAttribute('aria-label', `${isInWatchlist ? 'Remove' : 'Add'} movie from watchlist`);
        showNotification(`Movie ${isInWatchlist ? 'added to' : 'removed from'} your watchlist`);
    }

    function shareMovie() {
        const movieId = elements.movieDetail?.dataset.movieId;
        const movieTitle = elements.movieDetail?.dataset.movieTitle;
        const shareUrl = `${window.location.origin}/watch?v=${movieId}`;
        if (navigator.share) {
            navigator.share({
                title: `Watch "${movieTitle}" on Nexfix`,
                text: `Check out "${movieTitle}" on Nexfix`,
                url: shareUrl
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare(shareUrl);
            });
        } else {
            fallbackShare(shareUrl);
        }
    }

    function fallbackShare(url) {
        const input = document.createElement('input');
        input.value = url;
        input.setAttribute('aria-hidden', 'true');
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotification('Link copied to clipboard!');
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function showError(message) {
    }

    function showQuickView(movie) {
        if (!movie) return;
        const quickViewModal = document.createElement('div');
        quickViewModal.className = 'quick-view-modal';
        quickViewModal.setAttribute('role', 'dialog');
        quickViewModal.setAttribute('aria-labelledby', 'quick-view-title');
        quickViewModal.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-poster" style="background-image: url(${movie.posterUrl})"></div>
                <div class="quick-view-details">
                    <span class="close-quick-view" aria-label="Close quick view" tabindex="0">×</span>
                    <h2 id="quick-view-title">${movie.title}</h2>
                    <div class="quick-view-meta">
                        <span>${movie.release_year || 'N/A'}</span>
                        <span>${movie.avgRating || movie.rating || 'N/A'}</span>
                        <span>${formatDuration(movie.duration)}</span>
                    </div>
                    <p class="quick-view-description">${movie.description || 'No description available.'}</p>
                    <div class="quick-view-actions">
                        <button class="btn btn-primary" aria-label="Watch ${movie.title}">
                            <ion-icon name="play"></ion-icon>
                            <span>Watch Now</span>
                        </button>
                        <button class="btn btn-secondary btn-watchlist" aria-label="Add ${movie.title} to watchlist">
                            <i class='bx bx-bookmark-plus'></i>
                            <span>Add to Watchlist</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(quickViewModal);
        quickViewModal.querySelector('.close-quick-view').addEventListener('click', closeQuickView);
        quickViewModal.querySelector('.close-quick-view').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
                closeQuickView();
            }
        });
        quickViewModal.querySelector('.btn-primary').addEventListener('click', () => {
            window.location.href = movie.watchUrl;
        });
        quickViewModal.querySelector('.btn-watchlist').addEventListener('click', () => {
            toggleMovieWatchlist(movie.watchUrl.split('v=')[1], quickViewModal.querySelector('.btn-watchlist'));
            quickViewModal.querySelector('.btn-watchlist').innerHTML = `
                <i class='bx bxs-bookmark'></i>
                <span>In Watchlist</span>
            `;
            quickViewModal.querySelector('.btn-watchlist').setAttribute('aria-label', 'Remove movie from watchlist');
        });
        quickViewModal.addEventListener('click', (e) => {
            if (e.target === quickViewModal) {
                closeQuickView();
            }
        });
        quickViewModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeQuickView();
            }
        });
        document.body.style.overflow = 'hidden';

        function closeQuickView() {
            quickViewModal.classList.add('fade-out');
            setTimeout(() => {
                quickViewModal.remove();
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    function setupCategoryToggles() {
        categories.forEach(category => {
            const sectionTitle = document.querySelector(`#category-${category.replace(/\s+/g, '-')} .section-title`);
            if (sectionTitle) {
                sectionTitle.addEventListener('click', () => {
                    const moviesList = document.getElementById(`movies-${category.replace(/\s+/g, '-')}`);
                    if (moviesList) {
                        const isActive = moviesList.classList.contains('active');
                        moviesList.classList.toggle('active');
                        sectionTitle.classList.toggle('active');
                        const icon = sectionTitle.querySelector('i');
                        if (icon) {
                            icon.classList.toggle('bx-chevron-down');
                            icon.classList.toggle('bx-chevron-up');
                        }
                        sectionTitle.setAttribute('aria-expanded', (!isActive).toString());
                        if (!isActive && !moviesList.children.length) {
                            loadCategoryMovies(category, true);
                        }
                    }
                });
                sectionTitle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function setupMoreButtons() {
        categories.forEach(category => {
            const moreBtn = document.getElementById(`more-${category.replace(/\s+/g, '-')}`);
            if (moreBtn) {
                moreBtn.addEventListener('click', () => {
                    loadCategoryMovies(category);
                });
            }
        });
    }

    async function loadCategoryMovies(category, initial = false) {
        const state = categoryStates[category];
        if (state.isLoading || !state.hasMore) return;
        state.isLoading = true;
        const limit = initial ? state.initialLimit : state.scrollLimit;
        const sectionId = `category-${category.replace(/\s+/g, '-')}`;
        const moreBtn = document.getElementById(`more-${category.replace(/\s+/g, '-')}`);
        if (moreBtn) {
            moreBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Loading...';
            moreBtn.setAttribute('aria-busy', 'true');
        }
        const url = category === 'hero'
            ? `/home/details?limit=${limit}&offset=${state.offset}`
            : `/home/details?category=${encodeURIComponent(category)}&limit=${limit}&offset=${state.offset}`;
        const data = await fetchData(url, sectionId);
        if (data) {
            if (!data.length) {
                state.hasMore = false;
                if (moreBtn) {
                    moreBtn.textContent = 'No more movies';
                    moreBtn.disabled = true;
                    moreBtn.setAttribute('aria-disabled', 'true');
                }
            } else {
                populateMovieItems(`#movies-${category.replace(/\s+/g, '-')}`, data, `${category.replace(/\s+/g, '-')}-section`);
                state.offset += data.length;
            }
        }
        state.isLoading = false;
        if (moreBtn && state.hasMore) {
            moreBtn.innerHTML = 'More <i class="bx bx-chevron-down"></i>';
            moreBtn.setAttribute('aria-busy', 'false');
        }
    }

    function populateMovieItems(selector, data, sectionId) {
        const moviesList = document.querySelector(selector);
        if (!moviesList) {
            showError(`Section ${sectionId} not found`);
            return;
        }
        const category = sectionId.replace('category-', '').replace('-section', '');
        const state = categoryStates[category];
        if (!state) {
            showError(`Category state not found for ${category}`);
            return;
        }
        let added = 0;
        (Array.isArray(data) ? data : [data]).forEach(movie => {
            if (movie && !state.loadedMovieIds.has(movie.watchUrl.split('v=')[1])) {
                state.loadedMovieIds.add(movie.watchUrl.split('v=')[1]);
                const li = document.createElement('li');
                li.className = 'movie-card-enhanced';
                li.setAttribute('role', 'listitem');
                li.innerHTML = `
                    <a href="${movie.watchUrl}" class="movie-link" aria-label="View ${movie.title}">
                        <figure class="card-banner">
                            <img src="${movie.posterUrl}" alt="${movie.title} poster" class="img-cover">
                            <div class="poster-overlay">
                                <h3 class="poster-title">${movie.title}</h3>
                                <div class="poster-meta">
                                    <span><ion-icon name="star"></ion-icon>${movie.avgRating || movie.rating || 'N/A'}</span>
                                    <span><ion-icon name="time"></ion-icon>${formatDuration(movie.duration)}</span>
                                </div>
                            </div>
                            <div class="card-overlay">
                                <div class="badge-overlay">
                                    <span class="badge badge-fill">${movie.avgRating || movie.rating || 'N/A'}</span>
                                    <span class="badge badge-outline">${movie.quality || 'HD'}</span>
                                </div>
                                <button class="quick-view" aria-label="Quick view ${movie.title}">
                                    <i class='bx bx-play-circle'></i>
                                    <span>Quick View</span>
                                </button>
                            </div>
                        </figure>
                    </a>
                    <button class="btn-wishlist-sm" aria-label="Add ${movie.title} to watchlist">
                        <i class='bx bx-bookmark-plus'></i>
                    </button>
                `;
                li.querySelector('.quick-view').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const movieId = li.querySelector('a').href.split('v=')[1];
                    fetchData(`/home/details/${movieId}`, sectionId).then(movie => showQuickView(movie));
                });
                li.querySelector('.btn-wishlist-sm').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const movieId = li.querySelector('a').href.split('v=')[1];
                    toggleMovieWatchlist(movieId, li.querySelector('.btn-wishlist-sm'));
                });
                moviesList.appendChild(li);
                added++;
            }
        });
        if (added > 0) {
            const moreBtn = document.getElementById(`more-${category.replace(/\s+/g, '-')}`);
            if (moreBtn) moreBtn.style.display = 'block';
        }
    }
});