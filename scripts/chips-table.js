/**
 * Chips Table Renderer
 * Reads chips.json and renders a sortable, filterable table with column toggles and keyword search
 */

class ChipsTable {
  constructor(dataPath) {
    this.allChips = [];
    this.visibleColumns = {
      name: true,
      source: true,
      type: true,
      tier: true,
      tags: true,
      description: true,
      flavor: false
    };
    this.currentSort = { field: 'name', ascending: true };
    this.searchQuery = '';
    this.dataPath = dataPath;
    this.selectedFilters = {
      source: 'All',
      type: 'All',
      tier: 'All',
      tags: 'All'
    };
    this.filterOptions = {
      source: [],
      type: [],
      tier: [],
      tags: []
    };
    this.pageSize = 40;
    this.currentPage = 1;
  }

  async loadChips() {
    try {
      const res = await fetch(this.dataPath);
      if (!res.ok) throw new Error('Failed to fetch chips.json');
      this.allChips = await res.json();
      // populate filter options now that we have the data
      this.populateFilterOptions();
      this.renderTable();
    } catch (err) {
      console.error('chips-table error:', err);
      const container = document.getElementById('chips-table-result');
      if (container) {
        container.innerHTML = '<p style="color: #f66">Failed to load chips data.</p>';
      }
    }
  }

  getVisibleColumns() {
    return Object.keys(this.visibleColumns).filter(col => this.visibleColumns[col]);
  }

