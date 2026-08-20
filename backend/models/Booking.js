const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date, required: [true, 'End date is required'] },
  totalDays: { type: Number, required: true, min: [1, 'Minimum booking is 1 day'] },
  totalPrice: { type: Number, required: true, min: [0, 'Total price cannot be negative'] },
  status: { 
    type: String, 
    enum: ['Menunggu Konfirmasi', 'Aktif', 'Selesai', 'Dibatalkan', 'Ditolak', 'Terlambat', 'Pending Payment', 'Payment Failed', 'Expired'], 
    default: 'Pending Payment' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending_payment', 'paid', 'failed', 'expired'], 
    default: 'pending_payment' 
  },
  paymentMethod: { type: String },
  transactionId: { type: String },
  paidAt: { type: Date },
  returnDate: { type: Date },
  lateFee: { type: Number, default: 0, min: [0, 'Late fee cannot be negative'] },
  validationNotes: { type: String },
  rejectionReason: { type: String },
  validatedAt: { type: Date },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Adding items detail for scalability (as requested for order_items)
  items: [{
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    name: String,
    pricePerDay: Number,
    total: Number
  }]
}, { timestamps: true });

// Indexing — orderId sudah unique:true di field (otomatis indexed), jadi tidak perlu index lagi
bookingSchema.index({ user: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ createdAt: 1 });

// Prevent overlapping bookings exceeding the car stock
bookingSchema.pre('save', async function () {
  if (this.isNew) {
    const CarModel = mongoose.model('Car');
    const car = await CarModel.findById(this.car);
    const totalStock = car ? (car.stock !== undefined ? car.stock : 1) : 1;

    const overlappingCount = await this.constructor.countDocuments({
      car: this.car,
      status: { $in: ['Aktif', 'Pending Payment', 'Menunggu Konfirmasi'] },
      $or: [
        { startDate: { $lte: this.endDate }, endDate: { $gte: this.startDate } }
      ]
    });

    if (overlappingCount >= totalStock && totalStock > 0) {
      const err = new Error(`Stok mobil ini (${totalStock} unit) sudah penuh terpesan untuk rentang tanggal tersebut.`);
      err.name = 'ValidationError';
      throw err;
    }
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
