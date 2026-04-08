const mongoose = require('mongoose');

// Seat type sub-schema
const seatTypeSchema = new mongoose.Schema({
  code:           { type: String, required: true },  // e.g. "SL", "3AC"
  label:          { type: String, required: true },  // e.g. "Sleeper", "AC 3 Tier"
  price:          { type: Number, required: true, min: 0 },
  totalSeats:     { type: Number, required: true, default: 80 },
  availableSeats: { type: Number, required: true }
}, { _id: false });

const trainSchema = new mongoose.Schema({
  trainName:       { type: String, required: true, trim: true },
  trainNumber:     { type: String, required: true, unique: true, trim: true },
  source:          { type: String, required: true, trim: true },
  sourceCode:      { type: String, required: true, trim: true, uppercase: true },
  destination:     { type: String, required: true, trim: true },
  destinationCode: { type: String, required: true, trim: true, uppercase: true },
  departureTime:   { type: String, required: true },
  arrivalTime:     { type: String, required: true },
  duration:        { type: String, required: true },

  // Base price = cheapest seat class (kept for backwards compat & filtering)
  price:          { type: Number, required: true, min: 0 },

  // Total/available across all classes (kept for list-level display)
  totalSeats:     { type: Number, required: true, default: 100 },
  availableSeats: { type: Number, required: true },

  // Per-class breakdown (NEW)
  seatTypes: { type: [seatTypeSchema], default: [] },

  // Train representative image (NEW)
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400' },

  trainType: {
    type: String,
    enum: ['Express', 'Superfast', 'Mail', 'Local', 'Rajdhani', 'Shatabdi', 'Duronto'],
    default: 'Express'
  },
  days: { type: [String], default: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
