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

  if (car.status === 'Perawatan') {
    return res.status(400).json({ error: 'Mobil sedang dalam masa perawatan dan tidak dapat disewa.' });
  }

  const currentStock = car.stock !== undefined ? car.stock : 1;
  if (currentStock <= 0 || car.status === 'Disewa') {
    return res.status(400).json({ error: 'Stok unit mobil ini sedang habis disewa.' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Format tanggal tidak valid.' });
  }

  const overlappingCount = await Booking.countDocuments({
    car: carId,
    status: { $in: ['Aktif', 'Pending Payment', 'Menunggu Konfirmasi'] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  });

  if (overlappingCount >= currentStock) {
    return res.status(400).json({ error: `Semua unit mobil (${currentStock} unit) sudah dipesan untuk rentang tanggal tersebut.` });
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

  // Decrement car stock by 1 directly in database
  const newStock = Math.max(0, currentStock - 1);
  const newStatus = newStock === 0 ? 'Disewa' : (car.status === 'Perawatan' ? 'Perawatan' : 'Tersedia');
  await Car.findByIdAndUpdate(carId, { stock: newStock, status: newStatus });

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

  if (booking.status === 'Dibatalkan' || booking.status === 'Ditolak') {
    return res.status(400).json({ error: 'Pesanan ini sudah dibatalkan sebelumnya.' });
  }

  booking.status = 'Dibatalkan';
  booking.paymentStatus = 'failed';
  await booking.save();

  // Restore stock (+1)
  const car = await Car.findById(booking.car);
  if (car) {
    const updatedStock = (car.stock || 0) + 1;
    const newStatus = car.status === 'Perawatan' ? 'Perawatan' : 'Tersedia';
    await Car.findByIdAndUpdate(car._id, { stock: updatedStock, status: newStatus });
  }

  res.json({ message: 'Pesanan berhasil dibatalkan.', booking });
});

// Admin Permanent Delete Booking
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }

  // Restore stock if the deleted booking was holding a unit
  if (booking.car && booking.status !== 'Dibatalkan' && booking.status !== 'Ditolak' && booking.status !== 'Selesai') {
    const car = await Car.findById(booking.car);
    if (car) {
      const updatedStock = (car.stock || 0) + 1;
      const newStatus = car.status === 'Perawatan' ? 'Perawatan' : 'Tersedia';
      await Car.findByIdAndUpdate(car._id, { stock: updatedStock, status: newStatus });
    }
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
    
    // Check if stock is exhausted
    if (booking.car) {
      const car = await Car.findById(booking.car._id || booking.car);
      if (car && car.stock <= 0 && car.status !== 'Perawatan') {
        await Car.findByIdAndUpdate(car._id, { status: 'Disewa' });
      }
    }
    
    await booking.save();
    return res.json({ message: 'Pesanan berhasil disetujui & divalidasi.', booking });
  } else if (action === 'reject') {
    booking.status = 'Ditolak';
    booking.rejectionReason = notes || 'Pesanan tidak memenuhi syarat atau jadwal armada tidak sesuai.';
    booking.validatedAt = new Date();
    booking.validatedBy = req.user.id;
    
    // Release stock (+1)
    if (booking.car) {
      const car = await Car.findById(booking.car._id || booking.car);
      if (car) {
        const updatedStock = (car.stock || 0) + 1;
        const newStatus = car.status === 'Perawatan' ? 'Perawatan' : 'Tersedia';
        await Car.findByIdAndUpdate(car._id, { stock: updatedStock, status: newStatus });
      }
    }
    
    await booking.save();
    return res.json({ message: 'Pesanan telah ditolak.', booking });
  } else {
    return res.status(400).json({ error: 'Aksi validasi tidak valid (harus approve atau reject).' });
  }
});
