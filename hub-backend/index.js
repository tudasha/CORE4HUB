import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { WebSocketServer } from 'ws';
import cron from 'node-cron';
import http from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins (including Capacitor's empty origin or localhost)
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-smarthub-key';

// Initialize DB schema
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        subscription TEXT DEFAULT 'free',
        modules JSONB DEFAULT '[]',
        location TEXT DEFAULT 'Cluj-Napoca',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        sensor_type TEXT NOT NULL,
        value FLOAT,
        unit TEXT,
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS community_hubs (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        owner_id INTEGER REFERENCES users(id),
        members JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMPTZ,
        end_time TIMESTAMPTZ,
        color TEXT DEFAULT '#6366f1'
      );
    `);
    
    // Safety check for old schema that didn't have password_hash
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
      console.log('✅ Added password_hash to users table');
    } catch (e) {
      if (e.code !== '42701') { // 42701 = column already exists
        console.error('Info: users table may already have password_hash');
      }
    }

    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ DB init error:', err);
  }
}

// ── Auth Middleware ─────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ── Auth Routes ─────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, subscription, location',
      [name, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, subscription, location, modules FROM users WHERE id = $1', [req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sensor Routes ───────────────────────────────────────────

let currentEnergyPrice = 120.5; // fallback price EUR/MWh

// Fetch live energy prices from energy-charts for Romania
async function fetchLiveEnergyPrice() {
  try {
    const response = await fetch('https://api.energy-charts.info/price?bzn=RO');
    const data = await response.json();
    const now = Math.floor(Date.now() / 1000);
    const index = data.unix_seconds.findIndex(t => t > now) - 1;
    if (index >= 0 && data.price[index]) {
      currentEnergyPrice = data.price[index];
      console.log(`[Energy] Live price updated: ${currentEnergyPrice} EUR/MWh`);
    }
  } catch (e) {
    console.error('[Energy] Failed to fetch live price, using previous value.', e.message);
  }
}

// Fetch initially and then every 15 minutes
fetchLiveEnergyPrice();
setInterval(fetchLiveEnergyPrice, 15 * 60 * 1000);

function generateMockSensors() {
  return {
    temperature: (18 + Math.random() * 12).toFixed(1),
    humidity: (40 + Math.random() * 40).toFixed(1),
    airQuality: Math.floor(30 + Math.random() * 70),
    electricFlow: (1.2 + Math.random() * 3.8).toFixed(2),
    energyPrice: currentEnergyPrice, // LIVE energy price (EUR/MWh)
    heartRate: Math.floor(80 + Math.random() * 20),
    oxygenLevel: (96 + Math.random() * 3).toFixed(1),
    steps: Math.floor(Math.random() * 12000),
    uvIndex: (Math.random() * 10).toFixed(1),
    waterQuality: Math.floor(70 + Math.random() * 30),
    solarOutput: (Math.random() * 5).toFixed(2),
  };
}

app.get('/api/sensors/live', authenticateToken, (req, res) => {
  res.json({ success: true, data: generateMockSensors(), timestamp: new Date() });
});

app.post('/api/sensors/ingest', authenticateToken, async (req, res) => {
  const { readings } = req.body;
  try {
    for (const [type, value] of Object.entries(readings)) {
      await pool.query(
        'INSERT INTO sensor_readings (user_id, sensor_type, value) VALUES ($1, $2, $3)',
        [req.user.id, type, value]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Arduino Sensor Ingestion (No user auth — uses device token) ──────────────
// The Arduino posts to this endpoint with a shared DEVICE_TOKEN from the .env
app.post('/api/arduino/data', async (req, res) => {
  const deviceToken = req.headers['x-device-token'];
  if (!deviceToken || deviceToken !== process.env.ARDUINO_DEVICE_TOKEN) {
    return res.status(401).json({ error: 'Invalid device token' });
  }

  const { temperature, pressure, altitude, light_level, humidity, motion_detected, device_id } = req.body;

  try {
    // Persist to DB
    const values = [
      ['temperature',     temperature],
      ['humidity',        humidity],
      ['pressure',        pressure],
      ['altitude',        altitude],
      ['light_level',     light_level],
      ['motion_detected', motion_detected ? 1 : 0],
    ].filter(([, v]) => v !== undefined && v !== null);

    for (const [type, value] of values) {
      await pool.query(
        'INSERT INTO sensor_readings (sensor_type, value, unit) VALUES ($1, $2, $3)',
        [type, value, type === 'temperature' ? '°C' : type === 'pressure' ? 'hPa' : type === 'altitude' ? 'm' : type === 'light_level' ? 'lux' : '']
      );
    }

    // Build live sensor payload and broadcast to all connected dashboard clients
    const livePayload = {
      temperature:      temperature     ?? null,
      humidity:         humidity        ?? null,
      pressure:         pressure        ?? null,
      altitude:         altitude        ?? null,
      lightLevel:       light_level     ?? null,
      motionDetected:   motion_detected ?? false,
      deviceId:         device_id       || 'arduino-1',
      source:           'arduino',
    };

    broadcast({ type: 'ARDUINO_UPDATE', data: livePayload, timestamp: new Date() });

    // Alert if motion detected
    if (motion_detected) {
      broadcast({
        type: 'ALERT',
        level: 'info',
        message: `🚶 Motion detected by sensor (${device_id || 'arduino-1'}) at ${new Date().toLocaleTimeString()}`,
        timestamp: new Date(),
      });
    }

    console.log(`[Arduino] Data received from ${device_id || 'unknown'}:`, livePayload);
    res.json({ success: true, received: livePayload });
  } catch (err) {
    console.error('[Arduino] Ingest error:', err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/ai/messages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100', [req.user.id]);
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/messages', authenticateToken, async (req, res) => {
  const { role, content } = req.body;
  try {
    await pool.query('INSERT INTO ai_messages (user_id, role, content) VALUES ($1, $2, $3)', [req.user.id, role, content]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Proxy for Gemini AI — with automatic model fallback
app.post('/api/gemini', async (req, res) => {
  const { messages } = req.body;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing GEMINI_API_KEY in backend .env' });

  // Try models in order until one works (handles quota/demand spikes)
  const MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ];

  const payload = {
    contents: messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200,
    }
  };

  let lastError = null;
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
      
      // Gemini sometimes returns 200 with an error body — check for it
      if (response.data?.error) {
        const errMsg = response.data.error.message || JSON.stringify(response.data.error);
        const isTransient = errMsg.includes('quota') || errMsg.includes('demand') || errMsg.includes('429') || errMsg.includes('503');
        if (isTransient) {
          console.warn(`[Gemini] Model ${model} busy/quota, trying next...`);
          lastError = errMsg;
          continue; // try next model
        }
        return res.json({ error: errMsg });
      }

      console.log(`[Gemini] Success with model: ${model}`);
      return res.json(response.data);
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error?.message || err.message;
      const isTransient = status === 429 || status === 503 || errMsg?.includes('quota') || errMsg?.includes('demand');
      if (isTransient) {
        console.warn(`[Gemini] Model ${model} error (${status}), trying next...`);
        lastError = errMsg;
        continue;
      }
      // Non-transient error (like invalid key) — fail immediately
      return res.status(500).json({ error: errMsg });
    }
  }

  // All models failed
  res.status(503).json({ error: lastError || 'All Gemini models are currently unavailable. Please try again in a moment.' });
});


// ── External Live APIs (Proxy) ──────────────────────────────

app.get('/api/weather', async (req, res) => {
  const { city = 'Cluj-Napoca' } = req.query;
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing OPENWEATHER_API_KEY in backend .env' });
  
  try {
    const geoRes = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${key}`);
    if (!geoRes.data.length) return res.status(404).json({ error: 'City not found' });
    const { lat, lon } = geoRes.data[0];
    
    // We fetch OneCall or Weather based on availability, OpenWeather 2.5 general
    const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`);
    const forecastRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`);
    
    const airRes = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`);
    
    res.json({
      weather: weatherRes.data,
      forecast: forecastRes.data,
      airQuality: airRes.data
    });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

app.get('/api/transit/live', async (req, res) => {
  const key = process.env.TRAFFIC_API_KEY || process.env.TRAFIC_API_KEY;
  
  try {
    if (key) {
      // Live Tranzy request for all active vehicles/routes in Cluj
      const tranzyHeaders = {
        'X-API-KEY': key,
        'X-Agency-Id': '2', // 2 is CTP Cluj
        'Accept': 'application/json'
      };

    try {
      // Extended timeout to 8 seconds since Tranzy can be slow, but hide the silent fallback from console
      const response = await axios.get('https://api.tranzy.ai/v1/opendata/vehicles', { headers: tranzyHeaders, timeout: 8000 });
      const vehicles = response.data;
      
      // We map the vehicles to top generic lines for UI demo purposes if they are available
      const lines = {};
      Object.values(vehicles || {}).forEach(v => {
        const name = v.route_short_name || v.route_id;
        if (name) {
          if (!lines[name]) lines[name] = [];
          lines[name].push(v);
        }
      });

      // Pick top ones for the user's dashboard (e.g. 24B, M26, 30...) contextualizing them for user
      const userRelevantContexts = {
        '24B': 'VIVO! -> Centre (To Gym)',
        'M26': 'Florești -> Plopilor (To Office)',
        '35': 'Zorilor -> Gara (To Meeting)'
      };

      const userRelevantLines = ['24B', 'M26', '35'].filter(l => lines[l]).map(l => ({
        name: `Bus ${l} — ${userRelevantContexts[l] || 'CTP Cluj'}`,
        duration: Math.floor(2 + Math.random() * 8), // simulated ETA until Tranzy stop ETAs are fully aggregated
        traffic: 'On Time'
      }));

      // If we found live buses:
      if (userRelevantLines.length > 0) {
        return res.json({
          success: true,
          provider: 'Tranzy Live',
          message: 'Transit data retrieved successfully',
          travelTime: 22,
          level: 'Running',
          incidents: 0,
          routes: userRelevantLines
        });
      }
    } catch (e) {
      // Quietly fall back, Tranzy API rate limits or OpenData servers can be slow.
    }
    } // end if(key)

    // Fallback: Safe structured format with Tranzy-like data just in case the key is invalid or API is down
    res.json({
      success: true,
      provider: 'Tranzy Scheduled',
      message: 'Using static schedule fallback',
      travelTime: 24,
      level: 'Moderate',
      incidents: 1,
      routes: [
        { name: 'Bus 24B — VIVO! -> Centre (To Gym)', duration: Math.floor(3 + Math.random() * 5), traffic: 'On Time' },
        { name: 'Bus M26 — Florești -> Plopilor (To Office)', duration: Math.floor(6 + Math.random() * 8), traffic: 'Delayed' },
        { name: 'Tram 102 — Mănăștur -> Gară (To Station)', duration: Math.floor(2 + Math.random() * 4), traffic: 'On Time' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── HTTP + WebSocket Server ───────────────────────────────

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🔌 WebSocket client connected');
  ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(payload);
  });
}

cron.schedule('*/3 * * * * *', () => {
  const sensors = generateMockSensors();
  broadcast({ type: 'SENSOR_UPDATE', data: sensors, timestamp: new Date() });

  if (parseFloat(sensors.electricFlow) > 4.5) {
    broadcast({
      type: 'ALERT',
      level: 'warning',
      message: `⚡ Electric spike detected: ${sensors.electricFlow}A — check your appliances!`,
      timestamp: new Date(),
    });
  }
});

server.listen(port, async () => {
  await initDb();
  console.log(`🚀 Smart Hub Backend running on http://localhost:${port}`);
});
