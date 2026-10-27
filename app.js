/**
 * Food Corner – Online Food Ordering System
 * Backend Server: Node.js & Express.js
 * Suitable for College MCA Web Technology Project & AWS Elastic Beanstalk
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// AWS Elastic Beanstalk sets the PORT environment variable (defaults to 8080)
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// Paths to JSON demonstration data files
const MENU_FILE = path.join(__dirname, 'menu.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Middleware to parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (HTML, CSS, Client JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// DATA HELPER FUNCTIONS (JSON File Handling)
// ==========================================

// Read food menu from JSON file
function readMenuData() {
  try {
    if (!fs.existsSync(MENU_FILE)) {
      return [];
    }
    const rawData = fs.readFileSync(MENU_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading menu.json:', error.message);
    return [];
  }
}

// Save food menu to JSON file
function saveMenuData(data) {
  try {
    fs.writeFileSync(MENU_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing menu.json:', error.message);
    return false;
  }
}

// Read orders from JSON file
function readOrdersData() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      return [];
    }
    const rawData = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading orders.json:', error.message);
    return [];
  }
}

// Save orders to JSON file
function saveOrdersData(data) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing orders.json:', error.message);
    return false;
  }
}

// ==========================================
// HEALTH CHECK ENDPOINT (Useful for AWS ALB)
// ==========================================
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// ==========================================
// FOOD MENU API (CRUD Operations)
// ==========================================

// 1. GET all menu items
app.get('/api/menu', (req, res) => {
  const menu = readMenuData();
  res.status(200).json(menu);
});

// 2. GET single menu item by ID
app.get('/api/menu/:id', (req, res) => {
  const menu = readMenuData();
  const id = parseInt(req.params.id, 10);
  const item = menu.find((dish) => dish.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  res.status(200).json(item);
});

// 3. POST - Add new food item
app.post('/api/menu', (req, res) => {
  const { name, category, price } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Dish name is required and cannot be empty.' });
  }
  if (!category || typeof category !== 'string' || category.trim() === '') {
    return res.status(400).json({ error: 'Category is required and cannot be empty.' });
  }
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ error: 'Valid positive price is required.' });
  }

  const menu = readMenuData();

  // Generate new unique ID
  const newId = menu.length > 0 ? Math.max(...menu.map((d) => d.id)) + 1 : 1;

  const newDish = {
    id: newId,
    name: name.trim(),
    category: category.trim(),
    price: Math.round(numericPrice * 100) / 100
  };

  menu.push(newDish);
  saveMenuData(menu);

  res.status(201).json({
    message: 'Food item added successfully.',
    item: newDish
  });
});

// 4. PUT - Update an existing food item
app.put('/api/menu/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, category, price } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Dish name is required.' });
  }
  if (!category || typeof category !== 'string' || category.trim() === '') {
    return res.status(400).json({ error: 'Category is required.' });
  }
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ error: 'Valid positive price is required.' });
  }

  const menu = readMenuData();
  const index = menu.findIndex((dish) => dish.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  menu[index] = {
    id: id,
    name: name.trim(),
    category: category.trim(),
    price: Math.round(numericPrice * 100) / 100
  };

  saveMenuData(menu);

  res.status(200).json({
    message: 'Food item updated successfully.',
    item: menu[index]
  });
});

// 5. DELETE - Remove a food item
app.delete('/api/menu/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const menu = readMenuData();
  const index = menu.findIndex((dish) => dish.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  const deletedDish = menu.splice(index, 1)[0];
  saveMenuData(menu);

  res.status(200).json({
    message: `Food item "${deletedDish.name}" deleted successfully.`,
    item: deletedDish
  });
});

// ==========================================
// CUSTOMER ORDERS API (CRUD Operations)
// ==========================================

// 1. GET all orders
app.get('/api/orders', (req, res) => {
  const orders = readOrdersData();
  res.status(200).json(orders);
});

// 2. POST - Create a new customer order
app.post('/api/orders', (req, res) => {
  const { customerName, dishId, quantity } = req.body;

  // Validation
  if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  const numDishId = parseInt(dishId, 10);
  const menu = readMenuData();
  const selectedDish = menu.find((dish) => dish.id === numDishId);

  if (!selectedDish) {
    return res.status(400).json({ error: 'Selected food item does not exist.' });
  }

  const numQuantity = parseInt(quantity, 10);
  if (isNaN(numQuantity) || numQuantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be at least 1.' });
  }

  const totalPrice = Math.round(selectedDish.price * numQuantity * 100) / 100;
  const orders = readOrdersData();

  // Create formatted order ID (e.g. ORD-1003)
  const orderNumber = 1000 + orders.length + 1;
  const newOrder = {
    id: `ORD-${orderNumber}`,
    customerName: customerName.trim(),
    dishId: selectedDish.id,
    dishName: selectedDish.name,
    quantity: numQuantity,
    totalPrice: totalPrice,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  saveOrdersData(orders);

  res.status(201).json({
    message: 'Order placed successfully.',
    order: newOrder
  });
});

// 3. PATCH - Update order status (Pending, Preparing, Delivered, Cancelled)
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Preparing', 'Delivered', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
    });
  }

  const orders = readOrdersData();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveOrdersData(orders);

  res.status(200).json({
    message: `Order status updated to "${status}".`,
    order: order
  });
});

// 4. DELETE - Delete an order
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const orders = readOrdersData();
  const index = orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const deletedOrder = orders.splice(index, 1)[0];
  saveOrdersData(orders);

  res.status(200).json({
    message: `Order "${deletedOrder.id}" deleted successfully.`,
    order: deletedOrder
  });
});

// Root route fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express server with port conflict fallback
const server = app.listen(PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(`Food Corner Server is running!`);
  console.log(`Listening on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

server.on('error', (err) => {
  if ((err.code === 'EACCES' || err.code === 'EADDRINUSE') && PORT === 8080) {
    const fallbackPort = 3000;
    console.warn(`Port 8080 is currently occupied or restricted.`);
    console.warn(`Attempting fallback port: ${fallbackPort}...`);
    app.listen(fallbackPort, HOST, () => {
      console.log(`===============================================`);
      console.log(`Food Corner Server is running on fallback port!`);
      console.log(`Listening on http://${HOST}:${fallbackPort}`);
      console.log(`===============================================`);
    });
  } else {
    console.error('Server error:', err);
  }
});
