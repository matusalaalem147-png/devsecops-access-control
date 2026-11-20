function getConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || typeof jwtSecret !== "string" || jwtSecret.trim().length === 0) {
    throw new Error("Missing required configuration: JWT_SECRET");
  }
  if (jwtSecret.length < 32) {
    throw new Error("Invalid configuration: JWT_SECRET must be at least 32 characters");
  }

  return {
    port: Number(process.env.PORT) || 3000,
    jwtSecret,
    jwtIssuer: process.env.JWT_ISSUER || "dinedesk-api",
    jwtAudience: process.env.JWT_AUDIENCE || "dinedesk-client",
    jwtExpiresIn: "15m"
  };
}

module.exports = { getConfig };
