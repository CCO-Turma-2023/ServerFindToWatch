const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const code = Number(req.query.code);

  try {
    const filmesComSessoes = [];

    const processPage = async (url, verificarSessoes = true) => {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);
      let encontrouFilmes = false;

      $("ul li.mdl").each((_, li) => {
        const $li = $(li);
        let title = $li.find("div.meta-body-item span.dark-grey").text().trim();
        if (!title) {
          title = $li.find("h2").text().trim();
        }

        let overview = $li.find("div.content-txt").text().trim();

        if (verificarSessoes) {
          const sessoesText = $li.find("a.button").text().trim();
          if (/\(\d+\)/.test(sessoesText) && title !== "") {
            filmesComSessoes.push({title: title, overview: overview});
            encontrouFilmes = true;
          }
        } else {
          if (title !== "") {
            filmesComSessoes.push({title: title, overview: overview});
            encontrouFilmes = true;
          }
        }
      });

      return encontrouFilmes;
    };

    if (code === 0) {
      await processPage("https://www.adorocinema.com/filmes/em-cartaz/estreias/", true);
    } else if (code === 1) {
        for(let page = 1; page<=4; page++){
            const url = `https://www.adorocinema.com/filmes/mais-esperados/?page=${page}`
            await processPage(url, false);
        }
    } else if (code === 2) {
      let page = 1;
      let encontrouFilmes = true;

      while (encontrouFilmes) {
        const url = `https://www.adorocinema.com/filmes/numero-cinemas/?page=${page}`;
        encontrouFilmes = await processPage(url, true);
        page++;
      }
    }

    if (filmesComSessoes.length === 0) {
      return res.status(500).json({ erro: "Nenhum filme encontrado ou erro no scraping." });
    }

    res.json(filmesComSessoes);
  } catch (err) {
    console.error("Erro ao buscar os filmes:", err.message);
    res.status(500).json({ erro: "Erro ao buscar os filmes" });
  }
};
