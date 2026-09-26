import React from 'react';

export const metadata = {
  title: 'Privacy Policy - EVER & EVER MERCHANT',
  description: 'Official Privacy Policy and User Data Handling Policy for EVER and EVER MERCHANT applications.',
};

export default function PrivacyPolicyPage() {
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
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: '#1E293B',
        padding: '48px 36px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
      }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #334155', paddingBottom: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', backgroundColor: '#10B98120', color: '#34D399', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            Official Policy Declaration
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 800, margin: '0 0 10px 0' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
            <strong>Effective Date:</strong> January 1, 2026 | <strong>Last Updated:</strong> September 26, 2026<br />
            <strong>Applications Covered:</strong> EVER (Monthly Grocery Customer App) &amp; EVER MERCHANT (Partner App)
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            1. Introduction &amp; Scope
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px' }}>
            This Privacy Policy describes how <strong>EVER</strong> and <strong>EVER MERCHANT</strong> ("we", "us", or "our") collect, use, store, share, and protect your personal information when you use our mobile applications, websites, and associated cloud grocery delivery services. By accessing or using our services, you consent to the practices described in this policy.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            2. Information We Collect
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px', marginBottom: '12px' }}>
            We only collect information necessary to fulfill grocery orders, authenticate users, and manage merchant partner services:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#38BDF8', fontSize: '16px', margin: '0 0 8px 0' }}>👤 Personal Account Information</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
                Full Name, Mobile Phone Number, Delivery Address, Flat/House Number, Landmark, and optional Email Address for account verification and order dispatch.
              </p>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#38BDF8', fontSize: '16px', margin: '0 0 8px 0' }}>📍 Location &amp; GPS Data</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
                Precise and approximate GPS coordinates, City, and Postal PIN Code to match you with nearby grocery stores, calculate accurate delivery distance fees, and enable order tracking.
              </p>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#38BDF8', fontSize: '16px', margin: '0 0 8px 0' }}>🛒 Order &amp; Transaction Details</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
                Items ordered, monthly grocery baskets, scheduled delivery time slots, order status history, and payment method identifiers (Cash on Delivery or UPI references).
              </p>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#38BDF8', fontSize: '16px', margin: '0 0 8px 0' }}>📷 Merchant Verification Documents</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
                For Store Owners: Shop registration certificates, Aadhaar / FSSAI documents, and store storefront photos strictly for business KYC compliance.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Prominent Location Disclosure */}
        <section style={{ marginBottom: '32px', backgroundColor: '#0F172A', padding: '24px', borderRadius: '14px', border: '1px solid #0284C7' }}>
          <h2 style={{ color: '#38BDF8', fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>
            📍 Prominent Disclosure: Location Data Usage
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '14px', margin: '0 0 10px 0' }}>
            Our applications (EVER and EVER MERCHANT) access location data only when you actively use features requiring geographic precision:
          </p>
          <ul style={{ color: '#94A3B8', fontSize: '14px', paddingLeft: '20px', margin: 0, lineHeight: '1.8' }}>
            <li><strong>Nearby Store Discovery:</strong> To identify which grocery store services your specific residential PIN Code.</li>
            <li><strong>Delivery Distance Calculation:</strong> To compute fair delivery charges based on road distance.</li>
            <li><strong>Driver &amp; Order Navigation:</strong> To ensure grocery orders reach the correct residential destination.</li>
          </ul>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '10px 0 0 0' }}>
            * Location data is never shared with third-party advertisers or data brokers.
          </p>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            3. How We Use Your Information
          </h2>
          <ul style={{ color: '#CBD5E1', fontSize: '15px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Authentication &amp; Security:</strong> Secure One-Time Password (OTP) verification via SMS.</li>
            <li><strong>Order Fulfillment:</strong> Processing, packing, and dispatching monthly grocery items directly to your address.</li>
            <li><strong>Customer Support:</strong> Resolving order inquiries, refunds, and delivery schedule updates.</li>
            <li><strong>Service Improvements:</strong> Optimizing inventory availability and app performance.</li>
          </ul>
        </section>

        {/* Section 5: Third-party Services */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            4. Third-Party Service Providers &amp; SDKs
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px', marginBottom: '12px' }}>
            We work with industry-standard, secure infrastructure partners to operate our services:
          </p>
          <ul style={{ color: '#CBD5E1', fontSize: '15px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Google Maps Platform:</strong> For map rendering, reverse geocoding, and address validation.</li>
            <li><strong>Amazon Web Services (AWS EC2, RDS, S3):</strong> For secure cloud hosting, encrypted database storage, and media delivery.</li>
            <li><strong>Twilio Telecommunications:</strong> For carrier-grade delivery of SMS OTP authentication messages.</li>
          </ul>
          <p style={{ color: '#34D399', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
            ✓ We do NOT sell, rent, or trade your personal data to any external advertising agencies.
          </p>
        </section>

        {/* Section 6: Data Retention & Security */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            5. Data Security &amp; Retention
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px' }}>
            All data transmitted between our mobile applications and cloud servers is protected using Transport Layer Security (TLS/HTTPS 256-bit encryption). Data is stored in secure, access-restricted databases. We retain user order data only as long as necessary to provide service history and comply with legal tax obligations.
          </p>
        </section>

        {/* Section 7: Account Deletion (Google Play Policy Mandatory) */}
        <section style={{ marginBottom: '32px', backgroundColor: '#0F172A', padding: '24px', borderRadius: '14px', border: '1px solid #E11D48' }}>
          <h2 style={{ color: '#FB7185', fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>
            6. User Rights &amp; Account / Data Deletion Policy
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px', marginBottom: '12px' }}>
            In accordance with Google Play User Data Policies, every user has the absolute right to request the deletion of their account and all associated personal data at any time:
          </p>
          <ol style={{ color: '#CBD5E1', fontSize: '14px', paddingLeft: '20px', lineHeight: '1.8', margin: 0 }}>
            <li><strong>In-App Deletion:</strong> Go to <em>Account Tab &gt; Edit Profile &gt; Delete Account</em> to instantly wipe profile and contact details.</li>
            <li><strong>Direct Web/Email Request:</strong> Send an email from your registered phone number or email address to <strong>monthlygrocery7@gmail.com</strong> with the subject line <em>"Account Deletion Request"</em>.</li>
          </ol>
          <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>
            Upon receiving your request, all personal identifiers, saved addresses, and active sessions will be permanently purged from our databases within 48 hours.
          </p>
        </section>

        {/* Section 8: Children's Privacy */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            7. Children's Privacy
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '15px' }}>
            Our services are intended for adults aged 18 and older who manage household grocery purchases. We do not knowingly collect or solicit personal information from children under the age of 13.
          </p>
        </section>

        {/* Section 9: Contact Information */}
        <section style={{ borderTop: '1px solid #334155', paddingTop: '28px' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            8. Contact &amp; Grievance Officer
          </h2>
          <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #334155', fontSize: '14px', color: '#94A3B8' }}>
            <p style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontWeight: 600 }}>EVER / Monthly Grocery Support Team</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Email:</strong> <a href="mailto:monthlygrocery7@gmail.com" style={{ color: '#38BDF8', textDecoration: 'none' }}>monthlygrocery7@gmail.com</a></p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Helpline Phone:</strong> +91 8830480015</p>
            <p style={{ margin: 0 }}><strong>Registered Operations:</strong> Pune, Maharashtra, India</p>
          </div>
        </section>
      </div>
    </div>
  );
}

