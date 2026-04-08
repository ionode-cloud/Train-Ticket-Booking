const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Booking = require('../models/Booking');
const Train = require('../models/Train');
const { sendTicketEmail } = require('../services/emailService');

// POST /api/book-ticket
router.post('/book-ticket', async (req, res) => {
  const {
    trainId, email, phone, passengers,
    numberOfSeats, travelDate, seatType
  } = req.body;

  // ── Validation ─────────────────────────────────────────────────────────────
  const errors = [];

  if (!trainId)
    errors.push('Train ID is required');

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    errors.push('At least one passenger is required');
  } else if (passengers.length !== Number(numberOfSeats)) {
    errors.push(`Expected ${numberOfSeats} passenger details but got ${passengers.length}`);
  } else {
    passengers.forEach((p, i) => {
      if (!p.name || p.name.trim().length < 2) errors.push(`Passenger ${i+1} name must be at least 2 characters`);
      if (!p.aadhar || !/^\d{12}$/.test(p.aadhar.replace(/\s/g, ''))) errors.push(`Passenger ${i+1} Aadhar must be exactly 12 digits`);
    });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    errors.push('Valid email address is required');
  if (!phone || !/^[6-9]\d{9}$/.test(phone))
    errors.push('Valid 10-digit Indian mobile number is required (starting with 6-9)');
  if (!seatType)
    errors.push('Seat type is required (e.g. SL, 3AC, 2AC)');
  if (!numberOfSeats || Number(numberOfSeats) < 1 || Number(numberOfSeats) > 10)
    errors.push('Number of seats must be between 1 and 10');
  if (!travelDate)
    errors.push('Travel date is required');
  else {
    const selected = new Date(travelDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selected < today) errors.push('Travel date cannot be in the past');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    // Find train
    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    // Validate seat type exists on this train
    const seatClass = train.seatTypes.find(s => s.code === seatType);
    if (!seatClass) {
      return res.status(400).json({
        success: false,
        message: `Seat type '${seatType}' is not available on this train. Available: ${train.seatTypes.map(s => s.code).join(', ')}`
      });
    }

    // Check availability for the chosen class
    if (seatClass.availableSeats < Number(numberOfSeats)) {
      return res.status(400).json({
        success: false,
        message: `Only ${seatClass.availableSeats} seats available in ${seatClass.label} (${seatType})`
      });
    }

    // Duplicate booking check (same email + train + date + seatType within 30 min)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingBooking = await Booking.findOne({
      email: email.toLowerCase(), trainId, travelDate, seatType,
      status: 'Confirmed',
      createdAt: { $gte: thirtyMinsAgo }
    });
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'You already have a recent confirmed booking for this train, date, and seat class.'
      });
    }

    // Calculate total price using seat-class price
    const totalPrice = seatClass.price * Number(numberOfSeats);

    // Create a Pending Booking
    const booking = new Booking({
      trainId:       train._id,
      trainName:     train.trainName,
      trainNumber:   train.trainNumber,
      source:        train.source,
      destination:   train.destination,
      departureTime: train.departureTime,
      arrivalTime:   train.arrivalTime,
      seatType:      seatClass.code,
      seatTypeLabel: seatClass.label,
      passengers:    passengers.map(p => ({
        name: p.name.trim(),
        aadhar: p.aadhar.replace(/\s/g, '')
      })),
      email:         email.toLowerCase(),
      phone,
      numberOfSeats: Number(numberOfSeats),
      travelDate,
      totalPrice,
      status:        'Pending Payment'
    });

    await booking.save();
    
    // Create Cashfree Order
    const orderId = `ORDER_${booking._id}`;
    booking.paymentOrderId = orderId;
    await booking.save();

    const cashfreeUrl = process.env.CF_ENV === 'sandbox' 
      ? 'https://sandbox.cashfree.com/pg/orders' 
      : 'https://api.cashfree.com/pg/orders';

    try {
      const cashfreeResponse = await axios.post(cashfreeUrl, {
        order_amount: totalPrice,
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
          customer_id: "CUST_" + booking._id,
          customer_phone: phone,
          customer_email: email.toLowerCase(),
          customer_name: passengers[0].name
        },
        order_meta: {
          // Setting the return URL so Cashfree redirects back to our frontend Confirmation (or wait, verification route)
          // We will point it to a frontend verification page or simple confirmation
          return_url: `http://localhost:5173/confirmation?order_id=${orderId}&session_id={payment_session_id}`
        }
      }, {
        headers: {
          'x-client-id': process.env.CF_CLIENT_ID,
          'x-client-secret': process.env.CF_CLIENT_SECRET,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json'
        }
      });

      const paymentSessionId = cashfreeResponse.data.payment_session_id;
      booking.paymentSessionId = paymentSessionId;
      await booking.save();

      res.status(201).json({
        success: true,
        message: 'Order created successfully! Proceeding to payment...',
        payment_session_id: paymentSessionId,
        order_id: orderId,
        booking: booking.toObject()
      });

    } catch (cfErr) {
      console.error('Cashfree Create Order Error:', cfErr.response?.data || cfErr.message);
      return res.status(500).json({ success: false, message: 'Failed to initiate payment gateway.' });
    }

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate ticket detected' });
    }
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/verify-payment
router.post('/verify-payment', async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ success: false, message: 'order_id is required' });

  try {
    const cashfreeUrl = process.env.CF_ENV === 'sandbox' 
      ? `https://sandbox.cashfree.com/pg/orders/${order_id}` 
      : `https://api.cashfree.com/pg/orders/${order_id}`;

    const response = await axios.get(cashfreeUrl, {
      headers: {
        'x-client-id': process.env.CF_CLIENT_ID,
        'x-client-secret': process.env.CF_CLIENT_SECRET,
        'x-api-version': '2022-09-01'
      }
    });

    if (response.data.order_status === 'PAID') {
      const booking = await Booking.findOne({ paymentOrderId: order_id });
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

      if (booking.status === 'Confirmed') {
        return res.json({ success: true, message: 'Payment already verified.', booking });
      }

      booking.status = 'Confirmed';
      await booking.save();

      // Deduct seats now that payment is confirmed
      const train = await Train.findById(booking.trainId);
      if (train) {
        const seatClass = train.seatTypes.find(s => s.code === booking.seatType);
        if (seatClass) {
           seatClass.availableSeats = Math.max(0, seatClass.availableSeats - booking.numberOfSeats);
           train.availableSeats = Math.max(0, train.availableSeats - booking.numberOfSeats);
           await train.save();
        }
      }

      // Output confirmed booking to ticket.json
      try {
        const ticketsFilePath = path.join(__dirname, '..', 'ticket.json');
        let ticketsData = [];
        if (fs.existsSync(ticketsFilePath)) {
          const fileContent = fs.readFileSync(ticketsFilePath, 'utf8');
          if (fileContent.trim()) {
            ticketsData = JSON.parse(fileContent);
          }
        }
        ticketsData.push(booking.toObject());
        fs.writeFileSync(ticketsFilePath, JSON.stringify(ticketsData, null, 2));
      } catch (fsErr) {
        console.error('Error saving to ticket.json:', fsErr);
      }

      // Send email
      sendTicketEmail(booking.toObject()).catch(err => console.error('Email sending failed:', err));

      return res.json({ success: true, message: 'Payment successful, ticket confirmed!', booking });
    } else {
      return res.json({ success: false, message: 'Payment not completed.', status: response.data.order_status });
    }
  } catch (err) {
    console.error('Cashfree Verify Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
});

// GET /api/booking/:ticketId
router.get('/booking/:ticketId', async (req, res) => {
  try {
    const booking = await Booking.findOne({ ticketId: req.params.ticketId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

module.exports = router;
