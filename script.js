/* =========================================================
   ONSITE QUOTATION
   Moses Ntella Taa
   HVAC Quotation System
   ========================================================= */

const state = {
    rooms: [],
    coolingFactor: 0,
    copperRate: 0,
    drainageRate: 0,
    acPrices: {},
    otherItems: []
};

let currentPage = 1;

const TOTAL_PAGES = 14;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadState();

    if (state.rooms.length > 0) {
        renderRoomInputs();
    } else {
        addRoomInput();
    }

    updateProgress();

    setupLiveCalculations();
});


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function saveState() {
    localStorage.setItem(
        "onsiteQuotationState",
        JSON.stringify(state)
    );
}

function loadState() {

    const saved = localStorage.getItem(
        "onsiteQuotationState"
    );

    if (!saved) return;

    try {

        const parsed = JSON.parse(saved);

        Object.assign(state, parsed);

    } catch (error) {

        console.error("Could not load saved quotation.", error);

    }
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function goToPage(pageNumber) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(
        "page" + pageNumber
    );

    if (page) {
        page.classList.add("active");
    }

    currentPage = pageNumber;

    updateProgress();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function updateProgress() {

    const percent =
        ((currentPage - 1) / (TOTAL_PAGES - 1)) * 100;

    document.getElementById("progressFill").style.width =
        Math.max(percent, 7) + "%";

    document.getElementById("stepText").textContent =
        `Step ${currentPage} of ${TOTAL_PAGES}`;
}


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function money(value) {

    return new Intl.NumberFormat("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

}


function number(value) {

    const n = parseFloat(value);

    return isNaN(n) ? 0 : n;

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showAlert(message) {
    alert(message);
}


/* =========================================================
   ROOMS
   ========================================================= */

function addRoomInput(name = "") {

    const container =
        document.getElementById("roomInputContainer");

    const div = document.createElement("div");

    div.className = "room-input";

    div.innerHTML = `
        <div class="room-number">
            Room ${container.children.length + 1}
        </div>

        <input
            type="text"
            class="room-name-input"
            placeholder="Example: Master Bedroom"
            value="${escapeHTML(name)}"
        >
    `;

    container.appendChild(div);
}


function renderRoomInputs() {

    const container =
        document.getElementById("roomInputContainer");

    container.innerHTML = "";

    state.rooms.forEach(room => {
        addRoomInput(room.name);
    });

}


function saveRooms() {

    const inputs =
        document.querySelectorAll(".room-name-input");

    const rooms = [];

    inputs.forEach(input => {

        const name = input.value.trim();

        if (name !== "") {

            rooms.push({
                id: Date.now() + Math.random(),
                name: name,
                length: 0,
                width: 0,
                area: 0,
                copperLength: 0,
                drainageLength: 0,
                capacity: 0
            });

        }

    });


    if (rooms.length === 0) {

        showAlert(
            "Please enter at least one room."
        );

        return;
    }


    state.rooms = rooms;

    saveState();

    renderRoomPreview();

    goToPage(2);
}


function renderRoomPreview() {

    const container =
        document.getElementById("roomPreview");

    if (state.rooms.length === 0) {

        container.innerHTML =
            `<div class="empty-message">No rooms added.</div>`;

        return;
    }


    let html = `
        <table class="preview-table">

            <thead>
                <tr>
                    <th>#</th>
                    <th>Room Name</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>
    `;


    state.rooms.forEach((room, index) => {

        html += `
            <tr>

                <td>${index + 1}</td>

                <td>
                    ${escapeHTML(room.name)}
                </td>

                <td class="action-cell">

                    <button
                        class="edit-btn"
                        onclick="renameRoom(${index})"
                    >
                        Rename
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteRoom(${index})"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });


    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}


function renameRoom(index) {

    const newName = prompt(
        "Enter new room name:",
        state.rooms[index].name
    );

    if (
        newName !== null &&
        newName.trim() !== ""
    ) {

        state.rooms[index].name =
            newName.trim();

        saveState();

        renderRoomPreview();
    }
}


function deleteRoom(index) {

    if (
        !confirm(
            `Delete "${state.rooms[index].name}"?`
        )
    ) {
        return;
    }

    state.rooms.splice(index, 1);

    saveState();

    renderRoomPreview();

}


function proceedFromRooms() {

    if (state.rooms.length === 0) {

        showAlert("Add at least one room.");

        return;
    }

    renderDimensions();

    goToPage(3);
}


/* =========================================================
   DIMENSIONS
   ========================================================= */

function renderDimensions() {

    const container =
        document.getElementById(
            "dimensionsContainer"
        );

    container.innerHTML = "";

    state.rooms.forEach((room, index) => {

        container.innerHTML += `

            <div class="dimension-row">

                <div class="room-number">
                    ${index + 1}. ${escapeHTML(room.name)}
                </div>

                <div class="dimension-grid">

                    <label>
                        Length (m)

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            id="length-${index}"
                            value="${room.length || ""}"
                            placeholder="Length"
                        >
                    </label>

                    <label>
                        Width (m)

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            id="width-${index}"
                            value="${room.width || ""}"
                            placeholder="Width"
                        >
                    </label>

                </div>

            </div>

        `;

    });

}


function saveDimensions() {

    for (
        let i = 0;
        i < state.rooms.length;
        i++
    ) {

        const length =
            number(
                document.getElementById(
                    `length-${i}`
                ).value
            );

        const width =
            number(
                document.getElementById(
                    `width-${i}`
                ).value
            );


        if (
            length <= 0 ||
            width <= 0
        ) {

            showAlert(
                `Please enter valid dimensions for ${state.rooms[i].name}.`
            );

            return;
        }


        state.rooms[i].length = length;
        state.rooms[i].width = width;

        state.rooms[i].area =
            length * width;

    }


    saveState();

    renderDimensionsPreview();

    goToPage(4);
}


function renderDimensionsPreview() {

    const container =
        document.getElementById(
            "dimensionsPreview"
        );


    let html = `
        <table class="preview-table">

            <thead>

                <tr>
                    <th>#</th>
                    <th>Room</th>
                    <th>Length (m)</th>
                    <th>Width (m)</th>
                    <th>Area (m²)</th>
                </tr>

            </thead>

            <tbody>
    `;


    state.rooms.forEach((room, index) => {

        html += `
            <tr>

                <td>${index + 1}</td>

                <td>
                    ${escapeHTML(room.name)}
                </td>

                <td>${room.length.toFixed(2)}</td>

                <td>${room.width.toFixed(2)}</td>

                <td>
                    <strong>
                        ${room.area.toFixed(2)}
                    </strong>
                </td>

            </tr>
        `;

    });


    html += `
            </tbody>
        </table>
    `;


    container.innerHTML = html;
}


function proceedFromDimensions() {

    renderCopper();

    goToPage(5);
}


/* =========================================================
   COPPER
   ========================================================= */

function renderCopper() {

    const container =
        document.getElementById(
            "copperContainer"
        );

    container.innerHTML = "";

    state.rooms.forEach((room, index) => {

        container.innerHTML += `

            <div class="copper-row">

                <div class="room-number">
                    ${index + 1}. ${escapeHTML(room.name)}
                </div>

                <label>
                    Copper Length (m)

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        id="copper-${index}"
                        value="${room.copperLength || ""}"
                        placeholder="Enter copper length"
                    >
                </label>

            </div>

        `;

    });

}


function saveCopper() {

    for (
        let i = 0;
        i < state.rooms.length;
        i++
    ) {

        const value =
            number(
                document.getElementById(
                    `copper-${i}`
                ).value
            );


        if (value <= 0) {

            showAlert(
                `Please enter the copper length for ${state.rooms[i].name}.`
            );

            return;
        }


        state.rooms[i].copperLength =
            value;
    }


    saveState();

    renderCopperPreview();

    goToPage(6);
}


function renderCopperPreview() {

    const container =
        document.getElementById(
            "copperPreview"
        );


    let total = 0;


    let html = `
        <table class="preview-table">

            <thead>
                <tr>
                    <th>#</th>
                    <th>Room</th>
                    <th>Copper Length (m)</th>
                </tr>
            </thead>

            <tbody>
    `;


    state.rooms.forEach((room, index) => {

        total += room.copperLength;

        html += `
            <tr>

                <td>${index + 1}</td>

                <td>${escapeHTML(room.name)}</td>

                <td>
                    ${room.copperLength.toFixed(2)}
                </td>

            </tr>
        `;

    });


    html += `
            </tbody>
        </table>

        <div class="total-box">
            Total Copper Length:
            ${total.toFixed(2)} m
        </div>
    `;


    container.innerHTML = html;
}


function proceedFromCopper() {

    document.getElementById(
        "coolingFactor"
    ).value =
        state.coolingFactor || "";

    updateCapacityLive();

    goToPage(7);
}


/* =========================================================
   COOLING LOAD / AC CAPACITY
   ========================================================= */

function setupLiveCalculations() {

    const factor =
        document.getElementById(
            "coolingFactor"
        );

    if (factor) {

        factor.addEventListener(
            "input",
            updateCapacityLive
        );

    }


    const qty =
        document.getElementById(
            "otherItemQty"
        );

    const unit =
        document.getElementById(
            "otherItemUnitPrice"
        );


    if (qty) {

        qty.addEventListener(
            "input",
            updateOtherItemTotal
        );

    }

    if (unit) {

        unit.addEventListener(
            "input",
            updateOtherItemTotal
        );

    }

}


function updateCapacityLive() {

    const factor =
        number(
            document.getElementById(
                "coolingFactor"
            )?.value
        );


    const container =
        document.getElementById(
            "capacityPreviewLive"
        );


    if (!container) return;


    if (
        factor <= 0 ||
        state.rooms.length === 0
    ) {

        container.innerHTML = "";

        return;
    }


    let html =
        "<strong>Preview:</strong><br><br>";


    state.rooms.forEach(room => {

        const capacity =
            room.area * factor;


        html += `
            ${escapeHTML(room.name)}:
            ${capacity.toFixed(2)}
            kW
            <br>
        `;

    });


    container.innerHTML = html;
}


function saveCoolingFactor() {

    const factor =
        number(
            document.getElementById(
                "coolingFactor"
            ).value
        );


    if (factor <= 0) {

        showAlert(
            "Please enter a valid cooling load factor."
        );

        return;
    }


    state.coolingFactor = factor;


    state.rooms.forEach(room => {

        room.capacity =
            room.area * factor;

    });


    saveState();

    renderCapacityPreview();

    goToPage(8);
}


function renderCapacityPreview() {

    const container =
        document.getElementById(
            "capacityPreview"
        );


    let html = `

        <div class="formula">
            AC Capacity = Area × ${state.coolingFactor}
        </div>

        <table class="preview-table">

            <thead>

                <tr>
                    <th>#</th>
                    <th>Room</th>
                    <th>Area (m²)</th>
                    <th>Factor</th>
                    <th>Calculated Capacity</th>
                </tr>

            </thead>

            <tbody>
    `;


    state.rooms.forEach((room, index) => {

        html += `

            <tr>

                <td>${index + 1}</td>

                <td>${escapeHTML(room.name)}</td>

                <td>${room.area.toFixed(2)}</td>

                <td>${state.coolingFactor}</td>

                <td>
                    <span class="capacity-badge">
                        ${room.capacity.toFixed(2)} kW
                    </span>
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;


    container.innerHTML = html;
}


function proceedFromCapacity() {

    renderAcPrices();

    goToPage(9);
}


/* =========================================================
   AC PRICES
   ========================================================= */

function getUniqueCapacities() {

    const capacities = [];

    state.rooms.forEach(room => {

        const capacity =
            Number(room.capacity.toFixed(2));

        if (
            !capacities.some(
                item => item === capacity
            )
        ) {

            capacities.push(capacity);

        }

    });


    capacities.sort(
        (a, b) => a - b
    );


    return capacities;
}


function renderAcPrices() {

    const container =
        document.getElementById(
            "acPriceContainer"
        );


    const capacities =
        getUniqueCapacities();


    container.innerHTML = "";


    capacities.forEach(capacity => {

        const existing =
            state.acPrices[capacity] || "";


        container.innerHTML += `

            <label>

                AC Capacity
                <strong>
                    ${capacity.toFixed(2)} kW
                </strong>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="ac-price-input"
                    data-capacity="${capacity}"
                    value="${existing}"
                    placeholder="Enter equipment price"
                >

            </label>

        `;

    });

}


function saveAcPrices() {

    const inputs =
        document.querySelectorAll(
            ".ac-price-input"
        );


    if (inputs.length === 0) {

        showAlert(
            "No AC capacities found."
        );

        return;
    }


    const prices = {};


    for (const input of inputs) {

        const capacity =
            input.dataset.capacity;

        const price =
            number(input.value);


        if (price <= 0) {

            showAlert(
                `Please enter a valid price for ${capacity} kW AC.`
            );

            return;
        }


        prices[capacity] = price;

    }


    state.acPrices = prices;

    saveState();

    renderAcPricePreview();

    goToPage(10);
}


function renderAcPricePreview() {

    const container =
        document.getElementById(
            "acPricePreview"
        );


    let total = 0;


    let html = `

        <table class="preview-table">

            <thead>

                <tr>
                    <th>AC Capacity</th>
                    <th>Quantity</th>
                    <th>Unit Price (KES)</th>
                    <th>Total (KES)</th>
                </tr>

            </thead>

            <tbody>
    `;


    getUniqueCapacities().forEach(capacity => {

        const quantity =
            state.rooms.filter(
                room =>
                    Number(
                        room.capacity.toFixed(2)
                    ) === capacity
            ).length;


        const unitPrice =
            number(
                state.acPrices[capacity]
            );


        const lineTotal =
            quantity * unitPrice;


        total += lineTotal;


        html += `

            <tr>

                <td>
                    ${capacity.toFixed(2)} kW
                </td>

                <td>${quantity}</td>

                <td>${money(unitPrice)}</td>

                <td>${money(lineTotal)}</td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>

        <div class="total-box">
            Equipment Total:
            KES ${money(total)}
        </div>
    `;


    container.innerHTML = html;
}


function proceedFromPrices() {

    renderDrainage();

    goToPage(11);
}


/* =========================================================
   DRAINAGE
   ========================================================= */

function renderDrainage() {

    const container =
        document.getElementById(
            "drainageContainer"
        );


    container.innerHTML = "";


    state.rooms.forEach((room, index) => {

        container.innerHTML += `

            <div class="drainage-row">

                <div class="room-number">

                    ${index + 1}.
                    ${escapeHTML(room.name)}

                </div>

                <label>

                    Drainage Length (m)

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        id="drainage-${index}"
                        value="${room.drainageLength || ""}"
                        placeholder="Enter drainage length"
                    >

                </label>

            </div>

        `;

    });

}


function saveDrainage() {

    for (
        let i = 0;
        i < state.rooms.length;
        i++
    ) {

        const length =
            number(
                document.getElementById(
                    `drainage-${i}`
                ).value
            );


        if (length <= 0) {

            showAlert(
                `Please enter drainage length for ${state.rooms[i].name}.`
            );

            return;
        }


        state.rooms[i].drainageLength =
            length;

    }


    saveState();

    renderDrainagePreview();

    goToPage(12);
}


function renderDrainagePreview() {

    const container =
        document.getElementById(
            "drainagePreview"
        );


    let total = 0;


    let html = `

        <table class="preview-table">

            <thead>

                <tr>
                    <th>#</th>
                    <th>Room</th>
                    <th>Drainage Length (m)</th>
                </tr>

            </thead>

            <tbody>
    `;


    state.rooms.forEach((room, index) => {

        total += room.drainageLength;


        html += `

            <tr>

                <td>${index + 1}</td>

                <td>
                    ${escapeHTML(room.name)}
                </td>

                <td>
                    ${room.drainageLength.toFixed(2)}
                </td>

            </tr>

        `;

    });


    html += `

            </tbody>
        </table>

        <div class="total-box">

            Total Drainage Length:
            ${total.toFixed(2)} m

        </div>

    `;


    container.innerHTML = html;
}


function proceedFromDrainage() {

    document.getElementById(
        "copperRate"
    ).value =
        state.copperRate || "";


    document.getElementById(
        "drainageRate"
    ).value =
        state.drainageRate || "";


    renderOtherItems();

    goToPage(13);
}


/* =========================================================
   RATES / OTHER ITEMS
   ========================================================= */

function updateOtherItemTotal() {

    const qty =
        number(
            document.getElementById(
                "otherItemQty"
            )?.value
        );


    const unitPrice =
        number(
            document.getElementById(
                "otherItemUnitPrice"
            )?.value
        );


    const total =
        qty * unitPrice;


    const display =
        document.getElementById(
            "otherItemTotal"
        );


    if (display) {

        display.textContent =
            `Total: KES ${money(total)}`;

    }
}


function addOtherItem() {

    const name =
        document.getElementById(
            "otherItemName"
        ).value.trim();


    const quantity =
        number(
            document.getElementById(
                "otherItemQty"
            ).value
        );


    const unitPrice =
        number(
            document.getElementById(
                "otherItemUnitPrice"
            ).value
        );


    if (!name) {

        showAlert(
            "Enter an item description."
        );

        return;
    }


    if (quantity <= 0) {

        showAlert(
            "Enter a valid quantity."
        );

        return;
    }


    if (unitPrice <= 0) {

        showAlert(
            "Enter a valid unit price."
        );

        return;
    }


    const item = {

        name: name,

        quantity: quantity,

        unitPrice: unitPrice,

        total: quantity * unitPrice

    };


    state.otherItems.push(item);

    saveState();

    renderOtherItems();


    document.getElementById(
        "otherItemName"
    ).value = "";


    document.getElementById(
        "otherItemQty"
    ).value = "";


    document.getElementById(
        "otherItemUnitPrice"
    ).value = "";


    updateOtherItemTotal();
}


function renderOtherItems() {

    const container =
        document.getElementById(
            "otherItemsPreview"
        );


    if (!container) return;


    if (
        state.otherItems.length === 0
    ) {

        container.innerHTML =
            `<div class="empty-message">
                No additional items added yet.
            </div>`;

        return;
    }


    let html = "";


    state.otherItems.forEach(
        (item, index) => {

            html += `

                <div class="other-item-card">

                    <strong>
                        ${index + 1}.
                        ${escapeHTML(item.name)}
                    </strong>

                    <p>
                        Quantity:
                        ${item.quantity}
                    </p>

                    <p>
                        Unit Price:
                        KES ${money(item.unitPrice)}
                    </p>

                    <p>
                        Total:
                        <strong>
                            KES ${money(item.total)}
                        </strong>
                    </p>

                    <button
                        class="delete-btn"
                        onclick="deleteOtherItem(${index})"
                    >
                        Delete
                    </button>

                </div>

            `;

        }
    );


    container.innerHTML = html;
}


function deleteOtherItem(index) {

    state.otherItems.splice(
        index,
        1
    );

    saveState();

    renderOtherItems();
}


function saveRatesAndProceed() {

    const copperRate =
        number(
            document.getElementById(
                "copperRate"
            ).value
        );


    const drainageRate =
        number(
            document.getElementById(
                "drainageRate"
            ).value
        );


    if (copperRate <= 0) {

        showAlert(
            "Please enter the copper and accessories rate per metre."
        );

        return;
    }


    if (drainageRate <= 0) {

        showAlert(
            "Please enter the drainage rate per metre."
        );

        return;
    }


    state.copperRate =
        copperRate;


    state.drainageRate =
        drainageRate;


    saveState();

    renderQuotationSummary();

    goToPage(14);
}


/* =========================================================
   COST CALCULATIONS
   ========================================================= */

function calculateEquipmentTotal() {

    let total = 0;


    getUniqueCapacities().forEach(
        capacity => {

            const quantity =
                state.rooms.filter(
                    room =>
                        Number(
                            room.capacity.toFixed(2)
                        ) === capacity
                ).length;


            const unitPrice =
                number(
                    state.acPrices[capacity]
                );


            total +=
                quantity * unitPrice;

        }
    );


    return total;
}


function calculateCopperTotalLength() {

    return state.rooms.reduce(
        (sum, room) =>
            sum + number(room.copperLength),
        0
    );
}


function calculateDrainageTotalLength() {

    return state.rooms.reduce(
        (sum, room) =>
            sum + number(room.drainageLength),
        0
    );
}


function calculateCopperTotal() {

    return (
        calculateCopperTotalLength()
        *
        state.copperRate
    );

}


function calculateDrainageTotal() {

    return (
        calculateDrainageTotalLength()
        *
        state.drainageRate
    );

}


function calculateOtherItemsTotal() {

    return state.otherItems.reduce(
        (sum, item) =>
            sum + number(item.total),
        0
    );

}


function calculateHVACWorks() {

    return (

        calculateEquipmentTotal()

        +

        calculateCopperTotal()

        +

        calculateDrainageTotal()

        +

        calculateOtherItemsTotal()

    );

}


function calculatePreliminaries() {

    return 15000;

}


function calculateAsBuiltDrawing() {

    return 5000;

}


function calculateSummaryTotal() {

    return (

        calculatePreliminaries()

        +

        calculateAsBuiltDrawing()

        +

        calculateHVACWorks()

    );

}


function calculateVAT() {

    return (
        calculateSummaryTotal()
        * 0.16
    );

}


function calculateGrandTotal() {

    return (
        calculateSummaryTotal()
        + calculateVAT()
    );

}


/* =========================================================
   FINAL SUMMARY
   ========================================================= */

function renderQuotationSummary() {

    const container =
        document.getElementById(
            "quotationSummary"
        );


    const equipment =
        calculateEquipmentTotal();


    const copper =
        calculateCopperTotal();


    const drainage =
        calculateDrainageTotal();


    const other =
        calculateOtherItemsTotal();


    const hvacWorks =
        calculateHVACWorks();


    const preliminaries =
        calculatePreliminaries();


    const asBuilt =
        calculateAsBuiltDrawing();


    const subtotal =
        calculateSummaryTotal();


    const vat =
        calculateVAT();


    const grandTotal =
        calculateGrandTotal();


    container.innerHTML = `

        <div class="final-summary">

            <div class="summary-row">
                <span>Equipment</span>
                <strong>
                    KES ${money(equipment)}
                </strong>
            </div>

            <div class="summary-row">
                <span>Copper & Accessories</span>
                <strong>
                    KES ${money(copper)}
                </strong>
            </div>

            <div class="summary-row">
                <span>Drainage</span>
                <strong>
                    KES ${money(drainage)}
                </strong>
            </div>

            ${
                other > 0
                ?
                `
                <div class="summary-row">
                    <span>Other Items</span>
                    <strong>
                        KES ${money(other)}
                    </strong>
                </div>
                `
                :
                ""
            }

            <div class="summary-row total">

                <span>
                    Total HVAC Works
                    <small>
                        (Exclusive of VAT)
                    </small>
                </span>

                <strong>
                    KES ${money(hvacWorks)}
                </strong>

            </div>

            <hr>

            <div class="summary-row">
                <span>Preliminaries</span>
                <strong>
                    KES 15,000.00
                </strong>
            </div>

            <div class="summary-row">
                <span>As Built Drawing</span>
                <strong>
                    KES 5,000.00
                </strong>
            </div>

            <div class="summary-row total">
                <span>Summary Total</span>
                <strong>
                    KES ${money(subtotal)}
                </strong>
            </div>

            <div class="summary-row vat">
                <span>16% VAT</span>
                <strong>
                    KES ${money(vat)}
                </strong>
            </div>

            <div class="summary-row total">

                <span>
                    TOTAL INCLUSIVE OF VAT
                </span>

                <strong>
                    KES ${money(grandTotal)}
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   PDF GENERATION
   ========================================================= */

function generatePDF() {

    if (
        typeof window.jspdf === "undefined"
    ) {

        showAlert(
            "PDF library could not be loaded. Please check your internet connection and try again."
        );

        return;
    }


    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF();


    /*
       -------------------------------------------------------
       HEADER
       -------------------------------------------------------
    */

    doc.setFont("helvetica", "bold");

    doc.setFontSize(18);

    doc.text(
        "HOTPOINT ENGINEERING DIVISION",
        105,
        18,
        {
            align: "center"
        }
    );


    doc.setFontSize(14);

    doc.text(
        "HVAC WORKS QUOTATION",
        105,
        27,
        {
            align: "center"
        }
    );


    doc.setFont("helvetica", "normal");

    doc.setFontSize(9);

    doc.text(
        "Onsite Quotation",
        105,
        34,
        {
            align: "center"
        }
    );


    doc.line(
        14,
        39,
        196,
        39
    );


    /*
       -------------------------------------------------------
       DATE
       -------------------------------------------------------
    */

    const today =
        new Date();


    const dateString =
        today.toLocaleDateString(
            "en-GB"
        );


    doc.setFontSize(9);

    doc.text(
        `Date: ${dateString}`,
        14,
        48
    );


    doc.text(
        "Currency: KES",
        196,
        48,
        {
            align: "right"
        }
    );


    let currentY = 56;


    /*
       -------------------------------------------------------
       1. EQUIPMENT
       -------------------------------------------------------
    */

    doc.setFontSize(12);

    doc.setFont("helvetica", "bold");

    doc.text(
        "1. EQUIPMENT",
        14,
        currentY
    );


    currentY += 5;


    const equipmentRows = [];


    getUniqueCapacities().forEach(
        capacity => {

            const quantity =
                state.rooms.filter(
                    room =>
                        Number(
                            room.capacity.toFixed(2)
                        ) === capacity
                ).length;


            const unitPrice =
                number(
                    state.acPrices[capacity]
                );


            const total =
                quantity * unitPrice;


            equipmentRows.push([

                `${capacity.toFixed(2)} kW Split AC`,

                quantity.toString(),

                money(unitPrice),

                money(total)

            ]);

        }
    );


    doc.autoTable({

        startY: currentY,

        head: [
            [
                "Description",
                "Qty",
                "Unit Price (KES)",
                "Total (KES)"
            ]
        ],

        body: equipmentRows,

        theme: "grid",

        headStyles: {
            fillColor: [0, 59, 112]
        },

        styles: {
            fontSize: 8
        },

        columnStyles: {
            1: {
                halign: "center"
            },
            2: {
                halign: "right"
            },
            3: {
                halign: "right"
            }
        }

    });


    currentY =
        doc.lastAutoTable.finalY + 10;


    /*
       -------------------------------------------------------
       2. COPPER
       -------------------------------------------------------
    */

    doc.setFontSize(12);

    doc.setFont("helvetica", "bold");

    doc.text(
        "2. COPPER & ACCESSORIES",
        14,
        currentY
    );


    currentY += 5;


    doc.autoTable({

        startY: currentY,

        head: [
            [
                "Description",
                "Length (m)",
                "Cost / m (KES)",
                "Total (KES)"
            ]
        ],

        body: [
            [
                "Copper pipe and accessories",
                calculateCopperTotalLength()
                    .toFixed(2),
                money(state.copperRate),
                money(calculateCopperTotal())
            ]
        ],

        theme: "grid",

        headStyles: {
            fillColor: [0, 59, 112]
        },

        styles: {
            fontSize: 8
        },

        columnStyles: {
            1: {
                halign: "center"
            },
            2: {
                halign: "right"
            },
            3: {
                halign: "right"
            }
        }

    });


    currentY =
        doc.lastAutoTable.finalY + 10;


    /*
       -------------------------------------------------------
       3. DRAINAGE
       -------------------------------------------------------
    */

    doc.setFontSize(12);

    doc.setFont("helvetica", "bold");

    doc.text(
        "3. DRAINAGE",
        14,
        currentY
    );


    currentY += 5;


    doc.autoTable({

        startY: currentY,

        head: [
            [
                "Description",
                "Length (m)",
                "Cost / m (KES)",
                "Total (KES)"
            ]
        ],

        body: [
            [
                "PVC drainage pipe and accessories",
                calculateDrainageTotalLength()
                    .toFixed(2),
                money(state.drainageRate),
                money(calculateDrainageTotal())
            ]
        ],

        theme: "grid",

        headStyles: {
            fillColor: [0, 59, 112]
        },

        styles: {
            fontSize: 8
        },

        columnStyles: {
            1: {
                halign: "center"
            },
            2: {
                halign: "right"
            },
            3: {
                halign: "right"
            }
        }

    });


    currentY =
        doc.lastAutoTable.finalY + 10;


    /*
       -------------------------------------------------------
       OTHER ITEMS
       -------------------------------------------------------
    */

    if (
        state.otherItems.length > 0
    ) {

        doc.setFontSize(12);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "4. OTHER ITEMS",
            14,
            currentY
        );


        currentY += 5;


        const otherRows =
            state.otherItems.map(
                item => [

                    item.name,

                    item.quantity
                        .toFixed(2),

                    money(
                        item.unitPrice
                    ),

                    money(
                        item.total
                    )

                ]
            );


        doc.autoTable({

            startY: currentY,

            head: [
                [
                    "Description",
                    "Qty",
                    "Unit Price (KES)",
                    "Total (KES)"
                ]
            ],

            body: otherRows,

            theme: "grid",

            headStyles: {
                fillColor: [0, 59, 112]
            },

            styles: {
                fontSize: 8
            },

            columnStyles: {
                1: {
                    halign: "center"
                },
                2: {
                    halign: "right"
                },
                3: {
                    halign: "right"
                }
            }

        });


        currentY =
            doc.lastAutoTable.finalY + 10;

    }


    /*
       -------------------------------------------------------
       TOTAL HVAC WORKS
       -------------------------------------------------------
    */

    const hvacWorks =
        calculateHVACWorks();


    if (
        currentY > 245
    ) {

        doc.addPage();

        currentY = 20;

    }


    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(12);

    doc.text(
        "TOTAL HVAC WORKS",
        14,
        currentY
    );


    doc.text(
        `KES ${money(hvacWorks)}`,
        196,
        currentY,
        {
            align: "right"
        }
    );


    doc.setFontSize(8);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        "Exclusive of VAT",
        196,
        currentY + 5,
        {
            align: "right"
        }
    );


    currentY += 15;


    /*
       -------------------------------------------------------
       SUMMARY
       -------------------------------------------------------
    */

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(12);

    doc.text(
        "SUMMARY",
        14,
        currentY
    );


    currentY += 5;


    const summaryRows = [

        [
            "Preliminaries",
            "1 Lot",
            money(15000)
        ],

        [
            "As Built Drawing",
            "1 Lot",
            money(5000)
        ],

        [
            "Total HVAC Works",
            "1 Lot",
            money(hvacWorks)
        ]

    ];


    doc.autoTable({

        startY: currentY,

        head: [
            [
                "Description",
                "Quantity",
                "Total (KES)"
            ]
        ],

        body: summaryRows,

        theme: "grid",

        headStyles: {
            fillColor: [0, 59, 112]
        },

        styles: {
            fontSize: 9
        },

        columnStyles: {
            1: {
                halign: "center"
            },
            2: {
                halign: "right"
            }
        }

    });


    currentY =
        doc.lastAutoTable.finalY + 8;


    /*
       -------------------------------------------------------
       SUMMARY TOTALS
       -------------------------------------------------------
    */

    const subtotal =
        calculateSummaryTotal();


    const vat =
        calculateVAT();


    const grandTotal =
        calculateGrandTotal();


    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(10);


    doc.text(
        "Total Cost:",
        125,
        currentY
    );


    doc.text(
        `KES ${money(subtotal)}`,
        196,
        currentY,
        {
            align: "right"
        }
    );


    currentY += 7;


    doc.text(
        "VAT @ 16%:",
        125,
        currentY
    );


    doc.text(
        `KES ${money(vat)}`,
        196,
        currentY,
        {
            align: "right"
        }
    );


    currentY += 9;


    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(12);


    doc.text(
        "TOTAL INCLUDING 16% VAT:",
        100,
        currentY
    );


    doc.text(
        `KES ${money(grandTotal)}`,
        196,
        currentY,
        {
            align: "right"
        }
    );


    /*
       -------------------------------------------------------
       FOOTER
       -------------------------------------------------------
    */

    const pageCount =
        doc.internal.getNumberOfPages();


    for (
        let i = 1;
        i <= pageCount;
        i++
    ) {

        doc.setPage(i);


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.setFontSize(8);


        doc.text(
            "© Moses Ntella Taa | hvacmsaintern@hotpoint.co.ke",
            105,
            287,
            {
                align: "center"
            }
        );


        doc.text(
            `Page ${i} of ${pageCount}`,
            196,
            287,
            {
                align: "right"
            }
        );

    }


    /*
       -------------------------------------------------------
       SAVE PDF
       -------------------------------------------------------
    */

    const filename =
        "Onsite_HVAC_Quotation_" +
        today
            .toISOString()
            .slice(0, 10) +
        ".pdf";


    doc.save(filename);
}


/* =========================================================
   NEW QUOTATION
   ========================================================= */

function startNewQuotation() {

    const confirmNew =
        confirm(
            "Start a new quotation? The current quotation will be cleared."
        );


    if (!confirmNew) return;


    localStorage.removeItem(
        "onsiteQuotationState"
    );


    state.rooms = [];

    state.coolingFactor = 0;

    state.copperRate = 0;

    state.drainageRate = 0;

    state.acPrices = {};

    state.otherItems = [];


    document.getElementById(
        "roomInputContainer"
    ).innerHTML = "";


    addRoomInput();


    goToPage(1);
}


/* =========================================================
   AUTO-SAVE BEFORE LEAVING PAGE
   ========================================================= */

window.addEventListener(
    "beforeunload",
    function () {
        saveState();
    }
);