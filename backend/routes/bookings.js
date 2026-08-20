const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const bookingValidation = [
  body('carId').notEmpty().withMessage('Car ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('endDate').custom((value, { req }) => {
    if (new Date(value) < new Date(req.body.startDate)) {
      throw new Error('End date cannot be before start date');
    }
    return true;
  })
];

const { checkoutLimiter } = require('../middleware/rateLimiter');

const bookingController = require('../controllers/bookingController');

// Routes
router.post('/', auth, checkoutLimiter, ...bookingValidation, handleValidationErrors, bookingController.createBooking);
router.get('/my-bookings', auth, bookingController.getMyBookings);
router.get('/', auth, adminAuth, bookingController.getAllBookings);
router.post('/:id/cancel', auth, bookingController.cancelBooking);
router.delete('/:id', auth, adminAuth, bookingController.deleteBooking);
router.post('/:id/validate', auth, adminAuth, bookingController.validateBooking);
router.post('/:id/return', auth, adminAuth, async (req, res) => {
  try {
    const { lateFee } = req.body;
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.status = 'Selesai';
    booking.returnDate = new Date();
    booking.lateFee = lateFee || 0;
    await booking.save();

    const car = await Car.findById(booking.car._id || booking.car);
    if (car) {
      const updatedStock = (car.stock || 0) + 1;
      const newStatus = car.status === 'Perawatan' ? 'Perawatan' : 'Tersedia';
      await Car.findByIdAndUpdate(car._id, { stock: updatedStock, status: newStatus });
    }

    res.json({ message: 'Pengembalian mobil berhasil dicatat & stok armada dipulihkan.', booking });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
