import { useEffect } from 'react';

const DOMAIN = 'https://ledgeroofing.org';

export const SITE_NAME = 'Ledge Roofing';

export const DEFAULT_TITLE = 'Ledge Roofing | Professional Roofing & Roof Installation in Lagos';
export const DEFAULT_DESCRIPTION =
  'Ledge Roofing delivers premium residential and commercial roofing services in Lagos, Nigeria — roof installation, repair, replacement and 24/7 emergency response. Get a free estimate today.';

const DEFAULT_IMAGE = `${DOMAIN}/images/og-ledge.jpg`;

function upsertTag(tag, attrs, textContent) {
  let keyAttr;
  let key;

  if (tag === 'link') {
    keyAttr = 'rel';
    key = attrs.rel;
  } else if (attrs.property) {
    keyAttr = 'property';
    key = attrs.property;
  } else {
    keyAttr = 'name';
    key = attrs.name;
  }

  const selector = `${tag}[${keyAttr}="${key}"]`;
  let el = document.head.querySelector(selector);
  const created = !el;

  if (!el) {
    el = document.createElement(tag);
    document.head.appendChild(el);
  }

  Object.entries(attrs).forEach(([attr, value]) => {
    if (value) el.setAttribute(attr, value);
    else el.removeAttribute(attr);
  });

  if (textContent !== undefined) el.textContent = textContent;

  return created ? el : null;
}

function setJsonLd(jsonLd) {
  const id = 'ledge-page-jsonld';
  document.getElementById(id)?.remove();

  if (!jsonLd) return null;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
  return script;
}

export default function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd = null,
  publishedTime = null,
  modifiedTime = null,
}) {
  const canonical = `${DOMAIN}${path}`;
  const ogImage = image.startsWith('http') ? image : `${DOMAIN}${image}`;
  const ogType = type === 'article' ? 'article' : 'website';

  useEffect(() => {
    const created = [];
    const upsert = (attributes, content) => {
      const node = upsertTag('meta', attributes, content);
      if (node) created.push(node);
    };

    document.title = title;
    upsert({ name: 'description' }, description);

    upsert({ property: 'og:title' }, title);
    upsert({ property: 'og:description' }, description);
    upsert({ property: 'og:type' }, ogType);
    upsert({ property: 'og:url' }, canonical);
    upsert({ property: 'og:site_name' }, SITE_NAME);
    upsert({ property: 'og:locale' }, 'en_NG');
    upsert({ property: 'og:image' }, ogImage);
    upsert({ property: 'og:image:width' }, '1200');
    upsert({ property: 'og:image:height' }, '630');
    upsert({ property: 'og:image:alt' }, 'Ledge Roofing — premium roofing services in Lagos');
    if (type === 'article' && publishedTime) {
      upsert({ property: 'article:published_time' }, publishedTime);
    }
    if (type === 'article' && modifiedTime) {
      upsert({ property: 'article:modified_time' }, modifiedTime);
    }

    upsert({ name: 'twitter:card' }, 'summary_large_image');
    upsert({ name: 'twitter:title' }, title);
    upsert({ name: 'twitter:description' }, description);
    upsert({ name: 'twitter:image' }, ogImage);

    const canonicalLink = upsertTag('link', { rel: 'canonical', href: canonical });
    if (canonicalLink) created.push(canonicalLink);

    const jsonLdScript = setJsonLd(jsonLd);
    if (jsonLdScript) created.push(jsonLdScript);

    return () => {
      created.forEach((node) => node.remove());
    };
  }, [title, description, canonical, ogImage, ogType, jsonLd, publishedTime, modifiedTime, type]);

  return null;
}