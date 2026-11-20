const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getConfig } = require("../config");
const { users } = require("../store");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const cfg = getConfig();
  const token = jwt.sign(
    { sub: user.id, role: user.role, branchId: user.branchId },
    cfg.jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: cfg.jwtExpiresIn,
      issuer: cfg.jwtIssuer,
      audience: cfg.jwtAudience
    }
  );

  return res.status(200).json({ token });
});

module.exports = router;