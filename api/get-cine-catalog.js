const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { code, date } = req.query;
  const url = `https://www.adorocinema.com/_/showtimes/theater-${code}/d-${date}/`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const len = data.results.length;
    if (len === 0) {
      res.send([]);
      return;
    }
    let result = [];

    for (let i = 0; i < len; i++) {
      const movies = data.results[i].movie;

      result[i] = {
        id: movies.id,
        title: movies.title,
        overview: movies.synopsis,
        poster_path: movies.poster.url,
        release_date: movies.data.productionYear,
      };
    }

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};
