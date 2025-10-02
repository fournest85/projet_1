const { fetchAndStorePRsRaw } = require('../controller/pr');
const { exportPRsToJson } = require('../scripts/export-prs');
const cron = require('node-cron');

/**
 * Initialise le cron pour récupérer les PRs modifiées chaque jour à 1h du matin.
 */
function initGithubCron() {
    cron.schedule('0 1 * * *', async () => {
        console.log('⏰ Cron lancé pour récupérer les PRs modifiées...');
        try {
            const message = await fetchAndStorePRsRaw();
            console.log('✅', message);

            await exportPRsToJson();
            console.log('📁 Export JSON terminé.');
        } catch (error) {
            console.error('❌ Erreur dans le cron :', error.message);
        }
    });
}

module.exports = { initGithubCron };
