const express = require('express');
const midtransClient = require('midtrans-client');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const { callbackLimiter } = require('../middleware/rateLimiter');

// Create Transaction Token (for checkout)
router.post('/create-transaction', auth, asyncHandler(async (req, res) => {
    const { bookingData } = req.body;

    if (!bookingData || !bookingData.orderId) {
        return res.status(400).json({ error: 'Order ID tidak ditemukan.' });
    }

    const booking = await Booking.findOne({ orderId: bookingData.orderId });
    if (!booking) return res.status(404).json({ error: 'Booking tidak ditemukan.' });

    const isDemo = !process.env.MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY.includes('YOUR_KEY');
    
    if (isDemo) {
        return res.json({ 
            token: 'MOCK_TOKEN_DEMO_BAHRAYYAN',
            isDemo: true,
            orderId: booking.orderId
        });
    }

    const parameter = {
        transaction_details: {
            order_id: booking.orderId,
            gross_amount: booking.totalPrice
        },
        credit_card: { secure: true },
        customer_details: {
            first_name: req.user.name || 'Customer',
            email: req.user.email || 'customer@example.com',
        },
        item_details: [
            ...booking.items.map(item => ({
                id: item.carId.toString(),
                price: item.pricePerDay,
                quantity: booking.totalDays,
                name: item.name
            })),
            { id: 'INSURANCE', price: 150000, quantity: 1, name: 'Premium Protection' }
        ]
    };

    const transaction = await snap.createTransaction(parameter);
    res.json({ 
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        orderId: booking.orderId,
        clientKey: process.env.MIDTRANS_CLIENT_KEY
    });
}));

// Midtrans Notification Handler (Webhook)
router.post('/notification', callbackLimiter, asyncHandler(async (req, res) => {
    const statusResponse = await snap.transaction.notification(req.body);
    const { order_id, transaction_status, payment_type, transaction_id, settlement_time } = statusResponse;

    const booking = await Booking.findOne({ orderId: order_id });
    if (!booking) return res.status(404).send('Booking not found');

    let updatedStatus = 'Pending Payment';
    let updatedPaymentStatus = 'pending_payment';

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
        updatedStatus = 'Menunggu Konfirmasi';
        updatedPaymentStatus = 'paid';
        
        const car = await Car.findById(booking.car);
        if (car && car.stock <= 0 && car.status !== 'Perawatan') {
            car.status = 'Disewa';
            await car.save();
        }
        
        await User.findByIdAndUpdate(booking.user, { $inc: { points: 250 } });
        
        // Point deduction logic check
        if (booking.totalPrice < (booking.totalDays * booking.items[0].pricePerDay + 150000)) {
            await User.findByIdAndUpdate(booking.user, { $inc: { points: -1000 } });
        }
        booking.paidAt = settlement_time || new Date();
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
        updatedStatus = transaction_status === 'expire' ? 'Expired' : 'Payment Failed';
        updatedPaymentStatus = transaction_status === 'expire' ? 'expired' : 'failed';
        
        const car = await Car.findById(booking.car);
        if (car) {
            car.stock = (car.stock || 0) + 1;
            if (car.status !== 'Perawatan') {
                car.status = 'Tersedia';
            }
            await car.save();
        }
    }

    booking.status = updatedStatus;
    booking.paymentStatus = updatedPaymentStatus;
    booking.paymentMethod = payment_type;
    booking.transactionId = transaction_id;

    await booking.save();
    res.status(200).send('OK');
}));

// Polling status
router.get('/status/:orderId', auth, asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({ orderId: req.params.orderId, user: req.user.id });
    if (!booking) return res.status(404).json({ error: 'Order tidak ditemukan.' });

    res.json({
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        orderId: booking.orderId
    });
}));

// Demo Confirm
router.post('/demo-confirm', auth, asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const isDemo = !process.env.MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY.includes('YOUR_KEY');
    
    if (!isDemo) return res.status(403).json({ error: 'Hanya tersedia di mode demo.' });

    const booking = await Booking.findOne({ orderId, user: req.user.id });
    if (!booking) return res.status(404).json({ error: 'Booking tidak ditemukan.' });

    booking.status = 'Menunggu Konfirmasi';
    booking.paymentStatus = 'paid';
    booking.paidAt = new Date();
    booking.paymentMethod = 'Demo Payment';
    
    const car = await Car.findById(booking.car);
    if (car && car.stock <= 0 && car.status !== 'Perawatan') {
        car.status = 'Disewa';
        await car.save();
    }
    
    await User.findByIdAndUpdate(booking.user, { $inc: { points: 250 } });

    await booking.save();
    res.json({ message: 'Pembayaran berhasil dikonfirmasi. Menunggu validasi admin.' });
}));

module.exports = router;
