const express = require("express");
const { createUser, getAllUsers, getUser,updateUser, deleteUser } = require('../controller/user');
const router = express.Router();


router.route('/users').post(createUser);
router.route('/users').get(getAllUsers);
router.route('/users/:id').get(getUser);
router.route('/users/:id').put(updateUser);
router.route('/users/:id').delete(deleteUser);

module.exports = router;