const axios = require("axios");
const { Expo } = require("expo-server-sdk");
const { put } = require("@vercel/blob");
require("dotenv").config();

const expo = new Expo();

const urlMovies = "https://pypt6b6urgwbmcod.public.blob.vercel-storage.com/notificationF2W-T9CgICVM9EaMADOREZ1HnF3qD3olyn.txt";

const urlTokens = `https://pypt6b6urgwbmcod.public.blob.vercel-storage.com/notificationTokens-lWj9B7MUKtFeyEj5E4Lo6h1dGOTu2l.txt`;

async function saveJson(nomeArquivo, objetoJson) {
  const jsonString = JSON.stringify(objetoJson, null, 2);

  const { url } = await put(nomeArquivo, jsonString, {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });

  return url;
}

async function searchMovies() {
  const response = await axios.get(
    "https://api.themoviedb.org/3/trending/movie/day?language=pt-BR&region=BR&page=1",
    {
      headers: {
        accept: "application/json",
        Authorization: process.env.TMDB_TOKEN,
      },
    }
  );
  return response.data.results;
}

async function searchTvShow() {
  const response = await axios.get(
    "https://api.themoviedb.org/3/trending/tv/day?language=pt-BR&region=BR&page=1",
    {
      headers: {
        accept: "application/json",
        Authorization: process.env.TMDB_TOKEN,
      },
    }
  );
  return response.data.results;
}

function trendingChanged(novos, antigos) {

  for (let i = 0; i < Math.min(novos.length, 3) && i < antigos.length; i++) {
    if (novos[i].id !== antigos[i].id) {

      if ( i % 2 === 0 )
      {
        return [true, novos[i].title];
      }
      else
      {
        return [true, novos[i].name];
      }

    }
  }
  return [false, ""];
}

const requestWatchProvides = async (id, type) => {
  let request;

  if (type === "1") {
    request = `3/movie/${id}/watch/providers`;
  } else {
    request = `3/tv/${id}/watch/providers`;
  }

  const res = await axios.get(`https://api.themoviedb.org/${request}`, {
    headers: {
      accept: "application/json",
      Authorization: process.env.TMDB_TOKEN,
    },
  });

  const resultsBR = res.data.results?.["BR"];

  if (!resultsBR) {
    return undefined; // Nenhum provedor no Brasil
  }

  const hasProviders = resultsBR.ads || resultsBR.flatrate;

  return hasProviders;
};

async function enviarNotificacao(tokens, ContentName) {
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: "Já viu o que tá em alta?",
    body: `Atualizamos a lista de filmes e séries. Bora assistir${ContentName ? ` ${ContentName}` : ""}?`,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (let chunk of chunks) {
    await expo.sendPushNot
    ificationsAsync(chunk);
  }
}

module.exports = async (req, res) => {
  const responseMovies = await axios.get(urlMovies, { responseType: "json" });

  const trendingCache = responseMovies.data;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const movies = await searchMovies();
    const tvShow = await searchTvShow();

    const filteredOverviewMovies = movies.flat().filter((item) => item.overview?.trim() !== "");
    const filteredOverviewTvShow = tvShow.flat().filter((item) => item.overview?.trim() !== "");
    

    const maxLength = Math.max(filteredOverviewMovies.length, filteredOverviewTvShow.length);

    let result = [];

    for (let i = 0; i < maxLength; i++) {
      if (filteredOverviewMovies[i]) result.push(filteredOverviewMovies[i]);
      if (filteredOverviewTvShow[i]) result.push(filteredOverviewTvShow[i]);
    }

    const resultChange = trendingChanged(result, trendingCache.result);

    if (resultChange[0]) {
      await saveJson("notificationF2W-T9CgICVM9EaMADOREZ1HnF3qD3olyn.txt", {
        result,
      });

      const response = await axios.get(urlTokens, { responseType: 'json' });

      await enviarNotificacao(response.data, resultChange[1]);
      return res.status(200).json({ message: "Notificação Enviada" });
    }

    return res.status(200).json({ message: "Nada mudou." });
  } catch (err) {
    console.error("Erro:", err);
    return res.status(500).json({ error: err.message });
  }
};

