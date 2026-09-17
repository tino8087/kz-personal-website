(() => {
  const loadMedia = () => {
  const media = window.KZ_CONFIG?.media || {};
  document.querySelectorAll('[data-media]').forEach(figure => {
    const item = media[figure.dataset.media];
    if (!item?.src) return;
    const video = item.type === 'video';
    const el = document.createElement(video ? 'video' : 'img');
    el.hidden = true;
    if (video) {
      el.controls = true; el.muted = true; el.loop = true; el.playsInline = true;
      el.preload = 'metadata';
      el.setAttribute('aria-label', item.alt || 'KZ 的生活與創作片段');
      if (item.poster) el.poster = item.poster;
    } else { el.alt = item.alt || ''; el.loading = 'lazy'; el.decoding = 'async'; }
    const reveal = () => { el.hidden = false; figure.querySelector('.media-empty')?.remove(); };
    el.addEventListener(video ? 'loadedmetadata' : 'load', reveal, { once: true });
    el.addEventListener('error', () => { el.remove(); const label = figure.querySelector('.media-empty small'); if (label) label.textContent = '素材暫時無法載入'; });
    figure.insertBefore(el, figure.firstChild);
    el.src = item.src;
  });
  };
  document.addEventListener('kz:content-ready', loadMedia, { once: true });
})();
