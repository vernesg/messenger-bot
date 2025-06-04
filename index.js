const fs = require("fs");
const login = require("ws3-fca");
const schedule = require("node-schedule");
require("dotenv").config();

const COOKIE = process.env.COOKIE;
const ADMIN_ID = process.env.ADMIN_ID;
let THREAD_ID = process.env.THREAD_ID;

// Load stored thread ID from file (if present)
if (fs.existsSync("thread.txt")) {
  THREAD_ID = fs.readFileSync("thread.txt", "utf-8").trim();
}

login({ userAgent: "Mozilla/5.0", forceLogin: true, listenEvents: true, cookie: COOKIE }, (err, api) => {
  if (err) return console.error("❌ Login failed:", err);

  console.log("✅ Logged in as bot.");
  
  api.setOptions({ listenEvents: true });

  // Listen for incoming messages to grab thread ID
  api.listenMqtt((err, event) => {
    if (err) return console.error(err);
    
    if (!THREAD_ID) {
      console.log("🔥 First thread ID detected:", event.threadID);
      THREAD_ID = event.threadID;

      // Save it to file
      fs.writeFileSync("thread.txt", THREAD_ID);

      // Optional: Send confirmation
      api.sendMessage("✅ Thread ID saved and bot is now fully active.", THREAD_ID);
    }

    // You can add command handling here if needed
    if (event.body?.toLowerCase() === "ping") {
      api.sendMessage("🏓 Pong!", event.threadID);
    }
  });

  // Schedule a message every hour using saved thread ID
  if (THREAD_ID) {
    schedule.scheduleJob("0 * * * *", () => {
      api.sendMessage("⏰ Hourly update from your bot!", THREAD_ID);
      console.log("📤 Scheduled message sent.");
    });
  }
});
