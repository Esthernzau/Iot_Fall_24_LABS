/*
Purpose: Defines API routes related to room management.
Implementation: Implement routes for creating, retrieving, updating,
and deleting rooms. Handle light control and temperature logging.
*/

// src/routes/roomRoutes.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// staic routes first (no conflicts with dynamic routes)
// Turn on all lights
router.patch('/lights/on', async (req, res) => {
  try {
    await pool.query('UPDATE rooms SET light = TRUE');
    res.status(200).json({ message: 'All lights turned ON' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to turn on all lights' });
  }
});

// Turn off all lights
router.patch('/lights/off', async (req, res) => {
  try {
    await pool.query('UPDATE rooms SET light = FALSE');
    res.status(200).json({ message: 'All lights turned OFF' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to turn off all lights' });
  }
});

// Average temperature across all rooms
router.get('/average-temperature', async (req, res) => {
  try {
    // Handout references "temperatures" (non-existent). Use temperature_logs.
    const { rows } = await pool.query(
      'SELECT AVG(temperature)::float AS average_temperature FROM temperature_logs'
    );
    res.json({ average_temperature: rows[0].average_temperature });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute average temperature' });
  }
});

// // Get temperature logs - limit=50
router.get('/temperature-logs', async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const { rows } = await pool.query(
    `SELECT room_id, temperature, timestamp
     FROM temperature_logs
     ORDER BY timestamp DESC
     LIMIT $1`, [limit]
  );
  res.json(rows);
});

// GET /api/rooms/temperature-series?minutes=10&bucketSec=60
// Returns averaged points per room, bucketed by time (oldest -> newest).
router.get('/temperature-series', async (req, res) => {
  try {
    const minutes   = Number(req.query.minutes)   || 10;  // window size
    const bucketSec = Number(req.query.bucketSec) || 60;  // bucket size in seconds

    const { rows } = await pool.query(
      `
      WITH windowed AS (
        SELECT room_id, temperature, timestamp
        FROM temperature_logs
        WHERE timestamp >= NOW() - ($1::text || ' minutes')::interval
      ),
      bucketed AS (
        SELECT
          room_id,
          to_timestamp(floor(EXTRACT(EPOCH FROM timestamp) / $2) * $2) AT TIME ZONE 'UTC' AS bucket_ts,
          AVG(temperature)::float AS temperature
        FROM windowed
        GROUP BY room_id, bucket_ts
      )
      SELECT room_id, temperature, bucket_ts AS timestamp
      FROM bucketed
      ORDER BY room_id ASC, timestamp ASC;
      `,
      [minutes, bucketSec]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to load temperature series' });
  }
});




// --- Dynamic routes ---
// Create a new room
router.post('/', async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { rows } = await pool.query(
      'INSERT INTO rooms (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Room name already exists' });
    }
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms ORDER BY id');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    const { rows } = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'room not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Update light status for a room
router.patch('/:id/light', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

  const { light } = req.body;
  if (typeof light !== 'boolean') {
    return res.status(400).json({ error: 'light must be boolean' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE rooms SET light = $1 WHERE id = $2 RETURNING *',
      [light, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'room not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update light' });
  }
});

// Delete a room
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    const { rows } = await pool.query(
      'DELETE FROM rooms WHERE id = $1 RETURNING *',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'room not found' });
    res.json({ deleted: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;


