# Train Booking App - Walkthrough

## What Was Built

A full-stack MERN Train Ticket Booking App with **no login system**, clean modern UI inspired by the Speed Rail reference design.

---

## Folder Structure

```
Train Booking App/
├── backend/
│   ├── server.js              # Express app with auto-seed
│   ├── .env                   # MongoDB URI + email config
│   ├── package.json
│   ├── seed.js                # 12 Indian train routes
│   ├── models/
│   │   ├── Train.js           # Train schema
│   │   └── Booking.js         # Booking schema with unique Ticket ID
│   ├── routes/
│   │   ├── trainRoutes.js     # GET /api/trains (search + filter + sort)
│   │   └── bookingRoutes.js   # POST /api/book-ticket, GET /api/booking/:id
│   └── services/
│       └── emailService.js    # Nodemailer HTML ticket email
└── frontend/
    ├── index.html
    ├── src/
    │   ├── App.jsx            # Router setup
    │   ├── index.css          # Complete design system
    │   ├── main.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx        # Hero + search + popular routes
    │   │   ├── TrainsPage.jsx      # Train listing + filters
    │   │   └── ConfirmationPage.jsx # Boarding pass ticket
    │   └── components/
    │       ├── Navbar.jsx
    │       ├── BookingModal.jsx    # Booking form
    │       └── Toast.jsx          # Notifications
```

---

## Servers

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:5000 | ✅ Running |
| Frontend | http://localhost:5173 | ✅ Running |
| MongoDB | Atlas Cloud | ✅ Connected + 12 trains seeded |

---

## Pages

### 1. Homepage (/)
- Dark hero with gradient background + grid pattern
- Orange CTA search form (From / To / Date)
- Swap stations button
- 6 popular routes quick-select cards
- "How It Works" 3-step section
- Footer

### 2. Trains Page (/trains)
- Search-filtered results from MongoDB
- Filter chips: All / Budget / Mid / Premium
- Sort dropdown: Earliest / Latest / Price ↑ / Price ↓
- Train cards with: name, number, type badge, departure/arrival times, duration, seats badge, price
- Skeleton loading animation
- "No trains" empty state

### 3. Booking Modal
- Opens on "Book Now"
- Train summary in header (dark gradient with route display)
- Form: Name, Email, Phone, Travel Date, Seats
- Real-time price summary (seats × price)
- Full client-side validation
- Duplicate submission prevention (useRef lock)
- Loading animation while booking

### 4. Confirmation Page (/confirmation)
- Boarding pass design (tear lines, barcodes)
- Ticket ID prominently displayed (TKT-XXXXXXXX)
- All booking and passenger details
- Dynamic barcode graphic generated from ticket ID
- Print button + Book Another button

---

## Email Feature

> **Important**: To enable email sending, update `backend/.env`:
> ```
> EMAIL_USER=your_gmail@gmail.com
> EMAIL_PASS=your_app_password
> ```
> - Use a Gmail App Password (not your regular password)
> - Enable 2FA on Gmail → Generate App Password at myaccount.google.com/apppasswords

The email contains:
- Train name and route with departure/arrival times
- Passenger details table
- Ticket ID prominently displayed
- Total price with seat breakdown
- Important travel instructions

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/trains | Get all trains (with search + filter + sort query params) |
| GET | /api/trains/:id | Get single train |
| POST | /api/book-ticket | Create booking + send email |
| GET | /api/booking/:ticketId | Retrieve booking by ticket ID |

---

## Validation & Safety Features

- ✅ Email format validation (frontend + backend)
- ✅ Indian mobile number validation (10-digit, starts 6-9)
- ✅ Travel date must not be in the past
- ✅ Seat count 1–10 max
- ✅ Duplicate booking prevention (same email + train + date within 30 min)
- ✅ Submit button locked with `useRef` to prevent double-click spam
- ✅ Available seats decremented on booking
