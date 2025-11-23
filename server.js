const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESP_FILE = path.join(__dirname, 'responses.json');

// simple admin secret (change before deploy)
const ADMIN_SECRET = process.env.ADMIN_SECRET || '0000';

// ensure responses file exists
if (!fs.existsSync(RESP_FILE)) fs.writeFileSync(RESP_FILE, '[]', 'utf8');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static site files (index.html, admin.html, confirmation.html, etc.)
app.use(express.static(path.join(__dirname)));

app.post('/submit', (req, res) => {
    try {
        const payload = req.body || {};
        // add timestamp
        payload.submittedAt = new Date().toISOString();

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

// protected endpoint to fetch responses (simple secret via query param)
app.get('/responses', (req, res) => {
    const admin = req.query.admin || '';
    if (admin !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
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