const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// --- UPDATED STATIC FILE SERVING FOR PKG ---
// This ensures that the React frontend is served whether running in production or compiled via PKG
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

// Handle React routing (must be placed below your API routes!)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});
// ------------------------------------------

// Global error handler middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});