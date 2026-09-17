(() => {
  'use strict';

  const config = window.KZ_CONFIG || {};
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  const EVENT_NAMES = Object.freeze({
    INSTAGRAM_CLICK: 'instagram_click',
    YOUTUBE_CLICK: 'youtube_click',
    VIEW_ZERO_TO_ONE: 'view_zero_to_one',
    VIEW_RIGHT_NOW: 'view_right_now',
    VIEW_WHATS_NEXT: 'view_whats_next',
    SCROLL_25: 'scroll_25',
    SCROLL_50: 'scroll_50',
    SCROLL_75: 'scroll_75',
    SCROLL_90: 'scroll_90',
    EMAIL_SIGNUP: 'email_signup',
    PRODUCT_VIEW: 'product_view',
    SHOP_CLICK: 'shop_click',
    CHECKOUT_START: 'checkout_start',
    PURCHASE: 'purchase'
  });
  const STORAGE_KEY = 'kz_tracking_context_v1';
  const fired = new Set();

  const safeStorage = {
    read() {
      try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); }
      catch (_) { return {}; }
    },
    write(value) {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
      catch (_) { /* Tracking must never affect the website. */ }
    }
  };

  function buildContext() {
    const stored = safeStorage.read();
    const params = new URLSearchParams(window.location.search);
    const utm = { ...(stored.utm || {}) };
    UTM_KEYS.forEach(key => {
      const value = params.get(key);
      if (value) utm[key] = value.slice(0, 200);
    });
    const context = {
      utm,
      landing_path: stored.landing_path || window.location.pathname,
      page_path: window.location.pathname
    };
    safeStorage.write(context);
    return context;
  }

  const context = buildContext();

  function trackEvent(eventName, properties = {}, options = {}) {
    try {
      if (!eventName || typeof eventName !== 'string') return false;
      const onceKey = options.onceKey || '';
      if (onceKey && fired.has(onceKey)) return false;
      if (onceKey) fired.add(onceKey);

      const detail = {
        name: eventName,
        properties: { ...context.utm, page_path: context.page_path, ...properties },
        timestamp: new Date().toISOString()
      };
      window.dispatchEvent(new CustomEvent('kz:analytics', { detail }));
      if (config.debugAnalytics) console.info('[KZ analytics]', detail);
      if (typeof config.trackEvent === 'function') {
        try { config.trackEvent(eventName, detail.properties); }
        catch (error) { if (config.debugAnalytics) console.warn('[KZ analytics adapter]', error); }
      }
      return true;
    } catch (error) {
      if (config.debugAnalytics) console.warn('[KZ analytics]', error);
      return false;
    }
  }

  function observeSections() {
    if (!('IntersectionObserver' in window)) return;
    const targets = [
      ['#journey', EVENT_NAMES.VIEW_ZERO_TO_ONE],
      ['#now', EVENT_NAMES.VIEW_RIGHT_NOW],
      ['#next', EVENT_NAMES.VIEW_WHATS_NEXT]
    ];
    const timers = new WeakMap();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          if (timers.has(entry.target)) return;
          const timer = window.setTimeout(() => {
            const eventName = entry.target.dataset.analyticsView;
            trackEvent(eventName, { section_id: entry.target.id }, { onceKey: eventName });
            observer.unobserve(entry.target);
            timers.delete(entry.target);
          }, 700);
          timers.set(entry.target, timer);
        } else if (timers.has(entry.target)) {
          clearTimeout(timers.get(entry.target));
          timers.delete(entry.target);
        }
      });
    }, { threshold: [0.3] });
    targets.forEach(([selector, eventName]) => {
      const element = document.querySelector(selector);
      if (!element) return;
      element.dataset.analyticsView = eventName;
      observer.observe(element);
    });
  }

  function observeScrollDepth() {
    const thresholds = [25, 50, 75, 90];
    let scheduled = false;
    const measure = () => {
      scheduled = false;
      const root = document.documentElement;
      const available = Math.max(root.scrollHeight - window.innerHeight, 1);
      const percent = Math.min(100, Math.round((window.scrollY / available) * 100));
      thresholds.forEach(depth => {
        if (percent >= depth) trackEvent(`scroll_${depth}`, { depth_percent: depth }, { onceKey: `scroll_${depth}` });
      });
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
  }

  function loadCloudflareAnalytics() {
    const token = config.cloudflareToken || '';
    if (!/^[a-f0-9]{32}$/i.test(token)) return;
    if (document.querySelector('script[src*="static.cloudflareinsights.com/beacon.min.js"]')) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset.cfBeacon = JSON.stringify({ token });
    script.addEventListener('error', () => script.remove(), { once: true });
    document.head.appendChild(script);
  }

  window.trackEvent = trackEvent;
  window.KZTracking = Object.freeze({
    trackEvent,
    getContext: () => JSON.parse(JSON.stringify(context)),
    events: EVENT_NAMES
  });

  observeSections();
  observeScrollDepth();
  loadCloudflareAnalytics();
})();
