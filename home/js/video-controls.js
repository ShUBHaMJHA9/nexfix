document.addEventListener('DOMContentLoaded', () => {
    const player = videojs('mainPlayer');
    const elements = {
        playPauseBtn: document.getElementById('playPauseBtn'),
        muteBtn: document.getElementById('muteBtn'),
        volumeSlider: document.getElementById('volumeSlider'),
        progressBar: document.getElementById('progressBar'),
        currentTime: document.getElementById('currentTime'),
        duration: document.getElementById('duration'),
        fastRewindBtn: document.getElementById('fastRewindBtn'),
        fastForwardBtn: document.getElementById('fastForwardBtn'),
        pipBtn: document.getElementById('pipBtn'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        playbackSpeedMenu: document.getElementById('playbackSpeedMenu'),
        qualityMenu: document.getElementById('qualityMenu'),
        captionMenu: document.getElementById('captionMenu'),
        customControls: document.getElementById('customControls')
    };

    let controlTimeout;
    const controlTimeoutDuration = 3000;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function showControls() {
        elements.customControls.classList.remove('hidden');
        clearTimeout(controlTimeout);
        if (!player.paused()) {
            controlTimeout = setTimeout(() => {
                elements.customControls.classList.add('hidden');
            }, controlTimeoutDuration);
        }
    }

    // Initialize controls
    player.on('loadedmetadata', () => {
        elements.duration.textContent = formatTime(player.duration());
        elements.progressBar.max = player.duration();
    });

    player.on('timeupdate', () => {
        elements.currentTime.textContent = formatTime(player.currentTime());
        elements.progressBar.value = player.currentTime();
    });

    player.on('play', () => {
        elements.playPauseBtn.querySelector('i').textContent = 'pause';
        elements.playPauseBtn.setAttribute('aria-label', 'Pause');
        showControls();
    });

    player.on('pause', () => {
        elements.playPauseBtn.querySelector('i').textContent = 'play_arrow';
        elements.playPauseBtn.setAttribute('aria-label', 'Play');
        showControls();
    });

    // Control interactions
    elements.playPauseBtn.addEventListener('click', () => {
        player.paused() ? player.play() : player.pause();
    });

    elements.muteBtn.addEventListener('click', () => {
        player.muted(!player.muted());
        elements.muteBtn.querySelector('i').textContent = player.muted() ? 'volume_off' : 'volume_up';
        elements.muteBtn.setAttribute('aria-label', player.muted() ? 'Unmute' : 'Mute');
    });

    elements.volumeSlider.addEventListener('input', () => {
        const volume = elements.volumeSlider.value / 100;
        player.volume(volume);
        player.muted(volume === 0);
        elements.muteBtn.querySelector('i').textContent = volume === 0 ? 'volume_off' : 'volume_up';
    });

    elements.progressBar.addEventListener('input', () => {
        player.currentTime(elements.progressBar.value);
    });

    elements.fastRewindBtn.addEventListener('click', () => {
        player.currentTime(player.currentTime() - 10);
    });

    elements.fastForwardBtn.addEventListener('click', () => {
        player.currentTime(player.currentTime() + 10);
    });

    elements.pipBtn.addEventListener('click', async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await player.requestPictureInPicture();
            }
        } catch (err) {
            console.error('PIP error:', err);
        }
    });

    elements.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            player.requestFullscreen();
            elements.fullscreenBtn.querySelector('i').textContent = 'fullscreen_exit';
        } else {
            document.exitFullscreen();
            elements.fullscreenBtn.querySelector('i').textContent = 'fullscreen';
        }
    });

    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.toggle('hidden');
    });

    // Playback speed
    elements.playbackSpeedMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const speed = parseFloat(item.dataset.speed);
            player.playbackRate(speed);
            elements.playbackSpeedMenu.querySelectorAll('li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            elements.settingsPanel.classList.add('hidden');
        });
    });

    // Quality levels
    const qualityLevels = player.qualityLevels();
    qualityLevels.on('addqualitylevel', () => {
        elements.qualityMenu.innerHTML = '<li data-quality="auto" class="active">Auto</li>';
        qualityLevels.levels_.forEach((level, index) => {
            const li = document.createElement('li');
            li.dataset.quality = level.height + 'p';
            li.textContent = level.height + 'p';
            li.addEventListener('click', () => {
                qualityLevels.levels_.forEach((l, i) => l.enabled = i === index);
                elements.qualityMenu.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                li.classList.add('active');
                elements.settingsPanel.classList.add('hidden');
            });
            elements.qualityMenu.appendChild(li);
        });
    });

    // Captions
    const textTracks = player.textTracks();
    textTracks.on('addtrack', () => {
        elements.captionMenu.innerHTML = '<li data-caption="off" class="active">Off</li>';
        for (let i = 0; i < textTracks.length; i++) {
            if (textTracks[i].kind === 'captions') {
                const li = document.createElement('li');
                li.dataset.caption = textTracks[i].label;
                li.textContent = textTracks[i].label;
                li.addEventListener('click', () => {
                    for (let j = 0; j < textTracks.length; j++) {
                        textTracks[j].mode = j === i ? 'showing' : 'disabled';
                    }
                    elements.captionMenu.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                    li.classList.add('active');
                    elements.settingsPanel.classList.add('hidden');
                });
                elements.captionMenu.appendChild(li);
            }
        }
    });

    // Show/hide controls on interaction
    player.on('mousemove', showControls);
    player.on('touchstart', showControls);
});