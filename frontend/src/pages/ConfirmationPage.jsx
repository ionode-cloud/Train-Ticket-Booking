import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const API = import.meta.env.VITE_API_URL || 'https://train-ticket-booking-uj88.onrender.com/api';

// ─── Barcode Graphic ──────────────────────────────────────────────────────────
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

// ─── PDF Bill Generator ───────────────────────────────────────────────────────
function generateBillPDF(booking) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 18;
  const col2 = 110;
  let y = 0;

  const fmt = (n) => `Rs.${Number(n).toLocaleString('en-IN')}`;
  const parseDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || 'N/A'; }
  };
  const bookedAt = new Date(booking.bookedAt || booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const baseFare   = Math.round(booking.totalPrice * 0.95);
  const taxes      = Math.round(booking.totalPrice * 0.05);
  const grandTotal = booking.totalPrice;

  // ── Header band ──
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageW, 38, 'F');

  // Logo text
  doc.setTextColor(255, 107, 53);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TrainBook', margin, 20);

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 210);
  doc.setFont('helvetica', 'normal');
  doc.text('India\'s Smart Train Ticket Platform', margin, 27);

  // Invoice label (right side)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageW - margin, 17, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 220);
  doc.text(`Invoice No: INV-${booking.ticketId}`, pageW - margin, 23, { align: 'right' });
  doc.text(`Date: ${bookedAt}`, pageW - margin, 28, { align: 'right' });

  y = 46;

  // ── Status badge ──
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(margin, y - 5, 38, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('✓  PAYMENT CONFIRMED', margin + 4, y + 1);

  y += 12;

  // ── Booking details section ──
  doc.setDrawColor(230, 230, 240);
  doc.setFillColor(248, 250, 255);
  doc.rect(margin, y, pageW - 2 * margin, 46, 'FD');

  doc.setTextColor(100, 100, 130);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING REFERENCE', margin + 4, y + 7);
  doc.setTextColor(26, 26, 46);
  doc.setFontSize(14);
  doc.text(booking.ticketId, margin + 4, y + 15);

  // Train info
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 130);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAIN', margin + 4, y + 24);
  doc.setTextColor(26, 26, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${booking.trainName} (#${booking.trainNumber})`, margin + 4, y + 31);

  // Seat class
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 130);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASS', margin + 4, y + 38);
  doc.setTextColor(26, 26, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${booking.seatTypeLabel || booking.seatType} (${booking.seatType})`, margin + 4, y + 44);

  // Right half of booking card
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 130);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAVEL DATE', col2, y + 7);
  doc.setTextColor(26, 26, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(parseDate(booking.travelDate), col2, y + 14);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 130);
  doc.setFont('helvetica', 'bold');
  doc.text('SEATS', col2, y + 24);
  doc.setTextColor(26, 26, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${booking.numberOfSeats} Seat(s)`, col2, y + 31);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 130);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTACT', col2, y + 38);
  doc.setTextColor(26, 26, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${booking.phone} | ${booking.email}`, col2, y + 44);

  y += 54;

  // ── Journey Route ──
  doc.setFillColor(26, 26, 46);
  doc.rect(margin, y, pageW - 2 * margin, 22, 'F');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.source, margin + 4, y + 9);

  doc.setTextColor(180, 180, 210);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.departureTime, margin + 4, y + 16);

  // Arrow
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('---------->>----------', pageW / 2, y + 12, { align: 'center' });

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.destination, pageW - margin - 4, y + 9, { align: 'right' });

  doc.setTextColor(180, 180, 210);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.arrivalTime, pageW - margin - 4, y + 16, { align: 'right' });

  y += 30;

  // ── Passenger Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 46);
  doc.text('Passenger Details', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(26, 26, 46);
  doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('#', margin + 3, y + 5.5);
  doc.text('Passenger Name', margin + 12, y + 5.5);
  doc.text('Aadhar (Masked)', margin + 90, y + 5.5);
  doc.text('Seat Class', margin + 140, y + 5.5);
  y += 8;

  // Table rows
  (booking.passengers || []).forEach((p, i) => {
    const rowBg = i % 2 === 0 ? [248, 250, 255] : [255, 255, 255];
    doc.setFillColor(...rowBg);
    doc.setDrawColor(220, 225, 240);
    doc.rect(margin, y, pageW - 2 * margin, 8, 'FD');
    doc.setTextColor(26, 26, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(String(i + 1), margin + 3, y + 5.5);
    doc.text(p.name, margin + 12, y + 5.5);
    doc.text(p.aadhar ? `XXXX-XXXX-${p.aadhar.slice(-4)}` : 'N/A', margin + 90, y + 5.5);
    doc.text(`${booking.seatTypeLabel || booking.seatType}`, margin + 140, y + 5.5);
    y += 8;
  });

  y += 8;

  // ── Fare Breakdown ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 46);
  doc.text('Fare Breakdown', margin, y);
  y += 6;

  const drawFareRow = (label, value, bold = false, accent = false) => {
    doc.setFillColor(accent ? 26 : 248, accent ? 26 : 250, accent ? 46 : 255);
    doc.setDrawColor(220, 225, 240);
    doc.rect(margin, y, pageW - 2 * margin, 9, accent ? 'F' : 'FD');
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(accent ? 255 : 60, accent ? 255 : 60, accent ? 255 : 80);
    doc.text(label, margin + 5, y + 6);
    doc.text(value, pageW - margin - 5, y + 6, { align: 'right' });
    y += 9;
  };

  drawFareRow(`Base Fare (${booking.numberOfSeats} seat${booking.numberOfSeats > 1 ? 's' : ''} × ${fmt(Math.round(baseFare / booking.numberOfSeats))})`, fmt(baseFare));
  drawFareRow('GST & Service Tax (5%)', fmt(taxes));
  drawFareRow('Payment Gateway Fee', 'Rs.0.00');
  drawFareRow('GRAND TOTAL PAID', fmt(grandTotal), true, true);

  y += 8;

  // ── Payment Method ──
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(134, 239, 172);
  doc.rect(margin, y, pageW - 2 * margin, 14, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Payment Method: Cashfree Payment Gateway (Sandbox/Test Mode)', margin + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Order ID: ${booking.paymentOrderId || 'N/A'}   |   Status: PAID   |   Currency: INR`, margin + 5, y + 11.5);

  y += 22;

  // ── Important Notes ──
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(252, 211, 77);
  doc.rect(margin, y, pageW - 2 * margin, 20, 'FD');
  doc.setTextColor(120, 80, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Important:', margin + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('• Carry a valid government-issued photo ID (Aadhaar / PAN / Passport / Voter ID) during travel.', margin + 5, y + 12);
  doc.text('• Report to the platform at least 15 minutes before departure. This ticket is non-transferable.', margin + 5, y + 17);

  y += 28;

  // ── Footer ──
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 280, pageW, 17, 'F');
  doc.setTextColor(180, 180, 210);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('TrainBook © 2026 | India\'s Smart Train Ticket Platform | support@trainbook.in', pageW / 2, 290, { align: 'center' });
  doc.setTextColor(255, 107, 53);
  doc.text('This is a computer-generated invoice and does not require a signature.', pageW / 2, 294, { align: 'center' });

  doc.save(`TrainBook_Bill_${booking.ticketId}.pdf`);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConfirmationPage() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();

  const [booking,     setBooking]     = useState(location.state?.booking || null);
  const [verifying,   setVerifying]   = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (!booking && orderId) {
      setVerifying(true);
      axios.post(`${API}/verify-payment`, { order_id: orderId })
        .then(res => {
          if (res.data.success) {
            setBooking(res.data.booking);
          } else {
            setErrorStatus(res.data.status || res.data.message || 'Payment Verification Failed');
          }
        })
        .catch(err => {
          console.error('Verify error:', err);
          setErrorStatus('Payment Verification Error. Please contact support.');
        })
        .finally(() => setVerifying(false));
    } else if (!booking && !searchParams.get('order_id')) {
      navigate('/', { replace: true });
    }
  }, [booking, searchParams, navigate]);

  // ── Loading ──
  if (verifying) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-inner">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', margin: '0 auto 20px' }} />
            <h2 style={{ color: 'var(--text-dark)' }}>Verifying Payment...</h2>
            <p style={{ color: 'var(--text-light)' }}>Please wait while we confirm your booking with Cashfree.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
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

  const parseDate  = (d) => {
    try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || 'N/A'; }
  };
  const formattedDate = parseDate(booking.travelDate);
  const bookedAt = new Date(booking.bookedAt || booking.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  });

  return (
    <div className="confirmation-page">
      <div className="confirmation-inner">

        {/* ── Success Header ── */}
        <div className="confirmation-header">
          <div className="success-icon">✓</div>
          <h1 className="confirmation-title">Booking Confirmed!</h1>
          <p className="confirmation-subtitle">Your ticket has been booked successfully</p>
          <div className="email-notice">📧 Ticket sent to {booking.email}</div>
        </div>

        {/* ── Boarding Pass ── */}
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

          {/* Ticket ID */}
          <div className="bp-ticket-id-bar">
            <div className="bp-ticket-id-label">Booking Code</div>
            <div className="bp-ticket-id-value">{booking.ticketId}</div>
          </div>

          {/* Tear */}
          <div className="bp-tear-line">
            <div className="bp-tear-circle-left" />
            <div className="bp-tear-dashes" />
            <div className="bp-tear-circle-right" />
          </div>

          {/* Route + Details */}
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

            {/* Details Grid */}
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

            {/* Map */}
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
              />
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

            {/* Total Price */}
            <div className="bp-price-total">
              <div>
                <div className="bp-price-label">Total Paid Amount</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  {booking.numberOfSeats} seat(s) × ₹{(booking.totalPrice / booking.numberOfSeats).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bp-price-amount">₹{booking.totalPrice.toLocaleString('en-IN')}</div>
            </div>

            {/* ── Bill Breakdown (on-page) ── */}
            <div style={{ marginTop: '20px', background: '#fff', borderRadius: '12px', border: '2px solid #e8f0fe', overflow: 'hidden' }}>
              {/* Bill header */}
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>🧾 Tax Invoice</div>
                <div style={{ background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>✓ PAID</div>
              </div>

              <div style={{ padding: '16px 18px' }}>
                {/* Invoice meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px', color: '#6b7280' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '13px' }}>Invoice No: INV-{booking.ticketId}</div>
                    <div style={{ marginTop: '2px' }}>Order ID: {booking.paymentOrderId || 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '13px' }}>Payment: Cashfree</div>
                    <div style={{ marginTop: '2px' }}>{bookedAt}</div>
                  </div>
                </div>

                {/* Fare rows */}
                {[
                  { label: `Base Fare (${booking.numberOfSeats} seat${booking.numberOfSeats > 1 ? 's' : ''})`, val: Math.round(booking.totalPrice * 0.95), accent: false },
                  { label: 'GST & Service Tax (5%)',                                                             val: Math.round(booking.totalPrice * 0.05), accent: false },
                  { label: 'Payment Gateway Fee',                                                                val: 0,                                      accent: false },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px', color: '#374151' }}>
                    <span>{row.label}</span>
                    <span style={{ fontWeight: 500 }}>₹{row.val === 0 ? '0.00' : row.val.toLocaleString('en-IN')}</span>
                  </div>
                ))}

                {/* Grand total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: '10px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                  <span>Grand Total Paid</span>
                  <span style={{ color: '#ff6b35', fontSize: '17px' }}>₹{booking.totalPrice.toLocaleString('en-IN')}</span>
                </div>

                <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '10px', marginBottom: 0 }}>
                  This is a computer-generated invoice · Powered by TrainBook
                </p>
              </div>
            </div>
          </div>

          {/* Tear */}
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

          {/* Action Buttons */}
          <div className="bp-actions" style={{ flexWrap: 'wrap' }}>
            <button className="bp-action-btn primary" onClick={() => window.print()} id="print-ticket-btn">
              🖨️ Print Ticket
            </button>
            <button
              className="bp-action-btn secondary"
              id="download-bill-btn"
              onClick={() => generateBillPDF(booking)}
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none' }}
            >
              📄 Download Bill PDF
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
