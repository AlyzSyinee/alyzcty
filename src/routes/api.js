const express = require('express');
const axios = require('axios');
const router = express.Router();
const hentaicity = require('../providers/hentaicity');

router.get('/', (req, res) => {
  res.json({
    status: 'AlyzYumi API Running',
    provider: 'hentaicity',
    endpoints: [
      '/api/hen/hentaicity/recent',
      '/api/hen/hentaicity/popular/1',
      '/api/hen/hentaicity/top/1',
      '/api/hen/hentaicity/info/:id',
      '/api/hen/hentaicity/watch/:id',
      '/api/stream?url=...'
    ]
  });
});

// RECENT
router.get('/hen/hentaicity/recent', async (req, res) => {
  try {
    const data = await hentaicity.scrapeRecent();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POPULAR
router.get('/hen/hentaicity/popular/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page || 1, 10);
    const data = await hentaicity.scrapePopular(page);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// TOP RATED
router.get('/hen/hentaicity/top/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page || 1, 10);
    const data = await hentaicity.scrapeTop(page);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// INFO
router.get('/hen/hentaicity/info/:id', async (req, res) => {
  try {
    const data = await hentaicity.scrapeInfo(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// WATCH
router.get('/hen/hentaicity/watch/:id', async (req, res) => {
  try {
    const data = await hentaicity.scrapeWatch(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PROXY MASTER - STREAM M3U8 + TS + VTT
router.get('/stream', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).json({ error: 'url required' });

  try {
    const isM3u8 = target.includes('.m3u8') || target.includes('m3u8');
    const response = await axios.get(target, {
      responseType: isM3u8 ? 'text' : 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.hentaicity.com/',
        'Origin': 'https://www.hentaicity.com'
      },
      timeout: 15000
    });

    if (isM3u8) {
      let text = response.data;
      // Rewrite semua .ts dan .m3u8 di dalam playlist biar lewat proxy juga
      const base = target.substring(0, target.lastIndexOf('/') + 1);
      text = text.split('\n').map(line => {
        const t = line.trim();
        if (!t || t.startsWith('#')) return line;
        const absolute = t.startsWith('http') ? t : base + t;
        return `/api/stream?url=${encodeURIComponent(absolute)}`;
      }).join('\n');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(text);
    }

    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.data.pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;