// comps-render.js
// Fetches a JSON file (path specified on the container via data-src) and renders a comp-grid
// Usage: include a container like:
// <div id="comp-grid" class="comp-grid" data-src="../data/comps.json"></div>
// <script src="../scripts/comps-render.js"></script>

(function () {
  function createCard(comp) {
    const card = document.createElement('div');
    card.className = 'comp-card';

    const h3 = document.createElement('h3');
    h3.textContent = comp.name;
    card.appendChild(h3);

    const desc = document.createElement('p');
    desc.textContent = comp.description;
    card.appendChild(desc);

    const list = document.createElement('ul');
    list.className = 'comp-features';

    function li(label, value) {
      const item = document.createElement('li');
      const left = document.createElement('span');
      left.textContent = label;
      const right = document.createElement('span');
      right.className = 'comp-badge';
      right.textContent = value;
      item.appendChild(left);
      item.appendChild(right);
      return item;
    }

    list.appendChild(li('Chip Capacity', comp.chipCapacity != null ? comp.chipCapacity : '—'));
    list.appendChild(li('Thread Count', comp.threadCount != null ? comp.threadCount : '—'));
    list.appendChild(li('Cache Size', comp.cacheSize != null ? comp.cacheSize : '—'));
    list.appendChild(li('Battery Life', comp.batteryLife || '—'));

    card.appendChild(list);
    return card;
  }

  async function render(container) {
    const src = container.dataset.src;
    if (!src) {
      console.warn('comps-render: container has no data-src attribute');
      return;
    }
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error('Failed to fetch ' + src);
      const comps = await res.json();

      // clear container
      container.innerHTML = '';
      container.classList.add('comp-grid');

      comps.forEach(comp => {
        const card = createCard(comp);
        container.appendChild(card);
      });

      // Expose accessor for other scripts
      window.getCompsData = function () { return comps; };

    } catch (err) {
      console.error('comps-render error', err);
      container.innerHTML = '<p style="color: #f66">Failed to load COMP data.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Find all containers that want comps data
    const containers = Array.from(document.querySelectorAll('[data-comps-src], #comp-grid'));
    containers.forEach(c => {
      // priority: data-comps-src, then data-src on #comp-grid
      const srcAttr = c.dataset.compsSrc || c.dataset.src;
      if (srcAttr) c.dataset.src = srcAttr; // normalize
      render(c);
    });
  });
})();
