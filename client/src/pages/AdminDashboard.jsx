import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Users, CreditCard, Activity, Trash2, Shield, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';

const AdminDashboard = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/users`, { headers }),
        axios.get(`${API_BASE}/api/admin/stats`, { headers })
      ]);
      
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async (userId, currentTier) => {
    try {
      const newTier = currentTier === 'free' ? 'paid' : 'free';
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/api/admin/users/${userId}/tier`, { tier: newTier }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update tier');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and all their QR codes? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading admin dashboard...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/dashboard" className="btn btn-outline" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <Shield color="var(--primary)" /> Admin Dashboard
        </h1>
      </div>

      {error && <div style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{error}</div>}

      {stats && (
        <div className="grid-auto-fill" style={{ marginBottom: '3rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="glass p-card text-center">
            <Users size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3>Total Users</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</div>
          </div>
          <div className="glass p-card text-center">
            <CreditCard size={32} color="#ec4899" style={{ marginBottom: '1rem' }} />
            <h3>Premium Users</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.paidUsers}</div>
          </div>
          <div className="glass p-card text-center">
            <Activity size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3>Total QRs</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalQRCodes}</div>
          </div>
          <div className="glass p-card text-center">
            <Activity size={32} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
            <h3>Dynamic QRs</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.dynamicQRCodes}</div>
          </div>
        </div>
      )}

      <div className="glass p-card" style={{ overflowX: 'auto' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>User Management</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Tier</th>
              <th style={{ padding: '1rem' }}>QRs</th>
              <th style={{ padding: '1rem' }}>Last Login</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem' }}>
                  {u.name} {u.isAdmin && <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', marginLeft: '5px' }}>ADMIN</span>}
                </td>
                <td style={{ padding: '1rem' }}>{u.email}</td>
                <td style={{ padding: '1rem' }}>
                  {u.isVerified ? (
                    <span style={{ color: '#10b981' }}>Verified</span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>Pending</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: u.tier === 'paid' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: u.tier === 'paid' ? '#ec4899' : '#64748b',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}>
                    {u.tier.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{u.qrCount}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleTierChange(u._id, u.tier)}
                      className="btn"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                      disabled={u.isAdmin}
                    >
                      {u.tier === 'free' ? 'Make Premium' : 'Revoke Premium'}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u._id)}
                      className="btn"
                      style={{ padding: '0.4rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                      disabled={u.isAdmin}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
