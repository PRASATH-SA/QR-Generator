import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail } from 'lucide-react';
import { API_BASE } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        setRequiresVerification(true);
        setError('Please verify your email to continue.');
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.post(`${API_BASE}/api/auth/verify-email`, { email, otp });
      // On success, try logging in again
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    try {
      await axios.post(`${API_BASE}/api/auth/resend-otp`, { email });
      setMessage('OTP has been resent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <div className="glass animate-fade-in p-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-8">{requiresVerification ? 'Verify Email' : 'Welcome Back'}</h2>
        {error && <div style={{ color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ color: '#4CAF50', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        
        {!requiresVerification ? (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input type="email" required className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" required className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>
              <LogIn size={18} /> Login
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
            <button type="button" onClick={handleResendOtp} className="btn mt-3" style={{ width: '100%', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
              Resend OTP
            </button>
          </form>
        )}
        
        <div className="text-center mt-4 text-muted">
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
