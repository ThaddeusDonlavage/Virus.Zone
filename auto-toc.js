/**
 * Auto-generating Table of Contents
 * 
 * Usage: include this script at the end of any page with h2/h3 headers.
 * It will:
 * 1. Auto-assign IDs to all h2 and h3 elements (if missing)
 * 2. Generate a TOC structure in #toc-container (or create one)
 * 3. Add smooth scrolling and active highlighting
 * 
 * No need to manually add IDs or TOC markup!
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get all h2, h3 and h4 elements from the main content
  const headings = Array.from(document.querySelectorAll('main h2, main h3, main h4'));
  
  if (headings.length === 0) return; // No headers, skip

  // Auto-assign IDs to headings that don't have them
  headings.forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent.toLowerCase()
        .replace(/[^\w\s]/g, '')  // Remove special chars
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .substring(0, 60);         // Limit length
      heading.id = text || `heading-${index}`;
    }
  });

  // Generate TOC structure
  const tocContainer = document.getElementById('toc-container') || createTocContainer();
  const tocList = document.getElementById('toc-list') || document.createElement('ul');
  tocList.id = 'toc-list';
  tocList.className = 'toc-list';
  tocList.innerHTML = ''; // Clear existing

  let currentH2Item = null;
  const h2H4Map = new Map(); // map h2 id -> h4 container element
  headings.forEach(heading => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + heading.id;
    a.textContent = heading.textContent;

    if (heading.tagName === 'H2') {
      li.appendChild(a);
      tocList.appendChild(li);
      currentH2Item = li; // Track current H2 for nesting H3s
      // create a hidden H4 container for this H2 (will be shown only when this H2 is active)
      const h4Container = document.createElement('ul');
      h4Container.className = 'toc-h4-list';
      h4Container.style.display = 'none';
      h4Container.style.marginLeft = '12px';
      h4Container.style.listStyle = 'none';
      h4Container.style.padding = '0';
      currentH2Item.appendChild(h4Container);
      h2H4Map.set(heading.id, h4Container);
    } else if (heading.tagName === 'H3' && currentH2Item) {
      // Nest H3 under the current H2
      let subList = currentH2Item.querySelector('ul');
      if (!subList) {
        subList = document.createElement('ul');
        subList.style.marginLeft = '8px';
        subList.style.listStyle = 'none';
        subList.style.padding = '0';
        currentH2Item.appendChild(subList);
      }
      const subLi = document.createElement('li');
      subLi.appendChild(a);
      subList.appendChild(subLi);
    }
    else if (heading.tagName === 'H4' && currentH2Item) {
      // Add H4 under the H2's dedicated H4 container (hidden unless H2 active)
      const h4List = h2H4Map.get(currentH2Item.querySelector('a').getAttribute('href').substring(1));
      if (h4List) {
        const h4Li = document.createElement('li');
        h4Li.appendChild(a);
        h4List.appendChild(h4Li);
      }
    }
  });

  // Append TOC list to container if not already there
  if (!tocContainer.querySelector('#toc-list')) {
    tocContainer.appendChild(tocList);
  }

  // Smooth scroll for toc links and set active states for both h3 and its parent h2
  const tocLinks = Array.from(tocContainer.querySelectorAll('.toc-list a'));
  const h2Elems = headings.filter(h => h.tagName === 'H2');

  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href');
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update active class
      tocLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      // If clicked link points to an h3, also highlight its parent h2
      const target = document.querySelector(link.getAttribute('href'));
      if (target && target.tagName === 'H3') {
        let parentH2 = null;
        for (const h2 of h2Elems) {
          if (h2.getBoundingClientRect().top <= target.getBoundingClientRect().top) parentH2 = h2;
        }
        if (parentH2) {
          const parentLink = tocLinks.find(l => l.getAttribute('href') === ('#' + parentH2.id));
          if (parentLink) parentLink.classList.add('active');
          // show h4s for this parent H2 and hide others
          showH4ForH2(parentH2.id);
        }
      }
      // If clicked an H2 link, show its H4s
      if (target && target.tagName === 'H2') {
        showH4ForH2(target.id);
      }
    });
  });

  // Highlight current section while scrolling
  function onScroll() {
    let current = null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - 120 <= 0) {
        current = heading;
      }
    }
    if (!current && headings.length) current = headings[0];
    tocLinks.forEach(l => l.classList.remove('active'));
    if (current) {
      const match = tocLinks.find(l => l.getAttribute('href') === ('#' + current.id));
      if (match) match.classList.add('active');
      // Highlight nearest preceding H2 as well
      if (current.tagName === 'H3') {
        let parentH2 = null;
        for (const h2 of h2Elems) {
          if (h2.getBoundingClientRect().top - 120 <= 0) parentH2 = h2;
        }
        if (parentH2) {
          const parentLink = tocLinks.find(l => l.getAttribute('href') === ('#' + parentH2.id));
          if (parentLink) parentLink.classList.add('active');
          // show h4s for this parent H2 and hide others
          showH4ForH2(parentH2.id);
        }
      }
      else if (current.tagName === 'H2') {
        // when an H2 is active, show its H4s
        showH4ForH2(current.id);
      }
    }
  }

  // show h4-list for a given h2 id, hide others
  function showH4ForH2(h2id) {
    for (const [id, h4El] of h2H4Map.entries()) {
      if (id === h2id) {
        h4El.style.display = '';
      } else {
        h4El.style.display = 'none';
      }
    }
  }

  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});

/**
 * Create the TOC container if it doesn't exist
 */
function createTocContainer() {
  const container = document.createElement('aside');
  container.id = 'toc-container';
  container.className = 'toc-container';
  container.setAttribute('aria-label', 'Page contents');

  const heading = document.createElement('h4');
  heading.textContent = 'Contents';
  container.appendChild(heading);

  document.body.insertBefore(container, document.querySelector('main'));
  return container;
}
