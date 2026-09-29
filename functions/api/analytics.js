import { json, verifyAccess } from '../_lib/analytics.js';
import { selectPeriod, reportStatements, makeReport } from '../_lib/analytics-report.js';

export async function onRequestGet({ request, env }) {
  const access = await verifyAccess(request, env);
  if (!access.ok) return json({ ok:false,error:access.reason },access.status);
  if (!env.ANALYTICS_DB) return json({ ok:false,error:'尚未連接數據資料庫，不能顯示真實數據。' },503);
  const selected = selectPeriod(new URL(request.url).searchParams.get('days'));
  try {
    const results = await env.ANALYTICS_DB.batch(reportStatements(env.ANALYTICS_DB,selected));
    if (results.some(result=>result.success===false)) throw new Error('query');
    return json(makeReport(results,selected));
  } catch (_) {
    return json({ok:false,error:'數據暫時無法讀取，請稍後重試；這不代表流量為零。'},503);
  }
}
export function onRequest() { return json({ok:false,error:'Method not allowed.'},405,{Allow:'GET'}); }
