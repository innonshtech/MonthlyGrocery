/**
 * Indian Grocery Synonym & Keyword Mapping Dictionary
 * Maps Hindi, Hinglish, Marathi, and colloquial grocery search terms to standard catalog terms,
 * brands, and product categories.
 */

export const GROCERY_SYNONYM_GROUPS: {
  keywords: string[];
  canonical: string[];
  categories: string[];
}[] = [
  // 1. Atta, Wheat, Flours & Grains
  {
    keywords: [
      'gehu', 'gehun', 'gahu', 'aata', 'atta', 'ata', 'flour', 'chakki', 'wheat',
      'whole wheat', 'shudh chakki', 'rotli', 'roti', 'chapati', 'multigrain'
    ],
    canonical: ['atta', 'wheat', 'flour', 'chakki'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },
  {
    keywords: ['maida', 'all purpose flour', 'refined flour'],
    canonical: ['maida', 'flour'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },
  {
    keywords: ['sooji', 'suji', 'rava', 'rawa', 'semolina'],
    canonical: ['sooji', 'suji', 'rava'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },
  {
    keywords: ['besan', 'gram flour', 'chana flour'],
    canonical: ['besan', 'gram flour'],
    categories: ['Dals & Pulses', 'Atta & Rice', 'Grocery & Kitchen']
  },

  // 2. Rice & Poha
  {
    keywords: [
      'chawal', 'chaval', 'tandul', 'bhat', 'rice', 'basmati', 'kolam', 'sona masoori',
      'wada kolam', 'indrayani', 'brown rice', 'boiled rice', 'steam rice', 'biryani rice',
      'tukda rice', 'mogra'
    ],
    canonical: ['rice', 'basmati', 'kolam', 'chawal'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },
  {
    keywords: ['poha', 'pohe', 'avalakki', 'flattened rice', 'beaten rice', 'thick poha', 'thin poha'],
    canonical: ['poha', 'rice'],
    categories: ['Atta & Rice', 'Snacks', 'Grocery & Kitchen']
  },

  // 3. Oils & Ghee
  {
    keywords: [
      'tel', 'tail', 'oil', 'cooking oil', 'edible oil', 'refined oil', 'kachi ghani',
      'mustard oil', 'sarson tel', 'sarson ka tel', 'sarso', 'rai tel', 'fortune oil',
      'gemini', 'dhara', 'saffola', 'emami', 'sweekar', 'sunflower oil', 'surajmukhi',
      'soya oil', 'soyabean oil', 'soya bean', 'groundnut oil', 'moongfali tel',
      'singdana tel', 'rice bran oil', 'til tel', 'sesame oil', 'coconut oil', 'nariyal tel'
    ],
    canonical: ['oil', 'tel', 'mustard oil', 'sunflower oil', 'soya oil', 'groundnut oil'],
    categories: ['Oils & Ghee', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'ghee', 'ghi', 'tup', 'pure ghee', 'cow ghee', 'desi ghee', 'buffalo ghee',
      'amul ghee', 'gowardhan', 'patanjali ghee', 'ananda', 'mother dairy ghee', 'dalda', 'vanaspati'
    ],
    canonical: ['ghee', 'desi ghee', 'cow ghee'],
    categories: ['Oils & Ghee', 'Grocery & Kitchen']
  },

  // 4. Dals & Pulses (Lentils)
  {
    keywords: [
      'dal', 'daal', 'dall', 'lentil', 'pulses', 'toor dal', 'tur dal', 'arhar dal',
      'tuvar', 'yellow dal', 'peeli dal', 'sambar dal'
    ],
    canonical: ['dal', 'toor dal', 'tur dal', 'arhar dal'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },
  {
    keywords: ['moong dal', 'mung dal', 'moong chilka', 'moong dhuli', 'green gram', 'yellow moong', 'sabut moong'],
    canonical: ['moong dal', 'moong'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },
  {
    keywords: ['urad dal', 'urad gota', 'urad chilka', 'urad dhuli', 'black gram', 'idli dal', 'dosa dal'],
    canonical: ['urad dal', 'urad'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },
  {
    keywords: ['chana dal', 'chana', 'kala chana', 'black chickpea', 'chickpeas', 'bengal gram', 'kabuli chana', 'chole', 'safed chana', 'white chickpeas'],
    canonical: ['chana', 'chana dal', 'chole', 'kabuli chana'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },
  {
    keywords: ['rajma', 'rajmah', 'kidney beans', 'chitra rajma', 'red rajma', 'kashmiri rajma'],
    canonical: ['rajma', 'kidney beans'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },
  {
    keywords: ['masoor dal', 'masur', 'red lentil', 'kali masoor', 'malka masoor'],
    canonical: ['masoor dal', 'masoor'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },
  {
    keywords: ['matar', 'safed matar', 'green peas', 'dry peas', 'vatana', 'safed vatana'],
    canonical: ['matar', 'vatana', 'peas'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },

  // 5. Sugar, Jaggery & Sweeteners
  {
    keywords: [
      'cheeni', 'chini', 'shakkar', 'sakhar', 'sugar', 'white sugar', 'refined sugar',
      'madhur', 'bura', 'boora', 'icing sugar', 'khand'
    ],
    canonical: ['sugar', 'cheeni', 'shakkar'],
    categories: ['Sugar', 'Grocery & Kitchen', 'Home & Kitchen']
  },
  {
    keywords: ['gur', 'gud', 'gul', 'jaggery', 'jaggery powder', 'organic jaggery', 'bellam'],
    canonical: ['jaggery', 'gur', 'gud'],
    categories: ['Sugar', 'Grocery & Kitchen']
  },

  // 6. Salt & Spices (Masale)
  {
    keywords: [
      'namak', 'mith', 'meeth', 'salt', 'iodized salt', 'tata salt', 'rock salt',
      'sendha namak', 'kala namak', 'black salt', 'lite salt'
    ],
    canonical: ['salt', 'namak'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['haldi', 'turmeric', 'haldi powder', 'turmeric powder', 'everest haldi', 'mdh haldi', 'catch haldi'],
    canonical: ['haldi', 'turmeric'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['mirch', 'mirchi', 'lal mirch', 'red chilli', 'chilli powder', 'degi mirch', 'kashmiri mirch', 'tikhalal'],
    canonical: ['mirch', 'chilli', 'red chilli'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['dhaniya', 'dhania', 'coriander', 'coriander powder', 'dhana jeera'],
    canonical: ['dhaniya', 'coriander'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['jeera', 'jira', 'cumin', 'cumin seeds', 'zeera'],
    canonical: ['jeera', 'cumin'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['rai', 'mustard seeds', 'sarson dana', 'mohari'],
    canonical: ['rai', 'mustard seeds'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['garam masala', 'masala', 'sabji masala', 'kitchen king', 'meat masala', 'chicken masala', 'pav bhaji masala', 'chhole masala', 'sambar masala', 'biryani masala', 'chaat masala', 'hing', 'asafoetida'],
    canonical: ['masala', 'garam masala'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: ['elaichi', 'cardamom', 'green cardamom', 'badi elaichi', 'black cardamom', 'laung', 'clove', 'dalchini', 'cinnamon', 'kali mirch', 'black pepper', 'tej patta', 'bay leaf', 'saunf', 'fennel', 'methi', 'fenugreek', 'ajwain', 'carom seeds'],
    canonical: ['spices', 'whole spices', 'elaichi', 'laung'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },

  // 7. Dry Fruits & Nuts
  {
    keywords: ['kaju', 'kaju tukda', 'cashew', 'cashews', 'cashewnut'],
    canonical: ['kaju', 'cashew', 'cashews'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: ['badam', 'almond', 'almonds', 'mamra badam', 'california badam'],
    canonical: ['badam', 'almond', 'almonds'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: ['kismis', 'kishmish', 'kismish', 'raisins', 'dry grapes', 'munakka', 'draksh'],
    canonical: ['kismis', 'kishmish', 'raisins'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: ['akhrot', 'walnut', 'walnuts', 'pista', 'pistachio', 'pistachios', 'anjir', 'anjeer', 'fig', 'makhana', 'foxnut', 'dry fruits', 'mixed dry fruits', 'dryfruit'],
    canonical: ['dry fruits', 'akhrot', 'pista', 'makhana'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },

  // 8. Beverages & Tea / Coffee
  {
    keywords: [
      'chai', 'chay', 'chaipatti', 'chai patti', 'tea', 'tea powder', 'tata tea', 'tata tea gold',
      'red label', 'taj mahal', 'wagh bakri', 'green tea', 'lipton'
    ],
    canonical: ['tea', 'chai', 'chai patti'],
    categories: ['Beverages', 'Snacks & Beverages']
  },
  {
    keywords: ['coffee', 'nescafe', 'bru', 'instant coffee', 'filter coffee', 'davidoff'],
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
    keywords: ['maggi', 'magi', 'maggie', 'noodles', 'instant noodles', 'yippee', 'top ramen', 'pasta', 'macaroni', 'vermicelli', 'sewai', 'semiya'],
    canonical: ['maggi', 'noodles', 'pasta'],
    categories: ['Snacks', 'Snacks & Beverages']
  },
  {
    keywords: ['biscuit', 'biscuits', 'cookie', 'cookies', 'parle g', 'parle-g', 'good day', 'monaco', 'krackjack', 'marie gold', 'bourbon', 'hide and seek', 'oreo', 'rusk', 'toast'],
    canonical: ['biscuit', 'biscuits', 'cookies'],
    categories: ['Biscuits', 'Snacks & Beverages']
  },
  {
    keywords: ['namkeen', 'bhujia', 'sev', 'haldiram', 'bikaji', 'balaji', 'chips', 'lays', 'kurkure', 'chivda', 'farsan', 'peanuts', 'moongfali'],
    canonical: ['namkeen', 'bhujia', 'chips', 'snacks'],
    categories: ['Snacks', 'Snacks & Beverages']
  },

  // 10. Cleaning & Laundry
  {
    keywords: [
      'surf', 'detergent', 'washing powder', 'nirma', 'surf excel', 'ariel', 'tide', 'wheel',
      'rin', 'liquid detergent', 'washing liquid', 'fabric conditioner', 'comfort', 'fabric whitener', 'ujala'
    ],
    canonical: ['detergent', 'surf', 'washing powder'],
    categories: ['Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'sabun', 'soap', 'bath soap', 'bathing soap', 'lux', 'dettol', 'lifebuoy', 'dove',
      'pears', 'santoor', 'cinthol', 'godrej no 1', 'medimix'
    ],
    canonical: ['soap', 'sabun', 'bath soap'],
    categories: ['Personal Care', 'Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'bartan', 'dishwash', 'vim', 'vim bar', 'vim gel', 'dishwash bar', 'dishwash liquid',
      'scrub pad', 'scotch brite', 'pril', 'exo'
    ],
    canonical: ['dishwash', 'vim', 'bartan'],
    categories: ['Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'cleaner', 'floor cleaner', 'lizol', 'phenyl', 'harpic', 'toilet cleaner', 'domex',
      'colin', 'glass cleaner', 'odonil', 'room freshener', 'all out', 'good knight', 'mosquito repellent'
    ],
    canonical: ['floor cleaner', 'toilet cleaner', 'lizol', 'harpic'],
    categories: ['Cleaning', 'Home & Kitchen', 'Household & Care']
  },

  // 11. Personal Care & Dental
  {
    keywords: ['colgate', 'toothpaste', 'pepsodent', 'close up', 'sensodyne', 'dabur red', 'meswak', 'toothbrush', 'brush'],
    canonical: ['toothpaste', 'colgate', 'toothbrush'],
    categories: ['Personal Care', 'Household & Care']
  },
  {
    keywords: ['shampoo', 'conditioner', 'head and shoulders', 'clinic plus', 'dove shampoo', 'sunsilk', 'pantene', 'tresemme', 'hair oil', 'parachute', 'coconut hair oil', 'bajaj almond drops', 'navratna'],
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
