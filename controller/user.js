const { User } = require('../model/user');
const { ObjectId } = require('mongodb');
const dbUser = require('../bd/connect');


const createUser = async (req, res) => {
    try {


        if (!req.body.name || !req.body.email || !req.body.phone) {
            return res.status(400).json({ error: 'Name, email and phone are required' });
        }

        const existingUser = await dbUser.bd().collection('users').findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        let user = new User(req.body.name, req.body.email, req.body.phone);
        let result = await dbUser.bd().collection('users').insertOne(user);

        res.status(201).json({
            message: 'User created successfully',
            insertedId: result.insertedId,
            _id: result.insertedId
        });
        console.log("User created");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        let cursor = dbUser.bd().collection('users').find();
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

const getUser = async (req, res) => {
    try {
        let id = new ObjectId(req.params.id);
        const user = await dbUser.bd().collection('users').findOne({ _id: id });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User doesn\'t exist' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const { name, email, phone } = req.body;


        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (phone) updateFields.phone = phone;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
        }
        if (email) {

            const existingUser = await dbUser.bd().collection('users').findOne({ email: email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(409).json({ error: 'Email already used by another user' });
            }
        }
        const result = await dbUser.bd().collection('users').updateOne({ _id: id }, { $set: updateFields });
        if (result.modifiedCount == 1) {
            res.status(200).json(
                {
                    message: 'User updated successfully',
                    modifiedCount: result.modifiedCount
                }
            );
            console.log("User updated");
        } else {
            res.status(404).json({ message: 'User doesn\'t exist' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const deleteUser = async (req, res) => {
    try {
        let id = new ObjectId(req.params.id);
        let result = await dbUser.bd().collection('users').deleteOne({ _id: id });
        if (result.deletedCount == 1) {
            res.status(200).json(result);
            console.log("User deleted");
        } else {
            res.status(404).json({ message: 'User doesn\'t exist' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { createUser, getAllUsers, getUser, updateUser, deleteUser };