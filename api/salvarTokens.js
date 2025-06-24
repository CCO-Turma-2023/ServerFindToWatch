const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const { put } = require('@vercel/blob');

const urlTokens = "https://pypt6b6urgwbmcod.public.blob.vercel-storage.com/notificationTokens-7Kjlijm29kPsHluKLyrLuKLKlEeaEM.txt";

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

        if (Array.isArray(response.data)) 
        {
            existingTokens = response.data;
        }
    } catch (error) {
        console.warn('Tokens antigos não encontrados ou inválidos. Será criado um novo arquivo.');
    }

    const tokens = Array.from(new Set([token, ...existingTokens]));

    const jsonString = JSON.stringify(tokens, null, 2);

    const { url } = await put("notificationTokens-7Kjlijm29kPsHluKLyrLuKLKlEeaEM.txt", jsonString, {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
    });

    res.status(200);
};