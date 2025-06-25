const axios = require("axios");
const { Expo } = require("expo-server-sdk");
const { put } = require("@vercel/blob");
require("dotenv").config();

const expo = new Expo();

const urlMovies = "https://pypt6b6urgwbmcod.public.blob.vercel-storage.com/notificationF2W-T9CgICVM9EaMADOREZ1HnF3qD3olyn.txt";

const urlTokens = `https://pypt6b6urgwbmcod.public.blob.vercel-storage.com/notificationTokens-glUgrqJeVzhYj2bKNbsgFSj6lFDb3l.txt?nocache=${Date.now()}`;

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
      console.log(novos[i].id, antigos[i].id);

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
    await expo.sendPushNotificationsAsync(chunk);
  }
}

module.exports = async (req, res) => {
  const responseMovies = await axios.get(urlMovies, { responseType: "json" });

  const trendingCache = responseMovies.data;

  console.log("AQUI", trendingCache);

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

    let filteredMoviesWithProviders = [];
    let filteredTvShowWithProviders = [];

    for (const item of filteredOverviewMovies) {
      const type = "1";
      const providers = await requestWatchProvides(item.id, type);
      if (providers !== undefined) {
        filteredMoviesWithProviders.push(item);
      }
    }

    for (const item of filteredOverviewTvShow) {
      const type = "0";
      const providers = await requestWatchProvides(item.id, type);
      if (providers !== undefined) {
        filteredTvShowWithProviders.push(item);
      }
    }

    const maxLength = Math.max(filteredMoviesWithProviders.length, filteredTvShowWithProviders.length);

    let result = [];

    for (let i = 0; i < maxLength; i++) {
      if (filteredMoviesWithProviders[i]) result.push(filteredMoviesWithProviders[i]);
      if (filteredTvShowWithProviders[i]) result.push(filteredTvShowWithProviders[i]);
    }

    const resultChange = trendingChanged(result, trendingCache.result);

    console.log("ResultChange", resultChange);

    if (resultChange[0] || true) {
      await saveJson("notificationF2W-T9CgICVM9EaMADOREZ1HnF3qD3olyn.txt", {
        result,
      });


      console.log("Filmes mudaram, enviando notificação...");

      const response = await axios.get(urlTokens, { responseType: 'json' });

      console.log(response.data);

      await enviarNotificacao(response.data, resultChange[1]);
      return res.status(200).json({ message: "Notificação Enviada" });
    }

    console.log("Filmes não mudaram.");
    return res.status(200).json({ message: "Nada mudou." });
  } catch (err) {
    console.error("Erro:", err);
    return res.status(500).json({ error: err.message });
  }
};
