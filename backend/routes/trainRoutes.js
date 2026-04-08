const express = require('express');
const router = express.Router();
const Train = require('../models/Train');

// GET /api/trains - Get all trains with optional search
router.get('/', async (req, res) => {
  try {
    const { source, destination, minPrice, maxPrice, sortBy } = req.query;

    let query = {};

    if (source) {
      query.source = { $regex: source.trim(), $options: 'i' };
    }
    if (destination) {
      query.destination = { $regex: destination.trim(), $options: 'i' };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sort = {};
    if (sortBy === 'price_asc') sort.price = 1;
    else if (sortBy === 'price_desc') sort.price = -1;
    else if (sortBy === 'departure_asc') sort.departureTime = 1;
    else if (sortBy === 'departure_desc') sort.departureTime = -1;
    else sort.departureTime = 1; // default: earliest first

    const trains = await Train.find(query).sort(sort);

    res.json({
      success: true,
      count: trains.length,
      trains
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// GET /api/trains/:id - Get single train
router.get('/:id', async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    res.json({ success: true, train });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

module.exports = router;
