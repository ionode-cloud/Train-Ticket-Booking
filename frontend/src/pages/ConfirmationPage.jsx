import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

function BarcodeGraphic({ ticketId }) {
  const bars = useRef(null);

  useEffect(() => {
    if (!bars.current) return;
    const seed = ticketId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rng  = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
    const barsData = [];
    for (let i = 0; i < 42; i++) {
      const w = Math.max(2, Math.floor(rng(seed + i) * 5));
      const h = 28 + Math.floor(rng(seed + i + 100) * 28);
      barsData.push({ w, h });
    }
    bars.current.innerHTML = barsData.map(b =>
      `<div style="width:${b.w}px;height:${b.h}px;background:#1c1d22;border-radius:1px;flex-shrink:0"></div>`
    ).join('');
  }, [ticketId]);

  return (
    <div className="bp-barcode">
      <div ref={bars} style={{
        display: 'flex', gap: '3px', alignItems: 'flex-end',
        height: '58px', justifyContent: 'center', minWidth: '200px'
      }} />
    </div>
  );
}

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [verifying, setVerifying] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (!booking && orderId) {
      setVerifying(true);
      axios.post('http://localhost:5000/api/verify-payment', { order_id: orderId })
        .then(res => {
          if (res.data.success) {
            setBooking(res.data.booking);
          } else {
            setErrorStatus(res.data.status || res.data.message || 'Payment Verification Failed');
          }
        })
        .catch(err => {
          console.error('Verify error:', err);
          setErrorStatus('Payment Verification Error');
        })
        .finally(() => setVerifying(false));
    } else if (!booking && !orderId) {
      navigate('/', { replace: true });
    }
  }, [booking, searchParams, navigate]);

  if (verifying) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-inner">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', margin: '0 auto 20px' }}></div>
            <h2 style={{ color: 'var(--text-dark)' }}>Verifying Payment...</h2>
            <p style={{ color: 'var(--text-light)' }}>Please wait while we confirm your booking with Cashfree.</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-inner">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ color: '#dc2626', marginBottom: '12px' }}>Payment Failed</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>{errorStatus}</p>
            <button className="bp-action-btn secondary" onClick={() => navigate('/')} style={{ display: 'inline-flex' }}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const parseDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  const formattedDate = parseDate(booking.travelDate);
  const bookedAt = new Date(booking.bookedAt || booking.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  });

  return (
    <div className="confirmation-page">
      <div className="confirmation-inner">
        {/* Success header */}
        <div className="confirmation-header">
          <div className="success-icon">✓</div>
          <h1 className="confirmation-title">Booking Confirmed!</h1>
          <p className="confirmation-subtitle">Your ticket has been booked successfully</p>
          <div className="email-notice">📧 Ticket sent to {booking.email}</div>
        </div>

        {/* Boarding pass */}
        <div className="boarding-pass">
          {/* Header */}
          <div className="bp-header">
            <div className="bp-logo">
              <div className="bp-logo-badge">🚂</div>
              <div className="bp-logo-text">TrainBook</div>
            </div>
            <div className="bp-status-badge">
              <div className="bp-status-dot" /> Confirmed
            </div>
          </div>

          {/* Ticket ID bar */}
          <div className="bp-ticket-id-bar">
            <div className="bp-ticket-id-label">Booking Code</div>
            <div className="bp-ticket-id-value">{booking.ticketId}</div>
          </div>

          {/* Tear line */}
          <div className="bp-tear-line">
            <div className="bp-tear-circle-left" />
            <div className="bp-tear-dashes" />
            <div className="bp-tear-circle-right" />
          </div>

          {/* Route + details */}
          <div className="bp-route-section">
            <div className="bp-route-display">
              <div className="bp-station">
                <div className="bp-station-time">{booking.departureTime}</div>
                <div className="bp-station-name">{booking.source}</div>
                <div className="bp-station-code">DEP</div>
              </div>
              <div className="bp-journey-mid">
                <div className="bp-train-emoji">🚂</div>
                <div className="bp-duration-tag">Direct</div>
              </div>
              <div className="bp-station" style={{ textAlign: 'right' }}>
                <div className="bp-station-time">{booking.arrivalTime}</div>
                <div className="bp-station-name">{booking.destination}</div>
                <div className="bp-station-code">ARR</div>
              </div>
            </div>

            {/* Details grid */}
            <div className="bp-details-grid">
              <div className="bp-detail-item">
                <div className="bp-detail-label">Train</div>
                <div className="bp-detail-value">{booking.trainName}</div>
              </div>
              <div className="bp-detail-item">
                <div className="bp-detail-label">Train No.</div>
                <div className="bp-detail-value">{booking.trainNumber}</div>
              </div>
              <div className="bp-detail-item">
                <div className="bp-detail-label">Seat Class</div>
                <div className="bp-detail-value">
                  <span style={{ background: '#ff6b35', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    {booking.seatTypeLabel || booking.seatType || 'N/A'} ({booking.seatType || ''})
                  </span>
                </div>
              </div>
              <div className="bp-detail-item">
                <div className="bp-detail-label">Travel Date</div>
                <div className="bp-detail-value">{formattedDate}</div>
              </div>
              <div className="bp-detail-item">
                <div className="bp-detail-label">Booked At</div>
                <div className="bp-detail-value" style={{ fontSize: '12px' }}>{bookedAt}</div>
              </div>
              <div className="bp-detail-item">
                <div className="bp-detail-label">Contact Phone</div>
                <div className="bp-detail-value">{booking.phone}</div>
              </div>
            </div>

            {/* Map Summary */}
            <div style={{ marginTop: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e8f0fe' }}>
              <iframe
                title="Route Map"
                width="100%"
                height="160"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://maps.google.com/maps?width=100%25&height=160&hl=en&q=from%20${encodeURIComponent(booking.source)}%20to%20${encodeURIComponent(booking.destination)}&t=&z=6&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>

            {/* Passenger Roster */}
            <div style={{ marginTop: '20px', background: '#f8faff', borderRadius: '8px', padding: '16px', border: '1px solid #e8f0fe' }}>
              <div style={{ fontSize: '12px', color: '#1a1a2e', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                👤 Passenger Roster ({booking.numberOfSeats} Seat{booking.numberOfSeats > 1 ? 's' : ''})
              </div>
              {booking.passengers && booking.passengers.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i === booking.passengers.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e' }}>{i + 1}. {p.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Aadhar: <span style={{ fontWeight: 500, background: '#f3f4f6', padding: '2px 6px', borderRadius: '12px' }}>{p.aadhar ? `XXXX-XXXX-${p.aadhar.slice(-4)}` : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total price */}
            <div className="bp-price-total">
              <div>
                <div className="bp-price-label">Total Paid Amount</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  {booking.numberOfSeats} seat(s) × ₹{(booking.totalPrice / booking.numberOfSeats).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bp-price-amount">₹{booking.totalPrice.toLocaleString('en-IN')}</div>
            </div>

            {/* Bill / Invoice Summary */}
            <div className="bp-invoice-section" style={{ marginTop: '20px', borderTop: '1px dashed #e5e7eb', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#1a1a2e', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                🧾 Tax Invoice / Bill Breakdown
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
                <span>Base Fare ({booking.numberOfSeats} seats)</span>
                <span>₹{(booking.totalPrice * 0.95).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
                <span>Taxes & Fees (5%)</span>
                <span>₹{(booking.totalPrice * 0.05).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563', fontWeight: 600, marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                <span>Grand Total Paid</span>
                <span>₹{booking.totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Tear line */}
          <div className="bp-tear-line" style={{ margin: '0 0 16px' }}>
            <div className="bp-tear-circle-left" />
            <div className="bp-tear-dashes" />
            <div className="bp-tear-circle-right" />
          </div>

          {/* Barcode */}
          <div className="bp-barcode-section">
            <BarcodeGraphic ticketId={booking.ticketId} />
            <div className="bp-barcode-id">{booking.ticketId}</div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
              Show this code at the platform · Carry valid ID
            </p>
          </div>

          {/* Action buttons */}
          <div className="bp-actions" style={{ flexWrap: 'wrap' }}>
            <button className="bp-action-btn primary" onClick={() => window.print()} id="print-ticket-btn">
              🖨️ Print Ticket
            </button>
            <button className="bp-action-btn secondary" onClick={() => window.print()} id="download-bill-btn">
              🧾 Download Bill
            </button>
            <button className="bp-action-btn secondary" onClick={() => navigate('/')} id="new-booking-btn">
              🚂 Book Another
            </button>
          </div>
        </div>

        {/* Important note */}
        <div className="important-note">
          <strong>📋 Important:</strong> Carry your government-issued photo ID during travel.
          Report to the platform at least 15 minutes before departure. This ticket is non-transferable.
        </div>
      </div>
    </div>
  );
}
