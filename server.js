require('dotenv').config();
const express = require("express");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const open = require('open').default;
const readline = require('readline');

const dbUser = require('./bd/connect');
const { connecter } = require("./bd/connect");
const routesUser = require('./route/user');
const prRoutes = require('./route/pr');
const { fetchAndStorePRsRaw, showDiffsForModifiedPRsFromYesterday, fetchModifiedPRsFromYesterday, fetchModifiedPRsFromYesterdayFromDB, updatePRs } = require('./controller/pr');
const { migrateUsersFromPRs, migrateUsersFromPRsInternal } = require('./controller/user');
const { updatePRsWithUser } = require('./utils/update');
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

const importPRsFromFile = async () => {
    dbUser.connecter(uri, async (err) => {
        if (err) {
            console.error('❌ Erreur de connexion à MongoDB :', err.message);
            return;
        }

        try {
            const filePath = path.join(__dirname, 'scripts', 'exports', 'export_prs_2025-10-03.json');

            if (!fs.existsSync(filePath)) {
                console.log(`❌ Le fichier ${filePath} est introuvable.`);
                return;
            }

            const rawData = fs.readFileSync(filePath, 'utf-8');
            const prs = JSON.parse(rawData);


            const prCollection = dbUser.bd().collection('pr_merge');
            let insertedCount = 0;

            for (const pr of prs) {
                const exists = await prCollection.findOne({ number: pr.number });
                if (!exists) {
                    await prCollection.insertOne(pr);
                    insertedCount++;
                }
            }

            console.log(`✅ ${insertedCount} PR(s) importée(s) depuis le fichier.`);
        } catch (error) {
            console.error('❌ Erreur lors de l’import :', error.message);
        }
    });
};

importPRsFromFile();

connecter(uri, async (err) => {
    if (err) {
        console.error('❌ Failed to connect to the database');
        process.exit(-1);
    } else {
        console.log('✅ Connected to the database');


        demanderDate(async (inputDate) => {
            try {
                const message = await fetchAndStorePRsRaw(inputDate);
                console.log('🚀 PRs récupérées au démarrage :', message);
            } catch (error) {
                console.error('❌ Erreur au démarrage :', error.message);
            }

            try {
                console.log('🔧 Mise à jour des PRs avec les données utilisateur...');
                const updated = await updatePRsWithUser();
                console.log(`✅ ${updated} PR(s) enrichies avec les données utilisateur.`);
            } catch (err) {
                console.error('❌ Erreur lors de la mise à jour des PRs :', err.message);
            }

            try {
                console.log('🚀 Migration des utilisateurs GitHub depuis pr_merge...');

                const fakeReq = {
                    body: {},
                    query: {},
                    params: {}
                };

                const fakeRes = {
                    status: function (code) {
                        return {
                            json: function (data) {
                                console.log(`📤 Response ${code}:`, data);
                            }
                        };
                    }
                };

                await migrateUsersFromPRs(fakeReq, fakeRes);

                console.log('✅ Migration terminée.');
            } catch (err) {
                console.error('❌ Erreur lors de la migration au démarrage :', err.message);
            }

            try {
                console.log('🚀 Migration des utilisateurs GitHub depuis pr_merge...');
                const count = await migrateUsersFromPRsInternal();
                console.log(`✅ Migration terminée : ${count} utilisateur(s) inséré(s).`);
            } catch (err) {
                console.error('❌ Erreur lors de la migration au démarrage :', err.message);
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
            });
        });
    }
});