require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = 'pr_merge';

const exportDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
}


async function exportPRsToJson() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const prs = await collection.find({}).toArray();

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // format YYYY-MM-DD
        const fileName = `export_prs_${dateStr}.json`;
        const filePath = path.join(exportDir, fileName);

        if (fs.existsSync(filePath)) {
            console.log(`📁 Le fichier ${fileName} existe déjà. Export ignoré.`);
            return;
        }

        fs.writeFileSync(filePath, JSON.stringify(prs, null, 2), 'utf-8');
        console.log(`✅ Export terminé : ${filePath}`);
    } catch (err) {
        console.error('❌ Erreur lors de l’export :', err.message);
    } finally {
        await client.close();
    }
}

exportPRsToJson();