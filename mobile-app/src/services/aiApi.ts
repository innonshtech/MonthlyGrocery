import { API_BASE } from '../config/api';

export interface ExtractedGroceryItem {
  raw_text: string;
  item_name: string;
  brand: string | null;
  quantity: number;
  unit: string;
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
  match_confidence: number;
  is_confident: boolean;
}

export interface ParseListResponse {
  success: boolean;
  total_items_detected: number;
  matched_items: MatchedProductItem[];
  unmatched_items: ExtractedGroceryItem[];
  estimated_total_mrp: number;
  estimated_total_price: number;
  estimated_savings: number;
  message?: string;
}

/**
 * Sends pasted / typed raw text grocery list to AI parser
 */
export async function parseGroceryTextList(text: string, city?: string): Promise<ParseListResponse> {
  const res = await fetch(`${API_BASE}/ai/parse-text-list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, city }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to parse grocery list');
  }
  return data;
}

/**
 * Uploads an image of handwritten / printed grocery list to Vision AI OCR parser
 */
export async function scanGroceryImage(imageUri: string, mimeType: string = 'image/jpeg', city?: string): Promise<ParseListResponse> {
  const formData = new FormData();

  const filename = imageUri.split('/').pop() || 'grocery_list.jpg';

  formData.append('image', {
    uri: imageUri,
    type: mimeType,
    name: filename,
  } as any);

  if (city) {
    formData.append('city', city);
  }

  const res = await fetch(`${API_BASE}/ai/ocr-list`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      // Note: Do NOT set Content-Type manually for multipart/form-data in fetch on React Native
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to scan grocery list photo');
  }
  return data;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatResult {
  success: boolean;
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
 * Sends chat message to conversational AI grocery planner
 */
export async function sendAssistantChatMessage(
  messages: ChatMessage[],
  city?: string,
  userProfile?: { adults?: number; kids?: number; diet?: string; budget?: number }
): Promise<AssistantChatResult> {
  const res = await fetch(`${API_BASE}/ai/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, city, userProfile }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to send message to assistant');
  }
  return data;
}

