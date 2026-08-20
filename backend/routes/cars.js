const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { auth, adminAuth } = require('../middleware/auth');
const Car = require('../models/Car');
const router = express.Router();

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Query parser helper untuk pagination
const parsePaginationQuery = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const carValidation = [
  body('name').trim().notEmpty().withMessage('Car name is required'),
  body('pricePerDay').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('status').optional().isIn(['Tersedia', 'Disewa', 'Perawatan']).withMessage('Invalid status'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or greater'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year')
];

// Get all cars with pagination & filters
router.get('/', asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, year, transmission, fuel, search, sort } = req.query;
  const { page, limit, skip } = parsePaginationQuery(req);

  const filter = {};
  if (category) filter.category = category;
  if (minPrice) filter.pricePerDay = { $gte: Number(minPrice) };
  if (maxPrice) {
    filter.pricePerDay = filter.pricePerDay || {};
    filter.pricePerDay.$lte = Number(maxPrice);
  }
  if (year) filter.year = year;
  if (transmission) filter.transmission = transmission;
  if (fuel) filter.fuel = fuel;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  let sortOption = {};
  if (sort === 'price-asc') sortOption = { pricePerDay: 1 };
  else if (sort === 'price-desc') sortOption = { pricePerDay: -1 };
  else if (sort === 'rating') sortOption = { rating: -1 };
  else sortOption = { createdAt: -1 };

  const [cars, total] = await Promise.all([
    Car.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Car.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    data: cars,
    meta: { page, limit, total, totalPages, hasMore },
  });
}));

// Get single car
router.get('/:id', asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  res.json(car);
}));

// Create car (Admin only)
router.post('/', auth, adminAuth, carValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const car = new Car(req.body);
  await car.save();
  res.status(201).json(car);
}));

// Update car (Admin only)
router.put('/:id', auth, adminAuth, carValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!car) return res.status(404).json({ error: 'Car not found' });
  res.json(car);
}));

// Delete car (Admin only)
router.delete('/:id', auth, adminAuth, asyncHandler(async (req, res) => {
  const car = await Car.findByIdAndDelete(req.params.id);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  res.json({ message: 'Car deleted' });
}));

module.exports = router;
