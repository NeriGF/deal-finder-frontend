const fs = require("fs");
const path = require("path");

const USAGE_FILE = path.join(__dirname, "usage-log.json");

function readUsageLog() {
  try {
    return JSON.parse(fs.readFileSync(USAGE_FILE, "utf-8"));
  } catch (e) {
    return {}; // start fresh
  }
}

function writeUsageLog(log) {
  fs.writeFileSync(USAGE_FILE, JSON.stringify(log, null, 2));
}

function getMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

module.exports = async (req, res) => {
  const { userKey } = req.body;
  if (!userKey || !userKey.startsWith("cus_")) {
    return res.status(400).json({ error: "Missing or invalid userKey" });
  }

  const log = readUsageLog();
  const month = getMonthKey();
  log[month] = log[month] || {};
  log[month][userKey] = (log[month][userKey] || 0) + 1;
  writeUsageLog(log);

  res.json({ success: true });
};
