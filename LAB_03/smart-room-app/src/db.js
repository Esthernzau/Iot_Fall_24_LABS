/* 
Purpose: Initializes and exports the PostgreSQL connection pool.
Implementation: Use the pg package to set up a connection pool with
credentials from the .env file.
*/

// Import the pg package
const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool instance with connection details from environment variables
const pool = new Pool({
  host: process.env.PGHOST, 
  port: process.env.PGPORT, 
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  allowExitOnIdle: true
});

// Export the pool for use in other modules
module.exports = pool;
