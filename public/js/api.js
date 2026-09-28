/**
 * Pulse API Client
 * Clean abstraction for backend REST endpoints
 */

const API = {
  // USERS
  async getUsers(viewerId = null) {
    const url = viewerId ? `/api/users?viewer_id=${viewerId}` : '/api/users';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUser(userId, viewerId = null) {
    const url = viewerId ? `/api/users/${userId}?viewer_id=${viewerId}` : `/api/users/${userId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },

  async createUser(userData) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user');
    return data;
  },

  async updateUser(userId, userData) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },

  async getFollowers(userId, viewerId = null) {
    const url = viewerId ? `/api/users/${userId}/followers?viewer_id=${viewerId}` : `/api/users/${userId}/followers`;
    const res = await fetch(url);
    return res.json();
  },

  async getFollowing(userId, viewerId = null) {
    const url = viewerId ? `/api/users/${userId}/following?viewer_id=${viewerId}` : `/api/users/${userId}/following`;
    const res = await fetch(url);
    return res.json();
  },

  async followUser(targetId, followerId) {
    const res = await fetch(`/api/users/${targetId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId })
    });
    return res.json();
  },

  async unfollowUser(targetId, followerId) {
    const res = await fetch(`/api/users/${targetId}/follow`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId })
    });
    return res.json();
  },

  // POSTS
  async getPosts({ feed = 'for_you', userId = null, viewerId = null, search = '' } = {}) {
    const params = new URLSearchParams();
    if (feed) params.append('feed', feed);
    if (userId) params.append('user_id', userId);
    if (viewerId) params.append('viewer_id', viewerId);
    if (search) params.append('search', search);

    const res = await fetch(`/api/posts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async createPost({ userId, content, imageUrl = '' }) {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        content,
        image_url: imageUrl
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create post');
    return data;
  },

  async deletePost(postId) {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // LIKES
  async likePost(postId, userId) {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return res.json();
  },

  async unlikePost(postId, userId) {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return res.json();
  },

  async getPostLikes(postId) {
    const res = await fetch(`/api/posts/${postId}/likes`);
    return res.json();
  },

  // COMMENTS
  async getComments(postId) {
    const res = await fetch(`/api/posts/${postId}/comments`);
    return res.json();
  },

  async createComment(postId, userId, content) {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, content })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post comment');
    return data;
  },

  async deleteComment(commentId) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // STATS & RESET
  async getStats() {
    const res = await fetch('/api/stats');
    return res.json();
  },

  async resetSeed() {
    const res = await fetch('/api/seed/reset', {
      method: 'POST'
    });
    return res.json();
  }
};
