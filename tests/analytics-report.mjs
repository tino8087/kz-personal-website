import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {selectPeriod,reportStatements,makeReport} from '../functions/_lib/analytics-report.js';
const now=Date.parse('2026-09-29T16:30:00Z');
assert.equal(selectPeriod('1',now).start,'2026-09-30');
assert.equal(selectPeriod('7',now).start,'2026-09-24');
assert.equal(selectPeriod('365',now).start,'2025-10-01');
assert.equal(selectPeriod("7 OR 1=1",now).days,7);
const events=[
 ['page_view','2026-09-30','/','A'],['page_view','2026-09-30','/','A'],
 ['instagram_click','2026-09-30','/','A'],['instagram_click','2026-09-30','/','A'],
 ['scroll_50','2026-09-30','/','A'],['resource_view','2026-09-30','/resources/test/','A'],
 ['page_view','2026-09-29','/','B'],['scroll_90','2026-09-30','/','B'],
 ['page_view','2026-10-01','/','C'],['scroll_50','2026-09-30','/resources/test/','A']
];
function report(period){
 const db={prepare(sql){return{sql,values:[],bind(...values){return{sql,values}}}}};
 const queries=reportStatements(db,period);
 const py=`import json,sqlite3,sys\nx=json.load(sys.stdin);db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(x['schema'])\nfor name,date,path,sid in x['events']:\n db.execute('INSERT INTO analytics_events (event_name,event_date,occurred_at,page_path,session_id,resource_slug) VALUES (?,?,?,?,?,?)',(name,date,date+' 01:00:00',path,sid,'test' if name=='resource_view' else ''))\nprint(json.dumps([{'results':[dict(r) for r in db.execute(q['sql'],q['values'])]} for q in x['queries']]))`;
 const results=JSON.parse(execFileSync('python3',['-c',py],{input:JSON.stringify({schema:readFileSync(new URL('../migrations/0001_analytics.sql',import.meta.url),'utf8'),events,queries}),encoding:'utf8'}));
 return makeReport(results,period,now);
}
const today=report(selectPeriod('1',now));
assert.deepEqual(today.summary,{sessions:1,page_views:2,home_sessions:1});
assert.equal(today.engagement.find(x=>x.label==='scroll_50').percentage,100);
assert.equal(today.engagement.find(x=>x.label==='scroll_50').value,1);
assert.equal(today.engagement.find(x=>x.label==='scroll_90'),undefined);
assert.equal(today.actions.find(x=>x.label==='instagram_click').value,2);
assert.equal(today.actions.find(x=>x.label==='instagram_click').sessions,1);
assert.equal(today.top_resources[0].value,1);
const week=report(selectPeriod('7',now));
assert.equal(week.trend.length,7);assert.equal(week.trend[0].page_views,0);assert.equal(week.summary.sessions,2);
const year=report(selectPeriod('365',now));assert.equal(year.trend.length,12);assert.equal(year.period.aggregation,'month');
const all=report(selectPeriod('all',now));assert.equal(all.summary.page_views,3);assert.equal(all.period.start,'2026-09-29');
console.log('Report tests passed: Taiwan dates, real SQLite queries, zero-fill, monthly aggregation, scoped denominator, repeated clicks.');
