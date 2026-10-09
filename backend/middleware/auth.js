const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    if (decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: 'Token is no longer valid; please log in again' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is not active' });
    }
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      return res.status(401).json({ success: false, message: 'Token is no longer valid; please log in again' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Authentication token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    return next(error);
  }
};

module.exports = { protect };
