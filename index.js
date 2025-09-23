const axios = require('axios');
// const express = require("express")
// const port = process.env.PORT || 3000

const API_URL = 'http://localhost:3000/users';







const updateUser = async (userId, updateUser) => {
    try {
        const response = await axios.put(`${API_URL}/${userId}`, updateUser);
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
};

const deleteUser = async (userId) => {
    try {
        const response = await axios.delete(`${API_URL}/${userId}`);
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
};





// app.listen(port, () => {
//     console.log("Serveur en ligne!!")
// })

// const newUser =  { name: 'John Doe', email: 'john@example.com'} ;
// createUser(newUser);

// updateUser('3', {id : '3', name: 'Jane Smith Doe2', email: 'john2@example.com'});

// deleteUser('2');

// getUsers();