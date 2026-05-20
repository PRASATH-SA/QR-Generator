import React from 'react';

const PaymentTerms = () => {
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <div className="glass" style={{ padding: '3rem' }}>
        <h1 className="mb-4 text-gradient">Payment Terms</h1>
        <p className="text-muted mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h3 className="mt-8 mb-2">1. Pricing and Subscriptions</h3>
        <p className="text-muted mb-4">
          Upgrading to a Premium account requires a one-time payment or subscription as indicated during the checkout process. All payments are securely processed via Cashfree.
        </p>

        <h3 className="mt-8 mb-2">2. Refunds</h3>
        <p className="text-muted mb-4">
          We offer a 7-day money-back guarantee for initial purchases. If you are not satisfied with the Premium features, please contact our support team within 7 days of your purchase.
        </p>

        <h3 className="mt-8 mb-2">3. Payment Gateway</h3>
        <p className="text-muted mb-4">
          By purchasing, you agree to the terms of service of our payment partner, Cashfree. We do not store your credit card details on our servers.
        </p>
      </div>
    </div>
  );
};

export default PaymentTerms;
