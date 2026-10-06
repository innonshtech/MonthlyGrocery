import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  parseGroceryTextWithAI,
  parseGroceryImageWithVision,
  matchItemsToCatalog,
  chatWithGroceryAssistant,
  ChatMessage,
} from '../services/aiService';

const router = Router();

// In-memory upload storage for image OCR processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max image size
});

/**
 * POST /api/ai/parse-text-list
 * Accepts raw unstructured text / WhatsApp notes list -> returns matched cart products
 */
router.post('/parse-text-list', async (req: Request, res: Response) => {
  try {
    const { text, city } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide grocery list text in the "text" field.',
      });
    }

    // 1. Extract items using AI NLP / normalizer
    const extractedItems = await parseGroceryTextWithAI(text);

    if (extractedItems.length === 0) {
      return res.status(200).json({
        success: true,
        total_items_detected: 0,
        matched_items: [],
        unmatched_items: [],
        estimated_total_mrp: 0,
        estimated_total_price: 0,
        estimated_savings: 0,
        message: 'No recognizable grocery items found in the provided text.',
      });
    }

    // 2. Match extracted entities against live database products
    const result = await matchItemsToCatalog(extractedItems, city);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[AI Router] Error parsing text list:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process grocery list.',
      error: error?.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/ai/ocr-list
 * Accepts image of handwritten / printed paper list -> returns matched cart products
 */
router.post('/ocr-list', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid image file under the field name "image".',
      });
    }

    const city = req.body.city;
    const mimeType = req.file.mimetype || 'image/jpeg';

    // 1. Extract items from image using Vision AI
    const extractedItems = await parseGroceryImageWithVision(req.file.buffer, mimeType);

    if (extractedItems.length === 0) {
      return res.status(200).json({
        success: true,
        total_items_detected: 0,
        matched_items: [],
        unmatched_items: [],
        message: 'Could not detect any grocery items from the image. Please try a clearer photo.',
      });
    }

    // 2. Match entities against database products
    const result = await matchItemsToCatalog(extractedItems, city);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[AI Router] Error processing image OCR:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to scan grocery list image.',
      error: error?.message || 'Vision model error',
    });
  }
});

/**
 * POST /api/ai/assistant/chat
 * Conversational Grocery Assistant & Budget Solver
 */
router.post('/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { messages, city, userProfile } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide messages array with role and content.',
      });
    }

    const response = await chatWithGroceryAssistant(messages as ChatMessage[], city, userProfile);
    return res.status(200).json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    console.error('[AI Router] Error in assistant chat:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process assistant chat message.',
      error: error?.message || 'Assistant error',
    });
  }
});

/**
 * GET /api/ai/health
 * Health check endpoint for AI subsystem
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    module: 'MonthlyGrocery AI Engine',
    features: [
      'multimodal_ocr_scanner',
      'text_list_parser',
      'catalog_matcher',
      'brand_affinity',
      'savings_arbitrage',
    ],
    timestamp: new Date().toISOString(),
  });
});

export default router;
