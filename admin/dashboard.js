(() => {
  const status = document.querySelector('#status');
  const dashboard = document.querySelector('#dashboard');
  const names = {view_zero_to_one:'0 → 1 View',view_right_now:'RIGHT NOW View',view_whats_next:"WHAT'S NEXT View",scroll_25:'Scroll 25%',scroll_50:'Scroll 50%',scroll_75:'Scroll 75%',scroll_90:'Scroll 90%',instagram_click:'Instagram Clicks',youtube_click:'YouTube Clicks',resource_cta_click:'Resource CTA Clicks',resource_download:'Resource Downloads',email_signup:'Email Signup',shop_click:'Shop Clicks',checkout_start:'Checkout',purchase:'Purchase'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = value => new Intl.NumberFormat('zh-TW').format(Number(value || 0));
  const rows = (target, items, empty = '目前沒有資料') => { target.innerHTML = items?.length ? items.map(item => `<div class="list-row"><span>${escape(item.label || 'Direct')}</span><strong>${number(item.value)}</strong></div>`).join('') : `<p class="empty">${empty}</p>`; };
  const metrics = (target, items) => { target.innerHTML = items?.length ? items.map(item => `<div class="metric"><strong>${number(item.value)}</strong><span>${escape(names[item.label] || item.label)}</span>${item.percentage === undefined ? '' : `<small>${number(item.percentage)}% sessions</small>`}</div>`).join('') : '<p class="empty">目前沒有事件資料</p>'; };
  async function load(days = '7') {
    status.hidden = false; status.className = 'status'; status.textContent = '讀取資料中…'; dashboard.hidden = true;
    try {
      const response = await fetch(`/api/analytics?days=${encodeURIComponent(days)}`, { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '資料讀取失敗');
      document.querySelector('#sessions').textContent = number(data.summary.sessions);
      document.querySelector('#page-views').textContent = number(data.summary.page_views);
      const max = Math.max(1, ...data.trend.map(item => Number(item.page_views || 0)));
      document.querySelector('#trend').innerHTML = data.trend.length ? data.trend.map(item => `<div class="trend-row"><span>${escape(item.date)}</span><div class="bar" style="width:${Math.max(2, Number(item.page_views || 0) / max * 100)}%"></div><strong>${number(item.page_views)}</strong></div>`).join('') : '<p class="empty">目前沒有流量資料</p>';
      rows(document.querySelector('#top-pages'), data.top_pages); rows(document.querySelector('#sources'), data.traffic_sources); rows(document.querySelector('#campaigns'), data.utm_campaigns); rows(document.querySelector('#devices'), data.devices); metrics(document.querySelector('#engagement'), data.engagement); metrics(document.querySelector('#actions'), data.actions); rows(document.querySelector('#resources'), data.top_resources, '尚未發布 Resource');
      document.querySelector('#updated').textContent = `資料更新時間：${new Date(data.generated_at).toLocaleString('zh-TW')}`;
      status.hidden = true; dashboard.hidden = false;
    } catch (error) { status.className = 'status error'; status.textContent = error.message; }
  }
  document.querySelectorAll('[data-days]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-days]').forEach(item => item.classList.toggle('active', item === button)); load(button.dataset.days); }));
  load();
})();
