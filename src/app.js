const express = require("express");
const { getConfig } = require("./config");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");

function createApp() {
  getConfig();
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api", apiRoutes);
  return app;
}

module.exports = { createApp };