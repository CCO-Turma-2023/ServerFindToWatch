const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { search } = req.query;

  try {
    const response = await axios.get(`https://www.adorocinema.com/filmes/filme-${search}/programacao/`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const regioes = [];

    $("ul li.mdl-more-li").each((_, li) => {
      const $li = $(li);

      const a = $li.find("a.mdl-more-item").filter((i, el) => !$(el).hasClass("js-set-localization"));
      const span = $li.find("span.mdl-more-item.disabled");

      if (a.length > 0) {
        const el = a.first();
        regioes.push({
          nome: el.attr("title")?.trim() || el.text().trim(),
          url: el.attr("href") || null,
          ativo: true
        });
      } else if (span.length > 0) {
        const el = span.first();
        regioes.push({
          nome: el.attr("title")?.trim() || el.text().trim(),
          url: el.attr("href") || null,
          ativo: false
        });
      }
    });

    const resultado = regioes.map(({ nome, url, ativo }) => {
      const match = url?.match(/cgeocode=(\d+)/);
      return {
        nome,
        geocode: match ? match[1] : null,
        ativo
      };
    });

    res.send(resultado);
  } catch (err) {
    console.error("Erro ao buscar as regiões:", err.message);
    res.status(500).json({ erro: "Erro ao buscar as regiões" });
  }
};
