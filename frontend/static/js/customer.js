const CUSTOMER_STORAGE_KEY = "srqs_customer_context";
const CUSTOMER_CART_KEY = "srqs_customer_cart";
const CUSTOMER_ORDER_KEY = "srqs_customer_order";

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    if (path === "/customer" || path.includes("select_table")) {
        initSelectTablePage();
    }

    if (path.includes("menu")) {
        initMenuPage();
    }

    if (path.includes("cart")) {
        initCartPage();
    }

    if (path.includes("order_status")) {
        initOrderStatusPage();
    }
});

function getCustomerContext() {
    return JSON.parse(sessionStorage.getItem(CUSTOMER_STORAGE_KEY) || "null");
}

function setCustomerContext(context) {
    sessionStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(context));
}

function getCart() {
    return JSON.parse(sessionStorage.getItem(CUSTOMER_CART_KEY) || "[]");
}

function setCart(cart) {
    sessionStorage.setItem(CUSTOMER_CART_KEY, JSON.stringify(cart));
}

function getCurrentOrder() {
    return JSON.parse(sessionStorage.getItem(CUSTOMER_ORDER_KEY) || "null");
}

function setCurrentOrder(order) {
    sessionStorage.setItem(CUSTOMER_ORDER_KEY, JSON.stringify(order));
}

function showCustomerAlert(message, type = "warning") {
    const target = document.getElementById("customer-alert");
    if (!target) return;
    target.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

async function initSelectTablePage() {
    const select = document.getElementById("table-select");
    const continueBtn = document.getElementById("continue-to-menu-btn");

    try {
        const response = await fetch("/api/customer/tables");
        const tables = await response.json();

        select.innerHTML = `<option value="">Choose your table</option>` +
            tables.map(table => `
                <option value="${table.id}" data-table-number="${table.table_number}">
                    ${table.table_number} (${table.seats} seats)
                </option>
            `).join("");

        const params = new URLSearchParams(window.location.search);
        const qrToken = params.get("token");

        if (qrToken) {
            const qrResponse = await fetch(`/api/customer/tables/resolve?qr_token=${encodeURIComponent(qrToken)}`);
            if (qrResponse.ok) {
                const table = await qrResponse.json();
                select.value = table.id;
            }
        }
    } catch {
        showCustomerAlert("Unable to load restaurant tables right now.", "danger");
    }

    continueBtn.addEventListener("click", () => {
        const selectedOption = select.options[select.selectedIndex];
        if (!select.value) {
            return showCustomerAlert("Please select a table to continue.");
        }

        setCustomerContext({
            table_id: Number(select.value),
            table_number: selectedOption.dataset.tableNumber,
            customer_name: document.getElementById("customer-name").value || "Guest",
            customer_phone: document.getElementById("customer-phone").value || null
        });

        if (!getCart().length) {
            setCart([]);
        }

        window.location.href = "/customer/menu";
    });
}

async function initMenuPage() {
    const context = getCustomerContext();
    if (!context) {
        window.location.href = "/customer/select_table";
        return;
    }

    document.getElementById("selected-table-number").textContent = context.table_number;
    document.getElementById("selected-customer-name").textContent = context.customer_name || "Guest";

    const menuGrid = document.getElementById("menu-grid");
    const searchInput = document.getElementById("menu-search");
    const tabButtons = document.querySelectorAll(".category-tab");
    const goToCartBtn = document.getElementById("go-to-cart-btn");

    let menuItems = [];
    let activeCategory = "all";

    try {
        const response = await fetch("/api/customer/menu");
        menuItems = await response.json();
        renderMenuGrid(menuItems, activeCategory, searchInput.value);
        updateMiniCartPreview();
    } catch {
        showCustomerAlert("Unable to load menu items.", "danger");
    }

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(tab => tab.classList.remove("active"));
            button.classList.add("active");
            activeCategory = button.dataset.category;
            renderMenuGrid(menuItems, activeCategory, searchInput.value);
        });
    });

    searchInput.addEventListener("input", () => {
        renderMenuGrid(menuItems, activeCategory, searchInput.value);
    });

    goToCartBtn.addEventListener("click", () => {
        window.location.href = "/customer/cart";
    });

    function renderMenuGrid(items, category, query) {
        const filtered = items.filter(item => {
            const matchCategory = category === "all" || item.category === category;
            const matchQuery = item.name.toLowerCase().includes(query.toLowerCase());
            return matchCategory && matchQuery;
        });

        menuGrid.innerHTML = filtered.map(item => `
            <div class="col-md-6 col-xl-4">
                <div class="menu-card">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="menu-tag">${formatCategory(item.category)}</span>
                            <div class="menu-price">₹${Number(item.price).toFixed(2)}</div>
                        </div>
                        <h3 class="h5 fw-bold">${item.name}</h3>
                        <p class="text-soft flex-grow-1">${item.description || "Freshly prepared by our kitchen."}</p>
                        <button class="btn btn-primary mt-3 add-menu-item-btn" data-item='${JSON.stringify(item)}'>Add To Cart</button>
                    </div>
                </div>
            </div>
        `).join("");

        document.querySelectorAll(".add-menu-item-btn").forEach(button => {
            button.addEventListener("click", () => {
                const item = JSON.parse(button.dataset.item);
                const cart = getCart();
                const existing = cart.find(entry => entry.menu_item_id === item.id);

                if (existing) {
                    existing.quantity += 1;
                } else {
                    cart.push({
                        menu_item_id: item.id,
                        name: item.name,
                        price: Number(item.price),
                        quantity: 1
                    });
                }

                setCart(cart);
                updateMiniCartPreview();
                showCustomerAlert(`${item.name} added to cart.`, "success");
            });
        });
    }
}

