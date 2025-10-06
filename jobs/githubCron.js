const { fetchAndStorePRsRaw } = require('../scripts/prService');
const { migrateUsersFromPRs } = require('../controller/user');
const { exportPRsToJson } = require('../scripts/export-prs');
const { generateRapportMarkdown } = require("../scripts/generateRapport");
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

            await exportPRsToJson({ enrichWithUsers: true });
            console.log('📁 Export JSON terminé.');

            await migrateUsersFromPRs({
                body: {},
                query: {},
                params: {},
                status: () => ({ json: console.log })
            });
            console.log('👥 Migration des utilisateurs GitHub terminée.');


            // 📝 Génération du rapport Markdown
            generateRapportMarkdown();
            console.log('📄 Rapport Markdown généré.');


        } catch (error) {
            console.error('❌ Erreur dans le cron :', error.message);
        }
    });
}

module.exports = { initGithubCron };
