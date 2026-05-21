import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Crown, Download, Lock } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { API_BASE } from '../config';
import appLogo from '../assets/logo.png';

const Dashboard = () => {
  const [inputType, setInputType] = useState('url');
  const [inputData, setInputData] = useState({ url: '', text: '', upiId: '', upiName: '', upiAmount: '', email: '', phone: '' });
  const [blockColor, setBlockColor] = useState('#000000');
  const [eyeColor, setEyeColor] = useState('#000000');
  const [pattern, setPattern] = useState('square');
  const [eyePattern, setEyePattern] = useState('square');
  const [qrs, setQrs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [customLogo, setCustomLogo] = useState('');
  const [downloadRes, setDownloadRes] = useState('500');

  const navigate = useNavigate();
  const qrRef = useRef(null);
  const qrCode = useRef(new QRCodeStyling({
    width: 250,
    height: 250,
    margin: 10,
    imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 5 }
  }));

  const computedData = useMemo(() => {
    switch (inputType) {
      case 'text': return inputData.text;
      case 'upi': return `upi://pay?pa=${inputData.upiId}&pn=${inputData.upiName}${inputData.upiAmount ? `&am=${inputData.upiAmount}` : ''}`;
      case 'email': return `mailto:${inputData.email}`;
      case 'phone': return `tel:${inputData.phone}`;
      case 'url':
      default: return inputData.url;
    }
  }, [inputType, inputData]);

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
      const logoUrl = user.tier === 'free' ? appLogo : (customLogo || (user.customLogoUrl ? (user.customLogoUrl.startsWith('http') ? user.customLogoUrl : `${API_BASE}${user.customLogoUrl}`) : appLogo));
      
      qrCode.current.update({
        data: computedData || 'https://qrgenius.com',
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
  }, [computedData, blockColor, eyeColor, pattern, eyePattern, user, customLogo]);

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
    if (!computedData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/qr/generate`, 
        { type: 'static', data: computedData, blockColor, eyeColor, pattern, eyePattern, logo: 'default', qrImageUrl: qrBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInputData({ url: '', text: '', upiId: '', upiName: '', upiAmount: '', email: '', phone: '' });
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
              <label>Input Type</label>
              <select className="input-field" value={inputType} onChange={e => setInputType(e.target.value)}>
                <option value="url">URL</option>
                <option value="text">Text</option>
                <option value="email">Email Address</option>
                <option value="phone">Phone Number</option>
                <option value="upi">UPI Payment</option>
              </select>
            </div>
            
            {inputType === 'url' && (
              <div className="input-group">
                <label>URL</label>
                <input type="url" className="input-field" value={inputData.url} onChange={e => setInputData({...inputData, url: e.target.value})} placeholder="https://example.com" />
              </div>
            )}
            {inputType === 'text' && (
              <div className="input-group">
                <label>Text</label>
                <textarea className="input-field" value={inputData.text} onChange={e => setInputData({...inputData, text: e.target.value})} placeholder="Enter your text here" rows="3" />
              </div>
            )}
            {inputType === 'email' && (
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" className="input-field" value={inputData.email} onChange={e => setInputData({...inputData, email: e.target.value})} placeholder="example@email.com" />
              </div>
            )}
            {inputType === 'phone' && (
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" className="input-field" value={inputData.phone} onChange={e => setInputData({...inputData, phone: e.target.value})} placeholder="+1234567890" />
              </div>
            )}
            {inputType === 'upi' && (
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="input-group">
                  <label>UPI ID</label>
                  <input type="text" className="input-field" value={inputData.upiId} onChange={e => setInputData({...inputData, upiId: e.target.value})} placeholder="john@upi" />
                </div>
                <div className="input-group">
                  <label>Payee Name</label>
                  <input type="text" className="input-field" value={inputData.upiName} onChange={e => setInputData({...inputData, upiName: e.target.value})} placeholder="John Doe" />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Amount (Optional)</label>
                  <input type="number" className="input-field" value={inputData.upiAmount} onChange={e => setInputData({...inputData, upiAmount: e.target.value})} placeholder="0.00" />
                </div>
              </div>
            )}
            
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
          <div ref={qrRef} style={{ background: '#fff', padding: '10px', borderRadius: '12px', marginBottom: '1.5rem' }} />
          
          <div className="grid-2" style={{ width: '100%', gap: '1rem' }}>
             <select className="input-field" value={downloadRes} onChange={e => setDownloadRes(e.target.value)} style={{ padding: '0.5rem' }}>
                <option value="250">250x250 (Small)</option>
                <option value="500">500x500 (Medium)</option>
                <option value="1000">1000x1000 (Large)</option>
                <option value="2000">2000x2000 (Print)</option>
             </select>
             <button type="button" className="btn btn-outline" onClick={() => {
                const res = parseInt(downloadRes);
                qrCode.current.update({ width: res, height: res });
                qrCode.current.download({ extension: 'png', name: 'qr-code-hq' }).then(() => {
                   qrCode.current.update({ width: 250, height: 250 });
                });
             }}>
                <Download size={16} /> Download
             </button>
          </div>
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
