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
    const url = `https://www.adorocinema.com/pesquisar/?q=${encodeURIComponent(search)}`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      const $ = cheerio.load(data);
      const span = $("span.meta-title-link").first();

      if (!span || !span.attr("class")) {
        return res.status(404).json({ error: "Classe não encontrada" });
      }

      const encoded = span.attr("class").split(" ").find(c => c !== "meta-title-link");
      const cleaned = encoded.replace(/ACr/g, "");
      const decoded = Buffer.from(cleaned, "base64").toString("utf-8");
      const match = decoded.match(/filme-(\d+)/);

      const codigo = match ? match[1] : null;
      
      res.send(codigo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
};
