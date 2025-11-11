const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON parsing
app.use(express.json());

// Serve static assets (pasta assets)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'assets'))); // serve also at root paths

// ensure posts.json exists
const postsPath = path.join(__dirname, 'posts.json');
if (!fs.existsSync(postsPath)) fs.writeFileSync(postsPath, '[]', 'utf8');

// API: listar posts
app.get('/api/posts', (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8') || '[]');
  res.json(posts);
});

// API: criar post
app.post('/api/posts', (req, res) => {
  const { text, nick, topic } = req.body;
  if (!text && (!nick || !topic)) return res.status(400).json({ error: 'Dados incompletos' });

  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8') || '[]');
  posts.unshift({
    nick: nick || 'anon',
    topic: topic || 'geral',
    text: text || '',
    comments: [],
    created: Date.now()
  });
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2), 'utf8');
  res.json({ ok: true });
});

// Serve index.html na raiz (rota /)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'assets', 'index.html'));
});

// Catch-all (para casos de SPA)
app.get('*', (req, res) => {
  // se for API, deixa seguir
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'assets', 'index.html'));
});

app.listen(PORT, () => console.log('Server rodando na porta', PORT));