(() => {
  const root = document.documentElement;
  const stage = document.querySelector('.creation-scroll');
  if (!stage) return;

  const navLinks = [...document.querySelectorAll('.nav-links a')];
  document.querySelectorAll('[data-track-event]').forEach((link) => {
    link.addEventListener('click', () => {
      try {
        window.trackEvent?.(link.dataset.trackEvent, {
          placement: link.dataset.trackPlacement || 'website'
        });
      } catch (_) { /* Analytics must never affect navigation. */ }
    });
  });
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const navSections = [
    { element: document.querySelector('#opening'), href: null },
    { element: document.querySelector('#about'), href: '#about' },
    { element: document.querySelector('#creation'), href: '#creation' },
    { element: document.querySelector('#life'), href: '#creation' },
    { element: document.querySelector('#links'), href: '#links' }
  ].filter(({ element }) => element);

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -3% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const copies = [...document.querySelectorAll('.copy-scene')];
  const cards = [...document.querySelectorAll('.media-card')];
  const staticLayout = window.matchMedia('(max-height: 740px) and (max-width: 760px), (max-height: 600px), (prefers-reduced-motion: reduce)');
  let previousScene = -1;
  let previousStatic = null;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const rect = stage.getBoundingClientRect();
    const travel = Math.max(stage.offsetHeight - window.innerHeight, 1);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    root.style.setProperty('--progress', progress.toFixed(3));
    const active = Math.min(2, Math.floor(progress * 3));
    const allVisible = staticLayout.matches;
    if (active !== previousScene || allVisible !== previousStatic) {
      copies.forEach((copy, index) => {
        copy.classList.toggle('is-current', index === active);
        copy.inert = !allVisible && index !== active;
        copy.setAttribute('aria-hidden', String(!allVisible && index !== active));
      });
      cards.forEach((card, index) => {
        card.classList.toggle('is-current', index === active);
        card.classList.toggle('is-past', index < active);
        card.inert = !allVisible && index !== active;
        card.setAttribute('aria-hidden', String(!allVisible && index !== active));
      });
      document.dispatchEvent(new CustomEvent('kz:scene-change'));
      previousScene = active;
      previousStatic = allVisible;
    }
    const readingLine = window.innerHeight * .42;
    const activeSection = navSections.find(({ element }) => {
      const bounds = element.getBoundingClientRect();
      return bounds.top <= readingLine && bounds.bottom > readingLine;
    });

    navLinks.forEach((link) => {
      const isActive = activeSection && link.getAttribute('href') === activeSection.href;
      link.classList.toggle('is-active', Boolean(isActive));
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    parallaxItems.forEach((item) => {
      if (reduceMotion.matches) {
        item.style.setProperty('--parallax-y', '0px');
        item.style.setProperty('--parallax-y-alt', '0px');
        item.style.setProperty('--parallax-y-shape', '0px');
        return;
      }

      const bounds = item.getBoundingClientRect();
      const itemCenter = bounds.top + bounds.height / 2;
      const distance = Math.max(-1, Math.min(1, (itemCenter - window.innerHeight / 2) / window.innerHeight));
      const mobileScale = window.innerWidth <= 760 ? .45 : 1;
      const direction = item.dataset.parallax === 'tennis' ? -1 : 1;
      const offset = distance * 13 * mobileScale * direction;
      item.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      item.style.setProperty('--parallax-y-alt', `${(-offset * .65).toFixed(2)}px`);
      item.style.setProperty('--parallax-y-shape', `${(offset * .38).toFixed(2)}px`);
    });
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reduceMotion.addEventListener("change", schedule);
  document.addEventListener("kz:content-ready", schedule);
  update();
})();
