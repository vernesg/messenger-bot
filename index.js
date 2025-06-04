require("dotenv").config();

const fs = require("fs");
const axios = require("axios");
const ws3fca = require("ws3-fca");
const schedule = require("node-schedule");

const COOKIE = process.env.COOKIE;
const ADMIN_ID = process.env.ADMIN_ID;
const THREAD_ID = process.env.THREAD_ID;

const LOG_FILE = "log.txt";

if (!COOKIE || !ADMIN_ID || !THREAD_ID) {
  console.error("❌ Please set COOKIE, ADMIN_ID, and THREAD_ID in your .env file");
  process.exit(1);
}

ws3fca.login(COOKIE, (err, api) => {
  if (err) {
    console.error("❌ Login failed:", err);
    return;
  }
  console.log("🤖 Bot is online!");

  schedule.scheduleJob("0 * * * *", () => {
    api.sendMessage("⏰ This is a scheduled message!", THREAD_ID);
    console.log("⏰ Scheduled message sent");
  });

  api.listenMqtt((err, event) => {
    if (err) return console.error("Listen error:", err);

    if (event.type !== "message" || !event.body) return;

    const sender = event.senderID;
    const message = event.body.trim();
    const thread = event.threadID;

    console.log(`📩 ${sender}: ${message}`);
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} - ${sender}: ${message}\n`);

    if (message.toLowerCase().includes("hello")) {
      api.sendMessage("Hi there! 👋", thread);
    } else if (message.toLowerCase().includes("help")) {
      api.sendMessage("Type !ping to test me 🛠️", thread);
    } else if (message.toLowerCase().includes("cat")) {
      const imageUrl = "https://placekitten.com/400/400";
      const filePath = "cat.jpg";

      axios({ url: imageUrl, responseType: "stream" })
        .then(response => {
          response.data.pipe(fs.createWriteStream(filePath)).on("finish", () => {
            api.sendMessage({ attachment: fs.createReadStream(filePath) }, thread);
          });
        })
        .catch(() => {
          api.sendMessage("Sorry, failed to get the cat image 🐱", thread);
        });
    }

    if (message.startsWith("!")) {
      if (sender !== ADMIN_ID) {
        api.sendMessage("⛔ Only the bot admin can use this command.", thread);
        return;
      }

      const command = message.slice(1).toLowerCase();

      switch (command) {
        case "ping":
          api.sendMessage("pong 🏓", thread);
          break;

        case "time":
          api.sendMessage("🕒 " + new Date().toLocaleString(), thread);
          break;

        case "id":
          api.sendMessage(`Your ID: ${sender}`, thread);
          break;

        default:
          api.sendMessage("❓ Unknown command. Try !ping, !time, or !id", thread);
      }
    }
  });
});
