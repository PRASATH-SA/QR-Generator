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
        <QrCode size={32} />
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
  return (
    <Router>
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
