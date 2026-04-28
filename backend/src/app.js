require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { port } = require('./config/env');

const app = express();
app.use(cors());
app.use(express.json());

// Serve React frontend static files
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// All other routes → React app
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server চলছে: http://localhost:${port}`);
});

module.exports = app;
