// require('dotenv').config();
// const axios = require('axios');
// const { MongoClient } = require('mongodb');


// const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
// const MONGODB_URI = process.env.MONGODB_URI;
// const GITHUB_OWNER = process.env.GITHUB_OWNER;
// const GITHUB_REPO = process.env.GITHUB_REPO;
// const DB_NAME = process.env.DB_NAME;



// const headers = {
//     Authorization: `Bearer ${GITHUB_TOKEN}`,
//     Accept: 'application/vnd.github.v3+json'
// };

// const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=all`;


// async function fetchFilesForPR(prNumber) {
//     const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${prNumber}/files`;
//     const response = await axios.get(url, { headers });
//     return response.data.map(file => ({
//         filename: file.filename,
//         status: file.status,
//         additions: file.additions,
//         deletions: file.deletions,
//         changes: file.changes,
//         raw_url: file.raw_url
//     }));
// }


// async function fetchAndStorePRs() {
//     const client = new MongoClient(MONGODB_URI);

//     try {
//         await client.connect();

//         // const dbName = new URL(MONGODB_URI).pathname.substring(1); 
//         const db = client.db(DB_NAME);
//         const collection = db.collection('pr_merge');
//         const github_repo = process.env.GITHUB_REPO;
//         const response = await axios.get(githubApiUrl, { headers });
//         const prs = response.data;

//         // await collection.deleteMany({});

//         const docs = [];

//         for (const pr of prs) {
//             const files = await fetchFilesForPR(pr.number);

//             docs.push({
//                 id: pr.id,
//                 number: pr.number,
//                 title: pr.title,
//                 user: pr.user,
//                 state: pr.state,
//                 created_at: pr.created_at,
//                 updated_at: pr.updated_at,
//                 repo: github_repo,
//                 // html_url: pr.html_url,
//                 files: files,
//                 date: new Date()    
//             });

            
//         }


//         if (docs.length > 0) {
//             await collection.insertMany(docs);
//             console.log(`✅ ${docs.length} PRs enregistrées.`);
//         } else {
//             console.log('ℹ️ Aucune PR trouvée.');
//         }

//     } catch (error) {
//         console.error('❌ Erreur :', error.message);
//     } finally {
//         await client.close();
//     }
// }

// module.exports = { fetchAndStorePRs };

