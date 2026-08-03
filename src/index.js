import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import flashSaleRoutes from './routes/flashSaleRoutes.js';
import merchandisingRoutes from './routes/merchandisingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import seoRoutes from './routes/seoRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';
import emailVerificationRoutes from './routes/emailVerificationRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// 🛡️ MANUAL CORS SAFETY MIDDLEWARE (Runs BEFORE everything else)
// ============================================================
app.use((req, res, next) => {
  // Explicitly set the allowed origin
  const origin = req.headers.origin;
  const allowed = [
    'http://snow-kangaroo-426484.hostingersite.com',
    'https://snow-kangaroo-426484.hostingersite.com',
    'https://luxivotrend.com', // Fixed: Removed the extra slash
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  if (allowed.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*'); // Fallback
  }

  // Forcefully set the rest of the CORS headers
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Immediately respond to OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
// ============================================================

// CORS – Using the standard package as a secondary layer
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:5173', 'http://localhost:3000',
      'http://snow-kangaroo-426484.hostingersite.com', 'https://snow-kangaroo-426484.hostingersite.com',
      'https://luxivotrend.com'
    ];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/merchandising', merchandisingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/auth/verify', emailVerificationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api', contactRoutes);

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== ROOT ROUTE (welcome) ==========
app.get('/', (req, res) => {
  res.json({
    message: 'Ecommerce API is running',
    status: 'ok',
    endpoints: {
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});