/**
 * Pulse Social Media Platform
 * Main Client Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    activeUser: null,
    users: [],
    currentView: 'feed', // 'feed' | 'profile' | 'explore' | 'stats'
    currentFeed: 'for_you', // 'for_you' | 'following'
    viewingUserId: null,
    profileSubTab: 'posts', // 'posts' | 'liked'
    searchQuery: '',
    attachedImageUrl: '',
    openCommentsPostIds: new Set()
  };

  // DOM Elements
  const el = {
    // Navigation
    navFeed: document.getElementById('nav-btn-feed'),
    navExplore: document.getElementById('nav-btn-explore'),
    navProfile: document.getElementById('nav-btn-profile'),
    navStats: document.getElementById('nav-btn-stats'),
    brandLogo: document.getElementById('brand-logo'),
    viewHeading: document.getElementById('view-heading'),
    viewSubheading: document.getElementById('view-subheading'),
    feedTabs: document.getElementById('feed-tabs'),
    tabForYou: document.getElementById('tab-for-you'),
    tabFollowing: document.getElementById('tab-following'),

    // Views
    viewFeed: document.getElementById('view-feed'),
    viewProfile: document.getElementById('view-profile'),
    viewExplore: document.getElementById('view-explore'),
    viewStats: document.getElementById('view-stats'),

    // Active User Card
    activeUserAvatar: document.getElementById('active-user-avatar'),
    activeUserName: document.getElementById('active-user-name'),
    activeUserHandle: document.getElementById('active-user-handle'),
    btnSwitchPersona: document.getElementById('btn-switch-persona'),
    personaCard: document.getElementById('persona-switcher-card'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeLabel: document.getElementById('theme-label'),
    btnCreateAccount: document.getElementById('btn-create-account'),

    // Composer
    composerAvatar: document.getElementById('composer-user-avatar'),
    composerTextarea: document.getElementById('composer-textarea'),
    composerCharCount: document.getElementById('composer-char-count'),
    btnSubmitPost: document.getElementById('btn-submit-post'),
    btnToggleMediaPanel: document.getElementById('btn-toggle-media-panel'),
    btnAddHashtag: document.getElementById('btn-add-hashtag'),
    composerMediaPanel: document.getElementById('composer-media-panel'),
    composerImageUrlInput: document.getElementById('composer-image-url-input'),
    btnApplyImageUrl: document.getElementById('btn-apply-image-url'),
    composerImagePreviewWrapper: document.getElementById('composer-image-preview-wrapper'),
    composerImagePreview: document.getElementById('composer-image-preview'),
    btnRemoveAttachment: document.getElementById('btn-remove-attachment'),
    btnQuickCompose: document.getElementById('btn-quick-compose'),

    // Posts Streams
    postsStream: document.getElementById('posts-stream'),
    filterBanner: document.getElementById('filter-banner'),
    filterBannerText: document.getElementById('filter-banner-text'),
    btnClearFilter: document.getElementById('btn-clear-filter'),

    // Profile View Elements
    profileBannerImg: document.getElementById('profile-banner-img'),
    profileAvatarImg: document.getElementById('profile-avatar-img'),
    profileActionsSlot: document.getElementById('profile-actions-slot'),
    profileDisplayName: document.getElementById('profile-display-name'),
    profileHandle: document.getElementById('profile-handle'),
    profileBio: document.getElementById('profile-bio'),
    profileJoinDate: document.getElementById('profile-join-date'),
    profileStatPosts: document.getElementById('profile-stat-posts'),
    profileStatFollowing: document.getElementById('profile-stat-following'),
    profileStatFollowers: document.getElementById('profile-stat-followers'),
    btnViewFollowing: document.getElementById('btn-view-following'),
    btnViewFollowers: document.getElementById('btn-view-followers'),
    profilePostsContainer: document.getElementById('profile-posts-container'),

    // Right Sidebar & Widgets
    globalSearchInput: document.getElementById('global-search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    whoToFollowList: document.getElementById('who-to-follow-list'),

    // Explore & Stats
    exploreCreatorsGrid: document.getElementById('explore-creators-grid'),
    statsTotalUsers: document.getElementById('stats-total-users'),
    statsTotalPosts: document.getElementById('stats-total-posts'),
    statsTotalLikes: document.getElementById('stats-total-likes'),
    statsTotalComments: document.getElementById('stats-total-comments'),
    btnResetDatabase: document.getElementById('btn-reset-database'),

    // Modals
    modalPersonaPicker: document.getElementById('modal-persona-picker'),
    personaPickerList: document.getElementById('persona-picker-list'),
    modalEditProfile: document.getElementById('modal-edit-profile'),
    formEditProfile: document.getElementById('form-edit-profile'),
    editName: document.getElementById('edit-name'),
    editBio: document.getElementById('edit-bio'),
    editAvatar: document.getElementById('edit-avatar'),
    editBanner: document.getElementById('edit-banner'),
    modalCreateAccount: document.getElementById('modal-create-account'),
    formCreateAccount: document.getElementById('form-create-account'),
    modalFollowList: document.getElementById('modal-follow-list'),
    followListModalTitle: document.getElementById('follow-list-modal-title'),
    followModalUsersList: document.getElementById('follow-modal-users-list'),
    modalLikersList: document.getElementById('modal-likers-list'),
    likersModalUsersList: document.getElementById('likers-modal-users-list'),
    modalLightbox: document.getElementById('modal-lightbox'),
    lightboxImage: document.getElementById('lightbox-image'),
    lightboxClose: document.getElementById('lightbox-close'),
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================

  async function init() {
    initTheme();
    setupEventListeners();
    await loadInitialData();
  }

  // Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem('pulse_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    el.themeLabel.textContent = savedTheme === 'dark' ? 'Dark' : 'Light';
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('pulse_theme', newTheme);
    el.themeLabel.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  // Load initial app data
  async function loadInitialData() {
    try {
      const users = await API.getUsers();
      state.users = users;

      if (users.length === 0) {
        showToast('No users found in database', 'error');
        return;
      }

      // Check saved active user or default to first
      const savedUserId = localStorage.getItem('pulse_active_user_id');
      const foundUser = users.find(u => u.id === Number(savedUserId));
      state.activeUser = foundUser || users[0];
      state.viewingUserId = state.activeUser.id;

      updateActiveUserUI();
      renderWhoToFollow();
      loadFeed();
      loadStats();
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Could not connect to Pulse backend server', 'error');
    }
  }

  // Update UI with Active User details
  function updateActiveUserUI() {
    if (!state.activeUser) return;
    localStorage.setItem('pulse_active_user_id', state.activeUser.id);
    
    el.activeUserAvatar.src = state.activeUser.avatar;
    el.activeUserName.textContent = state.activeUser.name;
    el.activeUserHandle.textContent = `@${state.activeUser.username}`;
    el.composerAvatar.src = state.activeUser.avatar;
  }

  // Switch Active User Persona
  async function setActiveUser(user) {
    state.activeUser = user;
    updateActiveUserUI();
    closeAllModals();
    showToast(`Switched active persona to ${user.name}`, 'success');

    // Refresh current view & suggestions
    renderWhoToFollow();
    if (state.currentView === 'feed') {
      loadFeed();
    } else if (state.currentView === 'profile') {
      loadProfile(state.viewingUserId || user.id);
    } else if (state.currentView === 'explore') {
      loadExplore();
    }
  }

  // ==========================================
  // NAVIGATION & VIEW SWITCHING
  // ==========================================

  function switchView(viewName) {
    state.currentView = viewName;

    // Update active nav button
    [el.navFeed, el.navExplore, el.navProfile, el.navStats].forEach(btn => btn.classList.remove('active'));
    [el.viewFeed, el.viewProfile, el.viewExplore, el.viewStats].forEach(view => view.classList.remove('active'));

    // Toggle Feed Tab bar visibility
    if (viewName === 'feed') {
      el.navFeed.classList.add('active');
      el.viewFeed.classList.add('active');
      el.feedTabs.classList.remove('hidden');
      el.viewHeading.textContent = 'Social Feed';
      el.viewSubheading.textContent = 'Live Updates';
      loadFeed();
    } else if (viewName === 'explore') {
      el.navExplore.classList.add('active');
      el.viewExplore.classList.add('active');
      el.feedTabs.classList.add('hidden');
      el.viewHeading.textContent = 'Explore';
      el.viewSubheading.textContent = 'Community';
      loadExplore();
    } else if (viewName === 'profile') {
      el.navProfile.classList.add('active');
      el.viewProfile.classList.add('active');
      el.feedTabs.classList.add('hidden');
      el.viewHeading.textContent = 'Profile';
      el.viewSubheading.textContent = 'Details';
      loadProfile(state.activeUser.id);
    } else if (viewName === 'stats') {
      el.navStats.classList.add('active');
      el.viewStats.classList.add('active');
      el.feedTabs.classList.add('hidden');
      el.viewHeading.textContent = 'Analytics';
      el.viewSubheading.textContent = 'Platform Health';
      loadStats();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // FEED CONTROLLER
  // ==========================================

  async function loadFeed() {
    el.postsStream.innerHTML = `
      <div class="stream-loading">
        <div class="spinner"></div>
        <p>Gathering fresh pulses...</p>
      </div>
    `;

    try {
      const posts = await API.getPosts({
        feed: state.currentFeed,
        viewerId: state.activeUser ? state.activeUser.id : null,
        search: state.searchQuery
      });

      renderPostsStream(el.postsStream, posts);
    } catch (err) {
      console.error('Error loading feed:', err);
      el.postsStream.innerHTML = `
        <div class="empty-state">
          <p>Failed to load pulses. Please try again.</p>
        </div>
      `;
    }
  }

  function renderPostsStream(container, posts) {
    if (!posts || posts.length === 0) {
      let emptyMsg = 'No pulses to display yet.';
      if (state.currentFeed === 'following') {
        emptyMsg = 'You are not following anyone with posts yet. Check out "Who to follow" or the "For You" feed!';
      } else if (state.searchQuery) {
        emptyMsg = `No pulses found matching "${escapeHtml(state.searchQuery)}".`;
      }

      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p>${emptyMsg}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    posts.forEach(post => {
      const card = createPostCardElement(post);
      container.appendChild(card);
    });
  }

  // Generate Post Card Element
  function createPostCardElement(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.id = `post-${post.id}`;

    const isOwnPost = state.activeUser && post.user_id === state.activeUser.id;
    const isLiked = Boolean(post.has_liked);
    const isFollowingAuthor = Boolean(post.is_following_author);
    const formattedDate = formatRelativeTime(post.created_at);

    // Hashtag linking regex
    const contentHtml = escapeHtml(post.content).replace(
      /#([a-zA-Z0-9_]+)/g,
      '<span class="hashtag" data-tag="#$1">#$1</span>'
    );

    card.innerHTML = `
      <div class="post-header">
        <div class="post-author-group" data-user-id="${post.user_id}">
          <img src="${escapeHtml(post.author_avatar)}" alt="${escapeHtml(post.author_name)}" class="avatar-md post-author-avatar">
          <div class="post-author-meta">
            <div class="post-author-row">
              <span class="post-author-name">${escapeHtml(post.author_name)}</span>
              <span class="post-author-handle">@${escapeHtml(post.author_username)}</span>
              <span class="post-dot">·</span>
              <span class="post-time">${formattedDate}</span>
            </div>
          </div>
        </div>

        <div class="post-header-actions">
          ${!isOwnPost ? `
            <button class="btn-post-follow ${isFollowingAuthor ? 'following' : ''}" data-target-user-id="${post.user_id}">
              ${isFollowingAuthor ? 'Following' : 'Follow'}
            </button>
          ` : `
            <button class="btn-post-options btn-delete-post" data-post-id="${post.id}" title="Delete pulse">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          `}
        </div>
      </div>

      <div class="post-content">${contentHtml}</div>

      ${post.image_url ? `
        <div class="post-media-container" data-img-url="${escapeHtml(post.image_url)}">
          <img src="${escapeHtml(post.image_url)}" alt="Pulse media" loading="lazy">
        </div>
      ` : ''}

      <div class="post-actions-bar">
        <!-- Like Button -->
        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="like-count">${post.likes_count || 0}</span>
        </button>

        <!-- Likers Viewer Button -->
        ${post.likes_count > 0 ? `
          <button class="btn-text-subtle btn-view-likers" data-post-id="${post.id}" title="View likers">
            View
          </button>
        ` : ''}

        <!-- Comment Button -->
        <button class="action-btn comment-btn" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="comment-count">${post.comments_count || 0}</span>
        </button>

        <!-- Share Button -->
        <button class="action-btn share-btn" data-post-id="${post.id}" title="Copy pulse link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
      </div>

      <!-- Collapsible Comments Drawer -->
      <div class="comments-section ${state.openCommentsPostIds.has(post.id) ? '' : 'hidden'}" id="comments-section-${post.id}">
        <div class="comment-input-row">
          <input type="text" placeholder="Write a comment..." class="comment-input" data-post-id="${post.id}" maxlength="280">
          <button class="btn btn-primary btn-sm btn-submit-comment" data-post-id="${post.id}">Reply</button>
        </div>
        <div class="comments-list" id="comments-list-${post.id}">
          <div class="stream-loading" style="padding: 10px;">
            <div class="spinner" style="width: 20px; height: 20px;"></div>
          </div>
        </div>
      </div>
    `;

    // If comments drawer was open, fetch comments immediately
    if (state.openCommentsPostIds.has(post.id)) {
      loadPostComments(post.id);
    }

    return card;
  }

  // ==========================================
  // PROFILE CONTROLLER
  // ==========================================

  async function loadProfile(userId) {
    state.viewingUserId = Number(userId);

    // Profile loading indicator
    el.profileDisplayName.textContent = 'Loading...';
    el.profileHandle.textContent = '';
    el.profileBio.textContent = '';
    el.profilePostsContainer.innerHTML = `
      <div class="stream-loading">
        <div class="spinner"></div>
      </div>
    `;

    try {
      const viewerId = state.activeUser ? state.activeUser.id : null;
      const user = await API.getUser(userId, viewerId);

      // Render profile header
      el.profileDisplayName.textContent = user.name;
      el.profileHandle.textContent = `@${user.username}`;
      el.profileBio.textContent = user.bio || 'No bio provided.';
      el.profileAvatarImg.src = user.avatar;
      el.profileBannerImg.src = user.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';
      el.profileStatPosts.textContent = user.post_count || 0;
      el.profileStatFollowing.textContent = user.following_count || 0;
      el.profileStatFollowers.textContent = user.follower_count || 0;
      el.profileJoinDate.textContent = `Joined ${formatJoinDate(user.created_at)}`;

      // Render profile action button
      const isOwnProfile = state.activeUser && state.activeUser.id === user.id;
      if (isOwnProfile) {
        el.profileActionsSlot.innerHTML = `
          <button id="btn-open-edit-profile" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit Profile</span>
          </button>
        `;
      } else {
        const isFollowing = Boolean(user.is_following);
        el.profileActionsSlot.innerHTML = `
          <button class="btn btn-secondary btn-switch-to-user" data-user-id="${user.id}" title="Switch active persona to this user">
            Act as ${escapeHtml(user.name.split(' ')[0])}
          </button>
          <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-profile-follow" data-target-user-id="${user.id}">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        `;
      }

      // Load Profile Posts
      loadProfilePosts(user.id);
    } catch (err) {
      console.error('Error loading profile:', err);
      showToast('Could not load user profile', 'error');
    }
  }

  async function loadProfilePosts(userId) {
    try {
      const feedType = state.profileSubTab === 'liked' ? 'liked' : null;
      const posts = await API.getPosts({
        feed: feedType,
        userId: userId,
        viewerId: state.activeUser ? state.activeUser.id : null
      });

      renderPostsStream(el.profilePostsContainer, posts);
    } catch (err) {
      console.error('Error loading profile posts:', err);
      el.profilePostsContainer.innerHTML = `<div class="empty-state"><p>Could not load posts.</p></div>`;
    }
  }

  // ==========================================
  // EXPLORE & STATS CONTROLLER
  // ==========================================

  async function loadExplore() {
    el.exploreCreatorsGrid.innerHTML = `
      <div class="stream-loading">
        <div class="spinner"></div>
      </div>
    `;

    try {
      const users = await API.getUsers(state.activeUser ? state.activeUser.id : null);
      state.users = users;

      el.exploreCreatorsGrid.innerHTML = '';
      users.forEach(u => {
        const isSelf = state.activeUser && state.activeUser.id === u.id;
        const card = document.createElement('div');
        card.className = 'creator-card';
        card.innerHTML = `
          <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="creator-avatar" data-user-id="${u.id}">
          <div class="creator-name" data-user-id="${u.id}">${escapeHtml(u.name)}</div>
          <div class="creator-handle">@${escapeHtml(u.username)}</div>
          <p class="creator-bio">${escapeHtml(u.bio || 'Exploring ideas and sharing insights.')}</p>
          <div class="creator-stats" style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">
            ${u.follower_count} Followers · ${u.post_count} Pulses
          </div>
          ${!isSelf ? `
            <button class="btn btn-sm ${u.is_following ? 'btn-secondary' : 'btn-primary'} btn-post-follow" data-target-user-id="${u.id}">
              ${u.is_following ? 'Following' : 'Follow'}
            </button>
          ` : `
            <span class="top-bar-badge">Active You</span>
          `}
        `;
        el.exploreCreatorsGrid.appendChild(card);
      });
    } catch (err) {
      console.error('Error loading explore:', err);
    }
  }

  async function loadStats() {
    try {
      const stats = await API.getStats();
      el.statsTotalUsers.textContent = stats.users;
      el.statsTotalPosts.textContent = stats.posts;
      el.statsTotalLikes.textContent = stats.likes;
      el.statsTotalComments.textContent = stats.comments;
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  // Render Who to Follow sidebar widget
  async function renderWhoToFollow() {
    try {
      const users = await API.getUsers(state.activeUser ? state.activeUser.id : null);
      state.users = users;

      // Filter out self and people already following
      const candidates = users.filter(u => state.activeUser && u.id !== state.activeUser.id && !u.is_following);

      if (candidates.length === 0) {
        el.whoToFollowList.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-muted); padding: 6px 0;">You're connected with everyone! ✨</div>`;
        return;
      }

      el.whoToFollowList.innerHTML = '';
      candidates.slice(0, 3).forEach(u => {
        const item = document.createElement('div');
        item.className = 'follow-recommend-item';
        item.innerHTML = `
          <div class="recommend-user-info" data-user-id="${u.id}">
            <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="avatar-sm recommend-avatar">
            <div class="recommend-meta">
              <span class="recommend-name">${escapeHtml(u.name)}</span>
              <span class="recommend-handle">@${escapeHtml(u.username)}</span>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm btn-post-follow" data-target-user-id="${u.id}">
            Follow
          </button>
        `;
        el.whoToFollowList.appendChild(item);
      });
    } catch (err) {
      console.error('Error rendering who to follow:', err);
    }
  }

  // ==========================================
  // INTERACTIONS: LIKING & COMMENTS
  // ==========================================

  // Toggle Like on a Post
  async function handleToggleLike(postId, button) {
    if (!state.activeUser) {
      showToast('Please select a user persona to like posts', 'info');
      return;
    }

    const isLiked = button.classList.contains('liked');
    const countSpan = button.querySelector('.like-count');
    let currentCount = parseInt(countSpan.textContent, 10) || 0;

    // Optimistic UI update
    if (isLiked) {
      button.classList.remove('liked');
      button.querySelector('svg').setAttribute('fill', 'none');
      countSpan.textContent = Math.max(0, currentCount - 1);
    } else {
      button.classList.add('liked');
      button.querySelector('svg').setAttribute('fill', 'currentColor');
      countSpan.textContent = currentCount + 1;
    }

    try {
      let res;
      if (isLiked) {
        res = await API.unlikePost(postId, state.activeUser.id);
      } else {
        res = await API.likePost(postId, state.activeUser.id);
      }
      countSpan.textContent = res.likesCount;
      loadStats();
    } catch (err) {
      console.error('Error toggling like:', err);
      // Rollback on error
      if (isLiked) {
        button.classList.add('liked');
        button.querySelector('svg').setAttribute('fill', 'currentColor');
        countSpan.textContent = currentCount;
      } else {
        button.classList.remove('liked');
        button.querySelector('svg').setAttribute('fill', 'none');
        countSpan.textContent = currentCount;
      }
      showToast('Could not update like', 'error');
    }
  }

  // Toggle Comments Drawer
  async function handleToggleComments(postId) {
    const drawer = document.getElementById(`comments-section-${postId}`);
    if (!drawer) return;

    if (drawer.classList.contains('hidden')) {
      drawer.classList.remove('hidden');
      state.openCommentsPostIds.add(postId);
      await loadPostComments(postId);
    } else {
      drawer.classList.add('hidden');
      state.openCommentsPostIds.delete(postId);
    }
  }

  // Load comments for a post
  async function loadPostComments(postId) {
    const container = document.getElementById(`comments-list-${postId}`);
    if (!container) return;

    try {
      const comments = await API.getComments(postId);
      if (comments.length === 0) {
        container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 4px 0;">No comments yet. Start the conversation!</div>`;
        return;
      }

      container.innerHTML = '';
      comments.forEach(c => {
        const item = document.createElement('div');
        item.className = 'comment-item';
        item.id = `comment-${c.id}`;

        const isOwnComment = state.activeUser && c.user_id === state.activeUser.id;
        item.innerHTML = `
          <img src="${escapeHtml(c.author_avatar)}" alt="${escapeHtml(c.author_name)}" class="avatar-sm comment-avatar" data-user-id="${c.user_id}">
          <div class="comment-content-block">
            <div class="comment-author-row">
              <span class="comment-author-name" data-user-id="${c.user_id}">${escapeHtml(c.author_name)}</span>
              <span class="comment-time">${formatRelativeTime(c.created_at)}</span>
            </div>
            <div class="comment-text">${escapeHtml(c.content)}</div>
            ${isOwnComment ? `
              <button class="btn-delete-comment" data-comment-id="${c.id}" data-post-id="${postId}">Delete</button>
            ` : ''}
          </div>
        `;
        container.appendChild(item);
      });
    } catch (err) {
      console.error('Error loading comments:', err);
      container.innerHTML = `<div style="font-size: 0.8rem; color: var(--color-danger);">Failed to load comments</div>`;
    }
  }

  // Submit comment
  async function handleSubmitComment(postId) {
    const drawer = document.getElementById(`comments-section-${postId}`);
    if (!drawer) return;
    const input = drawer.querySelector('.comment-input');
    const content = input.value.trim();

    if (!content) return;
    if (!state.activeUser) {
      showToast('Select a user persona first', 'info');
      return;
    }

    try {
      const res = await API.createComment(postId, state.activeUser.id, content);
      input.value = '';
      
      // Update comment count badge on post card
      const postCard = document.getElementById(`post-${postId}`);
      if (postCard) {
        const countSpan = postCard.querySelector('.comment-btn .comment-count');
        if (countSpan) countSpan.textContent = res.commentsCount;
      }

      await loadPostComments(postId);
      showToast('Comment posted', 'success');
      loadStats();
    } catch (err) {
      console.error('Error posting comment:', err);
      showToast('Could not post comment', 'error');
    }
  }

  // Delete comment
  async function handleDeleteComment(commentId, postId) {
    try {
      const res = await API.deleteComment(commentId);
      const postCard = document.getElementById(`post-${postId}`);
      if (postCard) {
        const countSpan = postCard.querySelector('.comment-btn .comment-count');
        if (countSpan) countSpan.textContent = res.commentsCount;
      }
      await loadPostComments(postId);
      showToast('Comment deleted', 'info');
      loadStats();
    } catch (err) {
      console.error('Error deleting comment:', err);
      showToast('Could not delete comment', 'error');
    }
  }

  // ==========================================
  // INTERACTIONS: FOLLOWING & USER CONNECTIONS
  // ==========================================

  async function handleToggleFollow(targetUserId, button) {
    if (!state.activeUser) {
      showToast('Please select a persona first', 'info');
      return;
    }

    const isFollowing = button.classList.contains('following') || button.textContent.trim() === 'Following';
    
    try {
      if (isFollowing) {
        await API.unfollowUser(targetUserId, state.activeUser.id);
        button.classList.remove('following');
        button.textContent = 'Follow';
        showToast('Unfollowed user', 'info');
      } else {
        await API.followUser(targetUserId, state.activeUser.id);
        button.classList.add('following');
        button.textContent = 'Following';
        showToast('Now following!', 'success');
      }

      // Refresh sidebars and current view if relevant
      renderWhoToFollow();
      if (state.currentView === 'profile' && state.viewingUserId === targetUserId) {
        loadProfile(targetUserId);
      } else if (state.currentFeed === 'following' && state.currentView === 'feed') {
        loadFeed();
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      showToast('Could not update follow status', 'error');
    }
  }

  // View Likers Modal
  async function showLikersModal(postId) {
    openModal('modal-likers-list');
    el.likersModalUsersList.innerHTML = `<div class="stream-loading"><div class="spinner"></div></div>`;

    try {
      const likers = await API.getPostLikes(postId);
      if (likers.length === 0) {
        el.likersModalUsersList.innerHTML = `<p class="modal-intro">No likes yet.</p>`;
        return;
      }

      el.likersModalUsersList.innerHTML = '';
      likers.forEach(u => {
        const item = document.createElement('div');
        item.className = 'follow-user-item';
        item.innerHTML = `
          <div class="recommend-user-info" data-user-id="${u.id}">
            <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="avatar-sm recommend-avatar">
            <div class="recommend-meta">
              <span class="recommend-name">${escapeHtml(u.name)}</span>
              <span class="recommend-handle">@${escapeHtml(u.username)}</span>
            </div>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${formatRelativeTime(u.created_at)}</span>
        `;
        el.likersModalUsersList.appendChild(item);
      });
    } catch (err) {
      console.error('Error fetching likers:', err);
    }
  }

  // View Followers / Following Modal
  async function showConnectionsModal(type) {
    if (!state.viewingUserId) return;
    const isFollowers = type === 'followers';
    el.followListModalTitle.textContent = isFollowers ? 'Followers' : 'Following';
    openModal('modal-follow-list');
    el.followModalUsersList.innerHTML = `<div class="stream-loading"><div class="spinner"></div></div>`;

    try {
      const viewerId = state.activeUser ? state.activeUser.id : null;
      const list = isFollowers
        ? await API.getFollowers(state.viewingUserId, viewerId)
        : await API.getFollowing(state.viewingUserId, viewerId);

      if (list.length === 0) {
        el.followModalUsersList.innerHTML = `
          <p class="modal-intro">No ${type} found.</p>
        `;
        return;
      }

      el.followModalUsersList.innerHTML = '';
      list.forEach(u => {
        const isSelf = state.activeUser && state.activeUser.id === u.id;
        const item = document.createElement('div');
        item.className = 'follow-user-item';
        item.innerHTML = `
          <div class="recommend-user-info" data-user-id="${u.id}">
            <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="avatar-sm recommend-avatar">
            <div class="recommend-meta">
              <span class="recommend-name">${escapeHtml(u.name)}</span>
              <span class="recommend-handle">@${escapeHtml(u.username)}</span>
            </div>
          </div>
          ${!isSelf ? `
            <button class="btn btn-sm ${u.is_following ? 'btn-secondary following' : 'btn-primary'} btn-post-follow" data-target-user-id="${u.id}">
              ${u.is_following ? 'Following' : 'Follow'}
            </button>
          ` : `
            <span class="top-bar-badge">You</span>
          `}
        `;
        el.followModalUsersList.appendChild(item);
      });
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    }
  }

  // ==========================================
  // INTERACTIONS: POST CREATION & DELETION
  // ==========================================

  async function handleCreatePost() {
    const content = el.composerTextarea.value.trim();
    if (!content) return;
    if (!state.activeUser) {
      showToast('Select an active persona first', 'info');
      return;
    }

    el.btnSubmitPost.disabled = true;
    el.btnSubmitPost.innerHTML = `<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Publishing...`;

    try {
      const newPost = await API.createPost({
        userId: state.activeUser.id,
        content,
        imageUrl: state.attachedImageUrl
      });

      // Reset composer
      el.composerTextarea.value = '';
      state.attachedImageUrl = '';
      el.composerImagePreviewWrapper.classList.add('hidden');
      el.composerMediaPanel.classList.add('hidden');
      el.composerImageUrlInput.value = '';
      el.composerCharCount.textContent = '500';

      // Insert into stream if currently on Feed view
      if (state.currentView === 'feed') {
        const card = createPostCardElement(newPost);
        card.style.animation = 'fadeIn 0.3s ease';
        const emptyState = el.postsStream.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        el.postsStream.prepend(card);
      }

      showToast('✨ Pulse published successfully!', 'success');
      loadStats();
    } catch (err) {
      console.error('Error publishing post:', err);
      showToast('Failed to publish pulse', 'error');
    } finally {
      el.btnSubmitPost.disabled = false;
      el.btnSubmitPost.innerHTML = `
        <span>Publish</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `;
    }
  }

  async function handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this pulse?')) return;

    try {
      await API.deletePost(postId);
      const postCard = document.getElementById(`post-${postId}`);
      if (postCard) {
        postCard.style.transition = 'all 0.25s ease';
        postCard.style.opacity = '0';
        postCard.style.transform = 'translateY(-10px)';
        setTimeout(() => postCard.remove(), 250);
      }
      showToast('Pulse deleted', 'info');
      loadStats();
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('Failed to delete pulse', 'error');
    }
  }

  // ==========================================
  // PROFILE EDITING & CREATION
  // ==========================================

  function openEditProfileModal() {
    if (!state.activeUser) return;
    el.editName.value = state.activeUser.name;
    el.editBio.value = state.activeUser.bio || '';
    el.editAvatar.value = state.activeUser.avatar || '';
    el.editBanner.value = state.activeUser.banner || '';
    openModal('modal-edit-profile');
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!state.activeUser) return;

    const updatedData = {
      name: el.editName.value.trim(),
      bio: el.editBio.value.trim(),
      avatar: el.editAvatar.value.trim() || state.activeUser.avatar,
      banner: el.editBanner.value.trim() || state.activeUser.banner
    };

    try {
      const updatedUser = await API.updateUser(state.activeUser.id, updatedData);
      state.activeUser = updatedUser;
      updateActiveUserUI();
      closeAllModals();
      showToast('Profile updated successfully!', 'success');
      loadProfile(state.activeUser.id);
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Could not save profile changes', 'error');
    }
  }

  async function handleCreatePersona(e) {
    e.preventDefault();
    const username = document.getElementById('new-username').value.trim();
    const name = document.getElementById('new-name').value.trim();
    const bio = document.getElementById('new-bio').value.trim();
    const avatar = document.getElementById('new-avatar').value.trim();

    try {
      const newUser = await API.createUser({
        username,
        name,
        bio,
        avatar: avatar || undefined
      });

      const users = await API.getUsers();
      state.users = users;
      closeAllModals();
      el.formCreateAccount.reset();
      setActiveUser(newUser);
      showToast(`Welcome @${newUser.username}! Created your profile.`, 'success');
    } catch (err) {
      console.error('Error creating persona:', err);
      showToast(err.message || 'Failed to create persona', 'error');
    }
  }

  // Persona Picker Modal
  function openPersonaPicker() {
    el.personaPickerList.innerHTML = '';
    state.users.forEach(u => {
      const isCurrent = state.activeUser && state.activeUser.id === u.id;
      const item = document.createElement('div');
      item.className = `persona-picker-item ${isCurrent ? 'active' : ''}`;
      item.innerHTML = `
        <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="avatar-md" style="border-radius: 50%;">
        <div style="flex: 1;">
          <div style="font-weight: 700; font-size: 0.95rem;">${escapeHtml(u.name)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">@${escapeHtml(u.username)}</div>
        </div>
        ${isCurrent ? '<span class="top-bar-badge">Active</span>' : ''}
      `;
      item.addEventListener('click', () => setActiveUser(u));
      el.personaPickerList.appendChild(item);
    });
    openModal('modal-persona-picker');
  }

  // Reset demo database
  async function handleResetDatabase() {
    if (!confirm('This will restore all tables and re-seed the demo users, posts, and comments. Proceed?')) return;

    try {
      await API.resetSeed();
      showToast('Database reset to clean demo state!', 'success');
      await loadInitialData();
    } catch (err) {
      console.error('Error resetting database:', err);
      showToast('Failed to reset database', 'error');
    }
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  function setupEventListeners() {
    // Navigation
    el.navFeed.addEventListener('click', () => switchView('feed'));
    el.navExplore.addEventListener('click', () => switchView('explore'));
    el.navProfile.addEventListener('click', () => switchView('profile'));
    el.navStats.addEventListener('click', () => switchView('stats'));
    el.brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('feed');
    });

    // Feed Tabs
    el.tabForYou.addEventListener('click', () => {
      el.tabForYou.classList.add('active');
      el.tabFollowing.classList.remove('active');
      state.currentFeed = 'for_you';
      loadFeed();
    });

    el.tabFollowing.addEventListener('click', () => {
      el.tabFollowing.classList.add('active');
      el.tabForYou.classList.remove('active');
      state.currentFeed = 'following';
      loadFeed();
    });

    // Theme toggle
    el.btnThemeToggle.addEventListener('click', toggleTheme);

    // Persona picker
    el.btnSwitchPersona.addEventListener('click', openPersonaPicker);
    el.btnCreateAccount.addEventListener('click', () => openModal('modal-create-account'));

    // Compose button
    el.btnQuickCompose.addEventListener('click', () => {
      switchView('feed');
      el.composerTextarea.focus();
    });

    // Post Composer inputs
    el.composerTextarea.addEventListener('input', () => {
      const val = el.composerTextarea.value;
      const remaining = 500 - val.length;
      el.composerCharCount.textContent = remaining;
      el.btnSubmitPost.disabled = val.trim().length === 0;
    });

    el.btnSubmitPost.addEventListener('click', handleCreatePost);

    el.btnToggleMediaPanel.addEventListener('click', () => {
      el.composerMediaPanel.classList.toggle('hidden');
      if (!el.composerMediaPanel.classList.contains('hidden')) {
        el.composerImageUrlInput.focus();
      }
    });

    el.btnAddHashtag.addEventListener('click', () => {
      el.composerTextarea.value += ' #';
      el.composerTextarea.focus();
      el.btnSubmitPost.disabled = false;
    });

    el.btnApplyImageUrl.addEventListener('click', () => {
      const url = el.composerImageUrlInput.value.trim();
      if (url) {
        attachImage(url);
      }
    });

    // Preset Image Chips
    document.querySelectorAll('.chip-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        if (url) attachImage(url);
      });
    });

    el.btnRemoveAttachment.addEventListener('click', () => {
      state.attachedImageUrl = '';
      el.composerImagePreviewWrapper.classList.add('hidden');
      el.composerImageUrlInput.value = '';
    });

    // Global Search
    let searchDebounceTimer;
    el.globalSearchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      const val = el.globalSearchInput.value.trim();
      el.btnClearSearch.classList.toggle('hidden', val.length === 0);

      searchDebounceTimer = setTimeout(() => {
        state.searchQuery = val;
        if (val) {
          el.filterBanner.classList.remove('hidden');
          el.filterBannerText.textContent = `Showing results for "${val}"`;
        } else {
          el.filterBanner.classList.add('hidden');
        }
        if (state.currentView !== 'feed') switchView('feed');
        else loadFeed();
      }, 350);
    });

    el.btnClearSearch.addEventListener('click', () => {
      el.globalSearchInput.value = '';
      state.searchQuery = '';
      el.btnClearSearch.classList.add('hidden');
      el.filterBanner.classList.add('hidden');
      loadFeed();
    });

    el.btnClearFilter.addEventListener('click', () => {
      el.globalSearchInput.value = '';
      state.searchQuery = '';
      el.btnClearSearch.classList.add('hidden');
      el.filterBanner.classList.add('hidden');
      loadFeed();
    });

    // Profile Subtabs (Pulses vs Liked)
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.profileSubTab = btn.getAttribute('data-subtab');
        if (state.viewingUserId) loadProfilePosts(state.viewingUserId);
      });
    });

    // View Followers / Following buttons
    el.btnViewFollowers.addEventListener('click', () => showConnectionsModal('followers'));
    el.btnViewFollowing.addEventListener('click', () => showConnectionsModal('following'));

    // Forms
    el.formEditProfile.addEventListener('submit', handleSaveProfile);
    el.formCreateAccount.addEventListener('submit', handleCreatePersona);
    el.btnResetDatabase.addEventListener('click', handleResetDatabase);

    // Modal Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        closeModal(modalId);
      });
    });

    // Lightbox Close
    el.lightboxClose.addEventListener('click', () => el.modalLightbox.classList.add('hidden'));
    el.modalLightbox.addEventListener('click', (e) => {
      if (e.target === el.modalLightbox) el.modalLightbox.classList.add('hidden');
    });

    // Trending Tag clicks
    document.addEventListener('click', (e) => {
      // Hashtag click or trending item
      const tagTarget = e.target.closest('.hashtag') || e.target.closest('.trending-item') || e.target.closest('.trending-tag-card');
      if (tagTarget) {
        const tag = tagTarget.getAttribute('data-tag');
        if (tag) {
          el.globalSearchInput.value = tag;
          state.searchQuery = tag;
          el.btnClearSearch.classList.remove('hidden');
          el.filterBanner.classList.remove('hidden');
          el.filterBannerText.textContent = `Showing pulses tagged with ${tag}`;
          switchView('feed');
          return;
        }
      }

      // User Profile click (Avatar or Name)
      const userGroup = e.target.closest('.post-author-group') || e.target.closest('.recommend-user-info') || e.target.closest('[data-user-id]');
      if (userGroup && !e.target.closest('.btn-post-follow') && !e.target.closest('.btn-delete-post')) {
        const userId = userGroup.getAttribute('data-user-id');
        if (userId) {
          switchView('profile');
          loadProfile(userId);
          closeAllModals();
          return;
        }
      }

      // Like Button click
      const likeBtn = e.target.closest('.like-btn');
      if (likeBtn) {
        const postId = Number(likeBtn.getAttribute('data-post-id'));
        handleToggleLike(postId, likeBtn);
        return;
      }

      // Likers List click
      const likersBtn = e.target.closest('.btn-view-likers');
      if (likersBtn) {
        const postId = Number(likersBtn.getAttribute('data-post-id'));
        showLikersModal(postId);
        return;
      }

      // Comment Toggle click
      const commentBtn = e.target.closest('.comment-btn');
      if (commentBtn) {
        const postId = Number(commentBtn.getAttribute('data-post-id'));
        handleToggleComments(postId);
        return;
      }

      // Submit Comment click
      const submitCommentBtn = e.target.closest('.btn-submit-comment');
      if (submitCommentBtn) {
        const postId = Number(submitCommentBtn.getAttribute('data-post-id'));
        handleSubmitComment(postId);
        return;
      }

      // Delete Comment click
      const deleteCommentBtn = e.target.closest('.btn-delete-comment');
      if (deleteCommentBtn) {
        const commentId = Number(deleteCommentBtn.getAttribute('data-comment-id'));
        const postId = Number(deleteCommentBtn.getAttribute('data-post-id'));
        handleDeleteComment(commentId, postId);
        return;
      }

      // Follow / Unfollow click
      const followBtn = e.target.closest('.btn-post-follow') || e.target.closest('.btn-profile-follow');
      if (followBtn) {
        const targetId = Number(followBtn.getAttribute('data-target-user-id'));
        handleToggleFollow(targetId, followBtn);
        return;
      }

      // Delete Post click
      const deletePostBtn = e.target.closest('.btn-delete-post');
      if (deletePostBtn) {
        const postId = Number(deletePostBtn.getAttribute('data-post-id'));
        handleDeletePost(postId);
        return;
      }

      // Edit Profile button
      if (e.target.closest('#btn-open-edit-profile')) {
        openEditProfileModal();
        return;
      }

      // Switch to User button
      const switchUserBtn = e.target.closest('.btn-switch-to-user');
      if (switchUserBtn) {
        const uid = Number(switchUserBtn.getAttribute('data-user-id'));
        const u = state.users.find(x => x.id === uid);
        if (u) setActiveUser(u);
        return;
      }

      // Image Lightbox click
      const mediaContainer = e.target.closest('.post-media-container');
      if (mediaContainer) {
        const imgUrl = mediaContainer.getAttribute('data-img-url');
        if (imgUrl) {
          el.lightboxImage.src = imgUrl;
          el.modalLightbox.classList.remove('hidden');
        }
        return;
      }

      // Share post click
      const shareBtn = e.target.closest('.share-btn');
      if (shareBtn) {
        const postId = shareBtn.getAttribute('data-post-id');
        navigator.clipboard?.writeText(`${window.location.origin}/#post-${postId}`);
        showToast('Link copied to clipboard! 📋', 'success');
        return;
      }
    });

    // Enter key submits comment in comment input
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('comment-input')) {
        const postId = Number(e.target.getAttribute('data-post-id'));
        handleSubmitComment(postId);
      }
    });
  }

  function attachImage(url) {
    state.attachedImageUrl = url;
    el.composerImagePreview.src = url;
    el.composerImagePreviewWrapper.classList.remove('hidden');
    el.composerMediaPanel.classList.add('hidden');
  }

  // ==========================================
  // MODAL & TOAST HELPERS
  // ==========================================

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return 'just now';
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (isNaN(diffSecs) || diffSecs < 60) return 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatJoinDate(dateStr) {
    if (!dateStr) return 'recently';
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Run initialization
  init();
});
