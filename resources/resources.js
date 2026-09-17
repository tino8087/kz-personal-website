(() => {
  const slug = document.body.dataset.resourceSlug || '';
  document.querySelectorAll('[data-resource-cta]').forEach(link => link.addEventListener('click', () => window.trackEvent?.('resource_cta_click', { resource_slug: slug, placement: link.dataset.placement || 'resource' })));
  document.querySelectorAll('[data-resource-download]').forEach(link => link.addEventListener('click', () => window.trackEvent?.('resource_download', { resource_slug: slug, placement: 'resource' })));
})();
