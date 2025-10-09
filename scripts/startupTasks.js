// scripts/startupTasks.js
const fs = require('fs');
const path = require('path');
const {
    fetchAndStorePRsRaw,
    showDiffsForModifiedPRsFromYesterday,
    fetchModifiedPRsFromYesterdayFromDB,
    updatePRs
} = require('./prService');
const { fetchModifiedPRsFromYesterday } = require('./githubService');
const { migrateUsersFromPRsInternal } = require('../controller/user');
const { generateRapportMarkdown } = require("./generateRapport");
const { exportPRsToJson } = require("./export-prs");
const limit = 100; // Nombre de PRs par page
const axios = require('axios');

async function runStartupTasks(inputDate, API_URL) {
    try {
        console.log(`🗓️ Démarrage des tâches pour la date : ${inputDate}`);
        console.log('--- [Fetch PRs] ---');
        const message = await fetchAndStorePRsRaw(inputDate);
        console.log('✅ PRs récupérées :', message);


        // Vérification du fichier export
        const exportPath = path.join(__dirname, `../exports/export_prs_${inputDate}.json`);
        if (fs.existsSync(exportPath)) {
            console.log(`📁 Le fichier export_prs_${inputDate}.json existe déjà.`);
        }

        console.log('--- [Update PRs] ---');
        const updated = await updatePRs();
        console.log(`✅ ${updated} PR(s) mises à jour avec les données utilisateur.`);
        console.log(`✅ ${updated} PR(s) enrichies.`);

        console.log('--- [Migration utilisateurs] ---');
        const count = await migrateUsersFromPRsInternal();

        if (count.inserted > 0) {
            console.log(`✅ ${count.inserted} utilisateur(s) migré(s).`);
        }
        if (count.duplicates > 0) {
            console.log(`ℹ️ ${count.duplicates} utilisateur(s) déjà présents ignorés.`);
        }

        console.log('--- [Récupération utilisateurs externes] ---');
        const allUsers = [];
        let page = 1;
        let totalPages = 1;
        try {
            do {
                const response = await axios.get(`${API_URL}?page=${page}`);
                const users = response.data.users;
                totalPages = response.data.totalPages || 1;
                if (Array.isArray(users)) allUsers.push(...users);
                page++;
            } while (page <= totalPages);

            const uniqueUsers = Array.from(new Map(allUsers.map(u => [u._id, u])).values());
            console.log(`👥 Utilisateurs récupérés : ${uniqueUsers.length}`);
        } catch (err) {
            console.error('❌ Erreur lors de la récupération des utilisateurs externes :', err.stack || err.message || err);
        }

        console.log('--- [PRs modifiées hier] ---');
        try {
            const prsDB = await fetchModifiedPRsFromYesterdayFromDB();
            console.log(`📦 PRs modifiées : ${prsDB.length}`);
            prsDB.slice(0, 5).forEach(pr => {
                console.log(`🧾 PR #${pr.number} - updated_at: ${pr.updated_at}`);
            });

            const prs = await fetchModifiedPRsFromYesterday();
            await showDiffsForModifiedPRsFromYesterday(prs);
            console.log('✅ PRs enrichies avec les lignes modifiées');
        } catch (err) {
            console.error('❌ Erreur lors de l’analyse des PRs modifiées :', err.stack || err.message || err);
        }
        await exportPRsToJson({ enrichWithUsers: true, dateToUse: inputDate });
        console.log(`✅ exportPRsToJson terminé avec enrichWithUsers=true`);

        // Log déplacé à la fin
        console.log(`📥 Traitement terminé pour la date d'analyse : ${inputDate}`);
        await generateRapportMarkdown(inputDate);
    } catch (err) {
        console.error('❌ Erreur dans les tâches de démarrage :', err.stack || err.message || err);
    }

}



module.exports = { runStartupTasks };