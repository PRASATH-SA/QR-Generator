import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <div className="glass" style={{ padding: '3rem' }}>
        <h1 className="mb-4 text-gradient">Data Privacy Policy</h1>
        <p className="text-muted mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h3 className="mt-8 mb-2">1. Information We Collect</h3>
        <p className="text-muted mb-4">
          We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This includes your name, email, and password.
        </p>

        <h3 className="mt-8 mb-2">2. How We Use Information</h3>
        <p className="text-muted mb-4">
          We use the information we collect about you to provide, maintain, and improve our services, including facilitating payments and creating your QR codes.
        </p>

        <h3 className="mt-8 mb-2">3. Data Sharing and Security</h3>
        <p className="text-muted mb-4">
          We do not sell or share your personal information with third parties except as necessary to provide our services (e.g., Cashfree for payment processing). We employ industry-standard security measures to protect your data.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
