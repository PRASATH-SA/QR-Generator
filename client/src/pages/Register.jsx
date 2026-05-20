import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { API_BASE } from '../config';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/auth/register`, { name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <div className="glass animate-fade-in p-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-8">Create Account</h2>
        {error && <div style={{ color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
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
        <div className="text-center mt-4 text-muted">
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
