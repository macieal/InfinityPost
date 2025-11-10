const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("assets"));

let posts = [];

function cleanup() {
  const now = Date.now();
  posts = posts.filter(p => now - p.time < 24 * 60 * 60 * 1000);
}
setInterval(cleanup, 60 * 60 * 1000);

app.get("/posts", (req, res) => {
  cleanup();
  res.json(posts);
});

app.post("/posts", (req, res) => {
  const { nick, topic, text } = req.body;

  if (!nick || !topic || !text) {
    return res.status(400).json({ error: "Faltando dados." });
  }

  posts.push({
    nick,
    topic,
    text,
    time: Date.now()
  });

  res.json({ ok: true });
});

// faz o index.html carregar na raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/assets/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server rodando na porta ${port}`));
