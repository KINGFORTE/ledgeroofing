import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
import pg from '../server/node_modules/pg/lib/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = process.env.API_ENV_FILE || path.join(root, 'server', '.env');
const env = dotenv.parse(await fs.readFile(envPath));
if (!env.DATABASE_URL || !env.UPLOAD_DIR) throw new Error('DATABASE_URL and UPLOAD_DIR are required in API_ENV_FILE.');

const vite = await createServer({ configFile: path.join(root, 'vite.config.js'), logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { Pool } = pg;
const pool = new Pool({ connectionString: env.DATABASE_URL });
const mediaRoot = path.join(root, 'project media for web - Copy');
const publicRoot = path.join(path.resolve(env.UPLOAD_DIR), 'public', 'site-content');

async function localMediaUrl(url) {
  if (!url || !url.startsWith('/')) return url || '';
  const relative = decodeURIComponent(url.replace(/^\/+/, ''));
  const source = path.resolve(root, relative);
  if (!source.startsWith(`${mediaRoot}${path.sep}`)) throw new Error(`Unexpected site media path: ${relative}`);
  const bytes = await fs.readFile(source);
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 24);
  const extension = path.extname(source).toLowerCase();
  const filename = `${digest}${extension}`;
  await fs.mkdir(publicRoot, { recursive: true });
  const destination = path.join(publicRoot, filename);
  try { await fs.access(destination); } catch { await fs.writeFile(destination, bytes, { flag: 'wx', mode: 0o644 }); }
  return `/uploads/site-content/${filename}`;
}

function slugify(value) {
  return String(value).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function blogBody(detail) {
  if (!detail) return '';
  return [
    detail.intro,
    ...(detail.sections || []).flatMap((section) => [
      section.h2,
      ...(section.paragraphs || []),
      ...(section.tip ? [`Tip: ${section.tip}`] : []),
    ]),
    detail.takeaway ? `Key takeaway\n${detail.takeaway}` : '',
  ].filter(Boolean).join('\n\n');
}

let copiedRows = 0;
let inserted = { project: 0, blog: 0 };
let coordinatesBackfilled = 0;
try {
  const [{ PROJECT_MEDIA }, { BLOG_POSTS }, { BLOG_CONTENT }] = await Promise.all([
    vite.ssrLoadModule('/src/utils/projectMedia.js'),
    vite.ssrLoadModule('/src/utils/constants.js'),
    vite.ssrLoadModule('/src/utils/blogContent.js'),
  ]);

  const existing = await pool.query('SELECT type, slug FROM content_items');
  const existingKeys = new Set(existing.rows.map((row) => `${row.type}:${row.slug}`));
  const rows = [];

  for (const project of PROJECT_MEDIA) {
    const slug = slugify(project.title);
    const media = [...project.images, ...project.videos];
    const urls = await Promise.all(media.map(localMediaUrl));
    copiedRows += urls.length;
    const imageUrls = urls.filter((url) => !/\.(mp4|mov|m4v|webm)$/i.test(url));
    const videoUrls = urls.filter((url) => /\.(mp4|mov|m4v|webm)$/i.test(url));
    const gallery = [...imageUrls.slice(1), ...videoUrls];
    rows.push({
      type: 'project', slug, title: project.title, excerpt: project.description,
      category: project.category, coverImage: imageUrls[0] || videoUrls[0] || '',
      featured: false, publishedAt: `${project.year || new Date().getFullYear()}-12-31T12:00:00.000Z`,
      content: { gallery, images: imageUrls, videos: videoUrls, location: project.location, coords: project.coords, scope: project.scope, year: project.year, tagline: project.tagline, description: project.description, fullDescription: project.fullDescription, meta: project.meta },
    });
  }

  for (const post of BLOG_POSTS) {
    const image = await localMediaUrl(post.image);
    if (image) copiedRows += 1;
    const detail = BLOG_CONTENT[post.slug] || {};
    rows.push({
      type: 'blog', slug: post.slug, title: post.title, excerpt: post.excerpt,
      category: post.category || post.tag, coverImage: image, featured: Boolean(post.featured),
      publishedAt: new Date(post.published).toISOString(),
      content: { body: blogBody(detail), intro: detail.intro || '', sections: detail.sections || [], takeaway: detail.takeaway || '', read: post.read, author: post.author, sourceDate: post.date },
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of rows) {
      if (existingKeys.has(`${row.type}:${row.slug}`)) {
        if (row.type === 'project' && Array.isArray(row.content.coords)) {
          const backfill = await client.query(
            `UPDATE content_items SET content = jsonb_set(content, '{coords}', $2::jsonb, TRUE), updated_at = NOW()
             WHERE type = 'project' AND slug = $1 AND (content->'coords' IS NULL OR content->'coords' = 'null'::jsonb)`,
            [row.slug, JSON.stringify(row.content.coords)]
          );
          coordinatesBackfilled += backfill.rowCount;
        }
        continue;
      }
      await client.query(
        `INSERT INTO content_items (type, slug, title, excerpt, category, cover_image, status, featured, content, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'published', $7, $8::jsonb, $9)
         ON CONFLICT (type, slug) DO NOTHING`,
        [row.type, row.slug, row.title, row.excerpt, row.category, row.coverImage, row.featured, JSON.stringify(row.content), row.publishedAt]
      );
      inserted[row.type] += 1;
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  console.log(`Seeded ${inserted.project} projects and ${inserted.blog} blog posts; restored coordinates for ${coordinatesBackfilled} existing projects; processed ${copiedRows} media references.`);
} finally {
  await pool.end();
  await vite.close();
}
