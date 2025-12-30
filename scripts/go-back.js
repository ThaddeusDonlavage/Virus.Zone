// Expose an injectGoBack function to place a "Go back" control near a TOC-like element
// Usage: window.injectGoBack({ href, label, placement: 'inside'|'outside', tocSelector })


//How to use:
/*
Data-attr (existing): add data-go-back-href / data-go-back-label / data-go-back-placement="inside|outside" to the <body> or .toc-container and the script will auto-run.
Programmatic: call from any script:
window.injectGoBack({ href: '../rules/distros.html', label: 'Character Distribution', placement: 'outside', tocSelector: '#toc-container' });

*/

(function(){
  function injectGoBack(opts = {}){
    // mark that the function has been called programmatically to prevent the auto-run from overriding
    window.__injectGoBackCalled = true;
    const tocSelector = opts.tocSelector || '#toc-container';
    let toc = document.querySelector(tocSelector) || document.querySelector('.toc-container');

    // single instance (create immediately so programmatic calls can update it)
    let el = document.querySelector('.toc-go-back');
    if(!el){
      el = document.createElement('a');
      el.className = 'toc-go-back';
      el.setAttribute('role','link');
      el.setAttribute('tabindex','0');
      // default to offscreen/hidden until positioned
      el.style.display = 'none';
      document.body.appendChild(el);
    }

    const href = opts.href || document.body.dataset.goBackHref || (toc && toc.dataset.goBackHref) || '../rules/distros.html';
    const label = opts.label || document.body.dataset.goBackLabel || (toc && toc.dataset.goBackLabel) || 'Character Distribution';
    const placement = opts.placement || document.body.dataset.goBackPlacement || (toc && toc.dataset.goBackPlacement) || 'outside';

    // Apply href/label immediately so the page reflects desired destination
    el.href = href;
    el.textContent = 'Go back to ' + label;
    el.setAttribute('aria-label', el.textContent);

    // Basic keyboard activation (Enter/Space)
    el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); window.location.href = el.href; }});

    // positioning helpers
    let resizeHandler = null;
    let resizeObserver = null;
    function placeInside(){
      // cleanup any outside watchers/observers
      if(resizeHandler) { window.removeEventListener('resize', resizeHandler); window.removeEventListener('scroll', resizeHandler); resizeHandler = null; }
      try{ if(resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; } }catch(e){}

      el.classList.remove('fixed');
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.display = 'block';
      el.style.paddingLeft = '';
      el.style.paddingRight = '';
      if(toc && toc.appendChild) toc.appendChild(el);
    }

    function placeOutside(tryOnce){
      el.classList.add('fixed');
      el.style.display = 'block';
      document.body.appendChild(el);

      const update = () => {
        toc = document.querySelector(tocSelector) || document.querySelector('.toc-container');
        if(!toc){
          // place at default right offset if TOC missing
          const defaultRight = 24;
          el.style.position = 'fixed';
          el.style.right = defaultRight + 'px';
          el.style.left = 'auto';
          el.style.top = '140px';
          el.style.width = '220px';
          el.style.paddingLeft = '';
          el.style.paddingRight = '';
          el.style.boxSizing = 'border-box';
          return;
        }
        const rect = toc.getBoundingClientRect();
        const st = window.getComputedStyle(toc);
        if(st.display === 'none' || rect.height === 0){ el.style.display = 'none'; return; }
        el.style.display = 'block';
        el.style.position = 'fixed';
        // align left edge and width to the toc so it matches exactly
        // align left edge and width to the TOC so it matches exactly (rounded pixel values)
        el.style.left = Math.round(rect.left) + 'px';
        el.style.top = Math.round(rect.bottom + 8) + 'px';
        el.style.width = Math.round(rect.width) + 'px';
        el.style.boxSizing = 'border-box';
        // remove any previously set right value from fallback positioning
        el.style.right = 'auto';
        // copy horizontal padding from toc so the visual padding aligns when widths match
        try{
          const st = window.getComputedStyle(toc);
          el.style.paddingLeft = st.paddingLeft;
          el.style.paddingRight = st.paddingRight;
        }catch(e){}

      };

      // run now and ensure handlers are attached once
      update();

      // window resize/scroll handlers
      if(resizeHandler) window.removeEventListener('resize', resizeHandler);
      resizeHandler = update;
      window.addEventListener('resize', resizeHandler);
      window.addEventListener('scroll', update, { passive: true });

      // observe TOC size changes if supported (keeps alignment when TOC contents change)
      try{
        if(window.ResizeObserver){
          if(resizeObserver) resizeObserver.disconnect();
          resizeObserver = new ResizeObserver(update);
          resizeObserver.observe(toc);
        }
      }catch(e){ /* ignore */ }

    }

    // If placement is inside but toc is not yet available, attempt to watch for it
    if(placement === 'inside'){
      if(toc) placeInside(); else {
        // watch for an insertion of the toc
        const mo = new MutationObserver((mut)=>{
          toc = document.querySelector(tocSelector) || document.querySelector('.toc-container');
          if(toc){ placeInside(); mo.disconnect(); }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
        // set a fallback displayed state
        el.style.display = 'none';
      }
    } else {
      // outside placement: attempt to position now and watch for toc if missing
      placeOutside();
      if(!toc){
        const mo2 = new MutationObserver((mut)=>{
          toc = document.querySelector(tocSelector) || document.querySelector('.toc-container');
          if(toc){ placeOutside(); mo2.disconnect(); }
        });
        mo2.observe(document.documentElement, { childList: true, subtree: true });
      }
    }

    return el;
  }

  // expose globally
  window.injectGoBack = injectGoBack;

  // Auto-run using data attributes if DOM is ready
  // If the function was already called programmatically before DOMContentLoaded, skip the auto-run to avoid overriding explicit options.
  document.addEventListener('DOMContentLoaded', function(){
    if(window.__injectGoBackCalled) return; // programmatic call already executed

    // Only auto-run if data attributes are present or there is no existing button
    const hasData = Boolean(document.body.dataset.goBackHref || document.body.dataset.goBackLabel || document.body.dataset.goBackPlacement || document.querySelector('.toc-container')?.dataset.goBackHref || document.querySelector('.toc-container')?.dataset.goBackLabel);
    const exists = Boolean(document.querySelector('.toc-go-back'));
    if(!hasData && exists) return;

    injectGoBack({
      href: document.body.dataset.goBackHref,
      label: document.body.dataset.goBackLabel,
      placement: document.body.dataset.goBackPlacement || document.querySelector('.toc-container')?.dataset.goBackPlacement || 'outside',
      tocSelector: '#toc-container'
    });
  });
})();