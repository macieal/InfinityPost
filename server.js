// server.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "."))); // serve index.html + assets

const DB_FILE = path.join(__dirname, "data.json");

// Load DB helper
function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    return { posts: [], usedNicks: {} };
  }
}

// Save DB helper
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/** Utilities to get client IP:
 * Render usually sets X-Forwarded-For; fallback to req.ip
 */
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.ip || "unknown";
}

// --- Routes ---

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// get posts (includes comments)
app.get("/api/posts", (req, res) => {
  const db = loadDB();
  res.json(db.posts);
});

// validate nick for ip
app.post("/api/validate-nick", (req, res) => {
  const { nick } = req.body;
  const ip = req.body.ip || getClientIp(req);
  if (!nick || !ip) return res.json({ allowed: false });

  const db = loadDB();
  if (db.usedNicks[nick] && db.usedNicks[nick] !== ip) {
    return res.json({ allowed: false });
  }
  return res.json({ allowed: true });
});

// create post
app.post("/api/posts", (req, res) => {
  const { nick, topic, content } = req.body;
  const ip = req.body.ip || getClientIp(req);

  if (!nick || !topic || !content || !ip) {
    return res.status(400).json({ error: "Dados faltando." });
  }

  const db = loadDB();

  if (db.usedNicks[nick] && db.usedNicks[nick] !== ip) {
    return res.status(400).json({ error: "Nick já usado em outro IP." });
  }

  const newPost = {
    id: "p" + Math.random().toString(36).slice(2, 9),
    nick,
    topic,
    content,
    ip,
    createdAt: Date.now(),
    comments: []
  };

  db.posts.unshift(newPost);
  db.usedNicks[nick] = ip;
  saveDB(db);

  res.json({ ok: true, post: newPost });
});

// create comment
app.post("/api/comments", (req, res) => {
  const { postId, parentId, nick, content } = req.body;
  const ip = req.body.ip || getClientIp(req);

  if (!postId || !nick || !content || !ip) {
    return res.status(400).json({ error: "Dados faltando." });
  }

  const db = loadDB();
  if (db.usedNicks[nick] && db.usedNicks[nick] !== ip) {
    return res.status(400).json({ error: "Nick já usado em outro IP." });
  }

  const post = db.posts.find((p) => p.id === postId);
  if (!post) return res.status(404).json({ error: "Post não encontrado." });

  const newComment = {
    id: "c" + Math.random().toString(36).slice(2, 9),
    parentId: parentId || null,
    nick,
    content,
    ip,
    createdAt: Date.now()
  };

  post.comments.push(newComment);
  db.usedNicks[nick] = ip;
  saveDB(db);

  res.json({ ok: true, comment: newComment });
});

// serve index.html on root (already served by static, but ensure fallback)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("InfinityPost rodando na porta", PORT));
