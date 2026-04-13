const express = require("express");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== AUTH ==================
const SESSION_PATH = __dirname + "/auth";

let sock;

// ================== START BOT CONNECTION ==================
async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
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

        if (connection === "open") {
            console.log("✅ WhatsApp Connected Successfully!");
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;

            if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Logged out, re-pair required");
            } else {
                console.log("🔄 Reconnecting...");
                startSock();
            }
        }
    });
}

// start once
startSock();

// ================== HOME PAGE ==================
app.get("/", (req, res) => {
    res.send(`
    <html>
    <head>
        <title>WhatsApp Pair</title>
        <style>
            body {
                background: #0d0d0d;
                color: white;
                text-align: center;
                font-family: Arial;
                padding-top: 80px;
            }
            input {
                padding: 12px;
                width: 250px;
                border-radius: 10px;
                border: none;
            }
            button {
                padding: 12px 20px;
                margin-top: 10px;
                border-radius: 10px;
                border: none;
                background: green;
                color: white;
                cursor: pointer;
            }
            .box {
                margin-top: 20px;
                font-size: 18px;
                color: #00ff99;
            }
        </style>
    </head>
    <body>

        <h1>📱 WhatsApp Pairing System</h1>

        <input id="number" placeholder="Enter number 2557XXXXXXX" />
        <br>
        <button onclick="getCode()">GET CODE</button>

        <div class="box" id="result"></div>

        <script>
            async function getCode() {
                const number = document.getElementById("number").value;

                const res = await fetch("/pair?number=" + number);
                const data = await res.text();

                document.getElementById("result").innerText = data;
            }
        </script>

    </body>
    </html>
    `);
});

// ================== PAIR ROUTE ==================
app.get("/pair", async (req, res) => {
    try {
        const number = req.query.number;

        if (!number) {
            return res.send("❌ Please enter number (2557XXXXXXX)");
        }

        if (!sock) {
            return res.send("❌ Bot not ready, try again...");
        }

        const code = await sock.requestPairingCode(number);

        res.send("✅ Your Pairing Code: " + code);

    } catch (e) {
        console.log(e);
        res.send("❌ Error generating code");
    }
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🌐 Pair server running on http://localhost:" + PORT);
});
