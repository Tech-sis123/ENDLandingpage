const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESP_FILE = path.join(__dirname, 'responses.json');

// admin secret default -> 0000
const ADMIN_SECRET = process.env.ADMIN_SECRET || '0000';

// ensure responses file exists
if (!fs.existsSync(RESP_FILE)) {
  try { fs.writeFileSync(RESP_FILE, '[]', 'utf8'); } catch (e) { console.error('Could not create responses.json', e); }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static site
app.use(express.static(path.join(__dirname)));

// accept submissions
app.post('/submit', (req, res) => {
  try {
    const payload = req.body || {};
    payload.submittedAt = payload.submittedAt || new Date().toISOString();

    const raw = fs.readFileSync(RESP_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]');
    arr.push(payload);
    fs.writeFileSync(RESP_FILE, JSON.stringify(arr, null, 2), 'utf8');

    return res.json({ ok: true });
  } catch (err) {
    console.error('Save error', err);
    return res.status(500).json({ ok: false, error: 'save_failed' });
  }
});

// admin reads responses with secret
app.get('/responses', (req, res) => {
  const admin = req.query.admin || '';
  if (admin !== ADMIN_SECRET) return res.status(401).json({ ok:false, error: 'unauthorized' });
  try {
    const raw = fs.readFileSync(RESP_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]');
    return res.json({ ok: true, responses: arr });
  } catch (err) {
    console.error('Read error', err);
    return res.status(500).json({ ok: false, error: 'read_failed' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));