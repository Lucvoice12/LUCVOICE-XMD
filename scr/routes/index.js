const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
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
                color: #00ff99;
            }
        </style>
    </head>
    <body>

        <h1>📱 WhatsApp Pairing</h1>

        <input id="number" placeholder="2557XXXXXXX" />
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

module.exports = router;
