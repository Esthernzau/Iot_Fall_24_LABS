/* 
Purpose: Initializes and exports the PostgreSQL connection pool.
Implementation: Use the pg package to set up a connection pool with
credentials from the .env file.
*/

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  allowExitOnIdle: true
});

module.exports = pool;
