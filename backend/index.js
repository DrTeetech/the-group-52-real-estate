const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const viewingRoutes = require('./routes/viewingRoutes');
const rentalApplicationRoutes = require('./routes/rentalApplicationRoutes');
const leaseRoutes = require('./routes/leaseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();
app.disable('x-powered-by');
app.use(helmet());

const configuredOrigins = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== 'production' || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({
  limit: '1mb',
  verify(req, res, buffer) {
    if (req.originalUrl.startsWith('/api/payments/webhook/paystack')) req.rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
}));

app.get('/', (req, res) => res.status(200).json({ success: true, message: 'Welcome to the Real Estate Rental API' }));
app.get('/api/health', (req, res) => res.status(200).json({
  success: true,
  message: 'Real estate rental API is running',
  environment: process.env.NODE_ENV || 'development',
}));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api', favoriteRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/viewings', viewingRoutes);
app.use('/api/rental-applications', rentalApplicationRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.message === 'Origin is not allowed by CORS') return res.status(403).json({ success: false, message: 'Origin is not allowed' });
  if (error.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Request body is too large' });
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return res.status(400).json({ success: false, message: 'Malformed JSON request body' });
  console.error('Unhandled request error:', error.message);
  return res.status(500).json({ success: false, message: 'An unexpected server error occurred' });
});

module.exports = app;
