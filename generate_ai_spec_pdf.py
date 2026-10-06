import os
import subprocess
import json

html_doc = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MonthlyGrocery - AI Features Architectural & Implementation Specification</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    :root {
      --primary: #059669;
      --primary-dark: #065f46;
      --primary-light: #ecfdf5;
      --primary-border: #a7f3d0;
      
      --accent: #4f46e5;
      --accent-light: #eef2ff;
      --accent-border: #c7d2fe;

      --secondary: #0284c7;
      --secondary-light: #f0f9ff;
      --secondary-border: #bae6fd;
      
      --text-dark: #0f172a;
      --text-body: #334155;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      
      --border: #e2e8f0;
      --border-strong: #cbd5e1;
      
      --card-bg: #ffffff;
      --bg-soft: #f8fafc;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f1f5f9;
      color: var(--text-body);
      line-height: 1.42;
      font-size: 8.6pt;
    }

    code, .mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.6pt;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }

    pre code {
      display: block;
      padding: 6px 8px;
      background: #0f172a;
      color: #f8fafc;
      border-radius: 5px;
      font-size: 7.2pt;
      line-height: 1.35;
      overflow-x: auto;
      border: 1px solid #1e293b;
    }

    .page-container {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      padding: 10mm 12mm 9mm 12mm;
      margin: 0 auto 10px auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      position: relative;
    }

    @media print {
      body {
        background: transparent;
      }
      .page-container {
        margin: 0;
        box-shadow: none;
        height: 297mm;
        max-height: 297mm;
      }
    }

    .page-body {
      display: flex;
      flex-direction: column;
      gap: 7px;
      flex-grow: 1;
    }

    /* Headers & Meta */
    .doc-header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 6px;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .doc-tag {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary-dark);
      border: 1px solid var(--primary-border);
      font-weight: 700;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 3px;
    }

    .doc-title {
      font-size: 14pt;
      font-weight: 800;
      color: var(--text-dark);
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    .doc-sub {
      font-size: 8.2pt;
      color: var(--text-muted);
      font-weight: 500;
      margin-top: 1px;
    }

    .doc-meta-right {
      text-align: right;
      font-size: 7.2pt;
      color: var(--text-muted);
    }

    /* Section Cards */
    .section-title {
      font-size: 9.6pt;
      font-weight: 700;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 5px;
      border-left: 3px solid var(--primary);
      padding-left: 5px;
      margin-top: 2px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 7px 9px;
    }

    .card-highlight {
      background: var(--bg-soft);
      border: 1px solid var(--primary-border);
      border-left: 3px solid var(--primary);
    }

    .card-accent {
      background: var(--accent-light);
      border: 1px solid var(--accent-border);
      border-left: 3px solid var(--accent);
    }

    .card-blue {
      background: var(--secondary-light);
      border: 1px solid var(--secondary-border);
      border-left: 3px solid var(--secondary);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 5px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
    }

    th {
      background: #f8fafc;
      color: var(--text-dark);
      font-weight: 700;
      text-align: left;
      padding: 4px 6px;
      border: 1px solid var(--border);
      font-size: 7.4pt;
    }

    td {
      padding: 3.8px 6px;
      border: 1px solid var(--border);
      color: var(--text-body);
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Badges & Pills */
    .badge {
      display: inline-block;
      font-size: 6.8pt;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
    .badge-purple { background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; }
    .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

    /* Steps */
    .step-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step-item {
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }

    .step-num {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      font-weight: 700;
      font-size: 6.5pt;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-content {
      font-size: 7.9pt;
      color: var(--text-body);
    }

    /* Footer */
    .doc-footer {
      border-top: 1px solid var(--border);
      padding-top: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <!-- PAGE 1: EXECUTIVE BLUEPRINT & SYSTEM ARCHITECTURE -->
  <div class="page-container">
    <div class="page-body">
      <div class="doc-header">
        <div>
          <span class="doc-tag">Engineering & Product Blueprint</span>
          <div class="doc-title">MonthlyGrocery – AI Architecture & Operational Guide</div>
          <div class="doc-sub">Comprehensive Specification for Multimodal Ingestion, Conversational Planning & Predictive Commerce</div>
        </div>
        <div class="doc-meta-right">
          <div><strong>Platform:</strong> MonthlyGrocery Ecosystem</div>
          <div><strong>Core Focus:</strong> AI Feature Specifications</div>
          <div><strong>Version:</strong> 2.0 (Production Roadmap)</div>
        </div>
      </div>

      <div class="card card-highlight">
        <div style="font-weight:700; color:var(--primary-dark); font-size:8.8pt; margin-bottom:2px;">1. Strategic Positioning: India's Digital Monthly Grocery Assistant</div>
        <p style="font-size:8pt; color:var(--text-body); line-height:1.4;">
          Unlike 10-minute quick-commerce platforms designed for impulse daily top-ups, MonthlyGrocery solves the <strong>planned recurring monthly household basket</strong> (₹3,000–₹10,000 AOV). Indian households buy staples in bulk once a month. The AI engine acts as a personal grocery manager: digitizing paper slips, predicting refill cycles, optimizing bundle savings, and building baskets with zero manual effort.
        </p>
      </div>

      <div class="section-title">2. Three-Tier Architectural Integration with AI Layer</div>
      <div class="grid-3">
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:2px;">Super Admin Layer</div>
          <p style="font-size:7.5pt; color:var(--text-muted); margin-bottom:4px;">Master SKU catalog, global pricing rules, AI taxonomy and embedding generation.</p>
          <ul style="font-size:7.5pt; padding-left:14px; line-height:1.35;">
            <li>Auto-categorization & HSN code detection</li>
            <li>Master product vector embeddings</li>
            <li>Global brand substitution mappings</li>
          </ul>
        </div>
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:2px;">Area Admin Layer</div>
          <p style="font-size:7.5pt; color:var(--text-muted); margin-bottom:4px;">Local inventory, area-level discounts, delivery slots, localized SKU filtering.</p>
          <ul style="font-size:7.5pt; padding-left:14px; line-height:1.35;">
            <li>Area-specific stock & price filtering</li>
            <li>Demand forecasting for 1st–5th restock</li>
            <li>Local deal & coupon injection</li>
          </ul>
        </div>
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:2px;">Customer Mobile / Web</div>
          <p style="font-size:7.5pt; color:var(--text-muted); margin-bottom:4px;">End-user interfaces for multi-modal ingestion, conversational planning & 1-click cart.</p>
          <ul style="font-size:7.5pt; padding-left:14px; line-height:1.35;">
            <li>OCR slip scanner & voice shopping</li>
            <li>Interactive conversational assistant</li>
            <li>Personalized basket & savings alerts</li>
          </ul>
        </div>
      </div>

      <div class="section-title">3. End-to-End AI Data Flow & Pipeline Topology</div>
      <div class="card" style="background:#0f172a; color:#f8fafc; padding:8px 10px; border-radius:5px;">
        <div style="font-family:'JetBrains Mono'; font-size:7.2pt; line-height:1.45;">
          [Customer Inputs: Handwritten Slip / Hinglish Audio / WhatsApp Text / Chat Prompt]<br/>
          &nbsp;&nbsp;│<br/>
          &nbsp;&nbsp;▼ (Express Backend API: /api/ai/...)<br/>
          ┌────────────────────────────────────────────────────────────────────────────────────────┐<br/>
          │ <strong>AI Perception & Parsing Layer</strong> (Google Gemini 1.5 Flash / Whisper Speech API)       │<br/>
          │ • Vision OCR: Extract handwritten line items + brand + weight + pack count             │<br/>
          │ • Audio NLP: Transcribe Hinglish audio & parse colloquial entity intents              │<br/>
          │ • Structured JSON normalizer: [{ query_item: "Atta", qty: 10, unit: "kg" }, ...]      │<br/>
          └────────────────────────────────────────────────────────────────────────────────────────┘<br/>
          &nbsp;&nbsp;│<br/>
          &nbsp;&nbsp;▼<br/>
          ┌────────────────────────────────────────────────────────────────────────────────────────┐<br/>
          │ <strong>Semantic Matching & SKU Resolution Engine</strong>                                        │<br/>
          │ • Filter SKUs by Customer's active <code>area_id</code> & in-stock status                   │<br/>
          │ • Vector Embedding Match (pgvector / cosine similarity) + Trigram fuzzy text matching   │<br/>
          │ • Brand Affinity Weighting (Dove vs Santoor preference based on order history)        │<br/>
          └────────────────────────────────────────────────────────────────────────────────────────┘<br/>
          &nbsp;&nbsp;│<br/>
          &nbsp;&nbsp;▼<br/>
          ┌────────────────────────────────────────────────────────────────────────────────────────┐<br/>
          │ <strong>Smart Savings & Pack Arbitrage Optimizer</strong>                                     │<br/>
          │ • Compare unit economics (₹/kg on 1kg vs 5kg/10kg bulk packs)                         │<br/>
          │ • Inject active Area Admin promotions ("Buy ₹2500+ unlock free 1kg sugar")             │<br/>
          └────────────────────────────────────────────────────────────────────────────────────────┘<br/>
          &nbsp;&nbsp;│<br/>
          &nbsp;&nbsp;▼ [Live Verified Cart with High-Confidence Auto-Adds & Reviewable Matches in UI]
        </div>
      </div>

      <div class="section-title">4. Summary of Planned AI Modules</div>
      <table>
        <thead>
          <tr>
            <th>Module Name</th>
            <th>Type</th>
            <th>Core User Action</th>
            <th>Underlying Technology</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Handwritten OCR Scanner</strong></td>
            <td><span class="badge badge-green">Perception</span></td>
            <td>Upload photo of physical paper grocery list</td>
            <td>Gemini 1.5 Flash Vision + Semantic Catalog Matcher</td>
          </tr>
          <tr>
            <td><strong>2. Hinglish Voice Shopping</strong></td>
            <td><span class="badge badge-green">Speech/NLP</span></td>
            <td>Speak voice note: <i>"10kg atta, 5L oil, 2kg sugar"</i></td>
            <td>Whisper API / Google Cloud Speech + Intent Parser</td>
          </tr>
          <tr>
            <td><strong>3. WhatsApp Text List Parser</strong></td>
            <td><span class="badge badge-blue">NLP</span></td>
            <td>Paste raw copied text notes into the app</td>
            <td>Few-shot entity parsing model with unit normalizer</td>
          </tr>
          <tr>
            <td><strong>4. Conversational Assistant</strong></td>
            <td><span class="badge badge-purple">Chat/LLM</span></td>
            <td>Chat: <i>"Plan 4-person veg monthly grocery under ₹5k"</i></td>
            <td>Gemini 1.5 with Function Calling & Catalog Grounding</td>
          </tr>
          <tr>
            <td><strong>5. Household Refill Predictor</strong></td>
            <td><span class="badge badge-amber">Predictive</span></td>
            <td>Auto-receive <i>"Your monthly grocery is due"</i> alert</td>
            <td>Inter-purchase consumption velocity heuristics</td>
          </tr>
          <tr>
            <td><strong>6. Pack-Size Arbitrage Engine</strong></td>
            <td><span class="badge badge-blue">Optimization</span></td>
            <td>Display <i>"Save ₹110 by switching to 5kg pack"</i></td>
            <td>Deterministic unit price calculator + dynamic upsell</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-footer">
      <div>MonthlyGrocery Platform Architecture</div>
      <div>Confidential - Internal Engineering Document</div>
      <div>Page 1 of 6</div>
    </div>
  </div>

  <!-- PAGE 2: MULTIMODAL LIST-TO-CART ENGINE -->
  <div class="page-container">
    <div class="page-body">
      <div class="doc-header">
        <div>
          <span class="doc-tag">Feature Specification 01</span>
          <div class="doc-title">Multi-Modal "Grocery List-to-Cart" Ingestion Engine</div>
          <div class="doc-sub">Handwritten Slip OCR, Vernacular Voice Notes & Raw Text Entity Resolution</div>
        </div>
        <div class="doc-meta-right">
          <div><strong>Module Code:</strong> MG-AI-01</div>
          <div><strong>Target UI:</strong> Mobile App & Web</div>
        </div>
      </div>

      <div class="section-title">1. Handwritten Paper Grocery Slip Scanner (OCR + Vision LLM)</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--primary-dark); margin-bottom:3px;">Workflow Steps</div>
          <div class="step-list">
            <div class="step-item">
              <div class="step-num">1</div>
              <div class="step-content"><strong>Image Capture:</strong> User photographs their paper list (camera/gallery). Compressed to &lt;2MB on device.</div>
            </div>
            <div class="step-item">
              <div class="step-num">2</div>
              <div class="step-content"><strong>Vision Entity Extraction:</strong> Image sent to <code>POST /api/ai/ocr-list</code>. Gemini 1.5 Flash Vision extracts handwriting in structured JSON.</div>
            </div>
            <div class="step-item">
              <div class="step-num">3</div>
              <div class="step-content"><strong>Area SKU Matching:</strong> Normalizer maps extracted text against Area Admin's active stock using trigram + embeddings.</div>
            </div>
            <div class="step-item">
              <div class="step-num">4</div>
              <div class="step-content"><strong>Cart Review Screen:</strong> Products matched with &gt;85% confidence are auto-selected; ambiguous items show 2–3 candidate chips.</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div style="font-weight:700; color:var(--accent); margin-bottom:3px;">Sample Vision Extraction Prompt & JSON Output</div>
          <pre><code>// System Prompt: Extract grocery items, brands, and quantities
{
  "raw_items_detected": [
    { "text": "Aashirwad atta 10kg", "name": "Atta", "brand": "Aashirvaad", "qty": 10, "unit": "kg" },
    { "text": "Fortune oil 5 ltr", "name": "Sunflower Oil", "brand": "Fortune", "qty": 5, "unit": "l" },
    { "text": "Sugar 5kg", "name": "Sugar", "brand": null, "qty": 5, "unit": "kg" },
    { "text": "Surf excel 2kg", "name": "Detergent", "brand": "Surf Excel", "qty": 2, "unit": "kg" }
  ]
}</code></pre>
        </div>
      </div>

      <div class="section-title">2. Voice Shopping & Hinglish Audio-to-Cart</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--secondary); margin-bottom:3px;">Speech Pipeline Flow</div>
          <p style="font-size:7.6pt; color:var(--text-body); margin-bottom:4px;">
            Enables natural Hindi / Hinglish / English voice notes (e.g., <i>"Bhaiya 10 kilo rice, 5 kilo atta, 2 packet Tata Namak aur 1 kilo Moong Dal daal do"</i>).
          </p>
          <div class="step-list">
            <div class="step-item">
              <div class="step-num">1</div>
              <div class="step-content"><strong>Audio Recording:</strong> High-quality AAC/WAV audio stream recorded via mobile mic (max 30s).</div>
            </div>
            <div class="step-item">
              <div class="step-num">2</div>
              <div class="step-content"><strong>STT Transcription:</strong> Transcribed via Whisper API or Google Speech API with Indian accent acoustics.</div>
            </div>
            <div class="step-item">
              <div class="step-num">3</div>
              <div class="step-content"><strong>Colloquial Normalization:</strong> Maps terms like <i>"dabba", "packet", "theli", "kilo", "pao"</i> to standardized metric units.</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:3px;">Colloquial Entity Mapping Table</div>
          <table>
            <thead>
              <tr><th>Spoken Term</th><th>Normalized Unit</th><th>Default Pack Mapping</th></tr>
            </thead>
            <tbody>
              <tr><td>"1 pao" / "ek pao"</td><td>250 grams</td><td>250g SKU</td></tr>
              <tr><td>"adha kilo"</td><td>500 grams</td><td>500g SKU</td></tr>
              <tr><td>"ek theli / 1 packet doodh"</td><td>500 ml / 1 L</td><td>Standard Pouch SKU</td></tr>
              <tr><td>"chhota dabba"</td><td>Small / 200g</td><td>Lowest SKU weight</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section-title">3. SKU Resolution & Ambiguity Management Algorithm</div>
      <div class="card card-highlight">
        <div style="font-weight:700; color:var(--primary-dark); margin-bottom:2px;">Multi-Stage Ranking Pipeline</div>
        <p style="font-size:7.8pt; color:var(--text-body); margin-bottom:4px;">
          When an item like <code>"Sugar 5kg"</code> is requested without a brand, the system resolves it using this mathematical priority:
        </p>
        <div class="grid-3" style="font-size:7.5pt;">
          <div style="background:#fff; border:1px solid var(--border); padding:5px 6px; border-radius:4px;">
            <strong>Step A: User Purchase History</strong><br/>
            If user previously bought <i>Madhur Pure & Hygienic Sugar 5kg</i> in last 90 days, select Madhur ($w = 0.50$).
          </div>
          <div style="background:#fff; border:1px solid var(--border); padding:5px 6px; border-radius:4px;">
            <strong>Step B: Area Admin Best Seller</strong><br/>
            If new user, rank by highest sales volume in user's active <code>area_id</code> ($w = 0.30$).
          </div>
          <div style="background:#fff; border:1px solid var(--border); padding:5px 6px; border-radius:4px;">
            <strong>Step C: Max Margin / Value Deal</strong><br/>
            Tiebreaker prioritizes active bundle offer or higher savings margin ($w = 0.20$).
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>MonthlyGrocery Platform Architecture</div>
      <div>Confidential - Internal Engineering Document</div>
      <div>Page 2 of 6</div>
    </div>
  </div>

  <!-- PAGE 3: CONVERSATIONAL ASSISTANT & BASKET PLANNER -->
  <div class="page-container">
    <div class="page-body">
      <div class="doc-header">
        <div>
          <span class="doc-tag">Feature Specification 02</span>
          <div class="doc-title">Conversational AI Grocery Assistant & Budget Solver</div>
          <div class="doc-sub">Natural Language Household Planning, Budget Constrained Solvers & Value Optimizers</div>
        </div>
        <div class="doc-meta-right">
          <div><strong>Module Code:</strong> MG-AI-02</div>
          <div><strong>Target UI:</strong> In-App Assistant & Web Chat</div>
        </div>
      </div>

      <div class="section-title">1. Conversational Engine Architecture & Guardrails</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:3px;">System Prompt Guidelines</div>
          <p style="font-size:7.5pt; color:var(--text-body); margin-bottom:4px;">
            The assistant acts as an expert Indian grocery planning consultant. It strictly grounds responses in available products from the user's selected Area Admin.
          </p>
          <ul style="font-size:7.4pt; padding-left:14px; line-height:1.35;">
            <li><strong>Grounding:</strong> Only recommend products present in current area's active stock.</li>
            <li><strong>Language:</strong> Seamlessly respond in English, Hindi, or Hinglish matching user tone.</li>
            <li><strong>Actionable Tool Execution:</strong> Instead of long text lists, directly call backend function <code>generate_monthly_basket()</code> to render live interactive cart cards.</li>
          </ul>
        </div>
        <div class="card card-accent">
          <div style="font-weight:700; color:var(--accent); margin-bottom:3px;">Function Calling / Tool Schema</div>
          <pre><code>{
  "name": "generate_monthly_basket",
  "description": "Constructs or modifies user monthly grocery cart",
  "parameters": {
    "type": "object",
    "properties": {
      "target_budget": { "type": "number" },
      "dietary_preference": { "type": "string", "enum": ["veg", "non-veg", "jain"] },
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "sku_id": { "type": "string" },
            "quantity": { "type": "integer" },
            "reason": { "type": "string" }
          }
        }
      }
    }
  }
}</code></pre>
        </div>
      </div>

      <div class="section-title">2. Three Core Conversational Scenarios & Solver Logic</div>
      
      <div class="card">
        <div style="font-weight:700; color:var(--primary-dark); font-size:8.2pt; margin-bottom:2px;">Scenario A: Family Profile Grocery Generator</div>
        <div class="grid-2" style="font-size:7.6pt;">
          <div><strong>User Request:</strong> <i>"Humare ghar mein 4 log hain (2 adults, 2 kids, veg). 1 month ki grocery bana do."</i></div>
          <div><strong>AI Action:</strong> Invokes consumption formula for 4-member veg family: 15kg Atta, 10kg Rice, 5L Oil, 4kg Dal assortment, 5kg Sugar, cleaning essentials. Generates interactive cart for ~₹4,500.</div>
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700; color:var(--secondary); font-size:8.2pt; margin-bottom:2px;">Scenario B: Hard Budget-Constrained Basket Solver</div>
        <div class="grid-2" style="font-size:7.6pt;">
          <div><strong>User Request:</strong> <i>"Mujhe strict ₹5,000 ke budget ke andar poori monthly grocery set karni hai."</i></div>
          <div><strong>AI Action:</strong> Runs linear knapsack optimization allocating budget across primary categories (Staples: 55%, Oils: 20%, Cleaning: 15%, Snacks: 10%). Maximizes caloric and essential utility while capping total cost $\le ₹5,000$.</div>
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700; color:var(--accent); font-size:8.2pt; margin-bottom:2px;">Scenario C: Budget Reduction & Savings Maximizer</div>
        <div class="grid-2" style="font-size:7.6pt;">
          <div><strong>User Request:</strong> <i>"Mere last month ke order se ₹500 kam mein poora basket bana do."</i></div>
          <div><strong>AI Action:</strong> Fetches last month's basket (₹4,860). Performs 3-step value arbitrage: (1) Converts 1kg packs to 5kg bulk packs (-₹140), (2) Replaces branded premium pulses with certified value grade (-₹180), (3) Applies active coupon code (-₹180). New total: ₹4,360 (Saved ₹500!).</div>
        </div>
      </div>

      <div class="section-title">3. Interactive UI Render Component</div>
      <div class="card card-highlight">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          <span style="font-weight:700; font-size:8.2pt; color:var(--text-dark);">AI-Generated Basket Preview Card (In-Chat UI)</span>
          <span class="badge badge-green">Calculated Savings: ₹465</span>
        </div>
        <div class="grid-4" style="font-size:7.4pt; text-align:center;">
          <div style="background:#fff; border:1px solid var(--border); padding:4px; border-radius:4px;"><strong>Staples (Atta/Rice)</strong><br/>₹1,850 (25 kg)</div>
          <div style="background:#fff; border:1px solid var(--border); padding:4px; border-radius:4px;"><strong>Edible Oils & Ghee</strong><br/>₹920 (5 Litres)</div>
          <div style="background:#fff; border:1px solid var(--border); padding:4px; border-radius:4px;"><strong>Pulses & Spices</strong><br/>₹840 (8 Items)</div>
          <div style="background:#fff; border:1px solid var(--border); padding:4px; border-radius:4px;"><strong>Home & Cleaning</strong><br/>₹740 (5 Items)</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px; font-size:7.8pt;">
          <div>Total Basket Value: <strong>₹4,350</strong> <span style="text-decoration:line-through; color:var(--text-muted); font-size:7.2pt;">₹4,815 MRP</span></div>
          <button style="background:var(--primary); color:#fff; border:none; padding:3px 8px; border-radius:3px; font-size:7.5pt; font-weight:700;">[Transfer All to Cart]</button>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>MonthlyGrocery Platform Architecture</div>
      <div>Confidential - Internal Engineering Document</div>
      <div>Page 3 of 6</div>
    </div>
  </div>

  <!-- PAGE 4: CONSUMPTION ENGINE & PREDICTIVE REFILL -->
  <div class="page-container">
    <div class="page-body">
      <div class="doc-header">
        <div>
          <span class="doc-tag">Feature Specification 03</span>
          <div class="doc-title">Household Consumption Modeling & Predictive Refills</div>
          <div class="doc-sub">Algorithmic Household Baseline Calculations, Consumption Velocity & Automated Reminders</div>
        </div>
        <div class="doc-meta-right">
          <div><strong>Module Code:</strong> MG-AI-03</div>
          <div><strong>Target UI:</strong> Push Notifications, WhatsApp & Profile Hub</div>
        </div>
      </div>

      <div class="section-title">1. Household Algorithmic Consumption Engine</div>
      <div class="card">
        <p style="font-size:7.6pt; color:var(--text-body); margin-bottom:5px;">
          During customer onboarding, the app collects demographic parameters: <strong>Adults ($A$)</strong>, <strong>Children ($C$)</strong>, <strong>Seniors ($S$)</strong>, <strong>Diet Preference ($D$)</strong>, and <strong>Cooking Frequency ($F$)</strong>. The consumption engine computes baseline quantity $Q_{\text{category}}$ using empirical household standards:
        </p>
        <div class="grid-2">
          <table>
            <thead>
              <tr><th>Category</th><th>Consumption Formula (per month)</th><th>Example (2A + 2C)</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Atta / Wheat Flour</strong></td><td>$Q = (A \times 3.5) + (C \times 2.0) + (S \times 2.5) \text{ kg}$</td><td><strong>11.0 kg</strong> (10kg + 1kg pack)</td></tr>
              <tr><td><strong>Rice</strong></td><td>$Q = (A \times 2.5) + (C \times 1.5) + (S \times 2.0) \text{ kg}$</td><td><strong>8.0 kg</strong> (5kg + 3kg packs)</td></tr>
              <tr><td><strong>Cooking Oil</strong></td><td>$Q = (A \times 1.2) + (C \times 0.6) + (S \times 0.8) \text{ Litres}$</td><td><strong>3.6 Litres</strong> (1 $\times$ 5L Jar)</td></tr>
              <tr><td><strong>Sugar & Salt</strong></td><td>$Q_{\text{sugar}} = (A+C) \times 1.0\text{kg}$; $Q_{\text{salt}} = 1\text{kg fixed}$</td><td><strong>4.0 kg Sugar, 1 kg Salt</strong></td></tr>
              <tr><td><strong>Dal & Pulses</strong></td><td>$Q = (A \times 1.2) + (C \times 0.6) + (S \times 1.0) \text{ kg}$</td><td><strong>3.6 kg</strong> (Toor, Moong, Chana)</td></tr>
              <tr><td><strong>Detergent / Laundry</strong></td><td>$Q = 1.0\text{kg} + (C \times 0.75\text{kg})$</td><td><strong>2.5 kg</strong> (2kg + 500g)</td></tr>
            </tbody>
          </table>
          <div class="card card-highlight">
            <div style="font-weight:700; color:var(--primary-dark); margin-bottom:3px;">Dietary & Regional Adjustments</div>
            <ul style="font-size:7.4pt; padding-left:14px; line-height:1.4;">
              <li><strong>South India Region:</strong> Rice weight $+40\%$, Atta weight $-50\%$, Mustard oil replaced with Sunflower/Gingelly.</li>
              <li><strong>North India Region:</strong> Atta weight $+30\%$, Rice weight $-25\%$, Mustard / Ghee preference boosted.</li>
              <li><strong>Jain Preference:</strong> Automatically excludes root vegetable derivatives, garlic-containing seasonings, and gelatin items.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="section-title">2. Predictive Refill Intelligence & Replenishment Velocity</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:3px;">Velocity Tracking Algorithm</div>
          <p style="font-size:7.5pt; color:var(--text-body); margin-bottom:4px;">
            For each customer and recurring SKU category, the engine calculates the dynamic replenishment cycle:
          </p>
          <div style="background:#f8fafc; border:1px solid var(--border); padding:5px; border-radius:4px; font-family:'JetBrains Mono'; font-size:7.2pt; color:#0f172a; margin-bottom:4px;">
            Interval $T_{\text{cycle}} = \frac{\sum_{i=1}^{n} (t_{i} - t_{i-1})}{n}$<br/>
            Days Elapsed $D_{\text{elapsed}} = \text{CurrentDate} - t_{\text{last\_order}}$<br/>
            Refill Trigger when $D_{\text{elapsed}} \ge (T_{\text{cycle}} - 3 \text{ days})$
          </div>
          <p style="font-size:7.4pt; color:var(--text-muted);">
            If a customer buys 10kg Atta every 28 days, on Day 25 the proactive refill workflow triggers automatically.
          </p>
        </div>
        <div class="card card-accent">
          <div style="font-weight:700; color:var(--accent); margin-bottom:3px;">Automated Alert Templates</div>
          <div style="background:#fff; border:1px solid var(--accent-border); padding:5px 6px; border-radius:4px; margin-bottom:4px;">
            <div style="font-weight:700; font-size:7.4pt; color:var(--accent);">WhatsApp & Push: "Monthly Grocery Due"</div>
            <p style="font-size:7.2pt; color:var(--text-body); margin-top:2px;">
              <i>"Namaste Sharma ji! 🙏 Aapka monthly grocery due ho gaya hai. Aapke pichle 3 months ke hisab se 24 items ki basket ready hai. <strong>Save ₹425</strong> with today's offers. [Click to Review Cart]"</i>
            </p>
          </div>
          <div style="background:#fff; border:1px solid var(--accent-border); padding:5px 6px; border-radius:4px;">
            <div style="font-weight:700; font-size:7.4pt; color:var(--accent);">Micro-Nudge: "Running Low on Essentials"</div>
            <p style="font-size:7.2pt; color:var(--text-body); margin-top:2px;">
              <i>"You usually run out of Tata Salt around Day 30. Would you like to add 1kg to your pending cart?"</i>
            </p>
          </div>
        </div>
      </div>

      <div class="section-title">3. Retention & Repeat Ordering Metrics</div>
      <table>
        <thead>
          <tr><th>KPI Metric</th><th>Target Baseline</th><th>AI Optimization Impact</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>30-Day Repeat Purchase Rate</strong></td><td>25% – 30%</td><td><strong>45% – 55%</strong> via automated refill nudges</td></tr>
          <tr><td><strong>Cart Abandonment Reduction</strong></td><td>65% average</td><td><strong>&lt;35%</strong> with pre-filled 1-click cart</td></tr>
          <tr><td><strong>Average Order Value (AOV)</strong></td><td>₹1,800 (ad-hoc)</td><td><strong>₹4,500 – ₹5,500</strong> (complete household bundle)</td></tr>
        </tbody>
      </table>
    </div>

    <div class="doc-footer">
      <div>MonthlyGrocery Platform Architecture</div>
      <div>Confidential - Internal Engineering Document</div>
      <div>Page 4 of 6</div>
    </div>
  </div>

  <!-- PAGE 5: 1-CLICK CART, SAVINGS ENGINE & ADMIN AI -->
  <div class="page-container">
    <div class="page-body">
      <div class="doc-header">
        <div>
          <span class="doc-tag">Feature Specification 04</span>
          <div class="doc-title">One-Click Monthly Cart, Savings Arbitrage & Admin AI</div>
          <div class="doc-sub">Brand Affinity Matrices, Pack Size Economics & Area Admin Demand Forecasting</div>
        </div>
        <div class="doc-meta-right">
          <div><strong>Module Code:</strong> MG-AI-04</div>
          <div><strong>Target UI:</strong> Home Screen CTA, Admin Dashboard</div>
        </div>
      </div>

      <div class="section-title">1. One-Click Monthly Cart & User Brand Affinity Matrix</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--primary-dark); margin-bottom:3px;">Hero Feature: "Create My Monthly Cart"</div>
          <p style="font-size:7.5pt; color:var(--text-body); margin-bottom:4px;">
            When the user taps the prominent <strong>"MY MONTHLY GROCERY"</strong> CTA, the backend synthesizes their ideal basket in &lt;500ms using a brand affinity score:
          </p>
          <div style="background:#f8fafc; border:1px solid var(--border); padding:4px; border-radius:3px; font-family:'JetBrains Mono'; font-size:7.1pt; color:#0f172a; margin-bottom:4px;">
            $P(\text{Brand}_i \mid \text{Category}_k) = \frac{\text{Orders with Brand}_i}{\text{Total Category Orders}}$
          </div>
          <p style="font-size:7.3pt; color:var(--text-muted);">
            If a customer consistently orders <i>Dove</i> soap, the 1-Click Cart selects Dove; if another buys <i>Santoor</i>, it selects Santoor.
          </p>
        </div>
        <div class="card card-highlight">
          <div style="font-weight:700; color:var(--primary-dark); margin-bottom:3px;">Out-of-Stock Smart Replacement Logic</div>
          <p style="font-size:7.5pt; color:var(--text-body); margin-bottom:4px;">
            If the customer's preferred brand is out-of-stock in their Area Admin's store, the AI does not leave a blank:
          </p>
          <ul style="font-size:7.3pt; padding-left:14px; line-height:1.35;">
            <li>Selects closest match by brand tier & price point.</li>
            <li>Renders a visible badge in UI: <i>"Substituted Aashirvaad with Fortune Atta due to stock unavailability [Change]"</i>.</li>
          </ul>
        </div>
      </div>

      <div class="section-title">2. Smart Savings & Pack-Size Arbitrage Engine</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--secondary); margin-bottom:3px;">Bulk Pack Unit Economics</div>
          <p style="font-size:7.5pt; color:var(--text-body); margin-bottom:4px;">
            Indian grocery shoppers are value-conscious. The engine dynamically detects inefficient cart compositions and displays an instant upgrade badge:
          </p>
          <table>
            <thead>
              <tr><th>Customer Selection</th><th>AI Arbitrage Suggestion</th><th>Instant Saving</th></tr>
            </thead>
            <tbody>
              <tr><td>5 $\times$ 1kg Atta (₹250)</td><td>1 $\times$ 5kg Pack (₹215)</td><td><strong>Save ₹35</strong></td></tr>
              <tr><td>4 $\times$ 500ml Oil (₹480)</td><td>1 $\times$ 2L Jar (₹410)</td><td><strong>Save ₹70</strong></td></tr>
              <tr><td>5 $\times$ 1kg Sugar (₹240)</td><td>1 $\times$ 5kg Bag (₹195)</td><td><strong>Save ₹45</strong></td></tr>
            </tbody>
          </table>
        </div>
        <div class="card card-blue">
          <div style="font-weight:700; color:var(--secondary); margin-bottom:3px;">Savings Zone & Promotion Engine</div>
          <p style="font-size:7.5pt; color:var(--text-body); margin-bottom:4px;">
            Connects cart total with Super Admin / Area Admin promotional campaigns:
          </p>
          <ul style="font-size:7.3pt; padding-left:14px; line-height:1.35;">
            <li><strong>Threshold Unlock:</strong> <i>"Add ₹340 more to unlock Free 1kg Sugar & Free Delivery!"</i></li>
            <li><strong>MonthlyCoins Cashback:</strong> Automatically calculates earned loyalty coins (e.g. ₹5,000 order = 100 MonthlyCoins).</li>
          </ul>
        </div>
      </div>

      <div class="section-title">3. Admin & Operational AI Capabilities</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:2px;">Super Admin: Smart SKU Onboarding</div>
          <p style="font-size:7.4pt; color:var(--text-body);">
            When Super Admin uploads raw product images or Excel sheets, AI automatically generates:
          </p>
          <ul style="font-size:7.3pt; padding-left:14px; line-height:1.35;">
            <li>Standardized title & SEO metadata</li>
            <li>Category & subcategory tagging (15–20 core categories)</li>
            <li>Nutritional facts & dietary flags (Veg, Vegan, Gluten-Free)</li>
          </ul>
        </div>
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:2px;">Area Admin: Restock Demand Forecasting</div>
          <p style="font-size:7.4pt; color:var(--text-body);">
            90% of monthly grocery orders arrive between the <strong>1st and 5th of each month</strong> (salary cycle).
          </p>
          <ul style="font-size:7.3pt; padding-left:14px; line-height:1.35;">
            <li>Forecasts total required volume 5 days in advance (Day 25).</li>
            <li>Prevents out-of-stock incidents for top 50 staple SKUs.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>MonthlyGrocery Platform Architecture</div>
      <div>Confidential - Internal Engineering Document</div>
      <div>Page 5 of 6</div>
    </div>
  </div>

  <!-- PAGE 6: API CONTRACTS, DATABASE SCHEMA & ROADMAP -->
  <div class="page-container">
    <div class="page-body">
      <div class="doc-header">
        <div>
          <span class="doc-tag">Technical Specs & Roadmap</span>
          <div class="doc-title">API Contracts, PostgreSQL Schemas & Implementation Plan</div>
          <div class="doc-sub">Backend Route Definitions, Relational Data Models & Phase-wise Milestone Schedule</div>
        </div>
        <div class="doc-meta-right">
          <div><strong>Target Backend:</strong> Express / Node.js</div>
          <div><strong>Database:</strong> PostgreSQL + pgvector</div>
        </div>
      </div>

      <div class="section-title">1. Dedicated AI RESTful API Endpoints</div>
      <table>
        <thead>
          <tr><th>Endpoint</th><th>Method</th><th>Request Payload Summary</th><th>Response Summary</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>/api/ai/ocr-list</code></td>
            <td><code>POST</code></td>
            <td><code>multipart/form-data</code> (image file, <code>area_id</code>)</td>
            <td>Array of extracted items mapped to active SKUs with confidence scores</td>
          </tr>
          <tr>
            <td><code>/api/ai/voice-to-cart</code></td>
            <td><code>POST</code></td>
            <td><code>multipart/form-data</code> (audio file, <code>area_id</code>)</td>
            <td>Parsed entities, normalized quantities, resolved cart items</td>
          </tr>
          <tr>
            <td><code>/api/ai/assistant/chat</code></td>
            <td><code>POST</code></td>
            <td><code>{ user_id, message, conversation_id, area_id }</code></td>
            <td>Assistant response + structured action cards (basket payload)</td>
          </tr>
          <tr>
            <td><code>/api/ai/monthly-basket</code></td>
            <td><code>POST</code></td>
            <td><code>{ user_id, area_id, budget_limit, family_id }</code></td>
            <td>Optimized 1-Click suggested monthly basket with savings breakdown</td>
          </tr>
          <tr>
            <td><code>/api/ai/predictive-refill</code></td>
            <td><code>GET</code></td>
            <td>Query param: <code>user_id</code></td>
            <td>List of items due for replenishment with cycle indicators</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">2. Database Schema Extensions (PostgreSQL)</div>
      <div class="grid-2">
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:2px;">User Household Profiles Table</div>
          <pre><code>CREATE TABLE user_household_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  adults_count INT DEFAULT 2,
  children_count INT DEFAULT 0,
  seniors_count INT DEFAULT 0,
  dietary_preference VARCHAR(30) DEFAULT 'veg', -- veg/non-veg/jain
  monthly_budget NUMERIC(10,2),
  preferred_brands JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);</code></pre>
        </div>
        <div class="card">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:2px;">User Consumption Cycles Table</div>
          <pre><code>CREATE TABLE user_consumption_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  sku_id UUID REFERENCES master_products(id),
  avg_cycle_days INT NOT NULL DEFAULT 30,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  predicted_next_refill TIMESTAMP WITH TIME ZONE,
  last_notification_sent TIMESTAMP WITH TIME ZONE
);</code></pre>
        </div>
      </div>

      <div class="section-title">3. Implementation Milestones & Delivery Roadmap</div>
      <table>
        <thead>
          <tr><th>Phase & Timeline</th><th>Milestone Deliverables</th><th>Primary Tech Components</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Phase 1 (Sprint 1–2)<br/>Quick Ingestion</strong></td>
            <td>
              • Handwritten Slip OCR Scanner & UI Review Screen<br/>
              • Raw WhatsApp / Text Notes List-to-Cart Parser<br/>
              • Pack-Size Savings Arbitrage suggestions in Cart
            </td>
            <td>
              Gemini 1.5 Flash Vision,<br/>
              Express OCR routes, Mobile camera UI
            </td>
          </tr>
          <tr>
            <td><strong>Phase 2 (Sprint 3–4)<br/>Conversational & Profile</strong></td>
            <td>
              • Hinglish Voice Shopping (Audio Note to Cart)<br/>
              • Conversational Grocery Assistant (In-App Chat)<br/>
              • Household Demographics Profile & Consumption Calculator
            </td>
            <td>
              Whisper STT / Speech API,<br/>
              Gemini Function Calling, Chat Screen
            </td>
          </tr>
          <tr>
            <td><strong>Phase 3 (Sprint 5–6)<br/>Predictive Retention</strong></td>
            <td>
              • Automated Refill Prediction & WhatsApp Reminders<br/>
              • One-Click Monthly Basket Generator with Brand Affinity<br/>
              • Area Admin Restock Demand Forecasting
            </td>
            <td>
              Consumption Velocity Cron Jobs,<br/>
              WhatsApp Cloud API, pgvector
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-footer">
      <div>MonthlyGrocery Platform Architecture</div>
      <div>Confidential - Internal Engineering Document</div>
      <div>Page 6 of 6</div>
    </div>
  </div>

</body>
</html>
"""

html_path = r"c:\Users\Admin\Desktop\Innonsh\MonthlyGrocery\MonthlyGrocery_AI_Features_Specification.html"
pdf_path = r"c:\Users\Admin\Desktop\Innonsh\MonthlyGrocery\MonthlyGrocery_AI_Features_Specification.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_doc)

print(f"HTML written to: {html_path}")

# Now render to PDF using headless Chrome or Edge
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
    print("Executing command:", " ".join(cmd))
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Return code:", res.returncode)
    if os.path.exists(pdf_path):
        print(f"PDF generated successfully! File size: {os.path.getsize(pdf_path)} bytes at {pdf_path}")
    else:
        print("PDF file not found after conversion. Stderr:", res.stderr)
else:
    print("No browser executable found.")
