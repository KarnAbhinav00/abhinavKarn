const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// General Rate Limiter (Public APIs: GET blog posts, projects, skills, timeline)
// 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Authentication Rate Limiter (POST /api/auth/login)
// 5 attempts per 15 minutes per IP to prevent brute-forcing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact and Comments Rate Limiter (POST /api/contact, POST /api/blogs/comments)
// 5 submissions per 15 minutes per IP to prevent spamming
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Spam alert: Too many form submissions. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom Helmet CSP Config
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline allowed for basic public scripts, but kept minimal
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "*", "data:", "blob:"], // Allow images from unsplash or other external hosts
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

module.exports = {
  generalLimiter,
  authLimiter,
  contactLimiter,
  securityHeaders
};
