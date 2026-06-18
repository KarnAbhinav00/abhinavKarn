const express = require('express');
const router = express.Router();
const db = require('./db');
const { authenticateJWT, requireAdmin } = require('./middleware/auth');
const { contactLimiter } = require('./middleware/security');

// Helper to create a URL slug from a title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

// ==========================================
// BLOG ENDPOINTS
// ==========================================

// GET: Fetch all blogs
router.get('/blogs', (req, res) => {
  db.all('SELECT id, title, slug, category, image_url, date, created_at FROM blogs ORDER BY date DESC, id DESC', [], (err, rows) => {
    if (err) {
      console.error('Fetch Blogs Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch blogs.' });
    }
    res.json(rows);
  });
});

// GET: Fetch single blog by slug
router.get('/blogs/:slug', (req, res) => {
  db.get('SELECT * FROM blogs WHERE slug = ?', [req.params.slug], (err, row) => {
    if (err) {
      console.error('Fetch Blog Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch blog.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    res.json(row);
  });
});

// POST: Create a new blog (Admin Only)
router.post('/blogs', authenticateJWT, requireAdmin, (req, res) => {
  const { title, content, category, image_url, date } = req.body;

  if (!title || !content || !category || !date) {
    return res.status(400).json({ error: 'Title, content, category, and date are required.' });
  }

  const slug = slugify(title);

  db.run(
    'INSERT INTO blogs (title, slug, content, category, image_url, date) VALUES (?, ?, ?, ?, ?, ?)',
    [title.trim(), slug, content, category.trim(), image_url ? image_url.trim() : null, date],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'A blog with this title already exists.' });
        }
        console.error('Create Blog Error:', err.message);
        return res.status(500).json({ error: 'Failed to create blog.' });
      }
      res.status(201).json({ id: this.lastID, slug, message: 'Blog created successfully.' });
    }
  );
});

// PUT: Update an existing blog (Admin Only)
router.put('/blogs/:id', authenticateJWT, requireAdmin, (req, res) => {
  const { title, content, category, image_url, date } = req.body;
  const blogId = req.params.id;

  if (!title || !content || !category || !date) {
    return res.status(400).json({ error: 'Title, content, category, and date are required.' });
  }

  const slug = slugify(title);

  db.run(
    'UPDATE blogs SET title = ?, slug = ?, content = ?, category = ?, image_url = ?, date = ? WHERE id = ?',
    [title.trim(), slug, content, category.trim(), image_url ? image_url.trim() : null, date, blogId],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Another blog with this title already exists.' });
        }
        console.error('Update Blog Error:', err.message);
        return res.status(500).json({ error: 'Failed to update blog.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Blog not found.' });
      }
      res.json({ message: 'Blog updated successfully.', slug });
    }
  );
});

// DELETE: Delete a blog (Admin Only)
router.delete('/blogs/:id', authenticateJWT, requireAdmin, (req, res) => {
  db.run('DELETE FROM blogs WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      console.error('Delete Blog Error:', err.message);
      return res.status(500).json({ error: 'Failed to delete blog.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    res.json({ message: 'Blog deleted successfully.' });
  });
});

// ==========================================
// PROJECT ENDPOINTS
// ==========================================

// GET: Fetch all projects
router.get('/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('Fetch Projects Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch projects.' });
    }
    res.json(rows);
  });
});

// POST: Create a new project (Admin Only)
router.post('/projects', authenticateJWT, requireAdmin, (req, res) => {
  const { title, description, tags, link, image_url, source_link } = req.body;

  if (!title || !description || !tags) {
    return res.status(400).json({ error: 'Title, description, and tags are required.' });
  }

  db.run(
    'INSERT INTO projects (title, description, tags, link, image_url, source_link) VALUES (?, ?, ?, ?, ?, ?)',
    [title.trim(), description.trim(), tags.trim(), link ? link.trim() : null, image_url ? image_url.trim() : null, source_link ? source_link.trim() : null],
    function (err) {
      if (err) {
        console.error('Create Project Error:', err.message);
        return res.status(500).json({ error: 'Failed to create project.' });
      }
      res.status(201).json({ id: this.lastID, message: 'Project created successfully.' });
    }
  );
});

