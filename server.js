require('dotenv').config();

const express = require("express");
const path = require('path');
const { connecter } = require("./bd/connect");
const routesUser = require('./route/user');
const { fetchAndStorePRs } = require('./fetchPRs');
const { MongoClient } = require('mongodb');
const open = require('open').default;

const app = express();
const axios = require('axios');
const API_URL = 'http://localhost:3000/api/users';
const port = 3000
const uri = "mongodb+srv://sebastienfournest_db_user:R%40oulsky85@sebastien.xv9iiw3.mongodb.net/sebastienfournest_db_user?retryWrites=true&w=majority&appName=sebastien";
const DB_NAME = "sebastienfournest_db_user";

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
    try {
        await client.connect();
        // const dbName = new URL(uri).pathname.substring(1);
        const db = client.db(DB_NAME);
        const collection = db.collection('pr_merge');

        const prs = await collection.find().toArray();
        res.status(200).json(prs);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture des PRs.' });
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



