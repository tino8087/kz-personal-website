/* Only public configuration. Never put API secrets here. */
window.KZ_CONFIG = {
  social: { instagram: '', youtube: '' }, // Full HTTPS profile/channel URLs.
  cloudflareToken: '', // Leave empty if Pages automatically injects Web Analytics.
  debugAnalytics: false,
  // Optional event adapter. Every custom event and its UTM context passes here.
  // trackEvent(name, properties) { window.plausible?.(name, { props: properties }); }
  trackEvent: null
};

// Add your own assets here. Empty values display clearly labelled layout placeholders.
window.KZ_CONFIG.media = {
  portrait: { type: 'image', src: '', alt: 'KZ 的生活照片' },
  reel: { type: 'video', src: '', poster: '', alt: 'KZ 的 Reels 生活片段' },
  sketch: { type: 'image', src: '', alt: 'HOCHI 角色設計的草稿與練習' }
};
