/* Browser-local owner exclusion; no identity, IP address or fingerprint. */
(() => {
  'use strict';
  const KEY = 'kz_analytics_preference_v1';
  const COOKIE = 'kz_analytics_exclude';
  function preference() { try { return localStorage.getItem(KEY); } catch (_) { return null; } }
  function cookieExcluded() { return document.cookie.split(';').some(item => item.trim() === COOKIE + '=1'); }
  function isExcluded() { return preference() === 'exclude' || cookieExcluded(); }
  function setExcluded(value) {
    try { localStorage.setItem(KEY, value ? 'exclude' : 'include'); } catch (_) {}
    document.cookie = COOKIE + '=' + (value ? '1' : '') + '; Path=/; Max-Age=' + (value ? '31536000' : '0') + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    window.dispatchEvent(new CustomEvent('kz:analytics-preference'));
    return isExcluded();
  }
  window.KZAnalyticsPrivacy = Object.freeze({isExcluded, setExcluded});
  // A visit to either authenticated admin page opts this browser out by default.
  if (location.pathname.startsWith('/admin/') && preference() !== 'include') setExcluded(true);
  else if (preference() === 'exclude') setExcluded(true);
})();
