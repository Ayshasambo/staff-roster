const crypto = require('crypto');
const Staff = require('../models/staff');

const SECRET_KEY = process.env.JWT_SECRET || 'staff-roster-secure-token-secret-2026';

/**
 * Generate a signed base64url HMAC token with expiration (7 days)
 */
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode an HMAC token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware: Verify Bearer Token & Attach Authenticated User
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.staffId) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    const user = await Staff.findById(decoded.staffId);
    if (!user) {
      return res.status(401).json({ error: 'Staff account not found.' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Staff account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Middleware: Enforce Administrator Role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges required to perform this action.'
    });
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  requireAdmin
};
