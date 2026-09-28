const express = require('express');
const path = require('node:path');
const { db, initDb, seedData } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to convert BigInt if present
function sanitizeRow(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === 'bigint' ? Number(v) : v;
  }
  return out;
}

function sanitizeRows(rows) {
  return rows.map(sanitizeRow);
}

// ==========================================
// USER ENDPOINTS
// ==========================================

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const viewerId = req.query.viewer_id ? Number(req.query.viewer_id) : 0;
    const stmt = db.prepare(`
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
      FROM users u
      ORDER BY u.id ASC
    `);
    const users = sanitizeRows(stmt.all(viewerId));
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user profile by ID
app.get('/api/users/:id', (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const viewerId = req.query.viewer_id ? Number(req.query.viewer_id) : 0;

    const stmt = db.prepare(`
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
      FROM users u
      WHERE u.id = ?
    `);
    const user = sanitizeRow(stmt.get(viewerId, targetId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user profile
app.post('/api/users', (req, res) => {
  try {
    const { username, name, bio, avatar, banner } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: 'Username and display name are required' });
    }

    // Clean username
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80`;
    const defaultBanner = `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80`;

    const stmt = db.prepare(`
      INSERT INTO users (username, name, bio, avatar, banner)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cleanUsername,
      name.trim(),
      (bio || '').trim(),
      avatar || defaultAvatar,
      banner || defaultBanner
    );

    const newUser = sanitizeRow(db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)));
    res.status(201).json(newUser);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user profile
app.put('/api/users/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { name, bio, avatar, banner } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stmt = db.prepare(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        bio = COALESCE(?, bio),
        avatar = COALESCE(?, avatar),
        banner = COALESCE(?, banner)
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name.trim() : null,
      bio !== undefined ? bio.trim() : null,
      avatar !== undefined ? avatar.trim() : null,
      banner !== undefined ? banner.trim() : null,
      userId
    );

    const updated = sanitizeRow(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
    res.json(updated);
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Follow a user
app.post('/api/users/:id/follow', (req, res) => {
  try {
    const followingId = Number(req.params.id);
    const followerId = Number(req.body.follower_id);

    if (!followerId || isNaN(followerId)) {
      return res.status(400).json({ error: 'follower_id is required' });
    }
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const insert = db.prepare(`
      INSERT OR IGNORE INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `);
    insert.run(followerId, followingId);

    const count = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(followingId).count;

    res.json({
      following: true,
      followerCount: Number(count)
    });
  } catch (err) {
    console.error('Error following user:', err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
app.delete('/api/users/:id/follow', (req, res) => {
  try {
    const followingId = Number(req.params.id);
    const followerId = Number(req.body.follower_id || req.query.follower_id);

    if (!followerId || isNaN(followerId)) {
      return res.status(400).json({ error: 'follower_id is required' });
    }

    const del = db.prepare(`
      DELETE FROM follows 
      WHERE follower_id = ? AND following_id = ?
    `);
    del.run(followerId, followingId);

    const count = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(followingId).count;

    res.json({
      following: false,
      followerCount: Number(count)
    });
  } catch (err) {
    console.error('Error unfollowing user:', err);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// List followers of user
app.get('/api/users/:id/followers', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const viewerId = req.query.viewer_id ? Number(req.query.viewer_id) : 0;

    const stmt = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.bio, u.avatar,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `);
    const followers = sanitizeRows(stmt.all(viewerId, userId));
    res.json(followers);
  } catch (err) {
    console.error('Error fetching followers:', err);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// List who user is following
app.get('/api/users/:id/following', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const viewerId = req.query.viewer_id ? Number(req.query.viewer_id) : 0;

    const stmt = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.bio, u.avatar,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `);
    const following = sanitizeRows(stmt.all(viewerId, userId));
    res.json(following);
  } catch (err) {
    console.error('Error fetching following list:', err);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// ==========================================
// POSTS ENDPOINTS
// ==========================================

// Get posts (with feed filtering: for_you, following, liked, user_id, search)
app.get('/api/posts', (req, res) => {
  try {
    const viewerId = req.query.viewer_id ? Number(req.query.viewer_id) : 0;
    const feed = req.query.feed || 'for_you';
    const authorId = req.query.user_id ? Number(req.query.user_id) : null;
    const search = req.query.search ? `%${req.query.search.trim().toLowerCase()}%` : null;

    let query = `
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        u.name as author_name,
        u.username as author_username,
        u.avatar as author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as has_liked,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_following_author
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;

    const whereClauses = [];
    const params = [viewerId, viewerId];

    if (feed === 'following' && viewerId) {
      whereClauses.push(`p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)`);
      params.push(viewerId);
    } else if (feed === 'liked' && authorId) {
      whereClauses.push(`p.id IN (SELECT post_id FROM likes WHERE user_id = ?)`);
      params.push(authorId);
    } else if (authorId) {
      whereClauses.push(`p.user_id = ?`);
      params.push(authorId);
    }

    if (search) {
      whereClauses.push(`(LOWER(p.content) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.username) LIKE ?)`);
      params.push(search, search, search);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(' AND ');
    }

    query += ` ORDER BY p.created_at DESC`;

    const stmt = db.prepare(query);
    const posts = sanitizeRows(stmt.all(...params));
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
app.post('/api/posts', (req, res) => {
  try {
    const { user_id, content, image_url } = req.body;
    if (!user_id || !content || !content.trim()) {
      return res.status(400).json({ error: 'Author user_id and content are required' });
    }

    const insert = db.prepare(`
      INSERT INTO posts (user_id, content, image_url, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    const result = insert.run(Number(user_id), content.trim(), (image_url || '').trim());
    const postId = Number(result.lastInsertRowid);

    const postStmt = db.prepare(`
      SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        u.avatar as author_avatar,
        0 as likes_count,
        0 as comments_count,
        0 as has_liked,
        0 as is_following_author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `);
    const createdPost = sanitizeRow(postStmt.get(postId));
    res.status(201).json(createdPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete a post
app.delete('/api/posts/:id', (req, res) => {
  try {
    const postId = Number(req.params.id);
    const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(postId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully', postId });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ==========================================
// LIKE / UNLIKE POST ENDPOINTS
// ==========================================

// Like a post
app.post('/api/posts/:id/like', (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = Number(req.body.user_id);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'user_id is required to like' });
    }

    const insert = db.prepare(`
      INSERT OR IGNORE INTO likes (post_id, user_id)
      VALUES (?, ?)
    `);
    insert.run(postId, userId);

    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId).count;

    res.json({
      liked: true,
      likesCount: Number(count)
    });
  } catch (err) {
    console.error('Error liking post:', err);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Unlike a post
app.delete('/api/posts/:id/like', (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = Number(req.body.user_id || req.query.user_id);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'user_id is required to unlike' });
    }

    const del = db.prepare(`
      DELETE FROM likes
      WHERE post_id = ? AND user_id = ?
    `);
    del.run(postId, userId);

    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId).count;

    res.json({
      liked: false,
      likesCount: Number(count)
    });
  } catch (err) {
    console.error('Error unliking post:', err);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// Get users who liked a post
app.get('/api/posts/:id/likes', (req, res) => {
  try {
    const postId = Number(req.params.id);
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.name, u.avatar, l.created_at
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.post_id = ?
      ORDER BY l.created_at DESC
    `);
    const likers = sanitizeRows(stmt.all(postId));
    res.json(likers);
  } catch (err) {
    console.error('Error fetching post likers:', err);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// ==========================================
// COMMENTS ENDPOINTS
// ==========================================

// Get comments for a post
app.get('/api/posts/:id/comments', (req, res) => {
  try {
    const postId = Number(req.params.id);
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        u.name as author_name,
        u.username as author_username,
        u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `);
    const comments = sanitizeRows(stmt.all(postId));
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to a post
app.post('/api/posts/:id/comments', (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { user_id, content } = req.body;

    if (!user_id || !content || !content.trim()) {
      return res.status(400).json({ error: 'user_id and comment content are required' });
    }

    const insert = db.prepare(`
      INSERT INTO comments (post_id, user_id, content, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    const result = insert.run(postId, Number(user_id), content.trim());
    const commentId = Number(result.lastInsertRowid);

    const getStmt = db.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        u.username as author_username,
        u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);
    const comment = sanitizeRow(getStmt.get(commentId));
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?').get(postId).count;

    res.status(201).json({
      comment,
      commentsCount: Number(totalComments)
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete comment
app.delete('/api/comments/:id', (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = db.prepare('SELECT post_id FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const postId = Number(comment.post_id);
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?').get(postId).count;

    res.json({
      message: 'Comment deleted',
      commentId,
      postId,
      commentsCount: Number(totalComments)
    });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ==========================================
// STATS & RESET
// ==========================================

// Global platform stats
app.get('/api/stats', (req, res) => {
  try {
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    const likesCount = db.prepare('SELECT COUNT(*) as count FROM likes').get().count;
    const commentsCount = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;

    res.json({
      users: Number(usersCount),
      posts: Number(postsCount),
      likes: Number(likesCount),
      comments: Number(commentsCount)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Reset and reseed database
app.post('/api/seed/reset', (req, res) => {
  try {
    db.exec(`
      DELETE FROM comments;
      DELETE FROM likes;
      DELETE FROM follows;
      DELETE FROM posts;
      DELETE FROM users;
      DELETE FROM sqlite_sequence;
    `);
    seedData();
    res.json({ message: 'Database reset and re-seeded with demo personas, posts & follows successfully!' });
  } catch (err) {
    console.error('Error reseeding:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Fallback to SPA index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pulse Social Media Server running on http://localhost:${PORT}`);
});
