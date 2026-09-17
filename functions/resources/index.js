import { absolute, escapeHtml, layout, loadResources, responseHeaders } from '../_lib/resources.js';

export async function onRequestGet({ request, env }) {
  const resources = await loadResources(env, request);
  const list = resources.length ? `<div class="resource-list">${resources.map(item => `<article><p class="category">${escapeHtml(item.category || 'Resource')}</p><h2><a href="/resources/${encodeURIComponent(item.slug)}/">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.description)}</p><a class="read" href="/resources/${encodeURIComponent(item.slug)}/">閱讀內容 →</a></article>`).join('')}</div>` : '<div class="empty-state"><p>這裡會慢慢整理我實際用過、想過，也覺得值得留下來的東西。</p><small>第一份內容正在準備中。</small></div>';
  const body = `<main class="resource-index"><p class="kicker">KZ RESOURCES</p><h1>可以帶走、<br>也可以真的用上的內容。</h1><p class="intro">想法、練習、Checklist 和工具。數量不用多，每一份都希望真的有幫助。</p>${list}</main><footer><a href="/">回到 KZ 首頁</a></footer>`;
  return new Response(layout({ title: 'Resources｜KZ', description: 'KZ 整理的想法、練習、Checklist 與實用工具。', canonical: absolute('/resources/'), body }), { headers: { ...responseHeaders, 'X-KZ-Resource-Route': 'dynamic' } });
}
