// backend/middleware/roleAuth.js

/**
 * roleAuth("admin") → only admins can access
 * roleAuth("user") → only normal users can access
 * roleAuth(["admin", "user"]) → allow multiple roles
 */
module.exports = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "User role not found in token" });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient role" });
    }

    next();
  };
};
