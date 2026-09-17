import { EVENT_NAMES, cleanPath, json, sourceFrom, text } from '../_lib/analytics.js';

const SESSION_PATTERN = /^[a-f0-9-]{16,64}$/i;
const DEVICES = new Set(['Mobile', 'Desktop', 'Tablet', 'Other']);

export async function onRequestPost({ request, env }) {
  if (!env.ANALYTICS_DB) return json({ ok: false, error: 'Analytics storage is not configured.' }, 503);
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== requestUrl.origin) return json({ ok: false, error: 'Origin not allowed.' }, 403);
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 8192) return json({ ok: false, error: 'Payload too large.' }, 413);

  let body;
  try { body = await request.json(); }
  catch (_) { return json({ ok: false, error: 'Invalid JSON.' }, 400); }

  const eventName = text(body.event_name, 60);
  const sessionId = text(body.session_id, 64);
  if (!EVENT_NAMES.has(eventName) || !SESSION_PATTERN.test(sessionId)) {
    return json({ ok: false, error: 'Invalid event.' }, 400);
  }

  const recent = await env.ANALYTICS_DB.prepare(
    "SELECT COUNT(*) AS total FROM analytics_events WHERE session_id = ?1 AND occurred_at >= datetime('now', '-10 minutes')"
  ).bind(sessionId).first();
  if ((recent?.total || 0) >= 80) return json({ ok: false, error: 'Rate limit exceeded.' }, 429);

  const pagePath = cleanPath(body.page_path);
  const referrer = text(body.referrer, 200).toLowerCase();
  const device = DEVICES.has(body.device_type) ? body.device_type : 'Other';
  const utmSource = text(body.utm_source, 200);
  const source = sourceFrom(referrer, utmSource);
  const scrollDepth = [25, 50, 75, 90].includes(Number(body.scroll_depth)) ? Number(body.scroll_depth) : null;

  await env.ANALYTICS_DB.prepare(`
    INSERT INTO analytics_events (
      event_name, occurred_at, event_date, page_path, referrer, traffic_source,
      device_type, utm_source, utm_medium, utm_campaign, utm_content,
      resource_slug, placement, scroll_depth, session_id
    ) VALUES (?1, datetime('now'), date('now', '+8 hours'), ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
  `).bind(
    eventName,
    pagePath,
    referrer,
    source,
    device,
    utmSource,
    text(body.utm_medium, 200),
    text(body.utm_campaign, 200),
    text(body.utm_content, 200),
    text(body.resource_slug, 120),
    text(body.placement, 80),
    scrollDepth,
    sessionId
  ).run();

  return json({ ok: true }, 202);
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'POST' });
}
