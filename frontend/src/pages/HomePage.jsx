import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tripType, setTripType] = useState('one-way');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from.trim()) params.set('source', from.trim());
    if (to.trim()) params.set('destination', to.trim());
    navigate(`/trains?${params.toString()}`);
  };

  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  const popularRoutes = [
    { from: 'New Delhi', to: 'Mumbai Central' },
    { from: 'Howrah', to: 'New Delhi' },
    { from: 'Chennai Central', to: 'Mumbai CST' },
    { from: 'New Delhi', to: 'Bangalore' },
    { from: 'Mumbai CST', to: 'Patna' },
    { from: 'Pune', to: 'Mumbai CST' },
  ];

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge">🚂&nbsp; Book Train Tickets Instantly</div>

          <h1 className="hero-title">
            Travel Smarter,<br />
            <span className="highlight">Book Faster</span>
          </h1>

          <p className="hero-subtitle">
            Find the best trains across India. Compare prices, check availability, and book in seconds.
          </p>

          {/* Stats */}
          <div className="hero-stats">
            {[
              { val: '500+', lbl: 'Train Routes' },
              { val: '12',   lbl: 'Cities Covered' },
              { val: '₹380', lbl: 'Lowest Price' },
              { val: '99.2%',lbl: 'On-Time Rate' },
            ].map((s, i) => (
              <div className="hero-stat" key={i}>
                <div className="hero-stat-value">{s.val}</div>
                <div className="hero-stat-label">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHITE SEARCH BOX – overlapping hero bottom ── */}
        <form onSubmit={handleSearch} className="search-box">
          <div className="search-box-inner">
            {/* Trip type tabs */}
            <div className="search-tabs">
              {['one-way', 'round-trip'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`search-tab ${tripType === t ? 'active' : ''}`}
                  onClick={() => setTripType(t)}
                >
                  {t === 'one-way' ? '➜ One Way' : '⇌ Round Trip'}
                </button>
              ))}
            </div>

            {/* Inputs row */}
            <div className="search-grid">
              <div className="search-field">
                <label>From</label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  id="search-from"
                />
              </div>

              <div className="search-field" style={{ position: 'relative' }}>
                <label>To</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    id="search-to"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleSwap}
                    title="Swap stations"
                    style={{
                      background: '#f4f6f9',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '10px',
                      width: '42px', height: '44px',
                      cursor: 'pointer', fontSize: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.22s ease', color: '#374151'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B35'; e.currentTarget.style.color = '#FF6B35'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                  >⇌</button>
                </div>
              </div>

              <div className="search-field">
                <label>Departure Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  id="search-date"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <button type="submit" className="search-btn" id="search-submit-btn">
                <span>🔍</span> Search Trains
              </button>
            </div>

            <div className="search-divider" />

            {/* Bottom stats strip inside card */}
            <div style={{
              display: 'flex', gap: '28px', padding: '16px 0',
              flexWrap: 'wrap'
            }}>
              {[
                { icon: '✅', text: 'Instant Confirmation' },
                { icon: '📧', text: 'Email Ticket' },
                { icon: '🪑', text: 'Real-time Availability' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                  <span>{f.icon}</span> {f.text}
                </div>
              ))}
            </div>
          </div>
        </form>
      </section>

      {/* ── POPULAR ROUTES ── */}
      <section className="popular-section">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="section-badge">Popular Routes</div>
          <h2 className="section-title" style={{ margin: '10px 0 0' }}>
            Top Train Routes in India
          </h2>
        </div>

        <div className="routes-grid">
          {popularRoutes.map((r, i) => (
            <button
              key={i}
              className="route-card"
              onClick={() => navigate(`/trains?source=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}`)}
            >
              <div>
                <div className="route-card-from">{r.from}</div>
                <div className="route-card-arrow">↓</div>
                <div className="route-card-to">{r.to}</div>
              </div>
              <div className="route-card-icon">→</div>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button
            onClick={() => navigate('/trains')}
            className="search-btn"
            style={{ display: 'inline-flex', margin: '0 auto' }}
          >
            🚂 View All Trains
          </button>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section">
        <div className="how-inner">
          <h2 className="how-title">How It Works</h2>
          <p className="how-subtitle">Book your train ticket in just 3 easy steps</p>
          <div className="how-grid">
            {[
              { step: '01', icon: '🔍', title: 'Search Trains', desc: 'Enter your source and destination to find available trains.' },
              { step: '02', icon: '📝', title: 'Fill Details', desc: 'Enter passenger info and select number of seats.' },
              { step: '03', icon: '🎫', title: 'Get Ticket', desc: 'Instant ticket confirmation sent to your email.' },
            ].map((item, i) => (
              <div key={i} className="how-card">
                <div className="how-step-num">{item.step}</div>
                <div className="how-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        © 2024 TrainBook · Built with ❤️ using MERN Stack · Made for Indian Railways
      </footer>
    </div>
  );
}
