import assert from 'node:assert/strict';
import { onRequestPost as eventPost } from '../functions/api/events.js';
import { onRequestGet as analyticsGet } from '../functions/api/analytics.js';
import { onRequestGet as resourceGet } from '../functions/resources/[slug].js';

function database({ recent = 0 } = {}) {
  const writes = [];
  return {
    writes,
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() { return { total: recent }; },
        async run() { writes.push({ sql, values: this.values }); return { success: true }; }
      };
    }
  };
}

const valid = {
  event_name: 'scroll_50', page_path: '/', referrer: 'instagram.com', device_type: 'Mobile',
  utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'test', utm_content: 'test01',
  scroll_depth: 50, session_id: '12345678-1234-4234-9234-123456789abc'
};

const db = database();
let response = await eventPost({
  request: new Request('https://kz-personal-website.pages.dev/api/events', { method: 'POST', headers: { Origin: 'https://kz-personal-website.pages.dev', 'Content-Type': 'application/json' }, body: JSON.stringify(valid) }),
  env: { ANALYTICS_DB: db }
});
assert.equal(response.status, 202);
assert.equal(db.writes.length, 1);
assert.equal(db.writes[0].values[0], 'scroll_50');
assert.equal(db.writes[0].values[3], 'Instagram');

response = await eventPost({ request: new Request('https://kz-personal-website.pages.dev/api/events', { method: 'POST', body: '{' }), env: { ANALYTICS_DB: database() } });
assert.equal(response.status, 400);

response = await eventPost({ request: new Request('https://kz-personal-website.pages.dev/api/events', { method: 'POST', body: JSON.stringify({ ...valid, event_name: 'made_up_event' }) }), env: { ANALYTICS_DB: database() } });
assert.equal(response.status, 400);

response = await eventPost({ request: new Request('https://kz-personal-website.pages.dev/api/events', { method: 'POST', body: JSON.stringify(valid) }), env: { ANALYTICS_DB: database({ recent: 80 }) } });
assert.equal(response.status, 429);

response = await analyticsGet({ request: new Request('https://kz-personal-website.pages.dev/api/analytics'), env: {} });
assert.equal(response.status, 503);

const fixture = { resources: [{ published: true, slug: 'test-resource', title: '測試內容', description: '說明', published_date: '2026-09-17', content: [{ heading: '第一段', paragraphs: ['內容'] }] }] };
response = await resourceGet({
  request: new Request('https://kz-personal-website.pages.dev/resources/test-resource/'),
  env: { ASSETS: { fetch: async () => new Response(JSON.stringify(fixture), { status: 200 }) } },
  params: { slug: 'test-resource' }
});
assert.equal(response.status, 200);
const html = await response.text();
assert.match(html, /<h1>測試內容<\/h1>/);
assert.match(html, /Article/);
assert.match(html, /data-resource-slug="test-resource"/);

console.log('analytics and resources tests passed');
