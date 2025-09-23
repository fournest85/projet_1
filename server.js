const express = require("express");
const { connecter } = require("../projet_1/bd/connect");
const routesUser = require('./route/user');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api', routesUser);
// let users = [];



// app.get('/users', (req, res) => {
//     res.json(users);
// });

connecter('mongodb://localhost:27017/', (err) => {
    if (err) {
        console.error('Failed to connect to the database');
        process.exit(-1);
    } else {
        console.log('Connected to the database');
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    }
});

// app.get('/users/:id', (req, res) => {
//     const user = users.find(u => u.id === parseInt(req.params.id));
//     if (!user)  return res.status(404).send ('User not found');
//     res.json(user);
// });

// app.post('/users', (req, res) => {
//     const {name, email} = req.body;
//     const user = {
//         id: users.length +1,
//         name,
//         email
//     };
//     users.push(user)
//     res.status(201).json('User added succesfully');
// });

// app.put('/users/:id', (req, res) => {
//     const userId = req.params.id;
//     const updatedUser = req.body;
//     users = users.map(user => user.id === userId ? updatedUser : user);
//     res.send('User updated successfully');
// });

// app.delete('/users/:id', (req, res) => {
//     const userId = req.params.id;
//     users = users.filter(user => user.id !== userId);
//     res.send('User delete successfully');
// });

