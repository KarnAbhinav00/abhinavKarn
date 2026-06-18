const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token from HttpOnly cookie
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.clearCookie('session_token');
    return res.status(403).json({ error: 'Session expired or invalid. Please log in again.' });
  }
};

// Middleware to enforce Admin role check
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Login required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  next();
};

module.exports = {
  authenticateJWT,
  requireAdmin
};
