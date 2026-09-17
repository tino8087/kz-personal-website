(() => {
  const html = value => String(value ?? '').split('\n').map(line => line.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))).join('<br>');
  const set = (selector, value) => { const el = document.querySelector(selector); if (el && value !== undefined) el.innerHTML = html(value); };
  fetch('content/site.json', { cache: 'no-store' }).then(r => {
    if (!r.ok) throw new Error('content');
    return r.json();
  }).then(data => {
    set('[data-content="hero.tagline"]', data.hero?.tagline);
    set('[data-content="who.headline"]', data.who?.headline);
    set('[data-content="who.body"]', data.who?.body);
    set('[data-content="now.subtitle"]', data.now?.subtitle);
    set('[data-content="now.date"]', data.now?.date);
    set('[data-content="next.subtitle"]', data.next?.subtitle);
    set('[data-content="follow.headline"]', data.follow?.headline);
    set('[data-content="media.portrait_caption"]', data.media?.portrait_caption);
    set('[data-content="media.reel_caption"]', data.media?.reel_caption);

    const activities = document.querySelector('[data-list="activities"]');
    if (activities && data.activities?.length) activities.innerHTML = data.activities.map(item => `<article><span class="eyebrow">${html(item.label)}</span><h3>${html(item.title)}</h3><p>${html(item.body)}</p></article>`).join('');
    const now = document.querySelector('[data-list="now_items"]');
    if (now && data.now?.items?.length) now.innerHTML = data.now.items.map(item => `<li><span>${html(item.title)}</span><small>${html(item.note)}</small></li>`).join('');
    const next = document.querySelector('[data-list="next_items"]');
    if (next && data.next?.items?.length) next.innerHTML = data.next.items.map(item => `<li>${html(item)} <span aria-hidden="true">↘</span></li>`).join('');

    window.KZ_CONFIG.social = data.social || {};
    window.KZ_CONFIG.media = {
      portrait: { type: 'image', src: data.media?.portrait || '', alt: 'KZ 的生活照片' },
      reel: { type: 'video', src: data.media?.reel || '', poster: data.media?.reel_poster || '', alt: 'KZ 的 Reels 生活片段' },
      sketch: { type: 'image', src: data.media?.sketch || '', alt: 'HOCHI 角色設計的草稿與練習' }
    };
    document.dispatchEvent(new CustomEvent('kz:content-ready'));
  }).catch(() => document.dispatchEvent(new CustomEvent('kz:content-ready')));
})();
