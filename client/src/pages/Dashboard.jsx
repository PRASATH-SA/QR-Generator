import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Crown, Download, Lock } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { API_BASE } from '../config';
const Dashboard = () => {
  const [data, setData] = useState('');
  const [blockColor, setBlockColor] = useState('#000000');
  const [eyeColor, setEyeColor] = useState('#000000');
  const [pattern, setPattern] = useState('square');
  const [eyePattern, setEyePattern] = useState('square');
  const [qrs, setQrs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [customLogo, setCustomLogo] = useState('');

  const navigate = useNavigate();
  const qrRef = useRef(null);
  const qrCode = useRef(new QRCodeStyling({
    width: 250,
    height: 250,
    margin: 10,
    imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 5 }
  }));

  useEffect(() => {
    const fetchUser = () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/login');
      } else {
        setUser(JSON.parse(storedUser));
        fetchQrs();
      }
    };
    fetchUser();
  }, [navigate]);

  // Update QR code live preview
  useEffect(() => {
    if (qrRef.current && user) {
      // SVG with width and height so qr-code-styling can render it
      const defaultPLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSI1MCIgeT0iNzAiIGZvbnQtc2l6ZT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2MzY2ZjEiPlA8L3RleHQ+PC9zdmc+';
      const logoUrl = user.tier === 'free' ? defaultPLogo : (customLogo || (user.customLogoUrl ? (user.customLogoUrl.startsWith('http') ? user.customLogoUrl : `${API_BASE}${user.customLogoUrl}`) : ''));
      
      qrCode.current.update({
        data: data || 'https://qrgenius.com',
        dotsOptions: { color: blockColor, type: pattern },
        cornersSquareOptions: { color: eyeColor, type: eyePattern },
        cornersDotOptions: { color: eyeColor, type: eyePattern === 'square' ? 'square' : 'dot' },
        image: logoUrl,
        imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 5, crossOrigin: "anonymous" }
      });
      qrCode.current.append(qrRef.current);
      
      // Capture the base64 for saving
      qrCode.current.getRawData('png').then(buffer => {
        if (!buffer) return;
        const reader = new FileReader();
        reader.readAsDataURL(buffer); 
        reader.onloadend = () => {
          setQrBase64(reader.result);
        }
      }).catch(err => console.error("Could not capture QR Base64"));
    }
  }, [data, blockColor, eyeColor, pattern, eyePattern, user]);

  const fetchQrs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/qr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!data) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/qr/generate`, 
        { type: 'static', data, blockColor, eyeColor, pattern, eyePattern, logo: 'default', qrImageUrl: qrBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData('');
      fetchQrs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPro = async () => {
    try {
      const token = localStorage.getItem('token');
      // Create Cashfree Subscription (UPI AutoPay)
      const { data: subData } = await axios.post(`${API_BASE}/api/payments/create-subscription`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Initialize Cashfree SDK using hosted script
      const cashfree = window.Cashfree({
        mode: 'sandbox' // or sandbox based on env
      });

      if (!subData?.subscriptionSessionId) {
        throw new Error('Subscription session ID is missing from server response');
      }

      // Open Cashfree Checkout Modal for Subscriptions
      cashfree.subscriptionsCheckout({
        subsSessionId: subData.subscriptionSessionId,
        redirectTarget: "_self",
      }).then(async (result) => {
        if(result.error){
            alert("Payment failed or cancelled: " + result.error.message);
        } else if(result.paymentDetails) {
            // Verify Subscription
            const res = await axios.post(`${API_BASE}/api/payments/verify-subscription`, { subscriptionId: subData.subscriptionId }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
              localStorage.setItem('user', JSON.stringify(res.data.user));
              localStorage.setItem('token', res.data.token);
              setUser(res.data.user);
              alert('Subscription Successful! Upgraded to Pro Member.');
            }
        } else if(result.redirect) {
            console.log("Redirecting...");
        }
      });
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Payment initiation failed. See console for details.");
    }
  };

  if (!user) return null;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <header className="flex-between">
        <h2>Welcome, {user.name}</h2>
        {user.tier === 'free' ? (
          <button onClick={upgradeToPro} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
            <Crown size={18} /> Upgrade to Pro (Rs. 80/mo)
          </button>
        ) : (
          <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <Crown size={18} /> Pro Member
          </span>
        )}
      </header>

      <div className="grid-2">
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 className="mb-4">Create & Customize</h3>
          <form onSubmit={handleGenerate}>
            <div className="input-group">
              <label>Data URL / Text</label>
              <input type="text" className="input-field" value={data} onChange={e => setData(e.target.value)} placeholder="https://example.com" />
            </div>
            
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label>Block Color</label>
                <input type="color" className="input-field" value={blockColor} onChange={e => setBlockColor(e.target.value)} style={{ height: '40px', padding: '0.2rem' }} />
              </div>
              <div className="input-group">
                <label>Eye Color</label>
                <input type="color" className="input-field" value={eyeColor} onChange={e => setEyeColor(e.target.value)} style={{ height: '40px', padding: '0.2rem' }} />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label>Pattern Style</label>
                <select className="input-field" value={pattern} onChange={e => setPattern(e.target.value)}>
                  <option value="square">Square</option>
                  <option value="dots">Dots</option>
                  <option value="rounded">Rounded</option>
                  <option value="classy">Classy</option>
                  <option value="classy-rounded">Classy Rounded</option>
                </select>
              </div>
              <div className="input-group">
                <label>Eye Frame Style</label>
                <select className="input-field" value={eyePattern} onChange={e => setEyePattern(e.target.value)}>
                  <option value="square">Square</option>
                  <option value="dot">Dot</option>
                  <option value="extra-rounded">Extra Rounded</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Custom Logo Upload</label>
              {user.tier === 'free' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <Lock size={16} /> Premium Feature
                </div>
              ) : (
                <input type="file" className="input-field" accept="image/*" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setCustomLogo(ev.target.result);
                    reader.readAsDataURL(file);

                    // Upload to server to persist
                    const formData = new FormData();
                    formData.append('logo', file);
                    try {
                      const token = localStorage.getItem('token');
                      const res = await axios.post(`${API_BASE}/api/auth/upload-logo`, formData, {
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                      });
                      if (res.data.user) {
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                        setUser(res.data.user);
                      }
                    } catch (err) {
                      console.error('Logo upload failed', err);
                    }
                  }
                }} />
              )}
            </div>

            <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save QR Code'}
            </button>
          </form>
        </div>

        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="mb-4">Live Preview</h3>
          <div ref={qrRef} style={{ background: '#fff', padding: '10px', borderRadius: '12px' }} />
        </div>
      </div>

      <div className="glass mt-8" style={{ padding: '2rem' }}>
        <h3 className="mb-4">Your Saved QR Codes</h3>
        <div className="grid-auto-fill">
          {qrs.map(qr => (
            <div key={qr._id} className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
              <img src={qr.qrImageUrl} alt="QR Code" style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.5rem' }}>
                {qr.data}
              </div>
              <a href={qr.qrImageUrl} download={`qr-${qr._id}.png`} className="btn btn-outline" style={{ padding: '0.5rem', width: '100%', fontSize: '0.8rem' }}>
                <Download size={14} /> Download
              </a>
            </div>
          ))}
          {qrs.length === 0 && <p className="text-muted">No QR codes generated yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
