// const CASHIER_TOKEN_KEY = "srqs_cashier_token";
// let currentCashierOrderId = null;

// document.addEventListener("DOMContentLoaded", () => {
//     const token = localStorage.getItem(CASHIER_TOKEN_KEY);

//     document.getElementById("login-btn").addEventListener("click", cashierLogin);
//     document.getElementById("logout-btn").addEventListener("click", logoutCashier);
//     document.getElementById("load-bill-btn").addEventListener("click", loadBill);
//     document.getElementById("record-payment-btn").addEventListener("click", recordPayment);

//     if (token) {
//         enterCashierMode();
//     }
// });

// function getCashierToken() {
//     return localStorage.getItem(CASHIER_TOKEN_KEY) || "";
// }

// async function cashierLogin() {
//     const payload = {
//         email: document.getElementById("login-email").value,
//         password: document.getElementById("login-password").value
//     };

//     const response = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//     });

//     const data = await response.json();

//     if (!response.ok) {
//         return showCashierAlert(data.detail || "Login failed.", "danger");
//     }

//     localStorage.setItem(CASHIER_TOKEN_KEY, data.access_token);
//     enterCashierMode();
// }

// function enterCashierMode() {
//     document.getElementById("cashier-login-card").classList.add("d-none");
//     document.getElementById("cashier-side-card").classList.remove("d-none");
// }

// function logoutCashier() {
//     localStorage.removeItem(CASHIER_TOKEN_KEY);
//     window.location.reload();
// }

// async function loadBill() {
//     const orderId = document.getElementById("order-id-input").value.trim();
//     if (!orderId) return showCashierAlert("Enter an order id first.");

//     const response = await fetch(`/api/cashier/orders/${orderId}/bill`, {
//         headers: {
//             Authorization: `Bearer ${getCashierToken()}`
//         }
//     });

//     const data = await response.json();

//     if (!response.ok) {
//         return showCashierAlert(data.detail || "Unable to load bill.", "danger");
//     }

//     currentCashierOrderId = data.order_id;

//     document.getElementById("bill-container").innerHTML = `
//         <div class="summary-row">
//             <span>Order Number</span>
//             <strong>${data.order_number}</strong>
//         </div>
//         <div class="summary-row">
//             <span>Table</span>
//             <strong>${data.table_number}</strong>
//         </div>
//         <div class="summary-row">
//             <span>Status</span>
//             <strong>${data.status}</strong>
//         </div>
//         <div class="mt-3 mb-3">
//             ${data.items.map(item => `
//                 <div class="summary-row py-2">
//                     <span>${item.menu_item_name} x ${item.quantity}</span>
//                     <strong>₹${Number(item.line_total).toFixed(2)}</strong>
//                 </div>
//             `).join("")}
//         </div>
//         <div class="summary-row">
//             <span>Subtotal</span>
//             <strong>₹${Number(data.subtotal).toFixed(2)}</strong>
//         </div>
//         <div class="summary-row">
//             <span>Tax</span>
//             <strong>₹${Number(data.tax_amount).toFixed(2)}</strong>
//         </div>
//         <div class="summary-row border-0 pb-0">
//             <span>Total</span>
//             <strong>₹${Number(data.total_amount).toFixed(2)}</strong>
//         </div>
//     `;
// }

// async function recordPayment() {
//     if (!currentCashierOrderId) {
//         return showCashierAlert("Load a bill before recording payment.");
//     }

//     const payload = {
//         method: document.getElementById("payment-method").value,
//         reference: document.getElementById("payment-reference").value || null
//     };

//     const response = await fetch(`/api/cashier/orders/${currentCashierOrderId}/payments`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${getCashierToken()}`
//         },
//         body: JSON.stringify(payload)
//     });

//     const data = await response.json();

//     if (!response.ok) {
//         return showCashierAlert(data.detail || "Unable to record payment.", "danger");
//     }

//     showCashierAlert(`Payment recorded for order ${data.order_id}.`, "success");
//     loadBill();
// }

//     if (!response.ok) {
//         return showCashierAlert(data.detail || "Unable to record payment.", "danger");
//     }

//     showCashierAlert(`Payment recorded for order ${data.order_id}.`, "success");
//     loadBill();


// function formatErrorMessage(message) {
//     if (typeof message === "string") {
//         return message;
//     }

//     if (Array.isArray(message)) {
//         return message.map(item => item.msg || JSON.stringify(item)).join(", ");
//     }

//     if (message && typeof message === "object") {
//         return message.msg || JSON.stringify(message);
//     }

//     return "Something went wrong.";
// }

// function showCashierAlert(message, type = "warning") {
//     document.getElementById("cashier-alert").innerHTML =
//         `<div class="alert alert-${type}">${formatErrorMessage(message)}</div>`;
// }

