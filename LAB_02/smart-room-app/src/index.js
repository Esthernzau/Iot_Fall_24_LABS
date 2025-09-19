/* 
Purpose: Main entry point of the application.
Implementation: Set up the Express server, configure middleware,
integrate routes, and start the server.
*/

// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const roomRoutes = require('./routes/roomRoutes');
const { startLogging } = require('./plugins/sensorPlugin');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Route ordering tip: static before dynamic is already handled in roomRoutes file
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Smart Room API listening on http://localhost:${PORT}`);
  // Start sensor after server starts
  startLogging();
});
