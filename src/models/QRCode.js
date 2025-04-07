import mongoose from 'mongoose';

const qrCodeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  shortId: {  // Add this field for the nanoid
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  originalUrl: {
    type: String,
    required: false, // Make it optional for multi-link QR codes
  },
  links: [{
    title: String,
    url: String
  }],
  qrCode: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['static', 'dynamic'],
    required: true,
  },
  scans: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('QRCode', qrCodeSchema);