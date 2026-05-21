import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PaymentTerms from './pages/PaymentTerms';
import { QrCode } from 'lucide-react';
import heroLogo from './assets/hero.png';

const SplashScreen = ({ onFinish }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-color)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeOut 0.5s ease 2s forwards'
    }}>
      <img src={heroLogo} alt="Splash Logo" className="animate-fade-in" style={{ width: '150px', animation: 'pulse 1s infinite alternate' }} />
    </div>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="container navbar">
      <Link to="/" className="nav-logo text-gradient">
        <img src={heroLogo} alt="QRGenius Logo" style={{ height: '32px', objectFit: 'contain' }} />
        QRGenius
      </Link>
      <div className="nav-links">
        {token ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary">Sign Up Free</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="footer container">
    <div>&copy; {new Date().getFullYear()} QRGenius. All rights reserved.</div>
    <div className="footer-links">
      <Link to="/terms" className="footer-link">Terms & Conditions</Link>
      <Link to="/privacy" className="footer-link">Privacy Policy</Link>
      <Link to="/payment-terms" className="footer-link">Payment Terms</Link>
    </div>
  </footer>
);

function App() {
  const [showSplash, setShowSplash] = React.useState(false);

  React.useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
        localStorage.setItem('hasVisited', 'true');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Router>
      {showSplash && <SplashScreen />}
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/payment-terms" element={<PaymentTerms />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
