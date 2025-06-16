// Chat Management System
class ChatManager {
    constructor(partyManager) {
        this.partyManager = partyManager;
        this.socket = partyManager.socket;
        this.messageHistory = [];
        this.maxMessages = 100;
        this.isEmojiPickerOpen = false;
        
        this.initializeDOM();
        this.initializeEventListeners();
        this.initializeSocketEvents();
    }

    initializeDOM() {
        this.elements = {
            // Main chat elements
            partyChatSection: document.getElementById('partyChatSection'),
            partyChatMessages: document.getElementById('partyChatMessages'),
            partyChatInput: document.getElementById('partyChatInput'),
            sendPartyChatBtn: document.getElementById('sendPartyChatBtn'),
            togglePartyChatBtn: document.getElementById('togglePartyChatBtn'),
            
            // Popup chat elements
            popupPartyChatMessages: document.getElementById('popupPartyChatMessages'),
            popupPartyChatInput: document.getElementById('popupPartyChatInput'),
            popupSendPartyMessage: document.getElementById('popupSendPartyMessage'),
            
            // Reaction elements
            partyReactionBtn: document.getElementById('partyReactionBtn'),
            reactionPicker: document.getElementById('reactionPicker'),
            reactionOptions: document.querySelectorAll('.reaction-option')
        };
    }

