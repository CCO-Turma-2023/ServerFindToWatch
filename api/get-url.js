const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    let {code} = req.query;

    const flag = code[code.length - 1]

    code = code.slice(0,-1)

    let url

    if(flag === '0' || flag === "0"){
      url = `https://www.themoviedb.org/tv/${code}/watch?locale=BR`
    }else{
      url = `https://www.themoviedb.org/movie/${code}/watch?locale=BR`
    }

    try {
      const response = await axios.get(url);
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
