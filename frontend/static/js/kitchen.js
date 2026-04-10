const KITCHEN_TOKEN_KEY = "srqs_kitchen_token";
let kitchenRefreshTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem(KITCHEN_TOKEN_KEY);

    document.getElementById("login-btn").addEventListener("click", kitchenLogin);
    document.getElementById("logout-btn").addEventListener("click", logoutKitchen);

    if (token) {
        enterKitchenMode();
    }
});

function getKitchenToken() {
    return localStorage.getItem(KITCHEN_TOKEN_KEY) || "";
}

async function kitchenLogin() {
    const payload = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
    };

    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        return showKitchenAlert(data.detail || "Login failed.", "danger");
    }

    localStorage.setItem(KITCHEN_TOKEN_KEY, data.access_token);
    enterKitchenMode();
}

function enterKitchenMode() {
    document.getElementById("kitchen-login-card").classList.add("d-none");
    document.getElementById("kitchen-summary-card").classList.remove("d-none");
    loadKitchenOrders();
    kitchenRefreshTimer = setInterval(loadKitchenOrders, 5000);
}

function logoutKitchen() {
    localStorage.removeItem(KITCHEN_TOKEN_KEY);
    if (kitchenRefreshTimer) clearInterval(kitchenRefreshTimer);
    window.location.reload();
}

async function loadKitchenOrders() {
    const response = await fetch("/api/kitchen/orders/live", {
        headers: {
            Authorization: `Bearer ${getKitchenToken()}`
        }
    });

    const container = document.getElementById("live-orders");

    if (!response.ok) {
        container.innerHTML = "";
        return showKitchenAlert("Unable to load live orders.", "danger");
    }

    const orders = await response.json();

    if (!orders.length) {
        container.innerHTML = `<div class="col-12"><div class="glass-card p-4">No live orders right now.</div></div>`;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="col-md-6 col-xl-4">
            <div class="order-card p-4">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div class="small text-uppercase text-soft mb-1">Order</div>
                        <h3 class="h5 fw-bold mb-1">${order.order_number}</h3>
                        <div class="text-soft">Table ${order.table.table_number}</div>
                    </div>
                    <span class="status-pill status-${order.status}">${order.status}</span>
                </div>

                <div class="mb-3">
                    ${order.items.map(item => `
                        <div class="summary-row py-2">
                            <span>${item.menu_item.name} x ${item.quantity}</span>
                            <strong>₹${Number(item.line_total).toFixed(2)}</strong>
                        </div>
                    `).join("")}
                </div>

                <div class="d-grid gap-2">
                    <button class="btn btn-outline-light" onclick="updateKitchenStatus(${order.id}, 'confirmed')">Confirm</button>
                    <button class="btn btn-outline-light" onclick="updateKitchenStatus(${order.id}, 'preparing')">Preparing</button>
                    <button class="btn btn-outline-light" onclick="updateKitchenStatus(${order.id}, 'ready')">Ready</button>
                    <button class="btn btn-primary" onclick="updateKitchenStatus(${order.id}, 'served')">Served</button>
                </div>
            </div>
        </div>
    `).join("");
}

window.updateKitchenStatus = async function(orderId, status) {
    const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getKitchenToken()}`
        },
        body: JSON.stringify({ status })
    });

    if (!response.ok) {
        return showKitchenAlert("Unable to update order status.", "danger");
    }

    showKitchenAlert(`Order ${orderId} updated to ${status}.`, "success");
    loadKitchenOrders();
};

function showKitchenAlert(message, type = "warning") {
    document.getElementById("kitchen-alert").innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}
