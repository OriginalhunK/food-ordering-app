/**
 * Food Corner – Online Food Ordering System
 * Frontend Client Logic (Vanilla JavaScript)
 * Handles Food Menu CRUD, Customer Order Management, and Real-time Calculations
 */

// Application State
let menuItems = [];
let customerOrders = [];
let currentCategoryFilter = 'all';

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const categoryFilters = document.getElementById('category-filters');
const orderDishSelect = document.getElementById('order-dish-select');
const orderQuantityInput = document.getElementById('order-quantity');
const unitPriceDisplay = document.getElementById('unit-price-display');
const totalPriceDisplay = document.getElementById('total-price-display');
const orderForm = document.getElementById('order-form');
const btnResetOrder = document.getElementById('btn-reset-order');

const menuForm = document.getElementById('menu-form');
const menuFormTitle = document.getElementById('menu-form-title');
const menuFormDesc = document.getElementById('menu-form-desc');
const dishIdInput = document.getElementById('dish-id');
const dishNameInput = document.getElementById('dish-name');
const dishCategoryInput = document.getElementById('dish-category');
const dishPriceInput = document.getElementById('dish-price');
const btnSaveDish = document.getElementById('btn-save-dish');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

const ordersTbody = document.getElementById('orders-tbody');
const notificationContainer = document.getElementById('notification-container');

// Stats Elements
const statTotalCount = document.getElementById('stat-total-count');
const statPendingCount = document.getElementById('stat-pending-count');
const statPreparingCount = document.getElementById('stat-preparing-count');
const statDeliveredCount = document.getElementById('stat-delivered-count');
const statCancelledCount = document.getElementById('stat-cancelled-count');

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  fetchMenu();
  fetchOrders();
  setupEventListeners();
});

// Setup Form & Button Event Listeners
function setupEventListeners() {
  // Order Form Events
  orderDishSelect.addEventListener('change', updateOrderCalculation);
  orderQuantityInput.addEventListener('input', updateOrderCalculation);
  orderForm.addEventListener('submit', handlePlaceOrder);
  btnResetOrder.addEventListener('click', resetOrderForm);

  // Menu Management Form Events
  menuForm.addEventListener('submit', handleSaveDish);
  btnCancelEdit.addEventListener('click', resetMenuForm);

  // Category Filter Click Events
  categoryFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentCategoryFilter = e.target.getAttribute('data-category');
      renderMenuCards();
    }
  });
}

// ==========================================
// NOTIFICATION HELPER
// ==========================================
function showNotification(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
    <span>${message}</span>
    <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  notificationContainer.innerHTML = '';
  notificationContainer.appendChild(alertDiv);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove();
    }
  }, 4000);
}

// ==========================================
// FOOD MENU OPERATIONS (CRUD)
// ==========================================

// 1. Fetch Menu from API
async function fetchMenu() {
  try {
    const res = await fetch('/api/menu');
    if (!res.ok) throw new Error('Failed to load menu items.');
    menuItems = await res.json();
    renderMenuCards();
    populateOrderDishDropdown();
  } catch (error) {
    console.error('Error fetching menu:', error);
    menuGrid.innerHTML = `<div class="empty-state">Unable to load menu: ${error.message}</div>`;
  }
}

