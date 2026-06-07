// Global State Management
let currentUser = null;
let cart = [];

// DOM Content Loaded Handler
document.addEventListener("DOMContentLoaded", () => {
    initCart();
    checkAuth();
    routePageLogic();
});

// Authentication checks
async function checkAuth() {
    try {
        const response = await fetch("/api/auth/me/");
        const data = await response.json();
        
        const authSection = document.getElementById("auth-header-section");
        const navOrders = document.getElementById("nav-orders");

        if (data.authenticated) {
            currentUser = data.user;
            if (navOrders) navOrders.style.display = "inline-block";
            
            if (authSection) {
                authSection.innerHTML = `
                    <span class="user-tag">Hello, <span class="user-name">${currentUser.username}</span></span>
                    <button class="btn btn-outline btn-sm" id="logout-btn">Logout</button>
                `;
                document.getElementById("logout-btn").addEventListener("click", handleLogout);
            }
        } else {
            currentUser = null;
            if (navOrders) navOrders.style.display = "none";
            if (authSection) {
                authSection.innerHTML = `<a href="/auth/" class="btn btn-primary btn-sm">Sign In</a>`;
            }
        }
    } catch (err) {
        console.error("Auth check failed:", err);
    }
}

async function handleLogout(e) {
    e.preventDefault();
    try {
        const response = await fetch("/api/auth/logout/", { method: "POST" });
        if (response.ok) {
            currentUser = null;
            window.location.href = "/";
        }
    } catch (err) {
        console.error("Logout failed:", err);
    }
}

// Cart Management Operations
function initCart() {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    } else {
        cart = [];
    }
    updateCartBadge();
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cartCountEl = document.getElementById("cart-count");
    if (cartCountEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
    }
}

function addToCart(product, quantity = 1) {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            category: product.category,
            quantity: quantity
        });
    }
    saveCart();
    showToast(`${product.name} added to cart.`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    saveCart();
    renderCart(); // Re-render if on cart page
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.product_id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        renderCart(); // Re-render if on cart page
    }
}

function clearCart() {
    cart = [];
    saveCart();
}

function showToast(message) {
    // Basic toast notifications
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = "#1e293b";
    toast.style.color = "#f8fafc";
    toast.style.border = "1px solid #334155";
    toast.style.padding = "0.75rem 1.5rem";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "1000";
    toast.style.fontSize = "0.9rem";
    toast.style.fontWeight = "500";
    toast.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.3)";
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.5s ease";
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

// Router & Page Logic
function routePageLogic() {
    const path = window.location.pathname;
    
    if (path === "/" || path.endsWith("index.html")) {
        loadCatalog();
    } else if (path.includes("/product")) {
        loadProductDetail();
    } else if (path.includes("/cart")) {
        renderCart();
    } else if (path.includes("/checkout")) {
        loadCheckout();
    } else if (path.includes("/auth")) {
        loadAuth();
    } else if (path.includes("/orders")) {
        loadOrders();
    }
}

// Page Logic: Catalog / Home
async function loadCatalog(category = "", search = "") {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    
    grid.innerHTML = `<div class="loading-spinner">Loading catalog...</div>`;
    
    let url = `/api/products/`;
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    
    try {
        const response = await fetch(url);
        const products = await response.json();
        
        if (products.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 4rem 0;">No products found matching your criteria.</div>`;
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <a href="/product/?id=${product.id}" class="product-card-img-wrapper">
                    <img src="${product.image_url}" alt="${product.name}" class="product-card-img">
                </a>
                <div class="product-card-body">
                    <div class="product-card-category">${product.category}</div>
                    <a href="/product/?id=${product.id}"><h3 class="product-card-title">${product.name}</h3></a>
                    <p class="product-card-desc">${product.description}</p>
                    <div class="product-card-footer">
                        <span class="product-card-price">$${product.price.toFixed(2)}</span>
                        <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join("");
        
        // Add To Cart Event Listeners
        grid.querySelectorAll(".add-to-cart-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const productId = parseInt(e.target.dataset.id);
                const product = products.find(p => p.id === productId);
                if (product) {
                    addToCart(product, 1);
                }
            });
        });
        
    } catch (err) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger-color); padding: 4rem 0;">Failed to load catalog. Please try again later.</div>`;
        console.error(err);
    }
}

// Attach Search / Filter handlers for home page
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
if (searchInput && searchBtn) {
    const handleSearch = () => {
        const activeCatBtn = document.querySelector(".category-btn.active");
        const category = activeCatBtn ? activeCatBtn.dataset.category : "";
        loadCatalog(category, searchInput.value.trim());
    };
    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });
}