// PUT: Update a project (Admin Only)
router.put('/projects/:id', authenticateJWT, requireAdmin, (req, res) => {
  const { title, description, tags, link, image_url, source_link } = req.body;
  const projectId = req.params.id;

  if (!title || !description || !tags) {
    return res.status(400).json({ error: 'Title, description, and tags are required.' });
  }

  db.run(
    'UPDATE projects SET title = ?, description = ?, tags = ?, link = ?, image_url = ?, source_link = ? WHERE id = ?',
    [title.trim(), description.trim(), tags.trim(), link ? link.trim() : null, image_url ? image_url.trim() : null, source_link ? source_link.trim() : null, projectId],
    function (err) {
      if (err) {
        console.error('Update Project Error:', err.message);
        return res.status(500).json({ error: 'Failed to update project.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      res.json({ message: 'Project updated successfully.' });
    }
  );
});

// DELETE: Delete a project (Admin Only)
router.delete('/projects/:id', authenticateJWT, requireAdmin, (req, res) => {
  db.run('DELETE FROM projects WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      console.error('Delete Project Error:', err.message);
      return res.status(500).json({ error: 'Failed to delete project.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json({ message: 'Project deleted successfully.' });
  });
});

// ==========================================
// SKILLS ENDPOINTS
// ==========================================

// GET: Fetch all skills
router.get('/skills', (req, res) => {
  db.all('SELECT * FROM skills ORDER BY category, level DESC', [], (err, rows) => {
    if (err) {
      console.error('Fetch Skills Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch skills.' });
    }
    res.json(rows);
  });
});

// POST: Create skill (Admin Only)
router.post('/skills', authenticateJWT, requireAdmin, (req, res) => {
  const { name, category, level } = req.body;
  const parsedLevel = parseInt(level, 10);

  if (!name || !category || isNaN(parsedLevel)) {
    return res.status(400).json({ error: 'Name, category, and numeric level are required.' });
  }

  db.run(
    'INSERT INTO skills (name, category, level) VALUES (?, ?, ?)',
    [name.trim(), category.trim(), parsedLevel],
    function (err) {
      if (err) {
        console.error('Create Skill Error:', err.message);
        return res.status(500).json({ error: 'Failed to create skill.' });
      }
      res.status(201).json({ id: this.lastID, message: 'Skill created successfully.' });
    }
  );
});

// PUT: Update skill (Admin Only)
router.put('/skills/:id', authenticateJWT, requireAdmin, (req, res) => {
  const { name, category, level } = req.body;
  const parsedLevel = parseInt(level, 10);
  const skillId = req.params.id;

  if (!name || !category || isNaN(parsedLevel)) {
    return res.status(400).json({ error: 'Name, category, and numeric level are required.' });
  }

  db.run(
    'UPDATE skills SET name = ?, category = ?, level = ? WHERE id = ?',
    [name.trim(), category.trim(), parsedLevel, skillId],
    function (err) {
      if (err) {
        console.error('Update Skill Error:', err.message);
        return res.status(500).json({ error: 'Failed to update skill.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Skill not found.' });
      }
      res.json({ message: 'Skill updated successfully.' });
    }
  );
});

// DELETE: Delete skill (Admin Only)
router.delete('/skills/:id', authenticateJWT, requireAdmin, (req, res) => {
  db.run('DELETE FROM skills WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      console.error('Delete Skill Error:', err.message);
      return res.status(500).json({ error: 'Failed to delete skill.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Skill not found.' });
    }
    res.json({ message: 'Skill deleted successfully.' });
  });
});

// ==========================================
// UPDATES ENDPOINTS
// ==========================================

// GET: Fetch all updates
router.get('/updates', (req, res) => {
  db.all('SELECT * FROM updates ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('Fetch Updates Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch updates.' });
    }
    res.json(rows);
  });
});

// POST: Create update (Admin Only)
router.post('/updates', authenticateJWT, requireAdmin, (req, res) => {
  const { date, title, details } = req.body;

  if (!date || !title || !details) {
    return res.status(400).json({ error: 'Date, title, and details are required.' });
  }

  db.run(
    'INSERT INTO updates (date, title, details) VALUES (?, ?, ?)',
    [date.trim(), title.trim(), details.trim()],
    function (err) {
      if (err) {
        console.error('Create Update Error:', err.message);
        return res.status(500).json({ error: 'Failed to create update.' });
      }
      res.status(201).json({ id: this.lastID, message: 'Update created successfully.' });
    }
  );
});

// PUT: Update update (Admin Only)
router.put('/updates/:id', authenticateJWT, requireAdmin, (req, res) => {
  const { date, title, details } = req.body;
  const updateId = req.params.id;

  if (!date || !title || !details) {
    return res.status(400).json({ error: 'Date, title, and details are required.' });
  }

  db.run(
    'UPDATE updates SET date = ?, title = ?, details = ? WHERE id = ?',
    [date.trim(), title.trim(), details.trim(), updateId],
    function (err) {
      if (err) {
        console.error('Update Update Error:', err.message);
        return res.status(500).json({ error: 'Failed to update update.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Update not found.' });
      }
      res.json({ message: 'Update updated successfully.' });
    }
  );
});

// DELETE: Delete update (Admin Only)
router.delete('/updates/:id', authenticateJWT, requireAdmin, (req, res) => {
  db.run('DELETE FROM updates WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      console.error('Delete Update Error:', err.message);
      return res.status(500).json({ error: 'Failed to delete update.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Update not found.' });
    }
    res.json({ message: 'Update deleted successfully.' });
  });
});

// ==========================================
// CONTACT / INQUIRY ENDPOINTS
// ==========================================

// POST: Submit a message (Public - Rate Limited)
router.post('/contact', contactLimiter, (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields (name, email, message) are required.' });
  }

  // Simple Email Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  db.run(
    'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
    [name.trim(), email.trim(), message.trim()],
    function (err) {
      if (err) {
        console.error('Submit Message Error:', err.message);
        return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
      }
      res.status(201).json({ success: true, message: 'Message sent successfully! Tyson will get back to you.' });
    }
  );
});

// GET: View all messages (Admin Only)
router.get('/messages', authenticateJWT, requireAdmin, (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Fetch Messages Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
    res.json(rows);
  });
});

// DELETE: Delete a message (Admin Only)
router.delete('/messages/:id', authenticateJWT, requireAdmin, (req, res) => {
  db.run('DELETE FROM messages WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      console.error('Delete Message Error:', err.message);
      return res.status(500).json({ error: 'Failed to delete message.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    res.json({ message: 'Message deleted successfully.' });
  });
});

module.exports = router;
