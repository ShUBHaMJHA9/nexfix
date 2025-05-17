/* ===== Base Variables & Styles ===== */
:root {
  /* Light Mode Colors */
  --primary-color: #065fd4;
  --primary-dark: #0548a8;
  --text-color: #030303;
  --text-secondary: #606060;
  --bg-light: #ffffff;
  --bg-lighter: #f9f9f9;
  --bg-dark: #000000;
  --border-color: rgba(0, 0, 0, 0.1);
  --button-bg: rgba(0, 0, 0, 0.05);
  --button-hover-bg: rgba(0, 0, 0, 0.1);
  --card-bg: #ffffff;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --overlay-bg: rgba(0, 0, 0, 0.7);
  --white: #ffffff;
  --border-radius: 4px;
  --fs-10: 0.625rem;
  --fw-600: 600;
  --transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  --z-low: 10;
  --z-medium: 50;
  --z-high: 100;
  --z-overlay: 1000;
}

/* Dark Mode */
.dark-mode {
  --primary-color: #3ea6ff;
  --primary-dark: #2c83d6;
  --text-color: #ffffff;
  --text-secondary: #aaaaaa;
  --bg-light: #282828;
  --bg-lighter: #3d3d3d;
  --bg-dark: #121212;
  --border-color: rgba(255, 255, 255, 0.1);
  --button-bg: rgba(255, 255, 255, 0.1);
  --button-hover-bg: rgba(255, 255, 255, 0.2);
  --card-bg: #282828;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Reduced Motion Preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* Reusable Hidden Class */
.hidden {
  display: none !important;
}

/* General Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Poppins', sans-serif;
  background: var(--bg-light);
  color: var(--text-color);
  line-height: 1.5;
}

/* Theme Toggle Button */
#theme-toggle {
  position: fixed;
  top: 20px;
  left: 20px;
  background: var(--button-bg);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  z-index: var(--z-high);
}

#theme-toggle:hover,
#theme-toggle:focus {
  background: var(--button-hover-bg);
  outline: none;
}

#theme-toggle i {
  font-size: 20px;
  color: var(--text-color);
}

/* Telegram Ribbon */
.telegram-ribbon {
  position: fixed;
  top: 10px;
  right: -60px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: var(--white);
  padding: 8px 40px;
  transform: rotate(45deg);
  box-shadow: var(--shadow);
  z-index: var(--z-overlay);
  text-align: center;
  font-size: var(--fs-10);
  font-weight: var(--fw-600);
  transition: var(--transition);
}

.telegram-ribbon a {
  color: var(--white);
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

.telegram-ribbon i {
  font-size: 16px;
}

.telegram-ribbon:hover,
.telegram-ribbon:focus {
  right: -50px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  outline: none;
}

/* Telegram Banner */
#telegram-banner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  width: 100%;
}

.telegram-join-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: var(--bg-lighter);
  border-radius: 8px;
  color: var(--text-color);
  max-width: 800px;
  width: 100%;
  box-shadow: var(--shadow);
}

.telegram-logo {
  width: 40px;
  height: auto;
}

.telegram-text {
  flex: 1;
  display: flex;
  font-weight: bold;
  flex-direction: column;
  justify-content: center;
}

.telegram-links {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
}

.telegram-btn {
  background-color: var(--primary-color);
  color: var(--white);
  padding: 6px 12px;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}

.telegram-btn:hover,
.telegram-btn:focus {
  background-color: var(--primary-dark);
  outline: none;
}

/* Notice Banner */
.notice-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: var(--bg-lighter);
  border-radius: 8px;
  margin: 16px;
  box-shadow: var(--shadow);
}

.cta-button {
  background: var(--primary-color);
  color: var(--white);
  padding: 6px 12px;
  border-radius: 4px;
  text-decoration: none;
  transition: var(--transition);
}

.cta-button:hover,
.cta-button:focus {
  background: var(--primary-dark);
  outline: none;
}

/* Navigation */
.nav-wrapper {
  background: var(--bg-light);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: var(--z-medium);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  text-decoration: none;
  color: var(--text-color);
}

.logo i {
  font-size: 28px;
  margin-right: 8px;
}

.main-color {
  color: var(--primary-color);
}

.search-bar {
  flex: 1;
  max-width: 400px;
  margin: 0 16px;
}

.search-input-wrapper {
  position: relative;
}

