const express = require("express");
const basicAuth = require("basic-auth");

const app = express();

const MEMBERSTACK_API_KEY = "pk_3a419580cf6392bbd87d"; // Substitua pela sua chave de API do Memberstack
const PORT = process.env.PORT || 3000;

// Middleware para autenticação com Memberstack
const authenticate = async (req, res, next) => {
  const credentials = basicAuth(req);

  if (!credentials || !credentials.name || !credentials.pass) {
    res.set("WWW-Authenticate", "Basic realm='Podcast Premium'");
    return res.status(401).send("Autenticação necessária");
  }

  try {
    // Faz uma requisição para a API do Memberstack para buscar os membros
    const response = await fetch("https://api.memberstack.com/v1/members", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${MEMBERSTACK_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res
        .status(500)
        .send("Falha ao validar o usuário com a API do Memberstack");
    }

    const members = await response.json();

    // Verifica se o usuário está no Memberstack com as credenciais fornecidas
    const user = members.find(
      (member) =>
        member.email === credentials.name &&
        member.password === credentials.pass && // Troque `password` se o campo for diferente no Memberstack
        member.status === "active" // Verifica se o usuário está ativo
    );

    if (!user) {
      return res.status(401).send("Credenciais inválidas ou usuário não ativo");
    }

    req.user = user; // Armazena o usuário autenticado na requisição
    next();
  } catch (error) {
    console.error("Erro ao autenticar o usuário:", error);
    res.status(500).send("Erro interno no servidor");
  }
};

// Endpoint para o RSS Feed protegido
app.get("/rss-premium", authenticate, (req, res) => {
  res.set("Content-Type", "application/rss+xml");
  res.send(`
    <rss version="2.0">
      <channel>
        <title>Podcast Premium</title>
        <link>https://www.warbox.tv</link>
        <description>Feed protegido para assinantes premium.</description>
        <language>pt-BR</language>
        <item>
          <title>Episódio 1</title>
          <description>Primeiro episódio premium.</description>
          <pubDate>${new Date().toUTCString()}</pubDate>
          <enclosure url="https://www.example.com/audio/ep1.mp3" type="audio/mpeg" />
          <guid>1</guid>
        </item>
        <item>
          <title>Episódio 2</title>
          <description>Segundo episódio premium.</description>
          <pubDate>${new Date().toUTCString()}</pubDate>
          <enclosure url="https://www.example.com/audio/ep2.mp3" type="audio/mpeg" />
          <guid>2</guid>
        </item>
      </channel>
    </rss>
  `);
});

// Inicia o servidor
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
