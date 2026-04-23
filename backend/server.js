const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const net = require('net');
require('dotenv').config();

const trainRoutes = require('./routes/trainRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/trains', trainRoutes);
app.use('/api', bookingRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'TrainBook API is running!', status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ─── Port conflict checker ─────────────────────────────────────────────────────
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(true);
      else resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

// ─── Find next available port ──────────────────────────────────────────────────
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    console.warn(`⚠️  Port ${port} is already in use. Trying port ${port + 1}...`);
    port++;
  }
  return port;
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const PREFERRED_PORT = Number(process.env.PORT) || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully');

    // Auto-seed trains if none exist
    const Train = require('./models/Train');
    const count = await Train.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial train data...');
      const seedTrains = require('./seed');
      await seedTrains();
    }

    // Find an available port (auto-resolves conflicts)
    const PORT = await findAvailablePort(PREFERRED_PORT);

    if (PORT !== PREFERRED_PORT) {
      console.log(`ℹ️  Started on port ${PORT} instead of ${PREFERRED_PORT}.`);
      console.log(`   → Update your frontend API URL to http://localhost:${PORT}/api`);
      console.log(`   → Or close the process on port ${PREFERRED_PORT} and restart.`);
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server gracefully...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('✅ Server and DB connection closed.');
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
