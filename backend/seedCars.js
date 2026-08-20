const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Car = require('./models/Car');

dotenv.config();

const cars = [
    {
        name: 'Mercedes-Benz S-Class',
        brand: 'Mercedes-Benz',
        category: 'Luxury Sedan',
        year: 2023,
        seats: 5,
        transmission: 'Automatic',
        fuel: 'Bensin',
        pricePerDay: 4500000,
        stock: 5,
        status: 'Tersedia',
        rating: 4.9,
        reviews: 128,
        features: ['GPS Navigation', 'Sunroof', 'Heated Seats', 'Premium Sound'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi3Iaq_UO-e3-gKS8esn7pwn_JoQkEatIMkWRXUIMYU2gGu2vh-q78DR6kzM4E4GTCVTB-gsV9rpWtUlK2Two0y3giQlzdv-hHIOcZ_9Isxr8KaF9J7ungwnQMp_etyc3EEx45tMSMuGjooNAvySNROUNzEtr4g1ZLR9utx_HGcHmxFYKgZ7ds0_VEJSVZZnYiYeTR-gneN64Kmvfy-9lfF4tdQ18QqsoVMvd9ICft9A-nL99es-nzv-3Gd8Yml4p2jvibxd6Pmus',
    },
    {
        name: 'BMW M4 Competition',
        brand: 'BMW',
        category: 'Sports Car',
        year: 2023,
        seats: 4,
        transmission: 'Automatic',
        fuel: 'Bensin',
        pricePerDay: 3800000,
        stock: 3,
        status: 'Tersedia',
        rating: 4.8,
        reviews: 94,
        features: ['Sport Mode', 'Carbon Fiber', 'Harman Kardon', 'M Driver Package'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFusABtQiH-0TlJYSNqoTqKTtOmxMRShOv7uDVX3NF0KHfbc7dqFFgDNd0mDiuXAcjmrMy5IXetLgxMmA6vFi74tmsHQbv2hQlHEmbcoI_P9GxXy9cuAym-RHCHDD0BfpiHIxR1DJZ6qbNDfZtyqDKiwArSC6EKnCCZwRdM5LFcK0NXDeLXWDdujSjZiKS99_MHQiDIrTXO0KgUTS4quYHnYND0FXWQbHbxye2iClKnoiIvzyLxMEpjplDXmxHjBk4iLJwvvFT1k0',
    },
    {
        name: 'Porsche 911 Carrera',
        brand: 'Porsche',
        category: 'Sports Car',
        year: 2023,
        seats: 4,
        transmission: 'Automatic',
        fuel: 'Bensin',
        pricePerDay: 8500000,
        stock: 2,
        status: 'Tersedia',
        rating: 5.0,
        reviews: 67,
        features: ['Sport Chrono', 'PDCC', 'Bose Sound', 'Launch Control'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGnIDDspyfDikAsFUswxXYRuZakzMdEJXHIe2qg0E8AJ1-36_4MqyMjfLjHES8WKivT7iNZpUFC6O8uOp1Uqm-GhNT3PWkE4v9yjWQxSBu2SXXnk2EbDp4tu_s1yG3iUA9vkd0KmazebO5PFMELiaA-zC0h60wjQ1xwSjxLWK9JF0gSE1XHHEmG92mmJCEehYLgJ5FGXRy1Hv2_YLeuHjZS8-8OXOt7LlUYHLgx8MrLJoFsYByUXLzx43XkMUYUsbMsqvkl1s3qbM',
    },
    {
        name: 'Range Rover Autobiography',
        brand: 'Land Rover',
        category: 'SUV Premium',
        year: 2023,
        seats: 7,
        transmission: 'Automatic',
        fuel: 'Diesel',
        pricePerDay: 5200000,
        stock: 4,
        status: 'Tersedia',
        rating: 4.7,
        reviews: 83,
        features: ['Air Suspension', 'Meridian Sound', 'Panoramic Roof', '4x4'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNIn7YGIReRoxRd33bKSTi1ALUXg29bdxKiCRs1DT48A-iWDYZ0ceLJreJ_YyZRchtedQ46FObOXSnY7guUswvFlCtdMP0tFZp5_T5bHa2F_zJwziyojnl6uSmaz9eqEjdbMZXl2iok_f0wvfeD2Daoz8Mxxc-Y2mVniITLZONb4Ti84qck_sVhjEstXeebBNYWjxOubUstfmctRH7pEXkEfIKyvmJFtn9tEOks-xxZSQm580UFOOnYpvz_vcPh9CY83cFoYMS6iY',
    },
    {
        name: 'Lamborghini Urus',
        brand: 'Lamborghini',
        category: 'SUV Premium',
        year: 2023,
        seats: 5,
        transmission: 'Automatic',
        fuel: 'Bensin',
        pricePerDay: 12000000,
        stock: 1,
        status: 'Tersedia',
        rating: 4.9,
        reviews: 42,
        features: ['640 HP', 'Anima Selector', 'Carbon Ceramic Brakes', 'Night Vision'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6yJRg61n0GwZxqZQvTAdbIX6IUepq2JeYPxwyIx5fSglcicliuh4sMa9xFYs-akn48Cxbi1MLJlMKbqqPzey86xT3RAmPJjquhJ_q7CeVgQb2EQSmmErs34ESBofFbwMeNeeCmN8e27Ef9JaqzLCUNtqoE9gE9tLTQjPBk_wiDOZhN-rHjbE3HEHWPht4CsBOoJoGfxsAkwzMMkHIgxnMnfq5KOwgKedDgJcTk2Mw3hJh-awnob2wOPMmJbL3_DCRbDJNJU_9jrQ',
    },
    {
        name: 'Audi A8 L',
        brand: 'Audi',
        category: 'Luxury Sedan',
        year: 2022,
        seats: 5,
        transmission: 'Automatic',
        fuel: 'Bensin',
        pricePerDay: 3200000,
        stock: 6,
        status: 'Tersedia',
        rating: 4.6,
        reviews: 110,
        features: ['Quattro AWD', 'Bang & Olufsen', 'Massage Seats', 'Adaptive Cruise'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBD6nf9QC-xui2n3ZAPHYN2FNU8SCh-LqdJ7EzVQNjQmt_Vcj9ZucJXY7fPmrGP1VqCLMVKhUr7TD2-xTEflRsK7IkAtYTu7qKciDhxjKf2PmJZ0Oou0jTKrRw0ztMkGz0EqDYr0bd2XZOmlEUgZRV5AhkLLZVHETNpC3L-PmIUSvTB65xCEMZCrraIoaHqECYMbFPk3Jcj2l0LayDKFBQx26j-gyBB2TyasxzIiFxhKptZcTJp-GLyUvPWQm9uEhDIwM0Ot0g_rYw',
    },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        await Car.deleteMany({});
        console.log('Cleared existing cars');
        
        await Car.insertMany(cars);
        console.log('Seeded initial cars');
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
