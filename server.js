import express from 'express';
import cors from 'cors';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import qrCodeRoutes from './src/routes/qrCodeRoutes.js';
import QRCode from './src/models/QRCode.js';

dotenv.config();

const app = express();

// Configure CORS with specific options
// Update CORS configuration to handle multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://qr-frontend-neon.vercel.app',
  'https://qr-backend-hsd9.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked origin:', origin); // Add logging for debugging
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Add this route for handling QR code scans
app.get('/qr/:shortId', async (req, res) => {
  try {
    console.log('Searching for shortId:', req.params.shortId);
    const qrCode = await QRCode.findOne({ shortId: req.params.shortId });
    
    if (!qrCode) {
      console.log('QR code not found');
      return res.status(404).send('QR code not found');
    }

    // Increment scan count
    qrCode.scans += 1;
    await qrCode.save();

    // Use the frontend URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'https://qr-frontend-neon.vercel.app';
    res.redirect(`${frontendUrl}/landing/${req.params.shortId}`);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

// Keep the API endpoint for the landing page to fetch data
app.get('/api/qrcodes/landing/:shortId', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ shortId: req.params.shortId });
    
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json({
      name: qrCode.name,
      links: qrCode.links
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize server after DB connection
const initializeServer = async () => {
  try {
    await connectDB();

    // Public routes (before authentication middleware)
    app.use('/api/qrcodes/landing', qrCodeRoutes);

    // Protected API routes
    app.use('/api/qrcodes', ClerkExpressRequireAuth(), qrCodeRoutes);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer();