// App-style controls reuse the catalogue and native dialog behaviour.
// Desktop layouts and product data remain owned by the main page.
export function initMobileUI({ openDialog, closeDialog, setFilter, getActiveFilter, resetFilters, focusSection, reduceMotion }) {
  const $ = selector => document.querySelector(selector);
  const mobile = window.matchMedia('(max-width: 900px)');
  const filterDialog = $('#filter-dialog');
  const filterForm = $('#mobile-filter-form');
  const filterTrigger = $('#mobile-filter-open');
  const filterNames = {
    all: 'Filter range', shredded: 'Shredded', diced: 'Diced',
    slices: 'Slices', blocks: 'Blocks', noodle: 'Noodle cut',
  };

  function syncRadio() {
    filterForm?.querySelectorAll('input[name="format"]').forEach(input => {
      input.checked = input.value === getActiveFilter();
    });
  }

  function syncFilters(resultCount) {
    const active = getActiveFilter();
    const label = filterTrigger?.querySelector('[data-filter-label]');
    const count = filterTrigger?.querySelector('[data-filter-count]');
    if (label) label.textContent = filterNames[active] || filterNames.all;
    if (count) {
      count.textContent = String(resultCount);
    }
    filterTrigger?.classList.toggle('has-filter', active !== 'all');
    // Do not overwrite a staged choice while the sheet is open.
    if (!filterDialog?.open) syncRadio();
    const mobileSearch = $('#mobile-search');
    if (mobileSearch && document.activeElement !== mobileSearch) {
      mobileSearch.value = $('#product-search')?.value || '';
    }
  }

  filterTrigger?.addEventListener('click', event => {
    syncRadio();
    openDialog(filterDialog, event.currentTarget);
    filterTrigger.setAttribute('aria-expanded', 'true');
  });
  filterDialog?.addEventListener('close', () => {
    filterTrigger?.setAttribute('aria-expanded', 'false');
    syncRadio();
  });
  filterForm?.addEventListener('submit', event => {
    event.preventDefault();
    const chosen = new FormData(filterForm).get('format');
    setFilter(Object.hasOwn(filterNames, chosen) ? chosen : 'all');
    closeDialog(filterDialog);
  });
  $('#mobile-filter-reset')?.addEventListener('click', () => {
    resetFilters();
    syncRadio();
  });

  $('#mobile-search-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const query = ($('#mobile-search')?.value || '').trim();
    const catalogueSearch = $('#product-search');
    if (catalogueSearch) catalogueSearch.value = query;
    setFilter('all');
    focusSection('#range');
  });

  document.addEventListener('click', event => {
    const homeLink = event.target.closest('a[href="#home"]');
    // Drawer links already close the dialog before calling focusSection.
    if (!mobile.matches || !homeLink || homeLink.closest('#menu-dialog')) return;
    event.preventDefault();
    focusSection('#home');
  });
  function restoreMobileHome() {
    requestAnimationFrame(() => {
      if (mobile.matches && window.location.hash === '#home') {
        focusSection('#home', { instant: true, focus: false });
      }
    });
  }
  if (document.readyState === 'complete') restoreMobileHome();
  else window.addEventListener('load', restoreMobileHome, { once: true });
  window.addEventListener('hashchange', restoreMobileHome);

  // No content is hidden until JS runs. Already-visible content never fades out.
  let revealObserver;
  let revealTargets = [];
  function refreshReveals() {
    revealObserver?.disconnect();
    revealTargets.forEach(node => node.classList.remove('mobile-reveal-ready', 'mobile-revealed'));
    revealTargets = [];
    if (!mobile.matches || reduceMotion.matches || !('IntersectionObserver' in window)) return;
    revealTargets = [...document.querySelectorAll(
      'main > section:not(#home) .section-heading, .food-tile, .occasion-card, .story-copy, .kitchen-copy, .faq-intro, .contact-copy, .footer-brand',
    )];
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('mobile-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -16px 0px' });
    revealTargets.forEach(node => {
      if (node.getBoundingClientRect().top < window.innerHeight) {
        node.classList.add('mobile-revealed');
      } else {
        node.classList.add('mobile-reveal-ready');
        revealObserver.observe(node);
      }
    });
  }
  mobile.addEventListener('change', refreshReveals);
  reduceMotion.addEventListener('change', refreshReveals);
  refreshReveals();
  return { syncFilters };
}
