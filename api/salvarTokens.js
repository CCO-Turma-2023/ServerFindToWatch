const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const { put } = require('@vercel/blob'); // Supondo que você esteja usando o Vercel Blob API

const urlTokens = "https://pypt6b6urgwbmcod.public.blob.vercel-storage.com/notificationTokens-7Kjlijm29kPsHluKLyrLuKLKlEeaEM.txt";

module.exports = async (req, res) => {
    const { token } = req.body;

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

    res.sendStatus(200);
};