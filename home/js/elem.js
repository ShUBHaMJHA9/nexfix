// /assets/js/elements.js
window.elements = {
    // Party Popups & Forms
    watchPartyPopup: document.getElementById('watchPartyPopup'),
    closePartyPopup: document.getElementById('closePartyPopup'),
    mediaControlsPopup: document.getElementById('mediaControlsPopup'),
    closeMediaControls: document.getElementById('closeMediaControls'),
    createPartyForm: document.getElementById('createPartyForm'),
    joinPartyForm: document.getElementById('joinPartyForm'),
    confirmCreateParty: document.getElementById('confirmCreateParty'),
    cancelCreateParty: document.getElementById('cancelCreateParty'),
    confirmJoinParty: document.getElementById('confirmJoinParty'),
    cancelJoinParty: document.getElementById('cancelJoinParty'),

    // Party Inputs
    partyName: document.getElementById('partyName'),
    partyPrivacy: document.getElementById('partyPrivacy'),
    partyPassword: document.getElementById('partyPassword'),
    maxMembers: document.getElementById('maxMembers'),
    enableVideoCall: document.getElementById('enableVideoCall'),
    enableVoiceChat: document.getElementById('enableVoiceChat'),
    enableTextChat: document.getElementById('enableTextChat'),
    enableHostControls: document.getElementById('enableHostControls'),
    partyCode: document.getElementById('partyCode'),
    joinPassword: document.getElementById('joinPassword'),

    // Party Buttons
    createPartyBtn: document.getElementById('createPartyBtn'),
    joinPartyBtn: document.getElementById('joinPartyBtn'),
    createPartyBtn2: document.getElementById('createPartyBtn2'),
    joinPartyBtn2: document.getElementById('joinPartyBtn2'),
    leavePartyBtn: document.getElementById('leavePartyBtn'),
    leavePartyBtn2: document.getElementById('leavePartyBtn2'),
    startVideoCallBtn: document.getElementById('startVideoCallBtn'),
    copyActivePartyCodeBtn: document.getElementById('copyActivePartyCodeBtn'),
    copyPartyCodeBtn: document.getElementById('copyPartyCodeBtn'),
    sendPartyMessage: document.getElementById('sendPartyMessage'),
    popupSendPartyMessage: document.getElementById('popupSendPartyMessage'),

    // Tabs and Sections
    partyTabs: document.querySelectorAll('.party-tab'),
    partyTabContents: document.querySelectorAll('.party-tab-content'),
    sidebarTabs: document.querySelectorAll('.sidebar-tab'),
    activePartyTab: document.getElementById('activePartyTab'),
    activePartyView: document.getElementById('activePartyView'),

    // Party Display Info
    activePartyName: document.getElementById('activePartyName'),
    activePartyCode: document.getElementById('activePartyCode'),
    activePartyStatus: document.getElementById('activePartyStatus'),
    activePartyMemberCount: document.getElementById('activePartyMemberCount'),
    activePartyVideoId: document.getElementById('activePartyVideoId'),
    partyInfoContainer: document.getElementById('partyInfoContainer'),
    partyNameDisplay: document.getElementById('partyNameDisplay'),
    partyCodeDisplay: document.getElementById('partyCodeDisplay'),
    partyVideoIdDisplay: document.getElementById('partyVideoIdDisplay'),
    partyMemberCount: document.getElementById('partyMemberCount'),
    currentPartyStatus: document.getElementById('currentPartyStatus'),
    partyCodeDisplaySidebar: document.getElementById('partyCodeDisplaySidebar'),

    // Party Chat & Members
    partyMembersList: document.getElementById('partyMembersList'),
    partyChatMessages: document.getElementById('partyChatMessages'),
    partyChatInput: document.getElementById('partyChatInput'),
    popupPartyMembersList: document.getElementById('popupPartyMembersList'),
    popupPartyChatMessages: document.getElementById('popupPartyChatMessages'),
    popupPartyChatInput: document.getElementById('popupPartyChatInput'),

    // Party Playback Controls
    partyPlayPause: document.getElementById('partyPlayPause'),
    partySync: document.getElementById('partySync'),
    partySettings: document.getElementById('partySettings'),
    popupPartyPlayPause: document.getElementById('popupPartyPlayPause'),
    popupPartySeekBack: document.getElementById('popupPartySeekBack'),
    popupPartySeekForward: document.getElementById('popupPartySeekForward'),
    popupPartySync: document.getElementById('popupPartySync'),
    popupPartySettings: document.getElementById('popupPartySettings'),

    // Media Controls
    localVideo: document.getElementById('localVideo'),
    toggleCamera: document.getElementById('toggleCamera'),
    toggleMicrophone: document.getElementById('toggleMicrophone'),
    toggleScreenShare: document.getElementById('toggleScreenShare'),
    confirmMediaControls: document.getElementById('confirmMediaControls'),
    cancelMediaControls: document.getElementById('cancelMediaControls'),
    toggleMicBtnSidebar: document.getElementById('toggleMicBtnSidebar'),

    // Public Party
    publicPartiesList: document.getElementById('publicPartiesList'),
    refreshPublicParties: document.getElementById('refreshPublicParties'),

    // Video Info
    movieTitle: document.getElementById('movie-title'),
    movieDescription: document.getElementById('movie-description'),
    movieRating: document.getElementById('movie-rating'),
    movieQuality: document.getElementById('movie-quality'),
    movieYear: document.getElementById('movie-year'),
    movieDuration: document.getElementById('movie-duration'),
    movieGenres: document.getElementById('movie-genres'),
    movieDirector: document.getElementById('movie-director'),
    imdbRating: document.getElementById('imdb-rating'),
    recommendedVideos: document.getElementById('recommendedVideos'),

    // Media Player Controls
    mainPlayer: document.getElementById('mainPlayer'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    muteBtn: document.getElementById('muteBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    progressBar: document.getElementById('progressBar'),
    fastRewindBtn: document.getElementById('fastRewindBtn'),
    fastForwardBtn: document.getElementById('fastForwardBtn'),
    pipBtn: document.getElementById('pipBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    theaterBtn: document.getElementById('theaterBtn'),
    loopBtn: document.getElementById('loopBtn'),

    // Settings Menus
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    playbackSpeedMenu: document.getElementById('playbackSpeedMenu'),
    qualityMenu: document.getElementById('qualityMenu'),
    qualitySubmenu: document.getElementById('qualitySubmenu'),
    qualityBackBtn: document.getElementById('qualityBackBtn'),
    qualityOptions: document.getElementById('qualityOptions'),
    captionMenu: document.getElementById('captionMenu'),

    // Utility Elements
    permissionStatus: document.getElementById('permissionStatus'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorOverlay: document.getElementById('errorOverlay'),
    errorMessage: document.getElementById('errorMessage'),
    castGrid: document.getElementById('castGrid'),
    navArrowLeft: document.querySelector('.nav-arrow-left'),
    navArrowRight: document.querySelector('.nav-arrow-right'),
    loadingScreen: document.getElementById('loadingScreen'),
    searchInput: document.getElementById('search-input'),
    searchPopup: document.getElementById('search-popup'),
    hamburgerMenu: document.getElementById('hamburger-menu'),
    navMenu: document.querySelector('.navbar-menu'),

    // Actions
    shareBtn: document.getElementById('shareBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    autoPlayBtn: document.getElementById('autoPlayBtn'),
    miniPlayerBtn: document.getElementById('miniPlayerBtn'),
    videoCallBtn: document.getElementById('videoCallBtn'),

    // Reviews
    writeReviewBtn: document.getElementById('writeReviewBtn'),
    cancelReviewBtn: document.getElementById('cancelReviewBtn'),
    submitReviewBtn: document.getElementById('submitReviewBtn'),
    reviewForm: document.getElementById('review-form'),
    userReviews: document.getElementById('user-reviews'),

    // Reactions
    likeBtn: document.getElementById('likeBtn'),
    dislikeBtn: document.getElementById('dislikeBtn'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    watchLaterBtn: document.getElementById('watchLaterBtn'),

    // Load More
    loadMoreBtn: document.getElementById('loadMoreBtn'),
};
