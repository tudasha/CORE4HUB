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
import crypto from 'crypto';

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
      CREATE TABLE IF NOT EXISTS health_steps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        steps INTEGER NOT NULL DEFAULT 0,
        goal INTEGER NOT NULL DEFAULT 10000,
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS health_meals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        icon TEXT DEFAULT '🍽️',
        calories FLOAT DEFAULT 0,
        protein FLOAT DEFAULT 0,
        carbs FLOAT DEFAULT 0,
        fat FLOAT DEFAULT 0,
        meal_type TEXT DEFAULT 'snack',
        recorded_at TIMESTAMPTZ DEFAULT NOW()
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
    electricFlow: (1.2 + Math.random() * 3.8).toFixed(2),
    energyPrice: currentEnergyPrice, // LIVE energy price (EUR/MWh)
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

  const { temperature, pressure, altitude, light_level, humidity, motion_detected, device_id, device_ip } = req.body;

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

    // Capture sender IP: prefer explicitly sent device_ip (works through production proxies),
    // fall back to socket/header detection
    const senderIp = device_ip
      || req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || req.ip;

    // Build live sensor payload and broadcast to all connected dashboard clients
    const livePayload = {
      temperature:      temperature     ?? null,
      humidity:         humidity        ?? null,
      pressure:         pressure        ?? null,
      altitude:         altitude        ?? null,
      lightLevel:       light_level     ?? null,
      motionDetected:   motion_detected ?? false,
      deviceId:         device_id       || 'arduino-1',
      arduinoIp:        senderIp,
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


// ── Core4Health: Step Counter API ───────────────────────────

app.post('/api/health/steps', authenticateToken, async (req, res) => {
  const { steps, goal = 10000 } = req.body;
  if (typeof steps !== 'number') return res.status(400).json({ error: 'steps must be a number' });
  try {
    const result = await pool.query(
      'INSERT INTO health_steps (user_id, steps, goal) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, steps, goal]
    );
    broadcast({ type: 'HEALTH_UPDATE', kind: 'steps', data: result.rows[0], userId: req.user.id, timestamp: new Date() });
    res.json({ success: true, record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health/steps', authenticateToken, async (req, res) => {
  const { days = 7 } = req.query;
  try {
    const result = await pool.query(
      `SELECT date_trunc('day', recorded_at) AS day, SUM(steps) AS steps, MAX(goal) AS goal
       FROM health_steps WHERE user_id = $1 AND recorded_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY day ORDER BY day ASC`,
      [req.user.id]
    );
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Core4Health: Food / Meal Log API ────────────────────────

app.post('/api/health/meals', authenticateToken, async (req, res) => {
  const { name, icon = '🍽️', calories = 0, protein = 0, carbs = 0, fat = 0, meal_type = 'snack' } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = await pool.query(
      'INSERT INTO health_meals (user_id, name, icon, calories, protein, carbs, fat, meal_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.id, name, icon, calories, protein, carbs, fat, meal_type]
    );
    broadcast({ type: 'HEALTH_UPDATE', kind: 'meal', data: result.rows[0], userId: req.user.id, timestamp: new Date() });
    res.json({ success: true, meal: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health/meals', authenticateToken, async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD, defaults to today
  const targetDate = date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT * FROM health_meals WHERE user_id = $1
       AND DATE(recorded_at AT TIME ZONE 'UTC') = $2
       ORDER BY recorded_at ASC`,
      [req.user.id, targetDate]
    );
    res.json({ success: true, meals: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/health/meals/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM health_meals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Core4Health: AI Food Estimation (Text & Image) ────────────

app.post('/api/food/ai-estimate', async (req, res) => {
  const { text, imageBase64 } = req.body;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing GEMINI_API_KEY in backend .env' });

  if (!text && !imageBase64) {
    return res.status(400).json({ error: 'Provide either text or imageBase64' });
  }

  try {
    const parts = [];
    if (text) {
      parts.push({ text: `Analyze this food: "${text}". Estimate the macros per reasonable serving.` });
    }
    if (imageBase64) {
      // imageBase64 comes as 'data:image/jpeg;base64,...'
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';
      parts.push({
        inlineData: { mimeType, data: base64Data }
      });
      if (!text) {
        parts.push({ text: 'Analyze this image of food and estimate the macros for the whole meal shown.' });
      }
    }

    const sysInstruct = `You are a nutrition expert API. Respond ONLY with a valid, clean JSON object. Do not wrap it in markdown. Do not include any explanations.
Format exactly like this:
{
  "name": "A concise, capitalized name for the food (max 4 words)",
  "calories": 250,
  "protein": 15,
  "carbs": 30,
  "fat": 10
}`;

    const payload = {
      systemInstruction: { parts: [{ text: sysInstruct }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
    };

    const MODELS = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ];

    let lastError = null;
    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
        
        if (response.data?.error) {
          const errMsg = response.data.error.message || JSON.stringify(response.data.error);
          const isTransient = errMsg.includes('quota') || errMsg.includes('demand') || errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('not found');
          if (isTransient) {
            lastError = errMsg;
            continue;
          }
          return res.status(500).json({ error: errMsg });
        }

        const modelText = response.data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(modelText);
        return res.json({ success: true, estimation: parsed });
      } catch (err) {
        const status = err.response?.status;
        const errMsg = err.response?.data?.error?.message || err.message;
        const isTransient = status === 429 || status === 503 || status === 404 || errMsg?.includes('quota') || errMsg?.includes('demand');
        if (isTransient) {
          lastError = errMsg;
          continue;
        }
        return res.status(500).json({ error: errMsg });
      }
    }

    return res.status(500).json({ error: `Failed to estimate macros after trying all models. Last error: ${lastError}` });
  } catch (err) {
    console.error('[Gemini AI Estimate Error]', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to estimate macros with AI. Please try again.' });
  }
});

// ── Core4Health: Barcode Scanner Proxy ────────────────────────

app.get('/api/food/barcode/:barcode', async (req, res) => {
  const { barcode } = req.params;
  const consumerKey = process.env.FATSECRET_CONSUMER_KEY;
  const consumerSecret = process.env.FATSECRET_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: 'Missing FatSecret API credentials on server' });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const params = {
      oauth_consumer_key: consumerKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
      method: 'food.find_id_for_barcode',
      barcode: barcode,
      format: 'json',
    };

    const sortedParams = Object.keys(params).sort().map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
    const signatureBaseString = `POST&${encodeURIComponent('https://platform.fatsecret.com/rest/server.api')}&${encodeURIComponent(sortedParams)}`;
    const signingKey = `${encodeURIComponent(consumerSecret)}&`;
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
    
    params.oauth_signature = signature;
    const searchParams = new URLSearchParams(params);

    // 1. Get Food ID from barcode
    const findRes = await axios.post('https://platform.fatsecret.com/rest/server.api', searchParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const foodId = findRes.data?.food_id?.value;
    if (!foodId) return res.status(404).json({ error: 'Product not found for this barcode' });

    // 2. Fetch full food details by ID
    // We can just redirect them to the existing GET /api/food/:id proxy, but it's simpler to fetch it here
    const params2 = {
      oauth_consumer_key: consumerKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
      method: 'food.get.v4',
      food_id: foodId,
      format: 'json',
    };

    const sorted2 = Object.keys(params2).sort().map(k => `${k}=${encodeURIComponent(params2[k])}`).join('&');
    const sigBase2 = `POST&${encodeURIComponent('https://platform.fatsecret.com/rest/server.api')}&${encodeURIComponent(sorted2)}`;
    const sig2 = crypto.createHmac('sha1', signingKey).update(sigBase2).digest('base64');
    params2.oauth_signature = sig2;

    const detailRes = await axios.post('https://platform.fatsecret.com/rest/server.api', new URLSearchParams(params2).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    res.json(detailRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to look up barcode' });
  }
});


// ── FatSecret Food Search Proxy (OAuth 1.0a) ─────────────────

function fatSecretSign(method, url, params, consumerKey, consumerSecret) {
  const sortedParams = Object.keys(params).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

app.get('/api/food/search', async (req, res) => {
  const { q, page = 0 } = req.query;
  if (!q) return res.status(400).json({ error: 'query required' });

  const consumerKey = process.env.FATSECRET_CONSUMER_KEY;
  const consumerSecret = process.env.FATSECRET_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) return res.status(500).json({ error: 'FatSecret credentials not configured' });

  const url = 'https://platform.fatsecret.com/rest/server.api';
  const params = {
    method: 'foods.search',
    search_expression: q,
    page_number: String(page),
    max_results: '20',
    format: 'json',
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
  };
  params.oauth_signature = fatSecretSign('GET', url, params, consumerKey, consumerSecret);

  try {
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.get('/api/food/:id', async (req, res) => {
  const consumerKey = process.env.FATSECRET_CONSUMER_KEY;
  const consumerSecret = process.env.FATSECRET_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) return res.status(500).json({ error: 'FatSecret credentials not configured' });

  const url = 'https://platform.fatsecret.com/rest/server.api';
  const params = {
    method: 'food.get.v4',
    food_id: req.params.id,
    format: 'json',
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
  };
  params.oauth_signature = fatSecretSign('GET', url, params, consumerKey, consumerSecret);

  try {
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
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


    // No live data available — return empty so UI shows no fake buses
    res.json({
      success: false,
      provider: 'Tranzy',
      message: 'Live transit data unavailable',
      level: 'Unavailable',
      routes: []
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
