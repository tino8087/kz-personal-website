import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {makeReport,selectPeriod} from '../functions/_lib/analytics-report.js';
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:false,className:'',dataset:{},classList:{toggle(){}},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(n,fn){this[n]=fn;}});return elements.get(id)}
const buttons=['1','7','30','365','all'].map(days=>({...element(days),dataset:{days}}));
const categories=['overview','sources','reading','actions'].map(category=>({...element(category),dataset:{category}}));
const panels=categories.map(b=>({...element('panel-'+b.dataset.category),dataset:{panel:b.dataset.category},hidden:b.dataset.category!=='overview'}));
const pending=[];
const context={window:{KZAnalyticsPrivacy:{isExcluded:()=>true}},console,Intl,Number,String,Object,Math,Date,AbortController,encodeURIComponent,
 location:{hostname:'example.com'},
 document:{querySelector:element,querySelectorAll:selector=>selector==='[data-days]'?buttons:selector==='[data-category]'?categories:panels},
 fetch:()=>new Promise(resolve=>pending.push(resolve))};
vm.runInNewContext(readFileSync(new URL('../admin/dashboard.js',import.meta.url),'utf8'),context);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const data=makeReport([],selectPeriod('7'));
function answer(resolve,body=data,type='application/json',ok=true){resolve({ok,headers:{get:()=>type},json:async()=>body})}
answer(pending.shift());await flush();
assert.equal(element('#dashboard').hidden,false);assert.match(element('#summary').innerHTML,/造訪次數/);assert.match(element('#summary').innerHTML,/—/);
categories[2].click();assert.equal(panels[2].hidden,false);assert.equal(panels[0].hidden,true);assert.equal(categories[2].attributes['aria-pressed'],'true');assert.equal(pending.length,0);
assert.match(element('#scroll-depth').innerHTML,/25%/);assert.doesNotMatch(element('#engagement').innerHTML,/往下滑/);assert.doesNotMatch(element('#actions').innerHTML,/文章/);assert.match(element('#article-actions').innerHTML,/文章/);
buttons[0].click();answer(pending.shift(),{},'text/html');await flush();
assert.equal(element('#dashboard').hidden,true);assert.match(element('#status').textContent,/登入/);
buttons[1].click();answer(pending.shift(),{ok:false,error:'資料庫暫時無法讀取'},'application/json',false);await flush();
assert.match(element('#status').textContent,/資料庫/);assert.equal(element('#dashboard').hidden,true);
buttons[2].click();const old=pending.shift();buttons[3].click();const fresh=pending.shift();
answer(fresh,{...data,summary:{sessions:9,page_views:10,home_sessions:8}});await flush();
answer(old,{...data,summary:{sessions:999,page_views:999,home_sessions:999}});await flush();
assert.equal(panels[2].hidden,false);assert.match(element('#summary').innerHTML,/>9</);assert.doesNotMatch(element('#summary').innerHTML,/>999</);
const marked={...data,summary:{sessions:2,page_views:3,home_sessions:2},top_pages:[{label:'/',value:3},{label:'<img onerror=alert(1)>',value:1}],engagement:[{label:'scroll_50',percentage:50,sessions:1,value:2}],actions:[{label:'instagram_click',value:3,sessions:1}]};
buttons[4].click();answer(pending.shift(),marked);await flush();assert.match(element('#top-pages').innerHTML,/首頁/);assert.doesNotMatch(element('#top-pages').innerHTML,/<img/);assert.match(element('#summary').innerHTML,/約 50 次/);assert.match(element('#scroll-depth').innerHTML,/2 次首頁造訪中，1 次/);assert.match(element('#actions').innerHTML,/>3</);
console.log('Dashboard tests passed: categories, scoped explanations, escaped labels,: true empty state, login HTML, database error, stale response rejection.');
