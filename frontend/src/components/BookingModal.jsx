import { useState, useRef } from 'react';
import axios from 'axios';
import { useToast } from './Toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const validate = (form, seats, pricePerSeat) => {
  const errors = {};
  
  form.passengers.forEach((p, idx) => {
    if (!p.name || p.name.trim().length < 2) errors[`passengerName_${idx}`] = `Passenger ${idx + 1} Name must be at least 2 chars`;
    if (!p.aadhar || !/^\d{12}$/.test(p.aadhar.replace(/\s/g, ''))) errors[`aadharNumber_${idx}`] = `Passenger ${idx + 1} Aadhar must be exactly 12 digits`;
  });

  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
    errors.email = 'Please enter a valid email address';
  if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone))
    errors.phone = 'Enter valid 10-digit Indian mobile number (starts with 6-9)';
  if (!seats || seats < 1 || seats > 10)
    errors.numberOfSeats = 'Select between 1 and 10 seats';
  if (!form.travelDate)
    errors.travelDate = 'Please select a travel date';
  else {
    const selected = new Date(form.travelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) errors.travelDate = 'Travel date cannot be in the past';
  }
  return errors;
};

export default function BookingModal({ train, onClose, onSuccess }) {
  const { addToast } = useToast();
  const submitLock = useRef(false);

  const [form, setForm] = useState({
    email: '',
    phone: '',
    travelDate: '',
    passengers: [{ name: '', aadhar: '' }]
  });
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Find the selected seat class data
  const fallbackSeat = { code: 'GN', label: 'General', price: train.price, availableSeats: train.availableSeats };
  const seatClass = train.seatTypes?.find(s => s.code === train.selectedSeatType) || fallbackSeat;

  const totalPrice = seatClass.price * numberOfSeats;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePassengerChange = (index, field, value) => {
    setForm(prev => {
      const newPassengers = [...prev.passengers];
      newPassengers[index] = { ...newPassengers[index], [field]: value };
      return { ...prev, passengers: newPassengers };
    });
    if (errors[`${field}_${index}`]) {
      setErrors(prev => ({ ...prev, [`${field}_${index}`]: '' }));
    }
  };

  const handleSeatsChange = (e) => {
    const newCount = Number(e.target.value);
    setNumberOfSeats(newCount);
    if (errors.numberOfSeats) setErrors(p => ({ ...p, numberOfSeats: '' }));
    
    setForm(prev => {
      const newPassengers = [...prev.passengers];
      while (newPassengers.length < newCount) {
        newPassengers.push({ name: '', aadhar: '' });
      }
      if (newPassengers.length > newCount) {
        newPassengers.length = newCount;
      }
      return { ...prev, passengers: newPassengers };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return; // Prevent duplicate submissions

    const validationErrors = validate(form, numberOfSeats, seatClass.price);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    submitLock.current = true;
    setLoading(true);

    try {
      const res = await axios.post(`${API}/book-ticket`, {
        trainId: train._id,
        seatType: seatClass.code,
        passengers: form.passengers.map(p => ({ name: p.name.trim(), aadhar: p.aadhar.replace(/\s/g, '') })),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        numberOfSeats,
        travelDate: form.travelDate
      });

      if (res.data.payment_session_id) {
        addToast('Initiating payment gateway...', 'info');
        const cashfree = window.Cashfree({ mode: "sandbox" });
        cashfree.checkout({
          paymentSessionId: res.data.payment_session_id,
          redirectTarget: "_self"
        });
        return; // Halt here since we redirect to payment
      }

      // Fallback
      addToast('🎉 Ticket booked successfully! Check your email.', 'success');
      onSuccess(res.data.booking);
    } catch (err) {
      const msg = err.response?.data?.message ||
        (err.response?.data?.errors?.[0]) ||
        'Booking failed. Please try again.';
      addToast(msg, 'error');
      submitLock.current = false;
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay" style={{ zIndex: 10000 }}>
          <div className="loading-card">
            <span className="loading-train">🚂</span>
            <div className="loading-text">Booking your ticket...</div>
            <div className="loading-subtext">Securing your seat & sending email</div>
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal" role="dialog" aria-modal="true" aria-label="Book ticket">
          {/* Modal Header */}
          <div className="modal-header">
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close booking form"
              disabled={loading}
            >
              ✕
            </button>
            <div className="modal-train-header">
              <div className="modal-train-icon">🚂</div>
              <div>
                <div className="modal-train-name">{train.trainName}</div>
                <div className="modal-train-num">#{train.trainNumber} · {train.trainType} · <span style={{ color: '#ff6b35' }}>{seatClass.label}</span></div>
              </div>
            </div>
            <div className="modal-route">
              <div>
                <div className="modal-route-city">{train.departureTime}</div>
                <div className="modal-route-time">{train.source}</div>
              </div>
              <div className="modal-route-arrow">
                <div className="modal-route-line" />
                <div className="modal-route-duration">{train.duration}</div>
                <div className="modal-route-line" />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="modal-route-city">{train.arrivalTime}</div>
                <div className="modal-route-time">{train.destination}</div>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="modal-body" noValidate>
            
            {/* Embedded Route Map */}
            <div className="map-container" style={{ marginBottom: '24px' }}>
              <iframe
                title="Route Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://maps.google.com/maps?width=100%25&height=600&hl=en&q=from%20${encodeURIComponent(train.source)}%20to%20${encodeURIComponent(train.destination)}&t=&z=6&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>

            <div className="form-section-title">📞 Contact Details</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && (
                  <div className="form-error">⚠ {errors.email}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone <span className="required">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={10}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <div className="form-error">⚠ {errors.phone}</div>
                )}
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: '20px' }}>👥 Passenger Details</div>
            
            {form.passengers.map((p, idx) => (
              <div key={idx} style={{ background: '#f8faff', padding: '16px', borderRadius: '8px', border: '1px solid #e8f0fe', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e', marginBottom: '12px' }}>Passenger {idx + 1}</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-input ${errors[`passengerName_${idx}`] ? 'error' : ''}`}
                      placeholder="Enter full name"
                      value={p.name}
                      onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                      disabled={loading}
                    />
                    {errors[`passengerName_${idx}`] && (
                      <div className="form-error">⚠ {errors[`passengerName_${idx}`]}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhar Number <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-input ${errors[`aadharNumber_${idx}`] ? 'error' : ''}`}
                      placeholder="1234 5678 9012"
                      value={p.aadhar}
                      onChange={(e) => handlePassengerChange(idx, 'aadhar', e.target.value)}
                      disabled={loading}
                      maxLength={14}
                    />
                    {errors[`aadharNumber_${idx}`] && (
                      <div className="form-error">⚠ {errors[`aadharNumber_${idx}`]}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="form-section-title" style={{ marginTop: '20px' }}>🎫 Travel Details</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="travelDate">
                  Travel Date <span className="required">*</span>
                </label>
                <input
                  id="travelDate"
                  name="travelDate"
                  type="date"
                  className={`form-input ${errors.travelDate ? 'error' : ''}`}
                  value={form.travelDate}
                  onChange={handleChange}
                  min={today}
                  disabled={loading}
                />
                {errors.travelDate && (
                  <div className="form-error">⚠ {errors.travelDate}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="numberOfSeats">
                  Seats <span className="required">*</span>
                </label>
                <select
                  id="numberOfSeats"
                  className={`form-input ${errors.numberOfSeats ? 'error' : ''}`}
                  value={numberOfSeats}
                  onChange={handleSeatsChange}
                  disabled={loading}
                >
                  {[...Array(Math.min(10, seatClass.availableSeats))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} Seat{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
                {errors.numberOfSeats && (
                  <div className="form-error">⚠ {errors.numberOfSeats}</div>
                )}
              </div>
            </div>

            {/* Price Summary */}
            <div className="price-summary">
              <div className="price-summary-row">
                <span>Price per seat ({seatClass.label})</span>
                <span>₹{seatClass.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="price-summary-row">
                <span>Number of seats</span>
                <span>× {numberOfSeats}</span>
              </div>
              <div className="price-summary-total">
                <span>Total Amount</span>
                <span className="total-price">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              id="confirm-booking-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }} />
                  Booking...
                </>
              ) : (
                <>🎫 Confirm Booking · ₹{totalPrice.toLocaleString('en-IN')}</>
              )}
            </button>

            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '12px'
            }}>
              🔒 Secure booking · Ticket will be emailed instantly
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
