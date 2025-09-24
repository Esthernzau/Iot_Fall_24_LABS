// Imports …
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const roomRoutes = require('./routes/roomRoutes');
const { startLogging } = require('./plugins/sensorPlugin');

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
app.set('view engine', 'ejs');
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
