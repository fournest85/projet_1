// require('dotenv').config();
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

function connecter(uri, callback) {
    if (!client) {
        client = new MongoClient(uri);
        client.connect()
            .then(() => {
                const dbName = "sebastienfournest_db_user";
                // if (!process.env.DB_NAME) {
                //     console.warn('⚠️ DB_NAME non défini dans .env, utilisation du nom extrait de l\'URI :', dbName);
                // }
                db = client.db(dbName);
                callback();
            })
            .catch(err => {
                client = null;
                db = null;
                callback(err);
            });
    } else {
        callback();
    }
}

function bd() {
    return db;
}

function fermerConnexion() {
    if (client) {
        client.close();
        client = null;
        db = null;
    }
}

module.exports = { connecter, bd, fermerConnexion };