    initializeEventListeners() {
        // Main chat input
        if (this.elements.partyChatInput) {
            this.elements.partyChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage(this.elements.partyChatInput);
                }
            });

            this.elements.partyChatInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        // Popup chat input
        if (this.elements.popupPartyChatInput) {
            this.elements.popupPartyChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage(this.elements.popupPartyChatInput);
                }
            });

            this.elements.popupPartyChatInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        // Send buttons
        if (this.elements.sendPartyChatBtn) {
            this.elements.sendPartyChatBtn.addEventListener('click', () => {
                this.sendMessage(this.elements.partyChatInput);
            });
        }

        if (this.elements.popupSendPartyMessage) {
            this.elements.popupSendPartyMessage.addEventListener('click', () => {
                this.sendMessage(this.elements.popupPartyChatInput);
            });
        }

        // Chat toggle
        if (this.elements.togglePartyChatBtn) {
            this.elements.togglePartyChatBtn.addEventListener('click', () => {
                this.toggleChat();
            });
        }

        // Reaction button
        if (this.elements.partyReactionBtn) {
            this.elements.partyReactionBtn.addEventListener('click', () => {
                this.toggleReactionPicker();
            });
        }

        // Reaction options
        this.elements.reactionOptions.forEach(option => {
            option.addEventListener('click', () => {
                const reaction = option.getAttribute('data-reaction');
                this.sendReaction(reaction);
                this.hideReactionPicker();
            });
        });

        // Close reaction picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#partyReactionBtn') && 
                !e.target.closest('#reactionPicker')) {
                this.hideReactionPicker();
            }
        });

        // Auto-resize chat inputs
        this.setupAutoResize(this.elements.partyChatInput);
        this.setupAutoResize(this.elements.popupPartyChatInput);
    }

    initializeSocketEvents() {
        // Listen for new messages
        this.socket.on('new_message', (message) => {
            this.handleNewMessage(message);
        });

        // Listen for chat history
        this.socket.on('chat_history', (data) => {
            this.loadChatHistory(data.messages);
        });

        // Listen for reactions
        this.socket.on('reaction_sent', (data) => {
            this.handleReaction(data);
        });

        // Listen for typing indicators
        this.socket.on('user_typing', (data) => {
            this.showTypingIndicator(data);
        });

        this.socket.on('user_stopped_typing', (data) => {
            this.hideTypingIndicator(data);
        });
    }

    // Message handling
    sendMessage(inputElement) {
        if (!inputElement || !this.partyManager.currentParty) return;

        const messageText = inputElement.value.trim();
        if (!messageText) return;

        // Basic message validation
        if (messageText.length > 500) {
            this.showNotification('Message too long (max 500 characters)', 'error');
            return;
        }

        // Send message via socket
        this.socket.emit('send_message', {
            message: messageText,
            type: 'chat'
        });

        // Clear input
        inputElement.value = '';
        this.adjustTextareaHeight(inputElement);

        // Stop typing indicator
        this.stopTyping();
    }

    sendReaction(reaction) {
        if (!this.partyManager.currentParty) return;

        this.socket.emit('send_message', {
            message: reaction,
            type: 'reaction'
        });

        this.showFloatingReaction(reaction);
    }

    handleNewMessage(message) {
        // Add to message history
        this.messageHistory.push(message);
        
        // Keep only last maxMessages
        if (this.messageHistory.length > this.maxMessages) {
            this.messageHistory = this.messageHistory.slice(-this.maxMessages);
        }

        // Display message in both chat containers
        this.displayMessage(message, this.elements.partyChatMessages);
        this.displayMessage(message, this.elements.popupPartyChatMessages);

        // Play notification sound for other users' messages
        if (message.user_id !== this.partyManager.userId) {
            this.playNotificationSound();
            
            // Show desktop notification if page is not focused
            if (document.hidden) {
                this.showDesktopNotification(message);
            }
        }
    }

    handleReaction(data) {
        this.showFloatingReaction(data.reaction, data.username);
        
        // Add reaction as a system message
        const reactionMessage = {
            id: `reaction_${Date.now()}`,
            user_id: data.user_id,
            username: data.username,
            text: `reacted with ${data.reaction}`,
            timestamp: new Date().toISOString(),
            type: 'reaction'
        };

        this.displayMessage(reactionMessage, this.elements.partyChatMessages);
        this.displayMessage(reactionMessage, this.elements.popupPartyChatMessages);
    }

    loadChatHistory(messages) {
        this.messageHistory = messages;
        
        // Clear existing messages
        if (this.elements.partyChatMessages) {
            this.elements.partyChatMessages.innerHTML = '';
        }
        if (this.elements.popupPartyChatMessages) {
            this.elements.popupPartyChatMessages.innerHTML = '';
        }

        // Display all messages
        messages.forEach(message => {
            this.displayMessage(message, this.elements.partyChatMessages);
            this.displayMessage(message, this.elements.popupPartyChatMessages);
        });
    }

    displayMessage(message, container) {
        if (!container) return;

        const messageElement = this.createMessageElement(message);
        container.appendChild(messageElement);
        
        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Animate new message
        setTimeout(() => {
            messageElement.classList.add('message-appear');
        }, 10);
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        
        if (message.type === 'reaction') {
            messageDiv.className = 'reaction-message';
            messageDiv.innerHTML = `
                <span class="reaction-user">${message.username}</span>
                <span class="reaction-text">${message.text}</span>
                <span class="message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
            `;
        } else if (message.type === 'system') {
            messageDiv.className = 'system-message';
            messageDiv.textContent = message.text;
        } else {
            messageDiv.className = 'chat-message';
            const isOwnMessage = message.user_id === this.partyManager.userId;
            
            if (isOwnMessage) {
                messageDiv.classList.add('own-message');
            }

            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="chat-user" style="color: ${this.getUserColor(message.user_id)}">${message.username}</span>
                    <span class="chat-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="chat-text">${this.formatMessageText(message.text)}</div>
            `;
        }

        return messageDiv;
    }

    formatMessageText(text) {
        // Basic text formatting
        let formattedText = this.escapeHtml(text);
        
        // Convert URLs to links
        formattedText = formattedText.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );

        // Convert emoji shortcodes
        formattedText = this.convertEmojiShortcodes(formattedText);

        return formattedText;
    }

    convertEmojiShortcodes(text) {
        const emojiMap = {
            ':)': '😊',
            ':D': '😃',
            ':(': '😢',
            ':P': '😛',
            ';)': '😉',
            ':heart:': '❤️',
            ':thumbsup:': '👍',
            ':thumbsdown:': '👎',
            ':fire:': '🔥',
            ':clap:': '👏',
            ':party:': '🎉'
        };

        let result = text;
        Object.entries(emojiMap).forEach(([shortcode, emoji]) => {
            result = result.replace(new RegExp(this.escapeRegex(shortcode), 'g'), emoji);
        });

        return result;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            // Same day - show only time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // Different day - show date and time
            return date.toLocaleString([], { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    getUserColor(userId) {
        // Generate consistent color for each user
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    // Typing indicators
    handleTyping() {
        if (!this.typingTimer) {
            this.socket.emit('typing_start');
        }
        
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.stopTyping();
        }, 1000);
    }

    stopTyping() {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
            this.socket.emit('typing_stop');
        }
    }

    showTypingIndicator(data) {
        if (data.user_id === this.partyManager.userId) return;

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = `typing_${data.user_id}`;
        indicator.innerHTML = `
            <span class="typing-user">${data.username} is typing</span>
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        // Add to both chat containers
        [this.elements.partyChatMessages, this.elements.popupPartyChatMessages].forEach(container => {
            if (container) {
                // Remove existing typing indicator for this user
                const existing = container.querySelector(`#typing_${data.user_id}`);
                if (existing) existing.remove();
                
                container.appendChild(indicator.cloneNode(true));
                container.scrollTop = container.scrollHeight;
            }
        });
    }

    hideTypingIndicator(data) {
        [this.elements.partyChatMessages, this.elements.popupPartyChatMessages].forEach(container => {
            if (container) {
                const indicator = container.querySelector(`#typing_${data.user_id}`);
                if (indicator) indicator.remove();
            }
        });
    }

    // Reaction picker
    toggleReactionPicker() {
        if (this.elements.reactionPicker) {
            this.isEmojiPickerOpen = !this.isEmojiPickerOpen;
            
            if (this.isEmojiPickerOpen) {
                this.showReactionPicker();
            } else {
                this.hideReactionPicker();
            }
        }
    }

    showReactionPicker() {
        if (this.elements.reactionPicker) {
            this.elements.reactionPicker.classList.remove('hidden');
            this.isEmojiPickerOpen = true;
        }
    }

    hideReactionPicker() {
        if (this.elements.reactionPicker) {
            this.elements.reactionPicker.classList.add('hidden');
            this.isEmojiPickerOpen = false;
        }
    }

    showFloatingReaction(reaction, username = null) {
        const reactionElement = document.createElement('div');
        reactionElement.className = 'floating-reaction';
        reactionElement.textContent = reaction;
        
        if (username) {
            reactionElement.title = `Reaction from ${username}`;
        }

        // Position randomly on screen
        reactionElement.style.left = Math.random() * (window.innerWidth - 100) + 'px';
        reactionElement.style.top = Math.random() * (window.innerHeight - 100) + 100 + 'px';

        document.body.appendChild(reactionElement);

        // Animate and remove
        setTimeout(() => {
            reactionElement.style.opacity = '0';
            reactionElement.style.transform = 'translateY(-50px) scale(1.5)';
        }, 100);

        setTimeout(() => {
            if (reactionElement.parentNode) {
                reactionElement.parentNode.removeChild(reactionElement);
            }
        }, 2000);
    }

    // Chat visibility
    toggleChat() {
        if (this.elements.partyChatMessages) {
            this.elements.partyChatMessages.classList.toggle('hidden');
        }
    }

    showChat() {
        if (this.elements.partyChatSection) {
            this.elements.partyChatSection.classList.remove('hidden');
        }
    }

    hideChat() {
        if (this.elements.partyChatSection) {
            this.elements.partyChatSection.classList.add('hidden');
        }
    }

    // Auto-resize functionality
    setupAutoResize(textarea) {
        if (!textarea) return;

        textarea.addEventListener('input', () => {
            this.adjustTextareaHeight(textarea);
        });
    }

    adjustTextareaHeight(textarea) {
        if (!textarea) return;

        textarea.style.height = 'auto';
        const maxHeight = 100; // Maximum height in pixels
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = newHeight + 'px';
        textarea.style.overflowY = newHeight >= maxHeight ? 'scroll' : 'hidden';
    }

    // Notifications
    playNotificationSound() {
        try {
            // Create a subtle notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    showDesktopNotification(message) {
        if (Notification.permission === 'granted') {
            new Notification(`${message.username} in party chat`, {
                body: message.text,
                icon: '/static/images/logo.png', // Add your logo
                tag: 'party-chat'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showDesktopNotification(message);
                }
            });
        }
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        }
    }

    // Clear chat
    clearChat() {
        this.messageHistory = [];
        
        if (this.elements.partyChatMessages) {
            this.elements.partyChatMessages.innerHTML = '';
        }
        if (this.elements.popupPartyChatMessages) {
            this.elements.popupPartyChatMessages.innerHTML = '';
        }
    }

    // Export chat history
    exportChatHistory() {
        if (this.messageHistory.length === 0) {
            this.showNotification('No chat history to export', 'info');
            return;
        }

        const chatText = this.messageHistory.map(message => {
            const timestamp = this.formatTimestamp(message.timestamp);
            return `[${timestamp}] ${message.username}: ${message.text}`;
        }).join('\n');

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `party_chat_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showNotification('Chat history exported', 'success');
    }
}

// CSS for floating reactions and typing indicators
const chatStyles = `
.floating-reaction {
    position: fixed;
    font-size: 2rem;
    pointer-events: none;
    z-index: 10000;
    transition: all 2s ease-out;
    opacity: 1;
    transform: translateY(0) scale(1);
}

.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--bg-lighter);
    border-radius: var(--border-radius);
    margin-bottom: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.typing-dots {
    display: flex;
    gap: 2px;
}

