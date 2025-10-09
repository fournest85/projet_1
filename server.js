require('dotenv').config();
const express = require("express");
const open = require('open').default;
const readline = require('readline');

const { connecter } = require("./bd/connect");
const routesUser = require('./route/user');
const prRoutes = require('./route/pr');
const { initGithubCron } = require('./jobs/githubCron');
const { runStartupTasks } = require('./scripts/startupTasks');
const { exportPRsToJson } = require('./scripts/export-prs');
const { generateRapportMarkdown } = require('./scripts/generateRapport');
const { getExportFilePath } = require('./scripts/githubService');
const fs = require('fs');
const cors = require('cors');

const app = express();

const API_URL = process.env.API_URL;
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use('/api', routesUser);
app.use('/api/github/prs', prRoutes);

app.get('/api/generate/:date', async (req, res) => {
  const dateStr = req.params.date; // format YYYY-MM-DD
  const force = req.query.force === 'true';

  try {
    const exportPath = getExportFilePath('export_prs', dateStr);
    if (force && fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }

    await exportPRsToJson({ enrichWithUsers: true, dateToUse: dateStr });
    await generateRapportMarkdown(dateStr);

    res.send(`✅ Export et rapport générés pour la date : ${dateStr}`);
  } catch (err) {
    console.error(err);
    res.status(500).send(`❌ Erreur lors de la génération pour la date : ${dateStr}`);
  }
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
            open(`http://localhost:5000`);

            demanderDate(async (inputDate) => {
                const dateToUse = inputDate || new Date(Date.now() - 86400000).toISOString().split('T')[0];
                await runStartupTasks(dateToUse, API_URL);

                // Lancement du cron
                initGithubCron();
            });
        });
    }
});