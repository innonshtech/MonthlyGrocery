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
