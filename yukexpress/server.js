const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY DATABASE (Bazaga ulanguncha saqlanadigan xotira)
// ============================================

let users = [];

let vehiclesDB = [
    {
        id: 'isuzu_5t',
        name: 'Isuzu 5 Tonna',
        capacity: '5 Tonna',
        img: 'https://i.postimg.cc/cJDdVcCZ/Isuzu-5-Tonna.png'
    },
    {
        id: 'isuzu_10t',
        name: 'Isuzu 10 Tonna',
        capacity: '10 Tonna',
        img: 'https://i.postimg.cc/Pqv6jXrm/Isuzu-5-Tonna-(1).png'
    },
    {
        id: 'tent_truck',
        name: 'Tent',
        capacity: '10-15 Tonna',
        img: 'https://i.postimg.cc/K82LzmNB/Isuzu-5-Tonna-(2).png'
    },
    {
        id: 'tent_fura_120',
        name: 'Tent Fura 120 kub',
        capacity: '20-24 Tonna',
        img: 'https://i.postimg.cc/K8Gzwjf5/Isuzu-5-Tonna-(3).png'
    }
];

let cargoesDB = [
    {
        id: 'cg-101',
        from: 'Toshkent',
        to: 'Samarqand',
        weight: 'Qutilar / 5 Tonna',
        price: 3200000,
        priceType: 'fixed',
        truckType: 'Isuzu 5 Tonna',
        phone: '+998 90 111 22 33',
        routePresence: 'bor',
        status: 'pending',
        author: 'Anvar Karimov',
        createdAt: new Date().toISOString()
    },
    {
        id: 'cg-102',
        from: 'Buxoro',
        to: 'Toshkent',
        weight: 'Mebel / 10 Tonna',
        price: 5500000,
        priceType: 'advance',
        truckType: 'Isuzu 10 Tonna',
        phone: '+998 91 444 55 66',
        routePresence: 'bor',
        status: 'pending',
        author: 'Jasur Aliyev',
        createdAt: new Date().toISOString()
    }
];

// ============================================
// API ENDPOINTS
// ============================================

// 1. Tizim holatini tekshirish
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'YukExpress Apple Silicon Engine API faol!' });
});

// 2. Auth: Kirish / Face ID autentifikatsiyasi
app.post('/api/auth/login', (req, res) => {
    const { name, phone, role } = req.body;

    if (!name || !phone || !role) {
        return res.status(400).json({ success: false, message: "Ism, telefon va rol kiritilishi shart!" });
    }

    let user = users.find(u => u.phone === phone);
    if (!user) {
        user = { id: uuidv4(), name, phone, role, createdAt: new Date().toISOString() };
        users.push(user);
    } else {
        user.role = role;
        user.name = name;
    }

    return res.status(200).json({
        success: true,
        message: "Face ID muvaffaqiyatli tasdiqlandi",
        user
    });
});

// 3. Cargoes: Barcha yuklarni olish (filtrlar va saralash bilan)
app.get('/api/cargoes', (req, res) => {
    const { from, to, truckType, sort } = req.query;

    let result = [...cargoesDB];

    if (from) {
        result = result.filter(c => c.from.toLowerCase().includes(from.toLowerCase()));
    }
    if (to) {
        result = result.filter(c => c.to.toLowerCase().includes(to.toLowerCase()));
    }
    if (truckType) {
        result = result.filter(c => c.truckType === truckType);
    }

    if (sort === 'price_high') {
        result.sort((a, b) => b.price - a.price);
    } else if (sort === 'price_low') {
        result.sort((a, b) => a.price - b.price);
    } else {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json({ success: true, count: result.length, data: result });
});

// 4. Cargoes: Yangi yuk e'lonini yaratish
app.post('/api/cargoes', (req, res) => {
    const { from, to, weight, price, priceType, truckType, phone, routePresence, author } = req.body;

    if (!from || !to || !weight || !phone || !truckType) {
        return res.status(400).json({ success: false, message: "Barcha majburiy maydonlarni to'ldiring!" });
    }

    const newCargo = {
        id: 'cg-' + Date.now(),
        from,
        to,
        weight,
        price: priceType === 'negotiable' ? 0 : Number(price) || 0,
        priceType: priceType || 'fixed',
        truckType,
        phone,
        routePresence: routePresence || 'bor',
        status: 'pending',
        author: author || 'Noma\'lum',
        createdAt: new Date().toISOString()
    };

    cargoesDB.unshift(newCargo);
    res.status(201).json({ success: true, message: "Yuk e'loni joylandi", data: newCargo });
});

// 5. Cargoes: Shofyor yukni qabul qilishi (Status o'zgartirish)
app.patch('/api/cargoes/:id/accept', (req, res) => {
    const { id } = req.params;
    const cargo = cargoesDB.find(c => c.id === id);

    if (!cargo) {
        return res.status(404).json({ success: false, message: "Yuk e'loni topilmadi!" });
    }

    cargo.status = 'accepted';
    res.status(200).json({ success: true, message: "Yuk qabul qilindi", data: cargo });
});

// 6. Cargoes: E'lonni o'chirish
app.delete('/api/cargoes/:id', (req, res) => {
    const { id } = req.params;
    const index = cargoesDB.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: "O'chiriladigan yuk topilmadi!" });
    }

    cargoesDB.splice(index, 1);
    res.status(200).json({ success: true, message: "E'lon muvaffaqiyatli o'chirildi" });
});

// 7. Vehicles: Mavjud transport vositalari ro'yxatini olish
app.get('/api/vehicles', (req, res) => {
    res.status(200).json({ success: true, data: vehiclesDB });
});

// 8. Vehicles: Yangi transport turini qo'shish
app.post('/api/vehicles', (req, res) => {
    const { name, capacity, img } = req.body;

    if (!name || !capacity) {
        return res.status(400).json({ success: false, message: "Mashina nomi va sig'imi kiritilishi kerak!" });
    }

    const newVehicle = {
        id: 'veh_' + Date.now(),
        name,
        capacity,
        img: img || 'https://i.postimg.cc/cJDdVcCZ/Isuzu-5-Tonna.png'
    };

    vehiclesDB.push(newVehicle);
    res.status(201).json({ success: true, message: "Yangi transport qo'shildi", data: newVehicle });
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`🚀 YukExpress Backend server ${PORT}-portda muvaffaqiyatli ishlayapti...`);
});
