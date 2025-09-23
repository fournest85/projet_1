const express = require("express");
const { createUser, getAllUsers } = require('../controller/user');
const router = express.Router();


router.route('/users').post(createUser);
router.route('/users').get(getAllUsers);

module.exports = router;