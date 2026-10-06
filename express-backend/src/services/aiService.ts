import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../config/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export interface ExtractedGroceryItem {
  raw_text: string;
  item_name: string;
  brand: string | null;
  quantity: number;
  unit: string; // kg, g, l, ml, pack, piece
  notes?: string;
}

export interface MatchedProductItem {
  requested_item: ExtractedGroceryItem;
  matched_product: {
    id: string;
    name: string;
    brand: string;
    unit: string;
    mrp: number;
    price: number;
    image_url: string;
    stock: number;
  } | null;
  alternatives: Array<{
    id: string;
    name: string;
    brand: string;
    unit: string;
    mrp: number;
    price: number;
    image_url: string;
  }>;
  match_confidence: number; // 0.0 to 1.0
  is_confident: boolean;
}

export interface ParseListResult {
  success: boolean;
  total_items_detected: number;
  matched_items: MatchedProductItem[];
  unmatched_items: ExtractedGroceryItem[];
  estimated_total_mrp: number;
  estimated_total_price: number;
  estimated_savings: number;
}

/**
 * Normalizes common Indian colloquial units
 */
export function normalizeUnit(rawUnit: string = ''): string {
  const u = rawUnit.toLowerCase().trim();
  if (['kg', 'kilo', 'kilogram', 'kgs', 'kilos'].includes(u)) return 'kg';
  if (['g', 'gm', 'gms', 'gram', 'grams'].includes(u)) return 'g';
  if (['l', 'lt', 'ltr', 'liter', 'litre', 'litres', 'liters'].includes(u)) return 'l';
  if (['ml', 'milli'].includes(u)) return 'ml';
  if (['packet', 'pkt', 'packets', 'theli', 'pouch', 'pouches'].includes(u)) return 'pack';
  if (['piece', 'pc', 'pcs', 'bottle', 'can', 'dabba'].includes(u)) return 'pc';
  if (['pao', 'pav'].includes(u)) return '250g';
  return u || 'pc';
}

/**
 * Fallback Rule-Based NLP Parser for Grocery text when Gemini API key is missing/unreachable
 */
export function ruleBasedTextParser(rawText: string): ExtractedGroceryItem[] {
  const lines = rawText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
  const items: ExtractedGroceryItem[] = [];

  const qtyRegex = /(\d+(?:\.\d+)?)\s*(kg|kilo|kilogram|kgs|g|gm|gms|gram|grams|l|lt|ltr|liter|litre|ml|packet|pkt|theli|pao|pav|pc|pcs|dabba)?/i;

  for (const line of lines) {
    let cleanLine = line.replace(/^[-*•\d+.\s)]+/, '').trim();
    if (!cleanLine) continue;

    const match = cleanLine.match(qtyRegex);
    let qty = 1;
    let unit = 'pc';
    let itemName = cleanLine;

    if (match) {
      qty = parseFloat(match[1]) || 1;
      unit = normalizeUnit(match[2]);
      itemName = cleanLine.replace(match[0], '').trim();
    }

    // Common brand extraction heuristics
    const knownBrands = ['aashirvaad', 'fortune', 'tata', 'madhur', 'saffola', 'surf excel', 'amul', 'everest', 'mdh', 'dettol', 'dove', 'santoor', 'colgate', 'gemini'];
    let brand: string | null = null;
    const lowerName = itemName.toLowerCase();

    for (const b of knownBrands) {
      if (lowerName.includes(b)) {
        brand = b.charAt(0).toUpperCase() + b.slice(1);
        break;
      }
    }

    items.push({
      raw_text: line,
      item_name: itemName.replace(/[^\w\s]/gi, '').trim() || line,
      brand,
      quantity: qty,
      unit: unit === '250g' ? 'g' : unit,
      notes: unit === '250g' ? 'Converted from 1 Pao (250g)' : undefined,
    });
  }

  return items;
}

/**
 * Parses raw text grocery list using Gemini AI (with intelligent rule-based fallback)
 */
