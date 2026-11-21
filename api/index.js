const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../src/routes/api');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use('/api', apiRoutes);

// STATIC FRONTEND
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

module.exports = app;

// Buat jalan di lokal: node api/index.js
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`AlyzYumi jalan di http://localhost:${PORT}`));
}