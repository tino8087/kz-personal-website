(() => {
  'use strict';
  const config = window.KZ_CONFIG || {};
  document.querySelectorAll('.photo img').forEach(img => {
    const fallback = () => { img.hidden = true; img.parentElement.classList.add('photo-unavailable'); };
    img.addEventListener('error', fallback);
    if (img.complete && !img.naturalWidth) fallback();
  });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduced) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    document.documentElement.classList.add('motion');
  }
  // A public, provider-neutral hook. Cloudflare Web Analytics does NOT store custom events.
  function track(name, properties = {}) {
    const detail = { name, properties, timestamp: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent('kz:analytics', { detail }));
    if (config.debugAnalytics) console.info('[KZ analytics]', detail);
    if (typeof config.trackEvent === 'function') {
      try { config.trackEvent(name, properties); } catch (error) { if (config.debugAnalytics) console.warn(error); }
    }
  }
  window.KZAnalytics = Object.freeze({ track });
  let toastTimer;
  const hosts = { instagram: ['instagram.com', 'www.instagram.com'], youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'] };
  document.querySelectorAll('[data-social]').forEach(link => {
    const platform = link.dataset.social;
    const resolveUrl = () => {
      try { const parsed = new URL(config.social?.[platform]); if (parsed.protocol === 'https:' && hosts[platform].includes(parsed.hostname)) return parsed.href; } catch (_) { /* Missing links intentionally remain placeholders. */ }
      return '';
    };
    const syncLink = () => {
      const url = resolveUrl();
      if (url) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.removeAttribute('aria-label'); }
      else { link.href = '#social-placeholder'; link.removeAttribute('target'); link.setAttribute('aria-label', `${platform} 帳號待設定`); }
    };
    syncLink();
    document.addEventListener('kz:content-ready', syncLink, { once: true });
    link.addEventListener('click', event => {
      const url = resolveUrl();
      if (!url) {
        event.preventDefault();
        track('social_placeholder_click', { platform, placement: link.dataset.placement });
        const toast = document.getElementById('toast'); toast.textContent = `${platform === 'instagram' ? 'Instagram' : 'YouTube'} 連結尚待設定。`; toast.classList.add('show');
        clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3500); return;
      }
      track('social_click', { platform, placement: link.dataset.placement, destination: url });
    });
  });
  if ([...document.querySelectorAll('[data-social]')].every(el => el.target === '_blank')) document.getElementById('social-placeholder').hidden = true;
  if ('IntersectionObserver' in window) {
    const sections = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { track('section_view', { section: entry.target.dataset.trackSection }); sections.unobserve(entry.target); }
    }), { threshold: 0.25 });
    document.querySelectorAll('[data-track-section]').forEach(el => sections.observe(el));
  }
  if (/^[a-f0-9]{32}$/i.test(config.cloudflareToken || '')) {
    const script = document.createElement('script'); script.type = 'module'; script.defer = true; script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset.cfBeacon = JSON.stringify({ token: config.cloudflareToken }); document.head.appendChild(script);
  }
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
