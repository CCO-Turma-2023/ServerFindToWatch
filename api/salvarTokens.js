const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const { put } = require('@vercel/blob');

const urlTokens = `https://pypt6b6urgwbmcod.public.blob.vercel-storage.com/notificationTokens-glUgrqJeVzhYj2bKNbsgFSj6lFDb3l-CySYlhMKotyF8F8uovSxwF1AWgEzYn.txt?nocache=${Date.now()}`;

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const { token } = req.query;

    console.log("isso ai", token);

    if (!token || !Expo.isExpoPushToken(token)) 
    {
        return res.status(400).send('Token inválido');
    }

    let existingTokens = [];

    try {
        const response = await axios.get(urlTokens, { responseType: 'json' });

        console.log(response.data);

        if (Array.isArray(response.data)) 
        {
            existingTokens = response.data;
        }
    } catch (error) {
        console.warn('Não foi possível carregar os tokens existentes:', error.message);
    }

    // Evita duplicatas
    const tokens = Array.from(new Set([token, ...existingTokens]));

    console.log(tokens);

    const jsonString = JSON.stringify(tokens, null, 2);

    await put("notificationTokens-glUgrqJeVzhYj2bKNbsgFSj6lFDb3l-CySYlhMKotyF8F8uovSxwF1AWgEzYn.txt", jsonString, {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
    });

    return res.status(200).send('Token Added');
};