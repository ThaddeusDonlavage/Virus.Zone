// Lightweight chip renderer
// Finds elements with class `chip-ref` and data-chip-id or data-chip-name
// Replaces/augments them with a small `.chip-card` containing chip facts.

(async function(){
  const refs = Array.from(document.querySelectorAll('.chip-ref'));
  if(refs.length === 0) return;

  let data;
  try{
    const res = await fetch('../data/chips.json');
    if(!res.ok) throw new Error('chips json fetch failed');
    data = await res.json();
  }catch(e){
    console.warn('Could not load chips.json', e);
    // degrade gracefully: leave refs as-is
    return;
  }

  function findChip(ref){
    const id = ref.dataset.chipId || ref.dataset.chipid || ref.getAttribute('data-chip-id');
    const name = ref.dataset.chipName || ref.dataset.chipname || ref.getAttribute('data-chip-name');
    if(id){
      return data.find(c => String(c.id) === String(id));
    }
    if(name){
      return data.find(c => c.name.toLowerCase() === String(name).toLowerCase());
    }
    // try to match by innerText as fallback
    const text = ref.textContent.trim().toLowerCase();
    return data.find(c => c.name.toLowerCase() === text);
  }

  refs.forEach(ref => {
    const chip = findChip(ref);
    if(!chip) {
      ref.classList.add('chip-unknown');
      return;
    }

    // Build card
    const card = document.createElement('div');
    card.className = 'chip-card';
    card.setAttribute('role','region');
    card.setAttribute('aria-label', `Chip: ${chip.name}`);

    const h = document.createElement('h4');
    h.textContent = chip.name;

    const badge = document.createElement('span');
    badge.className = 'chip-badge';
    badge.textContent = chip.tier || '';
    h.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'chip-type';
    const tags = (chip.tags || []).join(' • ');
    meta.textContent = `${chip.type || ''}${tags ? ' • ' + tags : ''}`;

    const desc = document.createElement('p');
    desc.className = 'chip-desc';
    desc.textContent = chip.description || '';

    card.appendChild(h);
    card.appendChild(meta);
    card.appendChild(desc);

    // Mode: inline by default; allow popover on hover if data-mode="popover"
    const mode = (ref.dataset.mode || '').toLowerCase();
    if(mode === 'popover'){
      card.classList.add('popover');
      // position later using absolute coords
      document.body.appendChild(card);
      ref.addEventListener('mouseenter', ()=>{
        const r = ref.getBoundingClientRect();
        card.style.left = (window.scrollX + r.right + 12) + 'px';
        card.style.top = (window.scrollY + r.top - 4) + 'px';
        card.style.display = 'block';
      });
      ref.addEventListener('mouseleave', ()=>{ card.style.display = 'none'; });
      card.style.display = 'none';
    } else {
      // Inline: place after the reference
      ref.insertAdjacentElement('afterend', card);
    }

  });
})();