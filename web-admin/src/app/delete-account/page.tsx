import React from 'react';

export const metadata = {
  title: 'Request Account & Data Deletion - MonthlyGrocery',
  description: 'Official account and user data deletion request portal for MonthlyGrocery and Merchant partner apps.',
};

export default function DeleteAccountPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      padding: '40px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      color: '#E2E8F0',
      lineHeight: '1.7',
    }}>
      <div style={{
        maxWidth: '750px',
        margin: '0 auto',
        backgroundColor: '#1E293B',
        padding: '40px 32px',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
      }}>
        <div style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#EF444420', color: '#F87171', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            Data Privacy &amp; User Rights
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0' }}>
            Account &amp; Data Deletion Request
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
            Applications Covered: <strong>MonthlyGrocery</strong> &amp; <strong>MonthlyGrocery Partner (Merchant)</strong>
          </p>
        </div>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
            1. Delete Your Account In-App (Instant)
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px' }}>
            You can delete your account and all associated personal records directly from the mobile app:
          </p>
          <ol style={{ paddingLeft: '20px', color: '#CBD5E1', fontSize: '14px' }}>
            <li>Open the <strong>MonthlyGrocery</strong> app.</li>
            <li>Go to the <strong>Account</strong> / <strong>Profile</strong> tab.</li>
            <li>Tap on <strong>Delete Account</strong> at the bottom.</li>
            <li>Confirm your deletion. Your account will be permanently deleted immediately.</li>
          </ol>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
            2. Request Deletion via Web Support
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px' }}>
            If you no longer have the app installed, send an email to our data privacy team:
          </p>
          <div style={{ backgroundColor: '#0F172A', padding: '16px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 6px 0', color: '#F1F5F9', fontWeight: 600 }}>📧 Email: <a href="mailto:monthlygrocery7@gmail.com" style={{ color: '#38BDF8' }}>monthlygrocery7@gmail.com</a></p>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>Subject: <strong>Account Deletion Request - [Your Registered Phone Number]</strong></p>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            Please include your registered mobile number and full name. Requests sent by email are processed within <strong>48 to 72 hours</strong>.
          </p>
        </section>

        <section style={{ borderTop: '1px solid #334155', paddingTop: '20px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
            What data is deleted?
          </h2>
          <ul style={{ paddingLeft: '20px', color: '#94A3B8', fontSize: '14px' }}>
            <li>Personal profile details (Name, Phone Number, Avatar).</li>
            <li>All saved delivery addresses and geographical location records.</li>
            <li>Saved cart items, baskets, and order preferences.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
