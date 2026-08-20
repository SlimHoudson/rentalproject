require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxedrive');
    console.log('MongoDB Connected for Seeding...');

    // Hapus data user lama (opsional, agar tidak duplikat saat dijalankan berkali-kali)
    await User.deleteMany({});
    console.log('Cleared existing users...');

    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedUserPassword = await bcrypt.hash('user123', salt);

    const users = [
      {
        name: 'Admin Bahrayyan',
        email: 'admin@bahrayyan.com',
        password: hashedAdminPassword,
        role: 'admin'
      },
      {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        password: hashedUserPassword,
        role: 'user'
      }
    ];

    await User.insertMany(users);
    console.log('Database User berhasil dibuat dan diisi!');
    console.log('\nAkun yang bisa digunakan:');
    console.log('1. Email: admin@bahrayyan.com | Password: admin123 (Admin)');
    console.log('2. Email: alex@example.com    | Password: user123 (User)');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedUsers();
