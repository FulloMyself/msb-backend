// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/documents');
const loansRoutes = require('./routes/loans');
const adminRoutes = require('./routes/admin');
const usersRouter = require('./routes/users');
const roleRoutes = require('./routes/roleRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRouter);
app.use('/api/roles', roleRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/msbfinance';

// MongoDB connection
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
