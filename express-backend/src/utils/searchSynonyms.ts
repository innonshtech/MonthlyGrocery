/**
 * Comprehensive Hindi, Hinglish, Marathi, and English Grocery Synonyms Dictionary.
 * Maps common vernacular search terms (e.g. 'aata', 'gehu', 'tel', 'chawal', 'shakkar', 'namak', 'sabun')
 * to master product categories, brands, and canonical grocery titles.
 */

export interface SynonymGroup {
  keywords: string[];
  canonical: string[];
  categories: string[];
}

export const GROCERY_SYNONYM_GROUPS: SynonymGroup[] = [
  // 1. Atta, Flours & Grains
  {
    keywords: [
      'atta', 'aata', 'aatha', 'gehu', 'gehun', 'flour', 'wheat', 'wheat flour', 'chakki',
      'chakki atta', 'aashirvaad', 'ashirvad', 'ashirwaad', 'aashirwad', 'multigrain',
      'shudh chakki', 'aata 10kg', 'atta 10kg', 'atta 5kg', 'maida', 'besan', 'chana flour',
      'gram flour', 'suji', 'sooji', 'rava', 'semolina', 'ragi', 'jowar', 'bajra',
      'आटा', 'गेहूं', 'मैदा', 'बेसन', 'सूजी', 'रवा'
    ],
    canonical: ['atta', 'flour', 'wheat', 'chakki', 'besan', 'suji', 'maida'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },

  // 2. Rice & Basmati
  {
    keywords: [
      'chawal', 'chaval', 'chaawal', 'rice', 'basmati', 'daawat', 'dawat', 'india gate', 'indrayani',
      'kolam', 'sona masoori', 'sonamasoori', 'tukda', 'wada kolam', 'brown rice', 'poha', 'powa', 'aval',
      'चावल', 'बासमती', 'पोहा'
    ],
    canonical: ['rice', 'basmati', 'chawal', 'poha'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },

  // 3. Edible Oils & Ghee
  {
    keywords: [
      'tel', 'tail', 'oil', 'cooking oil', 'edible oil', 'refined oil', 'refine tel', 'refine',
      'mustard oil', 'sarson tel', 'sarson', 'sarson oil', 'sunflower oil', 'surajmukhi',
      'soya oil', 'soyabean oil', 'fortune', 'fartune', 'fortne', 'gemini', 'saffola', 'dhara',
      'groundnut oil', 'moongfali tel', 'singdana tel', 'rice bran', 'ghee', 'ghee 1l', 'amul ghee',
      'gowardhan ghee', 'tup', 'shuddh ghee', 'pure ghee',
      'तेल', 'सरसों तेल', 'घी', 'फॉर्च्यून'
    ],
    canonical: ['oil', 'ghee', 'mustard oil', 'sunflower oil', 'soyabean oil', 'fortune'],
    categories: ['Oils & Ghee', 'Grocery & Kitchen']
  },

  // 4. Dals & Pulses (Lentils)
  {
    keywords: [
      'dal', 'daal', 'dall', 'pulses', 'toor dal', 'tur dal', 'arhar dal', 'arhar', 'tuvar dal',
      'chana dal', 'chana', 'kabuli chana', 'kala chana', 'moong dal', 'mung dal', 'moong',
      'green moong', 'yellow moong', 'urad dal', 'urad', 'masoor dal', 'masur', 'red lentil',
      'rajma', 'chole', 'lobia', 'vatana', 'matar', 'safed matar',
      'दाल', 'तूर दाल', 'चना', 'मूंग', 'उड़द', 'राजमा', 'छोले'
    ],
    canonical: ['dal', 'toor dal', 'chana dal', 'moong dal', 'urad dal', 'rajma', 'chole'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },

  // 5. Sugar, Jaggery & Sweeteners
  {
    keywords: [
      'cheeni', 'chini', 'shakkar', 'sakar', 'sugar', 'white sugar', 'madhur', 'brown sugar',
      'gud', 'gur', 'jaggery', 'bura', 'boora', 'khand',
      'चीनी', 'शक्कर', 'गुड़'
    ],
    canonical: ['sugar', 'cheeni', 'jaggery', 'gud'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },

  // 6. Salt & Spices (Masale)
  {
    keywords: [
      'namak', 'salt', 'tata salt', 'tata namak', 'iodized salt', 'sendha', 'rock salt',
      'sendha namak', 'kala namak', 'black salt', 'lite salt',
      'नमक', 'सेंधा नमक'
    ],
    canonical: ['salt', 'namak'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['haldi', 'turmeric', 'haldi powder', 'turmeric powder', 'everest haldi', 'mdh haldi', 'catch haldi', 'हल्दी'],
    canonical: ['haldi', 'turmeric'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['mirch', 'mirchi', 'lal mirch', 'red chilli', 'chilli powder', 'degi mirch', 'kashmiri mirch', 'tikhalal', 'मिर्च', 'लाल मिर्च'],
    canonical: ['mirch', 'chilli', 'red chilli'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['dhaniya', 'dhania', 'coriander', 'coriander powder', 'dhana jeera', 'धनिया'],
    canonical: ['dhaniya', 'coriander'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['jeera', 'jira', 'cumin', 'cumin seeds', 'zeera', 'जीरा'],
    canonical: ['jeera', 'cumin'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['rai', 'mustard seeds', 'sarson dana', 'mohari', 'राई'],
    canonical: ['rai', 'mustard seeds'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['garam masala', 'masala', 'sabji masala', 'kitchen king', 'meat masala', 'chicken masala', 'pav bhaji masala', 'chhole masala', 'sambar masala', 'biryani masala', 'chaat masala', 'hing', 'asafoetida', 'गरम मसाला', 'मसाला', 'हींग'],
    canonical: ['masala', 'garam masala'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['elaichi', 'cardamom', 'green cardamom', 'badi elaichi', 'black cardamom', 'laung', 'clove', 'dalchini', 'cinnamon', 'kali mirch', 'black pepper', 'tej patta', 'bay leaf', 'saunf', 'fennel', 'methi', 'fenugreek', 'ajwain', 'carom seeds', 'इलायची', 'लौंग', 'दालचीनी', 'काली मिर्च'],
    canonical: ['spices', 'whole spices', 'elaichi', 'laung'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },

  // 7. Dry Fruits & Nuts
  {
    keywords: ['kaju', 'kaju tukda', 'cashew', 'cashews', 'cashewnut', 'काजू'],
    canonical: ['kaju', 'cashew', 'cashews'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: ['badam', 'almond', 'almonds', 'mamra badam', 'california badam', 'बादाम'],
    canonical: ['badam', 'almond', 'almonds'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: ['kismis', 'kishmish', 'kismish', 'raisins', 'dry grapes', 'munakka', 'draksh', 'किशमिश'],
    canonical: ['kismis', 'kishmish', 'raisins'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: ['akhrot', 'walnut', 'walnuts', 'pista', 'pistachio', 'pistachios', 'anjir', 'anjeer', 'fig', 'makhana', 'foxnut', 'dry fruits', 'mixed dry fruits', 'dryfruit', 'अखरोट', 'पिस्ता', 'मखाना'],
    canonical: ['dry fruits', 'akhrot', 'pista', 'makhana'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },

  // 8. Beverages & Tea / Coffee
  {
    keywords: [
      'chai', 'chay', 'chaipatti', 'chai patti', 'tea', 'tea powder', 'tata tea', 'tata tea gold',
      'red label', 'taj mahal', 'wagh bakri', 'green tea', 'lipton', 'चाय', 'चाय पत्ती'
    ],
    canonical: ['tea', 'chai', 'chai patti'],
    categories: ['Beverages', 'Snacks & Beverages']
  },
  {
    keywords: ['coffee', 'nescafe', 'bru', 'instant coffee', 'filter coffee', 'davidoff', 'कॉफी'],
    canonical: ['coffee', 'nescafe', 'bru'],
    categories: ['Beverages', 'Snacks & Beverages']
  },
  {
    keywords: ['bournvita', 'bonvita', 'horlicks', 'boost', 'complan', 'milo', 'glucon d', 'glucond', 'pediasure'],
    canonical: ['bournvita', 'horlicks', 'health drink'],
    categories: ['Beverages', 'Baby Care', 'Personal Care']
  },

  // 9. Snacks & Noodles & Biscuits
  {
    keywords: ['maggi', 'magi', 'maggie', 'noodles', 'instant noodles', 'yippee', 'top ramen', 'pasta', 'macaroni', 'vermicelli', 'sewai', 'semiya', 'मैगी', 'नूडल्स'],
    canonical: ['maggi', 'noodles', 'pasta'],
    categories: ['Snacks', 'Snacks & Beverages']
  },
  {
    keywords: ['biscuit', 'biscuits', 'cookie', 'cookies', 'parle g', 'parle-g', 'good day', 'monaco', 'krackjack', 'marie gold', 'bourbon', 'hide and seek', 'oreo', 'rusk', 'toast', 'बिस्कुट'],
    canonical: ['biscuit', 'biscuits', 'cookies'],
    categories: ['Biscuits', 'Snacks & Beverages']
  },
  {
    keywords: ['namkeen', 'bhujia', 'sev', 'haldiram', 'bikaji', 'balaji', 'chips', 'lays', 'kurkure', 'chivda', 'farsan', 'peanuts', 'moongfali', 'नमकीन', 'भुजिया'],
    canonical: ['namkeen', 'bhujia', 'chips', 'snacks'],
    categories: ['Snacks', 'Snacks & Beverages']
  },

  // 10. Cleaning & Laundry
  {
    keywords: [
      'surf', 'detergent', 'washing powder', 'nirma', 'surf excel', 'ariel', 'tide', 'wheel',
      'rin', 'liquid detergent', 'washing liquid', 'fabric conditioner', 'comfort', 'fabric whitener', 'ujala',
      'सर्फ', 'डिटर्जेंट'
    ],
    canonical: ['detergent', 'surf', 'washing powder'],
    categories: ['Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'sabun', 'soap', 'bath soap', 'bathing soap', 'lux', 'dettol', 'lifebuoy', 'dove',
      'pears', 'santoor', 'cinthol', 'godrej no 1', 'medimix', 'साबुन'
    ],
    canonical: ['soap', 'sabun', 'bath soap'],
    categories: ['Personal Care', 'Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'bartan', 'dishwash', 'vim', 'vim bar', 'vim gel', 'dishwash bar', 'dishwash liquid',
      'scrub pad', 'scotch brite', 'pril', 'exo', 'बर्तन साबुन'
    ],
    canonical: ['dishwash', 'vim', 'bartan'],
    categories: ['Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'cleaner', 'floor cleaner', 'lizol', 'phenyl', 'harpic', 'toilet cleaner', 'domex',
      'colin', 'glass cleaner', 'odonil', 'room freshener', 'all out', 'good knight', 'mosquito repellent',
      'फिनाइल', 'हारपिक', 'लायजोल'
    ],
    canonical: ['floor cleaner', 'toilet cleaner', 'lizol', 'harpic'],
    categories: ['Cleaning', 'Home & Kitchen', 'Household & Care']
  },

  // 11. Personal Care & Dental
  {
    keywords: ['colgate', 'toothpaste', 'pepsodent', 'close up', 'sensodyne', 'dabur red', 'meswak', 'toothbrush', 'brush', 'पेस्ट', 'टूथपेस्ट'],
    canonical: ['toothpaste', 'colgate', 'toothbrush'],
    categories: ['Personal Care', 'Household & Care']
  },
  {
    keywords: ['shampoo', 'conditioner', 'head and shoulders', 'clinic plus', 'dove shampoo', 'sunsilk', 'pantene', 'tresemme', 'hair oil', 'parachute', 'coconut hair oil', 'bajaj almond drops', 'navratna', 'शैम्पू', 'तेल'],
    canonical: ['shampoo', 'hair oil'],
    categories: ['Personal Care', 'Household & Care']
  },
];

/** Clean and normalize search string */
export function normalizeSearchTerm(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ') // support devanagari letters as well
    .replace(/\s+/g, ' ')
    .trim();
}

/** Expand query tokens with matching synonyms, canonical keywords and categories */
export function expandSearchTerms(query: string): {
  tokens: string[];
  expandedKeywords: Set<string>;
  matchedCategories: Set<string>;
} {
  const normalized = normalizeSearchTerm(query);
  const rawTokens = normalized.split(/\s+/).filter(Boolean);

  const expandedKeywords = new Set<string>();
  const matchedCategories = new Set<string>();

  if (!normalized) {
    return { tokens: [], expandedKeywords, matchedCategories };
  }

  // Add original query and full phrase
  expandedKeywords.add(normalized);
  for (const t of rawTokens) {
    expandedKeywords.add(t);
  }

  // Look for match in synonym groups
  for (const group of GROCERY_SYNONYM_GROUPS) {
    let groupMatched = false;

    // Check full phrase match
    for (const kw of group.keywords) {
      if (normalized === kw || normalized.includes(kw) || kw.includes(normalized)) {
        groupMatched = true;
        break;
      }
    }

    // Check individual token match
    if (!groupMatched) {
      for (const t of rawTokens) {
        if (t.length >= 2 && group.keywords.some((kw) => kw === t || kw.includes(t))) {
          groupMatched = true;
          break;
        }
      }
    }

    if (groupMatched) {
      for (const kw of group.keywords) expandedKeywords.add(kw);
      for (const can of group.canonical) expandedKeywords.add(can);
      for (const cat of group.categories) matchedCategories.add(cat.toLowerCase());
    }
  }

  return {
    tokens: rawTokens,
    expandedKeywords,
    matchedCategories,
  };
}
