import { absolute, escapeHtml, loadResources } from './_lib/resources.js';

export async function onRequestGet({ request, env }) {
  const resources = await loadResources(env, request);
  const urls = [absolute('/'), absolute('/resources/'), ...resources.map(item => absolute(`/resources/${encodeURIComponent(item.slug)}/`))];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `\n  <url><loc>${escapeHtml(url)}</loc></url>`).join('')}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=UTF-8', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
}
