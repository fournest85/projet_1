const { User } = require('../model/user');
const { ObjectId } = require('mongodb');
const dbUser = require('../bd/connect');



const createUser = async (req, res) => {
    try {
        const { name, email, phone, githubData } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email and phone are required' });
        }

        const existingUser = await dbUser.bd().collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Création de l'utilisateur avec les métadonnées GitHub si présentes
        const user = new User({ name, email, phone, githubData });

        const result = await dbUser.bd().collection('users').insertOne(user);

        res.status(201).json({
            message: 'User created successfully',
            insertedId: result.insertedId,
            _id: result.insertedId
        });

        console.log("User created:", result.insertedId);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const collection = dbUser.bd().collection('users');

        // 🔍 Projection pour n'afficher que les champs utiles
        const users = await collection.find({}, {
            projection: { id: 1, login: 1, html_url: 1, _id: 0 }
        }).skip(skip).limit(limit).toArray();

        const total = await collection.countDocuments();

        res.status(200).json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getUser = async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const user = await dbUser.bd().collection('users').findOne(
            { _id: id },
            { projection: { id: 1, login: 1, html_url: 1, _id: 0 } }
        );

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