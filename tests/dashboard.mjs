import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {makeReport,selectPeriod} from '../functions/_lib/analytics-report.js';
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:false,className:'',dataset:{},classList:{toggle(){}},setAttribute(){},addEventListener(n,fn){this[n]=fn;}});return elements.get(id)}
const buttons=['1','7','30','365','all'].map(days=>({...element(days),dataset:{days}}));
const pending=[];
const context={window:{KZAnalyticsPrivacy:{isExcluded:()=>true}},console,Intl,Number,String,Object,Math,Date,AbortController,encodeURIComponent,
 location:{hostname:'example.com'},
 document:{querySelector:element,querySelectorAll:()=>buttons},
 fetch:()=>new Promise(resolve=>pending.push(resolve))};
vm.runInNewContext(readFileSync(new URL('../admin/dashboard.js',import.meta.url),'utf8'),context);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const data=makeReport([],selectPeriod('7'));
function answer(resolve,body=data,type='application/json',ok=true){resolve({ok,headers:{get:()=>type},json:async()=>body})}
answer(pending.shift());await flush();
assert.equal(element('#dashboard').hidden,false);assert.match(element('#summary').innerHTML,/造訪次數/);assert.match(element('#summary').innerHTML,/—/);
buttons[0].click();answer(pending.shift(),{},'text/html');await flush();
assert.equal(element('#dashboard').hidden,true);assert.match(element('#status').textContent,/登入/);
buttons[1].click();answer(pending.shift(),{ok:false,error:'資料庫暫時無法讀取'},'application/json',false);await flush();
assert.match(element('#status').textContent,/資料庫/);assert.equal(element('#dashboard').hidden,true);
buttons[2].click();const old=pending.shift();buttons[3].click();const fresh=pending.shift();
answer(fresh,{...data,summary:{sessions:9,page_views:10,home_sessions:8}});await flush();
answer(old,{...data,summary:{sessions:999,page_views:999,home_sessions:999}});await flush();
assert.match(element('#summary').innerHTML,/>9</);assert.doesNotMatch(element('#summary').innerHTML,/>999</);
console.log('Dashboard tests passed: true empty state, login HTML, database error, stale response rejection.');
