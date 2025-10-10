require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { mapUsersByGithubId, enrichPRsWithUsers, getExportFilePath } = require('./githubService');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = 'pr_merge';
const dayjs = require('dayjs');

const exportFolder = path.join(__dirname, 'exports');
if (!fs.existsSync(exportFolder)) {
    fs.mkdirSync(exportFolder, { recursive: true });
}



async function exportPRsToJson({ enrichWithUsers = false, dateToUse } = {}) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const selectedDate = dateToUse
            ? new Date(dateToUse)
            : dayjs().subtract(1, 'day').startOf('day').toDate();

        const nextDay = dayjs(selectedDate).add(1, 'day').startOf('day').toDate();


        const prs = await collection.find({
            created_at: { $gte: selectedDate, $lt: nextDay }
        }).toArray();


        let finalPRs = prs;

        if (enrichWithUsers) {
            const userCollection = db.collection('users');
            const users = await userCollection.find({}).toArray();
            const usersByGithubId = mapUsersByGithubId(users);
            finalPRs = enrichPRsWithUsers(prs, usersByGithubId);
        }

        const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
        const filePath = getExportFilePath('export_prs', dateStr);
        console.log(`🔍 Vérification de l'existence du fichier : ${filePath}`);
        if (fs.existsSync(filePath)) {
            console.log(`📁 Le fichier ${path.basename(filePath)} existe déjà. Export ignoré.`);
            return;
        }


        fs.writeFileSync(filePath, JSON.stringify(finalPRs, null, 2), 'utf-8');
        console.log(`✅ Export ${enrichWithUsers ? 'enrichi ' : ''}terminé : ${filePath}`);
        console.log(`📁 Écriture du fichier JSON à : ${filePath}`);
    } catch (err) {
        console.error('❌ Erreur lors de l’export :', err.message);
    } finally {
        await client.close();
    }

}

// 📅 Obtenir les dates de début et fin de la semaine précédente
function getPreviousWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ...
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - dayOfWeek - 6);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    return { start: lastMonday, end: lastSunday };
}

// 📁 Lire tous les fichiers export_prs de la semaine
function getWeeklyExportFiles(startDate, endDate) {
    const files = fs.readdirSync(exportFolder);
    return files.filter(file => {
        if (!file.startsWith('export_prs_') || !file.endsWith('.json')) return false;
        const dateStr = file.slice(11, -5); // "YYYY-MM-DD"
        const fileDate = new Date(dateStr);
        return fileDate >= startDate && fileDate <= endDate;
    });
}

// 🔄 Fusionner les PRs sans doublons
function mergePRs(files) {
    const merged = {};
    files.forEach(file => {
        const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
        content.forEach(pr => {
            if (pr.number) merged[pr.number] = pr;
        });
    });
    return Object.values(merged);
}

// 📝 Générer le rapport hebdomadaire
function generateWeeklyReport() {
    const { start, end } = getPreviousWeekRange();
    const files = getWeeklyExportFiles(start, end);
    const mergedPRs = mergePRs(files);


    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const outputName = `export_prs_hebdo_${startStr}_au_${endStr}.json`;
    const outputPath = path.join(exportFolder, outputName);
    fs.writeFileSync(outputPath, JSON.stringify(mergedPRs, null, 2), 'utf-8');
    console.log(`✅ Rapport hebdomadaire généré : ${outputName}`);
}

module.exports = { exportPRsToJson, generateWeeklyReport };