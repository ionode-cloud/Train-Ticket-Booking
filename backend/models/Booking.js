const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    default: () => 'TKT-' + uuidv4().substring(0, 8).toUpperCase(),
    unique: true
  },
  trainId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  trainName:     { type: String, required: true },
  trainNumber:   { type: String, required: true },
  source:        { type: String, required: true },
  destination:   { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime:   { type: String, required: true },

  // Seat class (NEW)
  seatType:      { type: String, required: true },       // e.g. "3AC"
  seatTypeLabel: { type: String, required: true },       // e.g. "AC 3 Tier"

  passengers: [{
    name: { type: String, required: true, trim: true },
    aadhar: { type: String, required: true, trim: true, match: [/^\d{12}$/, 'Aadhar must be 12 digits'] }
  }],

  email: {
    type: String, required: true, trim: true, lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String, required: true, trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },

  numberOfSeats: { type: Number, required: true, min: 1, max: 10 },
  travelDate:    { type: String, required: true },
  totalPrice:    { type: Number, required: true },

  status: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'Pending Payment', 'Pending'],
    default: 'Pending Payment'
  },
  paymentOrderId: { type: String },
  paymentSessionId: { type: String },
  bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
