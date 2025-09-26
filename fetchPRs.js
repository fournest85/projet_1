require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');

const { GITHUB_TOKEN, MONGODB_URI, GITHUB_OWNER, GITHUB_REPO } = process.env;

const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
};

const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`;

async function fetchAndStorePRs() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();

        const dbName = new URL(MONGODB_URI).pathname.substring(1); 
        const db = client.db(dbName);
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

