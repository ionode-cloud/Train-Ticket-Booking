import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import { useToast } from '../components/Toast';

const API = import.meta.env.VITE_API_URL;

const getBadgeClass = (type) => {
  const map = {
    'Rajdhani': 'badge-rajdhani',
    'Shatabdi': 'badge-shatabdi',
    'Duronto':  'badge-duronto',
    'Express':  'badge-express',
    'Superfast':'badge-superfast',
    'Mail':     'badge-mail',
    'Local':    'badge-local'
  };
  return map[type] || 'badge-express';
};

const getSeatsClass = (seats) => {
  if (seats === 0)    return 'seats-none';
  if (seats <= 20)    return 'seats-low';
  return 'seats-good';
};

/* ── Generate a 7-day date strip starting today ── */
function buildDateStrip() {
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = [];
  const today  = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      dayName: days[d.getDay()],
      dayNum:  d.getDate(),
      month:   months[d.getMonth()],
      iso:     d.toISOString().split('T')[0]
    });
  }
  return result;
}

function TrainCard({ train, index, onBook }) {
  // Use the first available seat type as default, or fallback
  const fallbackSeat = { code: 'GN', label: 'General', price: train.price, availableSeats: train.availableSeats, totalSeats: train.totalSeats };
  const seatTypes = (train.seatTypes && train.seatTypes.length > 0) ? train.seatTypes : [fallbackSeat];
  
  const [selectedSeatCode, setSelectedSeatCode] = useState(seatTypes[0].code);
  const selectedSeat = seatTypes.find(s => s.code === selectedSeatCode) || seatTypes[0];

  return (
    <div className="train-card" style={{ animationDelay: `${index * 0.07}s` }}>
      {/* Top */}
      <div className="train-card-top">
        <div className="train-top-left">
          <img className="train-image" src={train.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400'} alt={train.trainName} />
          <div className="train-info">
            <div className="train-name">{train.trainName}</div>
            <div className="train-number">#{train.trainNumber}</div>
          </div>
        </div>
        <span className={`train-type-badge ${getBadgeClass(train.trainType)}`}>
          {train.trainType}
        </span>
      </div>

      {/* Middle – Route */}
      <div className="train-card-middle">
        <div className="time-block">
          <div className="time-value">{train.departureTime}</div>
          <div className="time-station">{train.source}</div>
          <div className="time-station-code">{train.sourceCode}</div>
        </div>

        <div className="journey-line">
          <div className="journey-line-track">
            <div className="journey-dot" />
            <div className="journey-dashes" />
            <div className="journey-train-icon">🚂</div>
            <div className="journey-dashes" />
            <div className="journey-dot" />
          </div>
          <div className="journey-duration">{train.duration} · Direct</div>
        </div>

        <div className="time-block" style={{ textAlign: 'right' }}>
          <div className="time-value">{train.arrivalTime}</div>
          <div className="time-station">{train.destination}</div>
          <div className="time-station-code">{train.destinationCode}</div>
        </div>
      </div>

      {/* Seat Type Options */}
      <div className="seat-type-row">
        {seatTypes.map(st => (
          <button
            key={st.code}
            className={`seat-pill ${selectedSeatCode === st.code ? 'active' : ''} ${st.availableSeats === 0 ? 'waitlist' : ''}`}
            onClick={() => setSelectedSeatCode(st.code)}
          >
            <div className="seat-pill-code">{st.code}</div>
            <div className="seat-pill-label">{st.label}</div>
            <div className="seat-pill-status">
              {st.availableSeats > 0 ? `AVL ${st.availableSeats}` : 'WL'}
            </div>
            <div className="seat-pill-price">₹{st.price.toLocaleString('en-IN')}</div>
          </button>
        ))}
      </div>

      {/* Bottom */}
      <div className="train-card-bottom">
        <div className="seats-info">
          <div className={`seats-badge seats-${getSeatsClass(selectedSeat.availableSeats)}`}>
            🪑 {selectedSeat.availableSeats > 0
              ? (selectedSeat.availableSeats <= 20
                  ? `${selectedSeat.availableSeats} seats left!`
                  : `${selectedSeat.availableSeats} seats available`)
              : 'Waitlist / No seats'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {train.days && train.days.length === 7 ? 'Daily' : train.days?.join(', ')}
          </div>
        </div>

        <div className="price-section">
          <div>
            <div className="price-value">₹{selectedSeat.price.toLocaleString('en-IN')}</div>
            <div className="price-per">per seat</div>
          </div>
          <button
            className="book-btn"
            onClick={() => onBook({ ...train, selectedSeatType: selectedSeatCode })}
            disabled={selectedSeat.availableSeats === 0}
            id={`book-btn-${train._id}-${selectedSeatCode}`}
          >
            {selectedSeat.availableSeats === 0 ? '❌ Full' : '🎫 Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrainsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [trains, setTrains]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [sortBy, setSortBy]           = useState('departure_asc');
  const [searchQuery, setSearchQuery] = useState('');

  const tripType    = searchParams.get('tripType')    || 'one-way';
  const initialDate = searchParams.get('date')        || new Date().toISOString().split('T')[0];
  const returnDate  = searchParams.get('returnDate')  || '';
  
  const [activeTab, setActiveTab] = useState('onward'); // 'onward' or 'return'
  
  // Create date strip and find the index for the initial date
  const dateStrip = useMemo(() => buildDateStrip(), []);
  const initialIdx = dateStrip.findIndex(d => d.iso === (activeTab === 'onward' ? initialDate : returnDate));
  const [activeDateIdx, setActiveDateIdx] = useState(initialIdx !== -1 ? initialIdx : 0);

  // Update activeDateIdx when tab changes
  useEffect(() => {
    const targetDate = activeTab === 'onward' ? initialDate : returnDate;
    const newIdx = dateStrip.findIndex(d => d.iso === targetDate);
    if (newIdx !== -1) setActiveDateIdx(newIdx);
  }, [activeTab, initialDate, returnDate, dateStrip]);

  const rawSource      = searchParams.get('source')      || '';
  const rawDestination = searchParams.get('destination') || '';

  // Effective source/destination depends on the active tab for round trips
  const source      = activeTab === 'onward' ? rawSource      : rawDestination;
  const destination = activeTab === 'onward' ? rawDestination : rawSource;

  const fetchTrains = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sortBy };
      if (source)      params.source      = source;
      if (destination) params.destination = destination;

      const res = await axios.get(`${API}/trains`, { params });
      setTrains(res.data.trains || []);
    } catch {
      addToast('Failed to load trains. Is the backend running?', 'error');
      setTrains([]);
    } finally {
      setLoading(false);
    }
  }, [source, destination, sortBy, addToast]);

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  const handleBookingSuccess = (booking) => {
    setSelectedTrain(null);
    navigate('/confirmation', { state: { booking } });
  };

  const displayedTrains = trains.filter(t => 
    searchQuery === '' || 
    t.trainName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.trainNumber.includes(searchQuery)
  );

  return (
    <div className="trains-page">
      {/* ── Dark header ── */}
      <div className="trains-header">
        <div className="trains-header-inner">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Search
          </button>
          <div className="route-display">
            <div className="route-city">{source || 'All Trains'}</div>
            {source && destination && (
              <>
                <div className="route-arrow">
                  <div className="route-line" />
                  🚂
                  <div className="route-line" />
                </div>
                <div className="route-city">{destination}</div>
              </>
            )}
          </div>
          <div className="trains-meta">
            Showing <span>{displayedTrains.length} train{displayedTrains.length !== 1 ? 's' : ''}</span>
            {source      && ` from ${source}`}
            {destination && ` to ${destination}`}
          </div>
        </div>

        {/* ── Round Trip Tabs ── */}
        {tripType === 'round-trip' && (
          <div className="trip-tabs">
            <button 
              className={`trip-tab ${activeTab === 'onward' ? 'active' : ''}`}
              onClick={() => setActiveTab('onward')}
            >
              <span className="tab-icon">🛫</span>
              <div className="tab-info">
                <div className="tab-label">Onward Trip</div>
                <div className="tab-route">{rawSource} → {rawDestination}</div>
              </div>
            </button>
            <button 
              className={`trip-tab ${activeTab === 'return' ? 'active' : ''}`}
              onClick={() => setActiveTab('return')}
            >
              <span className="tab-icon">🛬</span>
              <div className="tab-info">
                <div className="tab-label">Return Trip</div>
                <div className="tab-route">{rawDestination} → {rawSource}</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── Date strip (Speed Rail style) ── */}
      <div className="date-strip">
        <div className="date-strip-inner">
          {dateStrip.map((d, i) => (
            <button
              key={i}
              className={`date-day ${activeDateIdx === i ? 'active' : ''}`}
              onClick={() => setActiveDateIdx(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="date-day-name">{d.dayName}</div>
              <div className="date-day-num">{d.dayNum}</div>
              <div className="date-day-month">{d.month}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="filter-bar">
        <div className="filter-inner">
          <span className="filter-label">⚙️ Filter &amp; Sort</span>

          <input
            type="text"
            className="search-input"
            placeholder="Search train name or number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            id="sort-select"
          >
            <option value="departure_asc">🕐 Earliest Departure</option>
            <option value="departure_desc">🕙 Latest Departure</option>
            <option value="price_asc">💰 Lowest Price</option>
            <option value="price_desc">💎 Highest Price</option>
          </select>

          <span className="results-count">{displayedTrains.length} result{displayedTrains.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Train list ── */}
      <div className="trains-list-container">
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'white', borderRadius: '16px', padding: '22px',
                marginBottom: '14px', border: '1.5px solid #e5e7eb'
              }}>
                <div className="skeleton" style={{ height: '18px', width: '38%', marginBottom: '14px' }} />
                <div className="skeleton" style={{ height: '38px', width: '100%', marginBottom: '14px' }} />
                <div className="skeleton" style={{ height: '14px', width: '65%' }} />
              </div>
            ))}
          </div>
        ) : displayedTrains.length === 0 ? (
          <div className="no-trains">
            <span className="no-trains-icon">🚫</span>
            <h3>No Trains Found</h3>
            <p>
              {source || destination
                ? `No trains found for ${source}${source && destination ? ' → ' : ''}${destination}. Try adjusting filters.`
                : 'No trains available with current filters.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="search-btn"
              style={{ display: 'inline-flex', margin: '20px auto 0' }}
            >
              ← Search Again
            </button>
          </div>
        ) : (
          displayedTrains.map((train, i) => (
            <TrainCard
              key={train._id}
              train={train}
              index={i}
              onBook={setSelectedTrain}
            />
          ))
        )}
      </div>

      {selectedTrain && (
        <BookingModal
          train={selectedTrain}
          onClose={() => setSelectedTrain(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