const CASHIER_TOKEN_KEY = "srqs_cashier_token";
let currentCashierOrderId = null;

/* ===============================
   INIT
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem(CASHIER_TOKEN_KEY);

    document.getElementById("login-btn")?.addEventListener("click", cashierLogin);
    document.getElementById("logout-btn")?.addEventListener("click", logoutCashier);
    document.getElementById("load-bill-btn")?.addEventListener("click", loadBill);
    document.getElementById("record-payment-btn")?.addEventListener("click", recordPayment);

    if (token) {
        enterCashierMode();
    }
});

/* ===============================
   AUTH HELPERS
   =============================== */

function getCashierToken() {
    return localStorage.getItem(CASHIER_TOKEN_KEY) || "";
}

async function cashierLogin() {
    const payload = {
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value
    };

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return showCashierAlert(data.detail || "Login failed.", "danger");
        }

        localStorage.setItem(CASHIER_TOKEN_KEY, data.access_token);
        enterCashierMode();
    } catch (err) {
        showCashierAlert("Network error. Please try again.", "danger");
    }
}

function enterCashierMode() {
    document.getElementById("cashier-login-card")?.classList.add("d-none");
    document.getElementById("cashier-side-card")?.classList.remove("d-none");
}

function logoutCashier() {
    localStorage.removeItem(CASHIER_TOKEN_KEY);
    window.location.reload();
}

/* ===============================
   BILL LOADING
   =============================== */

async function loadBill() {
    const orderId = document.getElementById("order-id-input").value.trim();
    if (!orderId) {
        return showCashierAlert("Enter an order ID first.", "warning");
    }

    try {
        const response = await fetch(
            `/api/cashier/orders/${orderId}/bill`,
            {
                headers: {
                    Authorization: `Bearer ${getCashierToken()}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return showCashierAlert(data.detail || "Unable to load bill.", "danger");
        }

        currentCashierOrderId = data.order_id;

        document.getElementById("bill-container").innerHTML = `
            <div class="summary-row">
                <span>Order Number</span>
                <strong>${data.order_number}</strong>
            </div>

            <div class="summary-row">
                <span>Table</span>
                <strong>${data.table_number}</strong>
            </div>

            <div class="summary-row">
                <span>Status</span>
                <strong>${data.status}</strong>
            </div>

            <div class="mt-3 mb-3">
                ${data.items.map(item => `
                    <div class="summary-row py-2">
                        <span>${item.menu_item_name} × ${item.quantity}</span>
                        <strong>₹${Number(item.line_total).toFixed(2)}</strong>
                    </div>
                `).join("")}
            </div>

            <div class="summary-row">
                <span>Subtotal</span>
                <strong>₹${Number(data.subtotal).toFixed(2)}</strong>
            </div>

            <div class="summary-row">
                <span>Tax</span>
                <strong>₹${Number(data.tax_amount).toFixed(2)}</strong>
            </div>

            <div class="summary-row border-0 pb-0">
                <span>Total</span>
                <strong>₹${Number(data.total_amount).toFixed(2)}</strong>
            </div>
        `;
    } catch (err) {
        showCashierAlert("Failed to fetch bill. Check network.", "danger");
    }
}

/* ===============================
   PAYMENT
   =============================== */

async function recordPayment() {
    if (!currentCashierOrderId) {
        return showCashierAlert("Load a bill before recording payment.", "warning");
    }

    const payload = {
        method: document.getElementById("payment-method").value,
        reference: document.getElementById("payment-reference").value || null
    };

    try {
        const response = await fetch(
            `/api/cashier/orders/${currentCashierOrderId}/payments`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getCashierToken()}`
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return showCashierAlert(data.detail || "Unable to record payment.", "danger");
        }

        showCashierAlert(
            `Payment recorded successfully for order ${data.order_id}.`,
            "success"
        );

        loadBill();
    } catch (err) {
        showCashierAlert("Payment request failed.", "danger");
    }
}

/* ===============================
   UI HELPERS
   =============================== */

function formatErrorMessage(message) {
    if (typeof message === "string") return message;

    if (Array.isArray(message)) {
        return message.map(err => err.msg || JSON.stringify(err)).join(", ");
    }

    if (typeof message === "object" && message !== null) {
        return message.msg || JSON.stringify(message);
    }

    return "Something went wrong.";
}

function showCashierAlert(message, type = "warning") {
    const alertBox = document.getElementById("cashier-alert");
    if (!alertBox) return;

    alertBox.innerHTML = `
        <div class="alert alert-${type}">
            ${formatErrorMessage(message)}
        </div>
    `;
}

