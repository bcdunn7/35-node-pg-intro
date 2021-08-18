const { Client } = require('pg');

// to access .env variables
const dotenv = require('dotenv');
dotenv.config();

let DB_URI;

// to deal with invalid characters in password
const URI_DB_PASSWORD = `${encodeURIComponent(process.env.DB_PASSWORD)}`

if (process.env.NODE_ENV === "test") {
    DB_URI = `postgresql://${process.env.DB_USER}:${URI_DB_PASSWORD}@localhost:${process.env.DB_PORT}/biztime_test`;
} else {
    DB_URI = `postgresql://${process.env.DB_USER}:${URI_DB_PASSWORD}@localhost:${process.env.DB_PORT}/biztime`;
}

let db = new Client({
    connectionString: DB_URI
})

db.connect();

module.exports = db;