  filterChips() {
    // start with all chips
    let set = [...this.allChips];

    // apply search query across all fields
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      set = set.filter(chip => {
        return Object.values(chip).some(val => {
          if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(query));
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // apply source/type/tier filters (if not 'All')
    if (this.selectedFilters.source && this.selectedFilters.source !== 'All') {
      set = set.filter(chip => String(chip.source || '').toLowerCase() === String(this.selectedFilters.source).toLowerCase());
    }
    if (this.selectedFilters.type && this.selectedFilters.type !== 'All') {
      set = set.filter(chip => String(chip.type || '').toLowerCase() === String(this.selectedFilters.type).toLowerCase());
    }
    if (this.selectedFilters.tier && this.selectedFilters.tier !== 'All') {
      set = set.filter(chip => String(chip.tier || '').toLowerCase() === String(this.selectedFilters.tier).toLowerCase());
    }

    // tags: single-select (if not 'All') include chips that have the tag
    if (this.selectedFilters.tags && this.selectedFilters.tags !== 'All') {
      const selTag = String(this.selectedFilters.tags).toLowerCase();
      set = set.filter(chip => {
        const chipTags = (chip.tags || []).map(t => String(t).toLowerCase());
        return chipTags.includes(selTag);
      });
    }

    return set;
  }

  sortChips(chips) {
    return [...chips].sort((a, b) => {
      const aVal = a[this.currentSort.field];
      const bVal = b[this.currentSort.field];
      if (typeof aVal === 'string') {
        const cmp = String(aVal).localeCompare(String(bVal));
        return this.currentSort.ascending ? cmp : -cmp;
      }
      if (aVal < bVal) return this.currentSort.ascending ? -1 : 1;
      if (aVal > bVal) return this.currentSort.ascending ? 1 : -1;
      return 0;
    });
  }

  populateFilterOptions() {
    // compute unique values
    const sources = new Set();
    const types = new Set();
    const tiers = new Set();
    const tags = new Set();
    this.allChips.forEach(chip => {
      if (chip.source) sources.add(chip.source);
      if (chip.type) types.add(chip.type);
      if (chip.tier) tiers.add(chip.tier);
      if (Array.isArray(chip.tags)) chip.tags.forEach(t => tags.add(t));
    });
    this.filterOptions.source = Array.from(sources).sort();
    this.filterOptions.type = Array.from(types).sort();
    this.filterOptions.tier = Array.from(tiers).sort();
    this.filterOptions.tags = Array.from(tags).sort();

    // populate DOM selects if they exist
    const sourceSel = document.getElementById('filter-source');
    const typeSel = document.getElementById('filter-type');
    const tierSel = document.getElementById('filter-tier');
    const tagSel = document.getElementById('filter-tags');

    if (sourceSel) {
      sourceSel.innerHTML = '';
      const optAll = document.createElement('option'); optAll.value = 'All'; optAll.textContent = 'All'; sourceSel.appendChild(optAll);
      this.filterOptions.source.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; sourceSel.appendChild(o); });
      sourceSel.value = this.selectedFilters.source;
    }
    if (typeSel) {
      typeSel.innerHTML = '';
      const optAll = document.createElement('option'); optAll.value = 'All'; optAll.textContent = 'All'; typeSel.appendChild(optAll);
      this.filterOptions.type.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; typeSel.appendChild(o); });
      typeSel.value = this.selectedFilters.type;
    }
    if (tierSel) {
      tierSel.innerHTML = '';
      const optAll = document.createElement('option'); optAll.value = 'All'; optAll.textContent = 'All'; tierSel.appendChild(optAll);
      this.filterOptions.tier.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; tierSel.appendChild(o); });
      tierSel.value = this.selectedFilters.tier;
    }
    if (tagSel) {
      tagSel.innerHTML = '';
      const optAll = document.createElement('option'); optAll.value = 'All'; optAll.textContent = 'All'; tagSel.appendChild(optAll);
      this.filterOptions.tags.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; tagSel.appendChild(o); });
      tagSel.value = this.selectedFilters.tags || 'All';
    }
  }

  renderTable() {
    const allFiltered = this.sortChips(this.filterChips());
    const total = allFiltered.length;
    const pageSize = Number(this.pageSize) || 20;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * pageSize;
    const end = start + pageSize;
    const chips = allFiltered.slice(start, end);
    const cols = this.getVisibleColumns();

    // wrapper for visual padding/shadow
    const wrapper = document.createElement('div');
    wrapper.className = 'chips-table-wrapper';

    const table = document.createElement('table');
    table.className = 'chips-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    cols.forEach(col => {
      const th = document.createElement('th');
      th.className = 'sortable-header';
      th.style.cursor = 'pointer';
      const label = document.createElement('span');
      label.textContent = col.charAt(0).toUpperCase() + col.slice(1);
      th.appendChild(label);
      const ind = document.createElement('span');
      ind.className = 'sort-indicator';
      if (this.currentSort.field === col) ind.textContent = this.currentSort.ascending ? ' ▲' : ' ▼';
      th.appendChild(ind);
      th.onclick = () => {
        if (this.currentSort.field === col) {
          this.currentSort.ascending = !this.currentSort.ascending;
        } else {
          this.currentSort = { field: col, ascending: true };
        }
        this.renderTable();
      };
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    chips.forEach(chip => {
      const tr = document.createElement('tr');
      cols.forEach(col => {
        const td = document.createElement('td');
        td.className = `col-${col}`;
        const val = chip[col];
        if (col === 'source') {
          const span = document.createElement('span');
          span.className = 'chip-source-badge';
          span.textContent = val || '—';
          td.appendChild(span);
        } else if (col === 'tags') {
          const tags = Array.isArray(val) ? val : [];
          tags.forEach(t => {
            const b = document.createElement('span');
            b.className = 'chip-tag-badge';
            b.textContent = t;
            td.appendChild(b);
          });
        } else {
          td.textContent = (val === undefined || val === null) ? '—' : String(val);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    // pager factory (create a pager element wired to this instance)
    const makePager = () => {
      const pagerEl = document.createElement('div');
      pagerEl.className = 'chips-pager';
      const prevBtn = document.createElement('button'); prevBtn.type = 'button'; prevBtn.textContent = '◀ Prev';
      const nextBtn = document.createElement('button'); nextBtn.type = 'button'; nextBtn.textContent = 'Next ▶';
      const pageInfo = document.createElement('span'); pageInfo.className = 'chips-pageinfo';
      pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
      prevBtn.disabled = this.currentPage <= 1;
      nextBtn.disabled = this.currentPage >= totalPages;
      prevBtn.onclick = () => { if (this.currentPage > 1) { this.currentPage--; this.renderTable(); } };
      nextBtn.onclick = () => { if (this.currentPage < totalPages) { this.currentPage++; this.renderTable(); } };
      pagerEl.appendChild(prevBtn);
      pagerEl.appendChild(pageInfo);
      pagerEl.appendChild(nextBtn);
      return pagerEl;
    };

    // top pager, then table, then bottom pager
    wrapper.appendChild(makePager());
    wrapper.appendChild(table);
    wrapper.appendChild(makePager());

    // Update container
    const container = document.getElementById('chips-table-result');
    container.innerHTML = '';
    container.appendChild(wrapper);

    const showingStart = total === 0 ? 0 : start + 1;
    const showingEnd = Math.min(total, end);
    document.getElementById('chip-count').textContent = `Showing ${showingStart}–${showingEnd} of ${total}`;
  }

  renderControls() {
    const controlsContainer = document.getElementById('chips-controls');
    if (!controlsContainer) return;

    // prevent duplicate controls when re-rendering
    controlsContainer.innerHTML = '';

    // Search box
    const searchDiv = document.createElement('div');
    searchDiv.className = 'chips-search';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search chips...';
    searchInput.value = this.searchQuery;
    searchInput.className = 'chips-search-input';
    searchInput.oninput = (e) => {
      this.searchQuery = e.target.value;
      this.renderTable();
    };
    searchDiv.appendChild(searchInput);
    controlsContainer.appendChild(searchDiv);

    // Filters (Source / Type / Tier / Tags)
    const filtersWrap = document.createElement('div');
    filtersWrap.className = 'chips-filters';

    const createSelect = (id, labelText, multiple=false) => {
      const wrap = document.createElement('div');
      wrap.className = 'filter-item';
      const label = document.createElement('label'); label.textContent = labelText; label.style.display='block'; label.style.marginBottom='6px';
      const sel = document.createElement('select'); sel.id = id; if (multiple) sel.multiple = true; sel.className = 'chips-filter-select';
      wrap.appendChild(label); wrap.appendChild(sel);
      return wrap;
    };

    filtersWrap.appendChild(createSelect('filter-source','Source'));
    filtersWrap.appendChild(createSelect('filter-type','Type'));
    filtersWrap.appendChild(createSelect('filter-tier','Tier'));
    filtersWrap.appendChild(createSelect('filter-tags','Tags'));

    // Clear filters button
    const btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.textContent = 'Clear filters';
    btnClear.className = 'chips-filters-clear';
    btnClear.onclick = () => {
      this.selectedFilters = { source: 'All', type: 'All', tier: 'All', tags: "All" };
      this.currentPage = 1;
      this.populateFilterOptions();
      this.renderTable();
    };
    filtersWrap.appendChild(btnClear);

    // place filters in their own row
    controlsContainer.appendChild(filtersWrap);

    // third row: columns + page size
    const row3 = document.createElement('div'); row3.className = 'controls-row row-3';
    const colDiv = document.createElement('div');
    colDiv.className = 'chips-column-selector';
    const colLabel = document.createElement('label');
    colLabel.textContent = 'Columns: ';
    colDiv.appendChild(colLabel);

    Object.keys(this.visibleColumns).forEach(col => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.visibleColumns[col];
      checkbox.onchange = () => {
        this.visibleColumns[col] = !this.visibleColumns[col];
        this.renderTable();
      };
      const label = document.createElement('label');
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(col));
      label.style.marginLeft = '8px';
      label.style.marginRight = '12px';
      colDiv.appendChild(label);
    });

    // page size selector
    const pageWrap = document.createElement('div'); pageWrap.className = 'filter-item';
    const pageLabel = document.createElement('label'); pageLabel.textContent = 'Per page'; pageLabel.style.display='block'; pageLabel.style.marginBottom='6px';
    const pageSel = document.createElement('select'); pageSel.id = 'filter-page-size'; pageSel.className = 'chips-filter-select';
    [10,20,40,80].forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = String(n); pageSel.appendChild(o); });
    pageSel.value = this.pageSize;
    pageSel.onchange = (e) => { this.pageSize = Number(e.target.value); this.currentPage = 1; this.renderTable(); };
    pageWrap.appendChild(pageLabel); pageWrap.appendChild(pageSel);

    // clear filters button
    const btnWrap = document.createElement('div'); btnWrap.style.marginLeft = '12px';
    btnWrap.appendChild(btnClear);

    row3.appendChild(colDiv);
    row3.appendChild(pageWrap);
    row3.appendChild(btnWrap);
    controlsContainer.appendChild(row3);

    // wire up onchange handlers (populateFilterOptions will set the option lists later)
    const sourceSel = document.getElementById('filter-source');
    const typeSel = document.getElementById('filter-type');
    const tierSel = document.getElementById('filter-tier');
    const tagSel = document.getElementById('filter-tags');
    if (sourceSel) sourceSel.onchange = (e) => { this.selectedFilters.source = e.target.value; this.currentPage = 1; this.renderTable(); };
    if (typeSel) typeSel.onchange = (e) => { this.selectedFilters.type = e.target.value; this.currentPage = 1; this.renderTable(); };
    if (tierSel) tierSel.onchange = (e) => { this.selectedFilters.tier = e.target.value; this.currentPage = 1; this.renderTable(); };
    if (tagSel) tagSel.onchange = (e) => { this.selectedFilters.tags = e.target.value; this.currentPage = 1; this.renderTable(); };

    // column controls were already added to row3
  }

  render() {
    this.renderControls();
    this.loadChips();
  }
}
