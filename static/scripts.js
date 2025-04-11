document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const player = videojs('mainPlayer', {
        fluid: true,
        responsive: true,
        playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        controlBar: { volumePanel: { inline: false }, pictureInPictureToggle: false },
        userActions: { doubleClick: false }
    });

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
        captionsBtn: document.querySelector('.captionsBtn'),
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
        brightnessOverlayIndicator: document.getElementById('brightnessOverlayIndicator'),
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
        zoomFeedback: document.createElement('div') ,
        player : videojs('mainPlayer'),
        skipAdBtn : document.getElementById('skipAdBtn'),
        skipAdTimer : document.getElementById('skipAdTimer'),
    };

    let controlTimeout;
    let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
    let isSwiping = false, swipeTimeout, speedHoldTimeout, zoomTimeout;
    let isFullscreen = false;
    let lastTapTime = 0, tapCount = 0;
    let brightness = 1;
    let swipeControlsEnabled = true;
    let showChapterMarkers = true;
    let chapters = [];
    let isSpeedHeld = false;
    let isInteracting = false;
    let zoomLevel = 1;
    let initialPinchDistance = 0;
    let isZooming = false;
    // Add zoom feedback to DOM
    ui.zoomFeedback.className = 'zoom-feedback';
    videoPlayer.appendChild(ui.zoomFeedback);

    // Utility Functions
    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}` : `${m}:${s < 10 ? '0' + s : s}`;
    };

    const togglePlay = () => {
        if (player.paused()) {
            player.play().catch(() => {});
            ui.centerControl.innerHTML = '<i class="material-icons">pause</i>';
            ui.centerControl.classList.remove('loading');
            hideControls();
        } else {
            player.pause();
            ui.centerControl.innerHTML = '<i class="material-icons">play_arrow</i>';
            showControls();
        }
    };

    const setVolume = (vol) => {
        vol = Math.max(0, Math.min(1, vol));
        player.volume(vol);
        ui.volumeSlider.value = vol * 100;
        ui.volumePercentage.textContent = `${Math.round(vol * 100)}%`;
        ui.currentVolume.textContent = Math.round(vol * 100);
        const icon = vol === 0 ? 'volume_off' : vol < 0.4 ? 'volume_down' : 'volume_up';
        ui.volume.querySelector('i').textContent = icon;
        ui.volumeIcon.textContent = icon;
        showControls();
    };

    const setBrightness = (value) => {
        brightness = Math.max(0, Math.min(1, value));
        ui.brightnessOverlay.style.opacity = 1 - brightness;
        ui.brightnessValue.textContent = `${Math.round(brightness * 100)}%`;
        ui.currentBrightness.textContent = Math.round(brightness * 100);
        const iconValue = Math.floor(brightness * 5);
        const icons = ['brightness_1', 'brightness_2', 'brightness_3', 'brightness_4', 'brightness_5'];
        ui.brightnessIcon.textContent = icons[iconValue] || 'brightness_5';
        showControls();
    };

    const setZoom = (level) => {
        zoomLevel = Math.max(1, Math.min(3, level));
        player.el().style.transform = `scale(${zoomLevel})`;
        player.el().style.transformOrigin = 'center center';
        ui.zoomFeedback.textContent = `${zoomLevel.toFixed(1)}x`;
        ui.zoomFeedback.classList.add('active');
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => ui.zoomFeedback.classList.remove('active'), 1000);
        showControls();
    };

    const showControls = () => {
        ui.controls.classList.add('active');
        ui.centerControl.classList.add('active');
        videoPlayer.style.cursor = 'auto';
        clearTimeout(controlTimeout);
        controlTimeout = setTimeout(hideControls, 3000);
    };

    const hideControls = () => {
        if (isInteracting || ui.settings.classList.contains('active') ||
            ui.captions.classList.contains('active') || isSwiping || isZooming) return;
        ui.controls.classList.remove('active');
        ui.centerControl.classList.remove('active');
        if (isFullscreen) videoPlayer.style.cursor = 'none';
    };

    const showSwipeFeedback = (type, value) => {
        if (!isFullscreen) return;
        const overlay = type === 'volume' ? ui.volumeOverlay : ui.brightnessOverlayIndicator;
        const indicator = type === 'volume' ? ui.volumeIndicator : ui.brightnessIndicator;
        overlay.classList.add('active');
        indicator.classList.add('active');
        clearTimeout(swipeTimeout);
        swipeTimeout = setTimeout(() => {
            overlay.classList.remove('active');
            indicator.classList.remove('active');
        }, 1000);
        showControls();
    };

    const showSeekFeedback = (direction, value) => {
        const feedback = direction === 'left' ? ui.seekFeedbackLeft : ui.seekFeedbackRight;
        feedback.textContent = `${value > 0 ? '+' : ''}${value}s`;
        feedback.classList.add('active');
        setTimeout(() => feedback.classList.remove('active'), 500);
        showControls();
    };

    const showSpeedFeedback = (value) => {
        ui.speedFeedback.textContent = `${value}x`;
        ui.speedFeedback.classList.add('active');
        clearTimeout(speedHoldTimeout);
        speedHoldTimeout = setTimeout(() => ui.speedFeedback.classList.remove('active'), 1000);
        showControls();
    };

    const handleSwipe = () => {
        if (!isFullscreen || !swipeControlsEnabled || isZooming) return;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const rect = videoPlayer.getBoundingClientRect();
        const minSwipeDistance = window.innerWidth < 480 ? 20 : 30;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
            const seekSeconds = Math.round(dx / rect.width * 60);
            const newTime = Math.max(0, Math.min(player.duration(), player.currentTime() + seekSeconds));
            player.currentTime(newTime);
            showSeekFeedback(seekSeconds < 0 ? 'left' : 'right', seekSeconds);
        } else if (Math.abs(dy) > minSwipeDistance) {
            const change = dy / rect.height * -0.5;
            if (touchStartX < rect.width / 2) {
                const newVol = Math.min(1, Math.max(0, player.volume() + change));
                setVolume(newVol);
                showSwipeFeedback('volume', Math.round(newVol * 100));
            } else {
                const newBrightness = Math.min(1, Math.max(0, brightness + change));
                setBrightness(newBrightness);
                showSwipeFeedback('brightness', Math.round(newBrightness * 100));
            }
        }
    };

    const handlePinchZoom = (e) => {
        if (!isFullscreen || e.touches.length < 2) return;
        e.preventDefault();
        isZooming = true;
        isSwiping = false;

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

        if (initialPinchDistance === 0) {
            initialPinchDistance = currentDistance;
        } else {
            const zoomChange = (currentDistance - initialPinchDistance) / 200;
            setZoom(zoomLevel + zoomChange);
            initialPinchDistance = currentDistance;
        }
    };
    const startAd = () => {
        ui.skipAdBtn.classList.add('visible');
        ui.skipAdBtn.disabled = true;
        let timeLeft = 5;

        ui.skipAdTimer.textContent = timeLeft;
        const timer = setInterval(() => {
            timeLeft--;
            ui.skipAdTimer.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                ui.skipAdBtn.disabled = false;
                ui.skipAdBtn.querySelector('.skip-ad-text').style.display = 'none';
                ui.skipAdBtn.querySelector('.skip-ad-active').style.display = 'inline';
            }
        }, 1000);

        ui.skipAdBtn.addEventListener('click', () => {
            if (!ui.skipAdBtn.disabled) {
                player.currentTime(player.duration()); // Skip to end (replace with actual ad skip logic)
                ui.skipAdBtn.classList.remove('visible');
            }
        });
    };
    function showLiveIndicator(isVisible) {
    const liveIndicator = document.getElementById("live-indicator");
    if (liveIndicator) {
        liveIndicator.style.display = isVisible ? "inline-block" : "none";
    }
    }  

    const endPinchZoom = () => {
        if (isZooming) {
            isZooming = false;
            initialPinchDistance = 0;
            clearTimeout(controlTimeout);
            controlTimeout = setTimeout(hideControls, 3000);
        }
    };

    const handleTap = (e) => {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTapTime;
        const rect = videoPlayer.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const tapY = e.clientY - rect.top;
        const centerRect = ui.centerControl.getBoundingClientRect();

        if (tapLength < 300 && tapLength > 0) {
            tapCount++;
        } else {
            tapCount = 1;
        }
        lastTapTime = currentTime;

        if (tapCount === 1) {
            const isCenterTap = tapX >= centerRect.left - rect.left && tapX <= centerRect.right - rect.left &&
                               tapY >= centerRect.top - rect.top && tapY <= centerRect.bottom - rect.top;

            if (isCenterTap) {
                if (player.paused()) {
                    player.play().catch(() => {});
                    ui.centerControl.innerHTML = '<i class="material-icons">pause</i>';
                    hideControls();
                } else {
                    player.pause();
                    ui.centerControl.innerHTML = '<i class="material-icons">play_arrow</i>';
                    showControls();
                }
            } else {
                if (ui.controls.classList.contains('active') || ui.centerControl.classList.contains('active')) {
                    hideControls();
                } else {
                    showControls();
                }
            }
        } else if (tapCount === 2) {
            const seekAmount = 10;
            if (tapX < rect.width / 3) {
                player.currentTime(Math.max(0, player.currentTime() - seekAmount));
                ui.rewindValue.textContent = `-${seekAmount} sec`;
                ui.rewindIndicator.classList.add('active');
                setTimeout(() => ui.rewindIndicator.classList.remove('active'), 500);
                showControls();
            } else if (tapX > (rect.width / 3) * 2) {
                player.currentTime(Math.min(player.duration(), player.currentTime() + seekAmount));
                ui.forwardValue.textContent = `+${seekAmount} sec`;
                ui.forwardIndicator.classList.add('active');
                setTimeout(() => ui.forwardIndicator.classList.remove('active'), 500);
                showControls();
            }
            tapCount = 0;
        }
    };

    const handleSpeedHold = (e) => {
        if (!isFullscreen || isSpeedHeld) return;
        const rect = videoPlayer.getBoundingClientRect();
        const x = e.type === 'touchstart' ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        if (x > rect.width * 0.7) {
            isSpeedHeld = true;
            player.playbackRate(2);
            showSpeedFeedback(2);
        }
    };

    const releaseSpeedHold = () => {
        if (isSpeedHeld) {
            player.playbackRate(1);
            ui.speedFeedback.classList.remove('active');
            isSpeedHeld = false;
        }
    };

    const addChapterMarkers = () => {
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
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                player.currentTime(chapter.time);
                showControls();
            });
            ui.progressArea.appendChild(marker);
        });
    };

    const initializePlayer = async () => {
        const videoId = new URLSearchParams(window.location.search).get('video_id');
        if (!videoId) {
            player.error({ code: 4, message: 'Missing video_id parameter' });
            ui.videoTitle.textContent = 'Error Loading Video';
            ui.videoDescription.textContent = 'Missing video_id parameter.';
            return;
        }

        try {
            const response = await fetch(`/stream/${videoId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { sources, subtitles, meta, thumbnail } = await response.json();

            sources.sort((a, b) => {
                const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p'];
                return qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality);
            });
            const initialSource = sources[0]; // ✅ Define this before using it
            console.log("Streaming from URL:", initialSource.url);

            const isLive = meta?.is_live ?? false;
            const liveBtn = document.getElementById('liveBtn');
            if (liveBtn) {
               if (isLive) {
                   liveBtn.classList.add('live-active');
              } else {
                  liveBtn.classList.remove('live-active');
                }
            }

            console.log("Is live:", isLive);
            console.log("Meta:", meta);
            console.log("Streaming URLs:", sources.map(s => s.url));

            showLiveIndicator(true);
            player.src({ src: initialSource.url, type: 'video/mp4' });
            player.poster(thumbnail || '/static/nefix-logo.jpg');
            ui.qualityBadge.textContent = initialSource.quality;

            ui.qualityMenu.innerHTML = sources.map(s => `
                <li data-url="${s.url}" data-quality="${s.quality}">
                    <span>${s.quality}</span>
                    ${s.quality === initialSource.quality ? '<span class="material-icons">check</span>' : ''}
                </li>
            `).join('');

            ui.qualityMenu.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', () => {
                    const quality = li.dataset.quality;
                    ui.qualityMenu.querySelectorAll('li').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.material-icons')?.remove();
                    });
                    li.classList.add('active');
                    li.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                    const currentTime = player.currentTime();
                    player.src({ src: li.dataset.url, type: 'video/mp4' });
                    player.currentTime(currentTime);
                    player.play().catch(() => {});
                    ui.qualityBadge.textContent = quality;
                    ui.qualityBadge.classList.add('animate-pulse');
                    setTimeout(() => ui.qualityBadge.classList.remove('animate-pulse'), 500);
                    ui.settings.classList.remove('active');
                    showControls();
                });
            });

            if (subtitles?.length) {
                ui.captionMenu.innerHTML = `<li data-track="OFF" class="active">OFF <span class="material-icons">check</span></li>` +
                    subtitles.map(sub => `
                        <li data-track="${sub.url}" data-label="${sub.label}" data-lang="${sub.lang}">
                            ${sub.label} (${sub.lang})
                            ${sub.default ? '<span class="material-icons">check</span>' : ''}
                        </li>
                    `).join('');

                subtitles.forEach(sub => {
                    const track = player.addRemoteTextTrack({
                        kind: 'subtitles',
                        src: sub.url,
                        label: sub.label,
                        language: sub.lang,
                        default: sub.default || false
                    }, false);
                    if (sub.default) track.mode = 'showing';
                });
            } else {
                ui.captionMenu.innerHTML = '<li data-track="OFF" class="active">No subtitles <span class="material-icons">check</span></li>';
            }

            if (meta) {
                ui.videoTitle.textContent = meta.title || 'Untitled Video';
                document.title = `${meta.title || 'Video'} - NEXFIX MP4HUB`;
                ui.videoDescription.textContent = meta.description || 'No description available.';
                document.getElementById('viewCount').textContent = new Intl.NumberFormat().format(meta.views || 0);
                chapters = meta.chapters || [
                    { time: 0, title: 'Intro' },
                    { time: 120, title: 'Act 1' },
                    { time: 300, title: 'Act 2' },
                    { time: 480, title: 'Climax' }
                ];
            }

            player.on('loadedmetadata', () => {
                const duration = player.duration();
                ui.totalDuration.textContent = formatTime(duration);
                document.getElementById('videoDuration').textContent = formatTime(duration);
                addChapterMarkers();
            });
        } catch (err) {
            console.error('Error loading video:', err);
            ui.videoTitle.textContent = 'Error Loading Video';
            ui.videoDescription.textContent = 'Please try again later or contact support.';
        }
    };

    const setupEvents = () => {
        videoPlayer.addEventListener('contextmenu', (e) => e.preventDefault());

        videoPlayer.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        ui.centerControl.addEventListener('click', (e) => {
            e.stopPropagation();
            handleTap(e);
        });

        ui.fastRewind.addEventListener('click', () => {
            player.currentTime(Math.max(0, player.currentTime() - 10));
            showSeekFeedback('left', -10);
        });
        ui.fastForward.addEventListener('click', () => {
            player.currentTime(Math.min(player.duration(), player.currentTime() + 10));
            showSeekFeedback('right', 10);
        });

        ui.volume.addEventListener('click', (e) => {
            if (e.target === ui.volume.querySelector('i')) setVolume(player.volume() === 0 ? 0.8 : 0);
        });
        ui.volumeSlider.addEventListener('input', (e) => setVolume(e.target.value / 100));

        ui.progressArea.addEventListener('click', (e) => {
            const duration = player.duration();
            if (!duration) return;
            const percent = e.offsetX / ui.progressArea.offsetWidth;
            player.currentTime(percent * duration);
            showControls();
        });

        player.on('timeupdate', () => {
            const current = player.currentTime();
            const duration = player.duration();
            ui.current.textContent = formatTime(current);
            ui.progressBar.style.width = `${(current / duration) * 100}%`;
            if (player.buffered().length) {
                const bufferedEnd = player.buffered().end(player.buffered().length - 1);
                ui.bufferedBar.style.width = `${(bufferedEnd / duration) * 100}%`;
                document.getElementById('bufferHealth').textContent = Math.round(bufferedEnd - current);
            }
        });

        player.on('waiting', () => ui.centerControl.classList.add('loading', 'active'));
        player.on('playing', () => ui.centerControl.classList.remove('loading'));
        player.on('error', () => ui.centerControl.classList.remove('loading'));

        ui.fullscreen.addEventListener('click', async () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
                const requestFullscreen = videoPlayer.requestFullscreen || videoPlayer.webkitRequestFullscreen || videoPlayer.mozRequestFullScreen;
                await requestFullscreen.call(videoPlayer);
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(() => {});
                }
                ui.fullscreen.innerHTML = '<i class="material-icons">fullscreen_exit</i>';
                isFullscreen = true;
            } else {
                const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
                await exitFullscreen.call(document);
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
                ui.fullscreen.innerHTML = '<i class="material-icons">fullscreen</i>';
                isFullscreen = false;
                videoPlayer.style.cursor = 'auto';
            }
            showControls();
        });

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
                isFullscreen = false;
                ui.fullscreen.innerHTML = '<i class="material-icons">fullscreen</i>';
                videoPlayer.style.cursor = 'auto';
            } else {
                isFullscreen = true;
                ui.fullscreen.innerHTML = '<i class="material-icons">fullscreen_exit</i>';
            }
            showControls();
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);

        ui.pictureInPicture.addEventListener('click', async () => {
            if (!document.pictureInPictureEnabled) {
                console.warn('Picture-in-Picture is not supported in this browser.');
                return;
            }
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await player.requestPictureInPicture();
            }
        });

        ui.settingsBtn.addEventListener('click', () => {
            ui.settings.classList.toggle('active');
            ui.captions.classList.remove('active');
            if (!ui.settings.classList.contains('active')) {
                document.querySelector('[data-label="settingHome"]').classList.add('active');
                document.querySelectorAll('.settings-panel:not([data-label="settingHome"])').forEach(panel => panel.classList.remove('active'));
            }
            showControls();
        });

        ui.captionsBtn.addEventListener('click', () => {
            ui.captions.classList.toggle('active');
            ui.settings.classList.remove('active');
            showControls();
        });

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
            ui.captions.classList.remove('active');
            showControls();
        });

        document.querySelectorAll('.settings li').forEach(item => {
            item.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li || !li.dataset.label) return;
                document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
                document.querySelector(`.settings-panel[data-label="${li.dataset.label}"]`)?.classList.add('active');
            });
        });

        ui.settings.querySelectorAll('.back-arrow').forEach(arrow => {
            arrow.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
                document.querySelector(`[data-label="${e.target.dataset.label}"]`).classList.add('active');
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

        document.getElementById('statsToggle').addEventListener('click', () => {
            ui.statsPanel.style.display = ui.statsPanel.style.display === 'none' ? 'grid' : 'none';
            ui.settings.classList.remove('active');
            showControls();
        });

        document.getElementById('chapterMarkersToggle').addEventListener('click', () => {
            showChapterMarkers = !showChapterMarkers;
            const item = document.getElementById('chapterMarkersToggle');
            if (showChapterMarkers) {
                item.classList.add('active');
                item.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
                addChapterMarkers();
            } else {
                item.classList.remove('active');
                item.querySelector('.material-icons')?.remove();
                document.querySelectorAll('.chapter-marker').forEach(marker => marker.remove());
            }
            showControls();
        });

        document.getElementById('swipeControlsToggle').addEventListener('click', () => {
            swipeControlsEnabled = !swipeControlsEnabled;
            const item = document.getElementById('swipeControlsToggle');
            if (swipeControlsEnabled) {
                item.classList.add('active');
                item.insertAdjacentHTML('beforeend', '<span class="material-icons">check</span>');
            } else {
                item.classList.remove('active');
                item.querySelector('.material-icons')?.remove();
            }
            showControls();
        });

        ui.contentTypeBtn.addEventListener('click', () => ui.contentTypeDropdown.classList.toggle('show'));

        ui.contentTypeDropdown.querySelectorAll('.content-type-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                ui.contentTypeBtn.querySelector('span').textContent = item.querySelector('span').textContent;
                ui.contentTypeBtn.querySelector('i:first-child').textContent = item.querySelector('i').textContent;
                ui.contentTypeDropdown.querySelectorAll('.content-type-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                ui.contentTypeDropdown.classList.remove('show');
            });
        });

        document.addEventListener('click', (e) => {
            if (!ui.contentTypeBtn.contains(e.target)) ui.contentTypeDropdown.classList.remove('show');
            if (!videoPlayer.contains(e.target) && !ui.settings.contains(e.target) && !ui.captions.contains(e.target)) {
                ui.settings.classList.remove('active');
                ui.captions.classList.remove('active');
                if (isFullscreen) hideControls();
            }
        });

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

        videoPlayer.addEventListener('mousemove', () => {
            if (isFullscreen) {
                isInteracting = true;
                showControls();
                clearTimeout(controlTimeout);
                controlTimeout = setTimeout(() => {
                    isInteracting = false;
                    hideControls();
                }, 3000);
            }
        });

        videoPlayer.addEventListener('mouseleave', () => {
            if (!isFullscreen) hideControls();
        });

        videoPlayer.addEventListener('mouseenter', () => {
            if (!isFullscreen) showControls();
        });

        videoPlayer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isSwiping = true;
                isInteracting = true;
                handleSpeedHold(e);
            } else if (e.touches.length === 2) {
                isSwiping = false;
                initialPinchDistance = 0;
                handlePinchZoom(e);
            }
            showControls();
        }, { passive: false });

        videoPlayer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isSwiping) {
                e.preventDefault();
                touchEndX = e.touches[0].clientX;
                touchEndY = e.touches[0].clientY;
                handleSwipe();
                touchStartX = touchEndX;
                touchStartY = touchEndY;
            } else if (e.touches.length === 2) {
                handlePinchZoom(e);
            }
        }, { passive: false });

        videoPlayer.addEventListener('touchend', (e) => {
            if (isSwiping) {
                isSwiping = false;
                isInteracting = false;
                releaseSpeedHold();
            }
            endPinchZoom();
            if (isFullscreen) {
                clearTimeout(controlTimeout);
                controlTimeout = setTimeout(hideControls, 3000);
            }
        }, { passive: true });

        videoPlayer.addEventListener('wheel', (e) => {
            if (!isFullscreen) return;
            e.preventDefault();
            const zoomStep = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(zoomLevel + zoomStep);
        }, { passive: false });

        videoPlayer.addEventListener('mousedown', (e) => {
            isInteracting = true;
            handleSpeedHold(e);
            showControls();
        });

        videoPlayer.addEventListener('mouseup', () => {
            isInteracting = false;
            releaseSpeedHold();
            if (isFullscreen) {
                clearTimeout(controlTimeout);
                controlTimeout = setTimeout(hideControls, 3000);
            }
        });

        videoPlayer.addEventListener('click', handleTap);
        
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'm': e.preventDefault(); setVolume(player.volume() === 0 ? 0.8 : 0); break;
                case 'ArrowLeft': e.preventDefault(); player.currentTime(Math.max(0, player.currentTime() - 5)); showSeekFeedback('left', -5); break;
                case 'ArrowRight': e.preventDefault(); player.currentTime(Math.min(player.duration(), player.currentTime() + 5)); showSeekFeedback('right', 5); break;
                case 'ArrowUp': e.preventDefault(); setVolume(Math.min(1, player.volume() + 0.1)); break;
                case 'ArrowDown': e.preventDefault(); setVolume(Math.max(0, player.volume() - 0.1)); break;
                case 'f': e.preventDefault(); ui.fullscreen.click(); break;
                case 'c': e.preventDefault(); ui.captionsBtn.click(); break;
                case '+': e.preventDefault(); setZoom(zoomLevel + 0.1); break;
                case '-': e.preventDefault(); setZoom(zoomLevel - 0.1); break;
            }
        });
    };
    player.ready(() => {
                player.hotkeys({ volumeStep: 0.1, seekStep: 10 });
                if (player.currentTime() === 0) startAd();
                initializePlayer();
                showLiveIndicator(true);
                setupEvents();
                setVolume(0.8);
                setBrightness(1);
                setZoom(1); // Initialize zoom at 1x
                showControls();
            });
        });