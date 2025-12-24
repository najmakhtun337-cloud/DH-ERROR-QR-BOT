import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import express from "express";
import QRCode from "qrcode";

const app = express();
app.use(express.static("public"));

let qrCodeData = null;
let sock;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["DH ERROR", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrCodeData = await QRCode.toDataURL(qr);
      console.log("📷 QR GENERATED");
    }

    if (connection === "open") {
      qrCodeData = null;
      console.log("✅ DH ERROR BOT CONNECTED");
    }

    if (connection === "close") {
      if (
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const text = m.message.conversation || "";
    const from = m.key.remoteJid;

    if (text === ".menu") {
      await sock.sendMessage(from, {
        text:
`🤖 *DH ERROR MINI BOT*

.menu
.ping
.owner
.group
.channel`
      });
    }

    if (text === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong!" });
    }

    if (text === ".owner") {
      await sock.sendMessage(from, { text: "👑 Owner: DH ERROR" });
    }

    if (text === ".group") {
      await sock.sendMessage(from, {
        text: "🔗 Group:\nhttps://chat.whatsapp.com/Hw0JIQgGHco8BL6699CDN"
      });
    }

    if (text === ".channel") {
      await sock.sendMessage(from, {
        text: "📢 Channel:\nhttps://whatsapp.com/channel/0029VbBQQ6v4Y9lenR8ROD3O"
      });
    }
  });
}

app.get("/qr", (req, res) => {
  if (qrCodeData) {
    res.send(`<img src="${qrCodeData}" />`);
  } else {
    res.send("✅ Bot already connected");
  }
});

app.listen(3000, () => {
  console.log("🌐 Server running");
  startBot();
});
