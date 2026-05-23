import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail } from 'lucide-react';
import { API_BASE } from '../config';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, { name, email, password });
      setIsOtpSent(true);
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.post(`${API_BASE}/api/auth/verify-email`, { email, otp });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <div className="glass animate-fade-in p-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-8">{isOtpSent ? 'Verify Email' : 'Create Account'}</h2>
        {error && <div style={{ color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ color: '#4CAF50', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        
        {!isOtpSent ? (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>Name</label>
              <input type="text" required className="input-field" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" required className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" required className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>
              <UserPlus size={18} /> Register
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <label>Enter OTP sent to {email}</label>
              <input type="text" required className="input-field" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" />
            </div>
            <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>
              <Mail size={18} /> Verify & Login
            </button>
          </form>
        )}
        
        <div className="text-center mt-4 text-muted">
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