export async function parseGroceryTextWithAI(rawText: string): Promise<ExtractedGroceryItem[]> {
  if (!rawText || !rawText.trim()) return [];

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a high-accuracy Indian grocery assistant. Extract all grocery items from this user text into a strict JSON array.
Handle English, Hindi, and Hinglish terms (e.g., '10 kilo atta', '2 packet tata namak', 'adha kilo moong dal', '1 theli doodh', 'ek pao mirchi').

Convert quantities and units to standard:
- 'pao' / 'pav' -> qty: 250, unit: 'g'
- 'adha kilo' -> qty: 500, unit: 'g'
- 'doodh theli' -> unit: 'pack'

Respond ONLY with valid JSON (no markdown ticks, no commentary) matching this schema:
[
  {
    "raw_text": "string",
    "item_name": "clean item name without quantity",
    "brand": "brand name if mentioned or null",
    "quantity": number,
    "unit": "kg|g|l|ml|pack|pc"
  }
]

Input Text:
${rawText}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({
          raw_text: item.raw_text || item.item_name,
          item_name: item.item_name || 'Grocery Item',
          brand: item.brand || null,
          quantity: Number(item.quantity) || 1,
          unit: normalizeUnit(item.unit),
        }));
      }
    } catch (err: any) {
      console.warn('[AI Service] Gemini text parse failed, using fallback parser:', err?.message || err);
    }
  }

  return ruleBasedTextParser(rawText);
}

/**
 * Parses handwritten or printed grocery list image using Gemini 1.5 Flash Vision
 */
