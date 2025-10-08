require('dotenv').config();
const express = require("express");
const path = require('path');
const open = require('open').default;
const readline = require('readline');

const { connecter } = require("./bd/connect");
const routesUser = require('./route/user');
const prRoutes = require('./route/pr');
const { initGithubCron } = require('./jobs/githubCron');
const { runStartupTasks } = require('./scripts/startupTasks');
const cors = require('cors');

const app = express();

const API_URL = process.env.API_URL;
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

app.use('/api', routesUser);
app.use('/api/github/prs', prRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/prs-details', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'pr-details.html'));
});

function demanderDate(callback) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('📅 Entrez une date (YYYY-MM-DD) ou appuyez sur Entrée pour utiliser la date d’hier : ', (input) => {
        rl.close();
        callback(input.trim());
    });
}


connecter(uri, async (err) => {
    if (err) {
        console.error('❌ Failed to connect to the database');
        process.exit(-1);
    } else {
        console.log('✅ Connected to the database');



        // Démarrage du serveur
        app.listen(port, async () => {
            console.log(`Server is running on http://localhost:${port}`);
            open(`http://localhost:${port}`);

            demanderDate(async (inputDate) => {
                const dateToUse = inputDate || new Date(Date.now() - 86400000).toISOString().split('T')[0];
                await runStartupTasks(dateToUse, API_URL);

                // Lancement du cron
                initGithubCron();
            });
        });
    }
});