const ADMIN_TOKEN_KEY = "srqs_admin_token";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    document.getElementById("login-btn").addEventListener("click", adminLogin);
    document.getElementById("logout-btn").addEventListener("click", logoutAdmin);
    document.getElementById("save-menu-btn").addEventListener("click", saveMenuItem);
    document.getElementById("reset-menu-btn").addEventListener("click", resetMenuForm);
    document.getElementById("load-qr-btn").addEventListener("click", loadQrCode);

    if (token) {
        enterAdminMode();
    }
});

function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

async function adminLogin() {
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
        return showAdminAlert(data.detail || "Login failed.", "danger");
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, data.access_token);
    enterAdminMode();
}

function enterAdminMode() {
    document.getElementById("admin-login-card").classList.add("d-none");
    document.getElementById("admin-side-card").classList.remove("d-none");
    loadAnalytics();
    loadMenuItems();
}

function logoutAdmin() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.location.reload();
}

async function loadAnalytics() {
    const response = await fetch("/api/admin/analytics", {
        headers: {
            Authorization: `Bearer ${getAdminToken()}`
        }
    });

    const data = await response.json();
    if (!response.ok) {
        return showAdminAlert(data.detail || "Unable to load analytics.", "danger");
    }

    document.getElementById("analytics-cards").innerHTML = `
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-label">Paid Orders</div>
                <div class="metric-value">${data.paid_orders}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">₹${Number(data.total_revenue).toFixed(2)}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-label">Today Revenue</div>
                <div class="metric-value">₹${Number(data.today_revenue).toFixed(2)}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-label">Pending Orders</div>
                <div class="metric-value">${data.pending_orders}</div>
            </div>
        </div>
    `;
}

async function loadMenuItems() {
    const response = await fetch("/api/admin/menu", {
        headers: {
            Authorization: `Bearer ${getAdminToken()}`
        }
    });

    const items = await response.json();
    if (!response.ok) {
        return showAdminAlert(items.detail || "Unable to load menu items.", "danger");
    }

    document.getElementById("menu-table-body").innerHTML = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>₹${Number(item.price).toFixed(2)}</td>
            <td>${item.is_available ? "Available" : "Disabled"}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light me-2" onclick='editMenuItem(${JSON.stringify(item)})'>Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick='disableMenuItem(${item.id})'>Disable</button>
            </td>
        </tr>
    `).join("");
}

window.editMenuItem = function(item) {
    document.getElementById("menu-item-id").value = item.id;
    document.getElementById("menu-name").value = item.name;
    document.getElementById("menu-description").value = item.description || "";
    document.getElementById("menu-category").value = item.category;
    document.getElementById("menu-price").value = item.price;
    document.getElementById("menu-image-url").value = item.image_url || "";
    document.getElementById("menu-available").checked = item.is_available;
};

function resetMenuForm() {
    document.getElementById("menu-item-id").value = "";
    document.getElementById("menu-name").value = "";
    document.getElementById("menu-description").value = "";
    document.getElementById("menu-category").value = "starter";
    document.getElementById("menu-price").value = "";
    document.getElementById("menu-image-url").value = "";
    document.getElementById("menu-available").checked = true;
}

async function saveMenuItem() {
    const itemId = document.getElementById("menu-item-id").value.trim();

    const payload = {
        name: document.getElementById("menu-name").value,
        description: document.getElementById("menu-description").value || null,
        category: document.getElementById("menu-category").value,
        price: Number(document.getElementById("menu-price").value),
        image_url: document.getElementById("menu-image-url").value || null,
        is_available: document.getElementById("menu-available").checked
    };

    const url = itemId ? `/api/admin/menu/${itemId}` : "/api/admin/menu";
    const method = itemId ? "PUT" : "POST";

    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        return showAdminAlert(data.detail || "Unable to save menu item.", "danger");
    }

    showAdminAlert("Menu item saved successfully.", "success");
    resetMenuForm();
    loadMenuItems();
}

window.disableMenuItem = async function(menuItemId) {
    const response = await fetch(`/api/admin/menu/${menuItemId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${getAdminToken()}`
        }
    });

    if (!response.ok) {
        return showAdminAlert("Unable to disable menu item.", "danger");
    }

    showAdminAlert("Menu item disabled.", "success");
    loadMenuItems();
};

async function loadQrCode() {
    const tableId = document.getElementById("qr-table-id").value.trim();
    if (!tableId) {
        return showAdminAlert("Enter a table id first.");
    }

    const response = await fetch(`/api/admin/tables/${tableId}/qr`, {
        headers: {
            Authorization: `Bearer ${getAdminToken()}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        return showAdminAlert(data.detail || "Unable to generate QR code.", "danger");
    }

    document.getElementById("qr-output").innerHTML = `
        <div class="summary-row">
            <span>Table</span>
            <strong>${data.table_number}</strong>
        </div>
        <div class="summary-row">
            <span>Token</span>
            <strong>${data.qr_token}</strong>
        </div>
        <div class="mt-3">
            <img class="qr-image" src="data:image/png;base64,${data.qr_code_base64}" alt="QR Code">
        </div>
        <div class="mt-3 text-soft small">${data.qr_url}</div>
    `;
}

function showAdminAlert(message, type = "warning") {
    document.getElementById("admin-alert").innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}
