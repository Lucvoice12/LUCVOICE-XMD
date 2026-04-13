const express = require("express");
const path = require("path");
const pino = require("pino");

const {
    default: makeWASocket,
    useMultiMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= PUBLIC FILES =================
app.use(express.static(path.join(__dirname, "public")));

// ================= SESSION PATH =================
const SESSION_PATH = __dirname + "/auth";

let sock;

// ================= START WHATSAPP =================
async function startSocket() {
    const { state, saveCreds } = await useMultiMultiFileAuthState(SESSION_PATH);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "connecting") {
            console.log("🔄 Connecting to WhatsApp...");
        }

        if (connection === "open") {
            console.log("✅ WhatsApp Connected Successfully!");
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;

            if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Logged out - re-pair required");
            } else {
                console.log("🔄 Reconnecting...");
                startSocket();
            }
        }
    });
}

// start bot socket
startSocket();

// ================= PAIR API =================
app.get("/pair", async (req, res) => {
    try {
        const number = req.query.number;

        if (!number) {
            return res.send("❌ Weka namba mfano 2557XXXXXXX");
        }

        if (!sock) {
            return res.send("❌ Bot bado haija connect");
        }

        const code = await sock.requestPairingCode(number);

        res.send(`
            <h2>✅ Pairing Code</h2>
            <h1 style="color:green">${code}</h1>
        `);

    } catch (e) {
        console.log(e);
        res.send("❌ Error generating code");
    }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🌐 Server running on http://localhost:" + PORT);
});
