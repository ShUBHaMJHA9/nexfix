document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) {
        console.error('Video player element not found');
        return;
    }

    const isInIframe = window.self !== window.top;

    // Initialize Video.js with default controls disabled
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
                withCredentials: false
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false
        },
        liveui: false
    });

    // Inject CSS to ensure default control bar is hidden and add transitions
    const style = document.createElement('style');
    style.textContent = `
        .vjs-control-bar { display: none !important; visibility: hidden !important; }
        .controls, .center-control, .quality-badge { transition: opacity 0.3s ease, visibility 0.3s ease; }
        .controls.hidden, .center-control.hidden, .quality-badge.hidden { opacity: 0; visibility: hidden; }
        .zoom-feedback, .speed-feedback, .seek-feedback, .volume-overlay, .brightness-overlay { 
            position: absolute; z-index: 100; background: rgba(0,0,0,0.7); color: white; padding: 8px; border-radius: 4px; }
        .annotation { cursor: pointer; transition: opacity 0.3s; }
        .annotation.active { opacity: 1; }
        .context-menu, .keyboard-shortcuts-overlay { z-index: 200; }
        .pulse { animation: pulse 0.5s; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
    `;
    document.head.appendChild(style);

    // Reload source on error plugin
    if (!videojs.getPlugin('reloadSourceOnError')) {
        videojs.registerPlugin('reloadSourceOnError', function() {
            this.on('error', () => {
                const sources = this.options_.sources || [];
                const currentSrc = this.currentSource().src;
                const nextSource = sources.find(s => s.src !== currentSrc);
                if (nextSource && retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`Retrying with source: ${nextSource.src}`);
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
        saveCustomSpeedBtn: document.getElementById('saveCustomSpeedBtn')
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
    let manualQualitySelected = false; // Track manual quality selection

    // Initialize feedback elements
    ui.zoomFeedback.className = 'zoom-feedback';
    ui.zoomFeedback.setAttribute('aria-live', 'polite');
    videoPlayer.appendChild(ui.zoomFeedback);

    ui.autoQualityFeedback.className = 'speed-feedback';
    ui.autoQualityFeedback.setAttribute('aria-live', 'polite');
    videoPlayer.appendChild(ui.autoQualityFeedback);

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
        if (isIframeMode && youtubePlayer) {
            const state = youtubePlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                youtubePlayer.pauseVideo();
                videoPlayer.classList.remove('playing');
                videoPlayer.classList.add('paused');
                if (ui.centerControl) {
                    ui.centerControl.innerHTML = '<span class="material-icons">play_arrow</span>';
                    ui.centerControl.setAttribute('aria-label', 'Play');
                }
            } else {
                youtubePlayer.playVideo();
                videoPlayer.classList.remove('paused');
                videoPlayer.classList.add('playing');
                if (ui.centerControl) {
                    ui.centerControl.innerHTML = '<span class="material-icons">pause</span>';
                    ui.centerControl.setAttribute('aria-label', 'Pause');
                }
            }
        } else {
            if (player.paused()) {
                player.play().catch(err => {
                    console.error('Play error:', err);
                    displayError('Failed to play video');
                });
                videoPlayer.classList.remove('paused');
                videoPlayer.classList.add('playing');
                if (ui.centerControl) {
                    ui.centerControl.innerHTML = '<span class="material-icons">pause</span>';
                    ui.centerControl.classList.remove('loading');
                    ui.centerControl.setAttribute('aria-label', 'Pause');
                }
            } else {
                player.pause();
                videoPlayer.classList.remove('playing');
                videoPlayer.classList.add('paused');
                if (ui.centerControl) {
                    ui.centerControl.innerHTML = '<span class="material-icons">play_arrow</span>';
                    ui.centerControl.classList.add('active');
                    ui.centerControl.setAttribute('aria-label', 'Play');
                }
            }
        }
        showControls();
    };

    const toggleLock = () => {
        isLocked = !isLocked;
        if (ui.lockOverlay) {
            ui.lockOverlay.classList.toggle('active', isLocked);
            ui.lockOverlay.innerHTML = isLocked ? '<span class="material-icons">lock</span> Locked' : '';
        }
        if (ui.lockBtn) {
            ui.lockBtn.innerHTML = `<span class="material-icons">${isLocked ? 'lock' : 'lock_open'}</span>`;
            ui.lockBtn.setAttribute('aria-label', isLocked ? 'Unlock controls' : 'Lock controls');
        }
        if (isLocked) {
            hideControls();
        } else {
            showControls();
        }
    };

    const toggleOrientationLock = async () => {
        if (isIframeMode) return;
        try {
            if (!isOrientationLocked && screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
                isOrientationLocked = true;
                if (ui.orientationFeedback) {
                    ui.orientationFeedback.textContent = 'Orientation Locked';
                    ui.orientationFeedback.classList.add('active');
                    setTimeout(() => ui.orientationFeedback.classList.remove('active'), FEEDBACK_DURATION);
                }
            } else if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
                isOrientationLocked = false;
                if (ui.orientationFeedback) {
                    ui.orientationFeedback.textContent = 'Orientation Unlocked';
                    ui.orientationFeedback.classList.add('active');
                    setTimeout(() => ui.orientationFeedback.classList.remove('active'), FEEDBACK_DURATION);
                }
            }
            if (ui.orientationBtn) {
                ui.orientationBtn.innerHTML = `<span class="material-icons">${isOrientationLocked ? 'screen_lock_rotation' : 'screen_rotation'}</span>`;
                ui.orientationBtn.setAttribute('aria-label', isOrientationLocked ? 'Unlock orientation' : 'Lock orientation');
            }
            showControls();
        } catch (err) {
            console.error('Orientation lock error:', err);
            displayError('Failed to toggle orientation lock');
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
        if (!isFullscreenActive()) {
            try {
                await videoPlayer.requestFullscreen();
                videoPlayer.classList.add('fullscreen-mode');
                hideControls();
            } catch (err) {
                console.error('Fullscreen request failed:', err);
                displayError('Failed to enter fullscreen');
            }
        } else {
            try {
                await document.exitFullscreen();
                videoPlayer.classList.remove('fullscreen-mode');
            } catch (err) {
                console.error('Exit fullscreen failed:', err);
                displayError('Failed to exit fullscreen');
            }
        }
        showControls();
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
            </ul>
        `;
        ui.keyboardShortcutsOverlay.classList.add('active');
        showControls();
    };

    const getSourceType = (sourceUrl, type) => {
        if (type) return type;
        const url = sourceUrl.toLowerCase();
        if (url.includes('.m3u8')) return 'application/x-mpegURL';
        if (url.includes('.mpd')) return 'application/dash+xml';
        if (url.includes('.webm')) return 'video/webm';
        if (url.includes('.mp4')) return 'video/mp4';
        if (url.includes('.ogv')) return 'video/ogg';
        if (url.includes('.flv')) return 'video/x-flv';
        if (url.includes('embed') || url.includes('youtube.com') || url.includes('youtu.be')) return 'iframe';
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

    const extractYouTubeVideoId = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const setupIframePlayer = async (iframeSource, meta, videoId) => {
        if (!ui.iframePlayerContainer) {
            console.error('Iframe player container not found');
            displayError('Cannot load iframe video: container missing');
            return;
        }
        isIframeMode = true;
        videoPlayer.classList.add('iframe-active');
        player.pause();
        player.reset();
        ui.iframePlayerContainer.innerHTML = '';
        if (youtubePlayer) {
            youtubePlayer.destroy();
            youtubePlayer = null;
        }
        if (iframeSource.url.includes('youtube.com') || iframeSource.url.includes('youtu.be')) {
            try {
                await loadYouTubeAPI();
                const youtubeVideoId = extractYouTubeVideoId(iframeSource.url);
                if (!youtubeVideoId) throw new Error('Invalid YouTube URL');
                const iframeContainer = document.createElement('div');
                iframeContainer.id = `youtube-player-${videoId}`;
                ui.iframePlayerContainer.appendChild(iframeContainer);
                youtubePlayer = new YT.Player(iframeContainer.id, {
                    videoId: youtubeVideoId,
                    playerVars: {
                        autoplay: ui.autoPlay?.classList.contains('active') ? 1 : 0,
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
                            videoPlayer.classList.add('paused');
                            if (ui.centerControl) {
                                ui.centerControl.innerHTML = '<span class="material-icons">play_arrow</span>';
                                ui.centerControl.setAttribute('aria-label', 'Play');
                            }
                            // Update progress bar for YouTube
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
                                videoPlayer.classList.remove('paused');
                                videoPlayer.classList.add('playing');
                                if (ui.centerControl) {
                                    ui.centerControl.innerHTML = '<span class="material-icons">pause</span>';
                                    ui.centerControl.setAttribute('aria-label', 'Pause');
                                }
                            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                                videoPlayer.classList.remove('playing');
                                videoPlayer.classList.add('paused');
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
                // Disable incompatible features
                if (ui.qualityMenu) ui.qualityMenu.innerHTML = '<li role="menuitem">Quality not available</li>';
                if (ui.captionMenu) ui.captionMenu.innerHTML = '<li role="menuitem">Subtitles not available</li>';
                if (ui.audioTrackMenu) ui.audioTrackMenu.innerHTML = '<li role="menuitem">Audio tracks not available</li>';
            } catch (err) {
                console.error('YouTube player setup failed:', err);
                displayError('Failed to load YouTube video');
                hideLoadingSpinner();
            }
        } else {
            try {
                const iframe = document.createElement('iframe');
                iframe.src = iframeSource.url;
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('allow', 'autoplay; encrypted-media');
                iframe.setAttribute('aria-label', meta.title || 'Embedded video');
                ui.iframePlayerContainer.appendChild(iframe);
                updateMeta(meta);
                // Disable incompatible features
                if (ui.qualityMenu) ui.qualityMenu.innerHTML = '<li role="menuitem">Quality not available</li>';
                if (ui.captionMenu) ui.captionMenu.innerHTML = '<li role="menuitem">Subtitles not available</li>';
                if (ui.audioTrackMenu) ui.audioTrackMenu.innerHTML = '<li role="menuitem">Audio tracks not available</li>';
                hideLoadingSpinner();
            } catch (err) {
                console.error('Iframe setup failed:', err);
                displayError('Failed to load iframe video');
                hideLoadingSpinner();
            }
        }
        if (ui.settings) ui.settings.classList.remove('active');
        if (ui.captions) ui.captions.classList.remove('active');
        if (ui.audioTracks) ui.audioTracks.classList.remove('active');
        if (ui.annotationPanel) ui.annotationPanel.classList.remove('active');
        if (ui.downloadQueuePanel) ui.downloadQueuePanel.classList.remove('active');
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

    const setupVideoJsPlayer = (source, thumbnail, subtitles, audio_tracks, meta, isLive, videoId) => {
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
        // Avoid nested proxy URLs
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
            player.src({
                src: sourceUrl,
                type: getSourceType(rawUrl, source.type)
            });
        } catch (err) {
            console.error('Error setting source:', err);
            displayError('Failed to load video source');
            hideLoadingSpinner();
            return;
        }
        player.poster(thumbnail || '/static/nexfix-logo.jpg');
        player.playbackRates([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4]);
        if (subtitles.length && ui.captionMenu) {
            ui.captionMenu.innerHTML = `<li data-track="OFF" class="active" role="menuitem">OFF <span class="material-icons">check</span></li>` +
                subtitles.map(sub => {
                    console.log('Loading subtitle:', sub.url);
                    return `
                        <li data-track="${sub.url}" data-label="${sub.name}" data-lang="${sub.language}" role="menuitem">
                            ${sub.name} (${sub.language})
                        </li>
                    `;
                }).join('');
            subtitles.forEach(sub => {
                try {
                    player.addRemoteTextTrack({
                        kind: 'subtitles',
                        src: sub.url,
                        label: sub.name,
                        language: sub.language,
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
        if (audio_tracks.length && ui.audioTrackMenu) {
            ui.audioTrackMenu.innerHTML = audio_tracks.map(track => `
                <li data-track="${track.url}" data-label="${track.name}" data-lang="${track.language}" role="menuitem">
                    ${track.name} (${track.language})
                    ${track.default ? '<span class="material-icons">check</span>' : ''}
                </li>
            `).join('');
            audio_tracks.forEach(track => {
                try {
                    player.audioTracks().addTrack(new videojs.AudioTrack({
                        id: track.url,
                        kind: 'alternative',
                        label: track.name,
                        language: track.language,
                        enabled: track.default || false
                    }));
                } catch (err) {
                    console.error('Error loading audio track:', track.url, err);
                    displayError(`Failed to load audio track: ${track.name}`);
                }
            });
        } else if (ui.audioTrackMenu) {
            ui.audioTrackMenu.innerHTML = '<li data-track="default" class="active" role="menuitem">Default Audio <span class="material-icons">check</span></li>';
        }
        updateMeta(meta);
        chapters = meta.chapters || [];
        annotations = meta.annotations || [];
        showLiveIndicator(isLive);
        if (isLive) {
            player.liveTracker.on('liveedgechange', () => {
                if (ui.liveBtn) ui.liveBtn.classList.toggle('live-edge', player.liveTracker.atLiveEdge());
            });
            if (ui.progressArea) ui.progressArea.style.pointerEvents = 'none';
            if (ui.fastRewind) ui.fastRewind.disabled = true;
            if (ui.fastForward) ui.fastForward.disabled = true;
        }
        if (ui.qualityBadge) ui.qualityBadge.textContent = source.quality || 'Auto';
        manageAnnotations();
        hideLoadingSpinner();
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

    const handleTap = (e) => {
        if (isLocked) {
            toggleLock();
            return;
        }
        const currentTime = Date.now();
        const tapLength = currentTime - lastTapTime;
        let tapX = 0, normalizedTapX = 0, validPosition = false;
        try {
            const rect = videoPlayer.getBoundingClientRect();
            if (e.clientX) {
                tapX = e.clientX - rect.left;
                validPosition = true;
            } else if (e.touches?.[0]?.clientX) {
                tapX = e.touches[0].clientX - rect.left;
                validPosition = true;
            }
            if (rect.width > 0 && validPosition) {
                normalizedTapX = tapX / rect.width;
            }
        } catch (error) {
            console.error('Position calculation error:', error);
        }
        if (tapLength < DOUBLE_TAP_THRESHOLD && tapLength > 0) {
            tapCount++;
        } else {
            tapCount = 1;
        }
        lastTapTime = currentTime;
        if (tapCount === 1) {
            setTimeout(() => {
                if (tapCount !== 1) return;
                if (ui.controls.classList.contains('active')) {
                    hideControls();
                } else {
                    showControls();
                }
                tapCount = 0;
            }, DOUBLE_TAP_THRESHOLD);
            return;
        }
        if (tapCount === 2 && validPosition) {
            const isLeftTap = normalizedTapX < REGION_THRESHOLD;
            const isRightTap = normalizedTapX > 1 - REGION_THRESHOLD;
            const isCenterTap = !isLeftTap && !isRightTap;
            if (isCenterTap) {
                toggleFullscreen();
            } else {
                const seekSeconds = isLeftTap ? -SEEK_AMOUNT : SEEK_AMOUNT;
                const direction = isLeftTap ? 'left' : 'right';
                if (isIframeMode && youtubePlayer) {
                    const currentTime = youtubePlayer.getCurrentTime();
                    const duration = youtubePlayer.getDuration();
                    const newTime = isLeftTap ? Math.max(0, currentTime + seekSeconds) : Math.min(duration, currentTime + seekSeconds);
                    youtubePlayer.seekTo(newTime, true);
                } else {
                    const newTime = isLeftTap ? Math.max(0, player.currentTime() + seekSeconds) : Math.min(player.duration(), player.currentTime() + seekSeconds);
                    player.currentTime(newTime);
                }
                showSeekFeedback(direction, seekSeconds);
            }
            tapCount = 0;
        } else if (tapCount === 3 && validPosition) {
            setZoom(1);
            tapCount = 0;
        }
    };

    const handleSwipeStart = (e) => {
        if (!swipeControlsEnabled || isZooming || isSpeedHeld || isLocked) return;
        isSwiping = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };

    const handleSwipeMove = (e) => {
        if (!isSwiping || isZooming || !isFullscreenActive() || isLocked || !swipeControlsEnabled) return;
        e.preventDefault();
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const rect = videoPlayer.getBoundingClientRect();
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_MIN_DISTANCE) {
            const seekSeconds = Math.round((dx / rect.width) * 60);
            if (isIframeMode && youtubePlayer) {
                const currentTime = youtubePlayer.getCurrentTime();
                const duration = youtubePlayer.getDuration();
                youtubePlayer.seekTo(Math.max(0, Math.min(duration, currentTime + seekSeconds)), true);
            } else {
                const newTime = Math.max(0, Math.min(player.duration(), player.currentTime() + seekSeconds));
                player.currentTime(newTime);
            }
            showSeekFeedback(seekSeconds < 0 ? 'left' : 'right', seekSeconds);
        } else if (Math.abs(dy) > SWIPE_MIN_DISTANCE && !isIframeMode) {
            const change = (dy / rect.height) * -0.5;
            if (touchStartX < rect.width * REGION_THRESHOLD) {
                const newVol = Math.min(1, Math.max(0, player.volume() + change));
                setVolume(newVol);
                showSwipeFeedback('volume', Math.round(newVol * 100));
            } else if (touchStartX > rect.width * (1 - REGION_THRESHOLD)) {
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
        if (e.touches.length < 2 || isLocked || isIframeMode) return;
        e.preventDefault();
        isZooming = true;
        isSwiping = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        if (initialPinchDistance === 0) {
            initialPinchDistance = currentDistance;
            touchStartX = (touch1.clientX + touch2.clientX) / 2;
        } else {
            const zoomChange = (currentDistance - initialPinchDistance) / PINCH_SENSITIVITY;
            const newZoom = Math.max(1, Math.min(3, zoomLevel + zoomChange));
            setZoom(newZoom);
            if (newZoom > 1) {
                const prevX = touchStartX;
                const prevY = touchStartY;
                touchStartX = (touch1.clientX + touch2.clientX) / 2;
                touchStartY = (touch1.clientY + touch2.clientY) / 2;
                panX += (touchStartX - prevX) / newZoom;
                panY += (touchStartY - prevY) / newZoom;
                setZoom(newZoom);
            }
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
        const rect = videoPlayer.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const normalizedX = x / rect.width;
        if (normalizedX < REGION_THRESHOLD || normalizedX > 1 - REGION_THRESHOLD) {
            setTimeout(() => {
                isSpeedHeld = true;
                const speed = normalizedX < REGION_THRESHOLD ? -2 : 2;
                player.playbackRate(Math.abs(speed));
                showSpeedFeedback(speed);
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
        try {
            const videoId = overrideVideoId || new URLSearchParams(window.location.search).get('video_id');
            if (!videoId) throw new Error('Missing video_id parameter');
            console.log('Initializing player for video ID:', videoId);
            showLoadingSpinner();
            const response = await fetch(`/stream/${videoId}`, {
                credentials: isInIframe ? 'same-origin' : 'include',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
                if (response.status === 404) throw new Error('Content not found or expired');
                if (response.status === 403) throw new Error('Stream expired or unauthorized');
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log("data recived from bckend :",data)
            const { sources = [], subtitle, subtitles = [], meta = {}, thumbnail = '', audio_tracks = [], is_live = false } = data;
            if (!sources.length) throw new Error('No valid video sources provided');
            const validSourceTypes = ['video/mp4', 'application/x-mpegURL', 'application/dash+xml', 'video/webm', 'video/ogg', 'video/x-flv', 'iframe'];
            const validSources = sources.filter(src => validSourceTypes.includes(src.type));
            if (!validSources.length) throw new Error('No playable sources found');
            const mp4Sources = validSources.filter(src => src.type !== 'iframe');
            const iframeSources = validSources.filter(src => src.type === 'iframe');
            const qualityOrder = ['1080p', '720p', '480p', '360p', '240p'];
            mp4Sources.sort((a, b) => {
                const aIndex = qualityOrder.indexOf(a.quality) === -1 ? qualityOrder.length : qualityOrder.indexOf(a.quality);
                const bIndex = qualityOrder.indexOf(b.quality) === -1 ? qualityOrder.length : qualityOrder.indexOf(b.quality);
                return aIndex - bIndex;
            });
        
            const initialSource = mp4Sources[0] || iframeSources[0];
            if (!initialSource) throw new Error('No initial source selected');
            const subtitleList = subtitle ? [{ url: subtitle, name: 'English', language: 'en', default: true }, ...subtitles] : subtitles;
            if (initialSource.type === 'iframe') {
                console.log('Setting up iframe player for source:', initialSource.url);
                await setupIframePlayer(initialSource, meta, videoId);
            } else {
                console.log('Setting up Video.js player for source:', initialSource.url);
                setupVideoJsPlayer(initialSource, thumbnail, subtitleList, audio_tracks, meta, is_live, videoId);
            }
            // Setup quality menu
            if (ui.qualityMenu && mp4Sources.length) {
                if (initialSource.type === 'application/x-mpegURL') {
                    // HLS quality levels
                    try {
                        player.httpSourceSelector();
                        console.log('Initialized httpSourceSelector');
                        const qualityLevels = player.qualityLevels();
                        qualityLevels.on('addqualitylevel', () => {
                            console.log('Quality levels detected:', qualityLevels.levels_);
                            ui.qualityMenu.innerHTML = qualityLevels.levels_.map((level, index) => `
                                <li data-level="${index}" data-quality="${level.height ? `${level.height}p` : 'Auto'}" role="menuitem">
                                    <span>${level.height ? `${level.height}p` : 'Auto'}</span>
                                    ${index === qualityLevels.selectedIndex ? '<span class="material-icons">check</span>' : ''}
                                </li>
                            `).concat(`
                                <li data-level="-1" data-quality="Auto" role="menuitem">
                                    <span>Auto</span>
                                    ${qualityLevels.selectedIndex === -1 ? '<span class="material-icons">check</span>' : ''}
                                </li>
                            `).join('');
                            ui.qualityMenu.querySelectorAll('li').forEach(li => {
                                li.addEventListener('click', () => {
                                    if (isLocked || isIframeMode) return;
                                    const levelIndex = parseInt(li.dataset.level);
                                    try {
                                        qualityLevels.selectedIndex = levelIndex;
                                        manualQualitySelected = true; // Disable auto-quality
                                        console.log('Selected quality level:', levelIndex, li.dataset.quality);
                                        ui.qualityMenu.querySelectorAll('li').forEach(el => {
                                            el.classList.remove('active');
                                            el.querySelector('.material-icons')?.remove();
                                        });
                                        li.classList.add('active');
                                        li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                                        if (ui.qualityBadge) {
                                            ui.qualityBadge.textContent = li.dataset.quality;
                                            ui.qualityBadge.classList.add('pulse');
                                            setTimeout(() => ui.qualityBadge.classList.remove('pulse'), 500);
                                        }
                                        togglePanel(ui.settings, false);
                                    } catch (err) {
                                        console.error('Error selecting quality:', err);
                                        displayError('Failed to switch quality');
                                    }
                                });
                            });
                        });
                        qualityLevels.on('change', () => {
                            const selectedLevel = qualityLevels.levels_[qualityLevels.selectedIndex];
                            if (ui.qualityBadge) {
                                ui.qualityBadge.textContent = selectedLevel && selectedLevel.height ? `${selectedLevel.height}p` : 'Auto';
                                console.log('Quality changed:', ui.qualityBadge.textContent);
                            }
                        });
                    } catch (err) {
                        console.error('Error initializing quality selector:', err);
                        ui.qualityMenu.innerHTML = '<li role="menuitem">Quality selection unavailable</li>';
                    }
                } else {
                    // MP4 or other sources
                    ui.qualityMenu.innerHTML = mp4Sources.map(s => `
                        <li data-url="/proxy?url=${encodeURIComponent(s.url)}" data-quality="${s.quality || 'Unknown'}" data-type="${s.type}" role="menuitem">
                            <span>${s.quality || 'Unknown'}</span>
                            ${s.quality === initialSource.quality ? '<span class="material-icons">check</span>' : ''}
                        </li>
                    `).join('');
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
                                player.play().catch(err => {
                                    console.error('Playback failed after quality switch:', err);
                                    displayError('Failed to play video');
                                });
                                manualQualitySelected = true; // Disable auto-quality
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
                                    setTimeout(() => initializePlayer(), 1000 * retryCount);
                                } else {
                                    displayError('Failed to switch quality after retries');
                                }
                            } finally {
                                hideLoadingSpinner();
                            }
                        });
                    });
                }
            } else if (ui.qualityMenu) {
                ui.qualityMenu.innerHTML = '<li role="menuitem">No quality options available</li>';
            }
            player.on('loadedmetadata', () => {
                if (!isIframeMode) {
                    const duration = player.duration();
                    if (ui.totalDuration) ui.totalDuration.textContent = formatTime(duration);
                    addChapterMarkers();
                    updateStatsPanel();
                }
                hideLoadingSpinner();
            });
            player.on('error', () => {
                const error = player.error();
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    setTimeout(() => initializePlayer(), 1000 * retryCount);
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
            const savedTime = localStorage.getItem(`playback_${videoId}`);
            if (savedTime && !isIframeMode) player.currentTime(parseFloat(savedTime));
            loadBookmarks(videoId);
        } catch (err) {
            console.error('Initialization failed:', err);
            displayError(err.message);
        } finally {
            hideLoadingSpinner();
        }
    };

        // Event Listeners
        const setupEventListeners = () => {
            // Play/Pause
            if (ui.centerControl) {
                ui.centerControl.addEventListener('click', togglePlay);
            }
    
            // Fast Forward/Rewind
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
    
            // Volume Control
            if (ui.volumeSlider) {
                ui.volumeSlider.addEventListener('input', () => {
                    setVolume(ui.volumeSlider.value / 100);
                });
            }
            if (ui.volume) {
                ui.volume.addEventListener('click', () => {
                    if (isLocked || isIframeMode) return;
                    setVolume(player.volume() === 0 ? 1 : 0);
                });
            }
    
            // Fullscreen
            if (ui.fullscreen) {
                ui.fullscreen.addEventListener('click', toggleFullscreen);
            }
    
            // Picture-in-Picture
            if (ui.pictureInPicture) {
                ui.pictureInPicture.addEventListener('click', togglePipMode);
            }
    
            // Theater Mode
            if (ui.theaterMode) {
                ui.theaterMode.addEventListener('click', toggleTheaterMode);
            }
    
            // Progress Bar
            if (ui.progressArea) {
                ui.progressArea.addEventListener('click', (e) => {
                    if (isLocked || isIframeMode) return;
                    const rect = ui.progressArea.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    if (isIframeMode && youtubePlayer) {
                        youtubePlayer.seekTo(pos * youtubePlayer.getDuration(), true);
                    } else {
                        player.currentTime(pos * player.duration());
                    }
                    showControls();
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

            // Settings
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
    
            // Captions
            if (ui.captionsBtn) {
                ui.captionsBtn.addEventListener('click', () => {
                    if (isLocked) return;
                    togglePanel(ui.captions, !ui.captions.classList.contains('active'));
                });
            }
    
            // Audio Tracks
            if (ui.audioTrackBtn) {
                ui.audioTrackBtn.addEventListener('click', () => {
                    if (isLocked) return;
                    togglePanel(ui.audioTracks, !ui.audioTracks.classList.contains('active'));
                });
            }
    
            // Caption Selection
            if (ui.captionMenu) {
                ui.captionMenu.addEventListener('click', (e) => {
                    if (isLocked || isIframeMode) return;
                    const li = e.target.closest('li');
                    if (!li) return;
                    const trackUrl = li.dataset.track;
                    player.textTracks().tracks_.forEach(track => {
                        track.mode = trackUrl === track.src ? 'showing' : 'disabled';
                    });
                    ui.captionMenu.querySelectorAll('li').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.material-icons')?.remove();
                    });
                    li.classList.add('active');
                    li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    togglePanel(ui.captions, false);
                    showControls();
                });
            }
    
            // Audio Track Selection
            if (ui.audioTrackMenu) {
                ui.audioTrackMenu.addEventListener('click', (e) => {
                    if (isLocked || isIframeMode) return;
                    const li = e.target.closest('li');
                    if (!li) return;
                    const trackLabel = li.dataset.label;
                    player.audioTracks().tracks_.forEach(track => {
                        track.enabled = track.label === trackLabel;
                    });
                    ui.audioTrackMenu.querySelectorAll('li').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.material-icons')?.remove();
                    });
                    li.classList.add('active');
                    li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    togglePanel(ui.audioTracks, false);
                    showControls();
                });
            }
    
            // Autoplay
            if (ui.autoPlay) {
                ui.autoPlay.addEventListener('click', () => {
                    if (isLocked) return;
                    ui.autoPlay.classList.toggle('active');
                    const isAutoPlay = ui.autoPlay.classList.contains('active');
                    localStorage.setItem('autoplay', isAutoPlay);
                    if (isAutoPlay && !isIframeMode) {
                        player.play().catch(() => {});
                    }
                    showControls();
                });
            }
    
            // Lock Controls
            if (ui.lockBtn) {
                ui.lockBtn.addEventListener('click', toggleLock);
            }
    
            // Orientation Lock
            if (ui.orientationBtn) {
                ui.orientationBtn.addEventListener('click', toggleOrientationLock);
            }
    
            // Skip Ad
            if (ui.skipAdBtn) {
                ui.skipAdBtn.addEventListener('click', () => {
                    if (ui.skipAdBtn.disabled) return;
                    // Handled in startAd
                });
            }
    
            // Stats Toggle
            if (ui.statsToggle) {
                ui.statsToggle.addEventListener('click', () => {
                    ui.statsToggle.classList.toggle('active');
                    updateStatsPanel();
                    showControls();
                });
            }
    
            // Chapter Markers Toggle
            if (ui.chapterMarkersToggle) {
                ui.chapterMarkersToggle.addEventListener('click', () => {
                    showChapterMarkers = !showChapterMarkers;
                    ui.chapterMarkersToggle.classList.toggle('active', showChapterMarkers);
                    addChapterMarkers();
                    showControls();
                });
            }
    
            // Swipe Controls Toggle
            if (ui.swipeControlsToggle) {
                ui.swipeControlsToggle.addEventListener('click', () => {
                    swipeControlsEnabled = !swipeControlsEnabled;
                    ui.swipeControlsToggle.classList.toggle('active', swipeControlsEnabled);
                    showControls();
                });
            }
    
            // Loop Toggle
            if (ui.loopToggle) {
                ui.loopToggle.addEventListener('click', () => {
                    isLooping = !isLooping;
                    if (!isIframeMode) player.loop(isLooping);
                    ui.loopToggle.classList.toggle('active', isLooping);
                    showControls();
                });
            }
    
            // Auto Quality Toggle
            if (ui.autoQualityToggle) {
                ui.autoQualityToggle.addEventListener('click', () => {
                    autoQualityEnabled = !autoQualityEnabled;
                    ui.autoQualityToggle.classList.toggle('active', autoQualityEnabled);
                    if (autoQualityEnabled) manualQualitySelected = false;
                    showControls();
                });
            }
    
            // Add Annotation
            if (ui.addAnnotationBtn) {
                ui.addAnnotationBtn.addEventListener('click', () => {
                    if (isLocked || isIframeMode) return;
                    const time = player.currentTime();
                    addAnnotation(time, 'New Annotation');
                    togglePanel(ui.annotationPanel, true);
                    showControls();
                });
            }
    
            // Custom Playback Speed
            if (ui.saveCustomSpeedBtn && ui.customSpeedInput) {
                ui.saveCustomSpeedBtn.addEventListener('click', () => {
                    if (isLocked || isIframeMode) return;
                    const speed = parseFloat(ui.customSpeedInput.value);
                    if (speed >= 0.25 && speed <= 4) {
                        player.playbackRate(speed);
                        showSpeedFeedback(speed);
                    }
                    showControls();
                });
            }
    
            // Annotation Menu
            if (ui.annotationMenu) {
                ui.annotationMenu.addEventListener('click', (e) => {
                    if (isLocked || isIframeMode) return;
                    const li = e.target.closest('li');
                    if (!li) return;
                    const index = parseInt(li.dataset.index);
                    const action = e.target.dataset.action;
                    if (action === 'edit') {
                        const newText = prompt('Edit annotation text:', annotations[index].text);
                        if (newText) editAnnotation(index, { text: newText });
                    } else if (action === 'delete') {
                        deleteAnnotation(index);
                    }
                    showControls();
                });
            }
    
            // Bookmark Menu
            if (ui.bookmarkMenu) {
                ui.bookmarkMenu.addEventListener('click', (e) => {
                    if (isLocked) return;
                    const li = e.target.closest('li');
                    if (!li) return;
                    const time = parseFloat(li.dataset.time);
                    const index = parseInt(li.dataset.index);
                    const action = e.target.dataset.action;
                    if (action === 'delete') {
                        deleteBookmark(index);
                    } else {
                        if (isIframeMode && youtubePlayer) {
                            youtubePlayer.seekTo(time, true);
                        } else {
                            player.currentTime(time);
                        }
                    }
                    showControls();
                });
            }
    
            // Playlist Menu
            if (ui.playlistMenu) {
                ui.playlistMenu.addEventListener('click', (e) => {
                    if (isLocked) return;
                    const li = e.target.closest('li');
                    if (!li) return;
                    const index = parseInt(li.dataset.index);
                    const action = e.target.dataset.action;
                    if (action === 'play') {
                        playPlaylistItem(index);
                    } else if (action === 'remove') {
                        removeFromPlaylist(index);
                    }
                    showControls();
                });
            }
    
            // Download Queue Menu
            if (ui.downloadQueueMenu) {
                ui.downloadQueueMenu.addEventListener('click', (e) => {
                    if (isLocked) return;
                    const li = e.target.closest('li');
                    if (!li) return;
                    const index = parseInt(li.dataset.index);
                    const action = e.target.dataset.action;
                    if (action === 'cancel') {
                        cancelDownload(index);
                    }
                    showControls();
                });
            }
    
            // Context Menu
            videoPlayer.addEventListener('contextmenu', showContextMenu);
            if (ui.contextMenu) {
                ui.contextMenu.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    if (action === 'play-pause') togglePlay();
                    else if (action === 'add-bookmark') saveBookmark(player.currentTime());
                    else if (action === 'add-annotation') addAnnotation(player.currentTime(), 'New Annotation');
                    else if (action === 'toggle-pip') togglePipMode();
                    else if (action === 'toggle-fullscreen') toggleFullscreen();
                    else if (action === 'show-shortcuts') showKeyboardShortcuts();
                    hideContextMenu();
                });
            }
            document.addEventListener('click', (e) => {
                if (!ui.contextMenu?.contains(e.target)) hideContextMenu();
            });
    
            // Keyboard Shortcuts
            document.addEventListener('keydown', (e) => {
                if (isLocked) {
                    if (e.key === 'l' || e.key === 'L') toggleLock();
                    return;
                }
                switch (e.key) {
                    case ' ':
                        e.preventDefault();
                        togglePlay();
                        break;
                    case 'm':
                    case 'M':
                        setVolume(player.volume() === 0 ? 1 : 0);
                        break;
                    case 'f':
                    case 'F':
                        toggleFullscreen();
                        break;
                    case 't':
                    case 'T':
                        toggleTheaterMode();
                        break;
                    case 'b':
                    case 'B':
                        saveBookmark(player.currentTime());
                        break;
                    case 'l':
                    case 'L':
                        toggleLock();
                        break;
                    case 'ArrowLeft':
                        if (isIframeMode && youtubePlayer) {
                            youtubePlayer.seekTo(youtubePlayer.getCurrentTime() - SEEK_AMOUNT, true);
                        } else {
                            player.currentTime(player.currentTime() - SEEK_AMOUNT);
                        }
                        showSeekFeedback('left', -SEEK_AMOUNT);
                        break;
                    case 'ArrowRight':
                        if (isIframeMode && youtubePlayer) {
                            youtubePlayer.seekTo(youtubePlayer.getCurrentTime() + SEEK_AMOUNT, true);
                        } else {
                            player.currentTime(player.currentTime() + SEEK_AMOUNT);
                        }
                        showSeekFeedback('right', SEEK_AMOUNT);
                        break;
                    case 'ArrowUp':
                        setVolume(player.volume() + 0.1);
                        break;
                    case 'ArrowDown':
                        setVolume(player.volume() - 0.1);
                        break;
                    case 's':
                    case 'S':
                        showKeyboardShortcuts();
                        break;
                }
            });
    
            // Touch Events
            videoPlayer.addEventListener('touchstart', (e) => {
                handleTap(e);
                handleSwipeStart(e);
                handleSpeedHold(e);
                handlePinchZoom(e);
            }, { passive: false });
            videoPlayer.addEventListener('touchmove', (e) => {
                handleSwipeMove(e);
                handlePinchZoom(e);
            }, { passive: false });
            videoPlayer.addEventListener('touchend', () => {
                handleSwipeEnd();
                endPinchZoom();
                releaseSpeedHold();
            }, { passive: true });
    
            // Mouse Events
            videoPlayer.addEventListener('click', handleTap);
            videoPlayer.addEventListener('mousemove', () => {
                if (!isLocked) showControls();
            });
            videoPlayer.addEventListener('mouseleave', () => {
                if (!player.paused() && !isLocked) hideControls();
            });
    
            // Player Events
            player.on('timeupdate', () => {
                if (isIframeMode) return;
                const currentTime = player.currentTime();
                const duration = player.duration();
                if (ui.current) ui.current.textContent = formatTime(currentTime);
                if (ui.progressBar && duration > 0) {
                    ui.progressBar.style.width = `${(currentTime / duration) * 100}%`;
                }
                if (ui.bufferedBar && player.buffered().length) {
                    const bufferedEnd = player.buffered().end(player.buffered().length - 1);
                    ui.bufferedBar.style.width = `${(bufferedEnd / duration) * 100}%`;
                }
                const videoId = new URLSearchParams(window.location.search).get('video_id');
                localStorage.setItem(`playback_${videoId}`, currentTime);
                manageAnnotations();
                updateStatsPanel();
            });
    
            player.on('ended', () => {
                if (isIframeMode) return;
                videoPlayer.classList.remove('playing');
                videoPlayer.classList.add('paused');
                if (ui.centerControl) {
                    ui.centerControl.innerHTML = '<span class="material-icons">replay</span>';
                    ui.centerControl.setAttribute('aria-label', 'Replay');
                }
                if (ui.autoPlay?.classList.contains('active')) {
                    const currentIndex = playlist.findIndex(item => item.active);
                    if (currentIndex < playlist.length - 1) {
                        playPlaylistItem(currentIndex + 1);
                    }
                }
                showControls();
            });
    
            player.on('volumechange', () => {
                if (isIframeMode) return;
                setVolume(player.volume());
            });
    
            // Fullscreen Change
            document.addEventListener('fullscreenchange', () => {
                isFullscreen = isFullscreenActive();
                videoPlayer.classList.toggle('fullscreen-mode', isFullscreen);
                if (ui.fullscreen) {
                    ui.fullscreen.innerHTML = `<span class="material-icons">${isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>`;
                    ui.fullscreen.setAttribute('aria-label', isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen');
                }
                showControls();
            });
    
            // Network Status
            if (navigator.connection) {
                navigator.connection.addEventListener('change', () => {
                    updateNetworkStatus();
                    adjustQualityBasedOnNetwork(player.options_.sources);
                });
            }
    
            // Picture-in-Picture Events
            player.on('enterpictureinpicture', () => {
                isPipMode = true;
                videoPlayer.classList.add('pip-mode');
                if (ui.pictureInPicture) {
                    ui.pictureInPicture.innerHTML = '<span class="material-icons">picture_in_picture_alt_off</span>';
                    ui.pictureInPicture.setAttribute('aria-label', 'Exit Picture-in-Picture');
                }
            });
            player.on('leavepictureinpicture', () => {
                isPipMode = false;
                videoPlayer.classList.remove('pip-mode');
                if (ui.pictureInPicture) {
                    ui.pictureInPicture.innerHTML = '<span class="material-icons">picture_in_picture_alt</span>';
                    ui.pictureInPicture.setAttribute('aria-label', 'Enter Picture-in-Picture');
                }
            });
    
            // Download Buttons
            if (ui.hdDownloadBtn) {
                ui.hdDownloadBtn.addEventListener('click', () => {
                    const videoId = new URLSearchParams(window.location.search).get('video_id');
                    addToDownloadQueue(videoId, `HD Download - ${ui.videoTitle?.textContent || 'Video'}`);
                });
            }
            if (ui.fastDownloadBtn) {
                ui.fastDownloadBtn.addEventListener('click', () => {
                    const videoId = new URLSearchParams(window.location.search).get('video_id');
                    addToDownloadQueue(videoId, `Fast Download - ${ui.videoTitle?.textContent || 'Video'}`);
                });
            }
        };
    
        // Initialize
        const init = async () => {
            // Load saved settings
            const savedVolume = localStorage.getItem('volume');
            if (savedVolume && !isIframeMode) setVolume(parseFloat(savedVolume));
            
            const savedBrightness = localStorage.getItem('brightness');
            if (savedBrightness && !isIframeMode) setBrightness(parseFloat(savedBrightness));
            
            const savedAutoPlay = localStorage.getItem('autoplay');
            if (savedAutoPlay === 'true' && ui.autoPlay) ui.autoPlay.classList.add('active');
    
            // Setup player
            await initializePlayer();
            setupEventListeners();
            handleIframeRestrictions();
            updateNetworkStatus();
    
            // Start ad if applicable
            if (!isInIframe && !isIframeMode) {
                startAd();
            }
        };
    
        init().catch(err => {
            console.error('Player initialization failed:', err);
            displayError('Failed to initialize player');
        });
    
        // Cleanup on unload
        window.addEventListener('beforeunload', () => {
            if (isIframeMode && youtubePlayer) {
                youtubePlayer.destroy();
            }
            if (isInIframe && window._messageHandler) {
                window.removeEventListener('message', window._messageHandler);
            }
            clearInterval(adCountdownInterval);
        });
    });