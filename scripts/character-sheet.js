(function () {
  const form = document.getElementById('character-sheet');
  const status = document.getElementById('sheet-status');
  const resetButton = document.getElementById('sheet-reset');
  const storageKey = 'virus-zone-character-sheet';

  if (!form) return;

  function saveSheet() {
    const data = Object.fromEntries(new FormData(form).entries());
    localStorage.setItem(storageKey, JSON.stringify(data));
    if (status) {
      status.textContent = 'Sheet saved locally.';
    }
  }

  function loadSheet() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field) {
          field.value = value;
        }
      });
      if (status) {
        status.textContent = 'Loaded your saved sheet.';
      }
    } catch (err) {
      console.warn('Failed to load character sheet', err);
    }
  }

  function resetSheet() {
    form.reset();
    localStorage.removeItem(storageKey);
    if (status) {
      status.textContent = 'Sheet cleared.';
    }
  }

  form.addEventListener('input', saveSheet);
  form.addEventListener('change', saveSheet);
  resetButton?.addEventListener('click', resetSheet);

  loadSheet();
})();
