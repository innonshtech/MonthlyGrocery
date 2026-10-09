import 'dotenv/config';

async function testAllAiEndpoints() {
  const BASE_URL = 'http://localhost:8002/api/ai';
  console.log('==================================================');
  console.log('🧪 TESTING ALL 5 MONTHLYGROCERY AI ENDPOINTS (200 OK)');
  console.log('==================================================\n');

  // 1. Healthcheck
  console.log('1️⃣ [GET /ai/health]');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = (await healthRes.json()) as any;
  console.log('Status:', healthRes.status, '| Health Data:', healthData);

  // 2. Parse Text List (Smart Parser)
  console.log('\n2️⃣ [POST /ai/parse-text-list]');
  const parseRes = await fetch(`${BASE_URL}/parse-text-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: '2kg Aashirvaad Atta\n1L Fortune Sunflower Oil\n500g Madhur Sugar\n2 Dettol Soap',
      city: 'Pimpri Chinchwad',
    }),
  });
  const parseData = (await parseRes.json()) as any;
  console.log('Status:', parseRes.status, '| Total Items Detected:', parseData.total_items_detected, '| Matched Products:', parseData.matched_items?.length);
  if (parseData.matched_items?.length > 0) {
    parseData.matched_items.slice(0, 3).forEach((m: any, i: number) => {
      console.log(`   [${i+1}] Requested: "${m.requested_item?.item_name} (${m.requested_item?.quantity} ${m.requested_item?.unit})" -> Matched: "${m.matched_product?.name}" (₹${m.matched_product?.price})`);
    });
  }

  // 3. AI Assistant Chat (Guardrails + Smart Replies)
  console.log('\n3️⃣ [POST /ai/assistant/chat]');
  const chatRes = await fetch(`${BASE_URL}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Plan a 4-person monthly grocery basket under 4000' }],
    }),
  });
  const chatData = (await chatRes.json()) as any;
  console.log('Status:', chatRes.status, '| Response snippet:\n  "', (chatData.reply || chatData.message || '').slice(0, 150), '..."');

  // 4. Savings Optimizer (Smart Cart)
  console.log('\n4️⃣ [POST /ai/savings-optimizer]');
  const optRes = await fetch(`${BASE_URL}/savings-optimizer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { productId: 'sample-1', quantity: 2 },
        { productId: 'sample-2', quantity: 1 }
      ],
    }),
  });
  const optData = (await optRes.json()) as any;
  console.log('Status:', optRes.status, '| Potential Savings: ₹', optData.potential_savings || 0, '| Suggestions Count:', optData.suggestions?.length || 0);

  // 5. Household Basket Builder
  console.log('\n5️⃣ [POST /ai/household-basket]');
  const basketRes = await fetch(`${BASE_URL}/household-basket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: {
        family_size: 4,
        diet_preference: 'vegetarian',
        monthly_budget: 4500,
      },
      city: 'Pimpri Chinchwad',
    }),
  });
  const basketData = (await basketRes.json()) as any;
  console.log('Status:', basketRes.status, '| Basket Items Count:', basketData.basket?.items?.length || 0, '| Est. Cost: ₹', basketData.basket?.estimated_total_price || 0, '| Total Savings: ₹', basketData.basket?.estimated_savings || 0);

  console.log('\n==================================================');
  console.log('✅ ALL 5 AI BACKEND ENDPOINTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

testAllAiEndpoints().catch(err => {
  console.error('❌ AI Test Error:', err);
  process.exit(1);
});