// 2. Render Food Menu Cards
function renderMenuCards() {
  if (!menuItems || menuItems.length === 0) {
    menuGrid.innerHTML = '<div class="empty-state">No food items available in the menu.</div>';
    return;
  }

  // Filter items if a category is selected
  const filtered = currentCategoryFilter === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category.toLowerCase() === currentCategoryFilter.toLowerCase());

  if (filtered.length === 0) {
    menuGrid.innerHTML = `<div class="empty-state">No items found under "${currentCategoryFilter}".</div>`;
    return;
  }

  menuGrid.innerHTML = filtered.map((dish) => `
    <div class="food-card" data-dish-id="${dish.id}">
      <div>
        <div class="food-card-header">
          <span class="dish-name">${escapeHtml(dish.name)}</span>
          <span class="dish-badge">${escapeHtml(dish.category)}</span>
        </div>
        <div class="dish-price-tag">₹ ${dish.price.toFixed(2)}</div>
      </div>
      <div class="food-card-actions">
        <button class="btn-card-order" onclick="quickSelectOrder(${dish.id})">Order Now</button>
        <button class="btn-card-edit" onclick="startEditDish(${dish.id})">Edit</button>
        <button class="btn-card-delete" onclick="deleteDish(${dish.id}, '${escapeHtml(dish.name)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// 3. Populate Dish Dropdown in Order Form
function populateOrderDishDropdown() {
  const currentSelected = orderDishSelect.value;
  orderDishSelect.innerHTML = '<option value="">-- Choose a dish --</option>';

  menuItems.forEach((dish) => {
    const opt = document.createElement('option');
    opt.value = dish.id;
    opt.textContent = `${dish.name} (₹ ${dish.price.toFixed(2)})`;
    opt.dataset.price = dish.price;
    orderDishSelect.appendChild(opt);
  });

  if (currentSelected) {
    orderDishSelect.value = currentSelected;
  }
  updateOrderCalculation();
}

// 4. Handle Save Dish (Add or Edit)
async function handleSaveDish(e) {
  e.preventDefault();

  const id = dishIdInput.value;
  const name = dishNameInput.value.trim();
  const category = dishCategoryInput.value.trim();
  const price = parseFloat(dishPriceInput.value);

  // Client-side validation
  if (!name) {
    showNotification('Please enter a dish name.', 'error');
    dishNameInput.focus();
    return;
  }
  if (!category) {
    showNotification('Please select a food category.', 'error');
    dishCategoryInput.focus();
    return;
  }
  if (isNaN(price) || price <= 0) {
    showNotification('Please enter a valid positive price.', 'error');
    dishPriceInput.focus();
    return;
  }

  const payload = { name, category, price };

  try {
    let res;
    if (id) {
      // Edit existing dish (PUT)
      res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Add new dish (POST)
      res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Operation failed.');

    showNotification(data.message || 'Operation successful!', 'success');
    resetMenuForm();
    await fetchMenu();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// 5. Start Editing a Dish
function startEditDish(dishId) {
  const dish = menuItems.find((d) => d.id === dishId);
  if (!dish) return;

  dishIdInput.value = dish.id;
  dishNameInput.value = dish.name;
  dishCategoryInput.value = dish.category;
  dishPriceInput.value = dish.price;

  menuFormTitle.textContent = '✏️ Edit Food Item';
  menuFormDesc.textContent = `Modifying details for "${dish.name}"`;
  btnSaveDish.textContent = 'Update Dish';
  btnCancelEdit.classList.remove('hidden');

  // Smooth scroll to management form
  document.getElementById('management-section').scrollIntoView({ behavior: 'smooth' });
}

// 6. Reset Menu Management Form
function resetMenuForm() {
  dishIdInput.value = '';
  menuForm.reset();
  menuFormTitle.textContent = '➕ Add New Food Item';
  menuFormDesc.textContent = 'Add a new dish to the cafeteria menu.';
  btnSaveDish.textContent = 'Add Dish';
  btnCancelEdit.classList.add('hidden');
}

// 7. Delete Dish
async function deleteDish(dishId, dishName) {
  const confirmed = confirm(`Are you sure you want to delete "${dishName}" from the menu?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/menu/${dishId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete dish.');

    showNotification(data.message, 'success');
    await fetchMenu();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// ==========================================
// CUSTOMER ORDER OPERATIONS
// ==========================================

// 1. Update Order Price Calculation
function updateOrderCalculation() {
  const selectedOption = orderDishSelect.selectedOptions[0];
  const unitPrice = selectedOption && selectedOption.dataset.price
    ? parseFloat(selectedOption.dataset.price)
    : 0;

  const quantity = parseInt(orderQuantityInput.value, 10) || 0;
  const total = unitPrice * quantity;

  unitPriceDisplay.textContent = `₹ ${unitPrice.toFixed(2)}`;
  totalPriceDisplay.textContent = `₹ ${total.toFixed(2)}`;
}

// 2. Quick Select Dish from Menu Card
function quickSelectOrder(dishId) {
  orderDishSelect.value = dishId;
  orderQuantityInput.value = 1;
  updateOrderCalculation();

  document.getElementById('order-section').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('customer-name').focus();
}

// 3. Handle Order Form Submission
async function handlePlaceOrder(e) {
  e.preventDefault();

  const customerName = document.getElementById('customer-name').value.trim();
  const dishId = orderDishSelect.value;
  const quantity = parseInt(orderQuantityInput.value, 10);

  // Client-side validation
  if (!customerName) {
    showNotification('Please enter the customer name.', 'error');
    document.getElementById('customer-name').focus();
    return;
  }
  if (!dishId) {
    showNotification('Please select a food item to order.', 'error');
    orderDishSelect.focus();
    return;
  }
  if (isNaN(quantity) || quantity <= 0) {
    showNotification('Quantity must be at least 1.', 'error');
    orderQuantityInput.focus();
    return;
  }

  const payload = { customerName, dishId, quantity };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not place order.');

    showNotification(`Order placed successfully! Order ID: ${data.order.id}`, 'success');
    resetOrderForm();
    await fetchOrders();

    // Scroll to orders section so user can see their placed order
    document.getElementById('orders-section').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// 4. Reset Order Form
function resetOrderForm() {
  orderForm.reset();
  orderQuantityInput.value = 1;
  updateOrderCalculation();
}

// 5. Fetch Orders from API
async function fetchOrders() {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to load orders.');
    customerOrders = await res.json();
    renderOrdersTable();
    updateOrderStats();
  } catch (error) {
    console.error('Error fetching orders:', error);
    ordersTbody.innerHTML = `<tr><td colspan="7" class="empty-state">Unable to load orders: ${error.message}</td></tr>`;
  }
}

// 6. Render Orders Table
function renderOrdersTable() {
  if (!customerOrders || customerOrders.length === 0) {
    ordersTbody.innerHTML = '<tr><td colspan="7" class="empty-state">No customer orders placed yet.</td></tr>';
    return;
  }

  ordersTbody.innerHTML = customerOrders.map((order) => `
    <tr>
      <td class="order-id">${escapeHtml(order.id)}</td>
      <td><strong>${escapeHtml(order.customerName)}</strong></td>
      <td>${escapeHtml(order.dishName)}</td>
      <td>${order.quantity}</td>
      <td><strong>₹ ${order.totalPrice.toFixed(2)}</strong></td>
      <td>
        <select 
          class="status-select status-${order.status}" 
          onchange="changeOrderStatus('${order.id}', this.value)"
        >
          <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
          <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-sm-delete" onclick="deleteOrder('${order.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// 7. Update Status of Order
async function changeOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status.');

    showNotification(data.message, 'success');
    await fetchOrders();
  } catch (error) {
    showNotification(error.message, 'error');
    await fetchOrders(); // Re-render to revert invalid selection
  }
}

// 8. Delete Customer Order
async function deleteOrder(orderId) {
  const confirmed = confirm(`Are you sure you want to delete order "${orderId}"?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete order.');

    showNotification(data.message, 'success');
    await fetchOrders();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// 9. Update Summary Counters
function updateOrderStats() {
  const total = customerOrders.length;
  const pending = customerOrders.filter((o) => o.status === 'Pending').length;
  const preparing = customerOrders.filter((o) => o.status === 'Preparing').length;
  const delivered = customerOrders.filter((o) => o.status === 'Delivered').length;
  const cancelled = customerOrders.filter((o) => o.status === 'Cancelled').length;

  statTotalCount.textContent = total;
  statPendingCount.textContent = pending;
  statPreparingCount.textContent = preparing;
  statDeliveredCount.textContent = delivered;
  statCancelledCount.textContent = cancelled;
}

// Utility: Prevent XSS when rendering user strings
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
