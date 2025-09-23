const { User } = require('../model/user');
// const axios = require('axios');
// const API_URL = 'http://localhost:3000/users';
const user = require('../bd/projet_1/connect');


const createUser = async (req, res) => {
    try {
        let user = new User(req.body.name, req.body.email);
        let result = await user.bd().collection('users').insertOne(user);
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        let cursor = user.bd().collection('users').find();
        let result = await cursor.toArray();
        if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(204).json({ message: 'No Content' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { createUser, getAllUsers };