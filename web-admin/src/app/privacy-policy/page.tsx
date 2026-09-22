import React from 'react';

export const metadata = {
  title: 'Privacy Policy - EVER & EVER MERCHANT',
  description: 'Privacy Policy for EVER and EVER MERCHANT grocery applications.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#334155'
    }}>
      <div style={{
        maxWidth: '850px',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E2E8F0'
      }}>
        <h1 style={{ color: '#0F172A', fontSize: '28px', marginBottom: '8px', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
          <strong>Effective Date:</strong> January 1, 2026 | <strong>Apps:</strong> EVER &amp; EVER MERCHANT
        </p>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1E293B', fontSize: '20px', marginBottom: '10px' }}>1. Introduction</h2>
          <p style={{ lineHeight: '1.7', fontSize: '15px' }}>
            Welcome to EVER. We are committed to protecting your personal data and your privacy. This policy explains how we collect, use, and safeguard information when you use our customer application (EVER) and partner application (EVER MERCHANT).
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1E293B', fontSize: '20px', marginBottom: '10px' }}>2. Data We Collect</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '15px' }}>
            <li><strong>Personal Contact Information:</strong> Name, phone number, and address provided for user verification and order deliveries.</li>
            <li><strong>Location Permissions:</strong> Foreground and background location access (optional/as needed) to identify nearby merchant stores, confirm delivery addresses, and track real-time delivery orders.</li>
            <li><strong>Camera &amp; Gallery:</strong> Required for merchant store verification, uploading shop documents, and customer profile updates.</li>
            <li><strong>Order History:</strong> Past grocery orders, selected delivery slots, and payment transaction references.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1E293B', fontSize: '20px', marginBottom: '10px' }}>3. How We Use Data</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '15px' }}>
            <li>To manage and deliver grocery orders quickly and accurately.</li>
            <li>To authenticate accounts via SMS OTP and secure JWT tokens.</li>
            <li>To enable merchant store owners to manage catalogs, pricing, and orders.</li>
            <li>To provide timely customer assistance and notifications.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1E293B', fontSize: '20px', marginBottom: '10px' }}>4. Data Protection &amp; Security</h2>
          <p style={{ lineHeight: '1.7', fontSize: '15px' }}>
            We do not sell or rent your personal data to third parties. All communications with our servers are encrypted using modern SSL/HTTPS protocols. We store data securely in compliance with applicable data protection laws.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1E293B', fontSize: '20px', marginBottom: '10px' }}>5. Account Deletion &amp; Data Rights</h2>
          <p style={{ lineHeight: '1.7', fontSize: '15px' }}>
            Users have the full right to delete their account and associated data directly through the in-app "Delete Account" setting or by contacting our support team at monthlygrocery7@gmail.com.
          </p>
        </section>

        <section style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
          <h2 style={{ color: '#1E293B', fontSize: '18px', marginBottom: '10px' }}>6. Contact Us</h2>
          <p style={{ lineHeight: '1.7', fontSize: '15px' }}>
            If you have questions about this policy, please reach out to us at:<br />
            <strong>Email:</strong> monthlygrocery7@gmail.com / support@monthlygrocery.in<br />
            <strong>Website:</strong> <a href="https://monthlygrocery.in" style={{ color: '#1E7A46' }}>https://monthlygrocery.in</a>
          </p>
        </section>
      </div>
    </div>
  );
}
