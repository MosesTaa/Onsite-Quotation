const STORAGE_KEY = "onsiteQuotationData_v1";

const state = loadState() || {
  step: 1,
  rooms: [],
  costs: [],
  rates: {
    copper: 0,
    drainage: 0
  },
  otherItems: [],
  currentItemDraft: null
};

const steps = [
  "Rooms",
  "Dimensions",
  "Copper",
  "Cooling Load",
  "AC Costs",
  "Drainage",
  "Rates & Items",
  "Quotation"
];

const app = document.getElementById("app");
const progress = document.getElementById("progress");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function money(n) {
  return Number(n || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStep(n) {
  state.step = n;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProgress() {
  progress.innerHTML = steps.map((s, i) =>
    `<span class="${state.step === i + 1 ? "active" : ""}">${i + 1}. ${s}</span>`
  ).join("");
}

function render() {
  renderProgress();
  const pages = {
    1: renderRooms,
    2: renderDimensions,
    3: renderCopper,
    4: renderCoolingLoad,
    5: renderACCosts,
    6: renderDrainage,
    7: renderRatesAndItems,
    8: renderQuotation
  };
  pages[state.step]();
}

function renderRooms() {
  app.innerHTML = `
    <section class="card">
      <h2>Rooms requiring air conditioning</h2>
      <p class="subtitle">Add each room in the order you want it to appear in the quotation.</p>

      <div class="form-group">
        <label for="roomName">Room name</label>
        <input id="roomName" placeholder="e.g. Master Bedroom" autocomplete="off">
      </div>

      <div class="actions">
        <button class="primary-btn" onclick="addRoom()">Add Room</button>
      </div>

      <div id="roomList" style="margin-top:15px;">
        ${roomListHtml()}
      </div>

      ${state.rooms.length ? `
        <div class="actions">
          <button class="primary-btn" onclick="setStep(2)">Proceed to Dimensions</button>
        </div>` : ""}
    </section>
  `;
}

function roomListHtml() {
  if (!state.rooms.length) {
    return `<div class="empty">No rooms added yet.</div>`;
  }

  return state.rooms.map((room, i) => `
    <div class="room-row">
      <div>
        <div class="room-number">Room ${i + 1}</div>
        <div class="room-name">${esc(room.name)}</div>
      </div>
      <div class="row-actions">
        <button class="secondary-btn small-btn" onclick="renameRoom(${i})">Rename</button>
        <button class="danger-btn small-btn" onclick="deleteRoom(${i})">Delete</button>
      </div>
    </div>
  `).join("");
}

function addRoom() {
  const input = document.getElementById("roomName");
  const name = input.value.trim();

  if (!name) {
    alert("Enter a room name first.");
    return;
  }

  state.rooms.push({
    name,
    length: 0,
    width: 0,
    area: 0,
    copperLength: 0,
    coolingFactor: 0,
    capacity: 0,
    drainageLength: 0
  });

  saveState();
  input.value = "";
  render();
  setTimeout(() => document.getElementById("roomName")?.focus(), 50);
}

function renameRoom(index) {
  const newName = prompt("Enter the new room name:", state.rooms[index].name);
  if (newName && newName.trim()) {
    state.rooms[index].name = newName.trim();
    saveState();
    render();
  }
}

function deleteRoom(index) {
  if (!confirm(`Delete "${state.rooms[index].name}"?`)) return;
  state.rooms.splice(index, 1);
  saveState();
  render();
}

function renderDimensions() {
  app.innerHTML = `
    <section class="card">
      <h2>Room dimensions</h2>
      <p class="subtitle">Enter length and width in metres. Area is calculated automatically.</p>

      ${state.rooms.map((room, i) => `
        <div class="room-row">
          <div style="width:100%">
            <div class="room-number">Room ${i + 1}</div>
            <div class="room-name">${esc(room.name)}</div>
            <div class="grid" style="margin-top:10px;">
              <div class="form-group">
                <label>Length (m)</label>
                <input type="number" min="0" step="0.01"
                  value="${room.length || ""}"
                  onchange="updateRoom(${i}, 'length', this.value)">
              </div>
              <div class="form-group">
                <label>Width (m)</label>
                <input type="number" min="0" step="0.01"
                  value="${room.width || ""}"
                  onchange="updateRoom(${i}, 'width', this.value)">
              </div>
            </div>
            <strong>Area: ${roomArea(room).toFixed(2)} m²</strong>
          </div>
        </div>
      `).join("")}

      <div class="actions">
        <button class="secondary-btn" onclick="setStep(1)">Back</button>
        <button class="primary-btn" onclick="previewDimensions()">Preview Dimensions</button>
      </div>
    </section>
  `;
}

function updateRoom(index, field, value) {
  state.rooms[index][field] = num(value);
  state.rooms[index].area = roomArea(state.rooms[index]);
  saveState();
}

function roomArea(room) {
  return num(room.length) * num(room.width);
}

function previewDimensions() {
  if (state.rooms.some(r => num(r.length) <= 0 || num(r.width) <= 0)) {
    alert("Please enter a positive length and width for every room.");
    return;
  }

  state.rooms.forEach(r => r.area = roomArea(r));
  saveState();

  app.innerHTML = `
    <section class="card">
      <h2>Dimensions Preview</h2>
      <table>
        <thead>
          <tr><th>#</th><th>Room</th><th>Length (m)</th><th>Width (m)</th><th>Area (m²)</th></tr>
        </thead>
        <tbody>
          ${state.rooms.map((r,i) => `
            <tr>
              <td>${i+1}</td>
              <td>${esc(r.name)}</td>
              <td>${r.length.toFixed(2)}</td>
              <td>${r.width.toFixed(2)}</td>
              <td>${r.area.toFixed(2)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <div class="actions">
        <button class="secondary-btn" onclick="setStep(2)">Edit</button>
        <button class="primary-btn" onclick="setStep(3)">Proceed to Copper</button>
      </div>
    </section>
  `;
}

function renderCopper() {
  app.innerHTML = `
    <section class="card">
      <h2>Copper lengths</h2>
      <p class="subtitle">Enter the copper pipe length for each room in metres.</p>

      ${state.rooms.map((room, i) => `
        <div class="room-row">
          <div style="width:100%">
            <div class="room-number">Room ${i + 1}</div>
            <div class="room-name">${esc(room.name)}</div>
            <div class="form-group" style="margin-top:10px;">
              <label>Copper length (m)</label>
              <input type="number" min="0" step="0.01"
                value="${room.copperLength || ""}"
                onchange="updateRoom(${i}, 'copperLength', this.value)">
            </div>
          </div>
        </div>
      `).join("")}

      <div class="actions">
        <button class="secondary-btn" onclick="setStep(2)">Back</button>
        <button class="primary-btn" onclick="previewCopper()">Preview Copper</button>
      </div>
    </section>
  `;
}

function previewCopper() {
  if (state.rooms.some(r => num(r.copperLength) <= 0)) {
    alert("Please enter a positive copper length for every room.");
    return;
  }

  app.innerHTML = `
    <section class="card">
      <h2>Copper Preview</h2>
      <table>
        <thead><tr><th>#</th><th>Room</th><th>Copper length (m)</th></tr></thead>
        <tbody>
          ${state.rooms.map((r,i) => `
            <tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.copperLength.toFixed(2)}</td></tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr class="total-row"><td colspan="2">Total copper</td><td>${totalCopper().toFixed(2)} m</td></tr>
        </tfoot>
      </table>
      <div class="actions">
        <button class="secondary-btn" onclick="setStep(3)">Edit</button>
        <button class="primary-btn" onclick="setStep(4)">Proceed to Cooling Load</button>
      </div>
    </section>
  `;
}

function totalCopper() {
  return state.rooms.reduce((sum, r) => sum + num(r.copperLength), 0);
}

function renderCoolingLoad() {
  app.innerHTML = `
    <section class="card">
      <h2>Cooling load factor</h2>
      <p class="subtitle">Enter the base cooling load factor. Capacity = room area × factor.</p>

      ${state.rooms.map((room, i) => `
        <div class="room-row">
          <div style="width:100%">
            <div class="room-number">Room ${i + 1}</div>
            <div class="room-name">${esc(room.name)}</div>
            <div class="notice">Area: <strong>${room.area.toFixed(2)} m²</strong></div>
            <div class="form-group">
              <label>Base cooling load factor</label>
              <input type="number" min="0" step="0.01"
                value="${room.coolingFactor || ""}"
                onchange="updateCooling(${i}, this.value)"
                placeholder="e.g. 0.15">
            </div>
            <div><strong>Calculated AC capacity: ${num(room.capacity).toFixed(2)} kW</strong></div>
          </div>
        </div>
      `).join("")}

      <div class="actions">
        <button class="secondary-btn" onclick="setStep(3)">Back</button>
        <button class="primary-btn" onclick="previewCooling()">Preview Recommendations</button>
      </div>
    </section>
  `;
}

function updateCooling(index, value) {
  state.rooms[index].coolingFactor = num(value);
  state.rooms[index].capacity = state.rooms[index].area * num(value);
  saveState();
  renderCoolingCalculatedOnly();
}

function renderCoolingCalculatedOnly() {
  // Values are recalculated during the next render; no full re-render is needed.
}

function previewCooling() {
  if (state.rooms.some(r => num(r.coolingFactor) <= 0)) {
    alert("Please enter a positive cooling load factor for every room.");
    return;
  }

  state.rooms.forEach(r => r.capacity = r.area * r.coolingFactor);
  saveState();

  app.innerHTML = `
    <section class="card">
      <h2>Cooling Load & AC Capacity Preview</h2>
      <table>
        <thead>
          <tr><th>#</th><th>Room</th><th>Area (m²)</th><th>Factor</th><th>AC capacity (kW)</th></tr>
        </thead>
        <tbody>
          ${state.rooms.map((r,i) => `
            <tr>
              <td>${i+1}</td>
              <td>${esc(r.name)}</td>
              <td>${r.area.toFixed(2)}</td>
              <td>${r.coolingFactor.toFixed(3)}</td>
              <td>${r.capacity.toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="notice">
        The calculated capacities are kept exactly as calculated. Enter the corresponding equipment cost on the next page.
      </div>
      <div class="actions">
        <button class="secondary-btn" onclick="setStep(4)">Edit</button>
        <button class="primary-btn" onclick="setStep(5)">Proceed to AC Costs</button>
      </div>
    </section>
  `;
}

function uniqueCapacities() {
  const map = new Map();
  state.rooms.forEach(r => {
    const cap = Number(r.capacity.toFixed(2));
    if (cap > 0 && !map.has(cap)) map.set(cap, 0);
  });
  return [...map.keys()].sort((a,b) => a-b);
}

function renderACCosts() {
  const caps = uniqueCapacities();

  app.innerHTML = `
    <section class="card">
      <h2>AC equipment costs</h2>
      <p class="subtitle">Costs are entered once for each unique capacity, sorted from smallest to largest.</p>

      <table>
        <thead><tr><th>AC capacity (kW)</th><th>Quantity</th><th>Unit cost (KES)</th></tr></thead>
        <tbody>
          ${caps.map(cap => {
            const cost = state.costs.find(c => Number(c.capacity) === cap);
            const qty = state.rooms.filter(r => Number(r.capacity.toFixed(2)) === cap).length;
            return `
              <tr>
                <td><strong>${cap.toFixed(2)} kW</strong></td>
                <td>${qty}</td>
                <td>
                  <input type="number" min="0" step="0.01"
                    value="${cost ? cost.unitCost : ""}"
                    onchange="setACCost(${cap}, this.value)"
                    placeholder="Enter unit cost">
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>

      <div class="actions">
        <button class="secondary-btn" onclick="setStep(4)">Back</button>
        <button class="primary-btn" onclick="previewACCosts()">Preview AC Costs</button>
      </div>
    </section>
  `;
}

function setACCost(capacity, value) {
  const existing = state.costs.find(c => Number(c.capacity) === Number(capacity));
  if (existing) {
    existing.unitCost = num(value);
  } else {
    state.costs.push({ capacity: Number(capacity), unitCost: num(value) });
  }
  saveState();
}

function previewACCosts() {
  const caps = uniqueCapacities();
  const missing = caps.some(cap => {
    const c = state.costs.find(x => Number(x.capacity) === cap);
    return !c || num(c.unitCost) <= 0;
  });

  if (missing) {
    alert("Please enter a positive cost for every unique AC capacity.");
    return;
  }

  app.innerHTML = `
    <section class="card">
      <h2>AC Cost Preview</h2>
      <table>
        <thead><tr><th>AC capacity</th><th>Quantity</th><th>Unit cost (KES)</th><th>Total (KES)</th></tr></thead>
        <tbody>
          ${caps.map(cap => {
            const c = state.costs.find(x => Number(x.capacity) === cap);
            const qty = state.rooms.filter(r => Number(r.capacity.toFixed(2)) === cap).length;
            return `<tr>
              <td>${cap.toFixed(2)} kW</td>
              <td>${qty}</td>
              <td>${money(c.unitCost)}</td>
              <td>${money(c.unitCost * qty)}</td>
            </tr>`;
          }).join("")}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">Total equipment</td>
            <td>${money(totalEquipment())}</td>
          </tr>
        </tfoot>
      </table>
      <div class="actions">
        <button class="secondary-btn" onclick="setStep(5)">Edit</button>
        <button class="primary-btn" onclick="setStep(6)">Proceed to Drainage</button>
      </div>
    </section>
  `;
}

function totalEquipment() {
  return state.rooms.reduce((sum, r) => {
    const cap = Number(r.capacity.toFixed(2));
    const c = state.costs.find(x => Number(x.capacity) === cap);
    return sum + (c ? num(c.unitCost) : 0);
  }, 0);
}

function renderDrainage() {
  app.innerHTML = `
    <section class="card">
      <h2>Drainage PVC pipe lengths</h2>
      <p class="subtitle">Enter drainage pipe length for each room in metres.</p>

      ${state.rooms.map((room, i) => `
        <div class="room-row">
          <div style="width:100%">
            <div class="room-number">Room ${i + 1}</div>
            <div class="room-name">${esc(room.name)}</div>
            <div class="form-group" style="margin-top:10px;">
              <label>Drainage length (m)</label>
              <input type="number" min="0" step="0.01"
                value="${room.drainageLength || ""}"
                onchange="updateRoom(${i}, 'drainageLength', this.value)">
            </div>
          </div>
        </div>
      `).join("")}

      <div class="actions">
        <button class="secondary-btn" onclick="setStep(5)">Back</button>
        <button class="primary-btn" onclick="previewDrainage()">Preview Drainage</button>
      </div>
    </section>
  `;
}

function previewDrainage() {
  if (state.rooms.some(r => num(r.drainageLength) <= 0)) {
    alert("Please enter a positive drainage length for every room.");
    return;
  }

  app.innerHTML = `
    <section class="card">
      <h2>Drainage Preview</h2>
      <table>
        <thead><tr><th>#</th><th>Room</th><th>Drainage length (m)</th></tr></thead>
        <tbody>
          ${state.rooms.map((r,i) => `
            <tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.drainageLength.toFixed(2)}</td></tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr class="total-row"><td colspan="2">Total drainage</td><td>${totalDrainage().toFixed(2)} m</td></tr>
        </tfoot>
      </table>
      <div class="actions">
        <button class="secondary-btn" onclick="setStep(6)">Edit</button>
        <button class="primary-btn" onclick="setStep(7)">Proceed to Rates & Other Items</button>
      </div>
    </section>
  `;
}

function totalDrainage() {
  return state.rooms.reduce((sum, r) => sum + num(r.drainageLength), 0);
}

function renderRatesAndItems() {
  app.innerHTML = `
    <section class="card">
      <h2>Material rates</h2>
      <p class="subtitle">Enter the combined material/accessory rate per metre.</p>

      <div class="grid">
        <div class="form-group">
          <label>Copper + accessories rate (KES/m)</label>
          <input type="number" min="0" step="0.01" value="${state.rates.copper || ""}"
            onchange="state.rates.copper=num(this.value); saveState()">
        </div>
        <div class="form-group">
          <label>Drainage PVC + accessories rate (KES/m)</label>
          <input type="number" min="0" step="0.01" value="${state.rates.drainage || ""}"
            onchange="state.rates.drainage=num(this.value); saveState()">
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Other quotation items</h2>
      <p class="subtitle">Examples: testing and commissioning, drawings, labour, controls, transport, etc. Enter quantity and unit price; the total is shown before saving.</p>

      <div class="grid-3">
        <div class="form-group">
          <label>Item description</label>
          <input id="itemDescription" placeholder="e.g. Testing & commissioning">
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input id="itemQty" type="number" min="0" step="0.01" placeholder="1">
        </div>
        <div class="form-group">
          <label>Unit price (KES)</label>
          <input id="itemUnitPrice" type="number" min="0" step="0.01" placeholder="0.00" oninput="showItemTotal()">
        </div>
      </div>

      <div class="summary-box">
        <strong>Item total: KES <span id="draftTotal">0.00</span></strong>
      </div>

      <div class="actions">
        <button class="secondary-btn" onclick="addOtherItem()">Save Item & Add Another</button>
      </div>

      <div id="otherItemsList">
        ${otherItemsHtml()}
      </div>

      <div class="actions">
        <button class="secondary-btn" onclick="setStep(6)">Back</button>
        <button class="primary-btn" onclick="previewFinalQuotation()">Preview Quotation</button>
      </div>
    </section>
  `;
}

function showItemTotal() {
  const qty = num(document.getElementById("itemQty")?.value);
  const price = num(document.getElementById("itemUnitPrice")?.value);
  const target = document.getElementById("draftTotal");
  if (target) target.textContent = money(qty * price);
}

function addOtherItem() {
  const description = document.getElementById("itemDescription").value.trim();
  const quantity = num(document.getElementById("itemQty").value);
  const unitPrice = num(document.getElementById("itemUnitPrice").value);

  if (!description || quantity <= 0 || unitPrice < 0) {
    alert("Enter an item description, a positive quantity and a valid unit price.");
    return;
  }

  state.otherItems.push({
    description,
    quantity,
    unitPrice,
    total: quantity * unitPrice
  });

  saveState();
  renderRatesAndItems();
}

function otherItemsHtml() {
  if (!state.otherItems.length) {
    return `<div class="empty">No other items saved.</div>`;
  }

  return `
    <h3 style="margin-top:18px;">Saved items</h3>
    ${state.otherItems.map((item, i) => `
      <div class="item-row">
        <div class="item-preview">
          <div>
            <strong>${esc(item.description)}</strong><br>
            <span class="muted">${item.quantity} × KES ${money(item.unitPrice)}</span>
          </div>
          <div class="right">
            <strong>KES ${money(item.total)}</strong><br>
            <button class="danger-btn small-btn" onclick="deleteOtherItem(${i})">Delete</button>
          </div>
        </div>
      </div>
    `).join("")}
  `;
}

function deleteOtherItem(index) {
  state.otherItems.splice(index, 1);
  saveState();
  render();
}

function totalOtherItems() {
  return state.otherItems.reduce((sum, i) => sum + num(i.total), 0);
}

function copperTotalCost() {
  return totalCopper() * num(state.rates.copper);
}

function drainageTotalCost() {
  return totalDrainage() * num(state.rates.drainage);
}

function totalHVACWorks() {
  return totalEquipment() + copperTotalCost() + drainageTotalCost() + totalOtherItems();
}

function finalSummarySubtotal() {
  // Summary requested by the specification:
  // Preliminaries + As Built Drawing + Total HVAC Works.
  return 15000 + 5000 + totalHVACWorks();
}

function vatAmount() {
  return finalSummarySubtotal() * 0.16;
}

function grandTotalInclVAT() {
  return finalSummarySubtotal() + vatAmount();
}

function previewFinalQuotation() {
  if (num(state.rates.copper) <= 0 || num(state.rates.drainage) <= 0) {
    alert("Please enter both copper and drainage rates.");
    return;
  }

  app.innerHTML = `
    <section class="card">
      <h2>Quotation Preview</h2>

      <h3>1. Equipment</h3>
      ${equipmentTableHtml()}

      <h3>2. Copper and accessories</h3>
      <table>
        <tbody>
          <tr><td>Total copper length</td><td>${totalCopper().toFixed(2)} m</td></tr>
          <tr><td>Rate</td><td>KES ${money(state.rates.copper)}/m</td></tr>
          <tr class="total-row"><td>Total</td><td>KES ${money(copperTotalCost())}</td></tr>
        </tbody>
      </table>

      <h3>3. Drainage</h3>
      <table>
        <tbody>
          <tr><td>Total drainage length</td><td>${totalDrainage().toFixed(2)} m</td></tr>
          <tr><td>Rate</td><td>KES ${money(state.rates.drainage)}/m</td></tr>
          <tr class="total-row"><td>Total</td><td>KES ${money(drainageTotalCost())}</td></tr>
        </tbody>
      </table>

      ${state.otherItems.length ? `
        <h3>4. Other items</h3>
        ${otherItemsTableHtml()}
      ` : ""}

      <div class="summary-box">
        <h3>Summary</h3>
        <table>
          <tbody>
            <tr><td>Preliminaries</td><td>1 lot @ KES 15,000.00</td><td>KES 15,000.00</td></tr>
            <tr><td>As built drawing</td><td>1 lot @ KES 5,000.00</td><td>KES 5,000.00</td></tr>
            <tr><td>Total HVAC Works</td><td colspan="1">Exclusive of VAT</td><td>KES ${money(totalHVACWorks())}</td></tr>
            <tr class="total-row"><td colspan="2">Summary total exclusive of VAT</td><td>KES ${money(finalSummarySubtotal())}</td></tr>
            <tr><td colspan="2">VAT @ 16%</td><td>KES ${money(vatAmount())}</td></tr>
            <tr class="total-row"><td colspan="2"><strong>TOTAL INCLUDING 16% VAT</strong></td><td><strong>KES ${money(grandTotalInclVAT())}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <div class="actions">
        <button class="secondary-btn" onclick="setStep(7)">Edit</button>
        <button class="primary-btn" onclick="generatePDF()">Generate Quotation PDF</button>
      </div>
    </section>
  `;
}

function equipmentTableHtml() {
  const caps = uniqueCapacities();
  return `
    <table>
      <thead><tr><th>AC capacity</th><th>Quantity</th><th>Unit cost</th><th>Total cost</th></tr></thead>
      <tbody>
        ${caps.map(cap => {
          const c = state.costs.find(x => Number(x.capacity) === cap);
          const qty = state.rooms.filter(r => Number(r.capacity.toFixed(2)) === cap).length;
          return `<tr>
            <td>${cap.toFixed(2)} kW</td>
            <td>${qty}</td>
            <td>KES ${money(c.unitCost)}</td>
            <td>KES ${money(c.unitCost * qty)}</td>
          </tr>`;
        }).join("")}
        <tr class="total-row"><td colspan="3">Equipment total</td><td>KES ${money(totalEquipment())}</td></tr>
      </tbody>
    </table>
  `;
}

function otherItemsTableHtml() {
  return `
    <table>
      <thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead>
      <tbody>
        ${state.otherItems.map(item => `
          <tr>
            <td>${esc(item.description)}</td>
            <td>${item.quantity}</td>
            <td>KES ${money(item.unitPrice)}</td>
            <td>KES ${money(item.total)}</td>
          </tr>
        `).join("")}
        <tr class="total-row"><td colspan="3">Other items total</td><td>KES ${money(totalOtherItems())}</td></tr>
      </tbody>
    </table>
  `;
}

function generatePDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("The PDF library could not be loaded. Check your internet connection and try again.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("HOTPOINT ENGINEERING DIVISION", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Onsite HVAC Quotation", pageWidth / 2, 24, { align: "center" });
  doc.text("Email: hvacmsaintern@hotpoint.co.ke", pageWidth / 2, 29, { align: "center" });
  doc.text("© Moses Ntella Taa", pageWidth / 2, 34, { align: "center" });

  let y = 43;

  function sectionTitle(title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 4;
  }

  function addTable(headers, rows, widths = undefined) {
    doc.autoTable({
      startY: y,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fontStyle: "bold" },
      columnStyles: widths || {},
      didDrawPage: data => {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Hotpoint Engineering Division · © Moses Ntella Taa`,
          margin,
          doc.internal.pageSize.getHeight() - 7
        );
      }
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  sectionTitle("1. EQUIPMENT");
  const equipmentRows = uniqueCapacities().map(cap => {
    const c = state.costs.find(x => Number(x.capacity) === cap);
    const qty = state.rooms.filter(r => Number(r.capacity.toFixed(2)) === cap).length;
    return [
      `${cap.toFixed(2)} kW AC`,
      String(qty),
      `KES ${money(c.unitCost)}`,
      `KES ${money(c.unitCost * qty)}`
    ];
  });
  equipmentRows.push(["Equipment total", "", "", `KES ${money(totalEquipment())}`]);
  addTable(["AC Capacity", "Qty", "Unit Cost", "Total Cost"], equipmentRows);

  sectionTitle("2. COPPER AND ACCESSORIES");
  addTable(
    ["Description", "Length", "Rate / m", "Total"],
    [["Copper and accessories", `${totalCopper().toFixed(2)} m`, `KES ${money(state.rates.copper)}`, `KES ${money(copperTotalCost())}`]]
  );

  sectionTitle("3. DRAINAGE");
  addTable(
    ["Description", "Length", "Rate / m", "Total"],
    [["Drainage PVC and accessories", `${totalDrainage().toFixed(2)} m`, `KES ${money(state.rates.drainage)}`, `KES ${money(drainageTotalCost())}`]]
  );

  if (state.otherItems.length) {
    sectionTitle("4. OTHER ITEMS");
    const rows = state.otherItems.map(item => [
      item.description,
      String(item.quantity),
      `KES ${money(item.unitPrice)}`,
      `KES ${money(item.total)}`
    ]);
    rows.push(["Other items total", "", "", `KES ${money(totalOtherItems())}`]);
    addTable(["Description", "Qty", "Unit Price", "Total"], rows);
  }

  sectionTitle("SUMMARY");
  addTable(
    ["Summary Item", "Basis", "Amount"],
    [
      ["Preliminaries", "1 lot @ KES 15,000.00", "KES 15,000.00"],
      ["As built drawing", "1 lot @ KES 5,000.00", "KES 5,000.00"],
      ["Total HVAC Works", "Exclusive of VAT", `KES ${money(totalHVACWorks())}`],
      ["TOTAL EXCLUSIVE OF VAT", "", `KES ${money(finalSummarySubtotal())}`],
      ["VAT @ 16%", "", `KES ${money(vatAmount())}`],
      ["TOTAL INCLUDING 16% VAT", "", `KES ${money(grandTotalInclVAT())}`]
    ]
  );

  // Highlight the two final totals.
  const last = doc.lastAutoTable;
  if (last && last.body && last.body.length >= 2) {
    const rows = last.body;
    const finalRow = rows[rows.length - 1];
    finalRow.cells[0].styles.fontStyle = "bold";
    finalRow.cells[2].styles.fontStyle = "bold";
    finalRow.cells[0].styles.fontSize = 9;
    finalRow.cells[2].styles.fontSize = 9;
  }

  y = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Total HVAC Works is exclusive of VAT.", margin, y);

  const filename = `Onsite_Quotation_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Reset the entire quotation and delete all saved data?")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

// Keep state available to inline event handlers.
window.addRoom = addRoom;
window.renameRoom = renameRoom;
window.deleteRoom = deleteRoom;
window.setStep = setStep;
window.updateRoom = updateRoom;
window.previewDimensions = previewDimensions;
window.previewCopper = previewCopper;
window.updateCooling = updateCooling;
window.previewCooling = previewCooling;
window.setACCost = setACCost;
window.previewACCosts = previewACCosts;
window.previewDrainage = previewDrainage;
window.addOtherItem = addOtherItem;
window.deleteOtherItem = deleteOtherItem;
window.showItemTotal = showItemTotal;
window.previewFinalQuotation = previewFinalQuotation;
window.generatePDF = generatePDF;

render();
