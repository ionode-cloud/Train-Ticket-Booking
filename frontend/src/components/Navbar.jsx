import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="navbar-logo-icon">🚂</div>
        <div>
          <div className="navbar-logo-text">Train<span>Book</span></div>
          <div className="navbar-tagline">Fast · Reliable · Simple</div>
        </div>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'rgba(255,107,53,0.15)',
          border: '1px solid rgba(255,107,53,0.28)',
          color: '#FF6B35',
          padding: '5px 13px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          🇮🇳 INDIA RAIL
        </div>
      </div>
    </nav>
  );
}
