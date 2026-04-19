
const io = require("socket.io-client");

// Use Port 4000 (Backend)
const URL = "http://localhost:4000";
const ORG_ID = process.argv[2];

if (!ORG_ID) {
    console.error("❌ Usage: node verify-socket.js <ORG_ID>");
    console.error("Please find your Org ID in the logs or URL.");
    process.exit(1);
}

console.log(`🔌 Connecting to ${URL}...`);
const socket = io(URL);

socket.on("connect", () => {
    console.log(`✅ Connected! Socket ID: ${socket.id}`);
    console.log(`🏠 Joining Room: ${ORG_ID}`);
    socket.emit("join_room", ORG_ID);
});

socket.on("brain:progress", (data) => {
    console.log("\n🔥 [EVENT] brain:progress RECEIVED:");
    console.log(JSON.stringify(data, null, 2));
    console.log("----------------------------------------");
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected");
});

console.log("👀 Listening for events. Run a crawl now!");
