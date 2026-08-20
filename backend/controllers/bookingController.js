const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');

exports.createBooking = asyncHandler(async (req, res, next) => {
  const { carId, startDate, endDate, usedPoints } = req.body;
  
  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({ error: 'Mobil tidak ditemukan.' });
  }

  if (car.status !== 'Tersedia') {
    return res.status(400).json({ error: 'Mobil tidak tersedia untuk disewa.' });
  }

  // Double check overlap in controller for better error handling
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Format tanggal tidak valid.' });
  }

  const existingBooking = await Booking.findOne({
    car: carId,
    status: { $in: ['Aktif', 'Pending Payment'] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  });

  if (existingBooking) {
    return res.status(400).json({ error: 'Mobil sudah dipesan untuk tanggal tersebut.' });
  }

  const orderId = `LX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (totalDays <= 0 || isNaN(totalDays)) totalDays = 1;

  let subtotal = totalDays * car.pricePerDay;
  const insurance = 150000;
  let discountAmount = 0;

  if (usedPoints && usedPoints >= 1000) {
    const userData = await User.findById(req.user.id);
    if (!userData || userData.points < usedPoints) {
      return res.status(400).json({ error: 'Poin Anda tidak mencukupi' });
    }
    discountAmount = subtotal * 0.10;
  }

  const totalPrice = subtotal - discountAmount + insurance;

  const booking = new Booking({
    orderId,
    user: req.user.id,
    car: carId,
    startDate: start,
    endDate: end,
    totalDays,
    totalPrice: isNaN(totalPrice) ? subtotal + insurance : totalPrice,
    status: 'Pending Payment',
    paymentStatus: 'pending_payment',
    items: [{
      carId: car._id,
      name: car.name,
      pricePerDay: car.pricePerDay,
      total: subtotal
    }]
  });

  await booking.save();
  res.status(201).json(booking);
});

exports.getMyBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id }).populate('car').sort({ createdAt: -1 });
  res.json(bookings);
});

exports.getAllBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find().populate('user').populate('car').sort({ createdAt: -1 });
  res.json(bookings);
});

exports.cancelBooking = asyncHandler(async (req, res, next) => {
  const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user.id };
  const booking = await Booking.findOne(query);
  if (!booking) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  booking.status = 'Dibatalkan';
  booking.paymentStatus = 'failed';
  await booking.save();

  const car = await Car.findById(booking.car);
  if (car) {
    car.status = 'Tersedia';
    await car.save();
  }

  res.json({ message: 'Pesanan berhasil dibatalkan.', booking });
});

// Admin Permanent Delete Booking
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }

  if (booking.car && (booking.status === 'Aktif' || booking.status === 'Menunggu Konfirmasi')) {
    await Car.findByIdAndUpdate(booking.car, { status: 'Tersedia' });
  }

  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: 'Data transaksi berhasil dihapus secara permanen.' });
});

// Admin Validation (Shopee Style: Approve / Reject with Notes)
exports.validateBooking = asyncHandler(async (req, res, next) => {
  const { action, notes } = req.body; // action: 'approve' | 'reject'
  const booking = await Booking.findById(req.params.id).populate('car').populate('user');
  
  if (!booking) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }

  if (action === 'approve') {
    booking.status = 'Aktif';
    booking.validatedAt = new Date();
    booking.validatedBy = req.user.id;
    booking.validationNotes = notes || 'Pesanan telah diverifikasi dan disetujui oleh admin.';
    
    // Set car status to Disewa
    if (booking.car) {
      await Car.findByIdAndUpdate(booking.car._id || booking.car, { status: 'Disewa' });
    }
    
    await booking.save();
    return res.json({ message: 'Pesanan berhasil disetujui & divalidasi.', booking });
  } else if (action === 'reject') {
    booking.status = 'Ditolak';
    booking.rejectionReason = notes || 'Pesanan tidak memenuhi syarat atau jadwal armada tidak sesuai.';
    booking.validatedAt = new Date();
    booking.validatedBy = req.user.id;
    
    // Release car back to Tersedia
    if (booking.car) {
      await Car.findByIdAndUpdate(booking.car._id || booking.car, { status: 'Tersedia' });
    }
    
    await booking.save();
    return res.json({ message: 'Pesanan telah ditolak.', booking });
  } else {
    return res.status(400).json({ error: 'Aksi validasi tidak valid (harus approve atau reject).' });
  }
});
