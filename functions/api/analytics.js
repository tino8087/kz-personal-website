import { json, verifyAccess } from '../_lib/analytics.js';

function period(days) {
  if (days === 'all') return { days: 'all', sql: '1 = 1', label: 'All Time' };
  const value = [1, 7, 30].includes(Number(days)) ? Number(days) : 7;
  const sql = value === 1 ? "event_date = date('now', '+8 hours')" : `occurred_at >= datetime('now', '-${value} days')`;
  return { days: value, sql, label: value === 1 ? 'Today' : `${value} Days` };
}

export async function onRequestGet({ request, env }) {
  const access = await verifyAccess(request, env);
  if (!access.ok) return json({ ok: false, error: access.reason }, access.status);
  if (!env.ANALYTICS_DB) return json({ ok: false, error: 'D1 Analytics Database 尚未綁定。' }, 503);

  const selected = period(new URL(request.url).searchParams.get('days'));
  const where = selected.sql;
  const db = env.ANALYTICS_DB;
  const statements = [
    db.prepare(`SELECT COUNT(DISTINCT session_id) AS sessions, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) AS page_views FROM analytics_events WHERE ${where}`),
    db.prepare(`SELECT event_date AS date, COUNT(DISTINCT session_id) AS sessions, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) AS page_views FROM analytics_events WHERE ${where} GROUP BY event_date ORDER BY event_date`),
    db.prepare(`SELECT page_path AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' GROUP BY page_path ORDER BY value DESC LIMIT 8`),
    db.prepare(`SELECT traffic_source AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' GROUP BY traffic_source ORDER BY value DESC`),
    db.prepare(`SELECT utm_campaign AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' AND utm_campaign != '' GROUP BY utm_campaign ORDER BY value DESC LIMIT 8`),
    db.prepare(`SELECT device_type AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' GROUP BY device_type ORDER BY value DESC`),
    db.prepare(`SELECT event_name AS label, COUNT(*) AS value, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE ${where} AND event_name IN ('view_zero_to_one','view_right_now','view_whats_next','scroll_25','scroll_50','scroll_75','scroll_90') GROUP BY event_name`),
    db.prepare(`SELECT event_name AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name IN ('instagram_click','youtube_click','resource_cta_click','resource_download','email_signup','shop_click','checkout_start','purchase') GROUP BY event_name`),
    db.prepare(`SELECT resource_slug AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='resource_view' AND resource_slug != '' GROUP BY resource_slug ORDER BY value DESC LIMIT 8`)
  ];
  const results = await db.batch(statements);
  const rows = index => results[index]?.results || [];
  const summary = rows(0)[0] || { sessions: 0, page_views: 0 };
  const sessions = Number(summary.sessions || 0);
  const engagement = rows(6).map(item => ({
    ...item,
    percentage: sessions ? Math.round((Number(item.sessions || 0) / sessions) * 100) : 0
  }));

  return json({
    ok: true,
    period: selected,
    generated_at: new Date().toISOString(),
    summary: { sessions, page_views: Number(summary.page_views || 0) },
    trend: rows(1),
    top_pages: rows(2),
    traffic_sources: rows(3),
    utm_campaigns: rows(4),
    devices: rows(5),
    engagement,
    actions: rows(7),
    top_resources: rows(8)
  });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'GET' });
}
