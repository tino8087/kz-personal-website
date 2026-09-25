(() => {
  const root = document.documentElement;
  const stage = document.querySelector('.creation-scroll');
  if (!stage) return;

  const navLinks = [...document.querySelectorAll('.nav-links a')];
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

  let scheduled = false;
  const update = () => {
    scheduled = false;
    const rect = stage.getBoundingClientRect();
    const travel = Math.max(stage.offsetHeight - window.innerHeight, 1);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    root.style.setProperty('--progress', progress.toFixed(3));
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const phaseTwo = clamp((progress - .2) / .38);
    const phaseThree = clamp((progress - .62) / .3);
    const sceneOne = clamp(1 - progress / .24);
    const sceneTwo = Math.min(clamp((progress - .16) / .18), clamp((.72 - progress) / .16));
    const sceneThree = clamp((progress - .62) / .18);
    root.style.setProperty('--scene-one', sceneOne.toFixed(3));
    root.style.setProperty('--scene-two', sceneTwo.toFixed(3));
    root.style.setProperty('--scene-three', sceneThree.toFixed(3));
    root.style.setProperty('--phase-two', phaseTwo.toFixed(3));
    root.style.setProperty('--phase-three', phaseThree.toFixed(3));
    root.style.setProperty('--card-one-exit', clamp(progress / .34).toFixed(3));
    root.style.setProperty('--card-two-enter', clamp((progress - .16) / .28).toFixed(3));
    root.style.setProperty('--card-two-exit', clamp((progress - .6) / .2).toFixed(3));
    root.style.setProperty('--card-three-enter', clamp((progress - .62) / .28).toFixed(3));
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
  update();
})();
