const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { idMovie, idCity, data } = req.query;

  if (!idMovie || !idCity || !data) {
    return res.status(400).json({ erro: "Parâmetros obrigatórios ausentes." });
  }

  try {

    const response = await axios.get(`https://www.adorocinema.com/_/showtimes/movie-${idMovie}/near-${idCity}/d-${data}/`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const cinemas = [];
    const results = response.data?.results ?? [];
    const pages = response.data?.pagination.totalPages

    results.forEach(item => {
      const nomeCinema = item.theater?.name ?? "Cinema não identificado";

      const horariosDublados = (item.showtimes?.dubbed ?? []).map(sessao => {
        return new Date(sessao.startsAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/Sao_Paulo"
        });
      });

      const horariosLegendados = (item.showtimes?.original ?? []).map(sessao => {
        return new Date(sessao.startsAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/Sao_Paulo"
        });
      });

      cinemas.push({
        cinema: nomeCinema,
        dublados: horariosDublados,
        legendados: horariosLegendados
      });
    });

    for(let i = 2; i<= pages; i++){
      const response = await axios.get(`https://www.adorocinema.com/_/showtimes/movie-${idMovie}/near-${idCity}/d-${data}/?page=${i}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const results = response.data?.results ?? [];

      results.forEach(item => {
        const nomeCinema = item.theater?.name ?? "Cinema não identificado";
  
        const horariosDublados = (item.showtimes?.dubbed ?? []).map(sessao => {
          return new Date(sessao.startsAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Sao_Paulo"
          });
        });
  
        const horariosLegendados = (item.showtimes?.original ?? []).map(sessao => {
          return new Date(sessao.startsAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Sao_Paulo"
          });
        });
  
        cinemas.push({
          cinema: nomeCinema,
          dublados: horariosDublados,
          legendados: horariosLegendados
        });
      });
    }

    res.send(cinemas);
  } catch (err) {
    console.error("Erro ao buscar os dados:", err.message);
    res.status(500).json({ erro: "Erro ao buscar as regiões" });
  }
};
