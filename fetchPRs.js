// require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');

const GITHUB_TOKEN = "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";
const MONGODB_URI = "mongodb+srv://sebastienfournest_db_user:R%40oulsky85@sebastien.xv9iiw3.mongodb.net/sebastienfournest_db_user?retryWrites=true&w=majority&appName=sebastien";
const GITHUB_OWNER = "fournest85";
const GITHUB_REPO = "projet_1";
const DB_NAME = "sebastienfournest_db_user";


const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
};

const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=all`;

async function fetchAndStorePRs() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();

        // const dbName = new URL(MONGODB_URI).pathname.substring(1); 
        const db = client.db(DB_NAME);
        const collection = db.collection('pr_merge');

        const response = await axios.get(githubApiUrl, { headers });
        const prs = response.data;

        const operations = prs.map(pr => ({
            updateOne: {
                filter: { id: pr.id },
                update: {
                    $set: {
                        id: pr.id,
                        title: pr.title,
                        user: pr.user,
                        state: pr.state,
                        created_at: pr.created_at,
                        updated_at: pr.updated_at,
                        url: pr.html_url
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            const result = await collection.bulkWrite(operations);
            console.log(`✅ ${result.upsertedCount + result.modifiedCount} PRs enregistrées.`);
        } else {
            console.log('ℹ️ Aucune PR trouvée.');
        }

    } catch (error) {
        console.error('❌ Erreur :', error.message);
    } finally {
        await client.close();
    }
}

module.exports = { fetchAndStorePRs };

