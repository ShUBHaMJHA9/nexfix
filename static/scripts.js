document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) {
        console.error('Video player element not found');
        return;
    }

    const isInIframe = window.self !== window.top;

    const player = videojs('mainPlayer', {
        fluid: true,
        responsive: true,
        controls: false,
        preload: 'auto',
        playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        userActions: { doubleClick: false }
    });

    if (!videojs.getPlugin('reloadSourceOnError')) {
        videojs.registerPlugin('reloadSourceOnError', function() {
            this.on('error', () => {
                const sources = this.options_.sources || [];
                const currentSrc = this.currentSource().src;
                const nextSource = sources.find(s => s.src !== currentSrc);
                if (nextSource) {
                    this.src(nextSource);
                    this.load();
                    this.play().catch(() => {});
                }
            });
        });
    }

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
        progressArea: document.getElementById('progressArea'),
        progressBar: videoPlayer.querySelector('.progress-bar'),
        bufferedBar: videoPlayer.querySelector('.bufferedBar'),
        current: videoPlayer.querySelector('.current'),
        totalDuration: videoPlayer.querySelector('.duration'),
        autoPlay: videoPlayer.querySelector('.auto-play'),
        settingsBtn: videoPlayer.querySelector('.settingsBtn'),
        captionsBtn: videoPlayer.querySelector('.captionsBtn'),
        settings: document.getElementById('settingsPanel'),
        captions: document.getElementById('captionsPanel'),
        captionMenu: document.getElementById('captionMenu'),
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
        skipAdBtn: document.getElementById('skipAdBtn'),
        skipAdTimer: document.getElementById('skipAdTimer'),
        hdDownloadBtn: document.getElementById('hdDownloadBtn'),
        fastDownloadBtn: document.getElementById('fastDownloadBtn'),
        liveBtn: document.getElementById('liveBtn'),
        liveTimer: document.getElementById('liveTimer')
    };

    let controlTimeout, swipeTimeout, speedHoldTimeout, zoomTimeout, adCountdownInterval;
    let touchStartX = 0, touchStartY = 0;
    let isSwiping = false, isSpeedHeld = false, isZooming = false, isInteracting = false;
    let isFullscreen = false;
    let lastTapTime = 0, tapCount = 0;
    let brightness = 1;
    let swipeControlsEnabled = true;
    let showChapterMarkers = true;
    let chapters = [];
    let zoomLevel = 1;
    let initialPinchDistance = 0;
    let panX = 0, panY = 0;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const DOUBLE_TAP_THRESHOLD = 300;
    const SEEK_AMOUNT = 10;
    const REGION_THRESHOLD = 0.33;
    const SWIPE_MIN_DISTANCE = 30;
    const PINCH_SENSITIVITY = 200;
    const SPEED_HOLD_DURATION = 500;
    const FEEDBACK_DURATION = 1000;
    const CONTROL_HIDE_TIMEOUT = 3000;

    ui.zoomFeedback.className = 'zoom-feedback';
    ui.zoomFeedback.setAttribute('aria-live', 'polite');
    videoPlayer.appendChild(ui.zoomFeedback);

    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}` : `${m}:${s < 10 ? '0' + s : s}`;
    };

    const isFullscreenActive = () => {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    };

    const showControls = () => {
        if (ui.controls) ui.controls.classList.add('active');
        if (ui.centerControl) ui.centerControl.classList.add('active');
        if (ui.qualityBadge) ui.qualityBadge.classList.add('active');
        videoPlayer.style.cursor = 'auto';
        clearTimeout(controlTimeout);
        if (isFullscreenActive()) {
            controlTimeout = setTimeout(hideControls, CONTROL_HIDE_TIMEOUT);
        }
    };

    const hideControls = () => {
        if (!isFullscreenActive()) return;
        if (isSwiping || isZooming || isSpeedHeld || isInteracting ||
            ui.settings?.classList.contains('active') ||
            ui.captions?.classList.contains('active') ||
            videoPlayer.classList.contains('vjs-ad-playing') ||
            player.paused()) return;
        if (ui.controls) ui.controls.classList.remove('active');
        if (ui.centerControl) ui.centerControl.classList.remove('active');
        if (ui.qualityBadge) ui.qualityBadge.classList.remove('active');
        videoPlayer.style.cursor = 'none';
    };

    const togglePlay = () => {
        if (player.paused()) {
            player.play().catch((err) => console.error('Play error:', err));
            if (ui.centerControl) {
                ui.centerControl.innerHTML = '<span class="material-icons">pause</span>';
                ui.centerControl.classList.remove('loading');
                ui.centerControl.setAttribute('aria-label', 'Pause');
            }
            if (isFullscreenActive()) hideControls();
        } else {
            player.pause();
            if (ui.centerControl) {
                ui.centerControl.innerHTML = '<span class="material-icons">play_arrow</span>';
                ui.centerControl.classList.add('active');
                ui.centerControl.setAttribute('aria-label', 'Play');
            }
            showControls();
        }
    };

    const setVolume = (vol) => {
        vol = Math.max(0, Math.min(1, vol));
        player.volume(vol);
        localStorage.setItem('volume', vol);
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
        brightness = Math.max(0, Math.min(2, value));
        videoPlayer.style.filter = `brightness(${brightness})`;
        localStorage.setItem('brightness', brightness);
        if (ui.brightnessValue) ui.brightnessValue.textContent = `${Math.round(brightness * 100)}%`;
        if (ui.currentBrightness) ui.currentBrightness.textContent = Math.round(brightness * 100);
        const icon = brightness < 0.5 ? 'brightness_3' : brightness < 1 ? 'brightness_5' : 'brightness_7';
        if (ui.brightnessIcon) ui.brightnessIcon.textContent = icon;
        showControls();
    };

    const setZoom = (level) => {
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
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(() => ui.zoomFeedback.classList.remove('active'), FEEDBACK_DURATION);
        }
        showControls();
    };

    const showSwipeFeedback = (type, value) => {
        if (!isFullscreenActive()) return;
        const overlay = type === 'volume' ? ui.volumeOverlay : ui.brightnessOverlay;
        const indicator = type === 'volume' ? ui.volumeIndicator : ui.brightnessIndicator;
        if (overlay && indicator) {
            indicator.textContent = `${value}%`;
            overlay.classList.add('active');
            indicator.classList.add('active');
            clearTimeout(swipeTimeout);
            swipeTimeout = setTimeout(() => {
                overlay.classList.remove('active');
                indicator.classList.remove('active');
            }, FEEDBACK_DURATION);
        }
        showControls();
    };

    const showSeekFeedback = (direction, value) => {
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
            }, FEEDBACK_DURATION / 2);
        }
        showControls();
    };

    const showSpeedFeedback = (value) => {
        if (ui.speedFeedback) {
            ui.speedFeedback.textContent = `${Math.abs(value)}x ${value < 0 ? 'Rewind' : 'Forward'}`;
            ui.speedFeedback.classList.add('active');
            clearTimeout(speedHoldTimeout);
            speedHoldTimeout = setTimeout(() => ui.speedFeedback.classList.remove('active'), FEEDBACK_DURATION);
        }
        showControls();
    };

    const startAd = () => {
        if (!ui.skipAdBtn || !ui.skipAdTimer) return;
        videoPlayer.classList.add('vjs-ad-playing');
        ui.skipAdBtn.classList.add('visible');
        ui.skipAdBtn.disabled = true;
        let timeLeft = 5;
        ui.skipAdTimer.textContent = timeLeft;
        const progress = ui.skipAdBtn.querySelector('.skip-ad-progress');
        if (progress) {
            progress.style.animation = 'none';
            setTimeout(() => progress.style.animation = 'countdown 5s linear forwards', 10);
        }
        clearInterval(adCountdownInterval);
        adCountdownInterval = setInterval(() => {
            timeLeft--;
            ui.skipAdTimer.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(adCountdownInterval);
                ui.skipAdBtn.disabled = false;
                ui.skipAdBtn.classList.add('skip-ad-active');
            }
        }, 1000);
        const skipHandler = () => {
            if (!ui.skipAdBtn.disabled) {
                videoPlayer.classList.remove('vjs-ad-playing');
                ui.skipAdBtn.classList.remove('visible', 'skip-ad-active');
                clearInterval(adCountdownInterval);
                player.play().catch(() => {});
                ui.skipAdBtn.removeEventListener('click', skipHandler);
            }
        };
        ui.skipAdBtn.addEventListener('click', skipHandler);
    };

    const showLiveIndicator = (isLive) => {
        if (!ui.liveBtn || !ui.liveTimer) return;
        videoPlayer.classList.toggle('vjs-live', isLive);
        ui.liveBtn.style.display = isLive ? 'inline-flex' : 'none';
        if (isLive) {
            let liveSeconds = 0;
            setInterval(() => {
                liveSeconds++;
                ui.liveTimer.textContent = formatTime(liveSeconds);
            }, 1000);
        }
    };

    const addChapterMarkers = () => {
        if (!ui.progressArea) return;
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
                e.stopPropagation();
                player.currentTime(chapter.time);
                showControls();
            });
            ui.progressArea.appendChild(marker);
        });
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
            const postMessage = (event, data) => {
                window.parent.postMessage({ type: `video:${event}`, data }, '*');
            };
            player.on('play', () => postMessage('play', { time: player.currentTime() }));
            player.on('pause', () => postMessage('pause', { time: player.currentTime() }));
            player.on('timeupdate', () => postMessage('timeupdate', { time: player.currentTime() }));
            player.on('error', () => postMessage('error', { message: player.error()?.message }));
            window.addEventListener('message', (event) => {
                if (event.data.type === 'video:play') {
                    player.play().catch(() => {});
                } else if (event.data.type === 'video:pause') {
                    player.pause();
                } else if (event.data.type === 'video:seek') {
                    player.currentTime(event.data.time);
                }
            });
        }
    };

    const getSourceType = (sourceUrl, type) => {
        let sourceType;
        if (type === 'hls' || type === 'application/x-mpegURL') {
            sourceType = 'application/x-mpegURL';
        } else if (type === 'mp4') {
            sourceType = 'video/mp4';
        } else if (type === 'webm') {
            sourceType = 'video/webm';
        } else if (type === 'dash') {
            sourceType = 'application/dash+xml';
        } else {
            if (sourceUrl.includes('.m3u8')) {
                sourceType = 'application/x-mpegURL';
            } else if (sourceUrl.includes('.mpd')) {
                sourceType = 'application/dash+xml';
            } else if (sourceUrl.includes('.webm')) {
                sourceType = 'video/webm';
            } else {
                sourceType = 'video/mp4';
            }
        }
        return sourceType;
    };

    const handleTap = (e) => {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTapTime;
        const rect = videoPlayer.getBoundingClientRect();
        const tapX = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const normalizedTapX = tapX / rect.width;

        if (tapLength < DOUBLE_TAP_THRESHOLD && tapLength > 0) {
            tapCount++;
        } else {
            tapCount = 1;
        }
        lastTapTime = currentTime;

        if (tapCount === 1) {
            setTimeout(() => {
                if (tapCount !== 1) return;
                togglePlay();
                tapCount = 0;
            }, DOUBLE_TAP_THRESHOLD);
        } else if (tapCount >= 2) {
            if (normalizedTapX < REGION_THRESHOLD) {
                const seekSeconds = -SEEK_AMOUNT;
                player.currentTime(Math.max(0, player.currentTime() + seekSeconds));
                showSeekFeedback('left', seekSeconds);
            } else if (normalizedTapX > 1 - REGION_THRESHOLD) {
                const seekSeconds = SEEK_AMOUNT;
                player.currentTime(Math.min(player.duration(), player.currentTime() + seekSeconds));
                showSeekFeedback('right', seekSeconds);
            }
            tapCount = 0;
        }
    };

    const handleSwipeStart = (e) => {
        if (isZooming || isSpeedHeld || !swipeControlsEnabled) return;
        isSwiping = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };

    const handleSwipeMove = (e) => {
        if (!isSwiping || isZooming || !isFullscreenActive()) return;
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const rect = videoPlayer.getBoundingClientRect();

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_MIN_DISTANCE) {
            const seekSeconds = Math.round((dx / rect.width) * 60);
            const newTime = Math.max(0, Math.min(player.duration(), player.currentTime() + seekSeconds));
            player.currentTime(newTime);
            showSeekFeedback(seekSeconds < 0 ? 'left' : 'right', seekSeconds);
        } else if (Math.abs(dy) > SWIPE_MIN_DISTANCE) {
            const change = (dy / rect.height) * -0.5;
            if (touchStartX < rect.width / 2) {
                const newBrightness = Math.min(2, Math.max(0, brightness + change));
                setBrightness(newBrightness);
                showSwipeFeedback('brightness', Math.round(newBrightness * 100));
            } else {
                const newVol = Math.min(1, Math.max(0, player.volume() + change));
                setVolume(newVol);
                showSwipeFeedback('volume', Math.round(newVol * 100));
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
        if (e.touches.length < 2) return;
        e.preventDefault();
        isZooming = true;
        isSwiping = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

        if (initialPinchDistance === 0) {
            initialPinchDistance = currentDistance;
            touchStartX = (touch1.clientX + touch2.clientX) / 2;
            touchStartY = (touch1.clientY + touch2.clientY) / 2;
        } else {
            const zoomChange = (currentDistance - initialPinchDistance) / PINCH_SENSITIVITY;
            setZoom(zoomLevel + zoomChange);
            if (zoomLevel > 1) {
                const prevX = touchStartX;
                const prevY = touchStartY;
                touchStartX = (touch1.clientX + touch2.clientX) / 2;
                touchStartY = (touch1.clientY + touch2.clientY) / 2;
                panX += (touchStartX - prevX) / zoomLevel;
                panY += (touchStartY - prevY) / zoomLevel;
                setZoom(zoomLevel);
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
        if (!isFullscreenActive() || isSpeedHeld || isZooming || isSwiping) return;
        const rect = videoPlayer.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const normalizedX = x / rect.width;
        if (normalizedX < REGION_THRESHOLD || normalizedX > 1 - REGION_THRESHOLD) {
            speedHoldTimeout = setTimeout(() => {
                isSpeedHeld = true;
                const speed = normalizedX < REGION_THRESHOLD ? -2 : 2;
                player.playbackRate(Math.abs(speed));
                showSpeedFeedback(speed);
                const seekInterval = setInterval(() => {
                    if (!isSpeedHeld) {
                        clearInterval(seekInterval);
                        return;
                    }
                    const seekSeconds = speed > 0 ? SEEK_AMOUNT : -SEEK_AMOUNT;
                    player.currentTime(Math.max(0, Math.min(player.duration(), player.currentTime() + seekSeconds)));
                    showSeekFeedback(speed > 0 ? 'right' : 'left', seekSeconds);
                }, 1000);
            }, SPEED_HOLD_DURATION);
        }
    };

    const releaseSpeedHold = () => {
        if (!isSpeedHeld) return;
        clearTimeout(speedHoldTimeout);
        player.playbackRate(1);
        if (ui.speedFeedback) ui.speedFeedback.classList.remove('active');
        isSpeedHeld = false;
        showControls();
    };

    const displayError = (message) => {
        if (ui.videoTitle) ui.videoTitle.textContent = 'Error Loading Video';
        if (ui.videoDescription) ui.videoDescription.textContent = message;
        player.error({ code: 4, message });
    };

    const initializePlayer = async () => {
        const videoId = new URLSearchParams(window.location.search).get('video_id');
        if (!videoId) {
            displayError('Missing video_id parameter');
            return;
        }

        try {
            const response = await fetch(`/stream/${videoId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Content not found or expired');
                } else if (response.status === 403) {
                    throw new Error('Stream expired');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const data = await response.json();
            console.log('Stream response:', data);

            const { sources, subtitles, meta, thumbnail, audio_tracks } = data;
            if (!Array.isArray(sources) || sources.length === 0) {
                throw new Error('No valid video sources provided');
            }

            retryCount = 0;

            sources.sort((a, b) => {
                const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', 'auto'];
                return qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality);
            });
            const initialSource = sources[0];

            const isLive = meta?.is_live ?? false;
            if (ui.liveBtn) ui.liveBtn.classList.toggle('live-active', isLive);
            showLiveIndicator(isLive);

            player.src({
                src: initialSource.url,
                type: getSourceType(initialSource.url, initialSource.type)
            });
            player.poster(thumbnail || '/static/nexfix-logo.jpg');
            if (ui.qualityBadge) ui.qualityBadge.textContent = initialSource.quality;

            if (ui.qualityMenu) {
                ui.qualityMenu.innerHTML = sources.map(s => `
                    <li data-url="${s.url}" data-quality="${s.quality}" data-type="${s.type}" role="menuitem">
                        <span>${s.quality}</span>
                        ${s.quality === initialSource.quality ? '<span class="material-icons">check</span>' : ''}
                    </li>
                `).join('');
            }

            if (ui.qualityMenu) {
                ui.qualityMenu.querySelectorAll('li').forEach(li => {
                    li.addEventListener('click', () => {
                        const quality = li.dataset.quality;
                        const url = li.dataset.url;
                        const type = li.dataset.type;
                        ui.qualityMenu.querySelectorAll('li').forEach(el => {
                            el.classList.remove('active');
                            el.querySelector('.material-icons')?.remove();
                        });
                        li.classList.add('active');
                        li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                        const currentTime = player.currentTime();
                        player.src({
                            src: url,
                            type: getSourceType(url, type)
                        });
                        player.currentTime(currentTime);
                        player.play().catch(() => {});
                        if (ui.qualityBadge) {
                            ui.qualityBadge.textContent = quality;
                            ui.qualityBadge.classList.add('pulse');
                            setTimeout(() => ui.qualityBadge.classList.remove('pulse'), 500);
                        }
                        if (ui.settings) ui.settings.classList.remove('active');
                        showControls();
                    });
                });
            }

            if (subtitles?.length && ui.captionMenu) {
                ui.captionMenu.innerHTML = `<li data-track="OFF" class="active" role="menuitem">OFF <span class="material-icons">check</span></li>` +
                    subtitles.map(sub => `
                        <li data-track="${sub.url}" data-label="${sub.name}" data-lang="${sub.language}" role="menuitem">
                            ${sub.name} (${sub.language})
                        </li>
                    `).join('');
                subtitles.forEach(sub => {
                    const track = player.addRemoteTextTrack({
                        kind: 'subtitles',
                        src: sub.url,
                        label: sub.name,
                        language: sub.language,
                        default: false
                    }, false);
                });
            } else if (ui.captionMenu) {
                ui.captionMenu.innerHTML = '<li data-track="OFF" class="active" role="menuitem">No subtitles <span class="material-icons">check</span></li>';
            }

            if (audio_tracks?.length) {
                audio_tracks.forEach(track => {
                    player.audioTracks().addTrack({
                        id: track.url,
                        kind: 'alternative',
                        label: track.name,
                        language: track.language,
                        enabled: false
                    });
                });
            }

            if (meta) {
                if (ui.videoTitle) ui.videoTitle.textContent = meta.title || 'Untitled Video';
                document.title = `${meta.title || 'Video'} - NEXFIX MP4HUB`;
                if (ui.videoDescription) ui.videoDescription.textContent = meta.description || meta.audio_status || 'No description available.';
                const viewCount = document.getElementById('viewCount');
                if (viewCount) viewCount.textContent = new Intl.NumberFormat().format(meta.views || 0);
                chapters = meta.chapters || [];
            }

            const savedTime = localStorage.getItem(`playback_${videoId}`);
            if (savedTime && !isLive) player.currentTime(parseFloat(savedTime));

            player.on('loadedmetadata', () => {
                const duration = player.duration();
                if (ui.totalDuration && !isLive) ui.totalDuration.textContent = formatTime(duration);
                const videoDuration = document.getElementById('videoDuration');
                if (videoDuration && !isLive) videoDuration.textContent = formatTime(duration);
                addChapterMarkers();
            });

            player.on('timeupdate', () => {
                if (!isLive) localStorage.setItem(`playback_${videoId}`, player.currentTime());
            });
        } catch (err) {
            console.error('Error loading video:', err);
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                displayError(`Failed to load video (attempt ${retryCount}/${MAX_RETRIES}). Retrying...`);
                setTimeout(initializePlayer, 5000);
            } else {
                displayError(`Failed to load video: ${err.message}. Please try again later or contact support.`);
            }
        }
    };

    const setupEvents = () => {
        const handleFullscreenChange = () => {
            if (!isFullscreenActive()) {
                isFullscreen = false;
                if (ui.fullscreen) ui.fullscreen.innerHTML = '<span class="material-icons">fullscreen</span>';
                videoPlayer.style.cursor = 'auto';
                showControls();
            } else {
                isFullscreen = true;
                if (ui.fullscreen) ui.fullscreen.innerHTML = '<span class="material-icons">fullscreen_exit</span>';
                if (!player.paused()) hideControls();
            }
        };

        videoPlayer.addEventListener('contextmenu', (e) => e.preventDefault());
        videoPlayer.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        if (ui.centerControl) {
            ui.centerControl.addEventListener('click', (e) => {
                e.stopPropagation();
                handleTap(e);
            });
        }

        if (ui.fastRewind) {
            ui.fastRewind.addEventListener('click', (e) => {
                e.stopPropagation();
                player.currentTime(Math.max(0, player.currentTime() - 10));
                showSeekFeedback('left', -10);
                ui.fastRewind.classList.add('active');
                setTimeout(() => ui.fastRewind.classList.remove('active'), 200);
            });
        }

        if (ui.fastForward) {
            ui.fastForward.addEventListener('click', (e) => {
                e.stopPropagation();
                player.currentTime(Math.min(player.duration(), player.currentTime() + 10));
                showSeekFeedback('right', 10);
                ui.fastForward.classList.add('active');
                setTimeout(() => ui.fastForward.classList.remove('active'), 200);
            });
        }

        if (ui.volume) {
            ui.volume.addEventListener('click', (e) => {
                if (e.target === ui.volume.querySelector('span')) {
                    setVolume(player.volume() === 0 ? 0.8 : 0);
                    ui.volume.classList.add('active');
                    setTimeout(() => ui.volume.classList.remove('active'), 200);
                }
            });
        }

        if (ui.volumeSlider) {
            ui.volumeSlider.addEventListener('input', (e) => setVolume(e.target.value / 100));
        }

        if (ui.progressArea) {
            ui.progressArea.addEventListener('click', (e) => {
                e.stopPropagation();
                const duration = player.duration();
                if (!duration) return;
                const percent = e.offsetX / ui.progressArea.offsetWidth;
                player.currentTime(percent * duration);
                showControls();
            });
        }

        player.on('timeupdate', () => {
            const current = player.currentTime();
            const duration = player.duration();
            if (ui.current) ui.current.textContent = formatTime(current);
            if (ui.progressBar && duration) ui.progressBar.style.width = `${(current / duration) * 100}%`;
            if (player.buffered().length && ui.bufferedBar && duration) {
                const bufferedEnd = player.buffered().end(player.buffered().length - 1);
                ui.bufferedBar.style.width = `${(bufferedEnd / duration) * 100}%`;
                const bufferHealth = document.getElementById('bufferHealth');
                if (bufferHealth) bufferHealth.textContent = Math.round(bufferedEnd - current);
            }
        });

        player.on('waiting', () => {
            if (ui.centerControl) {
                ui.centerControl.classList.add('loading', 'active');
                ui.centerControl.innerHTML = '';
            }
        });

        player.on('playing', () => {
            if (ui.centerControl) {
                ui.centerControl.classList.remove('loading');
                ui.centerControl.innerHTML = player.paused() ? '<span class="material-icons">play_arrow</span>' : '<span class="material-icons">pause</span>';
                ui.centerControl.setAttribute('aria-label', player.paused() ? 'Play' : 'Pause');
            }
            if (isFullscreenActive()) hideControls();
        });

        player.on('error', () => {
            if (ui.centerControl) {
                ui.centerControl.classList.remove('loading');
                ui.centerControl.innerHTML = '<span class="material-icons">error</span>';
                ui.centerControl.setAttribute('aria-label', 'Error');
            }
        });

        if (ui.fullscreen && !isInIframe) {
            ui.fullscreen.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    if (!isFullscreenActive()) {
                        const requestFullscreen = videoPlayer.requestFullscreen || videoPlayer.webkitRequestFullscreen || videoPlayer.mozRequestFullScreen;
                        await requestFullscreen.call(videoPlayer);
                        if (screen.orientation && screen.orientation.lock) {
                            screen.orientation.lock('landscape').catch(() => {});
                        }
                    } else {
                        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
                        await exitFullscreen.call(document);
                        if (screen.orientation && screen.orientation.unlock) {
                            screen.orientation.unlock();
                        }
                    }
                    ui.fullscreen.classList.add('active');
                    setTimeout(() => ui.fullscreen.classList.remove('active'), 200);
                    showControls();
                } catch (err) {
                    console.error('Fullscreen error:', err);
                }
            });
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);

        if (ui.pictureInPicture && !isInIframe) {
            ui.pictureInPicture.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!document.pictureInPictureEnabled) {
                    console.warn('Picture-in-Picture is not supported in this browser.');
                    return;
                }
                try {
                    if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                    } else {
                        await player.el().querySelector('video').requestPictureInPicture();
                    }
                    ui.pictureInPicture.classList.add('active');
                    setTimeout(() => ui.pictureInPicture.classList.remove('active'), 200);
                } catch (err) {
                    console.error('Picture-in-Picture error:', err);
                }
            });
        }

        if (ui.settingsBtn) {
            ui.settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (ui.settings) {
                    ui.settings.classList.toggle('active');
                    if (ui.captions) ui.captions.classList.remove('active');
                    if (!ui.settings.classList.contains('active')) {
                        const settingHome = document.querySelector('[data-label="settingHome"]');
                        if (settingHome) settingHome.classList.add('active');
                        document.querySelectorAll('.settings-panel:not([data-label="settingHome"])').forEach(panel => panel.classList.remove('active'));
                    }
                    ui.settingsBtn.classList.add('active');
                    setTimeout(() => ui.settingsBtn.classList.remove('active'), 200);
                    showControls();
                }
            });
        }

        if (ui.captionsBtn) {
            ui.captionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (ui.captions) {
                    ui.captions.classList.toggle('active');
                    if (ui.settings) ui.settings.classList.remove('active');
                    ui.captionsBtn.classList.add('active');
                    setTimeout(() => ui.captionsBtn.classList.remove('active'), 200);
                    showControls();
                }
            });
        }

        if (ui.captionMenu) {
            ui.captionMenu.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li) return;
                ui.captionMenu.querySelectorAll('li').forEach(el => {
                    el.classList.remove('active');
                    el.querySelector('.material-icons')?.remove();
                });
                li.classList.add('active');
                li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                const trackUrl = li.dataset.track;
                player.textTracks().tracks_.forEach(track => {
                    if (track.kind === 'subtitles') {
                        track.mode = (trackUrl === 'OFF' || track.src !== trackUrl) ? 'disabled' : 'showing';
                    }
                });
                if (ui.captions) ui.captions.classList.remove('active');
                showControls();
            });
        }

        if (ui.autoPlay) {
            ui.autoPlay.addEventListener('click', (e) => {
                e.stopPropagation();
                const isAutoPlay = localStorage.getItem('autoplay') === 'true';
                localStorage.setItem('autoplay', !isAutoPlay);
                ui.autoPlay.classList.toggle('active', !isAutoPlay);
                showControls();
            });
        }

        if (ui.hdDownloadBtn) {
            ui.hdDownloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Initiating HD Download');
                ui.hdDownloadBtn.classList.add('active');
                setTimeout(() => ui.hdDownloadBtn.classList.remove('active'), 200);
            });
        }

        if (ui.fastDownloadBtn) {
            ui.fastDownloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Initiating Fast Download');
                ui.fastDownloadBtn.classList.add('active');
                setTimeout(() => ui.fastDownloadBtn.classList.remove('active'), 200);
            });
        }

        document.querySelectorAll('.settings li').forEach(item => {
            item.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li || !li.dataset.label) return;
                document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
                const panel = document.querySelector(`.settings-panel[data-label="${li.dataset.label}"]`);
                if (panel) panel.classList.add('active');
            });
        });

        if (ui.settings) {
            ui.settings.querySelectorAll('.back-arrow').forEach(arrow => {
                arrow.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
                    const target = document.querySelector(`[data-label="${e.target.dataset.label}"]`);
                    if (target) target.classList.add('active');
                });
            });

            ui.settings.querySelectorAll('[data-speed]').forEach(li => {
                li.addEventListener('click', () => {
                    ui.settings.querySelectorAll('[data-speed]').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.material-icons')?.remove();
                    });
                    li.classList.add('active');
                    li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    player.playbackRate(parseFloat(li.dataset.speed));
                    ui.settings.classList.remove('active');
                    showControls();
                });
            });

            ui.settings.querySelectorAll('[data-zoom]').forEach(li => {
                li.addEventListener('click', () => {
                    ui.settings.querySelectorAll('[data-zoom]').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.material-icons')?.remove();
                    });
                    li.classList.add('active');
                    li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    setZoom(parseFloat(li.dataset.zoom));
                    ui.settings.classList.remove('active');
                    showControls();
                });
            });
        }

        const statsToggle = document.getElementById('statsToggle');
        if (statsToggle && ui.statsPanel) {
            statsToggle.addEventListener('click', () => {
                ui.statsPanel.style.display = ui.statsPanel.style.display === 'none' ? 'grid' : 'none';
                if (ui.settings) ui.settings.classList.remove('active');
                showControls();
            });
        }

        const chapterMarkersToggle = document.getElementById('chapterMarkersToggle');
        if (chapterMarkersToggle) {
            chapterMarkersToggle.addEventListener('click', () => {
                showChapterMarkers = !showChapterMarkers;
                if (showChapterMarkers) {
                    chapterMarkersToggle.classList.add('active');
                    chapterMarkersToggle.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    addChapterMarkers();
                } else {
                    chapterMarkersToggle.classList.remove('active');
                    chapterMarkersToggle.querySelector('.material-icons')?.remove();
                    document.querySelectorAll('.chapter-marker').forEach(marker => marker.remove());
                }
                showControls();
            });
        }

        const swipeControlsToggle = document.getElementById('swipeControlsToggle');
        if (swipeControlsToggle) {
            swipeControlsToggle.addEventListener('click', () => {
                swipeControlsEnabled = !swipeControlsEnabled;
                if (swipeControlsEnabled) {
                    swipeControlsToggle.classList.add('active');
                    swipeControlsToggle.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                } else {
                    swipeControlsToggle.classList.remove('active');
                    swipeControlsToggle.querySelector('.material-icons')?.remove();
                }
                showControls();
            });
        }

        const orientationLockToggle = document.getElementById('orientationLockToggle');
        if (orientationLockToggle) {
            orientationLockToggle.addEventListener('click', async () => {
                const isLocked = orientationLockToggle.classList.contains('active');
                try {
                    if (!isLocked && screen.orientation && screen.orientation.lock) {
                        await screen.orientation.lock('landscape');
                        orientationLockToggle.classList.add('active');
                        orientationLockToggle.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    } else if (screen.orientation && screen.orientation.unlock) {
                        await screen.orientation.unlock();
                        orientationLockToggle.classList.remove('active');
                        orientationLockToggle.querySelector('.material-icons')?.remove();
                    }
                    showControls();
                } catch (err) {
                    console.error('Orientation lock error:', err);
                }
            });
        }

        if (ui.contentTypeBtn && ui.contentTypeDropdown) {
            ui.contentTypeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                ui.contentTypeDropdown.classList.toggle('show');
            });

            ui.contentTypeDropdown.querySelectorAll('.content-type-item').forEach(item => {
                item.addEventListener('click', () => {
                    const span = ui.contentTypeBtn.querySelector('span:nth-child(2)');
                    const icon = ui.contentTypeBtn.querySelector('span:first-child');
                    if (span) span.textContent = item.querySelector('span').textContent;
                    if (icon) icon.textContent = item.querySelector('span').textContent;
                    ui.contentTypeDropdown.querySelectorAll('.content-type-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    ui.contentTypeDropdown.classList.remove('show');
                });
            });
        }

        document.addEventListener('click', (e) => {
            if (ui.contentTypeBtn && !ui.contentTypeBtn.contains(e.target)) {
                ui.contentTypeDropdown.classList.remove('show');
            }
            if (!videoPlayer.contains(e.target) && ui.settings && !ui.settings.contains(e.target) && ui.captions && !ui.captions.contains(e.target)) {
                ui.settings.classList.remove('active');
                ui.captions.classList.remove('active');
                if (isFullscreenActive()) hideControls();
            }
        });

        if (ui.settings) {
            ui.settings.addEventListener('keydown', (e) => {
                if (!ui.settings.classList.contains('active')) return;
                const items = ui.settings.querySelectorAll('li:not(.divider)');
                const activeItem = ui.settings.querySelector('li.active');
                const index = Array.from(items).indexOf(activeItem);
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % items.length;
                    items[nextIndex].click();
                    items[nextIndex].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + items.length) % items.length;
                    items[prevIndex].click();
                    items[prevIndex].focus();
                }
            });
        }

        if (ui.captions) {
            ui.captions.addEventListener('keydown', (e) => {
                if (!ui.captions.classList.contains('active')) return;
                const items = ui.captions.querySelectorAll('li');
                const activeItem = ui.captions.querySelector('li.active');
                const index = Array.from(items).indexOf(activeItem);
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % items.length;
                    items[nextIndex].click();
                    items[nextIndex].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + items.length) % items.length;
                    items[prevIndex].click();
                    items[prevIndex].focus();
                }
            });
        }

        videoPlayer.addEventListener('mousemove', () => {
            isInteracting = true;
            showControls();
            clearTimeout(controlTimeout);
            if (isFullscreenActive()) {
                controlTimeout = setTimeout(() => {
                    isInteracting = false;
                    hideControls();
                }, CONTROL_HIDE_TIMEOUT);
            }
        });

        videoPlayer.addEventListener('mouseleave', () => {
            if (!isFullscreenActive()) {
                isInteracting = false;
                clearTimeout(controlTimeout);
                showControls();
            }
        });

        videoPlayer.addEventListener('mouseenter', () => {
            if (!isFullscreenActive()) showControls();
        });

        videoPlayer.addEventListener('touchstart', (e) => {
            if (e.target.closest('.center-control, .icon, .download-btn')) return;
            if (e.touches.length === 1) {
                handleSwipeStart(e);
                handleSpeedHold(e);
                isInteracting = true;
                showControls();
            } else if (e.touches.length === 2) {
                handlePinchZoom(e);
            }
        }, { passive: false });

        videoPlayer.addEventListener('touchmove', (e) => {
            if (e.target.closest('.center-control, .icon, .download-btn')) return;
            if (e.touches.length === 1 && isSwiping) {
                e.preventDefault();
                handleSwipeMove(e);
            } else if (e.touches.length === 2) {
                handlePinchZoom(e);
            }
        }, { passive: false });

        videoPlayer.addEventListener('touchend', () => {
            if (isSwiping || isZooming || isSpeedHeld) {
                handleSwipeEnd();
                endPinchZoom();
                releaseSpeedHold();
            }
            isInteracting = false;
            if (isFullscreenActive()) {
                clearTimeout(controlTimeout);
                controlTimeout = setTimeout(hideControls, CONTROL_HIDE_TIMEOUT);
            }
        }, { passive: true });

        videoPlayer.addEventListener('wheel', (e) => {
            if (!isFullscreenActive()) return;
            e.preventDefault();
            const zoomStep = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(zoomLevel + zoomStep);
        }, { passive: false });

        videoPlayer.addEventListener('click', (e) => {
            if (e.target.closest('.center-control, .icon, .download-btn')) return;
            handleTap(e);
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case ' ': case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'm':
                    e.preventDefault();
                    setVolume(player.volume() === 0 ? 0.8 : 0);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    player.currentTime(Math.max(0, player.currentTime() - 5));
                    showSeekFeedback('left', -5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    player.currentTime(Math.min(player.duration(), player.currentTime() + 5));
                    showSeekFeedback('right', 5);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume(Math.min(1, player.volume() + 0.1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume(Math.max(0, player.volume() - 0.1));
                    break;
                case 'f':
                    e.preventDefault();
                    if (ui.fullscreen && !isInIframe) ui.fullscreen.click();
                    break;
                case 'c':
                    e.preventDefault();
                    if (ui.captionsBtn) ui.captionsBtn.click();
                    break;
                case '+':
                    e.preventDefault();
                    setZoom(zoomLevel + 0.1);
                    break;
                case '-':
                    e.preventDefault();
                    setZoom(zoomLevel - 0.1);
                    break;
            }
            showControls();
        });

        const cleanupEvents = () => {
            videoPlayer.removeEventListener('click', handleTap);
            videoPlayer.removeEventListener('touchstart', handleSwipeStart);
            videoPlayer.removeEventListener('touchmove', handleSwipeMove);
            videoPlayer.removeEventListener('touchend', handleSwipeEnd);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        };

        player.on('dispose', cleanupEvents);
    };

    player.ready(() => {
        player.hotkeys({ volumeStep: 0.1, seekStep: 10 });
        if (player.currentTime() === 0) startAd();
        initializePlayer();
        setupEvents();
        handleIframeRestrictions();
        const savedVolume = localStorage.getItem('volume') || 0.8;
        const savedBrightness = localStorage.getItem('brightness') || 1;
        setVolume(parseFloat(savedVolume));
        setBrightness(parseFloat(savedBrightness));
        setZoom(1);
        showControls();
        if (localStorage.getItem('autoplay') === 'true') {
            player.play().catch(() => {});
        }
    });
});