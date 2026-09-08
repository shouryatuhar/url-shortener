
import express from 'express';
import { nanoid } from 'nanoid';
import pool from '../db/index.js';

const router = express.Router();
router.post('/shorten', async (req, res) => {

  const { longUrl, customAlias, expiresAt } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: 'longUrl is required' });
  }

  
  try {
    new URL(longUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let shortCode = customAlias || nanoid(7);

  try {
    
    if (!customAlias) {
      let exists = true;
      while (exists) {
        const check = await pool.query(
          'SELECT id FROM urls WHERE short_code = $1',
          [shortCode]
        );
       
        if (check.rows.length === 0) {
          exists = false;
        } else {
          shortCode = nanoid(7); 
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO urls (short_code, long_url, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [shortCode, longUrl, expiresAt || null]
    );

    
    res.status(201).json(result.rows[0]);

 } catch (err) {
 
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That alias is already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/:code/stats', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const url = result.rows[0];

    
    res.json({
      shortCode: url.short_code,
      longUrl: url.long_url,
      createdAt: url.created_at,
      expiresAt: url.expires_at,
      clicks: url.clicks,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
router.get('/:code', async (req, res) => {
  // req.params.code grabs whatever was in the URL where ":code" is
  // e.g. visiting /5UL3rS2 makes req.params.code === "5UL3rS2"
  const { code } = req.params;

  if (code === 'favicon.ico') {
    return res.status(204).end();
  }

  try {
    const result = await pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const url = result.rows[0];

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This link has expired' });
    }

    // Increment the click counter every time someone visits
    // (fire-and-forget-ish, but we still await it to keep things simple)
    await pool.query(
      'UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1',
      [code]
    );

    // The actual redirect — sends the browser to the original long URL
    // 302 = temporary redirect (so it's NOT cached, meaning we track every visit)
    res.redirect(302, url.long_url);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;