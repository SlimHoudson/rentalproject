const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Car name is required'], trim: true },
  brand: { type: String, trim: true },
  category: { type: String, trim: true },
  year: { type: Number, min: [1900, 'Year must be 1900 or later'] },
  seats: { type: Number, default: 5 },
  transmission: { type: String, default: 'Automatic' },
  fuel: { type: String, default: 'Bensin' },
  pricePerDay: { type: Number, required: [true, 'Price per day is required'], min: [0, 'Price cannot be negative'] },
  stock: { type: Number, default: 1 },
  status: { type: String, enum: ['Tersedia', 'Disewa', 'Perawatan'], default: 'Tersedia' },
  imageUrl: { type: String, trim: true },
  rating: { type: Number, default: 5.0 },
  reviews: { type: Number, default: 0 },
  features: { type: [String], default: [] },
  notes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
