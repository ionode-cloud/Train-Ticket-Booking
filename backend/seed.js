const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Train = require('./models/Train');

dotenv.config();
function buildSeatTypes(classes, basePrice) {
  const classConfig = {
    SL:  { label: 'Sleeper',     multi: 1.0,  seats: 120 },
    CC:  { label: 'Chair Car',   multi: 1.2,  seats: 80  },
    '3AC': { label: 'AC 3 Tier', multi: 1.8,  seats: 64  },
    '2AC': { label: 'AC 2 Tier', multi: 2.5,  seats: 48  },
    '1AC': { label: 'First Class',multi: 3.5, seats: 24  },
  };
  return classes.map(code => {
    const cfg = classConfig[code];
    const price = Math.round(basePrice * cfg.multi);
    const avail = Math.max(0, cfg.seats - Math.floor(Math.random() * 30));
    return { code, label: cfg.label, price, totalSeats: cfg.seats, availableSeats: avail };
  });
}

const seedTrains = async () => {
  const trains = [
    {
      trainName: 'Rajdhani Express', trainNumber: '12301',
      source: 'New Delhi', sourceCode: 'NDLS',
      destination: 'Mumbai Central', destinationCode: 'MMCT',
      departureTime: '16:35', arrivalTime: '08:35', duration: '16h 00m',
      price: 1850, totalSeats: 120, availableSeats: 98,
      trainType: 'Rajdhani', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['3AC','2AC','1AC'], 1850),
      imageUrl: 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Shatabdi Express', trainNumber: '12002',
      source: 'New Delhi', sourceCode: 'NDLS',
      destination: 'Bhopal', destinationCode: 'BPL',
      departureTime: '06:00', arrivalTime: '13:55', duration: '7h 55m',
      price: 950, totalSeats: 100, availableSeats: 76,
      trainType: 'Shatabdi', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['CC','3AC'], 950),
      imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Duronto Express', trainNumber: '12213',
      source: 'Mumbai Central', sourceCode: 'MMCT',
      destination: 'New Delhi', destinationCode: 'NDLS',
      departureTime: '23:00', arrivalTime: '15:55', duration: '16h 55m',
      price: 1600, totalSeats: 150, availableSeats: 112,
      trainType: 'Duronto', days: ['Mon','Wed','Fri','Sun'],
      seatTypes: buildSeatTypes(['SL','3AC','2AC'], 1600),
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Vande Bharat Express', trainNumber: '22436',
      source: 'New Delhi', sourceCode: 'NDLS',
      destination: 'Varanasi', destinationCode: 'BSB',
      departureTime: '06:00', arrivalTime: '14:00', duration: '8h 00m',
      price: 1200, totalSeats: 120, availableSeats: 45,
      trainType: 'Superfast', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['CC','3AC','2AC'], 1200),
      imageUrl: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Garib Rath Express', trainNumber: '12203',
      source: 'Mumbai CST', sourceCode: 'CSTM',
      destination: 'Patna', destinationCode: 'PNBE',
      departureTime: '21:05', arrivalTime: '17:00', duration: '19h 55m',
      price: 620, totalSeats: 200, availableSeats: 164,
      trainType: 'Express', days: ['Tue','Thu','Sat'],
      seatTypes: buildSeatTypes(['SL','3AC'], 620),
      imageUrl: 'https://images.unsplash.com/photo-1563514757342-9f379a0da1b5?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Chennai Express', trainNumber: '12163',
      source: 'Chennai Central', sourceCode: 'MAS',
      destination: 'Mumbai CST', destinationCode: 'CSTM',
      departureTime: '08:00', arrivalTime: '10:25', duration: '26h 25m',
      price: 1350, totalSeats: 180, availableSeats: 92,
      trainType: 'Express', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['SL','3AC','2AC'], 1350),
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Howrah Rajdhani', trainNumber: '12302',
      source: 'Howrah', sourceCode: 'HWH',
      destination: 'New Delhi', destinationCode: 'NDLS',
      departureTime: '14:05', arrivalTime: '10:00', duration: '19h 55m',
      price: 1750, totalSeats: 120, availableSeats: 33,
      trainType: 'Rajdhani', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['3AC','2AC','1AC'], 1750),
      imageUrl: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Karnataka Express', trainNumber: '12627',
      source: 'New Delhi', sourceCode: 'NDLS',
      destination: 'Bangalore', destinationCode: 'SBC',
      departureTime: '22:30', arrivalTime: '05:15', duration: '30h 45m',
      price: 1480, totalSeats: 160, availableSeats: 88,
      trainType: 'Express', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['SL','3AC','2AC'], 1480),
      imageUrl: 'https://images.unsplash.com/photo-1611005522513-8be80a71fecf?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Golden Temple Mail', trainNumber: '12904',
      source: 'Mumbai Central', sourceCode: 'MMCT',
      destination: 'Amritsar', destinationCode: 'ASR',
      departureTime: '21:55', arrivalTime: '05:55', duration: '32h 00m',
      price: 880, totalSeats: 140, availableSeats: 107,
      trainType: 'Mail', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['SL','3AC'], 880),
      imageUrl: 'https://images.unsplash.com/photo-1534445867742-43195f401b6c?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Tejas Express', trainNumber: '82501',
      source: 'New Delhi', sourceCode: 'NDLS',
      destination: 'Lucknow', destinationCode: 'LKO',
      departureTime: '06:10', arrivalTime: '12:25', duration: '6h 15m',
      price: 1100, totalSeats: 100, availableSeats: 62,
      trainType: 'Superfast', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['CC','3AC'], 1100),
      imageUrl: 'https://images.unsplash.com/photo-1540960537233-2bf9eeb97063?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'August Kranti Rajdhani', trainNumber: '12954',
      source: 'Mumbai Central', sourceCode: 'MMCT',
      destination: 'Hazrat Nizamuddin', destinationCode: 'NZM',
      departureTime: '17:40', arrivalTime: '10:55', duration: '17h 15m',
      price: 1920, totalSeats: 120, availableSeats: 55,
      trainType: 'Rajdhani', days: ['Tue','Thu','Sun'],
      seatTypes: buildSeatTypes(['3AC','2AC','1AC'], 1920),
      imageUrl: 'https://images.unsplash.com/photo-1490604001847-b712b0c2f967?auto=format&fit=crop&q=80&w=600'
    },
    {
      trainName: 'Deccan Queen', trainNumber: '12123',
      source: 'Pune', sourceCode: 'PUNE',
      destination: 'Mumbai CST', destinationCode: 'CSTM',
      departureTime: '07:15', arrivalTime: '10:25', duration: '3h 10m',
      price: 380, totalSeats: 80, availableSeats: 71,
      trainType: 'Express', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      seatTypes: buildSeatTypes(['CC','SL'], 380),
      imageUrl: 'https://images.unsplash.com/photo-1541814631317-10eff3e6ab17?auto=format&fit=crop&q=80&w=600'
    }
  ];

  try {
    await Train.deleteMany({});
    await Train.insertMany(trains);
    console.log(`✅ Seeded ${trains.length} trains with seat type data!`);
    
    if (require.main === module) {
      // Disconnect after seeding only if run directly
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    if (require.main === module) process.exit(1);
    throw err;
  }
};

// Connect to DB and run seed only if executed directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB for seeding');
      seedTrains();
    })
    .catch((err) => {
      console.error('❌ MongoDB Connection Error:', err);
      process.exit(1);
    });
}

module.exports = seedTrains;
