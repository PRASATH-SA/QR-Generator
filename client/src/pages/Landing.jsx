import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Zap, Shield, Crown } from 'lucide-react';

const Landing = () => {
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '4rem' }}>
      <header className="text-center mb-8">
        <h1 style={{ marginBottom: '1rem' }}>
          Dynamic <span className="text-gradient">QR Codes</span> for Professionals
        </h1>
        <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Create stunning, customizable QR codes in seconds. Upgrade to premium for custom logos, advanced analytics, and dynamic redirection.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          Start Generating Free <Zap size={20} />
        </Link>
      </header>

      <section className="glass mt-8 p-card">
        <h2 className="text-center mb-8">Features that scale with you</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass p-card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <QrCode size={48} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Free Tier</h3>
            <p className="text-muted">Create static and dynamic QR codes with our signature logo embedded perfectly.</p>
          </div>

          <div className="glass p-card" style={{ textAlign: 'center', border: '1px solid var(--secondary)' }}>
            <div style={{ color: 'var(--secondary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Crown size={48} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Premium Customization</h3>
            <p className="text-muted">Unlock custom logo uploads. Replace the default logo with your own brand identity.</p>
          </div>

          <div className="glass p-card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Shield size={48} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Secure & Reliable</h3>
            <p className="text-muted">Your data is safe. Dynamic links can be updated anytime without reprinting the code.</p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Landing;
