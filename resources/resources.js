(() => {
  const palettes = {
    original: { attribute: 'original', primary: '#f2674a', dark: '#15130f', light: '#f5e8d0', accent: '#f2674a', card: '#f5e8d0' },
    kz_brand: { attribute: 'kz-brand', primary: '#8c9dad', dark: '#303b43', light: '#f8f6f2', accent: '#ffbe98', card: '#f3e6dc' },
    orange_creative: { attribute: 'orange-creative', primary: '#eb670e', dark: '#161616', blue: '#2a3582', light: '#ffffff', accent: '#eb670e', card: '#ffffff' }
  };

  const normalizeHex = (value, fallback) => {
    const hex = typeof value === 'string' ? value.trim() : '';
    if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(hex)) return `#${hex.slice(1).split('').map(part => part + part).join('')}`.toLowerCase();
    return fallback;
  };

  const applyTheme = siteContent => {
    const theme = siteContent?.theme || {};
    const palette = theme.version === 'custom'
      ? {
          attribute: 'custom',
          primary: normalizeHex(theme.primary, '#eb670e'),
          dark: normalizeHex(theme.dark, '#2a3582'),
          light: normalizeHex(theme.light, '#ffffff'),
          accent: normalizeHex(theme.accent, '#eb670e'),
          card: normalizeHex(theme.card, '#ffffff')
        }
      : palettes[theme.version] || palettes.original;

    const root = document.documentElement;
    root.dataset.colorVersion = palette.attribute;
    root.style.setProperty('--bg', palette.light);
    root.style.setProperty('--ink', palette.dark);
    root.style.setProperty('--blue', palette.blue || palette.dark);
    root.style.setProperty('--orange', palette.primary);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--card', palette.card);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = palette.primary;
  };

  fetch('/content/visual-site.json', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : {})
    .then(applyTheme)
    .catch(() => {});

  const slug = document.body.dataset.resourceSlug || '';
  document.querySelectorAll('[data-resource-cta]').forEach(link => link.addEventListener('click', () => window.trackEvent?.('resource_cta_click', { resource_slug: slug, placement: link.dataset.placement || 'resource' })));
  document.querySelectorAll('[data-resource-download]').forEach(link => link.addEventListener('click', () => window.trackEvent?.('resource_download', { resource_slug: slug, placement: 'resource' })));
})();