function updateMiniCartPreview() {
    const preview = document.getElementById("mini-cart-preview");
    const badge = document.getElementById("cart-count-badge");
    if (!preview || !badge) return;

    const cart = getCart();
    badge.textContent = `${cart.length} Items`;

    if (!cart.length) {
        preview.textContent = "No items added yet.";
        return;
    }

    preview.innerHTML = cart.slice(0, 3).map(item => `
        <div class="summary-row py-2">
            <span>${item.name}</span>
            <strong>x${item.quantity}</strong>
        </div>
    `).join("");
}

function initCartPage() {
    const context = getCustomerContext();
    if (!context) {
        window.location.href = "/customer/select_table";
        return;
    }

    document.getElementById("summary-table").textContent = context.table_number;
    document.getElementById("summary-customer").textContent = context.customer_name || "Guest";

    renderCartPage();

    document.getElementById("place-order-btn").addEventListener("click", placeOrder);
}

function renderCartPage() {
    const cart = getCart();
    const container = document.getElementById("cart-page-items");

    if (!cart.length) {
        container.innerHTML = `<div class="alert alert-secondary">Your cart is empty. Go back to the menu and add items first.</div>`;
        document.getElementById("summary-count").textContent = "0";
        document.getElementById("summary-subtotal").textContent = "₹0.00";
        return;
    }

    let subtotal = 0;

    container.innerHTML = cart.map(item => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;

        return `
            <div class="cart-line">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <h3 class="h6 fw-bold mb-1">${item.name}</h3>
                        <div class="text-soft">₹${item.price.toFixed(2)} each</div>
                    </div>
                    <strong>₹${lineTotal.toFixed(2)}</strong>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="qty-box">
                        <button onclick="updateCartQuantity(${item.menu_item_id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity(${item.menu_item_id}, 1)">+</button>
                    </div>
                    <button class="btn btn-sm btn-outline-light" onclick="removeCartItem(${item.menu_item_id})">Remove</button>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("summary-count").textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
    document.getElementById("summary-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
}

window.updateCartQuantity = function(menuItemId, delta) {
    const cart = getCart();
    const item = cart.find(entry => entry.menu_item_id === menuItemId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        const filtered = cart.filter(entry => entry.menu_item_id !== menuItemId);
        setCart(filtered);
    } else {
        setCart(cart);
    }

    renderCartPage();
};

window.removeCartItem = function(menuItemId) {
    const cart = getCart().filter(entry => entry.menu_item_id !== menuItemId);
    setCart(cart);
    renderCartPage();
};

async function placeOrder() {
    const context = getCustomerContext();
    const cart = getCart();

    if (!cart.length) {
        return showCustomerAlert("Your cart is empty.");
    }

    const payload = {
        table_id: context.table_id,
        customer_name: context.customer_name || null,
        customer_phone: context.customer_phone || null,
        notes: document.getElementById("order-notes").value || null,
        items: cart.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            notes: null
        }))
    };

    try {
        const response = await fetch("/api/customer/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return showCustomerAlert(data.detail || "Unable to place order.", "danger");
        }

        setCurrentOrder({ order_id: data.id });
        setCart([]);
        window.location.href = "/customer/order_status";
    } catch {
        showCustomerAlert("Unable to place order right now.", "danger");
    }
}

function initOrderStatusPage() {
    const currentOrder = getCurrentOrder();
    if (!currentOrder) {
        window.location.href = "/customer/select_table";
        return;
    }

    loadOrderStatus(currentOrder.order_id);
    setInterval(() => loadOrderStatus(currentOrder.order_id), 5000);
}

async function loadOrderStatus(orderId) {
    try {
        const response = await fetch(`/api/customer/orders/${orderId}`);
        const order = await response.json();

        if (!response.ok) {
            return showCustomerAlert(order.detail || "Unable to fetch order status.", "danger");
        }

        document.getElementById("status-order-number").textContent = order.order_number;
        document.getElementById("status-table-number").textContent = order.table.table_number;
        document.getElementById("status-subtotal").textContent = `₹${Number(order.subtotal).toFixed(2)}`;
        document.getElementById("status-tax").textContent = `₹${Number(order.tax_amount).toFixed(2)}`;
        document.getElementById("status-total").textContent = `₹${Number(order.total_amount).toFixed(2)}`;
        document.getElementById("status-pill-holder").innerHTML = `<span class="status-pill status-${order.status}">${order.status}</span>`;

        document.getElementById("status-items").innerHTML = order.items.map(item => `
            <div class="cart-line">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="h6 fw-bold mb-1">${item.menu_item.name}</h3>
                        <div class="text-soft">Quantity: ${item.quantity}</div>
                    </div>
                    <strong>₹${Number(item.line_total).toFixed(2)}</strong>
                </div>
            </div>
        `).join("");
    } catch {
        showCustomerAlert("Unable to fetch order status.", "danger");
    }
}

function formatCategory(category) {
    return category.replace("_", " ");
}
