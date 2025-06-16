document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded, initializing script');

    const videoManager = new VideoManager();
    const partyManager = new PartyManager(videoManager);
    const socketManager = new SocketManager(partyManager, videoManager);

    window.videoManager = videoManager;
    window.partyManager = partyManager;
    window.socketManager = socketManager;
    window.getCurrentVideoState = () => videoManager.getCurrentVideoState();
    window.syncVideoWithParty = (videoState) => videoManager.syncVideoWithParty(videoState, partyManager.isHost);
    window.setPartyMode = (isActive) => partyManager.setPartyMode(isActive);

    // Date-time display
    const datetimeDiv = document.createElement('div');
    datetimeDiv.className = 'datetime-display';
    datetimeDiv.setAttribute('aria-live', 'polite');
    datetimeDiv.innerHTML = '<span id="currentDateTime"></span>';
    document.body.insertBefore(datetimeDiv, document.body.firstChild);
    const currentDateTime = document.getElementById('currentDateTime');

    function updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Kolkata',
            hour12: true
        };
        currentDateTime.textContent = now.toLocaleString('en-US', options);
    }
    updateDateTime();
    const dateTimeInterval = setInterval(updateDateTime, 1000);

    function initializeThemeToggle() {
        const themeToggleButton = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        if (!themeToggleButton || !themeIcon) {
            console.error('Theme toggle elements not found');
            return;
        }
        let savedTheme = 'dark-theme';
        try {
            savedTheme = localStorage.getItem('theme') || 'dark-theme';
        } catch (err) {
            console.warn('localStorage unavailable:', err);
        }
        document.body.className = savedTheme;
        themeIcon.textContent = savedTheme === 'dark-theme' ? 'dark_mode' : 'light_mode';

        themeToggleButton.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            document.body.className = isDark ? 'light-theme' : 'dark-theme';
            themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
            try {
                localStorage.setItem('theme', document.body.className);
            } catch (err) {
                console.warn('localStorage unavailable:', err);
            }
        });
    }

    function initializeSearch() {
        const searchInput = document.getElementById('search-input');
        const searchPopup = document.getElementById('search-popup');
        if (searchInput && searchPopup) {
            searchInput.addEventListener('input', async (e) => {
                const query = e.target.value.trim();
                if (query.length < 3) {
                    searchPopup.classList.remove('active');
                    return;
                }
                try {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    if (response.ok && data.results) {
                        searchPopup.innerHTML = data.results.map(item => `
                            <a href="/play?video_id=${item.id}" class="search-result">
                                <img src="${item.thumbnail || 'https://via.placeholder.com/50x50'}" alt="${item.title}" loading="lazy">
                                <span>${item.title}</span>
                            </a>
                        `).join('');
                        searchPopup.classList.add('active');
                    } else {
                        searchPopup.innerHTML = '<p>No results found.</p>';
                        searchPopup.classList.add('active');
                    }
                } catch (error) {
                    searchPopup.innerHTML = '<p>Error loading results.</p>';
                    searchPopup.classList.add('active');
                }
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchPopup.contains(e.target)) {
                    searchPopup.classList.remove('active');
                }
            });
        }
    }

    function initializeMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const navMenu = document.querySelector('.navbar-menu');
        if (hamburgerMenu && navMenu) {
            hamburgerMenu.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                const isExpanded = navMenu.classList.contains('active');
                hamburgerMenu.setAttribute('aria-expanded', isExpanded);
            });
        }
    }

    function initializeSidebarTabs() {
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        if (sidebarTabs) {
            sidebarTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    sidebarTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const tabContent = document.querySelector(`[data-tab-content="${tab.dataset.tab}"]`);
                    document.querySelectorAll('.sidebar-section').forEach(section => section.classList.remove('active'));
                    if (tabContent) tabContent.classList.add('active');
                    if (tab.dataset.tab === 'recommended' && !partyManager.currentParty) {
                        videoManager.loadRecommendedVideos();
                    }
                });
            });
        }
    }

    function initializeCastNavigation() {
        const navArrowLeft = document.querySelector('.nav-arrow-left');
        const navArrowRight = document.querySelector('.nav-arrow-right');
        const castGrid = document.getElementById('castGrid');
        if (navArrowLeft && navArrowRight && castGrid) {
            const scrollAmount = 200;
            navArrowLeft.addEventListener('click', () => {
                castGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            navArrowRight.addEventListener('click', () => {
                castGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    }

    function initializeReviewSection() {
        const writeReviewBtn = document.getElementById('writeReviewBtn');
        const reviewForm = document.getElementById('review-form');
        const cancelReviewBtn = document.getElementById('cancelReviewBtn');
        const submitReviewBtn = document.getElementById('submitReviewBtn');
        const reviewText = document.getElementById('reviewText');
        const starRating = document.querySelectorAll('.star-rating i');

        if (writeReviewBtn && reviewForm) {
            writeReviewBtn.addEventListener('click', () => {
                reviewForm.classList.toggle('active');
                console.log('Write review toggled');
            });
        }

        if (cancelReviewBtn) {
            cancelReviewBtn.addEventListener('click', () => {
                reviewForm.classList.remove('active');
                reviewText.value = '';
                starRating.forEach(star => star.classList.remove('active'));
                console.log('Review cancelled');
            });
        }

        if (submitReviewBtn && reviewText) {
            submitReviewBtn.addEventListener('click', () => {
                const rating = Array.from(starRating).findIndex(star => star.classList.contains('active')) + 1;
                const text = reviewText.value.trim();
                if (text && rating > 0) {
                    const review = {
                        rating,
                        text,
                        username: partyManager.username || 'Anonymous',
                        timestamp: new Date().toISOString()
                    };
                    window.socketManager.emit('submit_review', review);
                    reviewForm.classList.remove('active');
                    reviewText.value = '';
                    starRating.forEach(star => star.classList.remove('active'));
                    videoManager.showNotification('Review submitted!', 'success');
                    console.log('Review submitted');
                } else {
                    videoManager.showNotification('Please provide a rating and review text.', 'error');
                }
            });
        }

        if (starRating) {
            starRating.forEach((star, index) => {
                star.addEventListener('click', () => {
                    starRating.forEach(s => s.classList.remove('active'));
                    for (let i = 0; i <= index; i++) {
                        starRating[i].classList.add('active');
                    }
                    console.log(`Rating selected: ${index + 1}`);
                });
            });
        }
    }

    function initializeVideoControls() {
        const controls = {
            playPauseBtn: { handler: () => videoManager.togglePlayPause() },
            fastRewindBtn: { handler: () => videoManager.seek(-10) },
            fastForwardBtn: { handler: () => videoManager.seek(10) },
            muteBtn: { handler: () => videoManager.toggleMute() },
            theaterBtn: { handler: () => videoManager.toggleTheaterMode() },
            loopBtn: { handler: () => videoManager.toggleLoop() },
            pipBtn: { handler: () => videoManager.togglePictureInPicture() },
            fullscreenBtn: { handler: () => videoManager.toggleFullscreen() },
            settingsBtn: { handler: () => videoManager.toggleSettings() },
            videoCallBtn: { handler: () => videoManager.startVideoCall() },
            toggleMicBtnSidebar: { handler: () => videoManager.toggleMicrophone() },
            retryBtn: { handler: () => videoManager.retryLoadVideo() },
            volumeSlider: {
                handler: (e) => videoManager.setVolume(e.target.value / 100),
                event: 'input'
            },
            progressBar: {
                handler: (e) => videoManager.seekTo(e.target.value * videoManager.getDuration()),
                event: 'input'
            }
        };

        Object.entries(controls).forEach(([id, { handler, event = 'click' }]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`Bound ${event} listener for ${id}`);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });

        const playbackSpeedOptions = document.querySelectorAll('#playbackSpeedMenu li');
        const qualityOptions = document.querySelectorAll('#qualityOptions li');
        const captionOptions = document.querySelectorAll('#captionMenu li');
        const qualityBackBtn = document.getElementById('qualityBackBtn');

        playbackSpeedOptions.forEach(option => {
            option.addEventListener('click', () => {
                const speed = parseFloat(option.dataset.speed);
                videoManager.setPlaybackSpeed(speed);
                playbackSpeedOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                console.log(`Playback speed set to ${speed}x`);
            });
        });

        qualityOptions.forEach(option => {
            option.addEventListener('click', () => {
                const quality = option.dataset.quality;
                videoManager.setQuality(quality);
                qualityOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                console.log(`Quality set to ${quality}`);
            });
        });

        captionOptions.forEach(option => {
            option.addEventListener('click', () => {
                const caption = option.dataset.caption;
                videoManager.setCaptions(caption);
                captionOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                console.log(`Captions set to ${caption}`);
            });
        });

        if (qualityBackBtn) {
            qualityBackBtn.addEventListener('click', () => {
                document.querySelector('.settings-main').classList.add('active');
                document.querySelector('.settings-submenu').classList.remove('active');
                console.log('Back to main settings');
            });
        }
    }

    function initializeMetadataActions() {
        const actions = {
            likeBtn: { handler: () => videoManager.toggleLike() },
            dislikeBtn: { handler: () => videoManager.toggleDislike() },
            favoriteBtn: { handler: () => videoManager.toggleFavorite() },
            watchLaterBtn: { handler: () => videoManager.toggleWatchLater() },
            videoShareBtn: { handler: () => videoManager.shareVideo() },
            downloadBtn: { handler: () => videoManager.downloadVideo() }
        };

        Object.entries(actions).forEach(([id, { handler }]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
                console.log(`Bound click listener for ${id}`);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });
    }

    function initializeLoadMoreRecommended() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/recommended?offset=' + videoManager.recommendedOffset);
                    const data = await response.json();
                    if (response.ok && data.videos) {
                        const recommendedList = document.querySelector('.recommended-list');
                        recommendedList.innerHTML += data.videos.map(video => `
                            <a href="/play?video_id=${video.id}" class="recommended-item" role="listitem">
                                <img src="${video.thumbnail || 'https://via.placeholder.com/150x100'}" alt="${video.title}" loading="lazy">
                                <div class="recommended-info">
                                    <h5>${video.title}</h5>
                                    <p>${video.description.slice(0, 50)}...</p>
                                </div>
                            </a>
                        `).join('');
                        videoManager.recommendedOffset += data.videos.length;
                        if (!data.hasMore) {
                            loadMoreBtn.classList.add('hidden');
                        }
                        console.log('Loaded more recommended videos');
                    } else {
                        videoManager.showNotification('No more videos to load.', 'info');
                    }
                } catch (error) {
                    videoManager.showNotification('Error loading recommended videos.', 'error');
                    console.error('Load more error:', error);
                }
            });
        }
    }

    function initializeModals() {
        const mediaControlsPopup = document.getElementById('mediaControlsPopup');
        const closeMediaControls = document.getElementById('closeMediaControls');
        const cancelMediaControls = document.getElementById('cancelMediaControls');
        const confirmMediaControls = document.getElementById('confirmMediaControls');
        const toggleCamera = document.getElementById('toggleCamera');
        const toggleMicrophone = document.getElementById('toggleMicrophone');
        const toggleScreenShare = document.getElementById('toggleScreenShare');

        if (closeMediaControls) {
            closeMediaControls.addEventListener('click', () => {
                mediaControlsPopup.classList.add('hidden');
                console.log('Media controls popup closed');
            });
        }
        if (cancelMediaControls) {
            cancelMediaControls.addEventListener('click', () => {
                mediaControlsPopup.classList.add('hidden');
                console.log('Media controls cancelled');
            });
        }
        if (confirmMediaControls) {
            confirmMediaControls.addEventListener('click', () => {
                videoManager.joinVideoCall();
                mediaControlsPopup.classList.add('hidden');
                console.log('Joined with video');
            });
        }
        if (toggleCamera) {
            toggleCamera.addEventListener('click', () => {
                videoManager.toggleCamera();
                console.log('Camera toggled');
            });
        }
        if (toggleMicrophone) {
            toggleMicrophone.addEventListener('click', () => {
                videoManager.toggleMicrophone();
                console.log('Microphone toggled');
            });
        }
        if (toggleScreenShare) {
            toggleScreenShare.addEventListener('click', () => {
                videoManager.toggleScreenShare();
                console.log('Screen share toggled');
            });
        }

        const reactionPicker = document.getElementById('reactionPicker');
        if (reactionPicker) {
            reactionPicker.querySelectorAll('.reaction-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    const reaction = btn.dataset.reaction;
                    window.socketManager.emit('send_reaction', { reaction });
                    reactionPicker.classList.add('hidden');
                    videoManager.showNotification(`Sent reaction: ${reaction}`, 'info');
                    console.log(`Reaction sent: ${reaction}`);
                });
            });
        }
    }

    // Validate critical DOM elements
    const elements = videoManager.elements;
    for (const [key, element] of Object.entries(elements)) {
        if (!element && !['watchPartyPopup', 'closePartyPopup', 'partyTabs', 'partyName', 'partyPrivacy', 'partyPassword', 'maxMembers', 'enableVideoCall', 'enableVoiceChat', 'enableTextChat', 'enableHostControls', 'partyCode', 'joinPassword', 'confirmCreateParty', 'cancelCreateParty', 'confirmJoinParty', 'cancelJoinParty'].includes(key)) {
            console.warn(`DOM element not found: ${key}`);
        }
    }

    videoManager.initializePlayer();
    socketManager.initializeSocket();
    await videoManager.loadMainMovie();

    initializeThemeToggle();
    initializeSearch();
    initializeMobileMenu();
    initializeSidebarTabs();
    initializeCastNavigation();
    initializeReviewSection();
    initializeVideoControls();
    initializeMetadataActions();
    initializeLoadMoreRecommended();
    initializeModals();

    window.addEventListener('unload', () => {
        if (videoManager.player) videoManager.player.dispose();
        clearInterval(dateTimeInterval);
    });

    console.log('Script initialization complete');
});