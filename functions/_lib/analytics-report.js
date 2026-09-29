const HOME = "page_path IN ('/','/index.html','/visual-direction','/visual-direction/','/visual-direction.html')";
export const ENGAGEMENT = ['view_about','view_creation','view_content_creation','view_ip_character','view_outfit_diary','view_life','view_links','view_zero_to_one','view_right_now','view_whats_next','scroll_25','scroll_50','scroll_75','scroll_90'];
export const ACTIONS = ['instagram_click','youtube_click','resource_view','resource_cta_click','resource_download'];
const date = ms => new Date(ms).toISOString().slice(0,10);
export function selectPeriod(value, now = Date.now()) {
  if (value === 'all') return { days:'all', start:null, end:date(now+28800000), label:'全部期間', timezone:'Asia/Taipei' };
  const days = [1,7,30,365].includes(Number(value)) ? Number(value) : 7;
  return { days, start:date(now+28800000-(days-1)*86400000), end:date(now+28800000), label:days===1?'今天':`近 ${days} 天`, timezone:'Asia/Taipei' };
}
export function reportStatements(db, selected) {
  const where = selected.start ? 'event_date >= ?1 AND event_date <= ?2' : 'event_date <= ?1';
  const values = selected.start ? [selected.start,selected.end] : [selected.end];
  const stmt = sql => db.prepare(sql).bind(...values);
  const sessions = `SELECT DISTINCT session_id FROM analytics_events WHERE ${where} AND event_name='page_view' AND ${HOME}`;
  return [
    stmt(`SELECT COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) AS sessions, SUM(event_name='page_view') AS page_views, COUNT(DISTINCT CASE WHEN event_name='page_view' AND ${HOME} THEN session_id END) AS home_sessions FROM analytics_events WHERE ${where}`),
    stmt(`SELECT event_date AS date, SUM(event_name='page_view') AS page_views FROM analytics_events WHERE ${where} GROUP BY event_date ORDER BY event_date`),
    stmt(`SELECT page_path AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' GROUP BY page_path ORDER BY value DESC LIMIT 12`),
    stmt(`SELECT traffic_source AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' GROUP BY traffic_source ORDER BY value DESC`),
    stmt(`SELECT utm_source,utm_medium,utm_campaign,utm_content,COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' AND (utm_source!='' OR utm_campaign!='' OR utm_content!='' OR utm_medium!='') GROUP BY utm_source,utm_medium,utm_campaign,utm_content ORDER BY value DESC LIMIT 15`),
    stmt(`SELECT device_type AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='page_view' GROUP BY device_type ORDER BY value DESC`),
    stmt(`SELECT event_name AS label, COUNT(*) AS value, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE ${where} AND ${HOME} AND session_id IN (${sessions}) AND event_name IN (${ENGAGEMENT.map(e=>`'${e}'`).join(',')}) GROUP BY event_name`),
    stmt(`SELECT event_name AS label, COUNT(*) AS value, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE ${where} AND event_name IN (${ACTIONS.map(e=>`'${e}'`).join(',')}) GROUP BY event_name`),
    stmt(`SELECT resource_slug AS label, COUNT(*) AS value FROM analytics_events WHERE ${where} AND event_name='resource_view' AND resource_slug!='' GROUP BY resource_slug ORDER BY value DESC LIMIT 12`),
    db.prepare('SELECT MIN(event_date) AS first_date, MAX(occurred_at) AS last_event FROM analytics_events')
  ];
}
export function makeReport(results, selected, now = Date.now()) {
  const rows = i => results[i]?.results || [];
  const totals = rows(0)[0] || {};
  const homeSessions = Number(totals.home_sessions || 0);
  const history = rows(9)[0] || {};
  const start = selected.start || history.first_date || selected.end;
  const monthly = selected.days === 'all' || selected.days === 365;
  const buckets = new Map();
  for (let t = Date.parse(start+'T00:00:00Z'); t <= Date.parse(selected.end+'T00:00:00Z'); t += 86400000) {
    const key = date(t).slice(0,monthly?7:10); buckets.set(key,0);
  }
  for (const row of rows(1)) { const key=row.date.slice(0,monthly?7:10); buckets.set(key,(buckets.get(key)||0)+Number(row.page_views||0)); }
  const engagement = rows(6).map(item=>({...item, percentage:homeSessions?Math.round(Number(item.sessions||0)/homeSessions*100):null}));
  return { ok:true,period:{...selected,start,aggregation:monthly?'month':'day'},generated_at:new Date(now).toISOString(),history,
    summary:{sessions:Number(totals.sessions||0),page_views:Number(totals.page_views||0),home_sessions:homeSessions},
    trend:[...buckets].map(([date,page_views])=>({date,page_views})),top_pages:rows(2),traffic_sources:rows(3),utm_campaigns:rows(4),devices:rows(5),engagement,actions:rows(7),top_resources:rows(8) };
}
