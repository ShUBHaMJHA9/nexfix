const videojs = window.videojs;

class VideoManager {
    constructor() {
        this.player = null;
        this.videoId = this.getVideoIdFromUrl();
        this.fallbacks = [
            { src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'application/x-mpegURL' },
            { src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', type: 'application/x-mpegURL' },
            { src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', type: 'video/mp4' }
        ];
        this.currentFallbackIndex = 0;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.movieCache = new Map();
        this.isAutoPlay = false;
        this.isLoading = false;
        this.currentPage = 1;
        this.elements = this.initializeDOM();
    }

    initializeDOM() {
        return {
            movieTitle: document.getElementById('movie-title'),
            movieDescription: document.getElementById('movie-description'),
            movieRating: document.getElementById('movie-rating'),
            movieQuality: document.getElementById('movie-quality'),
            movieYear: document.getElementById('movie-year'),
            movieDuration: document.getElementById('movie-duration'),
            movieGenres: document.getElementById('movie-genres'),
            movieDirector: document.getElementById('movie-director'),
            imdbRating: document.getElementById('imdb-rating'),
            recommendedVideos: document.getElementById('recommendedVideos'),
            shareBtn: document.getElementById('shareBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            autoPlayBtn: document.getElementById('autoPlayBtn'),
            miniPlayerBtn: document.getElementById('miniPlayerBtn'),
            reviewForm: document.getElementById('review-form'),
            userReviews: document.getElementById('user-reviews'),
            mainPlayer: document.getElementById('mainPlayer'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorOverlay: document.getElementById('errorOverlay'),
            errorMessage: document.getElementById('errorMessage'),
            castGrid: document.getElementById('castGrid'),
            navArrowLeft: document.querySelector('.nav-arrow-left'),
            navArrowRight: document.querySelector('.nav-arrow-right'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            muteBtn: document.getElementById('muteBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            progressBar: document.getElementById('progressBar'),
            fastRewindBtn: document.getElementById('fastRewindBtn'),
            fastForwardBtn: document.getElementById('fastForwardBtn'),
            pipBtn: document.getElementById('pipBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            theaterBtn: document.getElementById('theaterBtn'),
            loopBtn: document.getElementById('loopBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            playbackSpeedMenu: document.getElementById('playbackSpeedMenu'),
            qualityMenu: document.getElementById('qualityMenu'),
            qualitySubmenu: document.getElementById('qualitySubmenu'),
            qualityBackBtn: document.getElementById('qualityBackBtn'),
            qualityOptions: document.getElementById('qualityOptions'),
            captionMenu: document.getElementById('captionMenu'),
            writeReviewBtn: document.getElementById('writeReviewBtn'),
            cancelReviewBtn: document.getElementById('cancelReviewBtn'),
            submitReviewBtn: document.getElementById('submitReviewBtn'),
            likeBtn: document.getElementById('likeBtn'),
            dislikeBtn: document.getElementById('dislikeBtn'),
            favoriteBtn: document.getElementById('favoriteBtn'),
            watchLaterBtn: document.getElementById('watchLaterBtn'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            loadingScreen: document.getElementById('loadingScreen'),
        };
    }

    getVideoIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('video_id');
        if (!videoId) {
            console.error('No video_id found in URL');
            this.showError('Invalid video ID. Please check the URL.');
        }
        return videoId;
    }

    initializePlayer() {
        if (!this.elements.mainPlayer) {
            console.error('Main player element not found');
            this.showError('Video player initialization failed.');
            return;
        }
        if (!window.videojs) {
            console.error('Video.js library not loaded');
            this.showError('Video player library failed to load.');
            return;
        }
        this.player = videojs(this.elements.mainPlayer, {
            controls: false,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            responsive: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            html5: { hls: { overrideNative: true } }
        });

        this.player.on('error', () => this.handlePlayerError());
        this.player.on('loadedmetadata', () => {
            this.elements.loadingSpinner?.classList.add('hidden');
            this.elements.loadingScreen?.classList.add('hidden');
            this.retryCount = 0;
            this.currentFallbackIndex = 0;
            this.updateDuration();
        });
        this.player.on('timeupdate', () => this.updateProgress());
        this.player.on('volumechange', () => this.updateVolume());
        this.player.on('play', () => this.updatePlayPauseButton());
        this.player.on('pause', () => this.updatePlayPauseButton());
        this.player.on('ratechange', () => this.updatePlaybackSpeed());
        this.player.on('enterpictureinpicture', () => this.elements.pipBtn?.classList.add('active'));
        this.player.on('leavepictureinpicture', () => this.elements.pipBtn?.classList.remove('active'));
        this.player.on('ended', () => {
            if (this.isAutoPlay) {
                this.showNotification('Auto-playing next video...');
            }
        });

        this.setupCustomControls();
        this.setupControlBarVisibility();
    }

    setupControlBarVisibility() {
        let hideTimeout;
        const controlBar = this.elements.mainPlayer?.parentElement.querySelector('.custom-controls');
        if (!controlBar) return;

        const showControls = () => {
            controlBar.classList.add('visible');
            clearTimeout(hideTimeout);
            if (!this.player.paused() && !this.elements.settingsPanel.classList.contains('active')) {
                hideTimeout = setTimeout(() => {
                    controlBar.classList.remove('visible');
                }, 3000);
            }
        };
        this.elements.mainPlayer.parentElement.addEventListener('mousemove', showControls);
        this.elements.mainPlayer.parentElement.addEventListener('touchstart', showControls);
        this.player.on('pause', showControls);
        this.player.on('play', showControls);

        setTimeout(() => {
            if (this.elements.loadingScreen && !this.elements.loadingScreen.classList.contains('hidden')) {
                this.elements.loadingScreen.classList.add('hidden');
                console.warn('Loading screen hidden due to timeout');
            }
        }, 5000);
    }

    handlePlayerError() {
        const error = this.player.error();
        let message = 'Failed to load video.';
        if (error) {
            if (error.message.includes('CORS')) message = 'Video source blocked by CORS policy.';
            else if (error.message.includes('network')) message = 'Network error loading video.';
            else if (error.message.includes('format')) message = 'Unsupported video format.';
            else if (error.code === 2) message = 'Network timeout or resource unavailable.';
        }
        if (this.retryCount < this.maxRetries && this.currentFallbackIndex < this.fallbacks.length) {
            this.player.reset();
            this.player.src(this.fallbacks[this.currentFallbackIndex]);
            this.currentFallbackIndex++;
            this.retryCount++;
        } else {
            this.showError(`${message} All sources failed.`);
            this.elements.errorOverlay?.classList.remove('hidden');
        }
    }

    async loadMainMovie() {
        try {
            this.elements.loadingScreen?.classList.remove('hidden');
            const data = await this.fetchData(`/home/watch/${this.videoId}`, 'main-movie');
            if (data) {
                this.updateMainMovie(data);
                try {
                    await this.setupMovie(data.videoUrl || this.fallbacks[0].src);
                } catch (err) {
                    console.error('Video setup failed:', err);
                    this.showError('Failed to load video content.');
                }
                await Promise.allSettled([
                    this.loadCastInfo().catch(err => console.warn('Cast info failed:', err)),
                    this.loadUserReviews().catch(err => console.warn('User reviews failed:', err))
                ]);
            } else {
                this.showError('Failed to load movie details.');
            }
        } catch (error) {
            console.error('loadMainMovie error:', error);
            this.showError(`Error loading movie: ${error.message}`);
        } finally {
            this.elements.loadingScreen?.classList.add('hidden');
            this.elements.loadingSpinner?.classList.add('hidden');
        }
    }

    async setupMovie(videoUrl) {
        try {
            const data = await this.fetchData(`/home/watch/${this.videoId}`, 'download-options');
            let qualityOptions = [];
            if (data && Array.isArray(data) && data.length > 0) {
                const uniqueOptions = new Map();
                data.forEach(opt => {
                    if (opt.url && opt.quality && !uniqueOptions.has(opt.quality)) {
                        uniqueOptions.set(opt.quality, {
                            url: opt.url,
                            quality: opt.quality,
                            height: this.parseQualityHeight(opt.quality)
                        });
                    }
                });
                qualityOptions = Array.from(uniqueOptions.values()).sort((a, b) => b.height - a.height);
            } else {
                qualityOptions = [{ url: videoUrl, quality: 'Auto', height: 0 }];
            }

            let videoLoaded = false;
            for (const option of qualityOptions) {
                let rawUrl = option.url;
                try {
                    if (rawUrl.includes('/proxy?url=')) {
                        const urlParams = new URLSearchParams(rawUrl.split('?')[1]);
                        rawUrl = decodeURIComponent(urlParams.get('url'));
                    } else {
                        rawUrl = decodeURIComponent(rawUrl);
                    }
                } catch (e) {
                    console.warn('URL decoding failed:', rawUrl, e);
                }

                const proxiedUrl = `/proxy?url=${encodeURIComponent(rawUrl)}`;
                try {
                    this.player.src({
                        src: proxiedUrl,
                        type: this.getStreamType(option.url)
                    });
                    await new Promise((resolve, reject) => {
                        let timeout = setTimeout(() => reject(new Error("Video load timeout")), 8000);
                        const onReady = () => {
                            clearTimeout(timeout);
                            this.player.off('error', onError);
                            resolve();
                        };
                        const onError = () => {
                            clearTimeout(timeout);
                            this.player.off('ready', onReady);
                            reject(this.player.error() || new Error('Unknown video error'));
                        };
                        this.player.one('ready', onReady);
                        this.player.one('error', onError);
                    });
                    videoLoaded = true;
                    if (this.elements.qualityMenu) {
                        this.elements.qualityMenu.innerHTML = qualityOptions.map(opt => `
                            <li data-submenu="quality" class="${opt.quality === option.quality ? 'active' : ''}">${opt.quality}</li>
                        `).join('');
                        this.elements.qualityOptions.innerHTML = qualityOptions.map(opt => `
                            <li data-quality="${opt.quality}" class="${opt.quality === option.quality ? 'active' : ''}">${opt.quality}</li>
                        `).join('');
                    }
                    break;
                } catch (err) {
                    console.warn(`Video load failed for ${option.quality}:`, err.message);
                }
            }

            if (!videoLoaded) {
                throw new Error("All video qualities failed to load.");
            }
        } catch (error) {
            console.error('setupMovie error:', error);
            this.showError(error.message || 'Failed to load video sources.');
            throw error;
        } finally {
            this.elements.loadingSpinner?.classList.add('hidden');
        }
    }

    async fetchData(url, sectionId) {
        if (this.movieCache.has(url)) return this.movieCache.get(url);
        try {
            this.elements.loadingSpinner?.classList.remove('hidden');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            this.movieCache.set(url, data);
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                this.showError(`Request timed out while loading ${sectionId}. Please try again.`);
            } else {
                this.showError(`Failed to load ${sectionId}: ${error.message}`);
            }
            return null;
        } finally {
            this.elements.loadingSpinner?.classList.add('hidden');
        }
    }

    async loadCastInfo() {
        const data = await this.fetchData(`/home/details/${this.videoId}/cast`, 'cast-info');
        if (data && Array.isArray(data) && data.length > 0) {
            this.elements.castGrid.innerHTML = data.map(cast => `
                <div class="cast-member">
                    <div class="cast-image-container">
                        <img src="${cast.image || 'https://placehold.co/64x64?text=No+Image'}" alt="${cast.name} portrait" loading="lazy">
                    </div>
                    <p class="cast-name">${cast.name}</p>
                    <p class="cast-role">${cast.role || 'Unknown'}</p>
                </div>
            `).join('');
        } else {
            this.elements.castGrid.innerHTML = '<p>No cast available.</p>';
        }
    }

    async loadUserReviews() {
        const data = await this.fetchData(`/home/reviews/${this.videoId}`, 'user-reviews');
        if (data && Array.isArray(data) && data.length > 0) {
            this.elements.userReviews.innerHTML = data.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <span class="reviewer-name">${review.user_name}</span>
                        <div class="review-rating">${this.renderStars(review.rating)}</div>
                    </div>
                    <p>${review.review_text}</p>
                </div>
            `).join('');
        } else {
            this.elements.userReviews.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        }
    }

    async handleReviewSubmit(e) {
        e.preventDefault();
        const selectedRating = parseInt(this.elements.reviewForm.querySelector('.star-rating .bxs-star')?.dataset.rating || 0);
        if (!selectedRating) {
            this.showNotification('Please select a rating.');
            return;
        }
        const reviewText = this.elements.reviewForm.querySelector('textarea').value.trim();
        if (!reviewText) {
            this.showNotification('Please provide a review.');
            return;
        }
        try {
            this.elements.loadingSpinner?.classList.remove('hidden');
            const response = await fetch('/home/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: this.videoId,
                    movie_title: this.elements.movieTitle?.textContent || 'Unknown',
                    user_name: 'Anonymous',
                    user_id: null,
                    rating: selectedRating,
                    review_text: reviewText
                })
            });
            if (!response.ok) throw new Error('Failed to submit review');
            this.showNotification('Review submitted!');
            this.elements.reviewForm.reset();
            this.elements.reviewForm.querySelectorAll('.star-rating i').forEach(star => {
                star.classList.remove('bxs-star');
                star.classList.add('bx-star');
            });
            await this.loadUserReviews();
            this.elements.reviewForm.classList.remove('active');
        } catch (error) {
            this.showError(`Failed to submit review: ${error.message}`);
        } finally {
            this.elements.loadingSpinner?.classList.add('hidden');
        }
    }

    async loadRecommendedVideos() {
        if (this.isLoading) return;
        this.isLoading = true;

        const recommendedList = this.elements.recommendedVideos?.querySelector('.recommended-list');
        if (recommendedList) {
            recommendedList.innerHTML = '';
            this.currentPage = 1;

            const data = await this.fetchVideos(this.currentPage);
            if (data.length > 0) {
                this.renderVideos(data, recommendedList);
                this.currentPage++;
                this.elements.loadMoreBtn.style.display = 'flex';
            } else {
                recommendedList.innerHTML = '<p>No recommended videos available.</p>';
                this.elements.loadMoreBtn.style.display = 'none';
            }
        }

        this.isLoading = false;
    }

    async loadMoreVideos() {
        if (this.isLoading) return;
        this.isLoading = true;

        const recommendedList = this.elements.recommendedVideos?.querySelector('.recommended-list');
        if (recommendedList) {
            const data = await this.fetchVideos(this.currentPage);
            if (data.length > 0) {
                this.renderVideos(data, recommendedList);
                this.currentPage++;
            } else {
                this.elements.loadMoreBtn.style.display = 'none';
                recommendedList.insertAdjacentHTML('beforeend', '<p>No more videos available.</p>');
            }
        }

        this.isLoading = false;
    }

    async fetchVideos(page) {
        try {
            const data = await this.fetchData(`/home/details?category=bollywood&page=${page}`, 'recommended-videos');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            this.showError(`Failed to load recommended videos: ${error.message}`);
            return [];
        }
    }

    setupCustomControls() {
        if (!this.elements.playPauseBtn) return;

        this.elements.playPauseBtn.addEventListener('click', () => {
            if (this.player.paused()) {
                this.player.play();
            } else {
                this.player.pause();
            }
        });

        if (this.elements.muteBtn) {
            this.elements.muteBtn.addEventListener('click', () => {
                this.player.muted(!this.player.muted());
                this.updateMuteButton();
            });
        }

        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', () => {
                this.player.volume(this.elements.volumeSlider.value / 100);
                this.updateMuteButton();
            });
        }

        if (this.elements.progressBar) {
            this.elements.progressBar.addEventListener('input', () => {
                const seekTime = (this.elements.progressBar.value / 100) * this.player.duration();
                this.player.currentTime(seekTime);
            });
        }

        if (this.elements.fastRewindBtn) {
            this.elements.fastRewindBtn.addEventListener('click', () => {
                this.player.currentTime(this.player.currentTime() - 10);
            });
        }

        if (this.elements.fastForwardBtn) {
            this.elements.fastForwardBtn.addEventListener('click', () => {
                this.player.currentTime(this.player.currentTime() + 10);
            });
        }

        if (this.elements.pipBtn) {
            this.elements.pipBtn.addEventListener('click', async () => {
                try {
                    if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                    } else {
                        await this.player.requestPictureInPicture();
                    }
                } catch (err) {
                    console.error('PiP error:', err);
                    this.showNotification('Picture-in-Picture not supported.', 'error');
                }
            });
        }

        if (this.elements.fullscreenBtn) {
            this.elements.fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    this.player.requestFullscreen().catch(err => {
                        console.error('Fullscreen error:', err);
                        this.showNotification('Fullscreen not supported.', 'error');
                    });
                    this.elements.fullscreenBtn.querySelector('i').textContent = 'fullscreen_exit';
                } else {
                    document.exitFullscreen();
                    this.elements.fullscreenBtn.querySelector('i').textContent = 'fullscreen';
                }
            });
        }

        if (this.elements.theaterBtn) {
            this.elements.theaterBtn.addEventListener('click', () => {
                this.elements.mainPlayer.parentElement.classList.toggle('theater-mode');
                this.elements.theaterBtn.classList.toggle('active');
            });
        }

        if (this.elements.loopBtn) {
            this.elements.loopBtn.addEventListener('click', () => {
                this.player.loop(!this.player.loop());
                this.elements.loopBtn.classList.toggle('active');
                this.showNotification(this.player.loop() ? 'Loop enabled.' : 'Loop disabled.');
            });
        }

        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', () => {
                this.showNotification('Download feature not implemented.');
            });
        }

        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => this.shareMovie());
        }

        if (this.elements.autoPlayBtn) {
            this.elements.autoPlayBtn.addEventListener('click', () => {
                this.isAutoPlay = !this.isAutoPlay;
                this.elements.autoPlayBtn.classList.toggle('active');
                this.showNotification(this.isAutoPlay ? 'Auto-play enabled.' : 'Auto-play disabled.');
            });
        }

        if (this.elements.miniPlayerBtn) {
            this.elements.miniPlayerBtn.addEventListener('click', () => {
                this.elements.mainPlayer.parentElement.classList.toggle('mini-player');
                this.elements.miniPlayerBtn.classList.toggle('active');
                this.showNotification(this.elements.mainPlayer.parentElement.classList.contains('mini-player') ? 'Mini-player enabled.' : 'Mini-player disabled.');
            });
        }

        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.elements.settingsPanel?.classList.toggle('active');
            });
        }

        if (this.elements.playbackSpeedMenu) {
            this.elements.playbackSpeedMenu.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', () => {
                    const speed = parseFloat(item.dataset.speed);
                    this.player.playbackRate(speed);
                    this.elements.playbackSpeedMenu.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                    item.classList.add('active');
                    this.showNotification(`Playback speed set to ${speed}x`);
                });
            });
        }

        if (this.elements.qualityMenu) {
            this.elements.qualityMenu.querySelectorAll('li').forEach(item => {
                if (item.dataset.submenu === 'quality') {
                    item.addEventListener('click', () => {
                        this.elements.settingsMain?.classList.remove('active');
                        this.elements.qualitySubmenu.classList.add('active');
                    });
                }
            });
        }

        if (this.elements.qualityBackBtn) {
            this.elements.qualityBackBtn.addEventListener('click', () => {
                this.elements.qualitySubmenu.classList.remove('active');
                this.elements.settingsMain?.classList.add('active');
            });
        }

        if (this.elements.qualityOptions) {
            this.elements.qualityOptions.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', () => {
                    const quality = item.dataset.quality;
                    this.elements.qualityOptions.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                    item.classList.add('active');
                    this.showNotification(`Quality set to ${quality}`);
                    console.log('Selected quality:', quality);
                });
            });
        }

        if (this.elements.captionMenu) {
            this.elements.captionMenu.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', () => {
                    const caption = item.dataset.caption;
                    this.elements.captionMenu.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                    item.classList.add('active');
                    this.showNotification(`Captions set to ${caption === 'off' ? 'Off' : 'English'}`);
                    console.log('Selected caption:', caption);
                });
            });
        }

        if (this.elements.writeReviewBtn) {
            this.elements.writeReviewBtn.addEventListener('click', () => {
                this.elements.reviewForm?.classList.toggle('active');
            });
        }

        if (this.elements.cancelReviewBtn) {
            this.elements.cancelReviewBtn.addEventListener('click', () => {
                this.elements.reviewForm?.classList.remove('active');
                this.elements.reviewForm?.reset();
                this.elements.reviewForm?.querySelectorAll('.star-rating i').forEach(star => {
                    star.classList.remove('bxs-star');
                    star.classList.add('bx-star');
                });
            });
        }

        if (this.elements.reviewForm) {
            const stars = this.elements.reviewForm.querySelectorAll('.star-rating i');
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const rating = parseInt(star.dataset.rating);
                    stars.forEach(s => {
                        const sRating = parseInt(s.dataset.rating);
                        s.classList.toggle('bxs-star', sRating <= rating);
                        s.classList.toggle('bx-star', sRating > rating);
                    });
                });
            });
        }

        if (this.elements.submitReviewBtn) {
            this.elements.reviewForm?.addEventListener('submit', (e) => this.handleReviewSubmit(e));
        }

        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreVideos());
        }

        if (this.elements.likeBtn) {
            this.elements.likeBtn.addEventListener('click', () => {
                const countElement = this.elements.likeBtn.querySelector('#likeCount');
                const count = parseInt(countElement.textContent.replace(/[^0-9]/g, '')) + 1;
                countElement.textContent = `${(count / 1000).toFixed(1)}K`;
                this.showNotification('Video liked!');
            });
        }

        if (this.elements.dislikeBtn) {
            this.elements.dislikeBtn.addEventListener('click', () => {
                const countElement = this.elements.dislikeBtn.querySelector('#dislikeCount');
                const count = parseInt(countElement.textContent) + 1;
                countElement.textContent = count;
                this.showNotification('Video disliked.');
            });
        }

        if (this.elements.favoriteBtn) {
            this.elements.favoriteBtn.addEventListener('click', () => {
                this.elements.favoriteBtn.classList.toggle('active');
                this.showNotification(this.elements.favoriteBtn.classList.contains('active') ? 'Added to favorites!' : 'Removed from favorites.');
            });
        }

        if (this.elements.watchLaterBtn) {
            this.elements.watchLaterBtn.addEventListener('click', () => {
                this.elements.watchLaterBtn.classList.toggle('active');
                this.showNotification(this.elements.watchLaterBtn.classList.contains('active') ? 'Added to watch later!' : 'Removed from watch later.');
            });
        }

        this.updatePlayPauseButton();
        this.updateMuteButton();
        this.updateVolume();
        this.updateDuration();
    }

    updateMainMovie(data) {
        if (this.elements.movieTitle) this.elements.movieTitle.textContent = data.title || 'Unknown Title';
        if (this.elements.movieDescription) this.elements.movieDescription.textContent = data.description || 'No description available.';
        if (this.elements.movieRating) this.elements.movieRating.textContent = data.avgRating !== 'N/A' ? data.avgRating : (data.rating !== 'N/A' ? data.rating : 'PG-13');
        if (this.elements.movieQuality) this.elements.movieQuality.textContent = data.quality || 'HD';
        if (this.elements.movieYear) this.elements.movieYear.textContent = data.release_year !== 'N/A' ? data.release_year : 'Unknown';
        if (this.elements.movieDuration) this.elements.movieDuration.textContent = this.formatDuration(data.duration) || 'Unknown';
        if (this.elements.movieDirector) this.elements.movieDirector.textContent = data.director || 'Unknown';
        if (this.elements.imdbRating) this.elements.imdbRating.textContent = data.imdbRating || 'N/A';
        if (this.elements.movieGenres) {
            this.elements.movieGenres.innerHTML = '';
            const genres = data.genre ? JSON.parse(data.genre).map(g => g.trim()).filter(g => g) : ['Unknown'];
            genres.forEach((genre, index) => {
                const link = document.createElement('a');
                link.href = `#${genre.toLowerCase()}`;
                link.textContent = genre;
                link.setAttribute('aria-label', `${genre} genre`);
                this.elements.movieGenres.appendChild(link);
                if (index < genres.length - 1) this.elements.movieGenres.appendChild(document.createTextNode(' '));
            });
        }
    }

    shareMovie() {
        const movieTitle = this.elements.movieTitle?.textContent || 'Unknown Title';
        const shareUrl = `${window.location.origin}/play?video_id=${this.videoId}`;
        if (navigator.share) {
            navigator.share({
                title: `Watch "${movieTitle}" on Nexfix`,
                text: `Check out "${movieTitle}" on Nexfix`,
                url: shareUrl
            }).catch(() => this.fallbackShare(shareUrl));
        } else {
            this.fallbackShare(shareUrl);
        }
    }

    fallbackShare(url) {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        this.showNotification('Link copied to clipboard!');
    }

    getCurrentVideoState() {
        return {
            videoId: this.videoId,
            timestamp: this.player.currentTime(),
            playing: !this.player.paused(),
            playbackRate: this.player.playbackRate()
        };
    }

    syncVideoWithParty(videoState, isHost) {
        if (videoState.videoId === this.videoId && !isHost) {
            this.player.currentTime(videoState.timestamp);
            this.player.playbackRate(videoState.playbackRate);
            if (videoState.playing) {
                this.player.play().catch(() => this.showNotification('Playback restricted by browser.', 'error'));
            } else {
                this.player.pause();
            }
        }
    }

    updatePlayPauseButton() {
        if (this.elements.playPauseBtn) {
            const icon = this.elements.playPauseBtn.querySelector('i');
            icon.textContent = this.player.paused() ? 'play_arrow' : 'pause';
        }
    }

    updateMuteButton() {
        if (this.elements.muteBtn) {
            const icon = this.elements.muteBtn.querySelector('i');
            icon.textContent = this.player.muted() || this.player.volume() === 0 ? 'volume_off' : 'volume_up';
        }
    }

    updateVolume() {
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = this.player.volume() * 100;
        }
    }

    updateDuration() {
        if (this.elements.duration) {
            const duration = this.player.duration();
            this.elements.duration.textContent = this.formatTime(duration);
        }
    }

    updateProgress() {
        if (this.elements.currentTime && this.elements.progressBar) {
            const currentTime = this.player.currentTime();
            const duration = this.player.duration();
            this.elements.currentTime.textContent = this.formatTime(currentTime);
            if (duration > 0) {
                this.elements.progressBar.value = (currentTime / duration) * 100;
            }
        }
    }

    updatePlaybackSpeed() {
        if (this.elements.playbackSpeedMenu) {
            const speed = this.player.playbackRate();
            this.elements.playbackSpeedMenu.querySelectorAll('li').forEach(li => {
                li.classList.toggle('active', parseFloat(li.dataset.speed) === speed);
            });
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatDuration(minutes) {
        if (!minutes || minutes === 'N/A') return 'Unknown';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    renderVideos(data, container) {
        const videosHTML = data.map(video => {
            const videoId = video.watchUrl?.split('v=')[1] || '';
            return `
                <div class="recommended-video" role="listitem" data-video-id="${videoId}">
                    <a href="/play?video_id=${videoId}" class="video-link" aria-label="View ${video.title}">
                        <div class="thumbnail">
                            <img src="${video.posterUrl || 'https://placehold.co/320x180?text=No+Image'}" alt="${video.title}" loading="lazy">
                            ${video.duration && video.duration !== 'N/A' ? `<span class="duration">${this.formatDuration(video.duration)}</span>` : ''}
                        </div>
                        <div class="info">
                            <h3 class="title">${video.title}</h3>
                            <div class="meta">
                                <span class="rating">
                                    <i class="material-icons-round">star</i>
                                    ${video.rating !== 'N/A' ? video.rating : video.avgRating || 'N/A'}
                                </span>
                                <span class="separator">•</span>
                                <span class="quality">${video.quality || 'N/A'}</span>
                                <span class="separator">•</span>
                                <span>${video.release_year || 'Unknown'}</span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');
        container.insertAdjacentHTML('beforeend', videosHTML);
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= fullStars ? '<i class="bx bxs-star"></i>' :
                     i === fullStars + 1 && hasHalfStar ? '<i class="bx bxs-star-half"></i>' :
                     '<i class="bx bx-star"></i>';
        }
        return stars;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.className = `notification notification-${type} fade-out`;
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        if (this.elements.errorOverlay && this.elements.errorMessage) {
            this.elements.errorMessage.innerHTML = message;
            this.elements.errorOverlay.classList.remove('hidden');
            setTimeout(() => this.elements.errorOverlay.classList.add('hidden'), 7000);
        } else {
            console.warn('Error overlay elements not found, falling back to notification');
            this.showNotification(message, 'error');
        }
    }

    parseQualityHeight(quality) {
        const match = quality.match(/(\d+)p/);
        return match ? parseInt(match[1], 10) : 0;
    }

    getStreamType(url) {
        if (url.includes('.m3u8')) return 'application/x-mpegURL';
        if (url.includes('.mp4')) return 'video/mp4';
        return 'video/mp4';
    }
}