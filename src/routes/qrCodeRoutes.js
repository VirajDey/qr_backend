import express from 'express';
import QRCode from '../models/QRCode.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all QR codes for a user
router.get('/user', async (req, res) => {
  try {
    const qrCodes = await QRCode.find({ userId: req.auth.userId });
    res.json(qrCodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new QR code
router.post('/', async (req, res) => {
  try {
    const qrCode = new QRCode({
      ...req.body,
      userId: req.auth.userId
    });
    const savedQRCode = await qrCode.save();
    res.status(201).json(savedQRCode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a QR code
router.put('/:id', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    
    Object.assign(qrCode, req.body);
    const updatedQRCode = await qrCode.save();
    res.json(updatedQRCode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a QR code
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid QR code ID' });
    }

    const qrCode = await QRCode.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.auth.userId 
    });
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    
    res.json({ message: 'QR code deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this route to your existing routes
// Update the landing route to be public
router.get('/landing/:shortId', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ shortId: req.params.shortId });
    
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Increment scan count
    qrCode.scans += 1;
    await qrCode.save();

    res.json({
      name: qrCode.name,
      links: qrCode.links
    });
  } catch (error) {
    console.error('Error fetching QR data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;