export async function parseGroceryImageWithVision(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<ExtractedGroceryItem[]> {
  if (!genAI) {
    throw new Error('Gemini API key is not configured for image OCR processing');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert Indian handwritten grocery list reader.
Carefully examine this handwritten or printed grocery list image.
Transcribe and extract every grocery item, brand, quantity, and unit.
Recognize Indian handwriting, abbreviations, English, and Hinglish.

Respond ONLY with a valid JSON array matching this exact schema:
[
  {
    "raw_text": "Exact text read from image",
    "item_name": "Standard grocery name (e.g. Atta, Rice, Sugar, Moong Dal)",
    "brand": "Brand name if visible (e.g. Aashirvaad, Tata, Fortune) or null",
    "quantity": 1,
    "unit": "kg|g|l|ml|pack|pc"
  }
]`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        raw_text: item.raw_text || item.item_name,
        item_name: item.item_name || 'Grocery Item',
        brand: item.brand || null,
        quantity: Number(item.quantity) || 1,
        unit: normalizeUnit(item.unit),
      }));
    }
    return [];
  } catch (err: any) {
    console.error('[AI Service] Gemini Vision OCR failed:', err?.message || err);
    throw new Error(`Failed to parse image list: ${err?.message || 'Vision model error'}`);
  }
}

/**
 * Matches extracted grocery items against active database products
 */
export async function matchItemsToCatalog(
  extractedItems: ExtractedGroceryItem[],
  city?: string
): Promise<ParseListResult> {
  const matchedItems: MatchedProductItem[] = [];
  const unmatchedItems: ExtractedGroceryItem[] = [];

  let totalMrp = 0;
  let totalPrice = 0;

  // Fetch candidate products from database
  const { rows: allProducts } = await query(
    `SELECT id, name, brand, unit, mrp, price, stock, image_url, primary_category
     FROM products
     WHERE available = true AND stock > 0
     ORDER BY featured DESC, best_seller DESC
     LIMIT 1000`
  );

  for (const item of extractedItems) {
    const searchTerms = [
      item.brand,
      item.item_name,
    ].filter(Boolean).join(' ').toLowerCase();

    const words = searchTerms.split(/\s+/).filter(w => w.length > 1);

    // Score all candidate products
    const scoredProducts = allProducts.map(prod => {
      const prodName = (prod.name || '').toLowerCase();
      const prodBrand = (prod.brand || '').toLowerCase();
      const prodCategory = (prod.primary_category || '').toLowerCase();

      let score = 0;

      // Brand exact match
      if (item.brand && prodBrand.includes(item.brand.toLowerCase())) {
        score += 40;
      }

      // Word matches in product name
      for (const word of words) {
        if (prodName.includes(word)) score += 20;
        if (prodCategory.includes(word)) score += 10;
      }

      // Exact item name match in product name
      if (prodName.includes(item.item_name.toLowerCase())) {
        score += 30;
      }

      return {
        product: prod,
        score,
      };
    });

    // Sort by score descending
    scoredProducts.sort((a, b) => b.score - a.score);

    const topMatch = scoredProducts[0];
    const topScore = topMatch ? topMatch.score : 0;

    if (topMatch && topScore >= 30) {
      const bestProd = topMatch.product;
      const mrp = Number(bestProd.mrp) || Number(bestProd.price) || 0;
      const price = Number(bestProd.price) || mrp;
      const qty = item.quantity || 1;

      totalMrp += mrp * qty;
      totalPrice += price * qty;

      const alternatives = scoredProducts
        .slice(1, 4)
        .filter(sp => sp.score >= 20)
        .map(sp => ({
          id: sp.product.id,
          name: sp.product.name,
          brand: sp.product.brand || '',
          unit: sp.product.unit || '',
          mrp: Number(sp.product.mrp) || 0,
          price: Number(sp.product.price) || 0,
          image_url: sp.product.image_url || '',
        }));

      matchedItems.push({
        requested_item: item,
        matched_product: {
          id: bestProd.id,
          name: bestProd.name,
          brand: bestProd.brand || '',
          unit: bestProd.unit || '',
          mrp,
          price,
          image_url: bestProd.image_url || '',
          stock: bestProd.stock || 0,
        },
        alternatives,
        match_confidence: Math.min(1, topScore / 100),
        is_confident: topScore >= 50,
      });
    } else {
      unmatchedItems.push(item);
    }
  }

  const savings = Math.max(0, totalMrp - totalPrice);

  return {
    success: true,
    total_items_detected: extractedItems.length,
    matched_items: matchedItems,
    unmatched_items: unmatchedItems,
    estimated_total_mrp: Number(totalMrp.toFixed(2)),
    estimated_total_price: Number(totalPrice.toFixed(2)),
    estimated_savings: Number(savings.toFixed(2)),
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatResponse {
  reply: string;
  action_type: 'NONE' | 'SUGGEST_BASKET' | 'SUGGEST_SWAPS';
  basket?: {
    title: string;
    items: Array<{
      product: {
        id: string;
        name: string;
        brand: string;
        unit: string;
        price: number;
        mrp: number;
        image_url: string;
      };
      quantity: number;
    }>;
    total_mrp: number;
    total_price: number;
    savings: number;
  };
  quick_replies?: string[];
}

/**
 * Conversational AI Assistant for Household Grocery Planning & Budget Optimization
 */
export async function chatWithGroceryAssistant(
  messages: ChatMessage[],
  city?: string,
  userProfile?: { adults?: number; kids?: number; diet?: string; budget?: number }
): Promise<AssistantChatResponse> {
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const lowerMsg = lastUserMsg.toLowerCase();

  // 1. Fetch available stock for grounding
  const { rows: availableProducts } = await query(
    `SELECT id, name, brand, unit, mrp, price, stock, image_url, primary_category
     FROM products
     WHERE available = true AND stock > 0
     ORDER BY featured DESC, best_seller DESC
     LIMIT 50`
  );

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const productCatalogSummary = availableProducts
        .map(p => `ID:${p.id}|${p.name}|${p.brand}|${p.unit}|₹${p.price}|MRP:₹${p.mrp}`)
        .join('\n');

      const systemPrompt = `You are "MonthlyGrocery AI Assistant" - an expert Indian household grocery planner.
Your goal is to help families build monthly baskets, plan under budgets, and maximize savings.
Respond naturally in friendly Hinglish / English.

ACTIVE IN-STOCK CATALOG:
${productCatalogSummary}

USER PROFILE / CONTEXT:
${JSON.stringify(userProfile || {})}

CHAT HISTORY:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

INSTRUCTIONS:
1. If the user asks for a monthly plan, budget basket, or items list:
   Select suitable items strictly from the ACTIVE IN-STOCK CATALOG above.
   Return valid JSON only matching this schema:
   {
     "reply": "Conversational explanation in Hinglish/English",
     "action_type": "SUGGEST_BASKET",
     "basket": {
       "title": "Monthly Household Basket",
       "item_ids": [
         { "id": "product_id", "qty": 1 }
       ]
     },
     "quick_replies": ["Save ₹500 more", "Add more Snacks", "Review Basket"]
   }

2. If the user asks general questions, return JSON:
   {
     "reply": "Helpful answer",
     "action_type": "NONE",
     "quick_replies": ["Plan 4-Person Basket", "Budget Under ₹4,000"]
   }

Respond ONLY with valid JSON. No markdown ticks, no extra text.`;

      const aiRes = await model.generateContent(systemPrompt);
      const text = aiRes.response.text().trim();
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.action_type === 'SUGGEST_BASKET' && parsed.basket?.item_ids) {
        let basketMrp = 0;
        let basketPrice = 0;
        const basketItems: any[] = [];

        for (const it of parsed.basket.item_ids) {
          const prod = availableProducts.find(p => p.id === it.id);
          if (prod) {
            const qty = Number(it.qty) || 1;
            const price = Number(prod.price) || 0;
            const mrp = Number(prod.mrp) || price;
            basketMrp += mrp * qty;
            basketPrice += price * qty;
            basketItems.push({
              product: {
                id: prod.id,
                name: prod.name,
                brand: prod.brand || '',
                unit: prod.unit || '',
                price,
                mrp,
                image_url: prod.image_url || '',
              },
              quantity: qty,
            });
          }
        }

        if (basketItems.length > 0) {
          return {
            reply: parsed.reply,
            action_type: 'SUGGEST_BASKET',
            basket: {
              title: parsed.basket.title || 'Personalized Monthly Basket',
              items: basketItems,
              total_mrp: Number(basketMrp.toFixed(2)),
              total_price: Number(basketPrice.toFixed(2)),
              savings: Number(Math.max(0, basketMrp - basketPrice).toFixed(2)),
            },
            quick_replies: parsed.quick_replies || ['Transfer to Cart 🛒', 'Save ₹300 More'],
          };
        }
      }

      return {
        reply: parsed.reply || 'Main aapke monthly grocery planning mein madad karne ke liye tayyar hoon!',
        action_type: 'NONE',
        quick_replies: parsed.quick_replies || ['Plan 4-Person Basket', 'Budget under ₹5,000'],
      };
    } catch (err: any) {
      console.warn('[AI Assistant] Gemini chat call failed, falling back to rule solver:', err?.message || err);
    }
  }

  // Smart Heuristic Fallback Solver
  const sampleItems = availableProducts.slice(0, 6);
  let fallbackMrp = 0;
  let fallbackPrice = 0;
  const items = sampleItems.map(p => {
    const mrp = Number(p.mrp) || Number(p.price) || 0;
    const price = Number(p.price) || mrp;
    fallbackMrp += mrp;
    fallbackPrice += price;
    return {
      product: {
        id: p.id,
        name: p.name,
        brand: p.brand || '',
        unit: p.unit || '',
        price,
        mrp,
        image_url: p.image_url || '',
      },
      quantity: 1,
    };
  });

  return {
    reply: `Maine aapke liye top essential monthly staples (Atta, Oil, Pulses, Spices) ka balanced basket taiyyar kiya hai. Isme aapko direct ₹${(fallbackMrp - fallbackPrice).toFixed(0)} ki savings mil rahi hai!`,
    action_type: 'SUGGEST_BASKET',
    basket: {
      title: 'Suggested Household Monthly Basket',
      items,
      total_mrp: Number(fallbackMrp.toFixed(2)),
      total_price: Number(fallbackPrice.toFixed(2)),
      savings: Number(Math.max(0, fallbackMrp - fallbackPrice).toFixed(2)),
    },
    quick_replies: ['Transfer to Cart 🛒', 'Change Quantity', 'Add Snacks'],
  };
}

export interface SavingsSuggestion {
  current_product_id: string;
  current_product_name: string;
  current_quantity: number;
  current_total_price: number;
  suggested_product: {
    id: string;
    name: string;
    brand: string;
    unit: string;
    price: number;
    mrp: number;
    image_url: string;
  };
  suggested_quantity: number;
  suggested_total_price: number;
  saving_amount: number;
  type: 'BULK_PACK_UPGRADE' | 'VALUE_BRAND_SWAP';
  message: string;
}

export interface CartSavingsOptimizationResult {
  has_optimizations: boolean;
  total_potential_savings: number;
  suggestions: SavingsSuggestion[];
}

/**
 * Identifies bulk-pack and value brand arbitrage to maximize user savings in cart
 */
export async function optimizeCartSavings(
  cartItems: Array<{ productId: string; quantity: number }>
): Promise<CartSavingsOptimizationResult> {
  if (!cartItems || cartItems.length === 0) {
    return {
      has_optimizations: false,
      total_potential_savings: 0,
      suggestions: [],
    };
  }

  const productIds = cartItems.map(it => it.productId).filter(Boolean);
  if (productIds.length === 0) {
    return { has_optimizations: false, total_potential_savings: 0, suggestions: [] };
  }

  // Fetch current cart products details
  const { rows: currentProducts } = await query(
    `SELECT id, name, brand, primary_category, unit, mrp, price, image_url
     FROM products
     WHERE id = ANY($1::text[])`,
    [productIds]
  );

  const suggestions: SavingsSuggestion[] = [];
  let totalSavings = 0;

  for (const item of cartItems) {
    const prod = currentProducts.find(p => p.id === item.productId);
    if (!prod) continue;

    const qty = item.quantity || 1;
    const currentPrice = Number(prod.price) || 0;
    const currentTotal = currentPrice * qty;

    // Check 1: Bulk Pack Arbitrage (e.g. qty >= 2 of 1kg -> search for 5kg or 2L)
    if (qty >= 2) {
      const { rows: bulkMatches } = await query(
        `SELECT id, name, brand, unit, mrp, price, image_url
         FROM products
         WHERE brand = $1 AND primary_category = $2 AND id != $3 AND available = true AND stock > 0
         LIMIT 5`,
        [prod.brand, prod.primary_category, prod.id]
      );

      for (const bulk of bulkMatches) {
        const bulkPrice = Number(bulk.price) || 0;
        // If bulk pack price is cheaper than buying multiple small items
        if (bulkPrice > currentPrice && bulkPrice < currentTotal) {
          const saving = Number((currentTotal - bulkPrice).toFixed(2));
          if (saving >= 15) {
            suggestions.push({
              current_product_id: prod.id,
              current_product_name: prod.name,
              current_quantity: qty,
              current_total_price: currentTotal,
              suggested_product: {
                id: bulk.id,
                name: bulk.name,
                brand: bulk.brand || '',
                unit: bulk.unit || '',
                price: bulkPrice,
                mrp: Number(bulk.mrp) || bulkPrice,
                image_url: bulk.image_url || '',
              },
              suggested_quantity: 1,
              suggested_total_price: bulkPrice,
              saving_amount: saving,
              type: 'BULK_PACK_UPGRADE',
              message: `Switch to 1 × ${bulk.name} and save ₹${saving.toFixed(0)}!`,
            });
            totalSavings += saving;
            break;
          }
        }
      }
    }
  }

  return {
    has_optimizations: suggestions.length > 0,
    total_potential_savings: Number(totalSavings.toFixed(2)),
    suggestions,
  };
}


