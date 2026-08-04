const MEDIA_FILES = import.meta.glob(
  '../../project media for web - Copy/**/*.{jpeg,jpg,png,gif,webp,avif,mp4,mov,m4v,webm,JPEG,JPG,PNG,GIF,WebP,AVIF,MP4,MOV,M4V,WebM}',
  { eager: true, query: '?url', import: 'default' }
);

const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i;
const VIDEO_RE = /\.(mp4|mov|m4v|webm)$/i;

const CATEGORY_RULES = [
  {
    keywords: [
      'mall',
      'bank',
      'hospital',
      'factory',
      'dock',
      'office',
      'corporate',
      'plaza',
      'tower',
      'hotel',
      'industrial',
      'commercial',
      'warehouse',
      'store',
      'market',
      'school',
    ],
    category: 'Commercial Roofing',
  },
  {
    keywords: [
      'villa',
      'maison',
      'home',
      'house',
      'court',
      'park',
      'heights',
      'estate',
      'garden',
      'residence',
      'beach',
      'resort',
      'sea',
      'coast',
      'nautica',
      'view',
      'vista',
      'creek',
    ],
    category: 'Luxury Homes',
  },
];

const DEFAULT_CATEGORY = 'Asphalt Roofing';

function inferCategory(title) {
  const name = title.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) return rule.category;
  }
  return DEFAULT_CATEGORY;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const projects = new Map();

for (const [file, url] of Object.entries(MEDIA_FILES)) {
  const parts = file.split('/').filter(Boolean);
  const rootIndex = parts.indexOf('project media for web - Copy');
  const projectName = rootIndex >= 0 ? parts[rootIndex + 1] : undefined;
  const rest = rootIndex >= 0 ? parts.slice(rootIndex + 2) : [];
  if (!projectName || rest.length === 0) continue;

  let project = projects.get(projectName);
  if (!project) {
    project = { title: projectName, images: [], videos: [] };
    projects.set(projectName, project);
  }

  if (IMAGE_RE.test(file)) {
    project.images.push({ file, url });
  } else if (VIDEO_RE.test(file)) {
    project.videos.push({ file, url });
  }
}

export const PROJECT_MEDIA = [...projects.values()]
  .map((project) => {
    const images = project.images
      .sort((a, b) => a.file.localeCompare(b.file))
      .map((m) => m.url);
    const videos = project.videos
      .sort((a, b) => a.file.localeCompare(b.file))
      .map((m) => m.url);

    const media = [];
    images.forEach((url, index) => media.push({ id: `${project.title}-img-${index}`, url, type: 'image' }));
    videos.forEach((url, index) => media.push({ id: `${project.title}-vid-${index}`, url, type: 'video' }));

    return {
      id: slugify(project.title),
      title: project.title,
      category: inferCategory(project.title),
      images,
      videos,
      media,
      meta: `${images.length} photo${images.length === 1 ? '' : 's'} • ${videos.length} video${videos.length === 1 ? '' : 's'}`,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));
