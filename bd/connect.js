const { MongoClient } = require('mongodb');

var user = null;

function connecter(API_URL, callback) {
    if (user == null) {
        user = new MongoClient(API_URL);

        user.connect((err) => {
            if (err) {
                user = null;
                callback(err);
            } else {
                callback();
            }
        })
    } else {
        callback();
    }
}

function bd() {
    return new Db(user, "db/projet_1/users");
}

function fermerConnexion() {
    if (user) {
        user.close();
        user = null;    
    }
}

module.exports = { connecter, bd, fermerConnexion };