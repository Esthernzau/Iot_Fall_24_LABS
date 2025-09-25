/*
This is the main entry point for the Smart Room application.
It sets up the Express server, middleware, routes, and starts the temperature logging process.
It also serves the frontend dashboard and provides health check endpoints
*/

// Imports …
require('dotenv').config(); // load .env config first
const express = require('express'); // Express framework
const cors = require('cors'); // CORS middleware
const morgan = require('morgan'); // HTTP request logger middleware
const path = require('path'); // Node.js path module
const roomRoutes = require('./routes/roomRoutes'); // Room-related API routes
const { startLogging } = require('./plugins/sensorPlugin'); // Temperature logging plugin

// Create Express app
const app = express();

//  Middleware setup
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 👇 prevent caching for ALL /api/* responses (put this BEFORE routes)
app.set('etag', false);  // stop ETag generation -> avoids 304s
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Views & static files
app.set('view engine', 'ejs'); // use EJS templates
app.set('views', path.join(__dirname, '..', 'views')); 
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/rooms', roomRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.render('dashboard'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Smart Room API listening on http://localhost:${PORT}`);
  startLogging();
});
