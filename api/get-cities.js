const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const { search, geocode } = req.query;

    try {
      const response = await axios.get(`https://www.adorocinema.com/filmes/filme-${search}/programacao/?cgeocode=${geocode}`);
      const html = response.data;
      const $ = cheerio.load(html);

      const dataLocalizations = [];

      $("ul.mdl-more li.mdl-more-li a.mdl-more-item.js-set-localization").each((i, el) => {
        const dataLoc = $(el).attr("data-localization");
        if (dataLoc) {
          dataLocalizations.push(JSON.parse(dataLoc));
        }
      });

      res.status(200).json(dataLocalizations);
    } catch (err) {
      console.error("Erro ao carregar cidades:", err);
      res.status(500).json({ erro: "Erro ao carregar cidades" });
    }
}
