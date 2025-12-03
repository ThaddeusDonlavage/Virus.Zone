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
  }

  async loadChips() {
    try {
      const res = await fetch(this.dataPath);
      if (!res.ok) throw new Error('Failed to fetch chips.json');
      this.allChips = await res.json();
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
    if (!this.searchQuery.trim()) return this.allChips;
    const query = this.searchQuery.toLowerCase();
    return this.allChips.filter(chip => {
      return Object.values(chip).some(val => {
        if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(query));
        return String(val).toLowerCase().includes(query);
      });
    });
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

  renderTable() {
    const chips = this.sortChips(this.filterChips());
    const cols = this.getVisibleColumns();
    const table = document.createElement('table');
    table.className = 'chips-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    cols.forEach(col => {
      const th = document.createElement('th');
      th.className = 'sortable-header';
      th.textContent = col.charAt(0).toUpperCase() + col.slice(1);
      th.style.cursor = 'pointer';
      th.onclick = () => {
        if (this.currentSort.field === col) {
          this.currentSort.ascending = !this.currentSort.ascending;
        } else {
          this.currentSort = { field: col, ascending: true };
        }
        this.renderTable();
      };
      if (this.currentSort.field === col) {
        th.textContent += this.currentSort.ascending ? ' ▲' : ' ▼';
        th.style.color = 'var(--virus-red)';
      }
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
        let val = chip[col];
        if (Array.isArray(val)) {
          td.textContent = val.join(', ');
        } else {
          td.textContent = val || '—';
        }
        td.className = `col-${col}`;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Update container
    const container = document.getElementById('chips-table-result');
    container.innerHTML = '';
    container.appendChild(table);
    document.getElementById('chip-count').textContent = `${chips.length} of ${this.allChips.length}`;
  }

  renderControls() {
    const controlsContainer = document.getElementById('chips-controls');
    if (!controlsContainer) return;

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

    // Column visibility dropdown
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
    controlsContainer.appendChild(colDiv);
  }

  render() {
    this.renderControls();
    this.loadChips();
  }
}
