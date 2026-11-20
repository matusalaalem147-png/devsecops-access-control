const jwt = require("jsonwebtoken");
const { getConfig } = require("../config");
const { users } = require("../store");
const { hasPermission } = require("../permissions");

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = parts[1];
    const cfg = getConfig();
    const payload = jwt.verify(token, cfg.jwtSecret, {
      algorithms: ["HS256"],
      issuer: cfg.jwtIssuer,
      audience: cfg.jwtAudience
    });

    const userRecord = users.find((u) => Number(u.id) === Number(payload.sub));
    if (!userRecord) {
      return res.status(401).json({ error: "Invalid token subject" });
    }

    req.user = {
      id: userRecord.id,
      role: userRecord.role,
      branchId: userRecord.branchId
    };
    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  requirePermission
};