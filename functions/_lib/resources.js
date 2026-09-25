const SITE_URL = 'https://kz-personal-website.pages.dev';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export async function loadResources(env, request) {
  try {
    const url = new URL('/content/resources.json', request.url);
    const response = env.ASSETS ? await env.ASSETS.fetch(new Request(url, request)) : await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.resources) ? data.resources.filter(item => item?.published === true && item.slug) : [];
  } catch (_) { return []; }
}

export function layout({ title, description, canonical, body, resourceSlug = '', article = null }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const schema = article ? `<script type="application/ld+json">${JSON.stringify(article).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title><meta name="description" content="${safeDescription}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:title" content="${safeTitle}"><meta property="og:description" content="${safeDescription}"><meta property="og:url" content="${canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/resources/resources.css"><script src="/config.js" defer></script><script src="/tracking.js?v=2" defer></script>${schema}</head>
<body${resourceSlug ? ` data-resource-slug="${escapeHtml(resourceSlug)}"` : ''}><header class="resource-header"><a class="resource-logo" href="/">KZ</a><nav><a href="/">首頁</a><a href="/resources/" aria-current="page">RESOURCES</a></nav></header>${body}<script src="/resources/resources.js" defer></script></body></html>`;
}

export function absolute(path = '') {
  if (/^https:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const responseHeaders = {
  'Content-Type': 'text/html; charset=UTF-8',
  'Cache-Control': 'public, max-age=300',
  'X-Content-Type-Options': 'nosniff'
};
