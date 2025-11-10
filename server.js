const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());
app.use(cors());

// ==== Anti-spam (limita 20 req / 30s por IP) ====
const limiter = rateLimit({
    windowMs: 30 * 1000,
    max: 20
});
app.use(limiter);

// ==== DB em memória ====
let posts = [];
let lastPostFromIP = {};
let lastCommentFromIP = {};


// ===== Helpers =====
function sanitize(text) {
    return text
        .toString()
        .replace(/[<>&"'`]/g, (c) => ({
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            '"': "&quot;",
            "'": "&#39;",
            "`": "&#96;",
        }[c]));
}


// ==== CRIAR POST ====
app.post("/posts", (req, res) => {
    const ip = req.ip;
    const { title, content } = req.body;

    if (!title || !content)
        return res.status(400).json({ error: "Campos faltando" });

    const now = Date.now();
    if (lastPostFromIP[ip] && now - lastPostFromIP[ip] < 10000)
        return res.status(429).json({ error: "Espere 10s para publicar outro post" });

    lastPostFromIP[ip] = now;

    const post = {
        id: posts.length + 1,
        title: sanitize(title),
        content: sanitize(content),
        comments: [],
        createdAt: now
    };

    posts.push(post);
    return res.json(post);
});


// ==== LISTAR POSTS ====
app.get("/posts", (req, res) => {
    res.json(posts);
});


// ==== CRIAR COMENTÁRIO ====
app.post("/posts/:id/comments", (req, res) => {
    const ip = req.ip;
    const { text } = req.body;

    const post = posts.find(p => p.id == req.params.id);
    if (!post) return res.status(404).json({ error: "Post não existe" });

    if (!text) return res.status(400).json({ error: "Texto vazio" });

    const now = Date.now();
    if (lastCommentFromIP[ip] && now - lastCommentFromIP[ip] < 5000)
        return res.status(429).json({ error: "Espere 5s para comentar" });

    lastCommentFromIP[ip] = now;

    const comment = {
        id: post.comments.length + 1,
        text: sanitize(text),
        createdAt: now
    };

    post.comments.push(comment);
    return res.json(comment);
});


// ==== LIMPAR TUDO (opcional) ====
app.delete("/posts", (req, res) => {
    posts = [];
    return res.json({ msg: "Limpou tudo" });
});


// ==== Start Server ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server rodando na porta " + PORT));