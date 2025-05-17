document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded, initializing script');

    // Extract video_id from URL
    console.log('Parsing video_id from URL:', window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video_id');
    if (!videoId) {
        console.error('No video_id found in URL');
        showError('Invalid video ID. Please check the URL.');
        return;
    }
    console.log('Extracted video_id:', videoId);

    const movieCache = new Map();
    let player;
    const fallbacks = [
        { src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'application/x-mpegURL' },
        { src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', type: 'application/x-mpegURL' },
        { src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', type: 'video/mp4' }
    ];
    let currentFallbackIndex = 0;
    let retryCount = 0;
    const maxRetries = 3;
    const controlTimeoutDuration = 3000;
    let isLoading = false;
    let currentPage = 1;
    let watchPartySocket = null;
    let isHost = false;
    let partyId = null;

    if (!window.videojs) {
        console.error('Video.js library not loaded');
        showError('Video player library failed to load.');
        return;
    }

    // DOM Elements
    console.log('Caching DOM elements');
    const elements = {
        movieDetail: document.getElementById('movie-detail'),
        movieTitle: document.getElementById('movie-title'),
        movieDescription: document.getElementById('movie-description'),
        movieRating: document.getElementById('movie-rating'),
        movieQuality: document.getElementById('movie-quality'),
        movieYear: document.getElementById('movie-year'),
        movieDuration: document.getElementById('movie-duration'),
        movieGenres: document.getElementById('movie-genres'),
        movieDirector: document.getElementById('movie-director'),
        imdbRating: document.getElementById('imdb-rating'),
        recommendedVideos: document.getElementById('recommended-videos'),
        shareBtn: document.getElementById('videoShareBtn'),
        hdDownloadBtn: document.getElementById('hdDownloadBtn'),
        fastDownloadBtn: document.getElementById('fastDownloadBtn'),
        subtitlesDownloadBtn: document.getElementById('subtitlesDownloadBtn'),
        trailerModal: document.getElementById('trailer-modal'),
        closeModal: document.querySelector('.close-modal'),
        trailerVideo: document.getElementById('trailer-video'),
        reviewForm: document.getElementById('review-form'),
        userReviews: document.getElementById('user-reviews'),
        mainPlayer: document.getElementById('mainPlayer'),
        centerControl: document.getElementById('centerControl'),
        qualityBadge: document.getElementById('qualityBadge'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        captionsBtn: document.getElementById('captionsBtn'),
        captionsPanel: document.getElementById('captionsPanel'),
        loadingSpinner: document.querySelector('.loading-spinner'),
        errorOverlay: document.querySelector('.error-overlay'),
        errorMessage: document.querySelector('.error-message'),
        castGrid: document.querySelector('.cast-grid'),
        navArrowLeft: document.querySelector('.nav-arrow-left'),
        navArrowRight: document.querySelector('.nav-arrow-right'),
        controls: document.querySelector('.controls'),
        progressArea: document.getElementById('progressArea'),
        volumeSlider: document.querySelector('.volume-slider'),
        volumeBtn: document.querySelector('.volume .icon'),
        fastRewindBtn: document.querySelector('.fast-rewind'),
        fullscreenBtn: document.querySelector('.fullscreen'),
        pipBtn: document.querySelector('.picture_in_picture'),
        theaterBtn: document.querySelector('.theater-mode'),
        createPartyBtn: document.getElementById('createPartyBtn'),
        joinPartyBtn: document.getElementById('joinPartyBtn'),
        watchPartyPopup: document.getElementById('watchPartyPopup'),
        closePartyPopup: document.getElementById('closePartyPopup'),
        partyTabs: document.querySelectorAll('.party-tab'),
        partyName: document.getElementById('partyName'),
        partyPassword: document.getElementById('partyPassword'),
        confirmCreateParty: document.getElementById('confirmCreateParty'),
        cancelCreateParty: document.getElementById('cancelCreateParty'),
        partyCode: document.getElementById('partyCode'),
        joinPassword: document.getElementById('joinPassword'),
        confirmJoinParty: document.getElementById('confirmJoinParty'),
        cancelJoinParty: document.getElementById('cancelJoinParty'),
        activePartyView: document.getElementById('activePartyView'),
        partyChatMessages: document.getElementById('partyChatMessages'),
        partyChatInput: document.getElementById('partyChatInput'),
        sendPartyMessage: document.getElementById('sendPartyMessage'),
        partyMembersList: document.getElementById('partyMembersList'),
        partyPlayPause: document.getElementById('partyPlayPause'),
        partySync: document.getElementById('partySync'),
        partySettings: document.getElementById('partySettings'),
        leavePartyBtn: document.getElementById('leavePartyBtn'),
        likeBtn: document.getElementById('likeBtn'),
        dislikeBtn: document.getElementById('dislikeBtn'),
        favoriteBtn: document.getElementById('favoriteBtn'),
        watchLaterBtn: document.getElementById('watchLaterBtn'),
        clipBtn: document.getElementById('clipBtn'),
        bookmarkBtn: document.getElementById('bookmarkBtn'),
        loopBtn: document.getElementById('loopBtn'),
        audioBoostBtn: document.getElementById('audioBoostBtn'),
        nightModeBtn: document.getElementById('nightModeBtn'),
        searchInput: document.getElementById('search-input'),
        searchPopup: document.getElementById('search-popup'),
        hamburgerMenu: document.getElementById('hamburger-menu'),
        navMenu: document.getElementById('nav-menu'),
        themeToggleButton: document.getElementById('theme-toggle')
    };

    // Dynamically add date-time display
    console.log('Adding date-time display');
    const datetimeDiv = document.createElement('div');
    datetimeDiv.className = 'datetime-display';
    datetimeDiv.setAttribute('aria-live', 'polite');
    datetimeDiv.innerHTML = '<span id="currentDateTime"></span>';
    document.body.insertBefore(datetimeDiv, document.body.firstChild);
    elements.currentDateTime = document.getElementById('currentDateTime');

    // Validate DOM elements
    console.log('Validating DOM elements');
    for (const [key, element] of Object.entries(elements)) {
        if (!element && !['shareBtn', 'hdDownloadBtn', 'fastDownloadBtn', 'subtitlesDownloadBtn', 'closeModal', 'currentDateTime'].includes(key)) {
            console.warn(`DOM element ${key} not found`);
            showError(`Failed to initialize ${key} component`);
        }
    }

    // Initialize Date and Time Display
    function updateDateTime() {
    const now = new Date();
    // Set initial time to May 16, 2025, 09:01 AM IST
    const initialDate = new Date('2025-05-16T09:01:00+05:30');
    // Calculate the difference between now and the initial date
    const timeDiff = now.getTime() - new Date().setHours(9, 1, 0, 0);
    initialDate.setTime(initialDate.getTime() + timeDiff);

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
    const formattedDateTime = initialDate.toLocaleString('en-US', options);
    if (elements.currentDateTime) {
        elements.currentDateTime.textContent = formattedDateTime;
    }
}

    // Update date and time immediately and every second
    console.log('Starting date-time updates');
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Initialize Video.js player
    function initializePlayer() {
        console.log('Initializing Video.js player');
        try {
            player = videojs(elements.mainPlayer, {
                controls: true,
                autoplay: false,
                preload: 'auto',
                fluid: true,
                responsive: true,
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                html5: {
                    hls: {
                        overrideNative: true
                    }
                }
            });

            // Manually register httpSourceSelector
            try {
                if (!player.httpSourceSelector && window.videojsHttpSourceSelector) {
                    console.log('Registering httpSourceSelector plugin');
                    videojs.registerPlugin('httpSourceSelector', window.videojsHttpSourceSelector);
                    player.httpSourceSelector();
                }
            } catch (err) {
                console.error('Failed to initialize httpSourceSelector:', err);
                showError('Quality selector failed to initialize. Using default quality.');
            }

            // Custom controls
            if (elements.controls) {
                elements.controls.classList.remove('hidden');
                let controlTimeout;
                const showControls = () => {
                    elements.controls.classList.remove('hidden');
                    clearTimeout(controlTimeout);
                    controlTimeout = setTimeout(() => {
                        if (!player.paused()) {
                            elements.controls.classList.add('hidden');
                        }
                    }, controlTimeoutDuration);
                };
                elements.mainPlayer.parentElement.addEventListener('mousemove', showControls);
                elements.mainPlayer.parentElement.addEventListener('touchstart', showControls);
                player.on('play', showControls);
                player.on('pause', () => {
                    elements.controls.classList.remove('hidden');
                });
            }

            // Custom control interactions
            if (elements.fastRewindBtn) {
                elements.fastRewindBtn.addEventListener('click', () => {
                    console.log('Rewind 10 seconds');
                    player.currentTime(player.currentTime() - 10);
                });
            }
            if (elements.fullscreenBtn) {
                elements.fullscreenBtn.addEventListener('click', () => {
                    console.log('Toggle fullscreen');
                    if (!document.fullscreenElement) {
                        player.requestFullscreen();
                        elements.fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen_exit';
                    } else {
                        document.exitFullscreen();
                        elements.fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen';
                    }
                });
            }
            if (elements.pipBtn) {
                elements.pipBtn.addEventListener('click', async () => {
                    console.log('Toggle Picture-in-Picture');
                    try {
                        if (document.pictureInPictureElement) {
                            await document.exitPictureInPicture();
                        } else {
                            await player.requestPictureInPicture();
                        }
                    } catch (err) {
                        console.error('PIP error:', err);
                        showError('Picture-in-Picture not supported or failed.');
                    }
                });
            }
            if (elements.theaterBtn) {
                elements.theaterBtn.addEventListener('click', () => {
                    console.log('Toggle theater mode');
                    elements.mainPlayer.parentElement.classList.toggle('theater-mode');
                });
            }
            if (elements.volumeSlider) {
                elements.volumeSlider.addEventListener('input', () => {
                    const volume = elements.volumeSlider.value / 100;
                    console.log('Volume changed to:', volume);
                    player.volume(volume);
                    elements.volumeBtn.querySelector('.material-icons').textContent = volume === 0 ? 'volume_off' : 'volume_up';
                    elements.volumeSlider.parentElement.querySelector('.volume-percentage').textContent = `${Math.round(volume * 100)}%`;
                });
            }
            if (elements.progressArea) {
                elements.progressArea.addEventListener('click', (e) => {
                    const rect = elements.progressArea.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    console.log('Seek to position:', pos);
                    player.currentTime(pos * player.duration());
                });
            }

            player.on('error', () => {
                const error = player.error();
                console.error('Video player error:', JSON.stringify(error, null, 2));
                let message = 'Failed to load video.';
                if (error) {
                    if (error.message.includes('CORS')) {
                        message = 'Video source blocked by CORS policy.';
                    } else if (error.message.includes('network')) {
                        message = 'Network error loading video. Check your connection.';
                    } else if (error.message.includes('format')) {
                        message = 'Unsupported video format.';
                    } else if (error.code === 2) {
                        message = 'Network timeout or resource unavailable.';
                    }
                }
                if (retryCount < maxRetries && currentFallbackIndex < fallbacks.length) {
                    console.log(`Retrying with fallback ${currentFallbackIndex + 1}/${fallbacks.length}`);
                    retryCount++;
                    player.reset();
                    player.src(fallbacks[currentFallbackIndex]);
                    currentFallbackIndex++;
                } else {
                    showError(`${message} All sources failed. <button id="retryBtn">Retry</button>`);
                    const retryBtn = document.getElementById('retryBtn');
                    if (retryBtn) {
                        retryBtn.addEventListener('click', () => {
                            console.log('Retrying video load');
                            retryCount = 0;
                            currentFallbackIndex = 0;
                            player.reset();
                            player.src(fallbacks[0]);
                            elements.errorOverlay.classList.add('hidden');
                        });
                    }
                }
            });

            player.on('loadedmetadata', () => {
                console.log('Video metadata loaded, duration:', player.duration());
                elements.loadingSpinner.classList.add('hidden');
                updateDuration(player.duration());
                retryCount = 0;
                currentFallbackIndex = 0;
            });

            player.on('play', () => {
                console.log('Video playback started');
                elements.centerControl.querySelector('.material-icons').textContent = 'pause';
                elements.centerControl.setAttribute('aria-label', 'Pause');
                elements.errorOverlay.classList.add('hidden');
                if (watchPartySocket && isHost) {
                    watchPartySocket.send(JSON.stringify({
                        type: 'play',
                        timestamp: player.currentTime(),
                        videoId
                    }));
                }
            });

            player.on('pause', () => {
                console.log('Video playback paused');
                elements.centerControl.querySelector('.material-icons').textContent = 'play_arrow';
                elements.centerControl.setAttribute('aria-label', 'Play');
                if (watchPartySocket && isHost) {
                    watchPartySocket.send(JSON.stringify({
                        type: 'pause',
                        timestamp: player.currentTime(),
                        videoId
                    }));
                }
            });

            const qualityLevels = player.qualityLevels();
            qualityLevels.on('change', () => {
                const selectedLevel = qualityLevels.selectedIndex;
                const qualityText = selectedLevel >= 0 && qualityLevels[selectedLevel].height ? 
                    qualityLevels[selectedLevel].height + 'p' : 'Auto';
                console.log('Quality changed to:', qualityText);
                elements.qualityBadge.textContent = qualityText;
            });

            const captionMenu = document.getElementById('captionMenu');
            const textTracks = player.textTracks();
            textTracks.on('addtrack', () => {
                console.log('Populating captions menu');
                captionMenu.innerHTML = '<li data-caption="off" role="menuitem" tabindex="0" aria-label="Turn off subtitles">Off</li>';
                for (let i = 0; i < textTracks.length; i++) {
                    if (textTracks[i].kind === 'captions') {
                        const li = document.createElement('li');
                        li.setAttribute('role', 'menuitem');
                        li.setAttribute('tabindex', '0');
                        li.textContent = textTracks[i].label || `Track ${i + 1}`;
                        li.dataset.track = textTracks[i].label;
                        li.addEventListener('click', () => {
                            console.log('Selected caption:', textTracks[i].label);
                            for (let j = 0; j < textTracks.length; j++) {
                                textTracks[j].mode = j === i ? 'showing' : 'disabled';
                            }
                            elements.captionsPanel.classList.add('hidden');
                            setActiveMenuItem(captionMenu, li);
                        });
                        li.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === 'Space') {
                                li.click();
                            }
                        });
                        captionMenu.appendChild(li);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to initialize Video.js player:', error);
            showError('Failed to initialize video player.');
        }
    }

    function setupSettingsNavigation() {
        console.log('Setting up settings navigation');
        const settingsPanels = elements.settingsPanel?.querySelectorAll('.settings-panel');
        const menuItems = elements.settingsPanel?.querySelectorAll('ul[role="menu"] li');
        const backArrows = elements.settingsPanel?.querySelectorAll('.back-arrow');

        menuItems?.forEach(item => {
            item.addEventListener('click', () => {
                const label = item.dataset.label;
                console.log('Navigating to settings panel:', label);
                settingsPanels.forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.label === label);
                    panel.setAttribute('aria-expanded', panel.dataset.label === label);
                });
            });
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Space') {
                    item.click();
                }
            });
        });

        backArrows?.forEach(arrow => {
            arrow.addEventListener('click', () => {
                const targetLabel = arrow.dataset.label;
                console.log('Navigating back to settings panel:', targetLabel);
                settingsPanels.forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.label === targetLabel);
                    panel.setAttribute('aria-expanded', panel.dataset.label === targetLabel);
                });
            });
            arrow.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Space') {
                    arrow.click();
                }
            });
        });
    }

    function setActiveMenuItem(menu, selectedItem) {
        console.log('Setting active menu item');
        menu.querySelectorAll('li').forEach(item => {
            item.classList.toggle('active', item === selectedItem);
            item.querySelector('.material-icons')?.remove();
            if (item === selectedItem) {
                const check = document.createElement('span');
                check.className = 'material-icons';
                check.textContent = 'check';
                item.appendChild(check);
            }
        });
    }

    // Watch Party Functionality
    function initializeWatchParty() {
        console.log('Initializing watch party functionality');
        elements.createPartyBtn?.addEventListener('click', () => {
            console.log('Create party button clicked');
            elements.watchPartyPopup.style.display = 'flex';
            elements.partyTabs.forEach(tab => tab.classList.remove('active'));
            elements.partyTabs[0].classList.add('active');
            document.querySelectorAll('.party-tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('[data-tab-content="create"]').classList.add('active');
        });

        elements.joinPartyBtn?.addEventListener('click', () => {
            console.log('Join party button clicked');
            elements.watchPartyPopup.style.display = 'flex';
            elements.partyTabs.forEach(tab => tab.classList.remove('active'));
            elements.partyTabs[1].classList.add('active');
            document.querySelectorAll('.party-tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('[data-tab-content="join"]').classList.add('active');
        });

        elements.closePartyPopup?.addEventListener('click', closeWatchPartyPopup);
        elements.cancelCreateParty?.addEventListener('click', closeWatchPartyPopup);
        elements.cancelJoinParty?.addEventListener('click', closeWatchPartyPopup);

        elements.partyTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                console.log('Party tab clicked:', tab.dataset.tab);
                elements.partyTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.party-tab-content').forEach(content => content.classList.remove('active'));
                document.querySelector(`[data-tab-content="${tab.dataset.tab}"]`).classList.add('active');
            });
        });

        elements.confirmCreateParty?.addEventListener('click', async () => {
            const partyName = elements.partyName.value.trim();
            const password = elements.partyPassword.value.trim();
            console.log('Creating party:', { partyName, password });
            if (!partyName) {
                showNotification('Please enter a party name.');
                return;
            }
            try {
                elements.loadingSpinner.classList.remove('hidden');
                const response = await fetch('/api/watch-party/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoId, partyName, password })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to create party');
                partyId = data.partyId;
                isHost = true;
                initializeWebSocket(data.partyId, password);
                showActivePartyView(data.partyId);
                closeWatchPartyPopup();
            } catch (error) {
                console.error('Failed to create party:', error);
                showError(`Failed to create party: ${error.message}`);
            } finally {
                elements.loadingSpinner.classList.add('hidden');
            }
        });

        elements.confirmJoinParty?.addEventListener('click', async () => {
            const partyCode = elements.partyCode.value.trim();
            const password = elements.joinPassword.value.trim();
            console.log('Joining party:', { partyCode, password });
            if (!partyCode) {
                showNotification('Please enter a party code.');
                return;
            }
            try {
                elements.loadingSpinner.classList.remove('hidden');
                const response = await fetch('/api/watch-party/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partyCode, password, videoId })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to join party');
                partyId = partyCode;
                isHost = false;
                initializeWebSocket(partyCode, password);
                showActivePartyView(partyCode);
                closeWatchPartyPopup();
            } catch (error) {
                console.error('Failed to join party:', error);
                showError(`Failed to join party: ${error.message}`);
            } finally {
                elements.loadingSpinner.classList.add('hidden');
            }
        });

        elements.sendPartyMessage?.addEventListener('click', () => {
            const message = elements.partyChatInput.value.trim();
            console.log('Sending party message:', message);
            if (message && watchPartySocket) {
                watchPartySocket.send(JSON.stringify({
                    type: 'chat',
                    message,
                    userId: 'Anonymous',
                    timestamp: Date.now()
                }));
                elements.partyChatInput.value = '';
            }
        });

        elements.partyPlayPause?.addEventListener('click', () => {
            console.log('Party play/pause clicked');
            if (isHost) {
                if (player.paused()) {
                    player.play();
                } else {
                    player.pause();
                }
            } else {
                showNotification('Only the host can control playback.');
            }
        });

        elements.partySync?.addEventListener('click', () => {
            console.log('Party sync clicked');
            if (isHost && watchPartySocket) {
                watchPartySocket.send(JSON.stringify({
                    type: 'sync',
                    timestamp: player.currentTime(),
                    videoId
                }));
            } else {
                showNotification('Only the host can sync playback.');
            }
        });

        elements.partySettings?.addEventListener('click', () => {
            console.log('Party settings clicked');
            if (isHost) {
                showNotification('Party settings not implemented yet.');
            } else {
                showNotification('Only the host can access party settings.');
            }
        });

        elements.leavePartyBtn?.addEventListener('click', () => {
            console.log('Leaving watch party');
            if (watchPartySocket) {
                watchPartySocket.close();
                watchPartySocket = null;
                partyId = null;
                isHost = false;
                elements.activePartyView.style.display = 'none';
                elements.partyChatMessages.innerHTML = '';
                elements.partyMembersList.innerHTML = '';
                showNotification('You have left the watch party.');
            }
        });
    }

    function initializeWebSocket(partyId, password) {
        console.log('Initializing WebSocket for party:', partyId);
        watchPartySocket = new WebSocket(`ws://your-websocket-server/party/${partyId}?password=${encodeURIComponent(password)}`);

        watchPartySocket.onopen = () => {
            console.log('WebSocket connected for watch party');
            watchPartySocket.send(JSON.stringify({
                type: 'join',
                userId: 'Anonymous',
                videoId
            }));
        };

        watchPartySocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            switch (data.type) {
                case 'chat':
                    appendChatMessage(data.userId, data.message);
                    break;
                case 'play':
                    if (!isHost) {
                        console.log('Syncing play at timestamp:', data.timestamp);
                        player.currentTime(data.timestamp);
                        player.play();
                    }
                    break;
                case 'pause':
                    if (!isHost) {
                        console.log('Syncing pause at timestamp:', data.timestamp);
                        player.currentTime(data.timestamp);
                        player.pause();
                    }
                    break;
                case 'sync':
                    if (!isHost) {
                        console.log('Syncing to timestamp:', data.timestamp);
                        player.currentTime(data.timestamp);
                    }
                    break;
                case 'members':
                    updatePartyMembers(data.members);
                    break;
            }
        };

        watchPartySocket.onclose = () => {
            console.log('WebSocket closed');
            showNotification('Disconnected from watch party.');
            elements.activePartyView.style.display = 'none';
            watchPartySocket = null;
            partyId = null;
            isHost = false;
        };

        watchPartySocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            showError('Watch party connection failed.');
        };
    }

    function appendChatMessage(userId, message) {
        console.log('Appending chat message from:', userId);
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `<strong>${userId}:</strong> ${message}`;
        elements.partyChatMessages.appendChild(messageElement);
        elements.partyChatMessages.scrollTop = elements.partyChatMessages.scrollHeight;
    }

    function updatePartyMembers(members) {
        console.log('Updating party members:', members);
        elements.partyMembersList.innerHTML = members.map(member => `
            <div class="party-member">
                <span>${member.userId}</span>
                ${member.isHost ? '<span class="host-badge">Host</span>' : ''}
            </div>
        `).join('');
    }

    function showActivePartyView(partyCode) {
        console.log('Showing active party view for:', partyCode);
        elements.activePartyView.style.display = 'block';
        document.querySelectorAll('.party-tab-content').forEach(content => content.classList.remove('active'));
        showNotification(`Joined watch party: ${partyCode}`);
    }

    function closeWatchPartyPopup() {
        console.log('Closing watch party popup');
        elements.watchPartyPopup.style.display = 'none';
        elements.partyName.value = '';
        elements.partyPassword.value = '';
        elements.partyCode.value = '';
        elements.joinPassword.value = '';
    }

    // Engagement Buttons
    function initializeEngagementButtons() {
        console.log('Initializing engagement buttons');
        elements.likeBtn?.addEventListener('click', () => {
            console.log('Like button clicked');
            const count = parseInt(elements.likeCount.textContent.replace(/[^0-9]/g, '')) + 1;
            elements.likeCount.textContent = `${(count / 1000).toFixed(1)}K`;
            showNotification('Video liked!');
        });

        elements.dislikeBtn?.addEventListener('click', () => {
            console.log('Dislike button clicked');
            const count = parseInt(elements.dislikeCount.textContent) + 1;
            elements.dislikeCount.textContent = count;
            showNotification('Video disliked.');
        });

        elements.favoriteBtn?.addEventListener('click', () => {
            console.log('Favorite button clicked');
            elements.favoriteBtn.classList.toggle('active');
            showNotification(elements.favoriteBtn.classList.contains('active') ? 'Added to favorites!' : 'Removed from favorites.');
        });

        elements.watchLaterBtn?.addEventListener('click', () => {
            console.log('Watch later button clicked');
            elements.watchLaterBtn.classList.toggle('active');
            showNotification(elements.watchLaterBtn.classList.contains('active') ? 'Added to watch later!' : 'Removed from watch later.');
        });
    }

    // Enhanced Controls
    function initializeEnhancedControls() {
        console.log('Initializing enhanced controls');
        elements.clipBtn?.addEventListener('click', () => {
            console.log('Clip button clicked');
            showNotification('Clip creation not implemented yet.');
        });

        elements.bookmarkBtn?.addEventListener('click', () => {
            console.log('Bookmark button clicked');
            const time = player.currentTime();
            showNotification(`Bookmark added at ${formatTime(time)}`);
            // Add to bookmark panel (not implemented)
        });

        elements.loopBtn?.addEventListener('click', () => {
            console.log('Loop button clicked');
            player.loop(!player.loop());
            elements.loopBtn.classList.toggle('active');
            showNotification(player.loop() ? 'Loop enabled.' : 'Loop disabled.');
        });

        elements.audioBoostBtn?.addEventListener('click', () => {
            console.log('Audio boost button clicked');
            elements.audioBoostBtn.classList.toggle('active');
            showNotification(elements.audioBoostBtn.classList.contains('active') ? 'Audio boost enabled.' : 'Audio boost disabled.');
            // Implement audio boost logic if needed
        });

        elements.nightModeBtn?.addEventListener('click', () => {
            console.log('Night mode button clicked');
            document.body.classList.toggle('night-mode');
            elements.nightModeBtn.classList.toggle('active');
            showNotification(document.body.classList.contains('night-mode') ? 'Night mode enabled.' : 'Night mode disabled.');
        });
    }

    // Search Functionality
    function initializeSearch() {
        console.log('Initializing search functionality');
        elements.searchInput?.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            console.log('Search query:', query);
            if (query.length < 3) {
                elements.searchPopup.classList.remove('active');
                return;
            }
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (response.ok && data.results) {
                    console.log('Search results:', data.results);
                    elements.searchPopup.innerHTML = data.results.map(item => `
                        <a href="/play?video_id=${item.id}" class="search-result">
                            <img src="${item.thumbnail || 'https://via.placeholder.com/50x50'}" alt="${item.title}" loading="lazy">
                            <span>${item.title}</span>
                        </a>
                    `).join('');
                    elements.searchPopup.classList.add('active');
                } else {
                    elements.searchPopup.innerHTML = '<p>No results found.</p>';
                    elements.searchPopup.classList.add('active');
                }
            } catch (error) {
                console.error('Search failed:', error);
                elements.searchPopup.innerHTML = '<p>Error loading results.</p>';
                elements.searchPopup.classList.add('active');
            }
        });

        document.addEventListener('click', (e) => {
            if (!elements.searchInput.contains(e.target) && !elements.searchPopup.contains(e.target)) {
                console.log('Closing search popup');
                elements.searchPopup.classList.remove('active');
            }
        });
    }

    // Mobile Menu Toggle
    function initializeMobileMenu() {
        console.log('Initializing mobile menu');
        elements.hamburgerMenu?.addEventListener('click', () => {
            console.log('Hamburger menu clicked');
            elements.navMenu.classList.toggle('active');
            const isExpanded = elements.navMenu.classList.contains('active');
            elements.hamburgerMenu.setAttribute('aria-expanded', isExpanded);
            elements.hamburgerMenu.classList.toggle('active');
        });
    }

    // Event Listeners
    if (elements.centerControl) {
        elements.centerControl.addEventListener('click', () => {
            console.log('Center control clicked, toggling play/pause');
            player.paused() ? player.play() : player.pause();
        });
    }

    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked, toggling settings panel');
            elements.settingsPanel.classList.toggle('hidden');
            elements.captionsPanel.classList.add('hidden');
        });
    }

    if (elements.captionsBtn) {
        elements.captionsBtn.addEventListener('click', () => {
            console.log('Captions button clicked, toggling captions panel');
            elements.captionsPanel.classList.toggle('hidden');
            elements.settingsPanel.classList.add('hidden');
        });
    }

    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', () => {
            console.log('Share button clicked');
            shareMovie();
        });
    }

    if (elements.hdDownloadBtn) {
        elements.hdDownloadBtn.addEventListener('click', () => {
            console.log('HD download button clicked');
            showDownloadOptions('HD');
        });
    }

    if (elements.fastDownloadBtn) {
        elements.fastDownloadBtn.addEventListener('click', () => {
            console.log('Fast download button clicked');
            showDownloadOptions('Fast');
        });
    }

    if (elements.subtitlesDownloadBtn) {
        elements.subtitlesDownloadBtn.addEventListener('click', () => {
            console.log('Subtitles download button clicked');
            showDownloadOptions('Subtitles');
        });
    }

    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', closeModal);
        elements.closeModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
                console.log('Close modal triggered via keyboard');
                closeModal();
            }
        });
    }

    if (elements.trailerModal) {
        elements.trailerModal.addEventListener('click', (e) => {
            if (e.target === elements.trailerModal) {
                console.log('Trailer modal background clicked, closing modal');
                closeModal();
            }
        });
        elements.trailerModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('Escape key pressed, closing trailer modal');
                closeModal();
            }
        });
    }

    if (elements.reviewForm) {
        elements.reviewForm.addEventListener('submit', handleReviewSubmit);
    }

    if (elements.navArrowLeft && elements.navArrowRight && elements.castGrid) {
        elements.navArrowLeft.addEventListener('click', () => {
            console.log('Cast grid left arrow clicked');
            elements.castGrid.scrollBy({ left: -100, behavior: 'smooth' });
        });
        elements.navArrowRight.addEventListener('click', () => {
            console.log('Cast grid right arrow clicked');
            elements.castGrid.scrollBy({ left: 100, behavior: 'smooth' });
        });
    }

    let selectedRating = 0;
    if (elements.reviewForm) {
        const starRating = elements.reviewForm.querySelector('.star-rating');
        if (starRating) {
            console.log('Setting up star rating for review form');
            const stars = starRating.querySelectorAll('i');
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    selectedRating = parseInt(star.dataset.rating);
                    console.log('Star rating selected:', selectedRating);
                    stars.forEach((s, index) => {
                        s.classList.toggle('bxs-star', index < selectedRating);
                        s.classList.toggle('bx-star', index >= selectedRating);
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

    const playbackSpeedItems = elements.settingsPanel?.querySelectorAll('[data-speed]');
    playbackSpeedItems?.forEach(item => {
        item.addEventListener('click', () => {
            const speed = parseFloat(item.dataset.speed);
            console.log('Playback speed selected:', speed);
            player.playbackRate(speed);
            setActiveMenuItem(item.parentElement, item);
            elements.settingsPanel.classList.add('hidden');
        });
    });

    const autoQualityToggle = document.getElementById('autoQualityToggle');
    if (autoQualityToggle) {
        autoQualityToggle.addEventListener('click', () => {
            console.log('Auto quality toggle clicked');
            player.qualityLevels().levels_.forEach(level => level.enabled = true);
            elements.qualityBadge.textContent = 'Auto';
            elements.settingsPanel.classList.add('hidden');
            setActiveMenuItem(autoQualityToggle.parentElement, autoQualityToggle);
        });
    }

    // Theme Toggle
    console.log('Initializing theme toggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    } else {
        document.body.classList.add('dark-mode'); // Default to dark mode
    }

    elements.themeToggleButton?.addEventListener('click', () => {
        console.log('Theme toggle button clicked');
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark-mode');
        } else {
            localStorage.setItem('theme', 'light-mode');
        }
    });

    async function fetchData(url, sectionId) {
        if (movieCache.has(url)) {
            console.log(`Cache hit for URL: ${url}`);
            return movieCache.get(url);
        }
        console.log(`Fetching data from: ${url}`);
        try {
            elements.loadingSpinner.classList.remove('hidden');
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            console.log(`Data fetched successfully for ${sectionId}`);
            movieCache.set(url, data);
            return data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            showError(`Failed to load ${sectionId}: ${error.message}`);
            return null;
        } finally {
            elements.loadingSpinner.classList.add('hidden');
        }
    }

    async function loadCastInfo() {
        console.log('Loading cast information');
        const data = await fetchData(`/home/details/${videoId}/cast`, 'cast-info');
        if (data && Array.isArray(data) && data.length > 0 && elements.castGrid) {
            console.log(`Rendering ${data.length} cast members`);
            elements.castGrid.innerHTML = data.map(cast => `
                <div class="cast-member">
                    <div class="cast-image-container">
                        <img src="${cast.image || 'https://placehold.co/64x64?text=No+Image'}" alt="${cast.name} portrait" loading="lazy">
                    </div>
                    <p class="cast-name">${cast.name}</p>
                    <p class="cast-role">${cast.role || 'Unknown'}</p>
                </div>
            `).join('');
        } else if (elements.castGrid) {
            console.log('No cast information available');
            elements.castGrid.innerHTML = '<p>No cast available.</p>';
        }
    }

    function updateMainMovie(movie) {
        console.log('Updating movie details for:', movie.title);
        if (elements.movieTitle) elements.movieTitle.textContent = movie.title || 'Unknown Title';
        if (elements.movieDescription) elements.movieDescription.textContent = movie.description || 'No description available.';
        if (elements.movieRating) elements.movieRating.textContent = movie.avgRating !== 'N/A' ? movie.avgRating : (movie.rating !== 'N/A' ? movie.rating : 'PG-13');
        if (elements.movieQuality) elements.movieQuality.textContent = movie.quality || 'HD';
        if (elements.movieYear) elements.movieYear.textContent = movie.release_year !== 'N/A' ? movie.release_year : 'Unknown';
        if (elements.movieDuration) {
            elements.movieDuration.textContent = movie.duration ? formatDuration(movie.duration) : 'Unknown';
        }
        if (elements.movieDirector) elements.movieDirector.textContent = `Director: ${movie.director || 'Unknown'}`;
        if (elements.imdbRating) elements.imdbRating.textContent = movie.imdbRating || 'N/A';
        if (elements.movieGenres) {
            elements.movieGenres.innerHTML = '';
            const genres = movie.genre ? movie.genre.split(',').map(g => g.trim()).filter(g => g) : ['Unknown'];
            console.log('Updating genres:', genres);
            genres.forEach((genre, index) => {
                const link = document.createElement('a');
                link.href = `#${genre.toLowerCase()}`;
                link.textContent = genre;
                link.setAttribute('aria-label', `${genre} genre`);
                elements.movieGenres.appendChild(link);
                if (index < genres.length - 1) elements.movieGenres.appendChild(document.createTextNode(' '));
            });
        }
    }

    async function setupMovie(videoUrl) {
        console.log('Setting up movie with URL:', videoUrl);
        const movieId = videoId;

        const data = await fetchData(`/home/watch/${movieId}`, 'download-options');
        let qualityOptions = [];
        if (data && Array.isArray(data) && data.length > 0) {
            const uniqueOptions = new Map();
            data.forEach(opt => {
                if (opt.url && opt.quality && !uniqueOptions.has(opt.quality)) {
                    uniqueOptions.set(opt.quality, {
                        url: opt.url,
                        quality: opt.quality,
                        height: parseQualityHeight(opt.quality)
                    });
                }
            });
            qualityOptions = Array.from(uniqueOptions.values()).sort((a, b) => b.height - a.height);
        } else {
            console.warn('No quality options available, using default URL');
            qualityOptions = [{ url: videoUrl, quality: 'Auto', height: 0 }];
        }

        let videoLoaded = false;
        let selectedOption = null;

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
            console.log('Trying video source:', proxiedUrl);

            try {
                player.src({
                    src: proxiedUrl,
                    type: getStreamType(option.url)
                });

                await new Promise((resolve, reject) => {
                    let timeout = setTimeout(() => reject(new Error("Video load timeout")), 8000);
                    player.ready(() => {
                        clearTimeout(timeout);
                        resolve();
                    });
                    player.on('error', () => {
                        const error = player.error();
                        reject(error);
                    });
                });

                console.log('Video loaded successfully with quality:', option.quality);
                videoLoaded = true;
                selectedOption = option;
                break;

            } catch (err) {
                console.warn(`Video load failed for ${option.quality}:`, err.message);
                continue;
            }
        }

        if (!videoLoaded) {
            showError("All video qualities failed to load.");
            return;
        }

        // Populate quality menu
        const qualityMenu = document.getElementById('qualityMenu');
        qualityMenu.innerHTML = '';

        qualityOptions.forEach((option) => {
            const li = document.createElement('li');
            li.setAttribute('role', 'menuitem');
            li.setAttribute('tabindex', '0');
            li.setAttribute('aria-label', `Select ${option.quality} quality`);
            li.textContent = option.quality;
            li.dataset.quality = option.quality;
            li.dataset.url = option.url;

            li.addEventListener('click', async () => {
                console.log('Selected quality:', option.quality);
                const newProxiedUrl = `/proxy?url=${encodeURIComponent(option.url)}`;
                player.src({
                    src: newProxiedUrl,
                    type: getStreamType(option.url)
                });
                elements.qualityBadge.textContent = option.quality;
                elements.settingsPanel.classList.add('hidden');
                setActiveMenuItem(qualityMenu, li);
            });

            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Space') {
                    li.click();
                }
            });

            qualityMenu.appendChild(li);
        });

        // Add Auto option
        const autoLi = document.createElement('li');
        autoLi.setAttribute('role', 'menuitem');
        autoLi.setAttribute('tabindex', '0');
        autoLi.setAttribute('aria-label', 'Select Auto quality');
        autoLi.textContent = 'Auto';
        autoLi.dataset.quality = 'Auto';

        autoLi.addEventListener('click', () => {
            console.log('Selected Auto quality');
            player.qualityLevels().levels_.forEach(level => level.enabled = true);
            elements.qualityBadge.textContent = 'Auto';
            elements.settingsPanel.classList.add('hidden');
            setActiveMenuItem(qualityMenu, autoLi);
        });

        autoLi.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
                autoLi.click();
            }
        });

        qualityMenu.appendChild(autoLi);

        elements.qualityBadge.textContent = selectedOption.quality;
        elements.controls.classList.remove('hidden');
    }

    function parseQualityHeight(quality) {
        const match = quality.match(/^(\d+)p$/);
        if (match) return parseInt(match[1]);
        if (quality.toLowerCase() === 'hd') return 720;
        if (quality.toLowerCase() === 'low') return 360;
        return 0;
    }

    function getStreamType(url) {
        if (url.endsWith('.m3u8')) return 'application/x-mpegURL';
        if (url.endsWith('.mp4')) return 'video/mp4';
        return 'application/x-mpegURL';
    }

    async function loadRecommendedVideos() {
        if (isLoading) {
            console.log('Already loading recommended videos, skipping');
            return;
        }
        isLoading = true;

        const recommendedVideos = elements.recommendedVideos;
        if (!recommendedVideos) {
            console.error('Recommended videos container not found');
            showError('Recommended videos section not found.');
            isLoading = false;
            return;
        }

        const castSection = document.querySelector('.cast-section');
        const footer = document.querySelector('.footer');
        if (!castSection || !footer) {
            console.error('Cast section or footer not found');
            showError('Page layout error: Missing cast section or footer.');
            isLoading = false;
            return;
        }

        const castBottom = castSection.getBoundingClientRect().bottom + window.scrollY;
        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        const targetHeight = footerTop - castBottom - 32;
        console.log(`Calculated target height for recommended videos: ${targetHeight}px`);

        recommendedVideos.style.setProperty('--target-height', `${targetHeight}px`);
        recommendedVideos.innerHTML = '';
        currentPage = 1;

        console.log('Loading initial recommended videos');
        const data = await fetchVideos(currentPage);
        if (data.length > 0) {
            console.log(`Rendering ${data.length} videos for page ${currentPage}`);
            renderVideos(data, recommendedVideos);
            currentPage++;
            renderMoreButton(recommendedVideos);
        } else {
            console.log('No videos available');
            recommendedVideos.innerHTML = '<p>No recommended videos available.</p>';
        }

        console.log(`Recommended videos loaded, final scroll height: ${recommendedVideos.scrollHeight}px`);
        isLoading = false;
    }

    async function loadMainMovie() {
        console.log('Loading main movie with videoId:', videoId);
        const data = await fetchData(`/home/details/${videoId}`, 'movie-detail');
        if (data) {
            console.log('Main movie data loaded:', JSON.stringify(data, null, 2));
            updateMainMovie(data);
            elements.movieDetail.dataset.movieId = videoId;
            elements.movieDetail.dataset.movieTitle = data.title;
            initializePlayer();
            setupSettingsNavigation();
            initializeWatchParty();
            initializeEngagementButtons();
            initializeEnhancedControls();
            initializeSearch();
            initializeMobileMenu();
            const videoUrl = data.watchUrl;
            const mediaType = data.media_type?.toLowerCase() || 'movie';

            if (!videoUrl) {
                console.error('Invalid or missing videoUrl:', videoUrl);
                showError('No valid video source found for this movie. Using fallback.');
                currentFallbackIndex = 0;
                retryCount = 0;
                player.reset();
                player.src(fallbacks[currentFallbackIndex]);
                currentFallbackIndex++;
            } else {
                try {
                    switch (mediaType) {
                        case 'movie':
                            await setupMovie(videoUrl);
                            break;
                        case 'm3u8':
                            setupM3u8(videoUrl);
                            break;
                        case 'iframe':
                            setupIframe(videoUrl);
                            break;
                        case 'mp4':
                            setupMp4(videoUrl);
                            break;
                        default:
                            console.warn('Unknown media_type:', mediaType, 'Defaulting to movie');
                            await setupMovie(videoUrl);
                    }
                } catch (error) {
                    console.error('Setup failed for media_type:', mediaType, error);
                    showError('Failed to set up video player. Using fallback.');
                    currentFallbackIndex = 0;
                    retryCount = 0;
                    player.reset();
                    player.src(fallbacks[currentFallbackIndex]);
                    currentFallbackIndex++;
                }
            }

            if (mediaType !== 'iframe') {
                setTimeout(() => {
                    if (!player.hasStarted() && retryCount < maxRetries && currentFallbackIndex < fallbacks.length) {
                        console.warn('Video load timeout, trying next fallback');
                        showError('Video load timeout. Trying next source.');
                        player.reset();
                        player.src(fallbacks[currentFallbackIndex]);
                        currentFallbackIndex++;
                        retryCount++;
                    } else if (!player.hasStarted()) {
                        showError('All video sources failed. Please try again later.');
                    }
                }, 3000);
            }

            await Promise.all([loadRecommendedVideos(), loadUserReviews(), loadCastInfo()]);
        } else {
            console.error('Failed to load main movie data');
            showError('Failed to load movie details.');
        }
    }

    function setupM3u8(videoUrl) {
        console.log('Setting up M3U8 stream with URL:', videoUrl);
        player.src({
            src: videoUrl,
            type: 'application/x-mpegURL'
        });
        player.tech_.hls = {
            withCredentials: false,
            handleManifestRedirects: true
        };
        const qualityLevels = player.qualityLevels();
        qualityLevels.on('change', () => {
            const selectedLevel = qualityLevels.selectedIndex;
            const qualityText = selectedLevel >= 0 ? qualityLevels[selectedLevel].height + 'p' : 'Auto';
            console.log('M3U8 quality changed to:', qualityText);
            elements.qualityBadge.textContent = qualityText;
        });
        elements.controls.classList.remove('hidden');
    }

    function setupIframe(videoUrl) {
        console.log('Setting up iframe with URL:', videoUrl);
        elements.mainPlayer.style.display = 'none';
        let iframeContainer = document.querySelector('.iframe-player-container');
        if (!iframeContainer) {
            iframeContainer = document.createElement('div');
            iframeContainer.className = 'iframe-player-container';
            elements.mainPlayer.parentElement.appendChild(iframeContainer);
        }
        iframeContainer.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" style="width: 100%; height: 100%;"></iframe>`;
        elements.controls.classList.add('hidden');
        elements.centerControl.classList.add('hidden');
        elements.qualityBadge.classList.add('hidden');
    }

    function setupMp4(videoUrl) {
        console.log('Setting up MP4 stream with URL:', videoUrl);
        player.src({
            src: videoUrl,
            type: 'video/mp4'
        });
        if (player.httpSourceSelector) {
            player.httpSourceSelector('disable');
        }
        elements.qualityBadge.textContent = 'MP4';
        elements.controls.classList.remove('hidden');
    }

    async function fetchVideos(page) {
        console.log(`Fetching recommended videos, page ${page}`);
        try {
            const data = await fetchData(`/home/details?category=bollywood&page=${page}`, 'recommended-videos');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Error fetching videos for page ${page}:`, error);
            showError(`Failed to load recommended videos: ${error.message}`);
            return [];
        }
    }

    function renderVideos(data, recommendedVideos) {
        console.log(`Rendering ${data.length} videos`);
        const videosHTML = data.map(video => {
            const videoId = video.watchUrl?.split('v=')[1] || '';
            return `
                <div class="recommended-video" role="listitem" data-video-id="${videoId}">
                    <a href="/play?video_id=${videoId}" class="recommended-video-link" aria-label="View ${video.title}">
                        <div class="recommended-video-thumbnail">
                            <img src="${video.posterUrl || 'https://placehold.co/320x180?text=No+Image'}" alt="${video.title} thumbnail" loading="lazy">
                            ${video.duration && video.duration !== 'N/A' ? `<span class="recommended-video-duration">${formatDuration(video.duration)}</span>` : ''}
                        </div>
                        <div class="recommended-video-info">
                            <h3 class="recommended-video-title">${video.title}</h3>
                            <div class="recommended-video-meta">
                                <span class="recommended-video-rating">
                                    <span class="material-icons">star</span>
                                    ${video.rating !== 'N/A' ? video.rating : video.avgRating !== 'N/A' ? video.avgRating : 'N/A'}
                                </span>
                                <span class="separator">•</span>
                                <span class="recommended-video-quality">${video.quality || 'N/A'}</span>
                                <span class="separator">•</span>
                                <span>${video.release_year || 'Unknown'}</span>
                            </div>
                            <p class="recommended-video-description">${video.description || 'No description available.'}</p>
                        </div>
                    </a>
                </div>
            `;
        }).join('');
        recommendedVideos.insertAdjacentHTML('beforeend', videosHTML);
    }

    function renderMoreButton(recommendedVideos) {
        console.log('Rendering more button');
        const existingButton = recommendedVideos.querySelector('.load-more-btn');
        if (existingButton) existingButton.remove();

        const button = document.createElement('button');
        button.className = 'load-more-btn';
        button.innerHTML = 'More <span class="material-icons">expand_more</span>';
        button.setAttribute('aria-label', 'Load more recommended videos');
        button.addEventListener('click', () => {
            console.log('More button clicked, loading more videos');
            loadMoreVideos();
        });
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
                console.log('More button triggered via keyboard');
                button.click();
            }
        });
        recommendedVideos.appendChild(button);
    }

    async function loadMoreVideos() {
        if (isLoading) {
            console.log('Already loading more videos, skipping');
            return;
        }
        isLoading = true;

        const recommendedVideos = elements.recommendedVideos;
        if (!recommendedVideos) {
            console.error('Recommended videos container not found');
            isLoading = false;
            return;
        }

        console.log(`Loading more videos for page ${currentPage}`);
        const data = await fetchVideos(currentPage);
        if (data.length > 0) {
            console.log(`Rendering ${data.length} videos for page ${currentPage}`);
            renderVideos(data, recommendedVideos);
            currentPage++;
            renderMoreButton(recommendedVideos);
        } else {
            console.log('No more videos available');
            recommendedVideos.insertAdjacentHTML('beforeend', '<p>No more videos available.</p>');
            const button = recommendedVideos.querySelector('.load-more-btn');
            if (button) button.remove();
        }

        isLoading = false;
    }

    async function loadUserReviews() {
        console.log('Loading user reviews');
        const data = await fetchData(`/home/reviews/${videoId}`, 'user-reviews');
        if (data && Array.isArray(data) && data.length > 0 && elements.userReviews) {
            console.log(`Rendering ${data.length} user reviews`);
            elements.userReviews.innerHTML = data.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <span class="reviewer-name">${review.user_name}</span>
                        <div class="review-rating">${renderStars(review.rating)}</div>
                    </div>
                    <p>${review.review_text}</p>
                </div>
            `).join('');
        } else if (elements.userReviews) {
            console.log('No user reviews found');
            elements.userReviews.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        }
    }

    async function handleReviewSubmit(e) {
        e.preventDefault();
        console.log('Handling review submission');
        if (selectedRating === 0) {
            console.log('No rating selected');
            showNotification('Please select a rating.');
            return;
        }
        const reviewText = elements.reviewForm.querySelector('textarea')?.value?.trim();
        if (!reviewText) {
            console.log('No review text provided');
            showNotification('Please provide a review.');
            return;
        }
        try {
            console.log('Submitting review:', { rating: selectedRating, text: reviewText });
            elements.loadingSpinner.classList.remove('hidden');
            const response = await fetch('/home/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: videoId,
                    movie_title: elements.movieDetail?.dataset.movieTitle,
                    user_name: 'Anonymous',
                    user_id: null,
                    rating: selectedRating,
                    review_text: reviewText
                })
            });
            if (!response.ok) throw new Error('Failed to submit review');
            console.log('Review submitted successfully');
            showNotification('Review submitted!');
            elements.reviewForm.reset();
            elements.reviewForm.querySelectorAll('.star-rating i').forEach(star => {
                star.classList.remove('bxs-star');
                star.classList.add('bx-star');
            });
            selectedRating = 0;
            loadUserReviews();
        } catch (error) {
            console.error('Review submission failed:', error);
            showError(`Failed to submit review: ${error.message}`);
        } finally {
            elements.loadingSpinner.classList.add('hidden');
        }
    }

    async function showDownloadOptions(type) {
        console.log(`Showing download options for type: ${type}`);
        let downloadOptions = [];
        try {
            elements.loadingSpinner.classList.remove('hidden');
            const data = await fetchData(`/home/downloads/${videoId}`, 'download-options');
            if (data && Array.isArray(data)) {
                downloadOptions = data.filter(opt => {
                    if (type === 'HD') return opt.quality.includes('HD');
                    if (type === 'Subtitles') return opt.type === 'subtitles';
                    return true;
                });
                console.log('Download options fetched:', downloadOptions);
            }
            if (!downloadOptions.length) {
                console.log('No download options available');
                showNotification('No download options available.');
                return;
            }
        } catch (error) {
            console.error('Failed to load download options:', error);
            showError(`Failed to load download options: ${error.message}`);
            return;
        } finally {
            elements.loadingSpinner.classList.add('hidden');
        }

        const popup = document.createElement('div');
        popup.className = 'download-popup';
        popup.setAttribute('role', 'dialog');
        popup.innerHTML = `
            <div class="download-popup-content">
                <span class="download-popup-close" aria-label="Close download options" tabindex="0">×</span>
                <h2>Download Options</h2>
                ${downloadOptions.map(opt => `
                    <button class="download-quality-btn" data-url="${opt.url}" aria-label="Download ${opt.quality || opt.type}">
                        <i class='bx bx-download'></i> ${opt.quality || opt.type}
                    </button>
                `).join('')}
            </div>
        `;
        document.body.appendChild(popup);

        const closePopup = () => {
            console.log('Closing download options popup');
            popup.remove();
            document.body.style.overflow = 'auto';
        };

        popup.querySelector('.download-popup-close').addEventListener('click', closePopup);
        popup.addEventListener('click', (e) => {
            if (e.target === popup) closePopup();
        });
        popup.querySelectorAll('.download-quality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Download button clicked, URL:', btn.dataset.url);
                window.location.href = btn.dataset.url;
                closePopup();
            });
        });
    }

    function shareMovie() {
        console.log('Initiating movie share');
        const movieTitle = elements.movieDetail?.dataset.movieTitle;
        const shareUrl = `${window.location.origin}/play?video_id=${videoId}`;
        if (navigator.share) {
            console.log('Using native share API');
            navigator.share({
                title: `Watch "${movieTitle}" on Nexfix`,
                text: `Check out "${movieTitle}" on Nexfix`,
                url: shareUrl
            }).catch(err => {
                console.error('Native share failed:', err);
                fallbackShare(shareUrl);
            });
        } else {
            console.log('Falling back to clipboard share');
            fallbackShare(shareUrl);
        }
    }

    function fallbackShare(url) {
        console.log('Copying share URL to clipboard:', url);
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotification('Link copied to clipboard!');
    }

    function closeModal() {
        console.log('Closing trailer modal');
        if (elements.trailerModal) {
            elements.trailerVideo.src = '';
            elements.trailerModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    function formatDuration(minutes) {
        if (!minutes || minutes === 'N/A') return 'Unknown';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function renderStars(rating) {
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

    function updateDuration(seconds) {
        if (elements.movieDuration) {
            const minutes = Math.round(seconds / 60);
            console.log('Updating duration:', formatDuration(minutes));
            elements.movieDuration.textContent = formatDuration(minutes);
        }
    }

    function showNotification(message) {
        console.log('Showing notification:', message);
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.className = 'notification fade-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function showError(message) {
        console.log('Showing error:', message);
        if (elements.errorOverlay && elements.errorMessage) {
            elements.errorMessage.innerHTML = message;
            elements.errorOverlay.classList.remove('hidden');
            setTimeout(() => elements.errorOverlay.classList.add('hidden'), 7000);
        } else {
            console.warn('Error overlay elements not found, falling back to alert');
            alert(message);
        }
    }

    console.log('Starting initialization');
    await loadMainMovie();
    console.log('Script initialization complete');
});