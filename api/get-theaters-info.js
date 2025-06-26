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
    const url = `https://www.adorocinema.com/pesquisar/theater/?q=${encodeURIComponent(search)}`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      const $ = cheerio.load(data);

      const theaters = $("div.theater-card");

    const cinemas = [];

    theaters.each((i, el) => {
        const theater = $(el);
        const cinemaName = theater.find("h2").text().trim();
        const code = theater.find("h2 > span").attr("class")

        const cleaned = code.replace(/ACr/g, "");
        const decoded = Buffer.from(cleaned, "base64").toString("utf-8");

        const match = decoded.match(/cinema-([A-Z0-9]+)/i);

        const codigo = match ? match[1] : null;

        const endereco = theater.find("address").text().trim();

        cinemas.push({ cinema: cinemaName, endereco, codigo });
    });

    res.json(cinemas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
};
