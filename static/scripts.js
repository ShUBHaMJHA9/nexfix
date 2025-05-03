document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) {
        console.error('Video player element not found');
        return;
    }

    const isInIframe = window.self !== window.top;

    // Initialize Video.js with enhanced HLS support
    const player = videojs('mainPlayer', {
        fluid: true,
        responsive: true,
        controls: false,
        preload: 'auto',
        playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4],
        userActions: { doubleClick: false },
        html5: {
            vhs: {
                overrideNative: true,
                withCredentials: false,
                enableLowInitialPlaylist: true,
                smoothQualityChange: true,
                bandwidth: 5000000
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false
        },
        liveui: false
    });

    // Inject CSS for new features
    const style = document.createElement('style');
    style.textContent = `
        .vjs-control-bar { display: none !important; visibility: hidden !important; }
        .controls, .center-control, .quality-badge { transition: opacity 0.3s ease, visibility 0.3s ease; }
        .controls.hidden, .center-control.hidden, .quality-badge.hidden { opacity: 0; visibility: hidden; }
        .zoom-feedback, .speed-feedback, .seek-feedback, .volume-overlay, .brightness-overlay, .screenshot-feedback, .share-feedback { 
            position: absolute; z-index: 100; background: rgba(0,0,0,0.7); color: white; padding: 8px; border-radius: 4px; }
        .annotation { cursor: pointer; transition: opacity 0.3s; }
        .annotation.active { opacity: 1; }
        .context-menu, .keyboard-shortcuts-overlay { z-index: 200; }
        .pulse { animation: pulse 0.5s; }
        .screenshot-btn, .share-btn { transition: transform 0.2s; }
        .screenshot-btn:hover, .share-btn:hover { transform: scale(1.1); }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .iframe-player-container { 
            width: 100%; 
            height: 100%; 
            position: absolute; 
            top: 0; 
            left: 0; 
            z-index: 10; 
        }
        .iframe-player-container iframe { 
            width: 100%; 
            height: 100%; 
            border: none; 
        }
        .iframe-active video { 
            display: none; 
        }
    `;
    document.head.appendChild(style);

    // Reload source on error plugin with enhanced retry logic
    if (!videojs.getPlugin('reloadSourceOnError')) {
        videojs.registerPlugin('reloadSourceOnError', function() {
            this.on('error', () => {
                const sources = this.options_.sources || [];
                const currentSrc = this.currentSource().src;
                const nextSource = sources.find(s => s.src !== currentSrc);
                if (nextSource && retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`Retrying with source: ${nextSource.src}, attempt ${retryCount}`);
                    this.src(nextSource);
                    this.load();
                    this.play().catch(err => console.error('Retry play error:', err));
                } else {
                    console.error('No more sources to try or max retries reached');
                    displayError('Unable to play video: All sources failed');
                    hideLoadingSpinner();
                }
            });
        });
    }
    player.reloadSourceOnError();

    // UI elements
    const ui = {
        videoPlayer: document.querySelector('#videoPlayer'),
        centerControl: document.getElementById('centerControl'),
        controls: videoPlayer.querySelector('.controls'),
        fastRewind: videoPlayer.querySelector('.fast-rewind'),
        fastForward: videoPlayer.querySelector('.fast-forward'),
        volume: videoPlayer.querySelector('.volume'),
        volumeSlider: videoPlayer.querySelector('.volume-slider'),
        volumePercentage: videoPlayer.querySelector('.volume-percentage'),
        fullscreen: videoPlayer.querySelector('.fullscreen'),
        pictureInPicture: videoPlayer.querySelector('.picture_in_picture'),
        theaterMode: videoPlayer.querySelector('.theater-mode'),
        progressArea: document.getElementById('progressArea'),
        progressBar: videoPlayer.querySelector('.progress-bar'),
        bufferedBar: videoPlayer.querySelector('.bufferedBar'),
        current: videoPlayer.querySelector('.current'),
        totalDuration: videoPlayer.querySelector('.duration'),
        autoPlay: videoPlayer.querySelector('.auto-play'),
        settingsBtn: videoPlayer.querySelector('.settingsBtn'),
        captionsBtn: videoPlayer.querySelector('.captionsBtn'),
        audioTrackBtn: document.getElementById('audioTrackBtn'),
        settings: document.getElementById('settingsPanel'),
        captions: document.getElementById('captionsPanel'),
        audioTracks: document.getElementById('audioTracksPanel'),
        captionMenu: document.getElementById('captionMenu'),
        audioTrackMenu: document.getElementById('audioTrackMenu'),
        qualityMenu: document.getElementById('qualityMenu'),
        statsPanel: document.getElementById('statsPanel'),
        qualityBadge: document.getElementById('qualityBadge'),
        volumeOverlay: document.getElementById('volumeOverlay'),
        volumeIndicator: document.getElementById('volumeIndicator'),
        volumeIcon: document.getElementById('volumeIcon'),
        volumeValue: document.getElementById('volumeValue'),
        brightnessOverlay: document.getElementById('brightnessOverlay'),
        brightnessIndicator: document.getElementById('brightnessIndicator'),
        brightnessIcon: document.getElementById('brightnessIcon'),
        brightnessValue: document.getElementById('brightnessValue'),
        videoTitle: document.getElementById('videoTitle'),
        videoDescription: document.getElementById('videoDescription'),
        contentTypeBtn: document.getElementById('contentTypeBtn'),
        contentTypeDropdown: document.getElementById('contentTypeDropdown'),
        currentVolume: document.getElementById('currentVolume'),
        currentBrightness: document.getElementById('currentBrightness'),
        rewindIndicator: document.getElementById('rewindIndicator'),
        rewindValue: document.getElementById('rewindValue'),
        forwardIndicator: document.getElementById('forwardIndicator'),
        forwardValue: document.getElementById('forwardValue'),
        seekFeedbackLeft: document.getElementById('seekFeedbackLeft'),
        seekFeedbackRight: document.getElementById('seekFeedbackRight'),
        speedFeedback: document.getElementById('speedFeedback'),
        zoomFeedback: document.createElement('div'),
        lockOverlay: document.getElementById('lockOverlay'),
        lockBtn: document.getElementById('lockBtn'),
        orientationFeedback: document.getElementById('orientationFeedback'),
        orientationBtn: document.getElementById('orientationBtn'),
        skipAdBtn: document.getElementById('skipAdBtn'),
        skipAdTimer: document.getElementById('skipAdTimer'),
        adOverlay: document.getElementById('adOverlay'),
        adTimer: document.getElementById('adTimer'),
        adText: document.getElementById('adText'),
        hdDownloadBtn: document.getElementById('hdDownloadBtn'),
        fastDownloadBtn: document.getElementById('fastDownloadBtn'),
        liveBtn: document.getElementById('liveBtn'),
        liveTimer: document.getElementById('liveTimer'),
        networkStatus: document.getElementById('networkStatus'),
        bookmarkPanel: document.getElementById('bookmarkPanel'),
        bookmarkMenu: document.getElementById('bookmarkMenu'),
        autoQualityFeedback: document.createElement('div'),
        mainPlayer: document.querySelector('#mainPlayer'),
        iframePlayerContainer: document.getElementById('iframePlayerContainer'),
        annotationPanel: document.getElementById('annotationPanel'),
        annotationMenu: document.getElementById('annotationMenu'),
        playlistPanel: document.getElementById('playlistPanel'),
        playlistMenu: document.getElementById('playlistMenu'),
        downloadQueuePanel: document.getElementById('downloadQueuePanel'),
        downloadQueueMenu: document.getElementById('downloadQueueMenu'),
        annotationOverlay: videoPlayer.querySelector('.annotation-overlay'),
        contextMenu: videoPlayer.querySelector('.context-menu'),
        keyboardShortcutsOverlay: document.getElementById('keyboardShortcutsOverlay'),
        errorOverlay: videoPlayer.querySelector('.error-overlay'),
        loadingSpinner: videoPlayer.querySelector('.loading-spinner'),
        statsToggle: document.getElementById('statsToggle'),
        chapterMarkersToggle: document.getElementById('chapterMarkersToggle'),
        swipeControlsToggle: document.getElementById('swipeControlsToggle'),
        loopToggle: document.getElementById('loopToggle'),
        autoQualityToggle: document.getElementById('autoQualityToggle'),
        addAnnotationBtn: document.getElementById('addAnnotationBtn'),
        customSpeedInput: document.getElementById('customSpeedInput'),
        saveCustomSpeedBtn: document.getElementById('saveCustomSpeedBtn'),
        screenshotBtn: document.getElementById('screenshotBtn'),
        shareBtn: document.getElementById('shareBtn'),
        screenshotFeedback: document.createElement('div'),
        shareFeedback: document.createElement('div')
    };

    // State variables
    let controlTimeout, adCountdownInterval;
    let touchStartX = 0, touchStartY = 0, initialPinchDistance = 0;
    let isSwiping = false, isSpeedHeld = false, isZooming = false, isInteracting = false, isLocked = false;
    let isFullscreen = false, isTheaterMode = false, isOrientationLocked = false, isPipMode = false;
    let lastTapTime = 0, tapCount = 0;
    let brightness = 1, zoomLevel = 1, panX = 0, panY = 0;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    const DOUBLE_TAP_THRESHOLD = 300;
    const TRIPLE_TAP_THRESHOLD = 600;
    const SEEK_AMOUNT = 10;
    const REGION_THRESHOLD = 0.33;
    const SWIPE_MIN_DISTANCE = 30;
    const PINCH_SENSITIVITY = 200;
    const SPEED_HOLD_DURATION = 500;
    const FEEDBACK_DURATION = 1000;
    const CONTROL_HIDE_TIMEOUT = 3000;
    let chapters = [], annotations = [], playlist = [], downloadQueue = [];
    let showChapterMarkers = true, swipeControlsEnabled = true, isLooping = false, autoQualityEnabled = true;
    let bookmarks = [], isIframeMode = false, youtubePlayer = null;
    let manualQualitySelected = true;

    // Initialize feedback elements
    ui.zoomFeedback.className = 'zoom-feedback';
    ui.zoomFeedback.setAttribute('aria-live', 'polite');
    videoPlayer.appendChild(ui.zoomFeedback);

    ui.autoQualityFeedback.className = 'speed-feedback';
    ui.autoQualityFeedback.setAttribute('aria-live', 'polite');
    videoPlayer.appendChild(ui.autoQualityFeedback);

    ui.screenshotFeedback.className = 'screenshot-feedback';
    ui.screenshotFeedback.setAttribute('aria-live', 'polite');
    videoPlayer.appendChild(ui.screenshotFeedback);

    ui.shareFeedback.className = 'share-feedback';
    ui.shareFeedback.setAttribute('aria-live', 'polite');
    videoPlayer.appendChild(ui.shareFeedback);

    // Load YouTube IFrame API
    const loadYouTubeAPI = () => {
        return new Promise((resolve, reject) => {
            if (window.YT && window.YT.Player) return resolve();
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = resolve;
        });
    };

    // Preload YouTube API
    loadYouTubeAPI().catch(err => console.error(err));

    // Utility functions
    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}` : `${m}:${s < 10 ? '0' + s : s}`;
    };

    const isFullscreenActive = () => {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    };

    const togglePanel = (panel, show) => {
        if (!panel) return;
        const panels = [
            ui.settings, ui.captions, ui.audioTracks, ui.bookmarkPanel,
            ui.annotationPanel, ui.playlistPanel, ui.downloadQueuePanel,
            ui.contextMenu, ui.keyboardShortcutsOverlay
        ].filter(p => p && p !== panel);
        if (show) {
            panels.forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none';
            });
            panel.classList.add('active');
            panel.style.display = 'block';
        } else {
            panel.classList.remove('active');
            panel.style.display = 'none';
        }
        showControls();
    };

    const showControls = () => {
        if (isLocked) return;
        const elements = [ui.controls, ui.centerControl, ui.qualityBadge];
        elements.forEach(el => {
            if (el) {
                el.classList.add('active');
                el.classList.remove('hidden');
                el.style.display = el === ui.qualityBadge ? 'block' : 'flex';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
        });
        videoPlayer.style.cursor = 'auto';
        clearTimeout(controlTimeout);
        if (!player.paused() && !isInIframe) {
            controlTimeout = setTimeout(hideControls, CONTROL_HIDE_TIMEOUT);
        }
    };

    const hideControls = () => {
        if (isLocked || isSwiping || isZooming || isSpeedHeld || isInteracting) return;
        const panels = [
            ui.settings, ui.captions, ui.audioTracks, ui.bookmarkPanel,
            ui.annotationPanel, ui.playlistPanel, ui.downloadQueuePanel,
            ui.contextMenu, ui.keyboardShortcutsOverlay
        ];
        if (panels.some(panel => panel?.classList.contains('active'))) return;
        if (player.paused() || isIframeMode) return;
        const elements = [ui.controls, ui.centerControl, ui.qualityBadge];
        elements.forEach(el => {
            if (el) {
                el.classList.remove('active');
                el.classList.add('hidden');
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
            }
        });
        videoPlayer.style.cursor = 'none';
    };

    const togglePlay = () => {
        if (isLocked) return;
    
        const updateUI = (isPlaying) => {
            videoPlayer?.classList.toggle('playing', isPlaying);
            videoPlayer?.classList.toggle('paused', !isPlaying);
            if (ui.centerControl) {
                ui.centerControl.innerHTML = `<span class="material-icons">${isPlaying ? 'pause' : 'play_arrow'}</span>`;
                ui.centerControl.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
                ui.centerControl.classList.toggle('loading', false);
                ui.centerControl.classList.toggle('active', !isPlaying);
            }
        };
    
        if (isIframeMode && youtubePlayer) {
            const state = youtubePlayer.getPlayerState();
            const isPlaying = state === YT.PlayerState.PLAYING;
    
            if (isPlaying) {
                youtubePlayer.pauseVideo();
            } else {
                youtubePlayer.playVideo();
            }
            updateUI(!isPlaying);
        } else if (player) {
            if (player.paused()) {
                player.play().catch(err => {
                    console.error('Play error:', err);
                    displayError('Failed to play video');
                });
                updateUI(true);
            } else {
                player.pause();
                updateUI(false);
            }
        }
    
        showControls(); // Always show controls after toggle
    };
    
    const toggleLock = () => {
        isLocked = !isLocked;
    
        if (ui.lockOverlay) {
            ui.lockOverlay.classList.toggle('active', isLocked);
            ui.lockOverlay.innerHTML = isLocked
                ? '<span class="material-icons">lock</span> Locked'
                : '';
        }
    
        if (ui.lockBtn) {
            ui.lockBtn.innerHTML = `<span class="material-icons">${isLocked ? 'lock' : 'lock_open'}</span>`;
            ui.lockBtn.setAttribute('aria-label', isLocked ? 'Unlock controls' : 'Lock controls');
        }
    
        isLocked ? hideControls() : showControls();
    };
    
    
    const toggleOrientationLock = async () => {
        // Prevent orientation lock in iframe mode
        if (isIframeMode) {
            displayError('Orientation lock is unavailable in iframe mode');
            return;
        }
    
        try {
            // Check for orientation API support
            if (!screen.orientation || typeof screen.orientation.lock !== 'function' || typeof screen.orientation.unlock !== 'function') {
                displayError('Orientation lock is not supported in this browser');
                if (ui.orientationBtn) {
                    ui.orientationBtn.disabled = true;
                    ui.orientationBtn.setAttribute('aria-label', 'Orientation lock not supported');
                }
                return;
            }
    
            // Check for fullscreen mode (required by some browsers)
            const isFullscreen = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            if (!isFullscreen) {
                displayError('Please enter fullscreen mode to lock orientation');
                return;
            }
    
            if (!isOrientationLocked) {
                // Lock orientation to landscape
                try {
                    await screen.orientation.lock('landscape');
                    isOrientationLocked = true;
                    if (ui.orientationFeedback) {
                        clearTimeout(feedbackTimeout);
                        ui.orientationFeedback.textContent = 'Orientation Locked';
                        ui.orientationFeedback.classList.add('active');
                        feedbackTimeout = setTimeout(
                            () => ui.orientationFeedback.classList.remove('active'),
                            FEEDBACK_DURATION || 3000
                        );
                    }
                } catch (lockErr) {
                    throw new Error(`Failed to lock orientation: ${lockErr.message}`);
                }
            } else {
                // Unlock orientation
                try {
                    await screen.orientation.unlock();
                    isOrientationLocked = false;
                    if (ui.orientationFeedback) {
                        clearTimeout(feedbackTimeout);
                        ui.orientationFeedback.textContent = 'Orientation Unlocked';
                        ui.orientationFeedback.classList.add('active');
                        feedbackTimeout = setTimeout(
                            () => ui.orientationFeedback.classList.remove('active'),
                            FEEDBACK_DURATION || 3000
                        );
                    }
                } catch (unlockErr) {
                    throw new Error(`Failed to unlock orientation: ${unlockErr.message}`);
                }
            }
    
            // Update button UI
            if (ui.orientationBtn) {
                ui.orientationBtn.innerHTML = `<span class="material-icons">${
                    isOrientationLocked ? 'screen_lock_rotation' : 'screen_rotation'
                }</span>`;
                ui.orientationBtn.setAttribute(
                    'aria-label',
                    isOrientationLocked ? 'Unlock orientation' : 'Lock orientation'
                );
            }
    
            // Show player controls
            showControls();
        } catch (err) {
            console.error('Orientation lock error:', err);
            let errorMessage = 'Failed to toggle orientation lock';
            if (err.name === 'NotSupportedError') {
                errorMessage = 'Orientation lock is not supported on this device';
            } else if (err.name === 'SecurityError') {
                errorMessage = 'Orientation lock requires fullscreen mode';
            }
            displayError(errorMessage);
        }
    };
    const toggleTheaterMode = () => {
        if (isLocked || isIframeMode) return;
        isTheaterMode = !isTheaterMode;
        document.body.classList.toggle('theater-mode', isTheaterMode);
        if (ui.theaterMode) {
            ui.theaterMode.innerHTML = `<span class="material-icons">${isTheaterMode ? 'theater_comedy_off' : 'theater_comedy'}</span>`;
            ui.theaterMode.setAttribute('aria-label', isTheaterMode ? 'Exit theater mode' : 'Enter theater mode');
        }
        showControls();
    };

    const togglePipMode = async () => {
        if (isLocked || isIframeMode || !document.pictureInPictureEnabled) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                isPipMode = false;
                videoPlayer.classList.remove('pip-mode');
            } else {
                await player.requestPictureInPicture();
                isPipMode = true;
                videoPlayer.classList.add('pip-mode');
            }
            if (ui.pictureInPicture) {
                ui.pictureInPicture.innerHTML = `<span class="material-icons">${isPipMode ? 'picture_in_picture_alt_off' : 'picture_in_picture_alt'}</span>`;
                ui.pictureInPicture.setAttribute('aria-label', isPipMode ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture');
            }
            showControls();
        } catch (err) {
            console.error('Picture-in-Picture error:', err);
            displayError('Failed to toggle Picture-in-Picture');
        }
    };

    const toggleFullscreen = async () => {
        if (isLocked) return;
    
        const el = videoPlayer;
    
        const requestFullscreen = el.requestFullscreen ||
            el.webkitRequestFullscreen ||
            el.mozRequestFullScreen ||
            el.msRequestFullscreen;
    
        const exitFullscreen = document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen;
    
        const fullscreenElement = document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;
    
        try {
            if (!fullscreenElement) {
                // Request fullscreen
                if (requestFullscreen) {
                    await requestFullscreen.call(el);
                } else {
                    throw new Error('Fullscreen API not supported');
                }
    
                // Try locking orientation to portrait (for MX-style vertical fullscreen)
                if (screen.orientation && screen.orientation.lock) {
                    try {
                        await screen.orientation.lock('portrait-primary');
                    } catch (orientationErr) {
                        console.warn('Orientation lock failed:', orientationErr.message);
                    }
                }
    
                el.classList.add('fullscreen-mode');
                hideControls();
    
            } else {
                // Exit fullscreen
                if (exitFullscreen) {
                    await exitFullscreen.call(document);
                } else {
                    throw new Error('Exit Fullscreen API not supported');
                }
    
                // Unlock orientation if possible
                if (screen.orientation && screen.orientation.unlock) {
                    try {
                        await screen.orientation.unlock();
                    } catch (unlockErr) {
                        console.warn('Orientation unlock failed:', unlockErr.message);
                    }
                }
    
                el.classList.remove('fullscreen-mode');
            }
    
            showControls();
        } catch (err) {
            console.error('Fullscreen toggle failed:', err);
            displayError('Failed to toggle fullscreen');
        }
    };
    
    const setVolume = (vol) => {
        if (isLocked || isIframeMode) return;
        vol = Math.max(0, Math.min(1, vol));
        player.volume(vol);
        localStorage.setItem('volume', vol);
        document.documentElement.style.setProperty('--volume', vol * 100);
        if (ui.volumeSlider) ui.volumeSlider.value = vol * 100;
        if (ui.volumePercentage) ui.volumePercentage.textContent = `${Math.round(vol * 100)}%`;
        if (ui.currentVolume) ui.currentVolume.textContent = Math.round(vol * 100);
        if (ui.volumeValue) ui.volumeValue.textContent = `${Math.round(vol * 100)}%`;
        const icon = vol === 0 ? 'volume_off' : vol < 0.4 ? 'volume_down' : 'volume_up';
        if (ui.volume?.querySelector('span')) ui.volume.querySelector('span').textContent = icon;
        if (ui.volumeIcon) ui.volumeIcon.textContent = icon;
        showControls();
    };

    const setBrightness = (value) => {
        if (isLocked || isIframeMode) return;
        brightness = Math.max(0, Math.min(2, value));
        videoPlayer.style.filter = `brightness(${brightness})`;
        localStorage.setItem('brightness', brightness);
        document.documentElement.style.setProperty('--brightness', brightness * 100);
        if (ui.brightnessValue) ui.brightnessValue.textContent = `${Math.round(brightness * 100)}%`;
        if (ui.currentBrightness) ui.currentBrightness.textContent = Math.round(brightness * 100);
        const icon = brightness < 0.5 ? 'brightness_3' : brightness < 1 ? 'brightness_5' : 'brightness_7';
        if (ui.brightnessIcon) ui.brightnessIcon.textContent = icon;
        showControls();
    };

    const setZoom = (level) => {
        if (isLocked || isIframeMode) return;
        zoomLevel = Math.max(1, Math.min(3, level));
        const videoEl = player.el().querySelector('video');
        if (zoomLevel > 1) {
            const rect = videoPlayer.getBoundingClientRect();
            const maxPanX = (rect.width * (zoomLevel - 1)) / (2 * zoomLevel);
            const maxPanY = (rect.height * (zoomLevel - 1)) / (2 * zoomLevel);
            panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
            panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
        } else {
            panX = 0;
            panY = 0;
        }
        videoEl.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
        videoEl.style.transformOrigin = 'center center';
        if (ui.zoomFeedback) {
            ui.zoomFeedback.textContent = `${zoomLevel.toFixed(1)}x`;
            ui.zoomFeedback.classList.add('active');
            setTimeout(() => ui.zoomFeedback.classList.remove('active'), FEEDBACK_DURATION);
        }
        showControls();
    };

    const captureScreenshot = () => {
        if (isLocked || isIframeMode) return;
        try {
            const video = player.el().querySelector('video');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `screenshot-${Date.now()}.png`;
            link.click();
            if (ui.screenshotFeedback) {
                ui.screenshotFeedback.textContent = 'Screenshot captured!';
                ui.screenshotFeedback.classList.add('active');
                setTimeout(() => ui.screenshotFeedback.classList.remove('active'), FEEDBACK_DURATION);
            }
        } catch (err) {
            console.error('Screenshot capture failed:', err);
            displayError('Failed to capture screenshot');
        }
        showControls();
    };

    const shareVideo = () => {
        if (isLocked) return;
        const videoId = new URLSearchParams(window.location.search).get('video_id');
        const shareUrl = `${window.location.origin}/video?video_id=${videoId}`;
        const shareData = {
            title: ui.videoTitle?.textContent || 'Video',
            text: ui.videoDescription?.textContent || 'Check out this video!',
            url: shareUrl
        };
        try {
            if (navigator.share && !isInIframe) {
                navigator.share(shareData).catch(err => {
                    console.error('Native share failed:', err);
                    fallbackShare(shareData);
                });
            } else {
                fallbackShare(shareData);
            }
            if (ui.shareFeedback) {
                ui.shareFeedback.textContent = 'Share options opened';
                ui.shareFeedback.classList.add('active');
                setTimeout(() => ui.shareFeedback.classList.remove('active'), FEEDBACK_DURATION);
            }
        } catch (err) {
            console.error('Share failed:', err);
            displayError('Failed to share video');
        }
        showControls();
    };

    const fallbackShare = (shareData) => {
        const encodedUrl = encodeURIComponent(shareData.url);
        const encodedTitle = encodeURIComponent(shareData.title);
        const shareOptions = [
            { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
            { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
            { name: 'Copy Link', action: () => {
                navigator.clipboard.writeText(shareData.url).then(() => {
                    if (ui.shareFeedback) {
                        ui.shareFeedback.textContent = 'Link copied to clipboard';
                        ui.shareFeedback.classList.add('active');
                        setTimeout(() => ui.shareFeedback.classList.remove('active'), FEEDBACK_DURATION);
                    }
                });
            }}
        ];
        const menu = document.createElement('div');
        menu.className = 'share-menu';
        menu.style.cssText = 'position: absolute; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 4px; z-index: 200;';
        menu.innerHTML = shareOptions.map(opt => `
            <button class="share-option" data-action="${opt.name}" style="display: block; color: white; background: none; border: none; padding: 5px 10px; cursor: pointer;">
                ${opt.name}
            </button>
        `).join('');
        videoPlayer.appendChild(menu);
        const rect = ui.shareBtn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left}px`;
        const closeMenu = () => {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        };
        menu.addEventListener('click', (e) => {
            const btn = e.target.closest('.share-option');
            if (!btn) return;
            const action = btn.dataset.action;
            const option = shareOptions.find(opt => opt.name === action);
            if (option.url) window.open(option.url, '_blank');
            else if (option.action) option.action();
            closeMenu();
        });
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    };

    const showSwipeFeedback = (type, value) => {
        if (!isFullscreenActive() || isLocked || isIframeMode) return;
        const overlay = type === 'volume' ? ui.volumeOverlay : ui.brightnessOverlay;
        const indicator = type === 'volume' ? ui.volumeIndicator : ui.brightnessIndicator;
        if (overlay && indicator) {
            indicator.textContent = `${value}%`;
            overlay.classList.add('active');
            indicator.classList.add('active');
            setTimeout(() => {
                overlay.classList.remove('active');
                indicator.classList.remove('active');
            }, FEEDBACK_DURATION);
        }
        showControls();
    };

    const showSeekFeedback = (direction, value) => {
        if (isLocked) return;
        const feedback = direction === 'left' ? ui.seekFeedbackLeft : ui.seekFeedbackRight;
        const indicator = direction === 'left' ? ui.rewindIndicator : ui.forwardIndicator;
        const indicatorValue = direction === 'left' ? ui.rewindValue : ui.forwardValue;
        if (feedback && indicator && indicatorValue) {
            feedback.textContent = `${value > 0 ? '+' : ''}${value}s`;
            indicatorValue.textContent = `${value > 0 ? '+' : ''}${value}s`;
            feedback.classList.add('active');
            indicator.classList.add('active');
            setTimeout(() => {
                feedback.classList.remove('active');
                indicator.classList.remove('active');
            }, FEEDBACK_DURATION);
        }
        showControls();
    };

    const showSpeedFeedback = (speed) => {
        if (isLocked || isIframeMode) return;
        if (ui.speedFeedback) {
            ui.speedFeedback.textContent = `${speed}x`;
            ui.speedFeedback.classList.add('active');
            setTimeout(() => ui.speedFeedback.classList.remove('active'), FEEDBACK_DURATION);
        }
        showControls();
    };

    const showAutoQualityFeedback = (quality) => {
        if (isIframeMode) return;
        if (ui.autoQualityFeedback) {
            ui.autoQualityFeedback.textContent = `Quality: ${quality}`;
            ui.autoQualityFeedback.classList.add('active');
            setTimeout(() => ui.autoQualityFeedback.classList.remove('active'), FEEDBACK_DURATION);
        }
        showControls();
    };

    const showLoadingSpinner = () => {
        if (ui.loadingSpinner) ui.loadingSpinner.classList.add('active');
    };

    const hideLoadingSpinner = () => {
        if (ui.loadingSpinner) ui.loadingSpinner.classList.remove('active');
    };

    const displayError = (message) => {
        if (ui.errorOverlay) {
            ui.errorOverlay.querySelector('.error-message').innerHTML = `<span class="material-icons">error</span> ${message}`;
            ui.errorOverlay.classList.add('active');
            setTimeout(() => ui.errorOverlay.classList.remove('active'), 5000);
        }
        if (ui.videoTitle) ui.videoTitle.textContent = 'Error Loading Video';
        if (ui.videoDescription) ui.videoDescription.textContent = message;
        player.error({ code: 4, message });
        hideLoadingSpinner();
    };

    const startAd = () => {
        if (!ui.skipAdBtn || !ui.skipAdTimer || !ui.adOverlay || !ui.adTimer || isLocked || isIframeMode) return;
        videoPlayer.classList.add('vjs-ad-playing');
        ui.adOverlay.classList.add('active');
        ui.adText.textContent = 'Advertisement';
        ui.skipAdBtn.classList.add('visible');
        ui.skipAdBtn.disabled = true;
        let timeLeft = 5;
        ui.skipAdTimer.textContent = `Skip in ${timeLeft}s`;
        ui.adTimer.textContent = `${timeLeft}s`;
        clearInterval(adCountdownInterval);
        adCountdownInterval = setInterval(() => {
            timeLeft--;
            ui.skipAdTimer.textContent = `Skip in ${timeLeft}s`;
            ui.adTimer.textContent = `${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(adCountdownInterval);
                ui.skipAdBtn.disabled = false;
                ui.skipAdTimer.textContent = `Skip Ad`;
            }
        }, 1000);
        const skipHandler = () => {
            videoPlayer.classList.remove('vjs-ad-playing');
            ui.adOverlay.classList.remove('active');
            ui.adText.classList.remove('active');
            ui.skipAdBtn.classList.remove('visible');
            clearInterval(adCountdownInterval);
            player.play().catch(() => {});
            ui.skipAdBtn.removeEventListener('click', skipHandler);
        };
        ui.skipAdBtn.addEventListener('click', skipHandler);
        ui.skipAdBtn._skipHandler = skipHandler;
    };

    const showLiveIndicator = (isLive) => {
        if (!ui.liveBtn || !ui.liveTimer || isIframeMode) return;
        videoPlayer.classList.toggle('vjs-live', isLive);
        ui.liveBtn.style.display = isLive ? 'inline-flex' : 'none';
        if (isLive) {
            let liveSeconds = 0;
            setInterval(() => {
                liveSeconds++;
                ui.liveTimer.textContent = formatTime(liveSeconds);
            }, 1000);
            ui.liveBtn.addEventListener('click', () => {
                if (player.liveTracker) {
                    player.liveTracker.seekToLiveEdge();
                    ui.liveBtn.classList.add('live-edge');
                }
            });
        }
    };

    const addChapterMarkers = () => {
        if (!ui.progressArea || isIframeMode) return;
        document.querySelectorAll('.chapter-marker').forEach(marker => marker.remove());
        if (!showChapterMarkers || !chapters.length) return;
        const duration = player.duration();
        if (!duration) return;
        chapters.forEach(chapter => {
            const marker = document.createElement('div');
            marker.className = 'chapter-marker';
            marker.style.left = `${(chapter.time / duration) * 100}%`;
            const tooltip = document.createElement('div');
            tooltip.className = 'chapter-tooltip';
            tooltip.textContent = chapter.title;
            marker.appendChild(tooltip);
            marker.setAttribute('aria-label', `Jump to ${chapter.title} at ${formatTime(chapter.time)}`);
            marker.addEventListener('click', (e) => {
                if (isLocked) return;
                e.stopPropagation();
                player.currentTime(chapter.time);
                showControls();
            });
            ui.progressArea.appendChild(marker);
        });
    };

    const manageAnnotations = () => {
        if (!ui.annotationOverlay || isIframeMode) return;
        const currentTime = player.currentTime();
        ui.annotationOverlay.querySelectorAll('.annotation').forEach(annotation => annotation.remove());
        annotations.forEach(annotation => {
            if (currentTime >= annotation.startTime && currentTime <= annotation.endTime) {
                const div = document.createElement('div');
                div.className = 'annotation';
                div.style.top = `${annotation.y}%`;
                div.style.left = `${annotation.x}%`;
                div.textContent = annotation.text;
                div.setAttribute('aria-label', `Annotation: ${annotation.text}`);
                div.addEventListener('click', () => {
                    if (isLocked) return;
                    player.currentTime(annotation.startTime);
                    if (annotation.action) window.location.href = annotation.action;
                    showControls();
                });
                setTimeout(() => div.classList.add('active'), 100);
                ui.annotationOverlay.appendChild(div);
            }
        });
        if (ui.annotationMenu) {
            ui.annotationMenu.innerHTML = annotations.length ? annotations.map((a, i) => `
                <li data-index="${i}" role="menuitem">
                    ${a.text} (${formatTime(a.startTime)})
                    <span class="material-icons" data-action="edit">edit</span>
                    <span class="material-icons" data-action="delete">delete</span>
                </li>
            `).join('') : '<li role="menuitem">No annotations</li>';
        }
    };

    const updatePlaylistMenu = () => {
        if (!ui.playlistMenu) return;
        ui.playlistMenu.innerHTML = playlist.length ? playlist.map((item, i) => `
            <li data-index="${i}" role="menuitem" class="${item.active ? 'active' : ''}">
                ${item.title}
                <span class="material-icons" data-action="play">${item.active ? 'check' : 'play_arrow'}</span>
                <span class="material-icons" data-action="remove">delete</span>
            </li>
        `).join('') : '<li role="menuitem">No playlist items</li>';
    };

    const updateDownloadQueueMenu = () => {
        if (!ui.downloadQueueMenu) return;
        ui.downloadQueueMenu.innerHTML = downloadQueue.length ? downloadQueue.map((item, i) => `
            <li data-index="${i}" role="menuitem">
                ${item.title} (${item.status})
                <div class="download-progress" style="--download-progress: ${item.progress}%"></div>
                <span class="material-icons" data-action="cancel">cancel</span>
            </li>
        `).join('') : '<li role="menuitem">No downloads in queue</li>';
    };

    const showContextMenu = (e) => {
        if (isLocked || !ui.contextMenu) return;
        e.preventDefault();
        const rect = videoPlayer.getBoundingClientRect();
        ui.contextMenu.style.top = `${e.clientY - rect.top}px`;
        ui.contextMenu.style.left = `${e.clientX - rect.left}px`;
        ui.contextMenu.innerHTML = `
            <ul>
                <li data-action="play-pause">Play/Pause</li>
                <li data-action="add-bookmark">Add Bookmark</li>
                <li data-action="add-annotation">Add Annotation</li>
                <li data-action="toggle-pip">Toggle Picture-in-Picture</li>
                <li data-action="toggle-fullscreen">Toggle Fullscreen</li>
                <li data-action="show-shortcuts">Show Keyboard Shortcuts</li>
                <li data-action="capture-screenshot">Capture Screenshot</li>
                <li data-action="share-video">Share Video</li>
            </ul>
        `;
        ui.contextMenu.classList.add('active');
        showControls();
    };

    const hideContextMenu = () => {
        if (ui.contextMenu) ui.contextMenu.classList.remove('active');
    };

    const showKeyboardShortcuts = () => {
        if (!ui.keyboardShortcutsOverlay) return;
        ui.keyboardShortcutsOverlay.innerHTML = `
            <h2>Keyboard Shortcuts</h2>
            <ul>
                <li><span>Play/Pause</span><kbd>Space</kbd></li>
                <li><span>Mute/Unmute</span><kbd>M</kbd></li>
                <li><span>Fullscreen</span><kbd>F</kbd></li>
                <li><span>Add Bookmark</span><kbd>B</kbd></li>
                <li><span>Lock Controls</span><kbd>L</kbd></li>
                <li><span>Theater Mode</span><kbd>T</kbd></li>
                <li><span>Seek Backward</span><kbd>←</kbd></li>
                <li><span>Seek Forward</span><kbd>→</kbd></li>
                <li><span>Volume Up</span><kbd>↑</kbd></li>
                <li><span>Volume Down</span><kbd>↓</kbd></li>
                <li><span>Show Shortcuts</span><kbd>S</kbd></li>
                <li><span>Screenshot</span><kbd>C</kbd></li>
                <li><span>Share</span><kbd>H</kbd></li>
            </ul>
        `;
        ui.keyboardShortcutsOverlay.classList.add('active');
        showControls();
    };

    const getSourceType = (sourceUrl, type) => {
        if (type) return type;
        const url = sourceUrl.toLowerCase();
        if (url.includes('.m3u8')) return 'application/x-mpegURL';
        if (url.includes('.ts')) return 'video/mp2t';
        if (url.includes('.mpd')) return 'application/dash+xml';
        if (url.includes('.webm')) return 'video/webm';
        if (url.includes('.mp4')) return 'video/mp4';
        if (url.includes('.ogv')) return 'video/ogg';
        if (url.includes('.flv')) return 'video/x-flv';
        if (url.includes('embed') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('twitch.tv')) return 'iframe';
        return 'video/mp4';
    };

    const updateNetworkStatus = () => {
        if (!ui.networkStatus) return;
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        ui.networkStatus.textContent = connection ? `${connection.effectiveType} (${connection.downlink} Mbps)` : 'Unknown';
    };

    const adjustQualityBasedOnNetwork = (sources) => {
        if (!autoQualityEnabled || !sources?.length || sources.some(src => src.type === 'iframe') || isIframeMode || manualQualitySelected) return;
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        let bandwidth = 5000000;
        if (connection && connection.downlink) bandwidth = connection.downlink * 1000000;
        const qualityOrder = ['1080p', '720p', '480p', '360p', '240p', 'auto'];
        const currentQuality = ui.qualityBadge?.textContent || 'auto';
        let targetSource = sources[0];
        const qualityBandwidthMap = {
            '1080p': 8000000,
            '720p': 5000000,
            '480p': 2500000,
            '360p': 1000000,
            '240p': 500000,
            'auto': 0
        };
        for (const quality of qualityOrder) {
            if (qualityBandwidthMap[quality] <= bandwidth) {
                const source = sources.find(s => s.quality === quality);
                if (source) {
                    targetSource = source;
                    break;
                }
            }
        }
        if (targetSource.quality !== currentQuality) {
            const currentTime = player.currentTime();
            try {
                player.src({ src: targetSource.url, type: getSourceType(targetSource.url, targetSource.type) });
                player.currentTime(currentTime);
                player.play().catch(() => {});
                if (ui.qualityBadge) {
                    ui.qualityBadge.textContent = targetSource.quality;
                    ui.qualityBadge.classList.add('pulse');
                    setTimeout(() => ui.qualityBadge.classList.remove('pulse'), 500);
                }
                showAutoQualityFeedback(targetSource.quality);
            } catch (err) {
                console.error('Auto quality adjustment failed:', err);
                displayError('Failed to adjust quality');
            }
        }
    };

    const loadBookmarks = (videoId) => {
        try {
            const stored = localStorage.getItem(`bookmarks_${videoId}`);
            bookmarks = stored ? JSON.parse(stored) : [];
            updateBookmarkMenu();
        } catch (err) {
            console.error('Failed to load bookmarks:', err);
            bookmarks = [];
            updateBookmarkMenu();
        }
    };

    const saveBookmark = (time, title = `Bookmark at ${formatTime(time)}`) => {
        if (isIframeMode) return;
        const videoId = new URLSearchParams(window.location.search).get('video_id');
        bookmarks.push({ time, title });
        try {
            localStorage.setItem(`bookmarks_${videoId}`, JSON.stringify(bookmarks));
            updateBookmarkMenu();
        } catch (err) {
            console.error('Failed to save bookmark:', err);
            displayError('Failed to save bookmark');
        }
    };

    const deleteBookmark = (index) => {
        const videoId = new URLSearchParams(window.location.search).get('video_id');
        try {
            bookmarks.splice(index, 1);
            localStorage.setItem(`bookmarks_${videoId}`, JSON.stringify(bookmarks));
            updateBookmarkMenu();
        } catch (err) {
            console.error('Failed to delete bookmark:', err);
            displayError('Failed to delete bookmark');
        }
    };

    const updateBookmarkMenu = () => {
        if (!ui.bookmarkMenu) return;
        ui.bookmarkMenu.innerHTML = bookmarks.length ? bookmarks.map((bookmark, index) => `
            <li data-time="${bookmark.time}" data-index="${index}" role="menuitem" tabindex="0">
                ${bookmark.title}
                <span class="material-icons" data-action="delete">delete</span>
            </li>
        `).join('') : '<li role="menuitem">No bookmarks</li>';
    };

    const addAnnotation = (startTime, text, x = 50, y = 50, endTime = startTime + 5, action = '') => {
        if (isIframeMode) return;
        annotations.push({ startTime, endTime, text, x, y, action });
        manageAnnotations();
    };

    const editAnnotation = (index, updates) => {
        if (isIframeMode || !annotations[index]) return;
        annotations[index] = { ...annotations[index], ...updates };
        manageAnnotations();
    };

    const deleteAnnotation = (index) => {
        annotations.splice(index, 1);
        manageAnnotations();
    };

    const addToPlaylist = (videoId, title) => {
        playlist.push({ videoId, title, active: false });
        updatePlaylistMenu();
    };

    const removeFromPlaylist = (index) => {
        playlist.splice(index, 1);
        updatePlaylistMenu();
    };

    const playPlaylistItem = (index) => {
        const item = playlist[index];
        if (item) {
            playlist.forEach(p => p.active = false);
            item.active = true;
            initializePlayer(item.videoId);
            updatePlaylistMenu();
        }
    };

    const addToDownloadQueue = (videoId, title) => {
        const item = { videoId, title, progress: 0, status: 'queued' };
        downloadQueue.push(item);
        simulateDownloadProgress(item);
        updateDownloadQueueMenu();
    };

    const cancelDownload = (index) => {
        if (downloadQueue[index]) {
            downloadQueue[index].status = 'cancelled';
            downloadQueue.splice(index, 1);
            updateDownloadQueueMenu();
        }
    };

    const simulateDownloadProgress = (item) => {
        let progress = 0;
        const interval = setInterval(() => {
            if (item.status !== 'queued') {
                clearInterval(interval);
                return;
            }
            progress += 10;
            item.progress = Math.min(100, progress);
            item.status = progress >= 100 ? 'completed' : 'downloading';
            updateDownloadQueueMenu();
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 1000);
    };

    const setupIframePlayer = async (iframeSource, meta, videoId) => {
        if (!ui.iframePlayerContainer) {
            console.error('Iframe player container not found');
            displayError('Cannot load iframe video: container missing');
            return;
        }
    
        isIframeMode = true;
        ui.videoPlayer.classList.add('iframe-active');
        ui.mainPlayer.classList.add('hidden');
        ui.iframePlayerContainer.classList.remove('hidden');
        player.pause();
        player.src([]);
        ui.iframePlayerContainer.innerHTML = '';
    
        if (youtubePlayer) {
            youtubePlayer.destroy();
            youtubePlayer = null;
        }
    
        const disableUIElements = () => {
            if (ui.qualityMenu) ui.qualityMenu.innerHTML = '<li role="menuitem">Quality not available</li>';
            if (ui.captionMenu) ui.captionMenu.innerHTML = '<li role="menuitem">Subtitles not available</li>';
            if (ui.audioTrackMenu) ui.audioTrackMenu.innerHTML = '<li role="menuitem">Audio tracks not available</li>';
            if (ui.settings) ui.settings.classList.remove('active');
            if (ui.captions) ui.captions.classList.remove('active');
            if (ui.audioTracks) ui.audioTracks.classList.remove('active');
            if (ui.annotationPanel) ui.annotationPanel.classList.remove('active');
        };
    
        try {
            console.log('Input URL:', iframeSource.url);
            let iframeUrl;
            try {
                const response = await fetch(`/embed?url=${encodeURIComponent(iframeSource.url)}`);
                console.log('Backend response status:', response.status);
                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('Backend error response:', errorData);
                    let errorDetail;
                    try {
                        errorDetail = JSON.parse(errorData).detail;
                    } catch {
                        errorDetail = errorData || response.statusText;
                    }
                    throw new Error(`Backend error: ${errorDetail}`);
                }
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const videoUrl = doc.querySelector('iframe')?.src || iframeSource.url;
                iframeUrl = new URL(videoUrl);
                console.log('Sanitized URL:', iframeUrl.href);
                if (!['https:', 'http:'].includes(iframeUrl.protocol)) {
                    throw new Error('Invalid URL protocol (must be http or https)');
                }
            } catch (err) {
                throw new Error(`Invalid iframe URL: ${err.message}`);
            }
    
            if (iframeUrl.hostname.includes('youtube.com') || iframeUrl.hostname.includes('youtu.be')) {
                await loadYouTubeAPI();
                const youtubeVideoId = extractYouTubeVideoId(iframeUrl.href);
                if (!youtubeVideoId) throw new Error('Invalid YouTube URL');
    
                const iframeContainer = document.createElement('div');
                iframeContainer.id = `youtube-player-${videoId}`;
                ui.iframePlayerContainer.appendChild(iframeContainer);
    
                youtubePlayer = new YT.Player(iframeContainer.id, {
                    videoId: youtubeVideoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        enablejsapi: 1,
                        playsinline: 1
                    },
                    events: {
                        onReady: () => {
                            console.log('YouTube player ready:', youtubeVideoId);
                            updateMeta(meta);
                            ui.videoPlayer.classList.add('paused');
                            if (ui.centerControl) {
                                ui.centerControl.innerHTML = '<span class="material-icons">play_arrow</span>';
                                ui.centerControl.setAttribute('aria-label', 'Play');
                            }
    
                            setInterval(() => {
                                if (youtubePlayer && ui.progressBar && ui.current && ui.totalDuration) {
                                    const currentTime = youtubePlayer.getCurrentTime();
                                    const duration = youtubePlayer.getDuration();
                                    if (duration > 0) {
                                        ui.current.textContent = formatTime(currentTime);
                                        ui.totalDuration.textContent = formatTime(duration);
                                        ui.progressBar.style.width = `${(currentTime / duration) * 100}%`;
                                    }
                                }
                            }, 1000);
    
                            hideLoadingSpinner();
                        },
                        onStateChange: (event) => {
                            console.log('YouTube player state:', event.data);
                            if (event.data === YT.PlayerState.PLAYING) {
                                ui.videoPlayer.classList.remove('paused');
                                ui.videoPlayer.classList.add('playing');
                                if (ui.centerControl) {
                                    ui.centerControl.innerHTML = '<span class="material-icons">pause</span>';
                                    ui.centerControl.setAttribute('aria-label', 'Pause');
                                }
                            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                                ui.videoPlayer.classList.remove('playing');
                                ui.videoPlayer.classList.add('paused');
                                if (ui.centerControl) {
                                    ui.centerControl.innerHTML = '<span class="material-icons">play_arrow</span>';
                                    ui.centerControl.setAttribute('aria-label', 'Play');
                                }
                            }
                            showControls();
                        },
                        onError: (event) => {
                            console.error('YouTube player error:', event.data);
                            displayError(`YouTube player error: ${event.data}`);
                        }
                    }
                });
    
                if (ui.centerControl) {
                    ui.centerControl.onclick = () => {
                        const isPlaying = ui.videoPlayer.classList.contains('playing');
                        if (isPlaying) {
                            youtubePlayer.pauseVideo();
                        } else {
                            youtubePlayer.playVideo();
                        }
                    };
                }
            } else if (iframeUrl.hostname.includes('twitch.tv') || iframeUrl.search.includes('channel=') || iframeUrl.pathname.includes('videos')) {
                let channel = iframeUrl.searchParams.get('channel');
                if (!channel) {
                    const pathParts = iframeUrl.pathname.split('/').filter(p => p);
                    channel = pathParts[pathParts[0] === 'videos' ? 1 : 0];
                }
                if (!channel) throw new Error('Invalid or missing Twitch channel');
    
                const parent = window.location.hostname || 'localhost';
                const embedUrl = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&muted=false`;
    
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
                iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
                iframe.setAttribute('aria-label', meta.title || 'Twitch stream');
                ui.iframePlayerContainer.appendChild(iframe);
    
                updateMeta(meta);
                ui.videoPlayer.classList.add('playing');
                if (ui.centerControl) {
                    ui.centerControl.innerHTML = '<span class="material-icons">pause</span>';
                    ui.centerControl.setAttribute('aria-label', 'Pause');
                }
    
                let liveTime = 0;
                const progressInterval = setInterval(() => {
                    if (!isIframeMode || !ui.iframePlayerContainer.contains(iframe)) {
                        clearInterval(progressInterval);
                        return;
                    }
                    liveTime += 1;
                    if (ui.current) ui.current.textContent = formatTime(liveTime);
                    if (ui.totalDuration) ui.totalDuration.textContent = 'LIVE';
                    if (ui.progressBar) ui.progressBar.style.width = '100%';
                }, 1000);
    
                const toggleTwitchPlay = () => {
                    const isPlaying = ui.videoPlayer.classList.contains('playing');
                    iframe.contentWindow.postMessage(
                        { event: isPlaying ? 'pause' : 'play' },
                        'https://player.twitch.tv'
                    );
                    ui.videoPlayer.classList.toggle('playing', !isPlaying);
                    ui.videoPlayer.classList.toggle('paused', isPlaying);
                    if (ui.centerControl) {
                        ui.centerControl.innerHTML = `<span class="material-icons">${isPlaying ? 'play_arrow' : 'pause'}</span>`;
                        ui.centerControl.setAttribute('aria-label', isPlaying ? 'Play' : 'Pause');
                    }
                };
                if (ui.centerControl) ui.centerControl.onclick = toggleTwitchPlay;
    
                hideLoadingSpinner();
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = iframeUrl.href;
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
                iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
                iframe.setAttribute('aria-label', meta.title || 'Embedded video');
                ui.iframePlayerContainer.appendChild(iframe);
    
                updateMeta(meta);
                ui.videoPlayer.classList.add('playing');
                if (ui.centerControl) {
                    ui.centerControl.innerHTML = '<span class="material-icons">pause</span>';
                    ui.centerControl.setAttribute('aria-label', 'Pause');
                }
    
                if (ui.current) ui.current.textContent = '--:--';
                if (ui.totalDuration) ui.totalDuration.textContent = '--:--';
                if (ui.progressBar) ui.progressBar.style.width = '0%';
    
                ui.centerControl.onclick = () => {
                    const isPlaying = ui.videoPlayer.classList.contains('playing');
                    ui.videoPlayer.classList.toggle('playing', !isPlaying);
                    ui.videoPlayer.classList.toggle('paused', isPlaying);
                    ui.centerControl.innerHTML = `<span class="material-icons">${isPlaying ? 'play_arrow' : 'pause'}</span>`;
                    ui.centerControl.setAttribute('aria-label', isPlaying ? 'Play' : 'Pause');
                };
    
                hideLoadingSpinner();
            }
    
            disableUIElements();
        } catch (err) {
            console.error('Iframe setup failed:', err);
            displayError(`Failed to load iframe video: ${err.message}`);
            disableUIElements();
            hideLoadingSpinner();
            ui.iframePlayerContainer.classList.add('hidden');
            ui.mainPlayer.classList.remove('hidden');
        }
    };

    const updateMeta = (meta) => {
        if (meta) {
            if (ui.videoTitle) ui.videoTitle.textContent = meta.title || 'Untitled Video';
            document.title = `${meta.title || 'Video'} - NEXFIX MP4HUB`;
            if (ui.videoDescription) ui.videoDescription.textContent = meta.description || 'No description available.';
            const viewCount = document.getElementById('viewCount');
            if (viewCount) viewCount.textContent = new Intl.NumberFormat().format(meta.views || 0);
        }
    };


    const handleIframeRestrictions = () => {
        if (isInIframe) {
            if (ui.fullscreen) {
                ui.fullscreen.disabled = true;
                ui.fullscreen.classList.add('disabled');
                ui.fullscreen.setAttribute('aria-disabled', 'true');
            }
            if (ui.pictureInPicture) {
                ui.pictureInPicture.disabled = true;
                ui.pictureInPicture.classList.add('disabled');
                ui.pictureInPicture.setAttribute('aria-disabled', 'true');
            }
            if (ui.theaterMode) {
                ui.theaterMode.disabled = true;
                ui.theaterMode.classList.add('disabled');
                ui.theaterMode.setAttribute('aria-disabled', 'true');
            }
            const postMessage = (event, data) => {
                window.parent.postMessage({ type: `video:${event}`, data }, '*');
            };
            if (!isIframeMode) {
                player.on('play', () => postMessage('play', { time: player.currentTime() }));
                player.on('pause', () => postMessage('pause', { time: player.currentTime() }));
                player.on('timeupdate', () => postMessage('timeupdate', { time: player.currentTime() }));
                player.on('error', () => postMessage('error', { message: player.error()?.message }));
            }
            const messageHandler = (event) => {
                if (event.data.type === 'video:play' && !isIframeMode) {
                    player.play().catch(() => {});
                } else if (event.data.type === 'video:pause' && !isIframeMode) {
                    player.pause();
                } else if (event.data.type === 'video:seek' && !isIframeMode) {
                    player.currentTime(event.data.time);
                }
            };
            window.addEventListener('message', messageHandler);
            window._messageHandler = messageHandler;
        }
    };

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const handleTap = (e) => {
        if (isLocked) {
            toggleLock(); // Unlock on tap if locked
            return;
        }
    
        const currentTime = Date.now();
        const tapDuration = currentTime - lastTapTime;
        lastTapTime = currentTime;
    
        const rect = videoPlayer.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
    
        if (!clientX || rect.width === 0) return;
    
        const tapX = clientX - rect.left;
        const normalizedTapX = tapX / rect.width;
    
        tapCount++;
    
        setTimeout(() => {
            if (tapCount === 1) {
                toggleControls();
            } else if (tapCount === 2) {
                handleDoubleTap(normalizedTapX);
            } else if (tapCount === 3) {
                handleTripleTap();
            }
            tapCount = 0;
        }, DOUBLE_TAP_THRESHOLD);
    };
    
    const toggleControls = () => {
        if (ui.controls.classList.contains('active')) {
            hideControls();
        } else {
            showControls();
        }
    };
    
    const handleDoubleTap = (normalizedTapX) => {
        const isLeft = normalizedTapX < REGION_THRESHOLD;
        const isRight = normalizedTapX > (1 - REGION_THRESHOLD);
        const isCenter = !isLeft && !isRight;
    
        if (isCenter) {
            toggleFullscreen(); // or toggle play/pause if desired
        } else {
            const seekSeconds = isLeft ? -SEEK_AMOUNT : SEEK_AMOUNT;
            const direction = isLeft ? 'left' : 'right';
    
            if (isIframeMode && youtubePlayer) {
                const current = youtubePlayer.getCurrentTime();
                const duration = youtubePlayer.getDuration();
                const newTime = Math.min(Math.max(0, current + seekSeconds), duration);
                youtubePlayer.seekTo(newTime, true);
            } else {
                const current = player.currentTime();
                const duration = player.duration();
                const newTime = Math.min(Math.max(0, current + seekSeconds), duration);
                player.currentTime(newTime);
            }
    
            showSeekFeedback(direction, seekSeconds);
        }
    };
    
    const handleTripleTap = () => {
        setZoom(1); // Reset zoom level (or any other gesture)
    };
    

    const handleSwipeStart = (e) => {
        if (!swipeControlsEnabled || isZooming || isSpeedHeld || isLocked) return;
        if (e.touches.length !== 1) return;
        isSwiping = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };
    
    const handleSwipeMove = (e) => {
        if (!isSwiping || isZooming || isLocked || !isFullscreenActive() || !swipeControlsEnabled) return;
        if (e.touches.length !== 1) return;
    
        e.preventDefault();
    
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const rect = videoPlayer.getBoundingClientRect();
    
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_MIN_DISTANCE) {
            // Horizontal swipe - Seek
            const seekSeconds = Math.round((dx / rect.width) * 60);
            if (isIframeMode && youtubePlayer) {
                const currentTime = youtubePlayer.getCurrentTime();
                const duration = youtubePlayer.getDuration();
                const newTime = Math.max(0, Math.min(duration, currentTime + seekSeconds));
                youtubePlayer.seekTo(newTime, true);
            } else {
                const newTime = Math.max(0, Math.min(player.duration(), player.currentTime() + seekSeconds));
                player.currentTime(newTime);
            }
            showSeekFeedback(seekSeconds < 0 ? 'left' : 'right', Math.abs(seekSeconds));
        } else if (Math.abs(dy) > SWIPE_MIN_DISTANCE && !isIframeMode) {
            // Vertical swipe - Volume or Brightness
            const change = (dy / rect.height) * -0.5;
    
            if (touchStartX < rect.width * REGION_THRESHOLD) {
                // Left side: Volume
                const newVol = Math.min(1, Math.max(0, player.volume() + change));
                setVolume(newVol);
                showSwipeFeedback('volume', Math.round(newVol * 100));
            } else if (touchStartX > rect.width * (1 - REGION_THRESHOLD)) {
                // Right side: Brightness
                const newBrightness = Math.min(2, Math.max(0, brightness + change));
                setBrightness(newBrightness);
                showSwipeFeedback('brightness', Math.round(newBrightness * 100));
            }
        }
    
        touchStartX = touchEndX;
        touchStartY = touchEndY;
    };
    
    const handleSwipeEnd = () => {
        isSwiping = false;
        showControls();
    };
    
    const handlePinchZoom = (e) => {
        if (e.touches.length !== 2 || isLocked || isIframeMode) return;
    
        e.preventDefault();
        isZooming = true;
        isSwiping = false;
    
        const [touch1, touch2] = e.touches;
        const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
    
        if (!initialPinchDistance) {
            initialPinchDistance = currentDistance;
            touchStartX = (touch1.clientX + touch2.clientX) / 2;
            touchStartY = (touch1.clientY + touch2.clientY) / 2;
            return;
        }
    
        const zoomChange = (currentDistance - initialPinchDistance) / PINCH_SENSITIVITY;
        const newZoom = Math.max(1, Math.min(3, zoomLevel + zoomChange));
    
        if (newZoom !== zoomLevel) {
            const prevX = touchStartX;
            const prevY = touchStartY;
            touchStartX = (touch1.clientX + touch2.clientX) / 2;
            touchStartY = (touch1.clientY + touch2.clientY) / 2;
            panX += (touchStartX - prevX) / newZoom;
            panY += (touchStartY - prevY) / newZoom;
            setZoom(newZoom);
        }
    
        initialPinchDistance = currentDistance;
    };
    
    const endPinchZoom = () => {
        if (!isZooming) return;
        isZooming = false;
        initialPinchDistance = 0;
        showControls();
    };
    
    const handleSpeedHold = (e) => {
        if (!isFullscreenActive() || isSpeedHeld || isZooming || isSwiping || isLocked || isIframeMode) return;
        if (!e.touches || e.touches.length !== 1) return;
    
        const rect = videoPlayer.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const normalizedX = x / rect.width;
    
        if (normalizedX < REGION_THRESHOLD || normalizedX > 1 - REGION_THRESHOLD) {
            setTimeout(() => {
                if (!isSpeedHeld) {
                    isSpeedHeld = true;
                    const speed = normalizedX < REGION_THRESHOLD ? -2 : 2;
                    player.playbackRate(Math.abs(speed));
                    showSpeedFeedback(speed);
                }
            }, SPEED_HOLD_DURATION);
        }
    };
    
    const releaseSpeedHold = () => {
        if (!isSpeedHeld) return;
        player.playbackRate(1);
        if (ui.speedFeedback) ui.speedFeedback.classList.remove('active');
        isSpeedHeld = false;
        showControls();
    };
    
    const updateStatsPanel = () => {
        if (!ui.statsPanel || isIframeMode) return;
        const stats = [
            { icon: 'play_arrow', label: 'Playback', value: player.playbackRate() ? player.playbackRate() + 'x' : 'N/A' },
            { icon: 'volume_up', label: 'Volume', value: player.volume() ? Math.round(player.volume() * 100) + '%' : 'N/A' },
            { icon: 'brightness_5', label: 'Brightness', value: brightness ? Math.round(brightness * 100) + '%' : 'N/A' },
            { icon: 'zoom_in', label: 'Zoom', value: zoomLevel ? zoomLevel.toFixed(1) + 'x' : 'N/A' },
            { icon: 'timer', label: 'Current Time', value: player.currentTime() ? formatTime(player.currentTime()) : '0:00' },
            { icon: 'hourglass_empty', label: 'Duration', value: player.duration() ? formatTime(player.duration()) : '0:00' },
            { icon: 'signal_cellular_alt', label: 'Buffer Health', value: player.buffered().length ? Math.round(player.buffered().end(player.buffered().length - 1) - player.currentTime()) + 's' : '0s' },
            { icon: 'high_quality', label: 'Quality', value: ui.qualityBadge?.textContent || 'Unknown' },
            { icon: 'network_check', label: 'Network', value: ui.networkStatus?.textContent || 'Unknown' }
        ];
        ui.statsPanel.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <span class="material-icons">${stat.icon}</span>
                <span>${stat.label}: ${stat.value}</span>
            </div>
        `).join('');
        ui.statsPanel.style.display = ui.statsToggle?.classList.contains('active') ? 'block' : 'none';
    };

    const initializePlayer = async (overrideVideoId = null) => {
        let retryCount = 0;
        const MAX_RETRIES = 3;
        const RETRY_DELAY_BASE = 1000;
    
        try {
            // Extract video ID from URL or override
            const videoId = overrideVideoId || new URLSearchParams(window.location.search).get('video_id');
            if (!videoId) throw new Error('Missing video_id parameter');
    
            console.log('Initializing player for video ID:', videoId);
            showLoadingSpinner();
    
            // Fetch video data with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(`/stream/${videoId}`, {
                credentials: isInIframe ? 'same-origin' : 'include',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
    
            // Handle HTTP errors
            if (!response.ok) {
                const errorMap = {
                    404: 'Content not found or expired',
                    403: 'Stream expired or unauthorized',
                    500: 'Server error occurred'
                };
                throw new Error(errorMap[response.status] || `HTTP ${response.status}: ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('Data received from backend:', data);
    
            // Destructure response with defaults
            const {
                sources = [],
                subtitle = null,
                subtitles = [],
                meta = { title: 'Untitled Video', description: 'No description available' },
                thumbnail = '/static/nexfix-logo.jpg',
                audio_options = [],
                is_live = false
            } = data;
    
            if (!sources.length) throw new Error('No valid video sources provided');
    
            // Define valid source types
            const validSourceTypes = [
                'video/mp4',
                'application/x-mpegURL',
                'application/dash+xml',
                'video/webm',
                'video/ogg',
                'video/x-flv',
                'iframe'
            ];
    
            // Filter and validate sources
            const validSources = sources.filter(src => src?.url && src?.type && validSourceTypes.includes(src.type));
            if (!validSources.length) throw new Error('No playable sources found');
    
            // Separate iframe and non-iframe sources
            const iframeSources = validSources.filter(src => src.type === 'iframe');
            const nonIframeSources = validSources.filter(src => src.type !== 'iframe');
    
            // Sort non-iframe sources by quality
            const qualityOrder = ['1080p', '720p', '480p', '360p', '240p'];
            nonIframeSources.sort((a, b) => {
                const aIndex = qualityOrder.indexOf(a.quality) === -1 ? qualityOrder.length : qualityOrder.indexOf(a.quality);
                const bIndex = qualityOrder.indexOf(b.quality) === -1 ? qualityOrder.length : qualityOrder.indexOf(b.quality);
                return aIndex - bIndex;
            });
    
            // Prefer the "Auto" HLS source (master playlist) for HLS
            const initialSource = iframeSources[0] || nonIframeSources.find(src => src.quality === 'Auto' && src.type === 'application/x-mpegURL') || nonIframeSources[0];
            if (!initialSource) throw new Error('No initial source selected');
    
            // Decode and prepare source URL
            let sourceUrl = initialSource.url;
            try {
                if (sourceUrl.includes('/proxy?url=')) {
                    const urlParams = new URLSearchParams(sourceUrl.split('?')[1]);
                    sourceUrl = decodeURIComponent(urlParams.get('url'));
                }
                sourceUrl = `/proxy?url=${encodeURIComponent(sourceUrl)}`;
            } catch (e) {
                console.warn('URL decoding failed:', sourceUrl, e);
            }
    
            // Log playlist content for HLS sources
            if (initialSource.type === 'application/x-mpegURL') {
                try {
                    const playlistResponse = await fetch(sourceUrl, {
                        headers: { 'Accept': 'application/vnd.apple.mpegurl' }
                    });
                    if (!playlistResponse.ok) {
                        throw new Error(`Failed to fetch playlist: HTTP ${playlistResponse.status}`);
                    }
                    const playlistContent = await playlistResponse.text();
                    console.log('Master .m3u8 playlist content:', playlistContent);
                } catch (err) {
                    console.error('Failed to fetch .m3u8 playlist:', err);
                }
            }
    
            // Prepare subtitles
            const subtitleList = subtitle
                ? [{ url: subtitle, name: 'English', language: 'en', default: true }, ...subtitles]
                : subtitles;
    
            // Deduplicate and label audio options
            const uniqueAudioOptions = audio_options.reduce((acc, track) => {
                const key = `${track.url}-${track.language}`;
                if (!acc.seen.has(key)) {
                    let label = track.name;
                    if (track.url.includes('b256000')) label += ' (High)';
                    else if (track.url.includes('b128000')) label += ' (Low)';
                    else if (track.url.includes('b56000')) label += ' (Medium)';
                    acc.seen.add(key);
                    acc.tracks.push({
                        ...track,
                        name: label,
                        default: track.default === 'YES' || acc.tracks.length === 0
                    });
                }
                return acc;
            }, { seen: new Set(), tracks: [] }).tracks;
    
            // Initialize player based on source type
            if (initialSource.type === 'iframe') {
                console.log('Setting up iframe player for source:', initialSource.url);
                await setupIframePlayer(initialSource, meta, videoId);
            } else {
                console.log('Setting up Video.js player for source:', sourceUrl);
                await setupVideoJsPlayer(initialSource, thumbnail, subtitleList, uniqueAudioOptions, meta, is_live, videoId);
            }
    
            // Setup quality menu for non-HLS sources (e.g., MP4)
            if (ui.qualityMenu && nonIframeSources.length > 0 && !isIframeMode && initialSource.type !== 'application/x-mpegURL') {
                ui.qualityMenu.innerHTML = nonIframeSources
                    .map(s => `
                        <li data-url="/proxy?url=${encodeURIComponent(s.url)}" data-quality="${s.quality || 'Unknown'}" data-type="${s.type}" role="menuitem">
                            <span>${s.quality || 'Unknown'}</span>
                            ${s.quality === initialSource.quality ? '<span class="material-icons">check</span>' : ''}
                        </li>
                    `)
                    .join('');
    
                ui.qualityMenu.querySelectorAll('li').forEach(li => {
                    li.addEventListener('click', async () => {
                        if (isLocked || isIframeMode) return;
                        const { quality, url, type } = li.dataset;
                        const currentTime = player.currentTime();
    
                        try {
                            showLoadingSpinner();
                            console.log('Switching to quality:', quality, url, type);
                            player.src({ src: url, type: getSourceType(url, type) });
                            await player.load();
                            player.currentTime(currentTime);
                            await player.play().catch(err => {
                                console.error('Playback failed after quality switch:', err);
                                displayError('Failed to play video');
                            });
                            manualQualitySelected = true;
    
                            ui.qualityMenu.querySelectorAll('li').forEach(el => {
                                el.classList.remove('active');
                                el.querySelector('.material-icons')?.remove();
                            });
                            li.classList.add('active');
                            li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
    
                            if (ui.qualityBadge) {
                                ui.qualityBadge.textContent = quality;
                                ui.qualityBadge.classList.add('pulse');
                                setTimeout(() => ui.qualityBadge.classList.remove('pulse'), 500);
                            }
                            togglePanel(ui.settings, false);
                        } catch (err) {
                            console.error('Quality switch failed:', err);
                            if (retryCount < MAX_RETRIES) {
                                retryCount++;
                                setTimeout(() => initializePlayer(videoId), RETRY_DELAY_BASE * retryCount);
                            } else {
                                displayError('Failed to switch quality after retries');
                            }
                        } finally {
                            hideLoadingSpinner();
                        }
                    });
                });
            } else if (ui.qualityMenu && initialSource.type !== 'application/x-mpegURL') {
                ui.qualityMenu.innerHTML = '<li role="menuitem">No quality options available</li>';
            }
    
            // Setup player event listeners
            if (!isIframeMode) {
                player.on('loadedmetadata', () => {
                    const duration = player.duration();
                    if (ui.totalDuration) ui.totalDuration.textContent = formatTime(duration);
                    addChapterMarkers();
                    updateStatsPanel();
                    hideLoadingSpinner();
                });
    
                player.on('error', () => {
                    const error = player.error();
                    console.error('Player error:', error);
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        setTimeout(() => initializePlayer(videoId), RETRY_DELAY_BASE * retryCount);
                    } else {
                        displayError(`Playback failed: ${error?.message || 'Unknown error'}`);
                    }
                });
    
                player.on('waiting', showLoadingSpinner);
                player.on('playing', () => {
                    hideLoadingSpinner();
                    videoPlayer.classList.add('playing');
                    videoPlayer.classList.remove('paused');
                });
    
                // Save playback position
                player.on('timeupdate', () => {
                    if (!is_live) {
                        localStorage.setItem(`playback_${videoId}`, player.currentTime());
                    }
                });
            }
    
            // Restore saved playback position
            if (!isIframeMode && !is_live) {
                const savedTime = localStorage.getItem(`playback_${videoId}`);
                if (savedTime) {
                    player.currentTime(parseFloat(savedTime));
                }
            }
    
            // Load bookmarks
            loadBookmarks(videoId);
    
            // Update network status for quality adjustment
            updateNetworkStatus();
            if (nonIframeSources.length > 0) {
                adjustQualityBasedOnNetwork(nonIframeSources);
            }
    
        } catch (err) {
            console.error('Initialization failed:', err);
            displayError(err.message || 'Failed to initialize player');
            if (retryCount < MAX_RETRIES && err.name !== 'AbortError') {
                retryCount++;
                setTimeout(() => initializePlayer(videoId), RETRY_DELAY_BASE * retryCount);
            }
        } finally {
            hideLoadingSpinner();
        }
    };
    const setupVideoJsPlayer = async (source, thumbnail, subtitles, audio_options, meta, isLive, videoId) => {
        if (isIframeMode) {
            isIframeMode = false;
            videoPlayer.classList.remove('iframe-active');
            ui.iframePlayerContainer.innerHTML = '';
            if (youtubePlayer) {
                youtubePlayer.destroy();
                youtubePlayer = null;
            }
        }
    
        let rawUrl = source.url;
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
    
        const sourceUrl = `/proxy?url=${encodeURIComponent(rawUrl)}`;
        showLoadingSpinner();
    
        try {
            // Set source based on type
            player.src({
                src: sourceUrl,
                type: source.type
            });
    
            // Wait for player to be ready
            await new Promise((resolve, reject) => {
                player.ready(() => {
                    console.log('Player ready for source:', sourceUrl);
                    resolve();
                });
                player.on('error', () => {
                    const error = player.error();
                    console.error('Source load error:', error);
                    reject(error);
                });
            });
    
            // For HLS sources, verify HLS tech and log playlist details
            let hls = null;
            if (source.type === 'application/x-mpegURL') {
                hls = player.tech(true).hls;
                if (!hls) {
                    console.warn('HLS tech not available. Attempting native playback.');
                } else {
                    // Log HLS playlist details
                    hls.on('loadedmetadata', () => {
                        console.log('HLS playlist loaded:', {
                            playlists: hls.playlists.master?.playlists?.map(p => ({
                                resolution: p.attributes.RESOLUTION,
                                bandwidth: p.attributes.BANDWIDTH,
                                uri: p.uri
                            })),
                            audioTracks: hls.audioTracks()?.map(t => ({
                                id: t.id,
                                label: t.label,
                                enabled: t.enabled
                            }))
                        });
                    });
                    hls.on('error', (err) => {
                        console.error('HLS error:', err);
                    });
                    // Configure CMAF support
                    hls.xhr.beforeRequest = (options) => {
                        console.log('HLS request:', options.uri);
                        return options;
                    };
                }
            }
        } catch (err) {
            console.error('Error setting source:', err);
            displayError(`Failed to load video source: ${err.message || 'Unknown error'}`);
            hideLoadingSpinner();
            return;
        }
    
        player.poster(thumbnail || '/static/nexfix-logo.jpg');
        player.playbackRates([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4]);
    
        // Setup quality levels for HLS sources
        if (source.type === 'application/x-mpegURL') {
            const qualityLevels = player.qualityLevels();
            if (!qualityLevels) {
                console.warn('Quality levels plugin not available');
            } else if (ui.qualityMenu) {
                ui.qualityMenu.innerHTML = '<li data-quality="auto" class="active" role="menuitem">Auto <span class="material-icons">check</span></li>';
    
                qualityLevels.on('addqualitylevel', () => {
                    console.log('Quality levels detected:', qualityLevels.levels_);
                    ui.qualityMenu.innerHTML = '<li data-quality="auto" class="active" role="menuitem">Auto <span class="material-icons">check</span></li>';
    
                    for (let i = 0; i < qualityLevels.length; i++) {
                        const level = qualityLevels[i];
                        const height = level.height || 'Unknown';
                        ui.qualityMenu.insertAdjacentHTML('beforeend', `
                            <li data-quality="${i}" role="menuitem">
                                ${height}p
                            </li>
                        `);
                    }
    
                    ui.qualityMenu.querySelectorAll('li').forEach(li => {
                        li.addEventListener('click', () => {
                            if (isLocked || isIframeMode) return;
                            const qualityIndex = li.dataset.quality;
                            showLoadingSpinner();
    
                            try {
                                if (qualityIndex === 'auto') {
                                    for (let i = 0; i < qualityLevels.length; i++) {
                                        qualityLevels[i].enabled = true;
                                    }
                                } else {
                                    for (let i = 0; i < qualityLevels.length; i++) {
                                        qualityLevels[i].enabled = i === parseInt(qualityIndex);
                                    }
                                }
    
                                ui.qualityMenu.querySelectorAll('li').forEach(el => {
                                    el.classList.remove('active');
                                    el.querySelector('.material-icons')?.remove();
                                });
                                li.classList.add('active');
                                li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
    
                                if (ui.qualityBadge) {
                                    ui.qualityBadge.textContent = qualityIndex === 'auto' ? 'Auto' : `${qualityLevels[parseInt(qualityIndex)].height}p`;
                                    ui.qualityBadge.classList.add('pulse');
                                    setTimeout(() => ui.qualityBadge.classList.remove('pulse'), 500);
                                }
                                togglePanel(ui.settings, false);
                            } catch (err) {
                                console.error('Quality switch failed:', err);
                                displayError('Failed to switch quality');
                            } finally {
                                hideLoadingSpinner();
                            }
                        });
                    });
                });
    
                qualityLevels.on('change', () => {
                    const selectedLevel = qualityLevels.selectedIndex !== -1 ? qualityLevels[qualityLevels.selectedIndex] : null;
                    if (ui.qualityBadge) {
                        ui.qualityBadge.textContent = selectedLevel ? `${selectedLevel.height}p` : 'Auto';
                    }
                    console.log('Quality changed:', selectedLevel ? `${selectedLevel.height}p` : 'Auto');
                });
            }
        }
    
        // Setup subtitles
        if (subtitles.length && ui.captionMenu) {
            ui.captionMenu.innerHTML = `<li data-track="OFF" class="active" role="menuitem">OFF <span class="material-icons">check</span></li>` +
                subtitles.map(sub => `
                    <li data-track="${sub.url}" data-label="${sub.name}" data-lang="${sub.language}" role="menuitem">
                        ${sub.name} (${sub.language})
                    </li>
                `).join('');
    
            subtitles.forEach(sub => {
                try {
                    player.addRemoteTextTrack({
                        kind: 'subtitles',
                        src: sub.url.startsWith('/static/') ? sub.url : `/proxy?url=${encodeURIComponent(sub.url)}`,
                        label: sub.name,
                        srclang: sub.language,
                        default: sub.default || false
                    }, false);
                } catch (err) {
                    console.error('Error loading subtitle:', sub.url, err);
                    displayError(`Failed to load subtitle: ${sub.name}`);
                }
            });
        } else if (ui.captionMenu) {
            ui.captionMenu.innerHTML = '<li data-track="OFF" class="active" role="menuitem">No subtitles <span class="material-icons">check</span></li>';
        }
    
        // Setup audio tracks for HLS sources
        const hls = source.type === 'application/x-mpegURL' ? player.tech(true).hls : null;
        if (audio_options.length && ui.audioTrackMenu && hls && source.type === 'application/x-mpegURL') {
            console.log('Audio tracks provided:', audio_options);
    
            ui.audioTrackMenu.innerHTML = audio_options.map((track, index) => `
                <li data-track="${track.url}" data-label="${track.name}" data-lang="${track.language}" role="menuitem">
                    ${track.name}
                    ${track.default || index === 0 ? '<span class="material-icons">check</span>' : ''}
                </li>
            `).join('');
    
            const audioTracks = hls.audioTracks();
            console.log('HLS audio tracks detected:', audioTracks.map(track => ({
                id: track.id,
                label: track.label,
                language: track.language,
                enabled: track.enabled
            })));
    
            ui.audioTrackMenu.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', async () => {
                    if (isLocked || isIframeMode) return;
                    const trackUrl = li.dataset.track;
                    const trackLabel = li.dataset.label;
                    const currentTime = player.currentTime();
    
                    try {
                        showLoadingSpinner();
                        console.log('Switching to audio track:', trackLabel, trackUrl);
    
                        audioTracks.forEach(track => {
                            track.enabled = track.id === trackUrl;
                        });
    
                        ui.audioTrackMenu.querySelectorAll('li').forEach(el => {
                            el.classList.remove('active');
                            el.querySelector('.material-icons')?.remove();
                        });
                        li.classList.add('active');
                        li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
    
                        player.currentTime(currentTime);
                        togglePanel(ui.settings, false);
                    } catch (err) {
                        console.error('Audio track switch failed:', err);
                        displayError('Failed to switch audio track');
                    } finally {
                        hideLoadingSpinner();
                    }
                });
            });
    
            audioTracks.addEventListener('change', () => {
                const enabledTrack = audioTracks.find(track => track.enabled);
                console.log('Audio track changed:', enabledTrack?.label);
            });
        } else if (ui.audioTrackMenu) {
            console.warn('No audio tracks available or HLS tech not loaded');
            ui.audioTrackMenu.innerHTML = '<li data-track="default" class="active" role="menuitem">Default Audio <span class="material-icons">check</span></li>';
        }
    
        // Update meta and live indicator
        updateMeta(meta);
        chapters = meta.chapters || [];
        annotations = meta.annotations || [];
        showLiveIndicator(isLive);
    
        // Handle live stream behavior
        if (isLive) {
            player.liveTracker.on('liveedgechange', () => {
                if (ui.liveBtn) {
                    ui.liveBtn.classList.toggle('live-edge', player.liveTracker.atLiveEdge());
                    ui.liveBtn.disabled = player.liveTracker.atLiveEdge();
                }
            });
    
            if (ui.liveBtn) {
                ui.liveBtn.addEventListener('click', () => {
                    if (!player.liveTracker.atLiveEdge()) {
                        player.liveTracker.seekToLiveEdge();
                        console.log('Seeking to live edge');
                    }
                });
            }
    
            if (ui.progressArea) ui.progressArea.style.pointerEvents = 'none';
            if (ui.fastRewind) ui.fastRewind.disabled = true;
            if (ui.fastForward) ui.fastForward.disabled = true;
        }
    
        if (ui.qualityBadge) ui.qualityBadge.textContent = source.quality || 'Auto';
        manageAnnotations();
        hideLoadingSpinner();
    
        // Attempt to play with user interaction check
        const attemptPlayback = async () => {
            try {
                await player.play();
                console.log('Playback started successfully');
            } catch (err) {
                console.error('Initial playback failed:', err);
                if (err.name === 'NotAllowedError') {
                    // Autoplay blocked; prompt user interaction
                    displayPlaybackPrompt();
                } else {
                    displayError(`Failed to start playback: ${err.message || 'Unknown error'}`);
                }
            }
        };
    
        // Check if the document has been interacted with
        const hasUserInteracted = () => {
            return document.hasFocus() && (
                document.activeElement !== document.body ||
                ['click', 'touchstart', 'keydown', 'mousedown'].some(event => 
                    document.addEventListener(event, () => true, { once: true })
                )
            );
        };
    
        if (hasUserInteracted()) {
            await attemptPlayback();
        } else {
            // Add a play button or prompt for user interaction
            displayPlaybackPrompt();
        }
    };
    
    // Helper function to display a play button or prompt
    const displayPlaybackPrompt = () => {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'playback-prompt';
        promptDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            z-index: 1000;
        `;
        promptDiv.innerHTML = `
            <p>Click to start playback</p>
            <button id="startPlaybackBtn" style="padding: 10px 20px; cursor: pointer;">Play</button>
        `;
        videoPlayer.appendChild(promptDiv);
    
        const playButton = document.getElementById('startPlaybackBtn');
        playButton.addEventListener('click', async () => {
            promptDiv.remove();
            try {
                await player.play();
                console.log('Playback started after user interaction');
            } catch (err) {
                console.error('Playback failed after user interaction:', err);
                displayError(`Failed to start playback: ${err.message || 'Unknown error'}`);
            }
        });
    };
    // Event listeners
    const setupEventListeners = () => {
        if (ui.centerControl) {
            ui.centerControl.addEventListener('click', togglePlay);
        }
        if (ui.fastRewind) {
            ui.fastRewind.addEventListener('click', () => {
                if (isLocked || isIframeMode) return;
                const newTime = Math.max(0, player.currentTime() - SEEK_AMOUNT);
                player.currentTime(newTime);
                showSeekFeedback('left', -SEEK_AMOUNT);
            });
        }
        if (ui.fastForward) {
            ui.fastForward.addEventListener('click', () => {
                if (isLocked || isIframeMode) return;
                const newTime = Math.min(player.duration(), player.currentTime() + SEEK_AMOUNT);
                player.currentTime(newTime);
                showSeekFeedback('right', SEEK_AMOUNT);
            });
        }
        if (ui.volumeSlider) {
            ui.volumeSlider.addEventListener('input', () => setVolume(ui.volumeSlider.value / 100));
        }
        if (ui.volume) {
            ui.volume.addEventListener('click', () => setVolume(player.volume() === 0 ? 1 : 0));
        }
        if (ui.fullscreen) {
            ui.fullscreen.addEventListener('click', toggleFullscreen);
        }
        if (ui.pictureInPicture) {
            ui.pictureInPicture.addEventListener('click', togglePipMode);
        }
        if (ui.theaterMode) {
            ui.theaterMode.addEventListener('click', toggleTheaterMode);
        }
        if (ui.progressArea) {
            ui.progressArea.addEventListener('click', (e) => {
                if (isLocked || isIframeMode) return;
                const rect = ui.progressArea.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const newTime = pos * player.duration();
                player.currentTime(newTime);
                showControls();
            });
        }
        if (ui.autoPlay) {
            ui.autoPlay.addEventListener('click', () => {
                ui.autoPlay.classList.toggle('active');
                localStorage.setItem('autoplay', ui.autoPlay.classList.contains('active'));
            });
        }
        
        document.querySelectorAll('.settings li').forEach(item => {
            item.addEventListener('click', (e) => {
                if (isLocked) return;
                const li = e.target.closest('li');
                if (!li || !li.dataset.label) return;
                document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
                const panel = document.querySelector(`.settings-panel[data-label="${li.dataset.label}"]`);
                if (panel) panel.classList.add('active');
            });
        });
        if (ui.settingsBtn) {
            ui.settings.querySelectorAll('.back-arrow').forEach(arrow => {
                arrow.addEventListener('click', (e) => {
                    if (isLocked) return;
                    e.stopPropagation();
                    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
                    const target = document.querySelector(`[data-label="${e.target.dataset.label}"]`);
                    if (target) target.classList.add('active');
                });
            });
            ui.settingsBtn.addEventListener('click', () => {
                if (isLocked) return;
                togglePanel(ui.settings, !ui.settings.classList.contains('active'));
            });
        }
        if (ui.captionsBtn) {
            ui.captionsBtn.addEventListener('click', () => togglePanel(ui.captions, !ui.captions.classList.contains('active')));
        }
        if (ui.audioTrackBtn) {
            ui.audioTrackBtn.addEventListener('click', () => togglePanel(ui.audioTracks, !ui.audioTracks.classList.contains('active')));
        }
        if (ui.captionMenu) {
            ui.captionMenu.addEventListener('click', (e) => {
                if (isLocked || isIframeMode) return;
                const li = e.target.closest('li');
                if (!li) return;
                const trackUrl = li.dataset.track;
                try {
                    const tracks = player.remoteTextTracks();
                    for (let i = 0; i < tracks.length; i++) {
                        tracks[i].mode = tracks[i].src === trackUrl ? 'showing' : 'disabled';
                    }
                    if (trackUrl === 'OFF') {
                        for (let i = 0; i < tracks.length; i++) tracks[i].mode = 'disabled';
                    }
                    ui.captionMenu.querySelectorAll('li').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.material-icons')?.remove();
                    });
                    li.classList.add('active');
                    li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    togglePanel(ui.captions, false);
                } catch (err) {
                    console.error('Error switching subtitle:', err);
                    displayError('Failed to switch subtitle');
                }
            });
        }
        if (ui.audioTrackMenu) {
            ui.audioTrackMenu.addEventListener('click', (e) => {
                if (isLocked || isIframeMode) return;
                const li = e.target.closest('li');
                if (!li) return;
                const trackId = li.dataset.track;
                try {
                    const tracks = player.audioTracks();
                    for (let i = 0; i < tracks.length; i++) {
                        tracks[i].enabled = tracks[i].id === trackId;
                    }
                    ui.audioTrackMenu.querySelectorAll('li').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.material-icons')?.remove();
                    });
                    li.classList.add('active');
                    li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    togglePanel(ui.audioTracks, false);
                } catch (err) {
                    console.error('Error switching audio track:', err);
                    displayError('Failed to switch audio track');
                }
            });
        }
        if (ui.bookmarkMenu) {
            ui.bookmarkMenu.addEventListener('click', (e) => {
                if (isLocked) return;
                const li = e.target.closest('li');
                const icon = e.target.closest('.material-icons');
                if (!li && !icon) return;
                if (icon?.dataset.action === 'delete') {
                    const index = parseInt(li.dataset.index);
                    deleteBookmark(index);
                } else if (li) {
                    const time = parseFloat(li.dataset.time);
                    if (isIframeMode && youtubePlayer) {
                        youtubePlayer.seekTo(time, true);
                    } else {
                        player.currentTime(time);
                    }
                    togglePanel(ui.bookmarkPanel, false);
                }
            });
        }
        if (ui.annotationMenu) {
            ui.annotationMenu.addEventListener('click', (e) => {
                if (isLocked) return;
                const li = e.target.closest('li');
                const icon = e.target.closest('.material-icons');
                if (!li && !icon) return;
                const index = parseInt(li.dataset.index);
                if (icon?.dataset.action === 'edit') {
                    const newText = prompt('Edit annotation text:', annotations[index].text);
                    if (newText) editAnnotation(index, { text: newText });
                } else if (icon?.dataset.action === 'delete') {
                    deleteAnnotation(index);
                } else if (li) {
                    if (isIframeMode && youtubePlayer) {
                        youtubePlayer.seekTo(annotations[index].startTime, true);
                    } else {
                        player.currentTime(annotations[index].startTime);
                    }
                    togglePanel(ui.annotationPanel, false);
                }
            });
        }
        if (ui.playlistMenu) {
            ui.playlistMenu.addEventListener('click', (e) => {
                if (isLocked) return;
                const li = e.target.closest('li');
                const icon = e.target.closest('.material-icons');
                if (!li && !icon) return;
                const index = parseInt(li.dataset.index);
                if (icon?.dataset.action === 'play') {
                    playPlaylistItem(index);
                } else if (icon?.dataset.action === 'remove') {
                    removeFromPlaylist(index);
                }
            });
        }
        if (ui.downloadQueueMenu) {
            ui.downloadQueueMenu.addEventListener('click', (e) => {
                if (isLocked) return;
                const li = e.target.closest('li');
                const icon = e.target.closest('.material-icons');
                if (!li || !icon || icon.dataset.action !== 'cancel') return;
                const index = parseInt(li.dataset.index);
                cancelDownload(index);
            });
        }
        if (ui.statsToggle) {
            ui.statsToggle.addEventListener('click', () => {
                ui.statsToggle.classList.toggle('active');
                updateStatsPanel();
            });
        }
        if (ui.chapterMarkersToggle) {
            ui.chapterMarkersToggle.addEventListener('click', () => {
                showChapterMarkers = !showChapterMarkers;
                ui.chapterMarkersToggle.classList.toggle('active', showChapterMarkers);
                addChapterMarkers();
            });
        }
        if (ui.swipeControlsToggle) {
            ui.swipeControlsToggle.addEventListener('click', () => {
                swipeControlsEnabled = !swipeControlsEnabled;
                ui.swipeControlsToggle.classList.toggle('active', swipeControlsEnabled);
            });
        }
        if (ui.loopToggle) {
            ui.loopToggle.addEventListener('click', () => {
                isLooping = !isLooping;
                ui.loopToggle.classList.toggle('active', isLooping);
                player.loop(isLooping);
            });
        }
        if (ui.autoQualityToggle) {
            ui.autoQualityToggle.addEventListener('click', () => {
                autoQualityEnabled = !autoQualityEnabled;
                manualQualitySelected = !autoQualityEnabled;
                ui.autoQualityToggle.classList.toggle('active', autoQualityEnabled);
            });
        }
        if (ui.addAnnotationBtn) {
            ui.addAnnotationBtn.addEventListener('click', () => {
                if (isLocked || isIframeMode) return;
                const text = prompt('Enter annotation text:');
                if (text) {
                    addAnnotation(player.currentTime(), text);
                    togglePanel(ui.annotationPanel, true);
                }
            });
        }
        if (ui.customSpeedInput && ui.saveCustomSpeedBtn) {
            ui.saveCustomSpeedBtn.addEventListener('click', () => {
                if (isLocked || isIframeMode) return;
                const speed = parseFloat(ui.customSpeedInput.value);
                if (speed >= 0.25 && speed <= 4) {
                    player.playbackRate(speed);
                    showSpeedFeedback(speed);
                }
            });
        }
        if (ui.screenshotBtn) {
            ui.screenshotBtn.addEventListener('click', captureScreenshot);
        }
        if (ui.shareBtn) {
            ui.shareBtn.addEventListener('click', shareVideo);
        }
        if (ui.lockBtn) {
            ui.lockBtn.addEventListener('click', toggleLock);
        }
        if (ui.orientationBtn) {
            ui.orientationBtn.addEventListener('click', toggleOrientationLock);
        }
        if (ui.hdDownloadBtn) {
            ui.hdDownloadBtn.addEventListener('click', () => {
                const videoId = new URLSearchParams(window.location.search).get('video_id');
                addToDownloadQueue(videoId, `${ui.videoTitle?.textContent || 'Video'} (HD)`);
            });
        }
        if (ui.fastDownloadBtn) {
            ui.fastDownloadBtn.addEventListener('click', () => {
                const videoId = new URLSearchParams(window.location.search).get('video_id');
                addToDownloadQueue(videoId, `${ui.videoTitle?.textContent || 'Video'} (Fast)`);
            });
        }
        videoPlayer.addEventListener('click', handleTap);
        videoPlayer.addEventListener('contextmenu', showContextMenu);
        videoPlayer.addEventListener('touchstart', (e) => {
            handleSwipeStart(e);
            handleSpeedHold(e);
        });
        videoPlayer.addEventListener('touchmove', (e) => {
            handleSwipeMove(e);
            handlePinchZoom(e);
        });
        videoPlayer.addEventListener('touchend', () => {
            handleSwipeEnd();
            endPinchZoom();
            releaseSpeedHold();
        });
        videoPlayer.addEventListener('mouseenter', showControls);
        videoPlayer.addEventListener('mouseleave', hideControls);
        videoPlayer.addEventListener('mousemove', debounce(showControls, 200));
        document.addEventListener('fullscreenchange', () => {
            isFullscreen = isFullscreenActive();
            videoPlayer.classList.toggle('fullscreen-mode', isFullscreen);
            if (ui.fullscreen) {
                ui.fullscreen.innerHTML = `<span class="material-icons">${isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>`;
                ui.fullscreen.setAttribute('aria-label', isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen');
            }
            showControls();
        });
        document.addEventListener('click', (e) => {
            if (!ui.contextMenu || !ui.contextMenu.classList.contains('active')) return;
            if (!e.target.closest('.context-menu')) hideContextMenu();
        });
        ui.contextMenu?.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            const action = li.dataset.action;
            if (action === 'play-pause') togglePlay();
            else if (action === 'add-bookmark') saveBookmark(player.currentTime());
            else if (action === 'add-annotation') addAnnotation(player.currentTime(), 'New Annotation');
            else if (action === 'toggle-pip') togglePipMode();
            else if (action === 'toggle-fullscreen') toggleFullscreen();
            else if (action === 'show-shortcuts') showKeyboardShortcuts();
            else if (action === 'capture-screenshot') captureScreenshot();
            else if (action === 'share-video') shareVideo();
            hideContextMenu();
        });
        ui.keyboardShortcutsOverlay?.addEventListener('click', () => {
            ui.keyboardShortcutsOverlay.classList.remove('active');
        });
        document.addEventListener('keydown', (e) => {
            if (isLocked && e.key !== 'l') return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'm':
                    setVolume(player.volume() === 0 ? 1 : 0);
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 't':
                    toggleTheaterMode();
                    break;
                case 'l':
                    toggleLock();
                    break;
                case 'arrowleft':
                    if (isIframeMode && youtubePlayer) {
                        youtubePlayer.seekTo(Math.max(0, youtubePlayer.getCurrentTime() - 5), true);
                    } else {
                        player.currentTime(Math.max(0, player.currentTime() - 5));
                    }
                    showSeekFeedback('left', -5);
                    break;
                case 'arrowright':
                    if (isIframeMode && youtubePlayer) {
                        youtubePlayer.seekTo(Math.min(youtubePlayer.getDuration(), youtubePlayer.getCurrentTime() + 5), true);
                    } else {
                        player.currentTime(Math.min(player.duration(), player.currentTime() + 5));
                    }
                    showSeekFeedback('right', 5);
                    break;
                case 'arrowup':
                    setVolume(player.volume() + 0.1);
                    break;
                case 'arrowdown':
                    setVolume(player.volume() - 0.1);
                    break;
                case 'b':
                    saveBookmark(player.currentTime());
                    break;
                case 's':
                    showKeyboardShortcuts();
                    break;
                case 'c':
                    captureScreenshot();
                    break;
                case 'h':
                    shareVideo();
                    break;
            }
        });
        window.addEventListener('resize', () => {
            addChapterMarkers();
            manageAnnotations();
        });
        window.addEventListener('orientationchange', () => {
            if (!isOrientationLocked) {
                addChapterMarkers();
                manageAnnotations();
            }
        });
    };

    // Initialize stored settings
    const initSettings = () => {
        const savedVolume = localStorage.getItem('volume');
        if (savedVolume !== null) setVolume(parseFloat(savedVolume));
        const savedBrightness = localStorage.getItem('brightness');
        if (savedBrightness !== null) setBrightness(parseFloat(savedBrightness));
        const savedAutoplay = localStorage.getItem('autoplay');
        if (savedAutoplay === 'true' && ui.autoPlay) ui.autoPlay.classList.add('active');
        if (ui.chapterMarkersToggle) ui.chapterMarkersToggle.classList.toggle('active', showChapterMarkers);
        if (ui.swipeControlsToggle) ui.swipeControlsToggle.classList.toggle('active', swipeControlsEnabled);
        if (ui.autoQualityToggle) ui.autoQualityToggle.classList.toggle('active', autoQualityEnabled);
    };

    // Start ad after 5 seconds (for demo)
    setTimeout(startAd, 5000);

    // Initialize
    initSettings();
    setupEventListeners();
    initializePlayer();
});