class PartyManager {
    constructor(videoManager) {
        this.videoManager = videoManager;
        this.currentParty = null;
        this.isHost = false;
        this.userId = Math.random().toString(36).substring(2); // Mock user ID
        this.username = `User${this.userId.slice(0, 4)}`; // Mock username
        this.currentChatTab = 'main';
        this.privateChatRecipient = null;
        this.isInParty = false;
        this.blockedUsers = new Set(); // Track blocked users
        this.mutedUsers = new Set(); // Track muted users
        this.elements = this.initializeDOM();
        this.initializeEventListeners();
        this.updateUIState();
    }

    initializeDOM() {
        return {
            createPartyBtn: document.getElementById('createPartyBtn'),
            joinPartyBtn: document.getElementById('joinPartyBtn'),
            createPartyBtn2: document.getElementById('createPartyBtn2'),
            joinPartyBtn2: document.getElementById('joinPartyBtn2'),
            leavePartyBtn: document.getElementById('leavePartyBtn'),
            leavePartyBtn2: document.getElementById('leavePartyBtn2'),
            partyButtonContainer: document.getElementById('partyButtonContainer'),
            activePartyView: document.getElementById('chat-content'),
            publicChatHeader: document.getElementById('publicChatHeader'),
            partyChatMessages: document.getElementById('partyChatMessages'),
            partyChatInput: document.getElementById('partyChatInput'),
            sendPartyMessage: document.getElementById('sendPartyMessage'),
            partyFileInput: document.getElementById('partyFileInput'), // New file input
            partyMembersList: document.getElementById('partyMembersList'),
            partyPlayPause: document.getElementById('partyPlayPause'),
            partySync: document.getElementById('partySync'),
            watchPartyPopup: document.getElementById('watchPartyPopup'),
            closePartyPopup: document.getElementById('closePartyPopup'),
            partyTabs: document.querySelectorAll('.party-tab'),
            partyName: document.getElementById('partyName'),
            partyPrivacy: document.getElementById('partyPrivacy'),
            partyPassword: document.getElementById('partyPassword'),
            maxMembers: document.getElementById('maxMembers'),
            partyCode: document.getElementById('partyCode'),
            joinPassword: document.getElementById('joinPassword'),
            confirmCreateParty: document.getElementById('confirmCreateParty'),
            cancelCreateParty: document.getElementById('cancelCreateParty'),
            confirmJoinParty: document.getElementById('confirmJoinParty'),
            cancelJoinParty: document.getElementById('cancelJoinParty'),
            partyInfoContainer: document.getElementById('partyInfoContainer'),
            partyNameDisplay: document.getElementById('partyNameDisplay'),
            partyMemberCount: document.getElementById('partyMemberCount'),
            partyCodeDisplay: document.getElementById('partyCodeDisplay'),
            copyPartyCodeBtn: document.getElementById('copyPartyCodeBtn'),
            currentPartyStatus: document.getElementById('currentPartyStatus'),
            chatTabs: document.querySelectorAll('.chat-tab'),
            toggleMembersBtn: document.getElementById('toggleMembersBtn'),
            onlineMembersPopup: document.getElementById('onlineMembersPopup'),
            closeMembersPopup: document.getElementById('closeMembersPopup'),
            membersSearch: document.getElementById('membersSearch'),
            userActionMenu: document.getElementById('userActionMenu'),
            partyCodeDisplaySidebar: document.getElementById('partyCodeDisplaySidebar'),
            onlineMembersCount: document.getElementById('onlineMembersCount'),
            partyControls: document.querySelector('.party-controls'),
            partyChatSection: document.getElementById('partyChatSection'),
            togglePublicMembersBtn: document.getElementById('togglePublicMembersBtn'),
            publicOnlineCount: document.getElementById('publicOnlineCount'),
            partyCodeBtn: document.getElementById('partyCodeBtn'),
            emojiPickerBtn: document.getElementById('emojiPickerBtn'),
            emojiPickerContainer: document.getElementById('emojiPickerContainer'),
            closeEmojiPicker: document.getElementById('closeEmojiPicker'),
            emojiCategoryBtns: document.querySelectorAll('.emoji-category-btn'),
            emojiGrid: document.getElementById('emojiGrid'),
            hostControls: document.getElementById('hostControls'),
            banUserBtn: document.getElementById('banUserBtn'),
            kickUserBtn: document.getElementById('kickUserBtn'), // New kick button
            banUserModal: document.getElementById('banUserModal'),
            closeBanModal: document.getElementById('closeBanModal'),
            cancelBanBtn: document.getElementById('cancelBanBtn'),
            confirmBanBtn: document.getElementById('confirmBanBtn'),
            banTemporaryCheck: document.getElementById('banTemporaryCheck'),
            banPermanentCheck: document.getElementById('banPermanentCheck'),
            banReason: document.getElementById('banReason'),
            userBlockedToast: document.getElementById('userBlockedToast'),
            closeBlockToast: document.getElementById('closeBlockToast'),
            recommendedVideos: document.getElementById('recommended-content')
        };
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');

        // Create and Join Party Buttons
        this.bindPartyButtonListeners();

        // Close Watch Party Popup
        if (this.elements.closePartyPopup) {
            this.elements.closePartyPopup.addEventListener('click', () => {
                this.elements.watchPartyPopup.classList.add('hidden');
                console.log('Closed watch party popup');
            });
        }

        // Party Tabs (Create/Join)
        if (this.elements.partyTabs) {
            this.elements.partyTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.elements.partyTabs.forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.party-tab-content').forEach(c => c.classList.remove('active'));
                    tab.classList.add('active');
                    const tabContent = document.querySelector(`[data-tab-content="${tab.dataset.tab}"]`);
                    if (tabContent) {
                        tabContent.classList.add('active');
                        console.log(`Switched to tab: ${tab.dataset.tab}`);
                    } else {
                        console.error(`Tab content not found for data-tab-content="${tab.dataset.tab}"`);
                    }
                });
            });
        }

        // Party Creation and Joining
        if (this.elements.confirmCreateParty) {
            this.elements.confirmCreateParty.addEventListener('click', (e) => this.createParty(e));
        }
        if (this.elements.confirmJoinParty) {
            this.elements.confirmJoinParty.addEventListener('click', (e) => this.joinParty(e));
        }
        if (this.elements.cancelCreateParty) {
            this.elements.cancelCreateParty.addEventListener('click', () => {
                this.elements.watchPartyPopup.classList.add('hidden');
                console.log('Cancelled create party');
            });
        }
        if (this.elements.cancelJoinParty) {
            this.elements.cancelJoinParty.addEventListener('click', () => {
                this.elements.watchPartyPopup.classList.add('hidden');
                console.log('Cancelled join party');
            });
        }

        // Copy Party Code
        if (this.elements.copyPartyCodeBtn) {
            this.elements.copyPartyCodeBtn.addEventListener('click', () => this.copyPartyCode());
        }
        if (this.elements.partyCodeBtn) {
            this.elements.partyCodeBtn.addEventListener('click', () => this.copyPartyCode());
        }

        // Leave Party
        if (this.elements.leavePartyBtn) {
            this.elements.leavePartyBtn.addEventListener('click', () => {
                window.socketManager?.emit('leave_party');
                this.handlePartyLeft();
                console.log('Leave party triggered');
            });
        }
        if (this.elements.leavePartyBtn2) {
            this.elements.leavePartyBtn2.addEventListener('click', () => {
                this.elements.leavePartyBtn.click();
                console.log('Leave party (secondary) triggered');
            });
        }

        // Chat Controls
        if (this.elements.sendPartyMessage) {
            this.elements.sendPartyMessage.addEventListener('click', () => this.sendChatMessage());
        }
        if (this.elements.partyChatInput) {
            this.elements.partyChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }
        if (this.elements.partyFileInput) {
            this.elements.partyFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        if (this.elements.emojiPickerBtn) {
            this.elements.emojiPickerBtn.addEventListener('click', () => {
                this.elements.emojiPickerContainer.classList.toggle('hidden');
                console.log('Emoji picker toggled');
            });
        }
        if (this.elements.closeEmojiPicker) {
            this.elements.closeEmojiPicker.addEventListener('click', () => {
                this.elements.emojiPickerContainer.classList.add('hidden');
                console.log('Emoji picker closed');
            });
        }
        if (this.elements.emojiCategoryBtns) {
            this.elements.emojiCategoryBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.elements.emojiCategoryBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadEmojis(btn.dataset.category);
                    console.log(`Emoji category switched: ${btn.dataset.category}`);
                });
            });
        }
        if (this.elements.emojiGrid) {
            this.elements.emojiGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('emoji-btn')) {
                    const emoji = e.target.textContent;
                    this.elements.partyChatInput.value += emoji;
                    this.elements.emojiPickerContainer.classList.add('hidden');
                    console.log(`Emoji selected: ${emoji}`);
                }
            });
        }

        // Chat Tabs (Main/Private)
        if (this.elements.chatTabs) {
            this.elements.chatTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.elements.chatTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.currentChatTab = tab.dataset.chatTab;
                    this.updateChatView();
                    console.log(`Switched chat tab: ${this.currentChatTab}`);
                });
            });
        }

        // Members List and Actions
        if (this.elements.toggleMembersBtn) {
            this.elements.toggleMembersBtn.addEventListener('click', () => {
                this.elements.onlineMembersPopup.classList.toggle('show');
                console.log('Toggled members popup');
            });
        }
        if (this.elements.togglePublicMembersBtn) {
            this.elements.togglePublicMembersBtn.addEventListener('click', () => {
                this.elements.onlineMembersPopup.classList.toggle('show');
                console.log('Toggled public members popup');
            });
        }
        if (this.elements.closeMembersPopup) {
            this.elements.closeMembersPopup.addEventListener('click', () => {
                this.elements.onlineMembersPopup.classList.remove('show');
                console.log('Closed members popup');
            });
        }
        if (this.elements.membersSearch) {
            this.elements.membersSearch.addEventListener('input', () => {
                this.filterMembersList(this.elements.membersSearch.value.trim());
            });
        }
        if (this.elements.userActionMenu) {
            this.elements.userActionMenu.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = btn.dataset.action;
                    const userId = this.elements.userActionMenu.dataset.userId;
                    this.handleUserAction(action, userId);
                    console.log(`User action: ${action} on user ${userId}`);
                });
            });
        }

        // Host Controls (Ban/Kick)
        if (this.elements.banUserBtn) {
            this.elements.banUserBtn.addEventListener('click', () => {
                this.elements.banUserModal.classList.remove('hidden');
                console.log('Ban user button clicked');
            });
        }
        if (this.elements.kickUserBtn) {
            this.elements.kickUserBtn.addEventListener('click', () => {
                const userId = this.elements.userActionMenu.dataset.userId;
                this.handleKickUser(userId);
                console.log(`Kick user button clicked for ${userId}`);
            });
        }
        if (this.elements.closeBanModal) {
            this.elements.closeBanModal.addEventListener('click', () => {
                this.elements.banUserModal.classList.add('hidden');
                console.log('Ban modal closed');
            });
        }
        if (this.elements.cancelBanBtn) {
            this.elements.cancelBanBtn.addEventListener('click', () => {
                this.elements.banUserModal.classList.add('hidden');
                console.log('Ban cancelled');
            });
        }
        if (this.elements.confirmBanBtn) {
            this.elements.confirmBanBtn.addEventListener('click', () => {
                this.handleBanUser();
                console.log('Ban confirmed');
            });
        }

        // Toast Notifications
        if (this.elements.closeBlockToast) {
            this.elements.closeBlockToast.addEventListener('click', () => {
                this.elements.userBlockedToast.classList.remove('show');
                console.log('User blocked toast closed');
            });
        }

        // Video Sync Controls
        if (this.elements.partyPlayPause) {
            this.elements.partyPlayPause.addEventListener('click', () => this.syncVideoState());
        }
        if (this.elements.partySync) {
            this.elements.partySync.addEventListener('click', () => this.syncVideoState());
        }

        // Socket Events
        if (window.socketManager) {
            window.socketManager.on('party_joined', ({ party, isHost }) => this.handlePartyJoined(party, isHost));
            window.socketManager.on('party_left', () => this.handlePartyLeft());
            window.socketManager.on('message', (message) => this.displayChatMessage(message));
            window.socketManager.on('member_update', (members) => {
                if (this.currentParty) {
                    this.currentParty.members = members;
                    this.updateMembersList();
                }
            });
        }
    }

    bindPartyButtonListeners() {
        const buttons = [
            { element: this.elements.createPartyBtn, handler: this.handleCreatePartyClick },
            { element: this.elements.createPartyBtn2, handler: this.handleCreatePartyClick },
            { element: this.elements.joinPartyBtn, handler: this.handleJoinPartyClick },
            { element: this.elements.joinPartyBtn2, handler: this.handleJoinPartyClick },
            { element: this.elements.leavePartyBtn2, handler: this.handleLeavePartyClick }
        ];
        buttons.forEach(({ element, handler }) => {
            if (element) {
                element.removeEventListener('click', handler);
                element.addEventListener('click', handler.bind(this));
                console.log(`Bound listener for ${element.id}`);
            }
        });
    }

    handleCreatePartyClick() {
        this.openWatchPartyPopup('create');
        console.log('Create Party clicked');
    }

    handleJoinPartyClick() {
        this.openWatchPartyPopup('join');
        console.log('Join Party clicked');
    }

    handleLeavePartyClick() {
        this.elements.leavePartyBtn.click();
        console.log('Leave Party clicked');
    }

    openWatchPartyPopup(mode) {
        if (!this.elements.watchPartyPopup) {
            console.error('Watch party popup element not found (#watchPartyPopup)');
            this.videoManager.showNotification('Error: Popup not found.', 'error');
            return;
        }
        this.elements.watchPartyPopup.classList.remove('hidden');
        console.log(`Opening watch party popup in ${mode} mode`);
        const tab = document.querySelector(`.party-tab[data-tab="${mode}"]`);
        if (tab) {
            tab.click();
            console.log(`Programmatically clicked tab: ${mode}`);
        } else {
            console.error(`Party tab not found for mode: ${mode}`);
            this.videoManager.showNotification(`Error: ${mode} tab not found.`, 'error');
        }
    }

    createParty(e) {
        e.preventDefault();
        if (!this.elements.partyName || !this.elements.partyPrivacy || !this.elements.maxMembers) {
            this.videoManager.showNotification('Create party form incomplete.', 'error');
            return;
        }
        const partyData = {
            name: this.elements.partyName.value.trim() || 'Watch Party',
            privacy: this.elements.partyPrivacy.value || 'public',
            password: this.elements.partyPassword?.value.trim() || null,
            maxMembers: parseInt(this.elements.maxMembers.value) || 10,
            code: this.generatePartyCode(),
            members: [{ id: this.userId, username: this.username, is_host: true }]
        };
        window.socketManager?.emit('create_party', partyData);
        this.handlePartyJoined(partyData, true);
        console.log('Party created:', partyData);
    }

    joinParty(e) {
        e.preventDefault();
        if (!this.elements.partyCode) {
            this.videoManager.showNotification('Party code required.', 'error');
            return;
        }
        const joinData = {
            code: this.elements.partyCode.value.trim(),
            password: this.elements.joinPassword?.value.trim() || null,
            user: { id: this.userId, username: this.username }
        };
        window.socketManager?.emit('join_party', joinData);
        console.log('Join party requested:', joinData);
    }

    copyPartyCode() {
        const code = this.elements.partyCodeDisplay?.textContent || this.elements.partyCodeDisplaySidebar?.textContent || '';
        navigator.clipboard.writeText(code).then(() => {
            this.videoManager.showNotification('Party code copied!');
        }).catch(() => {
            this.videoManager.showNotification('Failed to copy party code.', 'error');
        });
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.videoManager.showNotification('File size exceeds 5MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const message = {
                content: `[File: ${file.name}]`,
                fileData: reader.result,
                fileType: file.type,
                timestamp: new Date().toISOString(),
                type: this.currentChatTab,
                to: this.currentChatTab === 'private' ? this.privateChatRecipient?.id : null,
                username: this.username
            };
            window.socketManager?.emit('message', message);
            this.displayChatMessage(message);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    }

    sendChatMessage() {
        const content = this.elements.partyChatInput?.value.trim();
        if (!content) return;
        const message = {
            content,
            timestamp: new Date().toISOString(),
            type: this.currentChatTab,
            to: this.currentChatTab === 'private' ? this.privateChatRecipient?.id : null,
            username: this.username,
            from: this.userId
        };
        if (this.isInParty && this.currentParty) {
            window.socketManager?.emit('message', message);
        } else if (this.currentChatTab === 'main') {
            window.socketManager?.emit('public_chat', message);
            if (!window.publicChatMessages) window.publicChatMessages = [];
            window.publicChatMessages.push(message);
            this.displayChatMessage(message);
        }
        this.elements.partyChatInput.value = '';
    }

    displayChatMessage(message) {
        if (this.blockedUsers.has(message.from)) return; // Skip blocked users
        if (this.mutedUsers.has(message.from) && message.type === 'main') return; // Skip muted users in main chat
        const targetMessages = this.currentChatTab === 'main' ? document.getElementById('main-chat') : document.getElementById('private-chat');
        if (targetMessages && (
            (message.type === 'main' && this.currentChatTab === 'main') ||
            (message.type === 'private' && this.currentChatTab === 'private' &&
             ((message.from === this.userId && message.to === this.privateChatRecipient?.id) ||
              (message.from === this.privateChatRecipient?.id && message.to === this.userId))))) {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${message.from === this.userId ? 'own' : ''}`;
            let content = message.content;
            if (message.fileData) {
                content = message.fileType.startsWith('image/')
                    ? `<img src="${message.fileData}" alt="${message.content}" style="max-width: 200px;" />`
                    : `<a href="${message.fileData}" download>${message.content}</a>`;
            }
            messageEl.innerHTML = `
                <div class="message-header">
                    <span class="message-username">${message.username}</span>
                    <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="message-text">${content}</div>
            `;
            targetMessages.appendChild(messageEl);
            targetMessages.scrollTop = targetMessages.scrollHeight;
        }
    }

    handlePartyJoined(party, isHost) {
        this.currentParty = party;
        this.isHost = isHost;
        this.isInParty = true;
        this.elements.partyNameDisplay.textContent = party.name;
        this.elements.partyCodeDisplay.textContent = party.code;
        this.elements.partyCodeDisplaySidebar.textContent = party.code;
        this.elements.partyMemberCount.textContent = party.members.length;
        this.elements.currentPartyStatus.textContent = 'In a party';
        this.updateMembersList();
        this.updateChatView();
        this.updateUIState();
        this.elements.watchPartyPopup.classList.add('hidden');
        if (isHost) this.syncVideoState();
        this.videoManager.showNotification(`Joined party "${party.name}"`, 'success');
    }

    handlePartyLeft() {
        this.currentParty = null;
        this.isHost = false;
        this.isInParty = false;
        this.privateChatRecipient = null;
        this.currentChatTab = 'main';
        this.elements.partyNameDisplay.textContent = '';
        this.elements.partyCodeDisplay.textContent = '';
        this.elements.partyCodeDisplaySidebar.textContent = '';
        this.elements.partyMemberCount.textContent = '0';
        this.elements.currentPartyStatus.textContent = '';
        this.elements.partyMembersList.innerHTML = '';
        this.elements.partyChatMessages.innerHTML = '';
        this.updateUIState();
        this.updateChatView();
        this.videoManager.showNotification('Left the party', 'info');
    }

    updateUIState() {
        const isInParty = this.isInParty;

        // Toggle Party Controls and Chat Section
        if (this.elements.partyControls) this.elements.partyControls.classList.toggle('hidden', !isInParty);
        if (this.elements.partyChatSection) this.elements.partyChatSection.classList.toggle('hidden', !isInParty);
        if (this.elements.publicChatHeader) this.elements.publicChatHeader.classList.toggle('hidden', isInParty);

        // Toggle Party Buttons
        if (this.elements.partyButtonContainer) {
            if (isInParty) {
                if (this.elements.createPartyBtn2) this.elements.createPartyBtn2.classList.add('hidden');
                if (this.elements.joinPartyBtn2) this.elements.joinPartyBtn2.classList.add('hidden');
                if (this.elements.leavePartyBtn2) this.elements.leavePartyBtn2.classList.remove('hidden');
            } else {
                if (this.elements.createPartyBtn2) this.elements.createPartyBtn2.classList.remove('hidden');
                if (this.elements.joinPartyBtn2) this.elements.joinPartyBtn2.classList.remove('hidden');
                if (this.elements.leavePartyBtn2) this.elements.leavePartyBtn2.classList.add('hidden');
            }
        }

        // Toggle Party Info and Views
        if (this.elements.partyInfoContainer) this.elements.partyInfoContainer.classList.toggle('hidden', !isInParty);
        if (this.elements.activePartyView && this.elements.recommendedVideos) {
            this.elements.activePartyView.classList.toggle('active', isInParty);
            this.elements.recommendedVideos.classList.toggle('active', !isInParty);
            if (!isInParty) this.videoManager.loadRecommendedVideos();
        }

        // Toggle Chat Tabs (Main/Private)
        if (this.elements.chatTabs) {
            this.elements.chatTabs.forEach(tab => {
                if (tab.dataset.chatTab === 'private') {
                    tab.classList.toggle('hidden', !isInParty);
                }
            });
        }

        // Toggle Members Buttons
        if (this.elements.toggleMembersBtn) this.elements.toggleMembersBtn.classList.toggle('hidden', !isInParty);
        if (this.elements.togglePublicMembersBtn) this.elements.togglePublicMembersBtn.classList.toggle('hidden', isInParty);

        // Update Chat Input
        if (this.elements.partyChatInput) {
            this.elements.partyChatInput.disabled = false;
            this.elements.partyChatInput.placeholder = isInParty ? 'Type a message...' : 'Type a public message...';
        }

        // Toggle Host Controls
        if (this.elements.hostControls) this.elements.hostControls.classList.toggle('hidden', !this.isHost);

        console.log(`UI State Updated: isInParty=${isInParty}, isHost=${this.isHost}`);
    }

    updateChatView() {
        const targetMessages = this.currentChatTab === 'main' ? document.getElementById('main-chat') : document.getElementById('private-chat');
        if (targetMessages) {
            targetMessages.innerHTML = '';
            if (this.currentChatTab === 'main') {
                this.privateChatRecipient = null;
                this.elements.partyChatInput.placeholder = this.isInParty ? 'Type a message...' : 'Type a public message...';
                if (this.isInParty && this.currentParty?.messages) {
                    this.currentParty.messages.forEach(message => this.displayChatMessage(message));
                } else {
                    const welcomeMessage = {
                        content: 'Welcome to the public chat! Start typing to connect with others.',
                        username: 'System',
                        timestamp: new Date().toISOString(),
                        type: 'main'
                    };
                    this.displayChatMessage(welcomeMessage);
                    if (window.publicChatMessages) {
                        window.publicChatMessages.forEach(message => this.displayChatMessage(message));
                    }
                }
            } else if (this.currentChatTab === 'private' && this.isInParty) {
                this.elements.partyChatInput.placeholder = this.privateChatRecipient
                    ? `Message ${this.privateChatRecipient.username}...`
                    : 'Select a member to start private chat...';
                if (this.privateChatRecipient && this.currentParty?.privateMessages) {
                    const privateMessages = this.currentParty.privateMessages.filter(
                        msg => (msg.from === this.userId && msg.to === this.privateChatRecipient.id) ||
                               (msg.from === this.privateChatRecipient.id && msg.to === this.userId)
                    );
                    privateMessages.forEach(message => this.displayChatMessage(message));
                }
            }
            targetMessages.scrollTop = targetMessages.scrollHeight;
        }
    }

    handleUserAction(action, userId) {
        const member = this.currentParty?.members.find(m => m.id === userId);
        if (!member) return;
        if (action === 'private-chat') {
            this.privateChatRecipient = member;
            this.currentChatTab = 'private';
            this.elements.chatTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.chatTab === 'private'));
            this.updateChatView();
            this.elements.onlineMembersPopup.classList.remove('show');
        } else if (action === 'block') {
            this.blockedUsers.add(userId);
            this.elements.userBlockedToast.classList.add('show');
            setTimeout(() => this.elements.userBlockedToast.classList.remove('show'), 3000);
            this.videoManager.showNotification(`Blocked ${member.username}.`, 'info');
        } else if (action === 'mute') {
            this.mutedUsers.add(userId);
            this.videoManager.showNotification(`Muted ${member.username}.`, 'info');
        } else if (action === 'ban' && this.isHost) {
            this.elements.banUserModal.classList.remove('hidden');
            this.elements.userActionMenu.dataset.userId = userId;
        } else if (action === 'kick' && this.isHost) {
            this.handleKickUser(userId);
        } else if (action === 'close') {
            this.elements.userActionMenu.classList.remove('show');
        }
    }

    handleBanUser() {
        const userId = this.elements.userActionMenu.dataset.userId;
        const isTemporary = this.elements.banTemporaryCheck.checked;
        const isPermanent = this.elements.banPermanentCheck.checked;
        const reason = this.elements.banReason.value.trim();
        if (!isTemporary && !isPermanent) {
            this.videoManager.showNotification('Please select a ban type.', 'error');
            return;
        }
        const banData = {
            user_id: userId,
            type: isPermanent ? 'permanent' : 'temporary',
            reason: reason || null
        };
        window.socketManager?.emit('ban_user', banData);
        this.elements.banUserModal.classList.add('hidden');
        this.videoManager.showNotification('User banned.', 'info');
    }

    handleKickUser(userId) {
        const member = this.currentParty?.members.find(m => m.id === userId);
        if (member) {
            window.socketManager?.emit('kick_member', { user_id: userId, username: member.username });
            this.videoManager.showNotification(`${member.username} kicked from party.`, 'info');
        }
    }

    filterMembersList(searchTerm) {
        if (this.currentParty) {
            const filteredMembers = this.currentParty.members.filter(member =>
                member.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
            this.updateMembersList(filteredMembers);
        }
    }

    updateMembersList(members = this.currentParty?.members) {
        if (this.elements.partyMembersList && members) {
            this.elements.partyMembersList.innerHTML = members.map(member => `
                <div class="member-item ${member.is_host ? 'host' : ''}" data-user-id="${member.id}" role="listitem">
                    <div class="member-info">
                        <span class="member-avatar">
                            <i class="material-icons-round">person</i>
                        </span>
                        <span class="member-name">${member.username}</span>
                        ${member.is_host ? '<span class="member-badge host-badge">Host</span>' : ''}
                    </div>
                    <div class="member-actions">
                        <button class="btn-icon user-actions-btn" data-user-id="${member.id}">
                            <i class="material-icons-round">more_vert</i>
                        </button>
                    </div>
                </div>
            `).join('');
            this.elements.onlineMembersCount.textContent = members.length;
            this.elements.partyMembersList.querySelectorAll('.user-actions-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = btn.dataset.userId;
                    this.elements.userActionMenu.dataset.userId = userId;
                    this.elements.userActionMenu.classList.add('show');
                    const rect = btn.getBoundingClientRect();
                    this.elements.userActionMenu.style.top = `${rect.bottom + window.scrollY}px`;
                    this.elements.userActionMenu.style.left = `${rect.left + window.scrollX - 180}px`;
                });
            });
        }
    }

    syncVideoState() {
        if (this.isHost && this.currentParty) {
            const state = this.videoManager.getVideoState();
            window.socketManager?.emit('sync_video', {
                party_id: this.currentParty.code,
                state
            });
        }
    }

    generatePartyCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    loadEmojis(category) {
        const emojis = {
            smileys: ['😊', '😂', '😍', '😎', '😢', '😠', '😇', '😜'],
            animals: ['🐶', '🐱', '🐻', '🦁', '🐘', '🦒', '🐍', '🐦'],
            food: ['🍕', '🍔', '🍣', '🍎', '🍦', '☕', '🍷', '🍫'],
            activities: ['⚽', '🏀', '🎸', '🎨', '🎬', '✈️', '🚴', '🏄']
        };
        if (this.elements.emojiGrid) {
            this.elements.emojiGrid.innerHTML = emojis[category].map(emoji => `
                <button class="emoji-btn" aria-label="Select ${emoji} emoji">${emoji}</button>
            `).join('');
        }
    }
}