#search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-lighter);
  color: var(--text-color);
}

.search-popup {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-light);
  border-radius: 4px;
  box-shadow: var(--shadow);
  display: none;
  z-index: var(--z-high);
}

.nav-menu {
  display: flex;
  gap: 16px;
  list-style: none;
}

.nav-menu a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition);
}

.nav-menu a:hover,
.nav-menu a:focus {
  color: var(--primary-color);
  outline: none;
}

.dropdown {
  position: relative;
}

.dropdown-toggle::after {
  content: '▼';
  font-size: 10px;
  margin-left: 4px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-light);
  border-radius: 4px;
  box-shadow: var(--shadow);
  display: none;
  list-style: none;
  min-width: 150px;
  z-index: var(--z-high);
}

.dropdown:hover .dropdown-menu,
.dropdown:focus-within .dropdown-menu {
  display: block;
}

.dropdown-menu li {
  padding: 8px 16px;
}

.dropdown-menu a {
  display: block;
  font-weight: 400;
}

.btn-hover {
  background: var(--primary-color);
  color: var(--white);
  padding: 8px 16px;
  border-radius: 4px;
  transition: var(--transition);
}

.btn-hover:hover,
.btn-hover:focus {
  background: var(--primary-dark);
  outline: none;
}

.hamburger-menu {
  display: none;
  cursor: pointer;
}

.hamburger {
  width: 24px;
  height: 3px;
  background: var(--text-color);
  position: relative;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 3px;
  background: var(--text-color);
  left: 0;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  top: 8px;
}

/* Main Layout */
.main {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 24px;
  gap: 32px;
  box-sizing: border-box;
}

.left-column {
  flex: 7;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-column {
  flex: 3;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Video Player */
.video_player {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--bg-dark);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.video-js {
  width: 100%;
  height: 100%;
  background-color: var(--bg-dark);
}

.center-control {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--overlay-bg);
  border: none;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-medium);
  transition: var(--transition);
}

.center-control .material-icons {
  font-size: 36px;
  color: var(--white);
}

.center-control:hover,
.center-control:focus {
  background: var(--primary-color);
  transform: translate(-50%, -50%) scale(1.05);
  outline: none;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 0.8s linear infinite;
  z-index: var(--z-medium);
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.quality-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--overlay-bg);
  color: var(--white);
  font-size: 0.625rem;
  padding: 3px 6px;
  border-radius: 2px;
  z-index: var(--z-low);
}

.vjs-big-play-centered .vjs-big-play-button {
  background: var(--overlay-bg);
  border: none;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  font-size: 36px;
  color: var(--white);
  transition: var(--transition);
}

.vjs-big-play-button:hover,
.vjs-big-play-button:focus {
  background: var(--primary-color);
  transform: scale(1.05);
  outline: none;
}

.controls {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 6px 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  transition: opacity 0.3s ease;
  z-index: var(--z-medium);
}

.controls.hidden {
  opacity: 0;
  pointer-events: none;
}

.controls-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls .icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--white);
  padding: 6px;
  border-radius: 50%;
  transition: var(--transition);
}

.controls .icon:hover,
.controls .icon:focus {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-color);
  transform: scale(1.1);
  outline: none;
}

.controls .material-icons {
  font-size: 22px;
}

.progress-area {
  height: 5px;
  background: var(--text-secondary);
  cursor: pointer;
  border-radius: 2px;
}

.bufferedBar {
  background: var(--text-secondary);
  height: 100%;
  border-radius: 2px;
}

.progress-bar {
  background: var(--primary-color);
  height: 100%;
  position: relative;
  border-radius: 2px;
}

.progress-bar span {
  display: block;
  width: 10px;
  height: 10px;
  background: var(--primary-color);
  border-radius: 50%;
  position: absolute;
  right: -5px;
  top: -2.5px;
}

.volume {
  position: relative;
}

.volume-popup {
  position: absolute;
  bottom: 44px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-light);
  padding: 6px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  display: none;
}

.volume:hover .volume-popup,
.volume:focus-within .volume-popup {
  display: block;
}

.volume-slider {
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  -moz-appearance: slider-vertical;
  appearance: slider-vertical;
  width: 5px;
  height: 60px;
  background: var(--text-secondary);
  cursor: pointer;
  border-radius: 2px;
}

