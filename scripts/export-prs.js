require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { mapUsersByGithubId, enrichPRsWithUsers, getExportFilePath } = require('./githubService');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = 'pr_merge';

const exportFolder = path.join(__dirname, 'exports');
if (!fs.existsSync(exportFolder)) {
    fs.mkdirSync(exportFolder, { recursive: true });
}



async function exportPRsToJson({ enrichWithUsers = false } = {}) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const prs = await collection.find({}).toArray();

        let finalPRs = prs;

        if (enrichWithUsers) {
            const userCollection = db.collection('users');
            const users = await userCollection.find({}).toArray();
            const usersByGithubId = mapUsersByGithubId(users);
            finalPRs = enrichPRsWithUsers(prs, usersByGithubId);
        }

        const filePath = getExportFilePath();
        console.log(`🔍 Vérification de l'existence du fichier : ${filePath}`);
        if (fs.existsSync(filePath)) {
            console.log(`📁 Le fichier ${path.basename(filePath)} existe déjà. Export ignoré.`);
            return;
        }


        fs.writeFileSync(filePath, JSON.stringify(finalPRs, null, 2), 'utf-8');
        console.log(`✅ Export ${enrichWithUsers ? 'enrichi ' : ''}terminé : ${filePath}`);
    } catch (err) {
        console.error('❌ Erreur lors de l’export :', err.message);
    } finally {
        await client.close();
    }

}



module.exports = { exportPRsToJson };