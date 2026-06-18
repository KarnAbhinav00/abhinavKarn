const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Run DB queries sequentially
db.serialize(() => {
  // 1. Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  )`);

  // 2. Blogs Table
  db.run(`CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 3. Projects Table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT NOT NULL,
    link TEXT,
    image_url TEXT,
    source_link TEXT
  )`);

  // 4. Skills Table
  db.run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 80
  )`);

  // 5. Updates Table
  db.run(`CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL
  )`);

  // 6. Contact Messages Table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed Admin if not exists
  const adminUser = process.env.ADMIN_USERNAME || 'tyson';
  const adminHash = process.env.ADMIN_PASSWORD_HASH || '$2a$12$V/4aAkyPsnk5x7613.Nn8O.H3Tz9G.zE3hXN8Bq9m1H88ZgX0N2oG'; // default "abhinav10"
  
  db.get('SELECT id FROM users WHERE username = ?', [adminUser], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err.message);
      return;
    }
    if (!row) {
      db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [adminUser, adminHash, 'admin'], (err2) => {
        if (err2) {
          console.error('Failed to seed admin:', err2.message);
        } else {
          console.log(`Admin user "${adminUser}" successfully seeded.`);
        }
      });
    }
  });

  // Seed Sample Data if tables are empty
  
  // Seed Blogs
  db.get('SELECT COUNT(*) as count FROM blogs', [], (err, row) => {
    if (!err && row.count === 0) {
      const sampleBlog = {
        title: 'Starting My Daily Blogging Journey as a Class 10 Student',
        slug: 'starting-daily-blogging-journey',
        content: `Hi everyone! I am Abhinav, also known as Tyson. Welcome to my new daily blog space!

I'm currently in Class 10 studying at PM Shri Kendriya Vidyalaya in India. Coding is my passion, and I wanted to create a secure personal space where I can post my progress, write about my projects, share coding tips, and log updates daily.

### Why Blogging?
1. **Consistency**: Writing every day helps me solidify what I learn at school and in my self-studies.
2. **Community**: Sharing updates about projects allows me to connect with fellow student developers and coding enthusiasts.
3. **Documentation**: Over time, this blog will become a repository of my learning history, from simple script development to building full stack web apps.

On this portfolio, I've implemented multiple security features:
- **Layer 1: JWT & HTTPOnly Cookie Auth**: Ensuring admin routes are tightly guarded.
- **Layer 2: Helmet Headers & API Rate Limiting**: Blocking unauthorized scripts and limiting requests to prevent brute force.
- **Layer 3: Backend Environment isolation**: Making sure no sensitive files or database configurations leak to the client side.

Stay tuned for my daily updates and let's learn together!`,
        category: 'Personal',
        image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
        date: '2026-06-13'
      };

      db.run('INSERT INTO blogs (title, slug, content, category, image_url, date) VALUES (?, ?, ?, ?, ?, ?)',
        [sampleBlog.title, sampleBlog.slug, sampleBlog.content, sampleBlog.category, sampleBlog.image_url, sampleBlog.date], (err2) => {
          if (err2) console.error('Failed to seed sample blog:', err2.message);
        });
    }
  });

  // Seed Projects
  db.get('SELECT COUNT(*) as count FROM projects', [], (err, row) => {
    if (!err && row.count === 0) {
      const sampleProjects = [
        {
          title: 'Secure Portfolio & Blogging Hub',
          description: 'A custom personal portfolio website with active daily blogs, an admin control panel, rate limiting, and 3 layers of client-server security. Blends typography and design structures of Claude, Stripe, Vercel, and Cursor.',
          tags: 'Node.js, Express, SQLite, Vanilla CSS, Vanilla JS',
          link: 'http://localhost:3000',
          image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
          source_link: 'https://github.com/AbhinavTyson/website-karn'
        },
        {
          title: 'KV Science Exhibition Project Tracker',
          description: 'A light, database-driven utility app created to list, manage, and coordinate student-led science exhibits in Kendriya Vidyalaya schools.',
          tags: 'Python, SQLite, HTML5, CSS3',
          link: '',
          image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=60',
          source_link: ''
        }
      ];

      sampleProjects.forEach(p => {
        db.run('INSERT INTO projects (title, description, tags, link, image_url, source_link) VALUES (?, ?, ?, ?, ?, ?)',
          [p.title, p.description, p.tags, p.link, p.image_url, p.source_link], (err2) => {
            if (err2) console.error('Failed to seed sample project:', err2.message);
          });
      });
    }
  });

  // Seed Skills
  db.get('SELECT COUNT(*) as count FROM skills', [], (err, row) => {
    if (!err && row.count === 0) {
      const sampleSkills = [
        { name: 'HTML5 / CSS3', category: 'Frontend', level: 95 },
        { name: 'JavaScript (ES6+)', category: 'Frontend', level: 90 },
        { name: 'Node.js / Express', category: 'Backend', level: 85 },
        { name: 'SQLite / SQL', category: 'Backend', level: 80 },
        { name: 'Python Coding', category: 'Programming', level: 85 },
        { name: 'Git & Command Line', category: 'Tools', level: 80 },
        { name: 'Web Security Basics', category: 'Tools', level: 75 }
      ];

      sampleSkills.forEach(s => {
        db.run('INSERT INTO skills (name, category, level) VALUES (?, ?, ?)',
          [s.name, s.category, s.level], (err2) => {
            if (err2) console.error('Failed to seed sample skill:', err2.message);
          });
      });
    }
  });

  // Seed Updates
  db.get('SELECT COUNT(*) as count FROM updates', [], (err, row) => {
    if (!err && row.count === 0) {
      const sampleUpdates = [
        {
          date: 'June 2026',
          title: 'Built Secure Portfolio Web App',
          details: 'Designed and deployed this website featuring JWT authentication, database persistence, and rate-limiting.'
        },
        {
          date: 'May 2026',
          title: 'Enrolled in Class 10',
          details: 'Successfully completed Class 9 with excellent grades and entered Class 10 at PM Shri Kendriya Vidyalaya.'
        },
        {
          date: 'April 2026',
          title: 'Participated in KV Science Exhibition',
          details: 'Showcased a coding automation concept at the regional level, representing school science ideas.'
        }
      ];

      sampleUpdates.forEach(u => {
        db.run('INSERT INTO updates (date, title, details) VALUES (?, ?, ?)',
          [u.date, u.title, u.details], (err2) => {
            if (err2) console.error('Failed to seed sample update:', err2.message);
          });
      });
    }
  });

});

module.exports = db;
