document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const socket = io(); // Assuming Socket.IO is included for real-time communication
    let currentParty = null;
    let isHost = false;
    let userId = `user_${Math.random().toString(36).substr(2, 9)}`; // Temporary user ID
    const syncToleranceOptions = {
        strict: 0,
        normal: 2000,
        loose: 5000
    };

    // DOM Elements
    const elements = {
        // Watch Party Popup
        watchPartyPopup: document.getElementById('watchPartyPopup'),
        closePartyPopup: document.getElementById('closePartyPopup'),
        partyTabButtons: document.querySelectorAll('.party-tab'),
        partyTabContents: document.querySelectorAll('.party-tab-content'),
        createPartyBtn: document.getElementById('createPartyBtn'),
        joinPartyBtn: document.getElementById('joinPartyBtn'),
        leavePartyBtnTop: document.getElementById('leavePartyBtnTop'),
        partyNameInput: document.getElementById('partyName'),
        partyPasswordInput: document.getElementById('partyPassword'),
        hostControlsSelect: document.getElementById('hostControls'),
        partyPrivacySelect: document.getElementById('partyPrivacy'),
        confirmCreateParty: document.getElementById('confirmCreateParty'),
        cancelCreateParty: document.getElementById('cancelCreateParty'),
        partyCodeInput: document.getElementById('partyCode'),
        joinPasswordInput: document.getElementById('joinPassword'),
        confirmJoinParty: document.getElementById('confirmJoinParty'),
        cancelJoinParty: document.getElementById('cancelJoinParty'),
        activePartyTab: document.getElementById('activePartyTab'),
        activePartyView: document.querySelector('.party-tab-content[data-tab-content="active"]'),
        activePartyName: document.getElementById('activePartyName'),
        activePartyCode: document.getElementById('activePartyCode'),
        activePartyStatus: document.getElementById('activePartyStatus'),
        activePartyMemberCount: document.getElementById('activePartyMemberCount'),
        copyActivePartyCodeBtn: document.getElementById('copyActivePartyCodeBtn'),
        popupPartyChatMessages: document.getElementById('popupPartyChatMessages'),
        popupPartyChatInput: document.getElementById('popupPartyChatInput'),
        popupSendPartyMessage: document.getElementById('popupSendPartyMessage'),
        popupPartyMembersList: document.getElementById('popupPartyMembersList'),
        popupLeavePartyBtn: document.getElementById('popupLeavePartyBtn'),
        popupPartyPlayPause: document.getElementById('popupPartyPlayPause'),
        popupPartySeekBack: document.getElementById('popupPartySeekBack'),
        popupPartySeekForward: document.getElementById('popupPartySeekForward'),
        popupPartySync: document.getElementById('popupPartySync'),
        popupPartyChangeVideo: document.getElementById('popupPartyChangeVideo'),
        popupPartySettings: document.getElementById('popupPartySettings'),
        publicPartiesList: document.getElementById('publicPartiesList'),
        partyInfoContainer: document.getElementById('partyInfoContainer'),
        partyNameDisplay: document.getElementById('partyNameDisplay'),
        partyMemberCount: document.getElementById('partyMemberCount'),
        partyCodeDisplay: document.getElementById('partyCodeDisplay'),
        copyPartyCodeBtn: document.getElementById('copyPartyCodeBtn'),
        currentPartyStatus: document.getElementById('currentPartyStatus'),
        partyStatusIndicator: document.getElementById('partyStatusIndicator'),
        // Party Chat
        partyChatSection: document.getElementById('partyChatSection'),
        partyChatMessages: document.getElementById('partyChatMessages'),
        partyChatInput: document.getElementById('partyChatInput'),
        sendPartyChatBtn: document.getElementById('sendPartyChatBtn'),
        togglePartyChatBtn: document.getElementById('togglePartyChatBtn'),
        partySyncBtn: document.getElementById('partySyncBtn'),
        partyReactionBtn: document.getElementById('partyReactionBtn'),
        // Party Members Sidebar
        partyMembersSidebar: document.getElementById('partyMembersSidebar'),
        partyMemberList: document.getElementById('partyMemberList'),
        partyMemberCountSidebar: document.getElementById('partyMemberCountSidebar'),
        partyAdminControls: document.getElementById('partyAdminControls'),
        partyKickBtn: document.getElementById('partyKickBtn'),
        partyMuteBtn: document.getElementById('partyMuteBtn'),
        partyTransferHostBtn: document.getElementById('partyTransferHostBtn'),
        partyLockBtn: document.getElementById('partyLockBtn'),
        // Party Settings Modal
        partySettingsModal: document.getElementById('partySettingsModal'),
        closePartySettingsModal: document.getElementById('closePartySettingsModal'),
        partyNameSetting: document.getElementById('partyNameSetting'),
        partyPrivacySetting: document.getElementById('partyPrivacySetting'),
        partyPasswordSetting: document.getElementById('partyPasswordSetting'),
        syncTolerance: document.getElementById('syncTolerance'),
        controlMode: document.getElementById('controlMode'),
        enableReactions: document.getElementById('enableReactions'),
        maxMembers: document.getElementById('maxMembers'),
        allowGuests: document.getElementById('allowGuests'),
        autoSyncOnJoin: document.getElementById('autoSyncOnJoin'),
        savePartySettings: document.getElementById('savePartySettings'),
        cancelPartySettings: document.getElementById('cancelPartySettings'),
        // Reaction Picker
        reactionPicker: document.getElementById('reactionPicker'),
        reactionOptions: document.querySelectorAll('.reaction-option'),
        // Invite Friends Modal
        inviteFriendsModal: document.getElementById('inviteFriendsModal'),
        closeInviteFriendsModal: document.getElementById('closeInviteFriendsModal'),
        inviteMethodTabs: document.querySelectorAll('.invite-tab'),
        inviteTabContents: document.querySelectorAll('.invite-tab-content'),
        partyInviteLink: document.getElementById('partyInviteLink'),
        copyInviteLink: document.getElementById('copyInviteLink'),
        partyInviteQrCode: document.getElementById('partyInviteQrCode'),
        friendsSearchInput: document.getElementById('friendsSearchInput'),
        friendsList: document.getElementById('friendsList'),
        socialShareButtons: document.querySelectorAll('.social-share-btn'),
        socialShareMessage: document.getElementById('socialShareMessage')
    };

    // Utility Functions
    function showElement(element) {
        element.classList.remove('hidden');
    }

    function hideElement(element) {
        element.classList.add('hidden');
    }

    function toggleElement(element) {
        element.classList.toggle('hidden');
    }

    function showPopup(tab = 'create') {
        showElement(elements.watchPartyPopup);
        switchTab(tab);
    }

    function hidePopup() {
        hideElement(elements.watchPartyPopup);
        switchTab('create');
    }

    function switchTab(tab) {
        elements.partyTabButtons.forEach(btn => btn.classList.remove('active'));
        elements.partyTabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        const activeBtn = document.querySelector(`.party-tab[data-tab="${tab}"]`);
        const activeContent = document.querySelector(`.party-tab-content[data-tab-content="${tab}"]`);
        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }
    }

    function updatePartyUI(party) {
        elements.partyNameDisplay.textContent = party.name;
        elements.partyCodeDisplay.textContent = party.code;
        elements.activePartyName.textContent = party.name;
        elements.activePartyCode.textContent = party.code;
        elements.activePartyStatus.textContent = party.status;
        elements.activePartyMemberCount.textContent = party.members.length;
        elements.partyMemberCount.textContent = party.members.length;
        elements.partyMemberCountSidebar.textContent = party.members.length;
        elements.currentPartyStatus.innerHTML = `<span>In ${party.name}</span>`;
        showElement(elements.partyInfoContainer);
        showElement(elements.partyStatusIndicator);
        showElement(elements.partyChatSection);
        showElement(elements.partyMembersSidebar);
        showElement(elements.leavePartyBtnTop);
        elements.activePartyTab.style.display = 'block';
        updatePartyMembersList(party.members);
        if (isHost) {
            showElement(elements.partyAdminControls);
            elements.popupPartySettings.style.display = 'inline-flex';
            elements.popupPartyPlayPause.style.display = 'inline-flex';
            elements.popupPartySeekBack.style.display = 'inline-flex';
            elements.popupPartySeekForward.style.display = 'inline-flex';
            elements.popupPartyChangeVideo.style.display = 'inline-flex';
        } else {
            hideElement(elements.partyAdminControls);
            elements.popupPartySettings.style.display = party.controlMode === 'free' ? 'inline-flex' : 'none';
            elements.popupPartyPlayPause.style.display = party.controlMode === 'free' ? 'inline-flex' : 'none';
            elements.popupPartySeekBack.style.display = party.controlMode === 'free' ? 'inline-flex' : 'none';
            elements.popupPartySeekForward.style.display = party.controlMode === 'free' ? 'inline-flex' : 'none';
            elements.popupPartyChangeVideo.style.display = party.controlMode === 'free' ? 'inline-flex' : 'none';
        }
    }

    function updatePartyMembersList(members) {
        elements.partyMemberList.innerHTML = '';
        elements.popupPartyMembersList.innerHTML = '';
        members.forEach(member => {
            const isMemberHost = member.id === currentParty.hostId;
            const li = document.createElement('li');
            li.className = `member-item ${isMemberHost ? 'host' : ''}`;
            li.innerHTML = `
                <div class="member-avatar">
                    <i class='bx bx-user'></i>
                </div>
                <div class="member-info">
                    <span class="member-name">${member.name} ${isMemberHost ? '(Host)' : ''}</span>
                    <span class="member-status">${member.status}</span>
                </div>
                ${isHost && !isMemberHost ? `
                    <div class="member-actions">
                        <button class="member-action-btn" data-member-id="${member.id}" aria-label="Member options">
                            <i class='bx bx-dots-vertical-rounded'></i>
                        </button>
                    </div>
                ` : ''}
            `;
            elements.partyMemberList.appendChild(li);
            elements.popupPartyMembersList.appendChild(li.cloneNode(true));
        });
    }

    function addChatMessage(container, message, isSystem = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isSystem ? 'system-message' : 'chat-message';
        messageDiv.innerHTML = isSystem ? message : `
            <span class="chat-user">${message.user}</span>: 
            <span class="chat-text">${message.text}</span>
            <span class="chat-timestamp">${new Date().toLocaleTimeString()}</span>
        `;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    }

    function generateQRCode(code) {
        elements.partyInviteQrCode.innerHTML = '';
        new QRCode(elements.partyInviteQrCode, {
            text: `https://streamx.com/party/join/${code}`,
            width: 128,
            height: 128
        });
    }

    function syncVideo(time, state) {
        const video = document.getElementById('iframePlayer');
        if (video && Math.abs(video.currentTime - time) > syncToleranceOptions[currentParty.syncTolerance]) {
            video.currentTime = time;
            if (state === 'playing') {
                video.play();
            } else {
                video.pause();
            }
        }
    }

    // Event Listeners
    elements.createPartyBtn.addEventListener('click', () => showPopup('create'));
    elements.joinPartyBtn.addEventListener('click', () => showPopup('join'));
    elements.closePartyPopup.addEventListener('click', hidePopup);
    elements.cancelCreateParty.addEventListener('click', hidePopup);
    elements.cancelJoinParty.addEventListener('click', hidePopup);

    elements.partyTabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    elements.confirmCreateParty.addEventListener('click', () => {
        const party = {
            name: elements.partyNameInput.value || 'Movie Night',
            password: elements.partyPasswordInput.value,
            hostControls: elements.hostControlsSelect.value,
            privacy: elements.partyPrivacySelect.value,
            code: Math.random().toString(36).substr(2, 6).toUpperCase(),
            members: [{ id: userId, name: 'You', status: 'Online' }],
            hostId: userId,
            status: 'Active',
            syncTolerance: elements.syncTolerance.value || 'normal',
            controlMode: elements.controlMode.value || 'host',
            maxMembers: parseInt(elements.maxMembers.value) || 20,
            allowGuests: elements.allowGuests.checked,
            autoSyncOnJoin: elements.autoSyncOnJoin.checked,
            enableReactions: elements.enableReactions.checked
        };
        socket.emit('createParty', party);
    });

    elements.confirmJoinParty.addEventListener('click', () => {
        socket.emit('joinParty', {
            code: elements.partyCodeInput.value,
            password: elements.joinPasswordInput.value,
            userId,
            userName: 'You'
        });
    });

    elements.leavePartyBtnTop.addEventListener('click', () => {
        socket.emit('leaveParty', { partyCode: currentParty.code, userId });
    });

    elements.popupLeavePartyBtn.addEventListener('click', () => {
        socket.emit('leaveParty', { partyCode: currentParty.code, userId });
    });

    elements.copyPartyCodeBtn.addEventListener('click', () => {
        copyToClipboard(currentParty.code);
    });

    elements.copyActivePartyCodeBtn.addEventListener('click', () => {
        copyToClipboard(currentParty.code);
    });

    elements.copyInviteLink.addEventListener('click', () => {
        copyToClipboard(elements.partyInviteLink.value);
    });

    elements.sendPartyChatBtn.addEventListener('click', () => {
        const message = elements.partyChatInput.value.trim();
        if (message) {
            socket.emit('partyMessage', { partyCode: currentParty.code, user: 'You', text: message });
            elements.partyChatInput.value = '';
        }
    });

    elements.popupSendPartyMessage.addEventListener('click', () => {
        const message = elements.popupPartyChatInput.value.trim();
        if (message) {
            socket.emit('partyMessage', { partyCode: currentParty.code, user: 'You', text: message });
            elements.popupPartyChatInput.value = '';
        }
    });

    elements.partyChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.sendPartyChatBtn.click();
        }
    });

    elements.popupPartyChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.popupSendPartyMessage.click();
        }
    });

    elements.togglePartyChatBtn.addEventListener('click', () => {
        toggleElement(elements.partyChatContainer);
        elements.togglePartyChatBtn.querySelector('i').classList.toggle('bx-chevron-down');
        elements.togglePartyChatBtn.querySelector('i').classList.toggle('bx-chevron-up');
    });

    elements.partySyncBtn.addEventListener('click', () => {
        socket.emit('syncVideo', { partyCode: currentParty.code, time: document.getElementById('iframePlayer').currentTime });
    });

    elements.popupPartySync.addEventListener('click', () => {
        socket.emit('syncVideo', { partyCode: currentParty.code, time: document.getElementById('iframePlayer').currentTime });
    });

    elements.partyReactionBtn.addEventListener('click', () => {
        toggleElement(elements.reactionPicker);
    });

    elements.reactionOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (currentParty.enableReactions) {
                socket.emit('partyReaction', { partyCode: currentParty.code, user: 'You', reaction: option.dataset.reaction });
                hideElement(elements.reactionPicker);
            }
        });
    });

    elements.popupPartyPlayPause.addEventListener('click', () => {
        if (isHost || currentParty.controlMode === 'free') {
            const video = document.getElementById('iframePlayer');
            const state = video.paused ? 'playing' : 'paused';
            socket.emit('controlVideo', { partyCode: currentParty.code, action: 'playPause', state });
        }
    });

    elements.popupPartySeekBack.addEventListener('click', () => {
        if (isHost || currentParty.controlMode === 'free') {
            const video = document.getElementById('iframePlayer');
            const time = video.currentTime - 10;
            socket.emit('controlVideo', { partyCode: currentParty.code, action: 'seek', time });
        }
    });

    elements.popupPartySeekForward.addEventListener('click', () => {
        if (isHost || currentParty.controlMode === 'free') {
            const video = document.getElementById('iframePlayer');
            const time = video.currentTime + 10;
            socket.emit('controlVideo', { partyCode: currentParty.code, action: 'seek', time });
        }
    });

    elements.popupPartyChangeVideo.addEventListener('click', () => {
        if (isHost || currentParty.controlMode === 'free') {
            const videoUrl = prompt('Enter new video URL:');
            if (videoUrl) {
                socket.emit('changeVideo', { partyCode: currentParty.code, videoUrl });
            }
        }
    });

    elements.popupPartySettings.addEventListener('click', () => {
        if (isHost || currentParty.controlMode === 'free') {
            showElement(elements.partySettingsModal);
        }
    });

    elements.closePartySettingsModal.addEventListener('click', () => {
        hideElement(elements.partySettingsModal);
    });

    elements.cancelPartySettings.addEventListener('click', () => {
        hideElement(elements.partySettingsModal);
    });

    elements.savePartySettings.addEventListener('click', () => {
        const updatedSettings = {
            name: elements.partyNameSetting.value,
            privacy: elements.partyPrivacySetting.value,
            password: elements.partyPasswordSetting.value,
            syncTolerance: elements.syncTolerance.value,
            controlMode: elements.controlMode.value,
            enableReactions: elements.enableReactions.checked,
            maxMembers: parseInt(elements.maxMembers.value),
            allowGuests: elements.allowGuests.checked,
            autoSyncOnJoin: elements.autoSyncOnJoin.checked
        };
        socket.emit('updatePartySettings', { partyCode: currentParty.code, settings: updatedSettings });
        hideElement(elements.partySettingsModal);
    });

    elements.partyKickBtn.addEventListener('click', () => {
        if (isHost) {
            const memberId = prompt('Enter member ID to kick:');
            if (memberId) {
                socket.emit('kickMember', { partyCode: currentParty.code, memberId });
            }
        }
    });

    elements.partyMuteBtn.addEventListener('click', () => {
        if (isHost) {
            const memberId = prompt('Enter member ID to mute:');
            if (memberId) {
                socket.emit('muteMember', { partyCode: currentParty.code, memberId });
            }
        }
    });

    elements.partyTransferHostBtn.addEventListener('click', () => {
        if (isHost) {
            const memberId = prompt('Enter member ID to transfer host:');
            if (memberId) {
                socket.emit('transferHost', { partyCode: currentParty.code, newHostId: memberId });
            }
        }
    });

    elements.partyLockBtn.addEventListener('click', () => {
        if (isHost) {
            socket.emit('lockParty', { partyCode: currentParty.code, locked: !currentParty.locked });
        }
    });

    elements.closeInviteFriendsModal.addEventListener('click', () => {
        hideElement(elements.inviteFriendsModal);
    });

    elements.inviteMethodTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.inviteMethodTabs.forEach(t => t.classList.remove('active'));
            elements.inviteTabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            tab.classList.add('active');
            const content = document.querySelector(`.invite-tab-content[data-tab-content="${tab.dataset.tab}"]`);
            content.classList.add('active');
            content.style.display = 'block';
        });
    });

    elements.socialShareButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.className.split(' ')[1];
            const message = encodeURIComponent(elements.socialShareMessage.value);
            const url = encodeURIComponent(elements.partyInviteLink.value);
            let shareUrl;
            switch (platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${message}&url=${url}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${message}%20${url}`;
                    break;
                case 'telegram':
                    shareUrl = `https://t.me/share/url?url=${url}&text=${message}`;
                    break;
                case 'discord':
                    shareUrl = `https://discord.com/channels/@me?content=${message}%20${url}`;
                    break;
                case 'email':
                    shareUrl = `mailto:?subject=Join my StreamX Watch Party&body=${message}%20${url}`;
                    break;
            }
            window.open(shareUrl, '_blank');
        });
    });

    // Socket.IO Event Handlers
    socket.on('partyCreated', (party) => {
        currentParty = party;
        isHost = true;
        updatePartyUI(party);
        showPopup('active');
        generateQRCode(party.code);
        elements.partyInviteLink.value = `https://streamx.com/party/join/${party.code}`;
        addChatMessage(elements.partyChatMessages, 'Party created!', true);
        addChatMessage(elements.popupPartyChatMessages, 'Party created!', true);
    });

    socket.on('partyJoined', (party) => {
        currentParty = party;
        isHost = party.hostId === userId;
        updatePartyUI(party);
        showPopup('active');
        generateQRCode(party.code);
        elements.partyInviteLink.value = `https://streamx.com/party/join/${party.code}`;
        if (party.autoSyncOnJoin) {
            socket.emit('requestSync', { partyCode: party.code });
        }
        addChatMessage(elements.partyChatMessages, 'Joined the party!', true);
        addChatMessage(elements.popupPartyChatMessages, 'Joined the party!', true);
    });

    socket.on('partyUpdated', (party) => {
        currentParty = party;
        updatePartyUI(party);
    });

    socket.on('partyMessage', (message) => {
        addChatMessage(elements.partyChatMessages, message);
        addChatMessage(elements.popupPartyChatMessages, message);
    });

    socket.on('partyReaction', ({ user, reaction }) => {
        addChatMessage(elements.partyChatMessages, `${user} reacted with ${reaction}`, true);
        addChatMessage(elements.popupPartyChatMessages, `${user} reacted with ${reaction}`, true);
    });

    socket.on('syncVideo', ({ time, state }) => {
        syncVideo(time, state);
    });

    socket.on('controlVideo', ({ action, state, time }) => {
        const video = document.getElementById('iframePlayer');
        if (action === 'playPause') {
            if (state === 'playing') {
                video.play();
            } else {
                video.pause();
            }
        } else if (action === 'seek') {
            video.currentTime = time;
        }
    });

    socket.on('changeVideo', ({ videoUrl }) => {
        const video = document.getElementById('iframePlayer');
        video.src = videoUrl;
    });

    socket.on('memberKicked', ({ memberId }) => {
        if (memberId === userId) {
            currentParty = null;
            isHost = false;
            hideElement(elements.partyInfoContainer);
            hideElement(elements.partyStatusIndicator);
            hideElement(elements.partyChatSection);
            hideElement(elements.partyMembersSidebar);
            hideElement(elements.leavePartyBtnTop);
            elements.activePartyTab.style.display = 'none';
            hidePopup();
            alert('You have been kicked from the party.');
        }
    });

    socket.on('memberMuted', ({ memberId }) => {
        if (memberId === userId) {
            alert('You have been muted by the host.');
        }
    });

    socket.on('hostTransferred', ({ newHostId }) => {
        isHost = newHostId === userId;
        updatePartyUI(currentParty);
        addChatMessage(elements.partyChatMessages, isHost ? 'You are now the host!' : 'Host transferred.', true);
        addChatMessage(elements.popupPartyChatMessages, isHost ? 'You are now the host!' : 'Host transferred.', true);
    });

    socket.on('partyLocked', ({ locked }) => {
        currentParty.locked = locked;
        addChatMessage(elements.partyChatMessages, `Party is now ${locked ? 'locked' : 'unlocked'}.`, true);
        addChatMessage(elements.popupPartyChatMessages, `Party is now ${locked ? 'locked' : 'unlocked'}.`, true);
    });

    socket.on('publicParties', (parties) => {
        elements.publicPartiesList.innerHTML = '';
        parties.forEach(party => {
            const partyItem = document.createElement('div');
            partyItem.className = 'party-item';
            partyItem.innerHTML = `
                <div class="party-item-info">
                    <h5>${party.name}</h5>
                    <p>Watching: ${party.currentVideo || 'Unknown'}</p>
                    <div class="party-meta">
                        <span><i class='bx bx-user'></i> ${party.members.length}</span>
                        <span><i class='bx bx-lock-open'></i> ${party.privacy}</span>
                    </div>
                </div>
                <button class="btn join-party-btn" data-code="${party.code}">Join</button>
            `;
            elements.publicPartiesList.appendChild(partyItem);
        });
        document.querySelectorAll('.join-party-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                elements.partyCodeInput.value = btn.dataset.code;
                elements.confirmJoinParty.click();
            });
        });
    });

    // Initialize
    socket.emit('getPublicParties');
});