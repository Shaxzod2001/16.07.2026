const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'signups.json');

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;

// A simple, reasonably permissive email regex suitable for server-side sanity
// checking (not a full RFC 5322 validator, but catches the common mistakes).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Simple JSON-file backed storage ------------------------------------
// Signups are kept in memory and the whole array is rewritten to disk on
// every change. Writes are done atomically (write to a temp file, then
// rename over the real file) so a crash mid-write can't corrupt the data
// file. This app is single-process and requests are handled sequentially
// by Node's event loop, so there is no concurrent-write race to worry
// about for a demo like this.

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function loadSignups() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read/parse signups.json, starting fresh:', err.message);
    return [];
  }
}

function saveSignups(signups) {
  ensureDataFile();
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(signups, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

// In-memory cache, loaded once at startup and kept in sync with disk.
let signups = loadSignups();

// --- App -----------------------------------------------------------------

const app = express();

// Parse JSON bodies; if the body is malformed JSON, respond with a clean
// 400 instead of letting Express's default error handler crash/500 it.
app.use(express.json());
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Request body must be valid JSON.' });
  }
  next(err);
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/signup', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  let { email, name } = body;

  if (typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  email = email.trim().slice(0, MAX_EMAIL_LENGTH);

  if (!EMAIL_REGEX.test(email) || email.length > MAX_EMAIL_LENGTH) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Name must be text.' });
    }
    name = name.trim().slice(0, MAX_NAME_LENGTH);
  } else {
    name = '';
  }

  const emailLower = email.toLowerCase();
  const isDuplicate = signups.some((s) => s.email.toLowerCase() === emailLower);
  if (isDuplicate) {
    return res.status(409).json({ success: false, error: 'This email is already on the waitlist.' });
  }

  const signup = {
    email,
    name,
    timestamp: new Date().toISOString(),
  };

  signups.push(signup);
  saveSignups(signups);

  const position = signups.length; // 1-indexed place in signup order

  return res.status(201).json({ success: true, position });
});

app.get('/api/count', (req, res) => {
  res.status(200).json({ count: signups.length });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
