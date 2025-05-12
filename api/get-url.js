const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const {code} = req.query;

    try {
      const response = await axios.get(`https://www.themoviedb.org/tv/${code}/watch?locale=BR`);
      const html = response.data;
      const $ = cheerio.load(html);

      const urls = [];

      $("ul.providers li").each((i, li) => {
        const link = $(li).find("a").attr("href")
        const title = $(li).find("a").attr("title")

        if(link && title){
            urls.push({link, title})
        }
      });

      res.status(200).json(urls);
    } catch (err) {
      console.error("Erro ao carregar cidades:", err);
      res.status(500).json({ erro: "Erro ao carregar cidades" });
    }
}
