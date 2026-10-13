import os
import sys

def build_security_report_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MonthlyGrocery — Comprehensive Security Audit & Developer Hardening Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0B0F19;
      --card-bg: #111827;
      --card-border: #1F2937;
      --text-main: #F3F4F6;
      --text-muted: #9CA3AF;
      --text-dim: #6B7280;
      
      --crit-bg: rgba(239, 68, 68, 0.12);
      --crit-border: #EF4444;
      --crit-text: #F87171;
      
      --high-bg: rgba(245, 158, 11, 0.12);
      --high-border: #F59E0B;
      --high-text: #FBBF24;
      
      --med-bg: rgba(59, 130, 246, 0.12);
      --med-border: #3B82F6;
      --med-text: #60A5FA;
      
      --low-bg: rgba(16, 185, 129, 0.12);
      --low-border: #10B981;
      --low-text: #34D399;
      
      --accent: #10B981;
      --accent-glow: rgba(16, 185, 129, 0.2);
      --code-bg: #030712;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.6;
      padding: 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px 80px 24px;
    }

    header {
      background: linear-gradient(180deg, rgba(17, 24, 39, 0.8) 0%, rgba(11, 15, 25, 0) 100%);
      border-bottom: 1px solid var(--card-border);
      padding: 48px 0 32px 0;
      margin-bottom: 40px;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 24px;
    }

    .badge-report {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #FCA5A5;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.8px;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #FFFFFF 0%, #D1D5DB 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 16px;
      max-width: 720px;
    }

    .meta-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 14px;
    }
    .meta-item {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 6px;
    }
    .meta-item:last-child { margin-bottom: 0; }
    .meta-label { color: var(--text-dim); }
    .meta-val { font-weight: 600; color: #E5E7EB; }

    /* Summary Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 22px;
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
    }
    .stat-card.crit::before { background: var(--crit-border); }
    .stat-card.high::before { background: var(--high-border); }
    .stat-card.med::before { background: var(--med-border); }
    .stat-card.low::before { background: var(--low-border); }

    .stat-count {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .stat-card.crit .stat-count { color: var(--crit-text); }
    .stat-card.high .stat-count { color: var(--high-text); }
    .stat-card.med .stat-count { color: var(--med-text); }
    .stat-card.low .stat-count { color: var(--low-text); }

    .stat-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-desc {
      font-size: 13px;
      color: var(--text-dim);
      margin-top: 6px;
    }

    /* Section Styling */
    .section-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.4px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-title span {
      background: rgba(16, 185, 129, 0.1);
      color: var(--accent);
      padding: 2px 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    /* Vuln Matrix Table */
    .table-wrap {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 48px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;
    }
    th {
      background: #162032;
      color: var(--text-muted);
      font-weight: 600;
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 16px 18px;
      border-bottom: 1px solid var(--card-border);
      color: #D1D5DB;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .badge-crit { background: var(--crit-bg); color: var(--crit-text); border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-high { background: var(--high-bg); color: var(--high-text); border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-med { background: var(--med-bg); color: var(--med-text); border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-low { background: var(--low-bg); color: var(--low-text); border: 1px solid rgba(16, 185, 129, 0.3); }

    /* Vulnerability Detailed Cards */
    .vuln-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 36px;
    }

    .vuln-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 18px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--card-border);
    }

    .vuln-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-dim);
      margin-bottom: 4px;
    }

    .vuln-name {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
    }

    .vuln-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      font-size: 13px;
      color: var(--text-muted);
    }
    .vuln-meta-tag {
      background: #1F2937;
      padding: 4px 10px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
    }

    .vuln-body {
      font-size: 15px;
      color: #D1D5DB;
    }
    .vuln-body p { margin-bottom: 14px; }
    .vuln-body h4 {
      font-size: 15px;
      font-weight: 700;
      color: #F9FAFB;
      margin: 18px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Code blocks */
    .code-box {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 14px 0 20px 0;
      line-height: 1.5;
    }
    .code-box.vuln { border-left: 4px solid var(--crit-border); }
    .code-box.fix { border-left: 4px solid var(--low-border); }

    .diff-del { color: #F87171; background: rgba(239, 68, 68, 0.08); display: block; }
    .diff-add { color: #34D399; background: rgba(16, 185, 129, 0.08); display: block; }
    .diff-comment { color: var(--text-dim); font-style: italic; }

    /* Action Checklist */
    .checklist {
      list-style: none;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: #162032;
      border-radius: 8px;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .check-icon {
      color: var(--accent);
      font-weight: bold;
      font-size: 16px;
    }

    footer {
      border-top: 1px solid var(--card-border);
      padding: 32px 0;
      text-align: center;
      color: var(--text-dim);
      font-size: 13px;
    }
  </style>
</head>
<body>

  <header>
    <div class="header-content">
      <div>
        <div class="badge-report">🛡️ CONFIDENTIAL — INTERNAL ENGINEERING AUDIT</div>
        <h1>MonthlyGrocery Security Audit & Hardening Report</h1>
        <p class="subtitle">Complete developer security review of Express Backend, AWS RDS PostgreSQL, Auth Services, and Mobile APIs. Identifies critical vulnerabilities with reproduction scenarios and drop-in code fixes.</p>
      </div>
      <div class="meta-box">
        <div class="meta-item"><span class="meta-label">Platform:</span> <span class="meta-val">MonthlyGrocery v1.8</span></div>
        <div class="meta-item"><span class="meta-label">Target Stack:</span> <span class="meta-val">Node.js, Express, AWS RDS, S3</span></div>
        <div class="meta-item"><span class="meta-label">Audit Date:</span> <span class="meta-val">October 2026</span></div>
        <div class="meta-item"><span class="meta-label">Audit Scope:</span> <span class="meta-val">express-backend & mobile-app</span></div>
      </div>
    </div>
  </header>

  <div class="container">

    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card crit">
        <div class="stat-count">2</div>
        <div class="stat-title">Critical Severity</div>
        <div class="stat-desc">JWT Auth Bypass & Client-Side Price Tampering</div>
      </div>
      <div class="stat-card high">
        <div class="stat-count">2</div>
        <div class="stat-title">High Severity</div>
        <div class="stat-desc">SQL Injection in OR-query & OTP response leakage</div>
      </div>
      <div class="stat-card med">
        <div class="stat-count">3</div>
        <div class="stat-title">Medium Severity</div>
        <div class="stat-desc">SVG Stored XSS, Wildcard CORS & Missing Rate Limits</div>
      </div>
      <div class="stat-card low">
        <div class="stat-count">1</div>
        <div class="stat-title">Low / Config</div>
        <div class="stat-desc">Hardcoded JWT fallback secret in repository</div>
      </div>
    </div>

    <!-- Vulnerability Summary Table -->
    <h2 class="section-title">Vulnerability Master Matrix <span>8 Findings</span></h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Vulnerability</th>
            <th>Severity</th>
            <th>CVSS</th>
            <th>File & Lines</th>
            <th>Remediation Priority</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SEC-01</strong></td>
            <td>JWT Authentication Bypass via Unverified <code>jwt.decode()</code> Fallback</td>
            <td><span class="badge badge-crit">CRITICAL</span></td>
            <td><strong>9.8</strong></td>
            <td><code>middleware/auth.ts:23-29</code></td>
            <td><strong style="color: #EF4444;">P0 — Immediate (Day 1)</strong></td>
          </tr>
          <tr>
            <td><strong>SEC-02</strong></td>
            <td>Client-Side Price Tampering in Checkout Pipeline</td>
            <td><span class="badge badge-crit">CRITICAL</span></td>
            <td><strong>9.1</strong></td>
            <td><code>routes/orders.ts:231-237</code></td>
            <td><strong style="color: #EF4444;">P0 — Immediate (Day 1)</strong></td>
          </tr>
          <tr>
            <td><strong>SEC-03</strong></td>
            <td>SQL Injection via Unsanitized Dynamic Query Operator Interpolation</td>
            <td><span class="badge badge-high">HIGH</span></td>
            <td><strong>8.8</strong></td>
            <td><code>config/db.ts:270-286</code></td>
            <td><strong style="color: #F59E0B;">P1 — Sprint 1</strong></td>
          </tr>
          <tr>
            <td><strong>SEC-04</strong></td>
            <td>Plaintext OTP Leakage in API Responses & Test Number Bypass</td>
            <td><span class="badge badge-high">HIGH</span></td>
            <td><strong>8.2</strong></td>
            <td><code>routes/auth.ts:202</code> & <code>twilioOtpService.ts:96</code></td>
            <td><strong style="color: #F59E0B;">P1 — Sprint 1</strong></td>
          </tr>
          <tr>
            <td><strong>SEC-05</strong></td>
            <td>Stored Cross-Site Scripting (XSS) via Unsanitized SVG File Uploads</td>
            <td><span class="badge badge-med">MEDIUM</span></td>
            <td><strong>6.5</strong></td>
            <td><code>services/s3Service.ts:86</code></td>
            <td><strong style="color: #3B82F6;">P2 — Sprint 2</strong></td>
          </tr>
          <tr>
            <td><strong>SEC-06</strong></td>
            <td>Wildcard CORS (<code>*</code>) & Missing API Rate Limiting</td>
            <td><span class="badge badge-med">MEDIUM</span></td>
            <td><strong>6.0</strong></td>
            <td><code>server.ts:26-36</code></td>
            <td><strong style="color: #3B82F6;">P2 — Sprint 2</strong></td>
          </tr>
          <tr>
            <td><strong>SEC-07</strong></td>
            <td>Arbitrary S3 Key Streaming Proxy Without Namespace Authorization</td>
            <td><span class="badge badge-med">MEDIUM</span></td>
            <td><strong>5.8</strong></td>
            <td><code>middleware/uploadsProxy.ts:48</code></td>
            <td><strong style="color: #3B82F6;">P2 — Sprint 2</strong></td>
          </tr>
          <tr>
            <td><strong>SEC-08</strong></td>
            <td>Hardcoded Insecure Fallback JWT Secret in Source Code</td>
            <td><span class="badge badge-low">LOW</span></td>
            <td><strong>5.3</strong></td>
            <td><code>middleware/auth.ts:4</code></td>
            <td><strong style="color: #10B981;">P3 — Config Guard</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detailed Finding 1 -->
    <div class="vuln-card">
      <div class="vuln-header">
        <div>
          <div class="vuln-id">SEC-01 • CWE-287 / CWE-347</div>
          <div class="vuln-name">Authentication Bypass via Unverified <code>jwt.decode()</code> Fallback</div>
        </div>
        <span class="badge badge-crit">CRITICAL • CVSS 9.8</span>
      </div>

      <div class="vuln-meta-row">
        <span>📍 <strong>Location:</strong> <code>express-backend/src/middleware/auth.ts:23-29</code></span>
        <span>💥 <strong>Impact:</strong> Full Super Admin Privilege Escalation & Arbitrary Account Takeover</span>
      </div>

      <div class="vuln-body">
        <p><strong>Vulnerability Mechanics:</strong> In <code>authMiddleware</code>, the code attempts to verify incoming tokens using <code>jwt.verify(token, JWT_SECRET)</code>. However, the catch block catches cryptographic verification failures (such as signature mismatch) and falls back to calling <code>jwt.decode(token)</code>!</p>
        
        <p>Because <code>jwt.decode()</code> only reads the Base64 payload <em>without validating cryptographic signatures</em>, an attacker can craft an unsigned JWT with <code>{"id": "any-uuid", "role": "super_admin"}</code>, send it in the <code>Authorization: Bearer</code> header, and immediately bypass all authentication checks, gaining full administrative rights over all 300 stores and customer databases.</p>

        <h4>Vulnerable Code:</h4>
        <div class="code-box vuln">
<span class="diff-comment">// express-backend/src/middleware/auth.ts:23-29</span>
try {
  decoded = jwt.verify(token, JWT_SECRET) as any;
} catch (e) {
<span class="diff-del">- // Fallback decode in case token was signed with alternative secret or external auth provider</span>
<span class="diff-del">- decoded = jwt.decode(token) as any; // ⚠️ CRITICAL: Accepts ANY forged, untrusted token!</span>
<span class="diff-del">- if (!decoded) throw e;</span>
}
        </div>

        <h4>Remediation Patch:</h4>
        <div class="code-box fix">
<span class="diff-comment">// Strict Verification: Never trust decoded tokens if signature verification fails</span>
try {
<span class="diff-add">+ decoded = jwt.verify(token, JWT_SECRET) as any;</span>
} catch (err: any) {
<span class="diff-add">+ return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token signature' });</span>
}
        </div>
      </div>
    </div>

    <!-- Detailed Finding 2 -->
    <div class="vuln-card">
      <div class="vuln-header">
        <div>
          <div class="vuln-id">SEC-02 • CWE-472 / CWE-602</div>
          <div class="vuln-name">Client-Side Price Tampering in Checkout Pipeline</div>
        </div>
        <span class="badge badge-crit">CRITICAL • CVSS 9.1</span>
      </div>

      <div class="vuln-meta-row">
        <span>📍 <strong>Location:</strong> <code>express-backend/src/routes/orders.ts:231-237</code></span>
        <span>💥 <strong>Impact:</strong> Direct Financial Loss (Arbitrary Zero/Penny Price Purchases)</span>
      </div>

      <div class="vuln-body">
        <p><strong>Vulnerability Mechanics:</strong> During checkout (<code>POST /orders/checkout</code>), the server computes <code>rawItemsTotal</code> by reading <code>it.price</code> or <code>it.unit_price</code> directly from the client's HTTP JSON body:</p>
        <p>If an attacker modifies their network payload to send <code>[{"product_id": "premium-olive-oil-5L", "price": 1, "quantity": 10}]</code>, the backend accepts ₹1 per unit and completes the booking for ₹10 instead of ₹5,000.</p>

        <h4>Vulnerable Code:</h4>
        <div class="code-box vuln">
<span class="diff-comment">// express-backend/src/routes/orders.ts:231-237</span>
<span class="diff-del">- const rawItemsTotal = items.reduce((sum: number, it: any) => {</span>
<span class="diff-del">-   const price = parseFloat(it.price || it.unit_price) || 0; // ⚠️ Client-controlled price!</span>
<span class="diff-del">-   const qty = parseInt(it.quantity) || 1;</span>
<span class="diff-del">-   return sum + (price * qty);</span>
<span class="diff-del">- }, 0);</span>
<span class="diff-del">- const baseAmount = rawItemsTotal > 0 ? rawItemsTotal : parseFloat(total_amount);</span>
        </div>

        <h4>Remediation Patch:</h4>
        <div class="code-box fix">
<span class="diff-comment">// Server-Side Price Resolution from Master DB & Shop Overrides</span>
<span class="diff-add">+ const productIds = items.map((i: any) => i.product_id || i.id);</span>
<span class="diff-add">+ const { data: dbProducts } = await supabase.from('products').select('id, price').in('id', productIds);</span>
<span class="diff-add">+ const priceMap = new Map((dbProducts || []).map(p => [p.id, Number(p.price)]));</span>
<span class="diff-add">+ </span>
<span class="diff-add">+ let calculatedSubtotal = 0;</span>
<span class="diff-add">+ for (const it of items) {</span>
<span class="diff-add">+   const verifiedPrice = priceMap.get(it.product_id || it.id);</span>
<span class="diff-add">+   if (verifiedPrice === undefined) {</span>
<span class="diff-add">+     return res.status(400).json({ success: false, error: `Invalid product: ${it.product_id}` });</span>
<span class="diff-add">+   }</span>
<span class="diff-add">+   calculatedSubtotal += verifiedPrice * (parseInt(it.quantity, 10) || 1);</span>
<span class="diff-add">+ }</span>
<span class="diff-add">+ const baseAmount = calculatedSubtotal; // Authorized DB price ONLY</span>
        </div>
      </div>
    </div>

    <!-- Detailed Finding 3 -->
    <div class="vuln-card">
      <div class="vuln-header">
        <div>
          <div class="vuln-id">SEC-03 • CWE-89</div>
          <div class="vuln-name">SQL Injection via Unsanitized Dynamic Operator & Identifier Interpolation</div>
        </div>
        <span class="badge badge-high">HIGH • CVSS 8.8</span>
      </div>

      <div class="vuln-meta-row">
        <span>📍 <strong>Location:</strong> <code>express-backend/src/config/db.ts:270-286</code></span>
        <span>💥 <strong>Impact:</strong> Database Exfiltration, Query Manipulation & Unauthorized Data Access</span>
      </div>

      <div class="vuln-body">
        <p><strong>Vulnerability Mechanics:</strong> The custom PostgreSQL chainable query builder (<code>TableQueryBuilder</code>) parses <code>.or(rawExpression)</code> by splitting strings with periods (<code>segs[1]</code>). If an unrecognized operator is supplied, the code performs <code>op = rawOp.toUpperCase()</code> and interpolates both <code>col</code> and <code>op</code> directly into the raw SQL string without identifier whitelisting.</p>

        <h4>Vulnerable Code:</h4>
        <div class="code-box vuln">
<span class="diff-comment">// express-backend/src/config/db.ts:283-286</span>
<span class="diff-del">- else op = rawOp.toUpperCase(); // ⚠️ Injects arbitrary SQL string if rawOp is not in whitelist!</span>
<span class="diff-del">- params.push(val);</span>
<span class="diff-del">- orClauses.push(`"${col}" ${op} $${params.length}`); // ⚠️ col identifier not sanitized!</span>
        </div>

        <h4>Remediation Patch:</h4>
        <div class="code-box fix">
<span class="diff-comment">// Strict Operator Whitelist & Identifier Sanitization</span>
<span class="diff-add">+ const VALID_OPERATORS: Record<string, string> = {</span>
<span class="diff-add">+   eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'LIKE', ilike: 'ILIKE'</span>
<span class="diff-add">+ };</span>
<span class="diff-add">+ const safeOp = VALID_OPERATORS[rawOp.toLowerCase()];</span>
<span class="diff-add">+ if (!safeOp || !/^[a-zA-Z0-9_]+$/.test(col)) {</span>
<span class="diff-add">+   throw new Error(`Invalid SQL filter expression: ${col}.${rawOp}`);</span>
<span class="diff-add">+ }</span>
<span class="diff-add">+ params.push(val);</span>
<span class="diff-add">+ orClauses.push(`"${col}" ${safeOp} $${params.length}`);</span>
        </div>
      </div>
    </div>

    <!-- Detailed Finding 4 -->
    <div class="vuln-card">
      <div class="vuln-header">
        <div>
          <div class="vuln-id">SEC-04 • CWE-200 / CWE-798</div>
          <div class="vuln-name">Plaintext OTP Leakage in API Responses & Test Number Bypass</div>
        </div>
        <span class="badge badge-high">HIGH • CVSS 8.2</span>
      </div>

      <div class="vuln-meta-row">
        <span>📍 <strong>Location:</strong> <code>express-backend/src/routes/auth.ts:202</code> & <code>services/twilioOtpService.ts:56-64</code></span>
        <span>💥 <strong>Impact:</strong> Customer & Merchant Account Takeover Without SMS Access</span>
      </div>

      <div class="vuln-body">
        <p><strong>Vulnerability Mechanics:</strong> Whenever Twilio is unavailable or <code>DEV_OTP_BYPASS</code> is active, <code>sendOtp</code> sets <code>devOtp: '123456'</code> and the HTTP route serializes it directly into the public JSON response: <code>res.json({ success: true, devOtp: '123456' })</code>. Furthermore, any phone number ending in listed test digits (<code>TEST_NUMBERS = ['8830480015', '9876543210', ...]</code>) automatically bypasses SMS delivery and always accepts <code>123456</code>.</p>

        <h4>Remediation Patch:</h4>
        <div class="code-box fix">
<span class="diff-comment">// Production Guard: Strip devOtp from responses unless in explicit NODE_ENV=development</span>
<span class="diff-add">+ const isDevelopment = process.env.NODE_ENV === 'development';</span>
<span class="diff-add">+ return res.json({</span>
<span class="diff-add">+   success: true,</span>
<span class="diff-add">+   message: result.message,</span>
<span class="diff-add">+   mobile: normalized,</span>
<span class="diff-add">+   ...(isDevelopment && result.devOtp ? { devOtp: result.devOtp } : {}),</span>
<span class="diff-add">+ });</span>
        </div>
      </div>
    </div>

    <!-- Detailed Finding 5 -->
    <div class="vuln-card">
      <div class="vuln-header">
        <div>
          <div class="vuln-id">SEC-05 • CWE-79 / CWE-434</div>
          <div class="vuln-name">Stored Cross-Site Scripting (XSS) via Unsanitized SVG File Uploads</div>
        </div>
        <span class="badge badge-med">MEDIUM • CVSS 6.5</span>
      </div>

      <div class="vuln-meta-row">
        <span>📍 <strong>Location:</strong> <code>express-backend/src/services/s3Service.ts:86</code> & <code>middleware/uploadsProxy.ts:22</code></span>
        <span>💥 <strong>Impact:</strong> Session Hijacking, Admin Portal Cookie Theft & Malicious Redirection</span>
      </div>

      <div class="vuln-body">
        <p><strong>Vulnerability Mechanics:</strong> Multer upload endpoints accept <code>.svg</code> files and pipe them directly into AWS S3 with content type <code>image/svg+xml</code>. SVG files are XML documents that can contain executable JavaScript (e.g. <code>&lt;svg onload="alert(document.cookie)"&gt;</code>). When an admin or user opens the image link directly in the browser, the browser executes the script in the origin's context.</p>

        <h4>Remediation Patch:</h4>
        <div class="code-box fix">
<span class="diff-comment">// Restrict Allowed File Upload Types to Raster Images Only (PNG, JPG, WEBP)</span>
<span class="diff-add">+ const ALLOWED_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp']);</span>
<span class="diff-add">+ if (!ALLOWED_EXTS.has(cleanExt)) {</span>
<span class="diff-add">+   throw new Error('Disallowed file format. Only PNG, JPG, and WEBP images are permitted.');</span>
<span class="diff-add">+ }</span>
        </div>
      </div>
    </div>

    <!-- Detailed Finding 6 -->
    <div class="vuln-card">
      <div class="vuln-header">
        <div>
          <div class="vuln-id">SEC-06 • CWE-307 / CWE-942</div>
          <div class="vuln-name">Wildcard CORS (<code>*</code>) & Missing API Rate Limiting</div>
        </div>
        <span class="badge badge-med">MEDIUM • CVSS 6.0</span>
      </div>

      <div class="vuln-meta-row">
        <span>📍 <strong>Location:</strong> <code>express-backend/src/server.ts:26-36</code></span>
        <span>💥 <strong>Impact:</strong> SMS Gateway Abuse (Financial Exhaustion), Brute Force Attacks & Cross-Origin Scraping</span>
      </div>

      <div class="vuln-body">
        <p><strong>Vulnerability Mechanics:</strong> The server invokes <code>app.use(cors())</code> without an origin whitelist, allowing any website to make requests to the API. Additionally, there is no IP-based rate limiter (e.g. <code>express-rate-limit</code>), enabling attackers to spam <code>/auth/send-otp</code> thousands of times, generating massive Twilio SMS bills.</p>

        <h4>Remediation Patch:</h4>
        <div class="code-box fix">
<span class="diff-comment">// Apply Strict CORS & Rate Limiter in server.ts</span>
<span class="diff-add">+ import rateLimit from 'express-rate-limit';</span>
<span class="diff-add">+ import helmet from 'helmet';</span>
<span class="diff-add">+ </span>
<span class="diff-add">+ app.use(helmet());</span>
<span class="diff-add">+ app.use(cors({ origin: ['https://monthlygrocery.com', 'https://admin.monthlygrocery.com'], credentials: true }));</span>
<span class="diff-add">+ </span>
<span class="diff-add">+ const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many OTP requests. Try again later.' });</span>
<span class="diff-add">+ app.use('/api/auth/send-otp', otpLimiter);</span>
        </div>
      </div>
    </div>

    <!-- Remediation Roadmap Checklist -->
    <h2 class="section-title">Developer Hardening Checklist <span>Priority Action Items</span></h2>
    <div class="table-wrap" style="padding: 24px;">
      <ul class="checklist">
        <li class="checklist-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>P0 — Remove <code>jwt.decode()</code> Fallback:</strong> Enforce strict cryptographic validation in <code>middleware/auth.ts</code>. Reject all tokens with signature errors.
          </div>
        </li>
        <li class="checklist-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>P0 — Authorize Prices Server-Side:</strong> In <code>routes/orders.ts</code>, query unit prices from <code>products</code> and <code>shop_products</code> tables; ignore prices in client payload.
          </div>
        </li>
        <li class="checklist-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>P1 — Sanitize SQL Query Builder:</strong> Replace dynamic string concatenation in <code>config/db.ts:286</code> with operator whitelisting and regex column validation.
          </div>
        </li>
        <li class="checklist-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>P1 — Mask Dev OTPs in Production:</strong> Ensure <code>devOtp</code> is never exposed in JSON responses when <code>NODE_ENV === 'production'</code>.
          </div>
        </li>
        <li class="checklist-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>P2 — Restrict Upload Formats:</strong> Disallow SVG uploads in <code>services/s3Service.ts</code>; restrict to PNG, JPG, WEBP.
          </div>
        </li>
        <li class="checklist-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>P2 — Add Helmet & Rate Limiting:</strong> Install <code>helmet</code> and <code>express-rate-limit</code> on <code>/auth/send-otp</code>, <code>/auth/verify-otp</code>, and <code>/orders/checkout</code>.
          </div>
        </li>
      </ul>
    </div>

  </div>

  <footer>
    <p>MonthlyGrocery Engineering Audit • Generated for Lead Developer & Executive Leadership • Confidential</p>
  </footer>

</body>
</html>
"""

def build_architecture_report_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MonthlyGrocery — Architecture Bottlenecks & Scalability Blueprint</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0A0E1A;
      --card-bg: #121826;
      --card-border: #1E293B;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --text-dim: #64748B;
      
      --danger: #EF4444;
      --warning: #F59E0B;
      --info: #3B82F6;
      --success: #10B981;
      
      --accent-purple: #8B5CF6;
      --accent-teal: #14B8A6;
      --code-bg: #020617;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px 80px 24px;
    }

    header {
      background: linear-gradient(180deg, rgba(18, 24, 38, 0.9) 0%, rgba(10, 14, 26, 0) 100%);
      border-bottom: 1px solid var(--card-border);
      padding: 48px 0 32px 0;
      margin-bottom: 40px;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 24px;
    }

    .badge-report {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #C4B5FD;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.8px;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 16px;
      max-width: 760px;
    }

    .meta-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 14px;
    }
    .meta-item {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 6px;
    }
    .meta-item:last-child { margin-bottom: 0; }
    .meta-label { color: var(--text-dim); }
    .meta-val { font-weight: 600; color: #E2E8F0; }

    /* Architecture High-Level Cards */
    .arch-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }

    .arch-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 24px;
      position: relative;
    }
    .arch-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .arch-metric {
      font-family: 'JetBrains Mono', monospace;
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .arch-metric.warn { color: var(--warning); }
    .arch-metric.danger { color: var(--danger); }
    .arch-metric.info { color: var(--info); }
    .arch-metric.teal { color: var(--accent-teal); }

    .arch-card p {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* Section Styling */
    .section-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.4px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-title span {
      background: rgba(139, 92, 246, 0.1);
      color: #A78BFA;
      padding: 2px 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    /* Architecture Diagram Box */
    .diagram-box {
      background: #0F172A;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 48px;
    }
    .diagram-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 20px;
    }
    .diagram-node {
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px 20px;
      text-align: center;
      flex: 1;
      min-width: 180px;
    }
    .diagram-node.bottleneck {
      border-color: rgba(239, 68, 68, 0.6);
      background: rgba(239, 68, 68, 0.08);
    }
    .diagram-node.target {
      border-color: rgba(16, 185, 129, 0.6);
      background: rgba(16, 185, 129, 0.08);
    }
    .node-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .node-sub { font-size: 12px; color: var(--text-dim); }
    .diagram-arrow {
      color: var(--text-dim);
      font-weight: bold;
      font-size: 20px;
    }

    /* Bottleneck Detail Cards */
    .bottleneck-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 32px;
    }
    .bottleneck-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 14px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .bottleneck-title {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .badge-bneck {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .bneck-p0 { background: rgba(239, 68, 68, 0.15); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .bneck-p1 { background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .bneck-p2 { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); }

    .bneck-content { font-size: 15px; color: #CBD5E1; }
    .bneck-content p { margin-bottom: 14px; }
    .bneck-content h4 {
      font-size: 14px;
      font-weight: 700;
      color: #E2E8F0;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .solution-box {
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 10px;
      padding: 16px;
      margin-top: 14px;
    }
    .solution-box strong { color: var(--success); }

    .code-box {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 10px 0;
    }

    footer {
      border-top: 1px solid var(--card-border);
      padding: 32px 0;
      text-align: center;
      color: var(--text-dim);
      font-size: 13px;
    }
  </style>
</head>
<body>

  <header>
    <div class="header-content">
      <div>
        <div class="badge-report">⚙️ ARCHITECTURE SCALABILITY BLUEPRINT</div>
        <h1>MonthlyGrocery Architecture & Bottleneck Audit</h1>
        <p class="subtitle">Structural scalability roadmap for handling 10,000+ simultaneous customers, 300+ Kirana merchants, and 44,000 product SKUs without system freezes, race conditions, or connection timeouts.</p>
      </div>
      <div class="meta-box">
        <div class="meta-item"><span class="meta-label">Target Volume:</span> <span class="meta-val">10,000 DAU Customers</span></div>
        <div class="meta-item"><span class="meta-label">Active Stores:</span> <span class="meta-val">300+ Kirana Shops</span></div>
        <div class="meta-item"><span class="meta-label">Catalog Target:</span> <span class="meta-val">44,000 Master SKUs</span></div>
        <div class="meta-item"><span class="meta-label">Infra Target:</span> <span class="meta-val">AWS RDS PostgreSQL + S3</span></div>
      </div>
    </div>
  </header>

  <div class="container">

    <!-- High Level Metrics -->
    <div class="arch-grid">
      <div class="arch-card">
        <h3>Local File I/O Lock</h3>
        <div class="arch-metric danger">db.json</div>
        <p>Synchronous <code>fs.writeFileSync</code> blocks Node.js event loop during concurrent checkout surges.</p>
      </div>
      <div class="arch-card">
        <h3>DB Connection Pool</h3>
        <div class="arch-metric warn">20 Max</div>
        <p>PostgreSQL connection pool max 20 causes queue starvation under 10k users peak checkout load.</p>
      </div>
      <div class="arch-card">
        <h3>Merchant Real-time</h3>
        <div class="arch-metric info">HTTP Polling</div>
        <p>300 merchants polling every 5s generates ~3,600 req/min of unnecessary database load.</p>
      </div>
      <div class="arch-card">
        <h3>Inventory Concurrency</h3>
        <div class="arch-metric teal">Non-Atomic</div>
        <p>Check-then-deduct pattern in JS memory allows overselling the last stock item to multiple users.</p>
      </div>
    </div>

    <!-- Architecture Visual Flow -->
    <div class="diagram-box">
      <h3 style="font-size: 18px; font-weight: 700;">System Concurrency & Data Flow Map</h3>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Current dual-write pattern vs. recommended high-throughput enterprise architecture</p>
      
      <div class="diagram-flow">
        <div class="diagram-node">
          <div class="node-title">10,000 Mobile Apps</div>
          <div class="node-sub">Browsing & Checkout</div>
        </div>
        <div class="diagram-arrow">➔</div>
        <div class="diagram-node bottleneck">
          <div class="node-title">Express API (Single Thread)</div>
          <div class="node-sub">fs.writeFileSync(db.json) [CRITICAL BOTTLENECK]</div>
        </div>
        <div class="diagram-arrow">➔</div>
        <div class="diagram-node">
          <div class="node-title">AWS RDS PostgreSQL</div>
          <div class="node-sub">Pool Limit: 20 Connections</div>
        </div>
        <div class="diagram-arrow">➔</div>
        <div class="diagram-node bottleneck">
          <div class="node-title">300 Merchant Dashboards</div>
          <div class="node-sub">HTTP Screen Polling (Heavy DB Queries)</div>
        </div>
      </div>
    </div>

    <!-- Bottleneck 1 -->
    <div class="bottleneck-card">
      <div class="bottleneck-header">
        <div>
          <div class="bottleneck-title">1. Synchronous File Locking & Dual-Write Drift (<code>db.json</code>)</div>
        </div>
        <span class="badge-bneck bneck-p0">CRITICAL • HIGH RISK</span>
      </div>
      <div class="bneck-content">
        <p><strong>The Issue:</strong> Across <code>routes/orders.ts</code>, <code>routes/shops.ts</code>, and <code>routes/addresses.ts</code>, every checkout or status change reads and writes to a single disk file (<code>data/db.json</code>) using <code>fs.writeFileSync()</code> alongside writing to PostgreSQL.</p>
        <p><strong>Why It Fails at 10k Scale:</strong> Node.js is single-threaded. Serializing a 10MB JSON file to disk blocks the entire event loop for 100ms+. When 50 customers check out at the same time, simultaneous file writes overwrite each other (causing lost orders) and freeze the server for other customers.</p>
        
        <div class="solution-box">
          <strong>Recommended Solution:</strong> Completely decommission <code>db.json</code> for transaction and order data. Use AWS RDS PostgreSQL with standard ACID transactions (<code>BEGIN ... COMMIT</code>) as the sole source of truth.
        </div>
      </div>
    </div>

    <!-- Bottleneck 2 -->
    <div class="bottleneck-card">
      <div class="bottleneck-header">
        <div>
          <div class="bottleneck-title">2. Database Connection Pool Starvation (<code>max: 20</code>)</div>
        </div>
        <span class="badge-bneck bneck-p1">HIGH • CONNECTION TIMEOUT</span>
      </div>
      <div class="bneck-content">
        <p><strong>The Issue:</strong> In <code>express-backend/src/config/db.ts</code>, the PostgreSQL connection pool is configured with <code>max: 20</code> and <code>connectionTimeoutMillis: 10000</code>.</p>
        <p><strong>Why It Fails at 10k Scale:</strong> When 1,000 concurrent customers browse catalog pages, apply coupons, and checkout while 300 merchants poll their order screens, all 20 connections become occupied. Incoming requests queue up and eventually fail with <code>Connection timeout</code> errors.</p>
        
        <div class="solution-box">
          <strong>Recommended Solution:</strong> Enable <strong>AWS RDS Proxy</strong> to pool and multiplex database connections seamlessly up to hundreds of concurrent workers, and increase Node pool size to <strong>60–80</strong>.
        </div>
      </div>
    </div>

    <!-- Bottleneck 3 -->
    <div class="bottleneck-card">
      <div class="bottleneck-header">
        <div>
          <div class="bottleneck-title">3. In-Memory Variant Grouping Overhead for 44,000 SKUs</div>
        </div>
        <span class="badge-bneck bneck-p1">HIGH • MEMORY & CPU CHURN</span>
      </div>
      <div class="bneck-content">
        <p><strong>The Issue:</strong> <code>groupProductsByFamily</code> fetches hundreds of individual product rows into Node memory and groups them by family using JavaScript <code>Map</code> and regex replacements.</p>
        <p><strong>Why It Fails at 10k Scale:</strong> As the catalog reaches 44,000 SKUs, running CPU-intensive string replacements and array grouping on every API request consumes server RAM and causes Garbage Collection (GC) pauses.</p>
        
        <div class="solution-box">
          <strong>Recommended Solution:</strong> Create a PostgreSQL SQL View or Materialized View with <code>json_agg(variants)</code> so PostgreSQL aggregates variants at the database level in under 10ms, returning clean pre-grouped JSON.
        </div>
        <div class="code-box">
CREATE OR REPLACE VIEW view_grouped_products AS
SELECT 
  family_key,
  brand,
  MIN(price) as starting_price,
  json_agg(json_build_object('id', id, 'sku', sku, 'unit', unit, 'price', price, 'stock', stock)) as variants
FROM products
GROUP BY family_key, brand;
        </div>
      </div>
    </div>

    <!-- Bottleneck 4 -->
    <div class="bottleneck-card">
      <div class="bottleneck-header">
        <div>
          <div class="bottleneck-title">4. Inventory Race Conditions (Overselling Last Packets)</div>
        </div>
        <span class="badge-bneck bneck-p1">HIGH • BUSINESS INTEGRITY</span>
      </div>
      <div class="bneck-content">
        <p><strong>The Issue:</strong> Currently, stock availability is checked in JavaScript memory during checkout, and stock is deducted later in a separate asynchronous call (<code>deductShopInventory</code>). There is no row-level database lock.</p>
        <p><strong>Why It Fails at 10k Scale:</strong> If a merchant has only 2 units of Amul Butter left and 3 customers checkout in the same second, all 3 pass the stock validation, leading to overselling and merchant cancellation.</p>
        
        <div class="solution-box">
          <strong>Recommended Solution:</strong> Use atomic SQL update queries with conditional stock guards:
        </div>
        <div class="code-box">
UPDATE shop_products 
SET stock = stock - $1, updated_at = NOW()
WHERE shop_id = $2 AND product_id = $3 AND stock >= $1
RETURNING stock;
        </div>
      </div>
    </div>

    <!-- Bottleneck 5 -->
    <div class="bottleneck-card">
      <div class="bottleneck-header">
        <div>
          <div class="bottleneck-title">5. Merchant Order Notification: HTTP Polling vs. Push Events</div>
        </div>
        <span class="badge-bneck bneck-p2">MEDIUM • EFFICIENCY</span>
      </div>
      <div class="bneck-content">
        <p><strong>The Issue:</strong> <code>OrdersDashboard.tsx</code> relies on screen refocus and polling to detect new orders. 300 merchants actively polling causes thousands of database queries every minute.</p>
        
        <div class="solution-box">
          <strong>Recommended Solution:</strong> Implement <strong>Firebase Cloud Messaging (FCM)</strong> push notifications with high-priority order chimes, paired with a lightweight <strong>WebSocket / Socket.io</strong> connection for instant live dashboard updates without continuous polling.
        </div>
      </div>
    </div>

    <!-- Phased Execution Plan -->
    <h2 class="section-title">Scalability Implementation Roadmap <span>Phase-wise Plan</span></h2>
    <div class="diagram-box">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div style="background: #1E293B; border-radius: 12px; padding: 20px;">
          <h4 style="color: #F87171; margin-bottom: 8px;">Phase 1: Immediate Lockdown (Sprint 1)</h4>
          <ul style="font-size: 13px; color: #CBD5E1; list-style-position: inside;">
            <li>Migrate all order writes exclusively to AWS RDS PostgreSQL.</li>
            <li>Implement atomic SQL inventory decrement.</li>
            <li>Increase DB pool to 60 connections.</li>
          </ul>
        </div>
        <div style="background: #1E293B; border-radius: 12px; padding: 20px;">
          <h4 style="color: #FBBF24; margin-bottom: 8px;">Phase 2: High Throughput (Sprint 2)</h4>
          <ul style="font-size: 13px; color: #CBD5E1; list-style-position: inside;">
            <li>Integrate Redis caching for catalog & store statuses.</li>
            <li>Deploy FCM push notifications for merchant orders.</li>
            <li>Create SQL view for variant aggregation.</li>
          </ul>
        </div>
        <div style="background: #1E293B; border-radius: 12px; padding: 20px;">
          <h4 style="color: #34D399; margin-bottom: 8px;">Phase 3: Production Scale (Sprint 3)</h4>
          <ul style="font-size: 13px; color: #CBD5E1; list-style-position: inside;">
            <li>Deploy AWS RDS Proxy for connection pooling.</li>
            <li>Run Express backend in Docker on AWS ECS Fargate with ALB.</li>
            <li>Setup CloudWatch metrics for latency and connection alerts.</li>
          </ul>
        </div>
      </div>
    </div>

  </div>

  <footer>
    <p>MonthlyGrocery Architecture Audit • Generated for CTO & Engineering Leadership • Confidential</p>
  </footer>

</body>
</html>
"""

def convert_html_to_pdf(html_path, pdf_path):
    import subprocess
    browser_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    ]
    browser_exe = None
    for bp in browser_paths:
        if os.path.exists(bp):
            browser_exe = bp
            break

    if browser_exe:
        cmd = [
            browser_exe,
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            html_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if os.path.exists(pdf_path):
            print(f"Generated PDF: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")
        else:
            print(f"Failed to generate PDF for {html_path}: {res.stderr}")

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    sec_html = os.path.join(root_dir, 'MonthlyGrocery_Security_Audit_and_Hardening_Report.html')
    sec_pdf = os.path.join(root_dir, 'MonthlyGrocery_Security_Audit_and_Hardening_Report.pdf')
    
    arch_html = os.path.join(root_dir, 'MonthlyGrocery_Architecture_and_Scalability_Issues.html')
    arch_pdf = os.path.join(root_dir, 'MonthlyGrocery_Architecture_and_Scalability_Issues.pdf')
    
    with open(sec_html, 'w', encoding='utf-8') as f:
        f.write(build_security_report_html())
    print(f"Generated: {sec_html} ({os.path.getsize(sec_html)} bytes)")
    convert_html_to_pdf(sec_html, sec_pdf)
    
    with open(arch_html, 'w', encoding='utf-8') as f:
        f.write(build_architecture_report_html())
    print(f"Generated: {arch_html} ({os.path.getsize(arch_html)} bytes)")
    convert_html_to_pdf(arch_html, arch_pdf)

if __name__ == '__main__':
    main()
