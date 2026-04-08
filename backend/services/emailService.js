const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendTicketEmail = async (bookingData) => {
  const {
    ticketId, passengers, email, phone,
    trainName, trainNumber, source, destination,
    departureTime, arrivalTime, travelDate,
    numberOfSeats, totalPrice, bookedAt,
    seatType, seatTypeLabel
  } = bookingData;

  const formattedDate = new Date(travelDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedBookedAt = new Date(bookedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Train Ticket - ${ticketId}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px;text-align:center;">
      <div style="display:inline-block;background:#ff6b35;color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:2px;margin-bottom:16px;">TRAINBOOK</div>
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;">🎫 Your Ticket is Confirmed!</h1>
      <p style="color:#a0b4c8;margin:8px 0 0;font-size:14px;">Booking confirmed. Have a safe journey!</p>
    </div>

    <!-- Ticket ID Banner -->
    <div style="background:#ff6b35;padding:16px 32px;text-align:center;">
      <p style="color:#fff;margin:0;font-size:13px;letter-spacing:1px;">TICKET ID</p>
      <p style="color:#fff;font-size:24px;font-weight:800;margin:4px 0;letter-spacing:3px;">${ticketId}</p>
    </div>

    <!-- Journey Details -->
    <div style="padding:32px;">
      <div style="background:#f8faff;border-radius:12px;padding:24px;margin-bottom:24px;border:2px solid #e8f0fe;">
        <h2 style="color:#1a1a2e;font-size:16px;margin:0 0 20px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🚂 Journey Details</h2>
        
        <!-- Route Display -->
        <div style="display:flex;align-items:center;justify-content:space-between;background:#1a1a2e;border-radius:10px;padding:20px;margin-bottom:20px;">
          <div style="text-align:center;">
            <p style="color:#ff6b35;font-size:24px;font-weight:800;margin:0;">${departureTime}</p>
            <p style="color:#ffffff;font-size:14px;margin:4px 0;">${source}</p>
          </div>
          <div style="text-align:center;flex:1;padding:0 20px;">
            <div style="border-top:2px dashed #ff6b35;position:relative;margin:8px 0;">
              <span style="background:#1a1a2e;padding:0 8px;color:#a0b4c8;font-size:11px;position:relative;top:-8px;">✈ </span>
            </div>
            <p style="color:#a0b4c8;font-size:11px;margin:4px 0;text-align:center;">Direct</p>
          </div>
          <div style="text-align:center;">
            <p style="color:#ff6b35;font-size:24px;font-weight:800;margin:0;">${arrivalTime}</p>
            <p style="color:#ffffff;font-size:14px;margin:4px 0;">${destination}</p>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Train Name</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right;">${trainName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Train Number</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right;">${trainNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Seat Class</td>
            <td style="padding:8px 0;font-weight:700;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right;">
              <span style="background:#ff6b35;color:#fff;padding:2px 10px;border-radius:20px;font-size:12px;">${seatTypeLabel || seatType || 'N/A'} (${seatType || ''})</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Travel Date</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:13px;text-align:right;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <!-- Passenger Details -->
      <div style="background:#f8faff;border-radius:12px;padding:24px;margin-bottom:24px;border:2px solid #e8f0fe;">
        <h2 style="color:#1a1a2e;font-size:16px;margin:0 0 20px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">👤 Contact & Passengers</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Email</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Phone</td>
            <td style="padding:8px 0;color:#1a1a2e;font-weight:600;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right;">${phone}</td>
          </tr>
        </table>
        
        <h3 style="color:#6b7280;font-size:12px;text-transform:uppercase;margin:0 0 10px;">Passenger Roster (${numberOfSeats} Seat${numberOfSeats > 1 ? 's' : ''})</h3>
        ${passengers.map((p, index) => `
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;font-size:14px;color:#1a1a2e;">${index + 1}. ${p.name}</span>
              <span style="font-size:12px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:12px;">Aadhar: ${p.aadhar ? p.aadhar.replace(/^(\d{4})(\d{4})(\d{4})$/, 'XXXX-XXXX-$3') : 'N/A'}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Total Amount -->
      <div style="background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="color:#fff;font-size:13px;margin:0;opacity:0.9;">TOTAL AMOUNT PAID</p>
        <p style="color:#fff;font-size:36px;font-weight:800;margin:4px 0;">₹${totalPrice.toLocaleString('en-IN')}</p>
        <p style="color:#fff;font-size:12px;margin:0;opacity:0.8;">${numberOfSeats} seat(s) × ₹${(totalPrice / numberOfSeats).toLocaleString('en-IN')}/seat · ${seatTypeLabel || seatType}</p>
      </div>

      <!-- Important Note -->
      <div style="background:#fff8f0;border-left:4px solid #ff6b35;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">📋 Important Instructions:</p>
        <ul style="color:#92400e;font-size:12px;margin:8px 0 0;padding-left:16px;">
          <li>Carry a valid government-issued photo ID during travel</li>
          <li>Report to the platform at least 15 minutes before departure</li>
          <li>Ticket is non-transferable</li>
          <li>Booked on: ${formattedBookedAt}</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1a1a2e;padding:24px;text-align:center;">
      <p style="color:#a0b4c8;font-size:12px;margin:0;">© 2024 TrainBook | For assistance, reply to this email</p>
      <p style="color:#6b7280;font-size:11px;margin:8px 0 0;">This is an auto-generated ticket. Please keep it safe.</p>
    </div>
  </div>
</body>
</html>
  `;

  const transporter = createTransporter();

  const mailOptions = {
    from: `"TrainBook 🚂" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Ticket Confirmed! ${ticketId} | ${trainName} | ${source} → ${destination}`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('📧 Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendTicketEmail };
