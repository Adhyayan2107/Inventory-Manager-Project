const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route to check if server is working
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// API Routes
app.use('/api/auth', require('./routes/auth.route.js'));
app.use('/api/products', require('./routes/product.route.js'));
app.use('/api/categories', require('./routes/category.route.js'));
app.use('/api/suppliers', require('./routes/supplier.route.js'));
app.use('/api/orders', require('./routes/order.route.js'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message });
});

// MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  }
  catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, async() => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});