.volume-slider::-webkit-slider-thumb {
  background: var(--primary-color);
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.volume-slider::-moz-range-thumb {
  background: var(--primary-color);
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.volume-percentage {
  font-size: 0.625rem;
  color: var(--text-color);
  text-align: center;
  margin-top: 4px;
}

/* Engagement Buttons */
.engagement-buttons {
  display: flex;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.engagement-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--button-bg);
  border: none;
  padding: 8px 12px;
  border-radius: 18px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  transition: var(--transition);
}

.engagement-btn:hover,
.engagement-btn:focus {
  background: var(--button-hover-bg);
  outline: none;
}

.engagement-btn i {
  font-size: 20px;
}

.engagement-btn .count {
  margin-left: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.engagement-btn.active {
  color: var(--primary-color);
}

.engagement-btn.active i {
  color: var(--primary-color);
}

/* Watch Party Section */
.watch-party-section {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--shadow);
}

.watch-party-section h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.watch-party-section p {
  margin: 0 0 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.watch-party-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  background: var(--primary-color);
  color: var(--white);
}

.btn:hover,
.btn:focus {
  background: var(--primary-dark);
  outline: none;
}

.btn.outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn.outline:hover,
.btn.outline:focus {
  background: rgba(6, 95, 212, 0.1);
}

/* Watch Party Popup */
.watch-party-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-overlay);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.watch-party-popup:not(.hidden) {
  opacity: 1;
  pointer-events: all;
}

.party-popup-content {
  background: var(--bg-light);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.watch-party-popup:not(.hidden) .party-popup-content {
  transform: translateY(0);
}

.party-popup-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.party-popup-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-popup {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
}

.close-popup:hover,
.close-popup:focus {
  color: var(--text-color);
  outline: none;
}

.party-popup-body {
  padding: 16px;
}

.party-tab-buttons {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.party-tab {
  flex: 1;
  padding: 12px;
  text-align: center;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-color);
  transition: var(--transition);
}

.party-tab.active {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
}

.party-tab:hover,
.party-tab:focus {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
  outline: none;
}

.party-tab-content {
  display: none;
}

.party-tab-content.active {
  display: block;
}

.party-form-group {
  margin-bottom: 16px;
}

.party-form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

.party-form-group input {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-lighter);
  color: var(--text-color);
}

.party-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.party-active-view {
  padding: 16px;
}

.party-chat-container {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 16px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.party-chat-messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background: var(--bg-lighter);
}

.chat-message {
  margin-bottom: 8px;
  font-size: 14px;
}

.chat-message strong {
  color: var(--primary-color);
}

.party-chat-input {
  display: flex;
  border-top: 1px solid var(--border-color);
}

.party-chat-input input {
  flex: 1;
  border: none;
  padding: 10px;
  background: var(--bg-lighter);
  color: var(--text-color);
}

.party-chat-input button {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  transition: var(--transition);
}

.party-chat-input button:hover,
.party-chat-input button:focus {
  background: var(--primary-dark);
  outline: none;
}

.party-members {
  margin-bottom: 16px;
}

.party-member {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-lighter);
  border-radius: 4px;
  margin-bottom: 8px;
}

.host-badge {
  background: var(--primary-color);
  color: var(--white);
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
}

.party-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.party-control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--button-bg);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-color);
  transition: var(--transition);
}

.party-control-btn:hover,
.party-control-btn:focus {
  background: var(--button-hover-bg);
  outline: none;
}

