(() => {
  const status=document.querySelector('#status'), dashboard=document.querySelector('#dashboard');
  const labels={Direct:'直接進入／無來源',Other:'其他',Desktop:'桌面',Mobile:'手機',Tablet:'平板'};
  const sectionNames={view_about:'關於我',view_creation:'主要創作',view_content_creation:'內容創作',view_ip_character:'IP 角色',view_outfit_diary:'穿搭日記',view_life:'DJ／網球',view_links:'聯絡連結',scroll_25:'往下滑到 25%',scroll_50:'往下滑到 50%',scroll_75:'往下滑到 75%',scroll_90:'往下滑到 90%'};
  const actionNames={instagram_click:'Instagram 點擊',youtube_click:'YouTube 點擊',resource_view:'文章瀏覽',resource_cta_click:'文章內按鈕點擊',resource_download:'資源下載'};
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=value=>new Intl.NumberFormat('zh-TW').format(Number(value||0));
  const metric=(value,label,note='')=>`<div class="metric"><strong>${escape(value)}</strong><span>${escape(label)}</span><small>${escape(note)}</small></div>`;
  const rows=(id,items,empty='這段期間尚無資料')=>{document.querySelector(id).innerHTML=items?.length?items.map(item=>`<div class="list-row"><span>${escape(labels[item.label]||item.label)}</span><strong>${number(item.value)}</strong></div>`).join(''):`<p class="empty">${escape(empty)}</p>`;};
  const excludeSelf=document.querySelector('#exclude-self');
  function showExclusion() {
    const excluded=!!window.KZAnalyticsPrivacy?.isExcluded();
    excludeSelf.checked=excluded;
    document.querySelector('#privacy-status').textContent=excluded?'已排除：這個瀏覽器之後的前台瀏覽與點擊不會記入本後台。':'目前會計入：這個瀏覽器的前台瀏覽與點擊會記錄。';
  }
  excludeSelf.addEventListener('change',()=>{window.KZAnalyticsPrivacy?.setExcluded(excludeSelf.checked);showExclusion();});
  showExclusion();
  let selected='7', requestId=0, controller;
  function render(data) {
    const events=Object.fromEntries(data.engagement.map(e=>[e.label,e]));
    const actions=Object.fromEntries(data.actions.map(e=>[e.label,e]));
    const value=name=>Number(actions[name]?.value||0);
    const percent=name=>data.summary.home_sessions?`${events[name]?.percentage||0}%`:'—';
    document.querySelector('#summary').innerHTML=[
      metric(number(data.summary.sessions),'造訪次數','匿名工作階段'),metric(number(data.summary.page_views),'頁面瀏覽量','包含同次造訪的重複瀏覽'),
      metric(percent('scroll_50'),'滑到首頁中段',`${number(data.summary.home_sessions)} 次首頁造訪為分母`),
      metric(percent('scroll_90'),'滑到首頁後段','滑到 90% 的位置'),metric(number(value('resource_view')),'文章瀏覽','開啟文章的次數'),
      metric(number(value('instagram_click')+value('youtube_click')),'社群連結點擊','Instagram ＋ YouTube')].join('');
    document.querySelector('#engagement').innerHTML=Object.entries(sectionNames).map(([key,label])=>metric(percent(key),label,`${number(events[key]?.sessions)} 次造訪；${number(events[key]?.value)} 次事件`)).join('');
    document.querySelector('#actions').innerHTML=Object.entries(actionNames).map(([key,label])=>metric(number(value(key)),label,`${number(actions[key]?.sessions)} 次造訪發生過`)).join('');
    const max=Math.max(1,...data.trend.map(e=>Number(e.page_views)||0));
    document.querySelector('#trend').innerHTML=data.trend.map(e=>`<div class="trend-row"><span>${escape(e.date)}</span><div class="bar-track"><div class="bar" style="width:${Math.max(0,Number(e.page_views)||0)/max*100}%"></div></div><strong>${number(e.page_views)}</strong></div>`).join('');
    document.querySelector('#trend-note').textContent=`${data.period.start} 至 ${data.period.end}（台灣時間），按${data.period.aggregation==='month'?'月':'日'}顯示頁面瀏覽量。`;
    rows('#sources',data.traffic_sources); rows('#devices',data.devices); rows('#top-pages',data.top_pages); rows('#resources',data.top_resources,'尚無文章瀏覽紀錄');
    rows('#campaigns',data.utm_campaigns.map(e=>({...e,label:[['來源',e.utm_source],['位置',e.utm_medium],['活動',e.utm_campaign],['內容',e.utm_content]].filter(x=>x[1]).map(x=>x.join('：')).join(' ｜ ')})),'尚未收到帶有 UTM 標記的流量');
    const last=data.history.last_event?new Date(data.history.last_event.replace(' ','T')+'Z').toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'尚無紀錄';
    document.querySelector('#updated').textContent=`最後收到事件：${last} ｜ 報表讀取時間：${new Date(data.generated_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}`;
  }
  async function load() {
    const id=++requestId; controller?.abort(); controller=new AbortController();
    status.hidden=false; status.className='status'; status.textContent='讀取資料中…'; dashboard.hidden=true;
    if (['127.0.0.1','localhost','[::1]'].includes(location.hostname)) {
      status.textContent='本機預覽尚未連接正式數據。部署後請從正式網站 /admin/ 登入查看；這裡不會以零或示範數字冒充真實流量。'; return;
    }
    try {
      const response=await fetch(`/api/analytics?days=${encodeURIComponent(selected)}`,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if (!(response.headers.get('content-type')||'').includes('application/json')) throw new Error('登入可能已過期，請重新開啟後台並完成 Cloudflare Access 登入。');
      const data=await response.json(); if (!response.ok||!data.ok) throw new Error(data.error||'資料讀取失敗');
      if (id!==requestId) return;
      render(data);status.hidden=true;dashboard.hidden=false;
    } catch(error) { if(id!==requestId||error.name==='AbortError') return;status.className='status error';status.textContent=error.message; }
  }
  document.querySelectorAll('[data-days]').forEach(button=>button.addEventListener('click',()=>{
    selected=button.dataset.days; document.querySelectorAll('[data-days]').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});load();
  }));
  document.querySelector('#refresh').addEventListener('click',load);
  load();
})();
