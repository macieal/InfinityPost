const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;
const assets = path.join(__dirname, "assets");

app.use(express.static(assets));

app.get("/", (req, res) => {
  res.sendFile(path.join(assets, "index.html"));
});

app.listen(PORT, () => {
  console.log("InfinityPost rodando na porta " + PORT);
});
