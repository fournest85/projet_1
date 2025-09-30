require('dotenv').config();

const express = require('express');
const router = express.Router();
const { fetchAndStorePRs } = require('../fetchPRs'); 
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;


router.get('/prs', async (req, res) => {
    try {
        await fetchAndStorePRs();
        res.json({ message: 'PRs récupérées et enregistrées.' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des PRs.' });
    }
});

router.get('/prs/list', async (req, res) => {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        // const dbName = new URL(MONGODB_URI).pathname.substring(1);
        const db = client.db(DB_NAME);
        const collection = db.collection('pr_merge');

        const prs = await collection.find().toArray();
        res.json(prs);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la lecture des PRs.' });
    } finally {
        await client.close();
    }
});

module.exports = router;
