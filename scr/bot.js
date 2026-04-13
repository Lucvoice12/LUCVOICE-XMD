const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

// CONFIG
const PREFIX = ".";
const SESSION_PATH = __dirname + "/auth";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // tunatumia pairing
        auth: state
    });

    // Save session
    sock.ev.on("creds.update", saveCreds);

    // Connection
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "connecting") {
            console.log("🔄 Connecting...");
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED SUCCESSFULLY!");
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;

            if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Session expired, pair again!");
            } else {
                console.log("🔄 Reconnecting...");
                startBot();
            }
        }
    });

    // Messages
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const type = Object.keys(msg.message)[0];

        let text = "";

        if (type === "conversation") {
            text = msg.message.conversation;
        } else if (type === "extendedTextMessage") {
            text = msg.message.extendedTextMessage.text;
        }

        if (!text) return;

        console.log(`📩 Message: ${text}`);

        // Commands
        if (text.startsWith(PREFIX)) {
            const args = text.slice(1).trim().split(" ");
            const cmd = args.shift().toLowerCase();

            // ================= COMMANDS =================

            // PING
            if (cmd === "ping") {
                await sock.sendMessage(from, { text: "🏓 Pong!" }, { quoted: msg });
            }

            // MENU
            else if (cmd === "menu") {
                let menu = `
╭━━━〔 🤖 BOT MENU 〕━━━╮
┃
┃ 🔹 .ping
┃ 🔹 .menu
┃ 🔹 .owner
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
`;
                await sock.sendMessage(from, { text: menu }, { quoted: msg });
            }

            // OWNER
            else if (cmd === "owner") {
                await sock.sendMessage(from, {
                    text: "👑 Owner: Luka IT\n📞 WhatsApp: +255768619068"
                }, { quoted: msg });
            }
        }
    });
}

startBot();
