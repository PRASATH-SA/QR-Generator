import React from 'react';

const Terms = () => {
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <div className="glass" style={{ padding: '3rem' }}>
        <h1 className="mb-4 text-gradient">Terms and Conditions</h1>
        <p className="text-muted mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h3 className="mt-8 mb-2">1. Acceptance of Terms</h3>
        <p className="text-muted mb-4">
          By accessing and using QRGenius, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
        </p>

        <h3 className="mt-8 mb-2">2. Description of Service</h3>
        <p className="text-muted mb-4">
          QRGenius provides static and dynamic QR code generation services. Free users are limited to our standard "P" logo. Paid users gain access to custom logo uploads and advanced analytics.
        </p>

        <h3 className="mt-8 mb-2">3. User Conduct</h3>
        <p className="text-muted mb-4">
          You agree not to use the generated QR codes for any malicious, illegal, or harmful activities, including but not limited to phishing, malware distribution, or spam.
        </p>
      </div>
    </div>
  );
};

export default Terms;