.leave-party-btn {
  width: 100%;
  padding: 10px;
  background: #ff3333;
  color: var(--white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
}

.leave-party-btn:hover,
.leave-party-btn:focus {
  background: #cc0000;
  outline: none;
}

/* Movie Details */
.movie-detail {
  padding: 16px 0;
}

.movie-detail-content h1 {
  font-size: 24px;
  margin-bottom: 12px;
}

.meta-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.badge-wrapper {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge-fill {
  background: var(--primary-color);
  color: var(--white);
}

.badge-outline {
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.ganre-wrapper {
  display: flex;
  gap: 8px;
}

.ganre-wrapper a {
  color: var(--primary-color);
  text-decoration: none;
}

.ganre-wrapper a:hover,
.ganre-wrapper a:focus {
  text-decoration: underline;
  outline: none;
}

.date-time {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.storyline {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Cast Section */
.cast-section {
  position: relative;
}

.cast-grid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--text-secondary) transparent;
}

.cast-grid::-webkit-scrollbar {
  height: 4px;
}

.cast-grid::-webkit-scrollbar-thumb {
  background: var(--text-secondary);
  border-radius: 2px;
}

.cast-member {
  min-width: 120px;
  text-align: center;
}

.cast-image-container img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.cast-name {
  font-size: 14px;
  margin: 8px 0 4px;
}

.cast-role {
  font-size: 12px;
  color: var(--text-secondary);
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--button-bg);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.nav-arrow:hover,
.nav-arrow:focus {
  background: var(--button-hover-bg);
  outline: none;
}

.nav-arrow-left {
  left: -16px;
}

.nav-arrow-right {
  right: -16px;
}

.nav-arrow .material-icons {
  font-size: 20px;
  color: var(--text-color);
}

/* Recommended Videos */
.recommended-videos {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: var(--target-height, 100vh);
  overflow-y: auto;
}

.recommended-video {
  display: flex;
  gap: 12px;
}

.recommended-video-link {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: var(--text-color);
}

.recommended-video-thumbnail {
  position: relative;
  width: 160px;
  height: 90px;
}

.recommended-video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.recommended-video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: var(--overlay-bg);
  color: var(--white);
  padding: 2px 4px;
  font-size: 12px;
  border-radius: 2px;
}

.recommended-video-info {
  flex: 1;
}

.recommended-video-title {
  font-size: 16px;
  margin: 0 0 8px;
}

.recommended-video-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.recommended-video-meta .material-icons {
  font-size: 16px;
}

.recommended-video-description {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: var(--button-bg);
  border: none;
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
  margin-top: 16px;
}

.load-more-btn:hover,
.load-more-btn:focus {
  background: var(--button-hover-bg);
  outline: none;
}

/* Error Overlay */
.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--overlay-bg);
  color: var(--white);
  padding: 20px;
  border-radius: 8px;
  z-index: var(--z-high);
  text-align: center;
  max-width: 80%;
}

.error-message {
  font-size: 14px;
}

.error-message button {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-message button:hover,
.error-message button:focus {
  background: var(--primary-dark);
  outline: none;
}

/* Notification */
.notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-light);
  color: var(--text-color);
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: var(--shadow);
  z-index: var(--z-overlay);
  opacity: 1;
  transition: opacity 0.3s ease;
}

.notification.fade-out {
  opacity: 0;
}

/* Footer */
.footer {
  background: var(--bg-lighter);
  padding: 40px 20px;
  color: var(--text-secondary);
}

.footer-top {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-brand-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.footer-list {
  display: flex;
  gap: 20px;
  list-style: none;
}

.footer-link {
  color: var(--text-color);
  text-decoration: none;
}

.footer-link:hover,
.footer-link:focus {
  color: var(--primary-color);
  outline: none;
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 20px 0;
}

.quicklink-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quicklink-list {
  display: flex;
  gap: 20px;
  list-style: none;
}

.quicklink-link {
  color: var(--text-secondary);
  text-decoration: none;
}

.quicklink-link:hover,
.quicklink-link:focus {
  color: var(--primary-color);
  outline: none;
}

.social-list {
  display: flex;
  gap: 12px;
}

.social-link {
  color: var(--text-color);
  font-size: 24px;
  text-decoration: none;
}

.social-link:hover,
.social-link:focus {
  color: var(--primary-color);
  outline: none;
}

.footer-bottom {
  max-width: 1200px;
  margin: 20px auto 0;
  text-align: center;
}

.copyright {
  font-size: 14px;
}

/* Responsive Adjustments */
@media (max-width: 600px) {
  .main {
    flex-direction: column;
    padding: 16px;
  }

  .right-column {
    max-width: 100%;
  }

  .engagement-buttons {
    gap: 4px;
    justify-content: space-between;
  }

  .watch-party-buttons {
    flex-direction: column;
  }

  .telegram-join-banner {
    flex-direction: column;
    text-align: center;
  }

  .telegram-links {
    flex-direction: column;
  }

  .nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-light);
    flex-direction: column;
    padding: 16px;
    box-shadow: var(--shadow);
  }

  .nav-menu.active {
    display: flex;
  }

  .hamburger-menu {
    display: block;
  }

  .dropdown-menu {
    position: static;
    box-shadow: none;
  }
}