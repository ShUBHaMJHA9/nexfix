class SocketManager {
    constructor(partyManager, videoManager) {
        this.partyManager = partyManager;
        this.videoManager = videoManager;
        this.socket = null;
        this.initializeSocket();
    }

    initializeSocket() {
        if (!window.io) {
            console.error('Socket.IO library not loaded');
            this.videoManager.showNotification('Socket.IO library failed to load', 'error');
            return;
        }

        this.socket = io(window.location.origin, {
            path: '/ws/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            this.videoManager.showNotification('Connected to server', 'success');
        });

        this.socket.on('user_connected', (data) => {
            this.partyManager.userId = data.user_id;
            this.partyManager.username = data.username || `User_${data.user_id.slice(0, 4)}`;
            this.videoManager.showNotification(`Connected as ${this.partyManager.username}`, 'info');
        });

        this.socket.on('party_created', (party) => {
            this.partyManager.handlePartyJoined(party, true);
            this.videoManager.showNotification(`Party "${party.name}" created! Code: ${party.code}`, 'success');
        });

        this.socket.on('party_joined', (data) => {
            this.partyManager.handlePartyJoined(data, false);
        });

        this.socket.on('error', (error) => {
            this.videoManager.showNotification(`Party error: ${error.message}`, 'error');
            if (['Party not found', 'Invalid password', 'Party is full', 'Already in party', 'Party has expired'].includes(error.message)) {
                this.partyManager.elements.watchPartyPopup.classList.add('hidden');
            }
        });

        this.socket.on('video_sync', (videoState) => {
            if (this.videoManager.syncVideoWithParty) {
                this.videoManager.syncVideoWithParty(videoState, this.partyManager.isHost);
                this.videoManager.showNotification('Video state synced', 'info');
            }
        });

        this.socket.on('chat_message', (data) => {
            this.partyManager.displayChatMessage(data);
        });

        this.socket.on('kicked_from_party', () => {
            this.partyManager.handlePartyLeft();
            this.videoManager.showNotification('You were removed from the party', 'error');
        });

        this.socket.on('webrtc_offer', (data) => {
            if (this.partyManager.handleWebRTCOffer) {
                this.partyManager.handleWebRTCOffer(data);
            } else {
                console.warn('WebRTC offer received but handleWebRTCOffer is not implemented');
            }
        });

        this.socket.on('webrtc_answer', (data) => {
            if (this.partyManager.handleWebRTCAnswer) {
                this.partyManager.handleWebRTCAnswer(data);
            } else {
                console.warn('WebRTC answer received but handleWebRTCAnswer is not implemented');
            }
        });

        this.socket.on('webrtc_ice_candidate', (data) => {
            if (this.partyManager.handleWebRTCIceCandidate) {
                this.partyManager.handleWebRTCIceCandidate(data);
            } else {
                console.warn('WebRTC ICE candidate received but handleWebRTCIceCandidate is not implemented');
            }
        });

        this.socket.on('member_media_changed', (data) => {
            const { user_id, type, enabled } = data;
            if (user_id !== this.partyManager.userId) {
                const username = this.partyManager.currentParty?.members.find(m => m.id === user_id)?.username || 'A user';
                this.videoManager.showNotification(`${username} ${enabled ? 'enabled' : 'disabled'} ${type}`, 'info');
            }
        });

        this.socket.on('member_joined', (data) => {
            if (this.partyManager.currentParty) {
                this.partyManager.currentParty.members = data.members;
                this.partyManager.updateMembersList();
                this.partyManager.displayChatMessage({
                    username: 'System',
                    content: `${data.username} joined the party`,
                    timestamp: new Date().toISOString()
                });
                this.videoManager.showNotification(`${data.username} joined the party`, 'info');
            }
        });

        this.socket.on('member_left', (data) => {
            if (this.partyManager.currentParty) {
                this.partyManager.currentParty.members = data.members;
                if (this.partyManager.closePeerConnection) {
                    this.partyManager.closePeerConnection(data.user_id);
                }
                this.partyManager.updateMembersList();
                this.partyManager.displayChatMessage({
                    username: 'System',
                    content: `${data.username} left the party`,
                    timestamp: new Date().toISOString()
                });
                this.videoManager.showNotification(`${data.username} left the party`, 'info');
            }
        });

        this.socket.on('party_left', () => {
            this.partyManager.handlePartyLeft();
        });

        this.socket.on('party_expired', () => {
            this.partyManager.handlePartyLeft();
            this.videoManager.showNotification('Party has expired', 'error');
        });

        this.socket.on('disconnect', () => {
            this.videoManager.showNotification('Disconnected from server', 'error');
            if (this.partyManager.cleanupWebRTCConnections) {
                this.partyManager.cleanupWebRTCConnections();
            }
            this.partyManager.handlePartyLeft();
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket.IO connection error:', err.message);
            this.videoManager.showNotification(`Failed to connect to server: ${err.message}`, 'error');
        });
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not initialized for event:', event);
            this.videoManager.showNotification('Cannot send event: not connected', 'error');
        }
    }

    joinRoom(room) {
        if (this.socket) {
            this.socket.emit('join_room', room);
        }
    }

    leaveRoom(room) {
        if (this.socket) {
            this.socket.emit('leave_room', room);
        }
    }
}