const categoryFilters = document.getElementById("category-filters");
if (categoryFilters) {
    categoryFilters.querySelectorAll(".category-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            categoryFilters.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            const category = e.target.dataset.category;
            const search = searchInput ? searchInput.value.trim() : "";
            loadCatalog(category, search);
        });
    });
}

// Page Logic: Product Details
async function loadProductDetail() {
    const container = document.getElementById("product-details");
    if (!container) return;
    
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    
    if (!productId) {
        container.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 4rem 0;">No product specified. <a href="/">Return to shop</a></div>`;
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}/`);
        if (!response.ok) throw new Error("Product not found");
        
        const product = await response.json();
        
        let stockTagClass = "in-stock";
        let stockText = "In Stock";
        if (product.stock <= 0) {
            stockTagClass = "out-of-stock";
            stockText = "Out of Stock";
        } else if (product.stock <= 5) {
            stockTagClass = "low-stock";
            stockText = `Only ${product.stock} left in stock`;
        }
        
        container.innerHTML = `
            <div class="product-details-layout">
                <div class="product-details-image-wrapper">
                    <img src="${product.image_url}" alt="${product.name}" class="product-details-image">
                </div>
                <div class="product-details-info">
                    <span class="product-details-category">${product.category}</span>
                    <h1 class="product-details-title">${product.name}</h1>
                    <div class="product-details-price">$${product.price.toFixed(2)}</div>
                    <p class="product-details-desc">${product.description}</p>
                    
                    <div class="product-details-action">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="qty-selector">
                                <span class="qty-label">Quantity:</span>
                                <div class="qty-input-wrapper">
                                    <button class="qty-btn" id="detail-qty-dec">-</button>
                                    <input type="number" class="qty-input" id="detail-qty" value="1" min="1" max="${product.stock}">
                                    <button class="qty-btn" id="detail-qty-inc">+</button>
                                </div>
                            </div>
                            <span class="stock-tag ${stockTagClass}">${stockText}</span>
                        </div>
                        
                        <button class="btn btn-primary" id="detail-add-btn" ${product.stock <= 0 ? "disabled" : ""}>
                            ${product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const qtyInput = document.getElementById("detail-qty");
        const decBtn = document.getElementById("detail-qty-dec");
        const incBtn = document.getElementById("detail-qty-inc");
        const addBtn = document.getElementById("detail-add-btn");
        
        decBtn.addEventListener("click", () => {
            qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
        });
        
        incBtn.addEventListener("click", () => {
            qtyInput.value = Math.min(product.stock, parseInt(qtyInput.value) + 1);
        });
        
        addBtn.addEventListener("click", () => {
            const quantity = parseInt(qtyInput.value);
            addToCart(product, quantity);
        });
        
    } catch (err) {
        container.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 4rem 0;">Product not found. <a href="/">Return to shop</a></div>`;
        console.error(err);
    }
}

// Page Logic: Shopping Cart
function renderCart() {
    const layout = document.getElementById("cart-layout-container");
    if (!layout) return;
    
    if (cart.length === 0) {
        layout.innerHTML = `
            <div class="empty-cart-msg">
                <h2>Your cart is empty</h2>
                <p>Browse our catalog and add items you'd like to purchase.</p>
                <a href="/" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 150 ? 0.00 : 15.00;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    
    layout.innerHTML = `
        <div class="cart-items-list">
            ${cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-img-wrapper">
                        <img src="${item.image_url}" alt="${item.name}" class="cart-item-img">
                    </div>
                    <div class="cart-item-details">
                        <span class="cart-item-category">${item.category}</span>
                        <h3 class="cart-item-title">${item.name}</h3>
                        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                    </div>
                    <div class="cart-item-actions">
                        <div class="qty-input-wrapper">
                            <button class="qty-btn dec-qty-btn" data-id="${item.product_id}">-</button>
                            <input type="number" class="qty-input item-qty-input" data-id="${item.product_id}" value="${item.quantity}" min="1">
                            <button class="qty-btn inc-qty-btn" data-id="${item.product_id}">+</button>
                        </div>
                        <button class="btn btn-danger-outline btn-sm remove-item-btn" data-id="${item.product_id}">Remove</button>
                    </div>
                </div>
            `).join("")}
        </div>
        
        <div class="summary-card">
            <h2 class="summary-title">Order Summary</h2>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div class="summary-row">
                <span>Estimated Tax (8%)</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <a href="/checkout/" class="btn btn-primary btn-block">Proceed to Checkout</a>
        </div>
    `;
    
    // Quantity increment/decrement buttons
    layout.querySelectorAll(".dec-qty-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = cart.find(i => i.product_id === id);
            if (item) updateCartQuantity(id, item.quantity - 1);
        });
    });
    
    layout.querySelectorAll(".inc-qty-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = cart.find(i => i.product_id === id);
            if (item) updateCartQuantity(id, item.quantity + 1);
        });
    });
    
    // Direct input adjustments
    layout.querySelectorAll(".item-qty-input").forEach(input => {
        input.addEventListener("change", (e) => {
            const id = parseInt(e.target.dataset.id);
            const val = parseInt(e.target.value);
            updateCartQuantity(id, isNaN(val) ? 1 : val);
        });
    });
    
    // Remove button handlers
    layout.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.target.dataset.id);
            removeFromCart(id);
        });
    });
}

