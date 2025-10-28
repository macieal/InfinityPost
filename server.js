const fs = require("fs");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // serve index.html e arquivos

const DB_FILE = "data.json";

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return { posts: [], usedNicks: {} };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/posts", (req, res) => {
  const db = loadDB();
  res.json(db.posts);
});

app.post("/api/validate-nick", (req, res) => {
  const { nick, ip } = req.body;
  const db = loadDB();
  if (!nick || !ip) return res.json({ allowed: false });
  if (db.usedNicks[nick] && db.usedNicks[nick] !== ip)
    return res.json({ allowed: false });
  res.json({ allowed: true });
});

app.post("/api/posts", (req, res) => {
  const { nick, topic, content, ip } = req.body;
  const db = loadDB();
  if (db.usedNicks[nick] && db.usedNicks[nick] !== ip)
    return res.status(400).json({ error: "Nick já usado em outro IP." });

  const post = {
    id: "p" + Math.random().toString(36).slice(2, 9),
    nick,
    topic,
    content,
    ip,
    createdAt: Date.now(),
    comments: [],
  };
  db.posts.unshift(post);
  db.usedNicks[nick] = ip;
  saveDB(db);
  res.json({ ok: true });
});

app.post("/api/comments", (req, res) => {
  const { postId, parentId, nick, content, ip } = req.body;
  const db = loadDB();
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  const comment = {
    id: "c" + Math.random().toString(36).slice(2, 9),
    parentId: parentId || null,
    nick,
    content,
    ip,
    createdAt: Date.now(),
  };
  post.comments.push(comment);
  db.usedNicks[nick] = ip;
  saveDB(db);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor InfinityPost rodando na porta", PORT));