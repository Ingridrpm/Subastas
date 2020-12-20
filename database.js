var mysql = require('promise-mysql');
var database = require('./conf');

const pool = mysql.createPool(database.database);
pool.getConnection()
    .then(connection => {
        pool.releaseConnection(connection);
        console.log("Conexion a la BD satisfactoria!");
    });

module.exports = {pool};