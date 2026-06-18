const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const authRouter = require('./auth');
const apiRouter = require('./api');
const { securityHeaders, generalLimiter } = require('./middleware/security');
const csurf = require('csurf');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Cookies Parser (must be before csurf)
app.use(cookieParser());

// Apply Helmet Security Headers
app.use(securityHeaders);

// HTTPS Enforcement in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// CSRF protection using csurf with secure cookie settings
app.use(csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  }
}));

// Expose CSRF Token in a non-HttpOnly cookie for front-end access
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  next();
});

// Body Parsers (Request payloads limit capped at 1mb to prevent payload flooding)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply General Rate Limiter to all API endpoints
app.use('/api', generalLimiter);

// Serve Frontend Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routers
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// Specific page fallbacks (Routing helpers so URLs look clean)
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Capture all other unmatched pages and route them to home index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling Middleware (Layer 3 Security - Prevents Stack Leaks)
app.use((err, req, res, next) => {
  // Capture CSRF validation failures specifically
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Security validation failed: Invalid or expired CSRF token. Please refresh the page and try again.'
    });
  }

  console.error('SERVER_ERROR_LOG:', err);

  // Return generic error message without stack trace disclosures
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'An unexpected database or server error occurred. Please try again later.' : err.message
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your web browser`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    db.close((dbErr) => {
      if (dbErr) {
        console.error('Error closing SQLite DB:', dbErr.message);
      } else {
        console.log('SQLite database connection closed.');
      }
      process.exit(0);
    });
  });
});
