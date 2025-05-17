$(document).ready(function() {
    // Initialize Owl Carousel for a given selector with provided options
    function initCarousel(selector, options) {
        try {
            const $carousel = $(selector);
            if ($carousel.length === 0) {
                console.warn(`Carousel element ${selector} not found`);
                return;
            }
            // Destroy existing carousel to prevent conflicts
            $carousel.owlCarousel('destroy');
            $carousel.owlCarousel(options);
            $carousel.trigger('refresh.owl.carousel');
            // Log visibility state
            const computedStyle = window.getComputedStyle($carousel[0]);
            console.log(`${selector} visibility:`, {
                display: computedStyle.display,
                opacity: computedStyle.opacity,
                visibility: computedStyle.visibility,
                width: computedStyle.width,
                height: computedStyle.height
            });
        } catch (error) {
            console.error(`Error initializing carousel ${selector}:`, error);
        }
    }

    // Fetch data from the backend API
    async function fetchData(url, sectionId) {
        try {
            console.log(`Fetching data from: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}, URL: ${url}`);
            }
            const text = await response.text();
            if (!text) {
                throw new Error(`Empty response from ${url}`);
            }
            const data = JSON.parse(text);
            if (!Array.isArray(data)) {
                console.warn(`Expected array, got:`, data, `from ${url}`);
                if (sectionId) {
                    $(`#${sectionId}`).html(`
                        <div class="section-error" role="alert">Failed to load content. Please try again later.</div>
                    `);
                }
                return [];
            }
            console.log(`Fetched ${data.length} items from ${url}`);
            return data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            if (sectionId) {
                $(`#${sectionId}`).html(`
                    <div class="section-error" role="alert">Failed to load content. Please try again later.</div>
                `);
            }
            return [];
        }
    }

    // Populate the hero slide carousel
    function populateHeroSlide(data) {
        const carousel = $('#hero-carousel');
        carousel.empty();
        // Force visibility on parent elements
        carousel.css({
            'display': 'block !important',
            'opacity': '1 !important',
            'visibility': 'visible !important',
            'height': 'auto !important',
            'width': '100% !important'
        });
        $('.hero-slide, .hero-section').css({
            'display': 'block !important',
            'opacity': '1 !important',
            'visibility': 'visible !important',
            'height': 'auto !important'
        });
        console.log('populateHeroSlide received data:', data);

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('No valid movie data received for hero carousel');
            carousel.append(`
                <div class="hero-slide-item" style="display: block !important; opacity: 1 !important; visibility: visible !important;">
                    <img src="https://via.placeholder.com/1280x720?text=No+Movies" alt="No movies available">
                    <div class="overlay"></div>
                    <div class="hero-slide-item-content">
                        <div class="item-content-wraper">
                            <h3 class="item-content-title top-down">No Movies Found</h3>
                            <p class="item-content-description top-down delay-4">Please check your connection or try again later.</p>
                        </div>
                    </div>
                </div>
            `);
        } else {
            data.forEach((movie, index) => {
                console.log(`Movie ${index + 1}:`, movie);
            });

            const validMovies = data.filter(movie => {
                if (!movie || typeof movie !== 'object' || !movie.title) {
                    console.warn('Invalid movie object skipped:', movie);
                    return false;
                }
                return true;
            });

            console.log('Valid movies after filtering:', validMovies);

            if (validMovies.length === 0) {
                console.warn('No valid movies after filtering');
                carousel.append(`
                    <div class="hero-slide-item" style="display: block !important; opacity: 1 !important; visibility: visible !important;">
                        <img src="https://via.placeholder.com/1280x720?text=Invalid+Data" alt="Invalid movie data">
                        <div class="overlay"></div>
                        <div class="hero-slide-item-content">
                            <div class="item-content-wraper">
                                <h3 class="item-content-title top-down">Invalid Movie Data</h3>
                                <p class="item-content-description top-down delay-4">Movies lack required fields: ${JSON.stringify(data.slice(0, 2))}</p>
                            </div>
                        </div>
                    </div>
                `);
            } else {
                validMovies.forEach((movie, index) => {
                    console.log(`Appending movie ${index + 1}:`, movie.title);
                    const slideItem = `
                        <div class="hero-slide-item" data-movie='${encodeURIComponent(JSON.stringify(movie))}' style="display: block !important; opacity: 1 !important; visibility: visible !important;">
                            <img src="${movie.posterUrl || 'https://via.placeholder.com/1280x720?text=No+Image'}" alt="${movie.title}">
                            <div class="overlay"></div>
                            <div class="hero-slide-item-content">
                                <div class="item-content-wraper">
                                    <h3 class="item-content-title top-down">${movie.title}</h3>
                                    <div class="movie-infos top-down delay-2">
                                        <div class="movie-info"><i class="bx bxs-star"></i><span>${movie.rating || 'N/A'}</span></div>
                                        <div class="movie-info"><i class="bx bxs-video"></i><span>${movie.quality || 'Unknown'}</span></div>
                                        <div class="movie-info"><i class="bx bxs-category"></i><span>${movie.category || 'Unknown'}</span></div>
                                        <div class="movie-info"><i class="bx bxs-calendar"></i><span>${movie.release_year || 'N/A'}</span></div>
                                        <div class="movie-info"><i class="bx bxs-time"></i><span>${movie.duration || 'N/A'}</span></div>
                                    </div>
                                    <p class="item-content-description top-down delay-4">${movie.description || 'No description available.'}</p>
                                    <div class="item-action top-down delay-6">
                                        <a href="#" class="btn btn-hover" aria-label="Watch ${movie.title} now"><i class="bx bxs-right-arrow"></i><span>Watch now</span></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    carousel.append(slideItem);
                });
            }
        }

        // Initialize carousel with retry mechanism
        try {
            setTimeout(() => {
                initCarousel('#hero-carousel', {
                    items: 1,
                    loop: true,
                    nav: true,
                    dots: true,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    smartSpeed: 1000,
                    autoHeight: true,
                    navText: ['<i class="bx bx-chevron-left" aria-hidden="true"></i>', '<i class="bx bx-chevron-right" aria-hidden="true"></i>']
                });
                console.log('Hero carousel initialized successfully');
                // Multiple refresh attempts
                carousel.trigger('refresh.owl.carousel');
                setTimeout(() => {
                    carousel.trigger('refresh.owl.carousel');
                    console.log('Hero carousel refreshed after 100ms');
                    // Log DOM contents
                    console.log('Hero carousel DOM after refresh:', carousel.html());
                }, 100);
                setTimeout(() => {
                    carousel.trigger('refresh.owl.carousel');
                    console.log('Hero carousel refreshed after 500ms');
                    // Check visibility again
                    const computedStyle = window.getComputedStyle(carousel[0]);
                    console.log('Hero carousel final visibility:', {
                        display: computedStyle.display,
                        opacity: computedStyle.opacity,
                        visibility: computedStyle.visibility,
                        width: computedStyle.width,
                        height: computedStyle.height
                    });
                    // Fallback if carousel is hidden
                    if (computedStyle.display === 'none' || computedStyle.opacity === '0' || computedStyle.visibility === 'hidden') {
                        console.warn('Carousel hidden, appending fallback slide');
                        $('.hero-slide').append(`
                            <div class="hero-slide-fallback" style="display: block !important; opacity: 1 !important; visibility: visible !important; position: relative !important;">
                                <img src="${validMovies[0]?.posterUrl || 'https://via.placeholder.com/1280x720?text=Fallback'}" alt="${validMovies[0]?.title || 'Fallback Movie'}">
                                <div class="overlay"></div>
                                <div class="hero-slide-item-content">
                                    <div class="item-content-wraper">
                                        <h3 class="item-content-title top-down">${validMovies[0]?.title || 'Fallback Movie'}</h3>
                                        <p class="item-content-description top-down delay-4">Carousel hidden. Showing fallback content.</p>
                                    </div>
                                </div>
                            </div>
                        `);
                    }
                }, 500);
            }, 0); // Run in next event loop to avoid conflicts
        } catch (error) {
            console.error('Failed to initialize hero carousel:', error);
            carousel.append(`
                <div class="hero-slide-item" style="display: block !important; opacity: 1 !important; visibility: visible !important;">
                    <img src="https://via.placeholder.com/1280x720?text=Carousel+Error" alt="Carousel error">
                    <div class="overlay"></div>
                    <div class="hero-slide-item-content">
                        <div class="item-content-wraper">
                            <h3 class="item-content-title top-down">Carousel Error</h3>
                            <p class="item-content-description top-down delay-4">Unable to load carousel. Please try again later.</p>
                        </div>
                    </div>
                </div>
            `);
        }
    }

    // Populate movie items for carousels
    function populateMovieItems(selector, data, sectionId) {
        const carousel = $(selector);
        const section = sectionId === 'hero-section' ? $('.hero-section') : $(`#${sectionId}`);
        carousel.empty();
        if (!data || data.length === 0) {
            section.remove();
            return;
        }
        data.forEach(movie => {
            const movieItem = `
                <a href="#" class="movie-item" data-movie='${encodeURIComponent(JSON.stringify(movie))}' aria-label="View details for ${movie.title || 'movie'}">
                    <img src="${movie.posterUrl || 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.title || 'Movie poster'}">
                    <div class="movie-item-content">
                        <h3 class="movie-item-title">${movie.title || 'Unknown Title'}</h3>
                        <div class="movie-infos">
                            <div class="movie-info"><i class="bx bxs-star"></i><span>${movie.rating || 'N/A'}</span></div>
                            <div class="movie-info"><i class="bx bxs-video"></i><span>${movie.quality || 'Unknown'}</span></div>
                            <div class="movie-info"><i class="bx bxs-category"></i><span>${movie.category || 'Unknown'}</span></div>
                            <div class="movie-info"><i class="bx bxs-time"></i><span>${movie.duration || 'N/A'}</span></div>
                        </div>
                    </div>
                </a>
            `;
            carousel.append(movieItem);
        });
        initCarousel(selector, {
            items: 4,
            loop: true,
            nav: true,
            dots: true,
            responsive: {
                0: { items: 1 },
                600: { items: 2 },
                1000: { items: 4 }
            },
            navText: ['<i class="bx bx-chevron-left" aria-hidden="true"></i>', '<i class="bx bx-chevron-right" aria-hidden="true"></i>']
        });
    }

    // Populate special movie section
    function populateSpecialMovie(data) {
        const specialMovie = $('#special-movie');
        const section = $('#special-movie-section');
        if (!data || data.length === 0) {
            section.remove();
            return;
        }
        const movie = data[0];
        specialMovie.empty();
        const specialItem = `
            <img src="${movie.posterUrl || 'https://via.placeholder.com/1280x720?text=No+Image'}" alt="${movie.title || 'Special movie poster'}">
            <div class="overlay"></div>
            <div class="hero-slide-item-content" data-movie='${encodeURIComponent(JSON.stringify(movie))}'>
                <div class="item-content-wraper">
                    <h3 class="item-content-title">${movie.title || 'Unknown Title'}</h3>
                    <div class="movie-infos">
                        <div class="movie-info"><i class="bx bxs-star"></i><span>${movie.rating || 'N/A'}</span></div>
                        <div class="movie-info"><i class="bx bxs-video"></i><span>${movie.quality || 'Unknown'}</span></div>
                        <div class="movie-info"><i class="bx bxs-category"></i><span>${movie.category || 'Unknown'}</span></div>
                        <div class="movie-info"><i class="bx bxs-calendar"></i><span>${movie.release_year || 'N/A'}</span></div>
                        <div class="movie-info"><i class="bx bxs-time"></i><span>${movie.duration || 'N/A'}</span></div>
                    </div>
                    <p class="item-content-description">${movie.description || 'No description available.'}</p>
                    <div class="item-action">
                        <a href="#" class="btn btn-hover" aria-label="Watch ${movie.title || 'special movie'} now"><i class="bx bxs-right-arrow"></i><span>Watch now</span></a>
                    </div>
                </div>
            </div>
        `;
        specialMovie.append(specialItem);
    }

    // Populate search popup with results
    function populateSearchPopup(data) {
        const popup = $('#search-popup');
        popup.removeClass('loading').empty();
        if (!data || !Array.isArray(data) || data.length === 0) {
            popup.append(`
                <div class="search-result no-results" role="alert">
                    <div class="search-result-info">
                        <div class="search-result-title">No results found</div>
                        <p class="search-result-details">Try a different search term</p>
                    </div>
                </div>
            `);
            popup.addClass('active');
            $('#search-backdrop').addClass('active');
            return;
        }
        data.forEach((movie, index) => {
            if (!movie || !movie.title) {
                console.warn(`Invalid movie data at index ${index}:`, movie);
                return;
            }
            const resultItem = `
                <div class="search-result" data-movie='${encodeURIComponent(JSON.stringify(movie))}' style="animation-delay: ${index * 0.1}s" role="button" tabindex="0" aria-label="View details for ${movie.title}">
                    <img src="${movie.posterUrl || 'https://via.placeholder.com/50x75?text=No+Image'}" alt="${movie.title || 'Movie poster'}">
                    <div class="search-result-info">
                        <div class="search-result-title">${movie.title || 'Unknown Title'}</div>
                        <div class="search-result-details">
                            <span><i class="bx bxs-category"></i>${movie.category || 'Unknown'}</span>
                            <span><i class="bx bxs-calendar"></i>${movie.release_year || 'N/A'}</span>
                            <span><i class="bx bxs-time"></i>${movie.duration || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            `;
            popup.append(resultItem);
        });
        popup.addClass('active');
        $('#search-backdrop').addClass('active');

        // Attach click handler for search results
        $('.search-result:not(.no-results)').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const $element = $(this);
            $element.addClass('clicked');
            setTimeout(() => $element.removeClass('clicked'), 400);
            let movieData;
            try {
                movieData = JSON.parse(decodeURIComponent($element.attr('data-movie')));
                console.log('Search result clicked:', movieData);
            } catch (error) {
                console.error('Error parsing movie data:', error, 'Raw data:', $element.attr('data-movie'));
                return;
            }
            if (movieData && movieData.title) {
                showMovieModal(movieData);
                $('#search-popup').removeClass('active').empty();
                $('#search-backdrop').removeClass('active');
                $('.search-bar').removeClass('active');
            } else {
                console.error('Invalid movie data:', movieData);
            }
        });

        // Keyboard navigation for search results
        $('.search-result:not(.no-results)').on('keypress', function(e) {
            if (e.which === 13 || e.which === 32) {
                $(this).trigger('click');
            }
        });
    }

    // Check if movie is in watchlist
    function isInWatchlist(movieId) {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        return watchlist.some(item => item.id === movieId);
    }

    // Toggle movie in watchlist
    function toggleWatchlist(movie) {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const movieId = movie.id || movie.title;
        const index = watchlist.findIndex(item => item.id === movieId);
        if (index === -1) {
            watchlist.push({ id: movieId, title: movie.title, posterUrl: movie.posterUrl });
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            return true;
        } else {
            watchlist.splice(index, 1);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            return false;
        }
    }

    // Show movie modal with details
    function showMovieModal(movie) {
        const rating = parseFloat(movie.rating) || 0;
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2 >= 1 ? 1 : 0;
        let starHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starHtml += '<i class="bx bxs-star star filled"></i>';
            } else if (i === fullStars && halfStar) {
                starHtml += '<i class="bx bxs-star-half star filled"></i>';
            } else {
                starHtml += '<i class="bx bxs-star star"></i>';
            }
        }
        const isAdded = isInWatchlist(movie.id || movie.title);
        const modal = $('#movie-modal');
        modal.html(`
            <div class="modal-content">
                <button class="modal-close" aria-label="Close modal"><i class="bx bx-x"></i></button>
                <div class="modal-header">
                    <img src="${movie.posterUrl || 'https://via.placeholder.com/220x330?text=No+Image'}" alt="${movie.title || 'Movie poster'}">
                </div>
                <div class="modal-details">
                    <h2 class="modal-title">${movie.title || 'Unknown Title'}</h2>
                    <div class="modal-rating">${starHtml} <span>${movie.rating || 'N/A'}</span></div>
                    <div class="modal-info">
                        <span><i class="bx bxs-video"></i>${movie.quality || 'Unknown'}</span>
                        <span><i class="bx bxs-category"></i>${movie.category || 'Unknown'}</span>
                        <span><i class="bx bxs-calendar"></i>${movie.release_year || 'N/A'}</span>
                        <span><i class="bx bxs-time"></i>${movie.duration || 'N/A'}</span>
                        <span><i class="bx bxs-film"></i>${movie.genre || 'N/A'}</span>
                        <span><i class="bx bxs-user"></i>${movie.director || 'N/A'}</span>
                        <span><i class="bx bxs-group"></i>${movie.cast || 'N/A'}</span>
                    </div>
                    <p class="modal-description">${movie.description || 'No description available.'}</p>
                    <div class="modal-actions">
                        <a href="${movie.watchUrl || '#'}" class="btn watch-now" data-action="watch"><i class="bx bx-play"></i>Watch Now</a>
                        <a href="#" class="btn add-to-list ${isAdded ? 'added' : ''}" data-action="add-to-list"><i class="bx ${isAdded ? 'bx-bookmark' : 'bx-bookmark-plus'}"></i>${isAdded ? 'Remove from List' : 'Add to List'}</a>
                        <a href="#" class="btn share" data-action="share"><i class="bx bx-share-alt"></i>Share</a>
                    </div>
                </div>
            </div>
        `);
        modal.attr('aria-hidden', 'false').addClass('active');
        $('#search-backdrop').addClass('active');
        $('body').addClass('no-scroll');
        $('.modal-close').focus();
        trapFocus(modal);
    
        // Handle modal close button click
        modal.find('.modal-close').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Modal close button clicked');
            modal.removeClass('active').attr('aria-hidden', 'true');
            $('#search-backdrop').removeClass('active');
            $('body').removeClass('no-scroll');
            $('#search-input').focus();
        });
    
        // Handle button clicks
        modal.find('.btn').on('click', function(e) {
            e.preventDefault();
            const action = $(this).data('action');
            if (action === 'watch') {
                // Redirect to watchUrl
                if (movie.watchUrl) {
                    window.open(movie.watchUrl, '_blank');
                } else {
                    console.warn('No watchUrl provided for movie:', movie.title);
                    alert('Watch URL not available for this movie.');
                }
            } else if (action === 'add-to-list') {
                const isAdded = toggleWatchlist(movie);
                $(this).toggleClass('added', isAdded);
                $(this).html(`<i class="bx ${isAdded ? 'bx-bookmark' : 'bx-bookmark-plus'}"></i>${isAdded ? 'Remove from List' : 'Add to List'}`);
            } else if (action === 'share') {
                const shareData = {
                    title: movie.title || 'Movie',
                    text: movie.description || 'Check out this movie!',
                    url: movie.watchUrl || window.location.href
                };
                if (navigator.share && navigator.canShare(shareData)) {
                    navigator.share(shareData).catch(err => console.error('Share error:', err));
                } else {
                    navigator.clipboard.writeText(shareData.url).then(() => {
                        alert('Link copied to clipboard!');
                    }).catch(err => console.error('Clipboard error:', err));
                }
            }
        });
    }

    // Trap focus in modal for accessibility
    function trapFocus(modal) {
        const focusableElements = modal.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements.first();
        const lastFocusable = focusableElements.last();

        modal.on('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstFocusable[0]) {
                    e.preventDefault();
                    lastFocusable.focus();
                } else if (!e.shiftKey && document.activeElement === lastFocusable[0]) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
            if (e.key === 'Escape') {
                modal.find('.modal-close').trigger('click');
            }
        });
    }

    // Populate Trending Now (Grid)
    function populateTrendingMovies(data) {
        const grid = $('#trending-movies');
        grid.empty();
        if (!data || data.length === 0) {
            $('#trending-section').remove();
            return;
        }
        data.slice(0, 8).forEach(movie => {
            const movieItem = `
                <div class="movie-grid-item" data-movie='${encodeURIComponent(JSON.stringify(movie))}' aria-label="View details for ${movie.title || 'movie'}">
                    <img src="${movie.posterUrl || 'https://via.placeholder.com/250x375?text=No+Image'}" alt="${movie.title || 'Movie poster'}">
                    <div class="movie-grid-content">
                        <h3 class="movie-grid-title">${movie.title || 'Unknown Title'}</h3>
                        <div class="movie-grid-rating"><i class="bx bxs-star"></i>${movie.rating || 'N/A'}</div>
                    </div>
                    <i class="bx bx-play movie-grid-play"></i>
                </div>
            `;
            grid.append(movieItem);
        });
    }

    // Populate New Releases (Horizontal Scroll)
    function populateNewReleases(data) {
        const scroll = $('#new-releases-movies');
        scroll.empty();
        if (!data || data.length === 0) {
            $('#new-releases-section').remove();
            return;
        }
        data.forEach(movie => {
            const movieItem = `
                <div class="movie-scroll-item" data-movie='${encodeURIComponent(JSON.stringify(movie))}' aria-label="View details for ${movie.title || 'movie'}">
                    <div class="movie-scroll-category">${movie.category || 'Unknown'}</div>
                    <img src="${movie.posterUrl || 'https://via.placeholder.com/150x225?text=No+Image'}" alt="${movie.title || 'Movie poster'}">
                    <div class="movie-scroll-content">
                        <h3 class="movie-scroll-title">${movie.title || 'Unknown Title'}</h3>
                        <div class="movie-scroll-year">${movie.release_year || 'N/A'}</div>
                    </div>
                </div>
            `;
            scroll.append(movieItem);
        });
    }

    // Populate Coming Soon (Vertical Stack)
    function populateComingSoon(data) {
        const stack = $('#coming-soon-movies');
        stack.empty();
        if (!data || data.length === 0) {
            $('#coming-soon-section').remove();
            return;
        }
        data.forEach(movie => {
            const isNotified = isNotifiedForMovie(movie.id || movie.title);
            const movieItem = `
                <div class="movie-stack-item" data-movie='${encodeURIComponent(JSON.stringify(movie))}' aria-label="View details for ${movie.title || 'movie'}">
                    <img src="${movie.bannerUrl || movie.posterUrl || 'https://via.placeholder.com/600x200?text=No+Image'}" alt="${movie.title || 'Movie banner'}">
                    <div class="movie-stack-overlay">
                        <h3 class="movie-stack-title">${movie.title || 'Unknown Title'}</h3>
                        <p class="movie-stack-description">${movie.description || 'No description available.'}</p>
                        <div class="movie-stack-release">Releasing: ${movie.release_date || 'TBA'}</div>
                        <button class="movie-stack-notify ${isNotified ? 'notified' : ''}" data-movie-id="${movie.id || movie.title}">
                            ${isNotified ? 'Notified' : 'Notify Me'}
                        </button>
                    </div>
                </div>
            `;
            stack.append(movieItem);
        });

        // Handle Notify Me button clicks
        $('.movie-stack-notify').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const movieId = $(this).data('movie-id');
            const isNotified = toggleNotification(movieId);
            $(this).toggleClass('notified', isNotified);
            $(this).text(isNotified ? 'Notified' : 'Notify Me');
        });
    }

    // Check if notification is set for a movie
    function isNotifiedForMovie(movieId) {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        return notifications.includes(movieId);
    }

    // Toggle notification for a movie
    function toggleNotification(movieId) {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        if (notifications.includes(movieId)) {
            notifications.splice(notifications.indexOf(movieId), 1);
            localStorage.setItem('notifications', JSON.stringify(notifications));
            return false;
        } else {
            notifications.push(movieId);
            localStorage.setItem('notifications', JSON.stringify(notifications));
            return true;
        }
    }

    // Search bar activation
    $('#search-input').on('focus', function() {
        $('.search-bar').addClass('active');
        $('#search-backdrop').addClass('active');
    });

    // Real-time search with debounce
    let searchTimeout;
    $('#search-input').on('input', function() {
        $('.search-bar').addClass('active');
        clearTimeout(searchTimeout);
        const query = $(this).val().trim();
        if (query.length < 2) {
            $('#search-popup').empty().removeClass('active loading');
            $('#search-backdrop').removeClass('active');
            $('.search-bar').removeClass('active');
            return;
        }
        $('#search-popup').addClass('loading');
        searchTimeout = setTimeout(() => {
            fetchData(`/home/search?q=${encodeURIComponent(query)}`)
                .then(data => populateSearchPopup(data))
                .catch(error => {
                    console.error('Search error:', error);
                    $('#search-popup').removeClass('loading').empty().append(`
                        <div class="search-result no-results" role="alert">
                            <div class="search-result-info">
                                <div class="search-result-title">Search Failed</div>
                                <p class="search-result-details">Please try again later</p>
                            </div>
                        </div>
                    `).addClass('active');
                    $('#search-backdrop').addClass('active');
                });
        }, 300);
    });

    // Submit search to update hero carousel
    $('#search-button').click(function(e) {
        e.preventDefault();
        const query = $('#search-input').val().trim();
        if (query.length < 2) {
            return;
        }
        fetchData(`/home/search?q=${encodeURIComponent(query)}`)
            .then(data => {
                populateHeroSlide(data);
                $('#search-popup').empty().removeClass('active loading');
                $('#search-backdrop').removeClass('active');
                $('.search-bar').removeClass('active');
            })
            .catch(error => {
                console.error('Search submit error:', error);
                $('#search-popup').empty().removeClass('active loading').append(`
                    <div class="search-result no-results" role="alert">
                        <div class="search-result-info">
                            <div class="search-result-title">Search Failed</div>
                            <p class="search-result-details">Please try again later</p>
                        </div>
                    </div>
                `).addClass('active');
                $('#search-backdrop').addClass('active');
            });
    });

    // Close search popup and backdrop
    $('#search-backdrop').on('click', function() {
        $('#search-popup').empty().removeClass('active loading');
        $('#search-backdrop').removeClass('active');
        $('.search-bar').removeClass('active');
        $('.movie-modal').removeClass('active').attr('aria-hidden', 'true');
        $('body').removeClass('no-scroll');
    });

    // Prevent closing when clicking inside search bar, popup, or modal
    $('.search-bar, .search-popup, .movie-modal').on('click', function(e) {
        e.stopPropagation();
    });

    // Movie item, hero slide, and new section clicks
    $(document).on('click', '.movie-item, .hero-slide-item-content, .movie-grid-item, .movie-scroll-item, .movie-stack-item', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const $element = $(this);
        $element.addClass('clicked');
        setTimeout(() => $element.removeClass('clicked'), 400);
        let movieData;
        try {
            movieData = JSON.parse(decodeURIComponent($element.attr('data-movie')));
        } catch (error) {
            console.error('Error parsing movie data:', error, 'Raw data:', $element.attr('data-movie'));
            return;
        }
        if (movieData && movieData.title) {
            showMovieModal(movieData);
        } else {
            console.error('Invalid movie data:', movieData);
        }
    });

    // Category dropdown
    $('.dropdown-toggle').click(function(e) {
        e.preventDefault();
        const $dropdown = $(this).parent();
        $dropdown.toggleClass('active');
        $(this).attr('aria-expanded', $dropdown.hasClass('active'));
    });

    $('.dropdown-menu a').click(function(e) {
        e.preventDefault();
        const category = $(this).data('category');
        fetchData(`/home/details?category=${encodeURIComponent(category)}`).then(data => populateHeroSlide(data));
        $('.dropdown').removeClass('active');
        $('.dropdown-toggle').attr('aria-expanded', 'false');
    });

    $(document).click(function(e) {
        if (!$(e.target).closest('.dropdown').length) {
            $('.dropdown').removeClass('active');
            $('.dropdown-toggle').attr('aria-expanded', 'false');
        }
    });

    // Hamburger menu toggle
    $('#hamburger-menu').click(function() {
        $(this).toggleClass('active');
        const isExpanded = $(this).hasClass('active');
        $(this).attr('aria-expanded', isExpanded);
        $('#nav-menu').toggleClass('active');
        $('body').toggleClass('no-scroll', isExpanded);
    });

    $(document).click(function(e) {
        if (!$(e.target).closest('#hamburger-menu, #nav-menu').length && $('#nav-menu').hasClass('active')) {
            $('#hamburger-menu').removeClass('active').attr('aria-expanded', 'false');
            $('#nav-menu').removeClass('active');
            $('body').removeClass('no-scroll');
        }
    });

    // Document click to close popups and modal
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.search-bar, .search-popup, .movie-modal, .modal-close').length) {
            $('#search-popup').empty().removeClass('active loading');
            $('#search-backdrop').removeClass('active');
            $('.search-bar').removeClass('active');
            $('.movie-modal').removeClass('active').attr('aria-hidden', 'true');
            $('body').removeClass('no-scroll');
        }
    });

    // Fetch and populate all sections
    fetchData('/home/details').then(data => populateHeroSlide(data));
    fetchData('/home/details?category=top movie', 'hero-section').then(data => populateMovieItems('#top-movies-slide', data, 'hero-section'));
    fetchData('/home/details?category=trending', 'trending-section').then(data => populateTrendingMovies(data));
    fetchData('/home/details?category=new-releases', 'new-releases-section').then(data => populateNewReleases(data));
    fetchData('/home/details?category=coming-soon', 'coming-soon-section').then(data => populateComingSoon(data));
    fetchData('/home/details?category=hollywood', 'hollywood-section').then(data => populateMovieItems('#latest-hollywood', data, 'hollywood-section'));
    fetchData('/home/details?category=bollywood', 'bollywood-section').then(data => populateMovieItems('#latest-bollywood', data, 'bollywood-section'));
    fetchData('/home/details?category=web series', 'web-series-section').then(data => populateMovieItems('#latest-web-series', data, 'web-series-section'));
    fetchData('/home/details?category=tamil', 'tamil-section').then(data => populateMovieItems('#latest-tamil', data, 'tamil-section'));
    fetchData('/home/details?category=action', 'action-section').then(data => populateMovieItems('#latest-action', data, 'action-section'));
    fetchData('/home/details?category=kids', 'kids-section').then(data => populateMovieItems('#latest-kids', data, 'kids-section'));
    fetchData('/home/details?limit=1', 'special-movie-section').then(data => populateSpecialMovie(data));
});