// Page Logic: Checkout
async function loadCheckout() {
    const container = document.getElementById("checkout-layout-container");
    if (!container) return;
    
    // Wait for auth to complete
    await checkAuth();
    
    if (!currentUser) {
        container.innerHTML = `
            <div class="empty-cart-msg" style="grid-column: span 2;">
                <h2>Authentication Required</h2>
                <p>You must be signed in to place an order.</p>
                <a href="/auth/?next=/checkout/" class="btn btn-primary">Sign In / Create Account</a>
            </div>
        `;
        return;
    }
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-msg" style="grid-column: span 2;">
                <h2>Your cart is empty</h2>
                <p>Add some products before heading to checkout.</p>
                <a href="/" class="btn btn-primary">Back to Shop</a>
            </div>
        `;
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 150 ? 0.00 : 15.00;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    
    container.innerHTML = `
        <form class="checkout-forms" id="checkout-form">
            <!-- Shipping Info -->
            <div class="checkout-section">
                <h2 class="checkout-section-title">Shipping Address</h2>
                <div class="form-group">
                    <label for="shipping-name">Full Name</label>
                    <input type="text" id="shipping-name" required placeholder="e.g. Devan C">
                </div>
                <div class="form-group">
                    <label for="shipping-address">Address Line</label>
                    <input type="text" id="shipping-address" required placeholder="Street address, P.O. box">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="shipping-city">City</label>
                        <input type="text" id="shipping-city" required placeholder="e.g. Bangalore">
                    </div>
                    <div class="form-group">
                        <label for="shipping-zip">ZIP Code</label>
                        <input type="text" id="shipping-zip" required placeholder="e.g. 560001">
                    </div>
                </div>
            </div>
            
            <!-- Mock Payment Info -->
            <div class="checkout-section">
                <h2 class="checkout-section-title">Payment details (Mock Payment)</h2>
                <div class="form-group">
                    <label for="card-num">Card Number</label>
                    <input type="text" id="card-num" required placeholder="4242 4242 4242 4242" pattern="[0-9\\s]{16,19}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="card-expiry">Expiry Date</label>
                        <input type="text" id="card-expiry" required placeholder="MM/YY" pattern="[0-9]{2}/[0-9]{2}">
                    </div>
                    <div class="form-group">
                        <label for="card-cvc">CVC</label>
                        <input type="password" id="card-cvc" required placeholder="123" pattern="[0-9]{3}">
                    </div>
                </div>
            </div>
            
            <div class="error-msg" id="checkout-error"></div>
            
            <button type="submit" class="btn btn-primary btn-block" id="submit-order-btn">Submit Order — $${total.toFixed(2)}</button>
        </form>
        
        <div class="summary-card">
            <h2 class="summary-title">Summary</h2>
            <div class="checkout-items-summary">
                ${cart.map(item => `
                    <div class="checkout-item-row">
                        <span class="checkout-item-name">
                            ${item.name}
                            <span class="checkout-item-qty">x${item.quantity}</span>
                        </span>
                        <span class="checkout-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join("")}
            </div>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div class="summary-row">
                <span>Tax (8%)</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    const checkoutForm = document.getElementById("checkout-form");
    const errorEl = document.getElementById("checkout-error");
    const submitBtn = document.getElementById("submit-order-btn");
    
    checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        errorEl.textContent = "";
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing order...";
        
        const payload = {
            shipping_name: document.getElementById("shipping-name").value.trim(),
            shipping_address: document.getElementById("shipping-address").value.trim(),
            shipping_city: document.getElementById("shipping-city").value.trim(),
            shipping_zip: document.getElementById("shipping-zip").value.trim(),
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        };
        
        try {
            const response = await fetch("/api/orders/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                clearCart();
                container.innerHTML = `
                    <div class="empty-cart-msg" style="grid-column: span 2; border-color: var(--success-color);">
                        <div style="font-size: 3rem; color: var(--success-color); margin-bottom: 1rem;">✓</div>
                        <h2>Order Placed Successfully!</h2>
                        <p>Thank you for your purchase. Your Order ID is <strong>#${result.order_id}</strong>.</p>
                        <p style="margin-bottom: 2rem;">You can track this order in your order history.</p>
                        <div style="display: flex; gap: 1rem; justify-content: center;">
                            <a href="/orders/" class="btn btn-primary">View My Orders</a>
                            <a href="/" class="btn btn-outline">Back to Shop</a>
                        </div>
                    </div>
                `;
            } else {
                errorEl.textContent = result.error || "An error occurred during checkout.";
                submitBtn.disabled = false;
                submitBtn.textContent = `Submit Order — $${total.toFixed(2)}`;
            }
            
        } catch (err) {
            errorEl.textContent = "Network error. Please try again.";
            submitBtn.disabled = false;
            submitBtn.textContent = `Submit Order — $${total.toFixed(2)}`;
            console.error(err);
        }
    });
}

// Page Logic: Authentication
function loadAuth() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");
    
    if (!loginForm) return;
    
    // Tab Toggling
    tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
    });
    
    tabRegister.addEventListener("click", () => {
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        registerForm.classList.add("active");
        loginForm.classList.remove("active");
    });
    
    // Login Submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.textContent = "";
        
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;
        
        try {
            const response = await fetch("/api/auth/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                // If query parameter next is defined, redirect there, else home
                const params = new URLSearchParams(window.location.search);
                const next = params.get("next") || "/";
                window.location.href = next;
            } else {
                loginError.textContent = data.error || "Invalid credentials.";
            }
        } catch (err) {
            loginError.textContent = "Network error. Please try again.";
        }
    });
    
    // Registration Submission
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        registerError.textContent = "";
        
        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const full_name = document.getElementById("register-fullname").value.trim();
        const password = document.getElementById("register-password").value;
        
        if (password.length < 6) {
            registerError.textContent = "Password must be at least 6 characters.";
            return;
        }
        
        try {
            const response = await fetch("/api/auth/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, full_name })
            });
            const data = await response.json();
            
            if (response.ok) {
                const params = new URLSearchParams(window.location.search);
                const next = params.get("next") || "/";
                window.location.href = next;
            } else {
                registerError.textContent = data.error || "Registration failed.";
            }
        } catch (err) {
            registerError.textContent = "Network error. Please try again.";
        }
    });
}

// Page Logic: Order History
async function loadOrders() {
    const listEl = document.getElementById("orders-list-container");
    if (!listEl) return;
    
    try {
        const response = await fetch("/api/orders/my-orders/");
        if (response.status === 401) {
            listEl.innerHTML = `
                <div class="no-orders-msg">
                    <p>You must be signed in to view your order history.</p>
                    <a href="/auth/?next=/orders/" class="btn btn-primary">Sign In</a>
                </div>
            `;
            return;
        }
        
        const orders = await response.json();
        
        if (orders.length === 0) {
            listEl.innerHTML = `
                <div class="no-orders-msg">
                    <p>You haven't placed any orders yet.</p>
                    <a href="/" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = orders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const statusClass = order.status.toLowerCase();
            
            return `
                <div class="order-card">
                    <div class="order-card-header">
                        <div class="order-info-group">
                            <div>
                                <div class="order-info-lbl">Order Placed</div>
                                <div class="order-info-val">${date}</div>
                            </div>
                            <div>
                                <div class="order-info-lbl">Total</div>
                                <div class="order-info-val">$${order.total_amount.toFixed(2)}</div>
                            </div>
                            <div>
                                <div class="order-info-lbl">Order ID</div>
                                <div class="order-info-val">#${order.id}</div>
                            </div>
                        </div>
                        <span class="order-status ${statusClass}">${order.status}</span>
                    </div>
                    
                    <div class="order-card-body">
                        <div class="order-items-list">
                            ${order.items.map(item => `
                                <div class="order-item-row">
                                    <span class="order-item-desc">
                                        ${item.product_name}
                                        <span class="order-item-qty">x${item.quantity}</span>
                                    </span>
                                    <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                    
                    <div class="order-card-footer">
                        <div>Ship to: <span>${order.shipping_name}</span></div>
                        <div>Address: <span>${order.shipping_address}, ${order.shipping_city} (${order.shipping_zip})</span></div>
                    </div>
                </div>
            `;
        }).join("");
        
    } catch (err) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 4rem 0;">Failed to load order history.</div>`;
        console.error(err);
    }
}
