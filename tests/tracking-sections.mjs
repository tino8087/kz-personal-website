import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const timers=new Map(),storage=new Map(),listeners={},events=[];let next=0;
const about={id:'about',shown:true,getBoundingClientRect:()=>({top:100,bottom:400,width:300,height:300}),closest(){return this.shown?null:{};}};
const ip={...about,id:'ip',shown:false};
const context={console,URL,URLSearchParams,Map,Set,WeakMap,Blob,JSON,Math,Number,String,Object,Date,
 crypto:{randomUUID:()=> '12345678-1234-4234-9234-123456789abc'},
 sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},screen:{width:390},innerHeight:844,
 getComputedStyle:()=>({opacity:'1',visibility:'visible'}),
 setTimeout(fn){timers.set(++next,fn);return next},clearTimeout(id){timers.delete(id)},
 requestAnimationFrame(fn){fn()},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
 navigator:{},
 document:{hidden:false,referrer:'https://www.instagram.com/',body:{dataset:{}},documentElement:{scrollHeight:2000},querySelector:s=>s==='.about-copy'?about:s==='.copy-hochi'?ip:null,addEventListener(n,fn){(listeners[n] ||= []).push(fn)}},
 window:{KZ_CONFIG:{},location:{search:'?utm_source=instagram&utm_medium=bio&utm_campaign=zero_to_one&utm_content=reel_01',pathname:'/',hostname:'localhost'},innerWidth:390,innerHeight:844,scrollY:0,addEventListener(n,fn){(listeners[n] ||= []).push(fn)},dispatchEvent(e){events.push(e)}}};
vm.runInNewContext(readFileSync(new URL('../tracking.js',import.meta.url),'utf8'),context);
const fire=n=>(listeners[n]||[]).forEach(fn=>fn());
const tick=()=>{const tasks=[...timers.values()];timers.clear();tasks.forEach(fn=>fn())};
about.shown=false;fire('scroll');tick();assert.equal(events.filter(e=>e.detail.name==='view_about').length,0);
about.shown=true;fire('scroll');tick();fire('scroll');tick();assert.equal(events.filter(e=>e.detail.name==='view_about').length,1);
ip.shown=true;fire('kz:scene-change');context.document.hidden=true;fire('visibilitychange');tick();assert.equal(events.filter(e=>e.detail.name==='view_ip_character').length,0);
context.document.hidden=false;fire('visibilitychange');tick();fire('kz:scene-change');tick();assert.equal(events.filter(e=>e.detail.name==='view_ip_character').length,1);
context.window.scrollY=1156;fire('scroll');tick();
context.window.scrollY=0;fire('scroll');context.window.scrollY=1156;fire('scroll');tick();
for (const depth of [25,50,75,90]) assert.equal(events.filter(e=>e.detail.name==='scroll_'+depth).length,1);
const pv=events.find(e=>e.detail.name==='page_view');
assert.equal(pv.detail.properties.utm_source,'instagram');
assert.equal(pv.detail.properties.utm_content,'reel_01');
assert.equal(context.window.location.search,'?utm_source=instagram&utm_medium=bio&utm_campaign=zero_to_one&utm_content=reel_01');
context.window.location.hostname='kz-personal-website.pages.dev';
context.navigator.sendBeacon=()=>{throw new Error('network blocked')};
context.window.KZ_CONFIG.trackEvent=()=>{throw new Error('provider failed')};
assert.equal(context.window.trackEvent('instagram_click'),true);
console.log('Tracking tests passed: dwell, hidden scenes/tab, once per page, scroll deduplication, UTM unchanged, provider/network failure isolation.');

assert.equal(context.window.KZTracking.getContext().referrer_host,'www.instagram.com');
context.document.referrer='https://kz-personal-website.pages.dev/';
context.window.location.pathname='/notes.html';context.window.location.search='';
vm.runInNewContext(readFileSync(new URL('../tracking.js',import.meta.url),'utf8'),context);
assert.equal(context.window.KZTracking.getContext().referrer_host,'www.instagram.com');
assert.equal(context.window.KZTracking.getContext().utm.utm_content,'reel_01');
console.log('Attribution preserved when navigating from home to notes.');

const count=events.length;context.window.KZAnalyticsPrivacy={isExcluded:()=>true};
assert.equal(context.window.trackEvent('instagram_click'),false);assert.equal(events.length,count);
