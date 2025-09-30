const cron = require('node-cron');
const { fetchAndStorePRs } = require('../fetchPRs');

// Planifie l'exécution tous les jours à 1h du matin
cron.schedule('0 1 * * *', async () => {
    console.log('⏰ Cron lancé pour récupérer les PRs modifiées...');
    await fetchAndStorePRs();
});

// Lancement immédiat au démarrage (optionnel)
(async () => {
    console.log('🚀 Lancement initial de la récupération des PRs...');
    await fetchAndStorePRs();
})
    ();