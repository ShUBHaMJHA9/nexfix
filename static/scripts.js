/* Ensure controls fade in/out smoothly */
.controls, .center-control, .quality-badge {
    opacity: 1;
    transition: opacity 0.3s ease;
}

.controls:not(.active), .center-control:not(.active), .quality-badge:not(.active) {
    opacity: 0;
    pointer-events: none;
}

/* Disabled buttons in iframe */
.icon.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Existing styles (ensure these are included) */
.error-message {
    color: #ff4444;
    font-size: 16px;
    text-align: center;
    margin-top: 10px;
}

.skip-ad-progress {
    width: 100%;
    height: 4px;
    background: #ccc;
    position: absolute;
    bottom: 0;
    left: 0;
}

@keyframes countdown {
    from { width: 100%; }
    to { width: 0; }
}

/* Add font fallback */
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}