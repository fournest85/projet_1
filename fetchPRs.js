require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');


const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const DB_NAME = process.env.DB_NAME;



const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
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
        // console.log('Token utilisé :', process.env.GITHUB_TOKEN);
        const response = await axios.get(githubApiUrl, { headers });
        const prs = response.data;

        await collection.deleteMany({});

        const docs = prs.map(pr => ({
            id: pr.id,
            title: pr.title,
            user: pr.user,
            state: pr.state,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            html_url: pr.html_url

        }));

        if (docs.length > 0) {
            await collection.insertMany(docs);
            console.log(`✅ ${docs.length} PRs enregistrées.`);
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

