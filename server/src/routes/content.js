import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();
const TYPES = new Set(['project', 'blog']);

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    coverImage: row.cover_image,
    status: row.status,
    featured: row.featured,
    content: row.content,
    author: row.author_name || null,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

router.get('/:type', async (req, res, next) => {
  try {
    if (!TYPES.has(req.params.type)) return res.status(404).json({ error: 'Content type not found.' });
    const { rows } = await query(
      `SELECT c.*, u.name AS author_name
       FROM content_items c LEFT JOIN staff_users u ON u.id = c.author_id
       WHERE c.type = $1 AND c.status = 'published'
       ORDER BY c.featured DESC, c.published_at DESC NULLS LAST`,
      [req.params.type]
    );
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json({ items: rows.map(serialize) });
  } catch (error) {
    next(error);
  }
});

router.get('/manage/:type', requireAuth, requireRole('owner', 'admin', 'editor'), async (req, res, next) => {
  try {
    if (!TYPES.has(req.params.type)) return res.status(404).json({ error: 'Content type not found.' });
    const { rows } = await query(
      `SELECT c.*, u.name AS author_name
       FROM content_items c LEFT JOIN staff_users u ON u.id = c.author_id
       WHERE c.type = $1 ORDER BY c.updated_at DESC`,
      [req.params.type]
    );
    res.json({ items: rows.map(serialize) });
  } catch (error) {
    next(error);
  }
});

router.post('/:type', requireAuth, requireRole('owner', 'admin', 'editor'), async (req, res, next) => {
  try {
    if (!TYPES.has(req.params.type)) return res.status(404).json({ error: 'Content type not found.' });
    const { title, excerpt = '', category = '', coverImage = '', status = 'draft', featured = false, content = {}, slug } = req.body;
    if (!String(title || '').trim()) return res.status(400).json({ error: 'A title is required.' });
    if (!['draft', 'published'].includes(status)) return res.status(400).json({ error: 'Invalid content status.' });
    const safeSlug = slugify(slug || title);
    if (!safeSlug) return res.status(400).json({ error: 'A valid slug is required.' });
    const { rows } = await query(
      `INSERT INTO content_items (type, slug, title, excerpt, category, cover_image, status, featured, content, author_id, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, CASE WHEN $7 = 'published' THEN NOW() END)
       RETURNING *`,
      [req.params.type, safeSlug, String(title).trim(), String(excerpt), String(category), String(coverImage), status, Boolean(featured), JSON.stringify(content), req.auth.sub]
    );
    res.status(201).json({ item: serialize(rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That URL slug is already in use.' });
    next(error);
  }
});

router.put('/:type/:id', requireAuth, requireRole('owner', 'admin', 'editor'), async (req, res, next) => {
  try {
    if (!TYPES.has(req.params.type)) return res.status(404).json({ error: 'Content type not found.' });
    const { title, excerpt = '', category = '', coverImage = '', status = 'draft', featured = false, content = {}, slug } = req.body;
    if (!String(title || '').trim()) return res.status(400).json({ error: 'A title is required.' });
    if (!['draft', 'published'].includes(status)) return res.status(400).json({ error: 'Invalid content status.' });
    const { rows } = await query(
      `UPDATE content_items SET slug = $3, title = $4, excerpt = $5, category = $6,
         cover_image = $7, status = $8, featured = $9, content = $10::jsonb,
         published_at = CASE WHEN $8 = 'published' THEN COALESCE(published_at, NOW()) ELSE NULL END,
         updated_at = NOW()
       WHERE type = $1 AND id = $2 RETURNING *`,
      [req.params.type, req.params.id, slugify(slug || title), String(title).trim(), String(excerpt), String(category), String(coverImage), status, Boolean(featured), JSON.stringify(content)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Content item not found.' });
    res.json({ item: serialize(rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That URL slug is already in use.' });
    next(error);
  }
});

router.delete('/:type/:id', requireAuth, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    if (!TYPES.has(req.params.type)) return res.status(404).json({ error: 'Content type not found.' });
    const result = await query('DELETE FROM content_items WHERE type = $1 AND id = $2', [req.params.type, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Content item not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
