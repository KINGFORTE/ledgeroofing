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

const PROJECT_DETAILS = {
  'Alausa heights_': {
    location: 'Ikeja, Lagos',
    coords: [6.6125, 3.351],
    scope: 'Residential complex · 18,000 sq ft',
    year: '2024',
    tagline: 'Elevated living, silently secured.',
    description:
      'A multi-level residential complex in Ikeja, re-roofed with high-tensile steel sheeting, concealed gutters and a fully ventilated ridge system.',
    fullDescription:
      'Alausa Heights needed a roof that could carry technicians\u2019 foot traffic and stay watertight through torrential rains. We engineered a high-tensile steel system with concealed fasteners, insulated cladding for thermal comfort and a pressure-tested gutter network. The building is quieter, cooler and completely leak-free \u2014 with a maintenance-free finish built to outlast the decade.',
  },
  'Alfred Court Project': {
    location: 'Ikoyi, Lagos',
    coords: [6.4512, 3.4361],
    scope: 'Luxury duplex estate · 12,500 sq ft',
    year: '2025',
    tagline: 'Craftsmanship worthy of Ikoyi.',
    description:
      'Luxury duplexes in Ikoyi fitted with premium long-span aluminum roofing, decorative fascia and precision-cut valleys over elegant living spaces.',
    fullDescription:
      'Alfred Court demanded architectural precision. We delivered long-span aluminum sheeting with hidden battens, hand-cut valley flashings and a custom zinc fascia line that mirrors the building\u2019s clean geometry. Every roof plane was laser-levelled and flashed to handle drainage at twice the local code requirement \u2014 a roof built to disappear into the architecture.',
  },
  'Green Park': {
    location: 'Victoria Garden City, Lagos',
    coords: [6.4526, 3.57],
    scope: 'Gated estate · 15,000 sq ft',
    year: '2024',
    tagline: 'Quiet luxury, built to last.',
    description:
      'A gated-community estate re-roofed with premium stone-coated steel tiles and a fully insulated ceiling assembly.',
    fullDescription:
      'Across a gated-community estate, we replaced aging shingles with stone-coated steel tiles that mirror natural slate without the maintenance. We upgraded the ceiling insulation to cut cooling costs and re-flashed every chimney, vent and skylight. Homeowners gained a dramatic curb elevation and an energy bill that dropped noticeably within the first month.',
  },
  'koko beach resort': {
    location: 'Badagry, Lagos',
    coords: [6.4149, 2.881],
    scope: 'Beach resort · 24,000 sq ft',
    year: '2025',
    tagline: 'Coastal beauty, salt-air tough.',
    description:
      'Beachfront resort roofs finished in marine-grade materials engineered to resist salt spray and coastal winds.',
    fullDescription:
      'Salt air destroys ordinary roofs. For this Badagry beachfront resort we specified marine-grade aluminum and coated fixings that resist corrosion, with hip roofs designed to shed coastal gusts. The guest villas got a modern standing-seam upgrade that keeps the resort\u2019s character while adding real storm protection and fire resistance.',
  },
  'lagos mall project': {
    location: 'Ikeja, Lagos',
    coords: [6.6322, 3.3607],
    scope: 'Retail mall · 60,000 sq ft',
    year: '2024',
    tagline: 'Big footprint, flawless coverage.',
    description:
      'A 60,000 sq ft retail mall re-roofed in sections with zero business interruption and a fully engineered drainage system.',
    fullDescription:
      'Re-roofing an operating mall means working while shoppers shop. We phased the job into night and closed-hours windows, installing a low-slope commercial membrane system with 20-year performance credentials. New roof drains and scuppers were sized for Lagos\u2019s heaviest downpours, while skylight zones were preserved to keep natural light in the atrium.',
  },
  'Lutos Capital Bank': {
    location: 'Victoria Island, Lagos',
    coords: [6.4281, 3.4219],
    scope: 'Corporate HQ · 28,000 sq ft',
    year: '2023',
    tagline: 'A landmark address, fortified.',
    description:
      'Corporate headquarters fitted with a TPO commercial roof, reinforced parapet flashings and a 25-year warranted system.',
    fullDescription:
      'A Victoria Island bank headquarters demanded a system that screams stability. We installed a fully adhered TPO membrane with reinforced parapet flashings, roof access walkways and lightning protection. Work was completed under strict security protocols with after-hours access, and the roof now carries a 25-year manufacturer warranty.',
  },
  'Maison Silene': {
    location: 'Lekki, Lagos',
    coords: [6.4474, 3.4726],
    scope: 'Luxury villa · 8,000 sq ft',
    year: '2025',
    tagline: 'Architecture deserves a perfect crown.',
    description:
      'A bespoke Lekki villa with curved long-span roofing, clerestory glazing flashings and custom copper detailing.',
    fullDescription:
      'Maison Silene is an architect\u2019s showcase, and the roof had to disappear into the design. We hand-formed curved aluminum panels around the villa\u2019s sweeping roofline, flashed the clerestory glazing watertight and finished the ridges with custom copper capping. The result reads as a seamless part of the architecture \u2014 and protects it for decades.',
  },
  'Medbury Hospital': {
    location: 'Ikeja, Lagos',
    coords: [6.5966, 3.3532],
    scope: 'Healthcare facility · 45,000 sq ft',
    year: '2024',
    tagline: 'Reliability where lives depend on it.',
    description:
      'Healthcare facility re-roofed with a non-combustible system, redundant drainage and full fall-protection for maintenance crews.',
    fullDescription:
      'A hospital roof can\u2019t fail. We installed a non-combustible, low-maintenance system with redundant drain paths, sealed penetrations for medical exhaust and HVAC, and permanent anchor points so future maintenance crews work with certified fall protection. Work was scheduled around patient safety and kept fully segregated from active clinical areas.',
  },
  'Nautica Beach': {
    location: 'Lekki coastline, Lagos',
    coords: [6.435, 3.508],
    scope: 'Beachfront estate · 20,000 sq ft',
    year: '2025',
    tagline: 'Front-row coastal living, storm-ready.',
    description:
      'Beachfront estate in Lekki with standing-seam steel, hurricane-rated fixings and a coastal corrosion warranty.',
    fullDescription:
      'For this Lekki beachfront estate, corrosive salt spray was the enemy. We used 26-gauge standing-seam steel with ZAM-coated fixings, elevated flashing details and wind-rated clips designed for coastal storms. The estate\u2019s infinity-edge sightlines were preserved while gaining a roof that shrugs off monsoon seasons.',
  },
  'Niger Dock Factory_': {
    location: 'Apapa, Lagos',
    coords: [6.4502, 3.378],
    scope: 'Industrial facility · 80,000 sq ft',
    year: '2023',
    tagline: 'Industrial strength, engineered for uptime.',
    description:
      'Heavy-industrial facility re-roofed over live operations with standing-seam steel and corrosion-resistant finishes.',
    fullDescription:
      'A working factory can\u2019t stop for a roof. We replaced 80,000 sq ft of corroded sheeting in staged lifts over live production lines, using standing-seam steel with PVDF coatings that withstand industrial exhaust and coastal humidity. New translucent panels doubled natural daylight inside, cutting energy use while the facility stayed fully operational throughout.',
  },
};

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

    const details = PROJECT_DETAILS[project.title] || {};

    return {
      id: slugify(project.title),
      title: project.title,
      category: inferCategory(project.title),
      images,
      videos,
      media,
      meta: `${images.length} photo${images.length === 1 ? '' : 's'} • ${videos.length} video${videos.length === 1 ? '' : 's'}`,
      location: details.location || 'Lagos, Nigeria',
      scope: details.scope || '',
      year: details.year || '',
      tagline: details.tagline || '',
      description:
        details.description ||
        'Premium roofing installation completed by the Ledge Roofing team.',
      fullDescription:
        details.fullDescription ||
        details.description ||
        'Premium roofing installation completed by the Ledge Roofing team.',
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));
