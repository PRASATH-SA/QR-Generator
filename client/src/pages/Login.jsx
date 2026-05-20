import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { API_BASE } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <div className="glass animate-fade-in p-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-8">Welcome Back</h2>
        {error && <div style={{ color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
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
        <div className="text-center mt-4 text-muted">
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
