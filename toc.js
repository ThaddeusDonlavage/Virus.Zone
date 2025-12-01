// Smooth scrolling and active TOC highlight
document.addEventListener('DOMContentLoaded', () => {
  const tocLinks = Array.from(document.querySelectorAll('#toc-list a'));
  const headingElems = tocLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const h2Elems = Array.from(document.querySelectorAll('h2[id]'));

  // Smooth scroll for toc links and set active states for both h3 and its parent h2
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href');
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // update active class: clear then add for clicked and parent h2
      tocLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      // if clicked link points to an h3, also highlight its parent h2
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        let parentH2 = null;
        for (const h2 of h2Elems) {
          if (h2.getBoundingClientRect().top <= target.getBoundingClientRect().top) parentH2 = h2;
        }
        if (parentH2) {
          const parentLink = tocLinks.find(l => l.getAttribute('href') === ('#' + parentH2.id));
          if (parentLink) parentLink.classList.add('active');
        }
      }
    });
  });

  // Highlight current section while scrolling and ensure parent H2 is highlighted
  function onScroll() {
    let current = null;
    for (const el of headingElems) {
      if (el.getBoundingClientRect().top - 120 <= 0) {
        current = el;
      }
    }
    if (!current && headingElems.length) current = headingElems[0];
    tocLinks.forEach(l => l.classList.remove('active'));
    if (current) {
      const match = tocLinks.find(l => l.getAttribute('href') === ('#' + current.id));
      if (match) match.classList.add('active');
      // highlight nearest preceding H2 as well
      let parentH2 = null;
      for (const h2 of h2Elems) {
        if (h2.getBoundingClientRect().top - 120 <= 0) parentH2 = h2;
      }
      if (parentH2) {
        const parentLink = tocLinks.find(l => l.getAttribute('href') === ('#' + parentH2.id));
        if (parentLink) parentLink.classList.add('active');
      }
    }
  }

  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
