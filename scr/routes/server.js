const express = require("express");
const app = express();

// ROUTES
const homeRoute = require("./routes/index");
const { router: pairRoute, setSock } = require("./routes/pair");
const statusRoute = require("./routes/status");

// USE ROUTES
app.use("/", homeRoute);
app.use("/pair", pairRoute);
app.use("/status", statusRoute);

// ================== BOT CONNECTION ==================
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const SESSION_PATH = __dirname + "/auth";

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (u) => {
        if (u.connection === "open") {
            console.log("✅ WhatsApp Connected");
        }
    });

    // connect socket to route
    setSock(sock);
}

startSock();

// START SERVER
app.listen(3000, () => {
    console.log("🌐 Server running on http://localhost:3000");
});
