require('dotenv').config();

const express = require("express");
const path = require('path');
const { connecter } = require("./bd/connect");
const routesUser = require('./route/user');
const { fetchAndStorePRs } = require('./fetchPRs');
const { MongoClient } = require('mongodb');
const open = require('open').default;
require('./jobs/githubCron');

const app = express();
const axios = require('axios');

const API_URL = process.env.API_URL;
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/api', routesUser);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/github/prs', async (req, res) => {
    try {
        const message = await fetchAndStorePRs();
        res.status(200).json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get('/api/github/prs/list', async (req, res) => {
    const client = new MongoClient(uri);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection('pr_merge');

        let query = {};
        const dateParam = req.query.date;

        if (dateParam) {
            const selectedDate = new Date(dateParam);
            selectedDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(selectedDate.getDate() + 1);

            query.date = {
                $gte: selectedDate,
                $lt: nextDay
            };
        } else {
            query.date = {
                $gte: yesterday,
                $lt: today
            };
        }



        let sort = {};
        const sortField = req.query.sort;
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        if (sortField === 'titleAndDate') {
            sort = { title: 1, date: -1 }; // tri combiné
        } else if (sortField) {
            sort = { [sortField]: sortOrder };
        } else {
            sort = { date: -1 }; // tri par défaut
        }

        const prs = await collection.find(query).sort(sort).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments(query);

        res.status(200).json({
            prs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture des PRs.' });
    } finally {
        await client.close();
    }
});

app.get('/prs-details', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'pr-details.html'));
});

app.get('/api/github/prs/:number', async (req, res) => {
    const client = new MongoClient(uri);
    const prNumber = parseInt(req.params.number);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection('pr_merge');

        const pr = await collection.findOne({ number: prNumber });

        if (!pr) {
            return res.status(404).json({ error: 'PR non trouvée.' });
        }

        res.status(200).json(pr);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de la PR.' });
    } finally {
        await client.close();
    }
});





connecter(uri, (err) => {
    if (err) {
        console.error('Failed to connect to the database');
        process.exit(-1);
    } else {
        console.log('Connected to the database');
        // Mise à jour des utilisateurs : ajout du champ 'phone' si absent
        // bd().collection('users').updateMany(
        //     { phone: { $exists: false } }, // uniquement ceux qui n'ont pas le champ
        //     { $set: { phone: null } }      // ajoute le champ avec valeur null
        // ).then(result => {
        //     console.log(`${result.modifiedCount} utilisateurs mis à jour avec le champ 'phone'.`);
        // }).catch(error => {
        //     console.error('Erreur lors de la mise à jour des utilisateurs :', error);
        // });
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            axios.get(API_URL)
                .then(response => {
                    console.log(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
            open(`http://localhost:${port}`);
        });
    }
});



