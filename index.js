const fs = require("fs");
const login = require("ws3-fca");
const schedule = require("node-schedule");
require("dotenv").config();

const COOKIE = process.env.COOKIE;
const ADMIN_ID = process.env.ADMIN_ID;
let THREAD_ID = process.env.THREAD_ID;

// Load saved thread ID if available
if (fs.existsSync("thread.txt")) {
  THREAD_ID = fs.readFileSync("thread.txt", "utf-8").trim();
}

login({ userAgent: "Mozilla/5.0", forceLogin: true, listenEvents: true, cookie: COOKIE }, (err, api) => {
  if (err) return console.error("❌ Login failed:", err);

  console.log("✅ Logged in successfully.");

  api.setOptions({ listenEvents: true });

  api.listenMqtt((err, event) => {
    if (err) return console.error(err);

    // Save thread ID if not yet known
    if (!THREAD_ID && event.threadID) {
      THREAD_ID = event.threadID;
      fs.writeFileSync("thread.txt", THREAD_ID);
      api.sendMessage("✅ Thread ID saved. Bot is now active.", THREAD_ID);
      console.log("🔥 First thread ID detected and saved:", THREAD_ID);
    }

    // Command handling (optional)
    if (event.body?.toLowerCase() === "ping") {
      api.sendMessage("🏓 Pong!", event.threadID);
    }
  });

  // Scheduled message every hour
  if (THREAD_ID) {
    schedule.scheduleJob("0 * * * *", () => {
      api.sendMessage("⏰ Hourly check-in from your bot!", THREAD_ID);
      console.log("📤 Sent scheduled message to:", THREAD_ID);
    });
  }
});
