/*
Purpose: Contains functions for logging temperature data.
Implementation: Implement the function to record temperature read-
ings into the database. This file will be used in your routes to handle
temperature logging.
*/
//
// Import the database connection pool
const pool = require('../db');

// Generate and write one reading for a given room
const logTemperature = async (roomId, roomName) => {
  try {
    // Random integer [18..26] degrees Celsius
    const temperature = Math.floor(Math.random() * (26 - 18 + 1)) + 18; // 18..26
    const timestamp = new Date();
     
    // iTemperature logging query
    await pool.query(
      `INSERT INTO temperature_logs (room_id, temperature, timestamp)
       VALUES ($1, $2, $3)`,
      [roomId, temperature, timestamp]
    );

    // Log to console for visibility
    console.log(`[sensor] ${timestamp.toISOString()} - room="${roomName}" id=${roomId} temp=${temperature}°C`);
  } catch (err) {
    console.error('Error logging temperature:', err);
  }
};

// Start a loop: every 10s, fetch rooms then log a reading per room
const startLogging = () => {
  setInterval(async () => {
    const res = await pool.query('SELECT id, name FROM rooms');
    for (const row of res.rows) {
      await logTemperature(row.id, row.name); // log one reading per room
    }
  }, 10_000); // every 10 seconds
};

module.exports = { startLogging };
