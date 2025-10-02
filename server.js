require('dotenv').config();
const express = require("express");
const path = require('path');
const axios = require('axios');
const open = require('open').default;
const readline = require('readline');

const { connecter } = require("./bd/connect");
const routesUser = require('./route/user');
const prRoutes = require('./route/pr');
const { fetchAndStorePRsRaw, showDiffsForModifiedPRsFromYesterday, fetchModifiedPRsFromYesterday, fetchModifiedPRsFromYesterdayFromDB, enrichPRsManuellement } = require('./controller/pr');
const { initGithubCron } = require('./jobs/githubCron');

const app = express();

const API_URL = process.env.API_URL;
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

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


        demanderDate(async (inputDate) => {
            try {
                const message = await fetchAndStorePRsRaw(inputDate); // passe la date choisie
                console.log('🚀 PRs récupérées au démarrage :', message);
            } catch (error) {
                console.error('❌ Erreur au démarrage :', error.message);
            }
            // Lancement du cron
            initGithubCron();

            // Démarrage du serveur
            app.listen(port, async () => {
                console.log(`Server is running on http://localhost:${port}`);
                open(`http://localhost:${port}`);
                // Récupération des utilisateurs depuis l'API externe
                const allUsers = [];
                let page = 1;
                let totalPages = 1;

                try {

                    do {
                        const response = await axios.get(`${API_URL}?page=${page}`);
                        const users = response.data.users;
                        totalPages = response.data.totalPages || 1;

                        if (Array.isArray(users)) {
                            allUsers.push(...users);
                        }

                        page++;
                    } while (page <= totalPages);

                    const uniqueUsers = Array.from(
                        new Map(allUsers.map(user => [user._id, user])).values()
                    );

                    console.log(`👥 Utilisateurs : ${uniqueUsers.length}`);
                } catch (error) {
                    console.error('❌ Erreur lors de la récupération des utilisateurs :', error.message);
                }
                // Récupération des PRs modifiées la veille
                try {
                    const prs = await fetchModifiedPRsFromYesterdayFromDB();
                    console.log(`📦 PRs modifiées hier : ${prs.length}`);
                    
                    prs.forEach(pr => {
                        console.log(`🧪 PR #${pr.number} - updated_at: ${pr.updated_at}`);
                    });
                } catch (error) {
                    console.error('❌ Erreur lors de la récupération des PRs de la veille :', error.message);
                }


                try {
                    const prs = await fetchModifiedPRsFromYesterday(); 
                    await showDiffsForModifiedPRsFromYesterday(prs);   
                    console.log('✅ PRs enrichies avec les lignes modifiées');
                } catch (error) {
                    console.error('❌ Erreur lors de l’analyse des PRs modifiées de la veille :', error.message);
                }


                // Appel unique au démarrage
                // try {
                //     await enrichPRsManuellement();
                //     console.log('✅ Enrichissement des PRs terminé au démarrage');
                // } catch (err) {
                //     console.error('❌ Erreur lors de l’enrichissement au démarrage :', err.message);
                // }

            });
        });
    }
});