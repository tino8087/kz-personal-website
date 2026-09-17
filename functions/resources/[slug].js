import { absolute, escapeHtml, layout, loadResources, responseHeaders } from '../_lib/resources.js';

function sectionHtml(section) {
  const paragraphs = Array.isArray(section.paragraphs) ? section.paragraphs : [];
  const list = Array.isArray(section.items) && section.items.length ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '';
  return `<section>${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ''}${paragraphs.map(item => `<p>${escapeHtml(item)}</p>`).join('')}${list}</section>`;
}

export async function onRequestGet({ request, env, params }) {
  if (params.slug === 'resources.css' || params.slug === 'resources.js') {
    return env.ASSETS.fetch(request);
  }
  const resources = await loadResources(env, request);
  const item = resources.find(resource => resource.slug === params.slug);
  if (!item) return new Response('Resource not found.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=UTF-8', 'X-Robots-Tag': 'noindex' } });
  const canonical = absolute(`/resources/${encodeURIComponent(item.slug)}/`);
  const sections = Array.isArray(item.content) ? item.content.map(sectionHtml).join('') : '';
  const practical = item.practical?.heading ? `<aside class="practical"><h2>${escapeHtml(item.practical.heading)}</h2>${(item.practical.items || []).map(value => `<p>${escapeHtml(value)}</p>`).join('')}</aside>` : '';
  const cta = item.cta?.url && item.cta?.label ? `<a class="resource-cta" href="${escapeHtml(item.cta.url)}" data-resource-cta data-placement="resource_end">${escapeHtml(item.cta.label)} →</a>` : '';
  const download = item.download?.url && item.download?.label ? `<a class="download" href="${escapeHtml(item.download.url)}" data-resource-download download>${escapeHtml(item.download.label)} ↓</a>` : '';
  const body = `<main class="article"><article><header><p class="category">${escapeHtml(item.category || 'Resource')}</p><h1>${escapeHtml(item.title)}</h1><p class="dek">${escapeHtml(item.description)}</p><p class="dates">發布 ${escapeHtml(item.published_date || '')}${item.updated_date ? ` · 更新 ${escapeHtml(item.updated_date)}` : ''}</p></header><div class="article-body">${sections}${practical}${download}</div><footer class="article-end"><p>如果這篇對你有幫助，可以看看我最近在做什麼。</p>${cta}<div class="end-links"><a href="/">KZ 首頁</a><a href="/resources/">其他 Resources</a></div></footer></article></main>`;
  const article = {'@context':'https://schema.org','@type':'Article',headline:item.title,description:item.seo_description || item.description,datePublished:item.published_date,dateModified:item.updated_date || item.published_date,mainEntityOfPage:canonical,author:{'@type':'Person',name:'KZ'}};
  return new Response(layout({ title: `${item.seo_title || item.title}｜KZ`, description: item.seo_description || item.description, canonical, body, resourceSlug: item.slug, article }), { headers: responseHeaders });
}
