const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec(`PRAGMA foreign_keys = ON;`);

// Create tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      banner TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default data if database is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedData();
  }
}

function seedData() {
  console.log('Seeding initial data...');

  const insertUser = db.prepare(`
    INSERT INTO users (username, name, bio, avatar, banner, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  // 4 rich demo personas
  const users = [
    {
      username: 'elenarostova',
      name: 'Elena Rostova',
      bio: 'Senior Product Designer @ DesignCraft. Obsessed with design systems, glassmorphism, and micro-interactions 🎨✨',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      timeOffset: '-30 days'
    },
    {
      username: 'liamvance',
      name: 'Liam Vance',
      bio: 'AI Research Engineer & open-source builder. Training neural networks and building the future of generative agents 🤖⚡',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      timeOffset: '-25 days'
    },
    {
      username: 'sophiachen',
      name: 'Sophia Chen',
      bio: 'Architectural photographer & urban explorer. Finding beauty in geometry, concrete, and neon sunsets 📸🌆',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80',
      timeOffset: '-20 days'
    },
    {
      username: 'marcusthorne',
      name: 'Marcus Thorne',
      bio: 'Fullstack Architect. High-throughput distributed systems, Node.js, and clean code enthusiast 🚀💻',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      timeOffset: '-15 days'
    }
  ];

  const userIds = [];
  for (const u of users) {
    const res = insertUser.run(u.username, u.name, u.bio, u.avatar, u.banner, u.timeOffset);
    userIds.push(Number(res.lastInsertRowid));
  }

  // Follow connections
  const insertFollow = db.prepare(`
    INSERT INTO follows (follower_id, following_id, created_at)
    VALUES (?, ?, datetime('now', ?))
  `);

  // Elena follows Liam & Sophia
  insertFollow.run(userIds[0], userIds[1], '-10 days');
  insertFollow.run(userIds[0], userIds[2], '-8 days');
  // Liam follows Elena & Marcus
  insertFollow.run(userIds[1], userIds[0], '-9 days');
  insertFollow.run(userIds[1], userIds[3], '-6 days');
  // Sophia follows Elena, Liam, Marcus
  insertFollow.run(userIds[2], userIds[0], '-5 days');
  insertFollow.run(userIds[2], userIds[1], '-4 days');
  insertFollow.run(userIds[2], userIds[3], '-3 days');
  // Marcus follows Elena
  insertFollow.run(userIds[3], userIds[0], '-2 days');

  // Posts
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, content, image_url, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  const posts = [
    {
      userId: userIds[0], // Elena
      content: 'Just shipped the new glassmorphic design system! ✨ Minimalist typography, fluid animations, and high contrast accents. What do you think of this aesthetic? #DesignSystems #UIUX #WebDev',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80',
      timeOffset: '-3 hours'
    },
    {
      userId: userIds[1], // Liam
      content: 'Benchmarked our new transformer model on edge devices today. Reduced inference latency by 42% while retaining 98.7% accuracy! The secret? Dynamic quantization and pruning attention heads. 🧠⚡ #AI #MachineLearning #Tech',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
      timeOffset: '-6 hours'
    },
    {
      userId: userIds[2], // Sophia
      content: 'Golden hour reflections through modern steel and glass. Architecture teaches us that structure and beauty are two sides of the same coin. 📸🏙️ #Photography #Architecture #UrbanScapes',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80',
      timeOffset: '-12 hours'
    },
    {
      userId: userIds[3], // Marcus
      content: 'Pro tip for backend engineers: Keep your database queries predictable and indexes lean. A single poorly placed subquery can bring down a cluster under 10k RPS. Monitor your slow query logs! 💡🛠️ #Backend #SoftwareEngineering #Architecture',
      imageUrl: '',
      timeOffset: '-1 day'
    },
    {
      userId: userIds[0], // Elena
      content: 'Sunday workspace inspiration. Clean desk, dual monitor setup, a warm cup of pour-over coffee, and soft ambient lighting. Ready for a productive week ahead! ☕💻',
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&auto=format&fit=crop&q=80',
      timeOffset: '-2 days'
    }
  ];

  const postIds = [];
  for (const p of posts) {
    const res = insertPost.run(p.userId, p.content, p.imageUrl, p.timeOffset);
    postIds.push(Number(res.lastInsertRowid));
  }

  // Likes
  const insertLike = db.prepare(`
    INSERT INTO likes (post_id, user_id, created_at)
    VALUES (?, ?, datetime('now', ?))
  `);

  insertLike.run(postIds[0], userIds[1], '-2 hours'); // Liam likes Elena's post
  insertLike.run(postIds[0], userIds[2], '-1 hour');  // Sophia likes Elena's post
  insertLike.run(postIds[0], userIds[3], '-30 minutes'); // Marcus likes Elena's post
  insertLike.run(postIds[1], userIds[0], '-5 hours'); // Elena likes Liam's post
  insertLike.run(postIds[1], userIds[3], '-4 hours'); // Marcus likes Liam's post
  insertLike.run(postIds[2], userIds[0], '-10 hours'); // Elena likes Sophia's post
  insertLike.run(postIds[2], userIds[1], '-8 hours'); // Liam likes Sophia's post

  // Comments
  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, content, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  insertComment.run(postIds[0], userIds[1], 'The color gradients and glass depth look absolutely breathtaking, Elena! Incredible work.', '-2 hours');
  insertComment.run(postIds[0], userIds[2], 'Love the soft shadows and high readability! Clean and modern.', '-1 hour');
  insertComment.run(postIds[1], userIds[3], '42% latency reduction is huge for production deployments. Are you releasing the quantization weights?', '-4 hours');
  insertComment.run(postIds[2], userIds[0], 'The symmetry and reflections in this shot are perfection Sophia! 🌟', '-7 hours');

  console.log('Seeding completed successfully!');
}

module.exports = {
  db,
  initDb,
  seedData
};
