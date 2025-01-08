const express = require("express");
const basicAuth = require("basic-auth");
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware para autenticação básica
const authenticate = (req, res, next) => {
  const credentials = basicAuth(req);

  if (!credentials || credentials.name !== "user" || credentials.pass !== "password123") {
    res.set("WWW-Authenticate", "Basic realm='Podcast Premium'");
    return res.status(401).send("Autenticação necessária");
  }

  next();
};

// Endpoint protegido
app.get("/rss-premium", authenticate, (req, res) => {
  res.set("Content-Type", "application/rss+xml");
  res.send(`
    <rss version="2.0">
      <channel>
        <title>Podcast Premium</title>
        <link>https://www.example.com</link>
        <description>Feed protegido por autenticação.</description>
        <language>en-us</language>
        <item>
          <title>Episódio 1</title>
          <description>Primeiro episódio premium.</description>
          <enclosure url="https://www.example.com/audio/ep1.mp3" type="audio/mpeg" />
          <guid>1</guid>
          <pubDate>${new Date().toUTCString()}</pubDate>
        </item>
      </channel>
    </rss>
  `);
});

// Inicia o servidor
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
