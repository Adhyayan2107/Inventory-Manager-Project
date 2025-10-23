const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.route.js'));
app.use('/api/products', require('./routes/product.route.js'));
app.use('/api/categories', require('./routes/category.route.js'));
app.use('/api/suppliers', require('./routes/supplier.route.js'));
app.use('/api/orders', require('./routes/order.route.js'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));