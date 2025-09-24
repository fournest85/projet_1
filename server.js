const express = require("express");
const path = require('path');
const { connecter } = require("./bd/connect");
const routesUser = require('./route/user');
const app = express();
const axios = require('axios');
const API_URL = 'http://localhost:3000/api/users';
const port = process.env.PORT || 3000


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));

app.use('/api', routesUser);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


connecter('mongodb+srv://sebastienfournest_db_user:R%40oulsky85@sebastien.xv9iiw3.mongodb.net/sebastienfournest_db_user?retryWrites=true&w=majority&appName=sebastien', (err) => {
    if (err) {
        console.error('Failed to connect to the database');
        process.exit(-1);
    } else {
        console.log('Connected to the database');
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            axios.get(API_URL)
                .then(response => {
                    console.log(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
        });
    }
});


