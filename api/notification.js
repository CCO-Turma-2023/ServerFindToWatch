const axios = require('axios');
const { Expo } = require('expo-server-sdk');
const { put } = require("@vercel/blob");
require('dotenv').config();

const expo = new Expo();

const urlFilmes = "https://6rirgodfzktvd3ov.public.blob.vercel-storage.com/a-BS5g8m6J1gZVnQ9pEX5fniGRwQmOzb.txt";


async function salvarJson(nomeArquivo, objetoJson) {
  const jsonString = JSON.stringify(objetoJson, null, 2);

  const { url } = await put(nomeArquivo, jsonString, {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true
  });

  return url;
}


async function buscarFilmes() {
  const response = await axios.get(
    'https://api.themoviedb.org/3/trending/movie/day?language=pt-BR&region=BR&page=1',
    {
      headers: {
        accept: "application/json",
        Authorization: process.env.TMDB_TOKEN,
      }
    }
  );
  return response.data.results;
}


function filmesMudaram(novos, antigos) {
  if (!antigos || novos.length !== antigos.length) return true;
  for (let i = 0; i < novos.length; i++) {
    if (novos[i].id !== antigos[i].id)
    {
      console.log(novos[i].id, antigos[i].id);
      return true;
    }
  }
  return false;
}


async function enviarNotificacao(tokens) {
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title: 'Filmes em alta atualizados!',
    body: 'Veja agora os novos filmes em destaque.',
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (let chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}


module.exports = async (req, res) => {
  const filmesCache = await axios.get(urlFilmes, { responseType: 'json'} )

  console.log('Dados recebidos:', filmesCache.data.filmes);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const filmes = await buscarFilmes();

    if (filmesMudaram(filmes, filmesCache.data.filmes)) {

      await salvarJson('a-BS5g8m6J1gZVnQ9pEX5fniGRwQmOzb.txt', { filmes });
      
      console.log("Filmes Novos", filmes);

      console.log('Filmes mudaram, enviando notificação...');

      const tokens = [
        'ExponentPushToken[Zz_bkwJiz_O_FC33EjgUMY]'
      ];

      await enviarNotificacao(tokens);
      return res.status(200).json({ message: 'Notificação enviada' });
    }

    console.log('Filmes não mudaram.');
    return res.status(200).json({ message: 'Nada mudou' });
  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ error: err.message });
  }
}