.typing-dots span {
    width: 4px;
    height: 4px;
    background: var(--text-secondary);
    border-radius: 50%;
    animation: typing-dot 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing-dot {
    0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.message-appear {
    animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.reaction-message {
    text-align: center;
    font-style: italic;
    color: var(--text-secondary);
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

.own-message {
    margin-left: 20%;
}

.own-message .message-header .chat-user {
    color: var(--primary-color) !important;
}

.chat-message .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.chat-user {
    font-weight: 600;
    font-size: 0.9rem;
}

.chat-timestamp {
    font-size: 0.7rem;
    color: var(--text-secondary);
}

.chat-text {
    line-height: 1.4;
}

.chat-text a {
    color: var(--primary-color);
    text-decoration: underline;
}

.chat-text a:hover {
    text-decoration: none;
}
`;

// Inject chat styles
const styleSheet = document.createElement('style');
styleSheet.textContent = chatStyles;
document.head.appendChild(styleSheet);

// Initialize chat manager when party manager is available
document.addEventListener('DOMContentLoaded', () => {
    // Wait for party manager to be available
    const initChatManager = () => {
        if (window.partyManager) {
            window.chatManager = new ChatManager(window.partyManager);
            console.log('Chat manager initialized');
        } else {
            setTimeout(initChatManager, 100);
        }
    };
    
    initChatManager();
});

