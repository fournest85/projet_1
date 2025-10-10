const { fetchAndStorePRsRaw } = require('../scripts/prService');
const { migrateUsersFromPRs } = require('../controller/user');
const { exportPRsToJson, generateWeeklyReport } = require('../scripts/export-prs');
const { generateRapportMarkdown, generateWeeklyMarkdownReport } = require("../scripts/generateRapport");
const cron = require('node-cron');
const schedule = require('node-schedule');
const dayjs = require('dayjs');

/**
 * Initialise le cron pour récupérer les PRs modifiées chaque jour à 1h du matin.
 */
function initGithubCron() {
    // 🔁 Tâche quotidienne
    cron.schedule('0 1 * * *', async () => {
        console.log('⏰ Cron lancé pour récupérer les PRs modifiées...');
        try {
            const message = await fetchAndStorePRsRaw();
            console.log('✅', message);

            await exportPRsToJson({ enrichWithUsers: true });
            console.log('📤 exportPRsToJson lancé');
            console.log('📁 Export JSON terminé.');

            await migrateUsersFromPRs({
                body: {},
                query: {},
                params: {},
                status: () => ({ json: console.log })
            });
            console.log('👥 Migration des utilisateurs GitHub terminée.');


            // 📝 Génération du rapport Markdown
            const dateStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
            await generateRapportMarkdown(dateStr);
            console.log('📝 generateRapportMarkdown lancé');
            console.log('📄 Rapport Markdown généré.');


        } catch (error) {
            console.error('❌ Erreur dans le cron :', error.message);
        }
    });


    // 🕐 Tâche hebdomadaire : chaque lundi à 01h00
    schedule.scheduleJob('0 1 * * 1', () => {
        console.log('📅 Tâche cron : génération du rapport hebdomadaire');
        generateWeeklyReport();
    });

    schedule.scheduleJob('0 1 * * 1', () => {
        console.log('📄 Tâche cron : génération du rapport Markdown hebdomadaire');
        generateWeeklyMarkdownReport();
    });


}

module.exports = { initGithubCron };
