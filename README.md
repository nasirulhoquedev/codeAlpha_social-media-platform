# codeAlpha_social-media-platform — Pulse Social Media App

A modern mini social media web platform built for **CodeAlpha Task 2** using **HTML5, Vanilla CSS, Vanilla JavaScript**, **Express.js**, and **SQLite**.

---

## 🌟 Key Features

### 1. User Profiles & Persona Switcher
- **Rich Profiles**: User avatar, custom cover banner, display name, handle (`@username`), bio, and join date.
- **Connection Counts**: Real-time counter for **Posts**, **Following**, and **Followers**.
- **Interactive Modals**: Click "Followers" or "Following" on any profile to see the full list of members with one-click follow/unfollow buttons.
- **Edit Profile**: Update your display name, bio, avatar, and banner in a modal.
- **Active Persona Switcher**: Instantly switch between demo creators (*Elena Rostova*, *Liam Vance*, *Sophia Chen*, *Marcus Thorne*) or create your own custom profile to test multi-user interactions seamlessly!

### 2. Posts & Nested Comments
- **Rich Post Composer**: Write up to 500 characters with auto-expanding input and live character counter.
- **Media Attachments**: Attach custom image URLs or choose from quick preset chips (Tech, Design, City, Desk).
- **Interactive Feed**:
  - **For You**: Global chronological feed.
  - **Following**: Filtered feed showing only posts from creators you follow.
- **Hashtags**: Automatic hashtag detection (e.g. `#DesignSystems`, `#AI`, `#WebDev`) with 1-click filtering.
- **Comments System**: Expandable comment drawer under each post, live comment counter, instant posting, and owner comment deletion.
- **Post Management**: Post authors can delete their own posts with instant DOM removal.

### 3. Like & Follow System
- **Like / Unlike**: Heart beat pulse micro-animation, instant optimistic UI counter update, and a "View" button to see who liked the post.
- **Follow / Unfollow**: One-click toggle available across post cards, creator cards, profile headers, and the "Who to Follow" sidebar widget.

### 4. Aesthetics & Architecture
- **Modern Design System**: Sleek glassmorphism (`backdrop-filter`), tailored HSL colors, gradient highlights, and dark/light mode toggle.
- **Typography**: `Outfit` for display headings and `Plus Jakarta Sans` for body text.
- **Zero-Dependency SQLite**: Uses Node 22+ / 24+ built-in `node:sqlite` (`database.sqlite`) with foreign key constraints and cascade deletions.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/nasirulhoquedev/codeAlpha_social-media-platform.git
cd codeAlpha_social-media-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
# or for auto-reloading during development:
npm run dev
```

The app will be running at: **`http://localhost:3000`**

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE TABLE follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);
```

---

## 🧪 Testing Suite

To run the automated end-to-end integration tests:
```bash
node test_app.js
```
