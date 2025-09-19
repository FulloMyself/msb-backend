const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'verysecret_jwt_key';

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No authorization header' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
