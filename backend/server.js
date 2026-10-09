require('dotenv').config();
const app = require('./index');
const connectDB = require('./config/db');
const { expireEndedLeases } = require('./services/leaseLifecycle');

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 5000;
const startServer = async () => {
  try {
    await connectDB();
    await expireEndedLeases().catch((error) => console.error('Initial lease lifecycle check failed:', error.message));
    const lifecycleTimer = setInterval(() => {
      expireEndedLeases().catch((error) => console.error('Lease lifecycle check failed:', error.message));
    }, 60 * 60 * 1000);
    lifecycleTimer.unref();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    const shutdown = (signal) => {
      console.log(`${signal} received; shutting down gracefully`);
      clearInterval(lifecycleTimer);
      server.close(() => {
        const mongoose = require('mongoose');
        mongoose.connection.close(false).finally(() => process.exit(0));
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};
startServer();
