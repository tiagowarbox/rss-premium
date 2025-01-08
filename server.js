const express = require("express");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// Banco de dados SQLite
const db = new sqlite3.Database(":memory:");

// Cria a tabela para armazenar tokens
db.serialize(() => {
  db.run(`
    CREATE TABLE tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      token TEXT UNIQUE NOT NULL,
      valid_until DATETIME DEFAULT (DATETIME('now', '+30 days'))
    )
  `);
});

// Gera um token único
const generateToken = () => crypto.randomBytes(16).toString("hex");

// Endpoint para validar e servir o RSS
app.get("/rss-premium", (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send("Token ausente");
  }

  // Valida o token no banco de dados
  db.get(
    "SELECT * FROM tokens WHERE token = ? AND valid_until > DATETIME('now')",
    [token],
    (err, row) => {
      if (err) return res.status(500).send("Erro no servidor");
      if (!row) return res.status(401).send("Token inválido ou expirado");

      // Retorna o RSS Feed
      res.set("Content-Type", "application/rss+xml");
      res.send(`
        <rss version="2.0">
          <channel>
            <title>Cagando e Andando Podcast Premium</title>
            <link>https://www.warbox.tv</link>
            <description>Conteúdo exclusivo para assinantes premium.</description>
            <language>pt-BR</language>
            <item>
              <title>Cagando e Andando Premium 01</title>
              <description>Primeiro episódio exclusivo.</description>
              <pubDate>Wed, 08 Jan 2025 10:00:00 GMT</pubDate>
              <enclosure url="https://warbox.b-cdn.net/premium/cea01.mp3" type="audio/mpeg" />
              <link>https://www.warbox.tv/premium/episodio-01</link>
            </item>
          </channel>
        </rss>
      `);
    }
  );
});

// Endpoint para gerar tokens
app.post("/generate-token", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).send("ID do usuário ausente");
  }

  const token = generateToken();

  db.run(
    "INSERT INTO tokens (user_id, token) VALUES (?, ?)",
    [user_id, token],
    (err) => {
      if (err) return res.status(500).send("Erro ao gerar token");
      res.send({ token });
    }
  );
});

// Inicia o servidor
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
