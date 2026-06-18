const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { authLimiter } = require('./middleware/security');

// POST: Log in admin/user
// Uses rate limiting to prevent brute force
router.post('/login', authLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Fetch user from DB
  db.get('SELECT * FROM users WHERE username = ?', [username.trim().toLowerCase()], (err, user) => {
    if (err) {
      console.error('Login DB Error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (!user) {
      // Avoid disclosing exact mismatch (security best practice)
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Verify Password
    bcrypt.compare(password, user.password_hash, (bcryptErr, match) => {
      if (bcryptErr) {
        console.error('Bcrypt Error:', bcryptErr.message);
        return res.status(500).json({ error: 'Internal server error.' });
      }

      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '2h' } // Token valid for 2 hours
      );

      // Save token in HttpOnly cookie
      res.cookie('session_token', token, {
        httpOnly: true, // Blocks XSS access
        secure: process.env.NODE_ENV === 'production', // true in prod (HTTPS)
        sameSite: 'strict', // Blocks CSRF
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
      });

      res.json({
        success: true,
        message: 'Successfully logged in.',
        user: {
          username: user.username,
          role: user.role
        }
      });
    });
  });
});

// POST: Log out user
router.post('/logout', (req, res) => {
  res.clearCookie('session_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET: Check authentication status
router.get('/status', (req, res) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      loggedIn: true,
      user: {
        username: verified.username,
        role: verified.role
      }
    });
  } catch (err) {
    res.clearCookie('session_token');
    res.json({ loggedIn: false });
  }
});

module.exports = router;
