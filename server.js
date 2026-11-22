require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { connectDB, getDbStatus } = require('./config/db');
const { seedDatabase } = require('./seed');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow dev frontend origin
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection & seeding
connectDB().then((connected) => {
  if (connected) {
    seedDatabase();
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Database status & Health check route
app.get('/api/status', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ok',
    server: 'Campus Lost & Found API (Node/Express/MongoDB)',
    database: dbStatus
  });
});

// Backward-compatible API aliases for legacy frontend routes
app.use('/api/login', (req, res, next) => {
  req.url = '/login';
  authRoutes(req, res, next);
});
app.use('/api/logout', (req, res, next) => {
  req.url = '/logout';
  authRoutes(req, res, next);
});
app.use('/api/me', (req, res, next) => {
  req.url = '/me';
  authRoutes(req, res, next);
});

// Serve frontend:
// If Vite React build exists in client/dist, serve it. Otherwise serve public/
const clientDist = path.join(__dirname, 'client', 'dist');
const legacyPublic = path.join(__dirname, 'public');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Express 5 compatible catch-all for SPA client routing
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use(express.static(legacyPublic));
}

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Campus Lost & Found Backend Server`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_lost_found'}`);
  console.log(`👤 Demo Student: student1 / student123`);
  console.log(`👑 Demo Admin:   admin / admin123`);
  console.log(`======================================================\n`);
});
