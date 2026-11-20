const { getConfig } = require("./config");
const { createApp } = require("./app");

const cfg = getConfig();
const app = createApp();

app.listen(cfg.port, () => {
  console.log(`DineDesk API listening on port ${cfg.port}`);
});