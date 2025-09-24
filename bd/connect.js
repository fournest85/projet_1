const { MongoClient } = require('mongodb');

let user = null;
let db = null;

function connecter(uri, callback) {
    if (!user) {
        user = new MongoClient(uri);
        user.connect()
            .then(() => {

                db = user.db("sebastienfournest_db_user");
                callback();
            })
            .catch(err => {
                user = null;
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
    if (user) {
        user.close();
        user = null;
        db = null;
    }
}

module.exports = { connecter, bd, fermerConnexion };