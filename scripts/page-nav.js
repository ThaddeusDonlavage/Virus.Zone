// Inject simple previous/next page navigation into the bottom of the main content
// Usage (data attributes):
//   <body data-page-prev-href="../rules/distros.html" data-page-prev-label="Character Distribution" data-page-next-href="../lore/cosmOS.html" data-page-next-label="cosmOS"></body>
// Or programmatic:
//   window.injectPageNav({ prevHref, prevLabel, nextHref, nextLabel, containerSelector });

(function(){
  function createAnchor(href, label, cls){
    const a = document.createElement('a');
    a.href = href;
    a.className = (cls || '') + ' ' + (cls.includes('prev') ? 'prev' : '') + ' ' + (cls.includes('next') ? 'next' : '');
    a.setAttribute('aria-label', 'Go to ' + label);
    a.textContent = 'Go to ' + label;
    // keyboard activation handled by normal link behavior
    return a;
  }

  function injectPageNav(opts = {}){
    window.__injectPageNavCalled = true;
    const container = document.querySelector(opts.containerSelector || 'main.container') || document.querySelector('main');
    if(!container) return null;

    // remove existing nav if present
    let existing = container.querySelector('nav.page-nav');
    if(existing) existing.remove();

    const prevHref = opts.prevHref || document.body.dataset.pagePrevHref;
    const prevLabel = opts.prevLabel || document.body.dataset.pagePrevLabel;
    const nextHref = opts.nextHref || document.body.dataset.pageNextHref;
    const nextLabel = opts.nextLabel || document.body.dataset.pageNextLabel;

    if(!prevHref && !nextHref) return null; // nothing to do

    const nav = document.createElement('nav');
    nav.className = 'page-nav';

    if(prevHref){
      const aPrev = createAnchor(prevHref, prevLabel || 'Previous', 'page-nav-prev');
      aPrev.classList.add('prev');
      nav.appendChild(aPrev);
    } else {
      // spacer to keep next aligned right
      const spacer = document.createElement('div'); spacer.style.flex = '1'; nav.appendChild(spacer);
    }

    if(nextHref){
      const aNext = createAnchor(nextHref, nextLabel || 'Next', 'page-nav-next');
      aNext.classList.add('next');
      nav.appendChild(aNext);
    }

    container.appendChild(nav);
    return nav;
  }

  window.injectPageNav = injectPageNav;

  document.addEventListener('DOMContentLoaded', function(){
    if(window.__injectPageNavCalled) return; // programmatic call already made
    const hasData = Boolean(document.body.dataset.pagePrevHref || document.body.dataset.pageNextHref || document.body.dataset.pagePrevLabel || document.body.dataset.pageNextLabel);
    if(!hasData) return;
    injectPageNav({});
  });
})();