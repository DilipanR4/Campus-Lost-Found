const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_lost_found_jwt_secret_key_2026';

function getToken(req) {
  if (req.cookies && (req.cookies.token || req.cookies.session)) {
    return req.cookies.token || req.cookies.session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function authenticate(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, name, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
}

// Optional auth for routes that work for both guests and logged-in users
async function optionalAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions.' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
