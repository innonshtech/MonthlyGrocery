/**
 * Comprehensive Hindi, Hinglish, Marathi (मराठी), and English Grocery Synonyms Dictionary.
 * Maps common vernacular and regional Indian search terms (e.g. 'aata', 'gehu', 'pith', 'tel', 'shengdana tel', 'tup', 'chawal', 'tandul', 'sakhar', 'gul', 'meeth', 'tikhat')
 * to master product categories, brands, and canonical grocery titles.
 */

export interface SynonymGroup {
  keywords: string[];
  canonical: string[];
  categories: string[];
}

export const GROCERY_SYNONYM_GROUPS: SynonymGroup[] = [
  // 1. Atta, Flours & Grains (पीठ, कणिक, गहू)
  {
    keywords: [
      'atta', 'aata', 'aatha', 'gehu', 'gehun', 'flour', 'wheat', 'wheat flour', 'chakki',
      'chakki atta', 'aashirvaad', 'ashirvad', 'ashirwaad', 'aashirwad', 'multigrain',
      'shudh chakki', 'aata 10kg', 'atta 10kg', 'atta 5kg', 'maida', 'besan', 'chana flour',
      'gram flour', 'suji', 'sooji', 'rava', 'semolina', 'ragi', 'jowar', 'bajra',
      // Marathi terms
      'pith', 'peeth', 'gahu', 'gavhache pith', 'kanik', 'jwari', 'jwari che pith',
      'bajari', 'bajari che pith', 'nachni', 'nachni che pith', 'tandul pith', 'tandlache pith',
      'besan pith', 'chirote rava', 'bombay rava', 'modak pith',
      // Devanagari (Hindi & Marathi)
      'आटा', 'गेहूं', 'गहू', 'पीठ', 'गव्हाचे पीठ', 'कणीक', 'ज्वारी', 'बाजरी', 'नाचणी', 'मैदा', 'बेसन', 'सूजी', 'रवा'
    ],
    canonical: ['atta', 'flour', 'wheat', 'chakki', 'besan', 'suji', 'maida', 'pith'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },

  // 2. Rice & Basmati (तांदूळ, पोहे)
  {
    keywords: [
      'chawal', 'chaval', 'chaawal', 'rice', 'basmati', 'daawat', 'dawat', 'india gate', 'indrayani',
      'kolam', 'sona masoori', 'sonamasoori', 'tukda', 'wada kolam', 'brown rice', 'poha', 'powa', 'aval',
      // Marathi terms
      'tandul', 'taandul', 'bhaat', 'kande pohe', 'jad pohe', 'patal pohe', 'dagadi pohe',
      'mora tandul', 'ambemohar', 'surti kolam', 'hmt rice',
      // Devanagari
      'चावल', 'बासमती', 'पोहा', 'तांदूळ', 'इंद्रायणी', 'आंबेमोहर', 'कोलम', 'पोहे', 'जाड पोहे', 'पातळ पोहे'
    ],
    canonical: ['rice', 'basmati', 'chawal', 'poha', 'tandul'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },

  // 3. Edible Oils & Ghee (तेल, तूप, शेंगदाणा तेल)
  {
    keywords: [
      'tel', 'tail', 'oil', 'cooking oil', 'edible oil', 'refined oil', 'refine tel', 'refine',
      'mustard oil', 'sarson tel', 'sarson', 'sarson oil', 'sunflower oil', 'surajmukhi',
      'soya oil', 'soyabean oil', 'fortune', 'fartune', 'fortne', 'gemini', 'saffola', 'dhara',
      'groundnut oil', 'moongfali tel', 'singdana tel', 'rice bran', 'ghee', 'ghee 1l', 'amul ghee',
      'gowardhan ghee', 'shuddh ghee', 'pure ghee',
      // Marathi terms
      'shengdana tel', 'shingdana tel', 'shengdanyache tel', 'shingdanyache tel', 'karadi tel',
      'kardi tel', 'til tel', 'tilache tel', 'tup', 'sajuk tup', 'amul tup', 'shuddh tup',
      'gai che tup', 'gavatil tup', 'mohari tel', 'rayache tel',
      // Devanagari
      'तेल', 'सरसों तेल', 'घी', 'फॉर्च्यून', 'तूप', 'साजूक तूप', 'शेंगदाणा तेल', 'सूर्यफूल तेल', 'तीळ तेल'
    ],
    canonical: ['oil', 'ghee', 'mustard oil', 'sunflower oil', 'soyabean oil', 'fortune', 'tup', 'shengdana tel'],
    categories: ['Oils & Ghee', 'Grocery & Kitchen']
  },

  // 4. Dals & Pulses / कडधान्ये (डाळ, तूर डाळ, मटकी, चवळी)
  {
    keywords: [
      'dal', 'daal', 'dall', 'pulses', 'toor dal', 'tur dal', 'arhar dal', 'arhar', 'tuvar dal',
      'chana dal', 'chana', 'kabuli chana', 'kala chana', 'moong dal', 'mung dal', 'moong',
      'green moong', 'yellow moong', 'urad dal', 'urad', 'masoor dal', 'masur', 'red lentil',
      'rajma', 'chole', 'lobia', 'vatana', 'matar', 'safed matar',
      // Marathi terms
      'turichi dal', 'harbhara dal', 'harbhara', 'chanachi dal', 'mug dal', 'udid dal',
      'masur dal', 'matki', 'chavali', 'chawli', 'val', 'kadve val', 'kulith', 'safed vatana',
      'hirva vatana', 'kadadhanya', 'usal',
      // Devanagari
      'दाल', 'तूर दाल', 'चना', 'मूंग', 'उड़द', 'राजमा', 'छोले', 'तूर डाळ', 'हरभरा डाळ', 'मूग डाळ', 'उडीद डाळ', 'मसूर डाळ', 'मटकी', 'चवळी', 'वाल', 'कुळीथ', 'वाटाणा'
    ],
    canonical: ['dal', 'toor dal', 'chana dal', 'moong dal', 'urad dal', 'rajma', 'chole', 'matki', 'vatana'],
    categories: ['Dals & Pulses', 'Grocery & Kitchen']
  },

  // 5. Sugar, Jaggery & Sweeteners (साखर, गूळ)
  {
    keywords: [
      'cheeni', 'chini', 'shakkar', 'sakar', 'sugar', 'white sugar', 'madhur', 'brown sugar',
      'gud', 'gur', 'jaggery', 'bura', 'boora', 'khand',
      // Marathi terms
      'sakhar', 'saakhar', 'gul', 'chikki gul', 'sada gul', 'sendriya gul', 'kakvi',
      // Devanagari
      'चीनी', 'शक्कर', 'गुड़', 'साखर', 'गूळ', 'चिक्की गूळ'
    ],
    canonical: ['sugar', 'cheeni', 'jaggery', 'gud', 'sakhar', 'gul'],
    categories: ['Atta & Rice', 'Grocery & Kitchen']
  },

  // 6. Salt & Spices (मीठ, तिखट, मसाले, कांदा लसूण मसाला)
  {
    keywords: [
      'namak', 'salt', 'tata salt', 'tata namak', 'iodized salt', 'sendha', 'rock salt',
      'sendha namak', 'kala namak', 'black salt', 'lite salt',
      // Marathi terms
      'meeth', 'mith', 'saindhav meeth', 'saindhav', 'khade meeth', 'pooja meeth',
      // Devanagari
      'नमक', 'सेंधा नमक', 'मीठ', 'सैंधव मीठ'
    ],
    canonical: ['salt', 'namak', 'meeth'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'haldi', 'turmeric', 'haldi powder', 'turmeric powder', 'everest haldi', 'mdh haldi', 'catch haldi',
      // Marathi
      'halad', 'halad pud', 'haldipud', 'हल्दी', 'हळद', 'हळद पूड'
    ],
    canonical: ['haldi', 'turmeric', 'halad'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'mirch', 'mirchi', 'lal mirch', 'red chilli', 'chilli powder', 'degi mirch', 'kashmiri mirch', 'tikhalal',
      // Marathi
      'tikhat', 'lal tikhat', 'mirchi pud', 'bedgi mirchi', 'sankeshwari', 'lavangi mirchi',
      // Devanagari
      'मिर्च', 'लाल मिर्च', 'तिखट', 'लाल तिखट', 'मिरची पूड'
    ],
    canonical: ['mirch', 'chilli', 'red chilli', 'tikhat'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'dhaniya', 'dhania', 'coriander', 'coriander powder', 'dhana jeera',
      // Marathi
      'dhane', 'dhana pud', 'dhanepud', 'धनिया', 'धने', 'धनेपूड'
    ],
    canonical: ['dhaniya', 'coriander', 'dhane'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'jeera', 'jira', 'cumin', 'cumin seeds', 'zeera',
      // Marathi
      'jeere', 'jire', 'jeera powder', 'jirepud', 'जीरा', 'जिरे'
    ],
    canonical: ['jeera', 'cumin', 'jeere'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'rai', 'mustard seeds', 'sarson dana', 'mohari', 'mohori', 'राई', 'मोहरी'
    ],
    canonical: ['rai', 'mustard seeds', 'mohari'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'garam masala', 'masala', 'sabji masala', 'kitchen king', 'meat masala', 'chicken masala',
      'pav bhaji masala', 'chhole masala', 'sambar masala', 'biryani masala', 'chaat masala', 'hing', 'asafoetida',
      // Marathi special masalas
      'kanda lasun masala', 'kanda lasun', 'kala masala', 'goda masala', 'malvani masala', 'kolhapuri masala',
      'sambar pud', 'rasam pud', 'hirva vatan',
      // Devanagari
      'गरम मसाला', 'मसाला', 'हींग', 'कांदा लसूण मसाला', 'काळा मसाला', 'गोडा मसाला', 'मालवणी मसाला'
    ],
    canonical: ['masala', 'garam masala', 'goda masala', 'kanda lasun masala'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'elaichi', 'cardamom', 'green cardamom', 'badi elaichi', 'black cardamom', 'laung', 'clove',
      'dalchini', 'cinnamon', 'kali mirch', 'black pepper', 'tej patta', 'bay leaf', 'saunf', 'fennel',
      'methi', 'fenugreek', 'ajwain', 'carom seeds',
      // Marathi
      'badishep', 'badi shep', 'laving', 'kali miri', 'tamalpatra', 'khaskhas', 'khas khas', 'ovva', 'ova',
      // Devanagari
      'इलायची', 'लौंग', 'दालचीनी', 'काली मिर्च', 'बडीशेप', 'लवंग', 'काळी मिरी', 'तमालपत्र', 'खसखस', 'ओवा'
    ],
    canonical: ['spices', 'whole spices', 'elaichi', 'laung', 'badishep'],
    categories: ['Spices & Masala', 'Grocery & Kitchen']
  },

  // 7. Dry Fruits & Nuts (सुका मेवा, खोबरं, मनुका)
  {
    keywords: ['kaju', 'kaju tukda', 'cashew', 'cashews', 'cashewnut', 'काजू'],
    canonical: ['kaju', 'cashew', 'cashews'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: ['badam', 'almond', 'almonds', 'mamra badam', 'california badam', 'बादाम', 'बदाम'],
    canonical: ['badam', 'almond', 'almonds'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'kismis', 'kishmish', 'kismish', 'raisins', 'dry grapes', 'munakka', 'draksh',
      // Marathi
      'manuka', 'bedana', 'bedane', 'किशमिश', 'मनुका', 'बेदाणा'
    ],
    canonical: ['kismis', 'kishmish', 'raisins', 'manuka'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },
  {
    keywords: [
      'akhrot', 'walnut', 'walnuts', 'pista', 'pistachio', 'pistachios', 'anjir', 'anjeer', 'fig',
      'makhana', 'foxnut', 'dry fruits', 'mixed dry fruits', 'dryfruit',
      // Marathi
      'suka meva', 'khobare', 'khobra', 'sukha khobra', 'sukhe khobare', 'naral', 'kharik', 'kharik pud', 'khajur',
      // Devanagari
      'अखरोट', 'पिस्ता', 'मखाना', 'खोबरं', 'सुके खोबरे', 'नारळ', 'खारिक', 'खजूर'
    ],
    canonical: ['dry fruits', 'akhrot', 'pista', 'makhana', 'khobra', 'kharik'],
    categories: ['Dry Fruits', 'Grocery & Kitchen']
  },

  // 8. Beverages, Tea & Dairy (चहा, कॉफी, दूध, ताक)
  {
    keywords: [
      'chai', 'chay', 'chaipatti', 'chai patti', 'tea', 'tea powder', 'tata tea', 'tata tea gold',
      'red label', 'taj mahal', 'wagh bakri', 'green tea', 'lipton',
      // Marathi
      'chaha', 'chaha patti', 'kora chaha', 'चाय', 'चाय पत्ती', 'चहा', 'चहा पावडर'
    ],
    canonical: ['tea', 'chai', 'chai patti', 'chaha'],
    categories: ['Beverages', 'Snacks & Beverages']
  },
  {
    keywords: ['coffee', 'nescafe', 'bru', 'instant coffee', 'filter coffee', 'davidoff', 'kofi', 'कॉफी'],
    canonical: ['coffee', 'nescafe', 'bru'],
    categories: ['Beverages', 'Snacks & Beverages']
  },
  {
    keywords: [
      'milk', 'doodh', 'dudh', 'curd', 'dahi', 'paneer', 'butter', 'cheese', 'buttermilk', 'lassi',
      // Marathi
      'taak', 'loni', 'amul doodh', 'gai che doodh', 'दूध', 'दही', 'ताक', 'लोणी'
    ],
    canonical: ['milk', 'doodh', 'dudh', 'dahi', 'taak'],
    categories: ['Beverages', 'Dairy', 'Personal Care']
  },
  {
    keywords: ['bournvita', 'bonvita', 'horlicks', 'boost', 'complan', 'milo', 'glucon d', 'glucond', 'pediasure'],
    canonical: ['bournvita', 'horlicks', 'health drink'],
    categories: ['Beverages', 'Baby Care', 'Personal Care']
  },

  // 9. Snacks & Noodles & Biscuits
  {
    keywords: ['maggi', 'magi', 'maggie', 'noodles', 'instant noodles', 'yippee', 'top ramen', 'pasta', 'macaroni', 'vermicelli', 'sewai', 'semiya', 'shevaya', 'शेवया', 'मैगी', 'नूडल्स'],
    canonical: ['maggi', 'noodles', 'pasta'],
    categories: ['Snacks', 'Snacks & Beverages']
  },
  {
    keywords: ['biscuit', 'biscuits', 'cookie', 'cookies', 'parle g', 'parle-g', 'good day', 'monaco', 'krackjack', 'marie gold', 'bourbon', 'hide and seek', 'oreo', 'rusk', 'toast', 'khari', 'खारी', 'टोस्ट', 'बिस्कुट'],
    canonical: ['biscuit', 'biscuits', 'cookies', 'khari'],
    categories: ['Biscuits', 'Snacks & Beverages']
  },
  {
    keywords: ['namkeen', 'bhujia', 'sev', 'haldiram', 'bikaji', 'balaji', 'chips', 'lays', 'kurkure', 'chivda', 'farsan', 'peanuts', 'moongfali', 'shev', 'lasun shev', 'bhadang', 'चिवडा', 'फरसाण', 'नमकीन', 'भुजिया'],
    canonical: ['namkeen', 'bhujia', 'chips', 'snacks', 'chivda'],
    categories: ['Snacks', 'Snacks & Beverages']
  },

  // 10. Cleaning & Laundry (साबण, सर्फ, भांडी घासण्याचे लिक्विड)
  {
    keywords: [
      'surf', 'detergent', 'washing powder', 'nirma', 'surf excel', 'ariel', 'tide', 'wheel',
      'rin', 'liquid detergent', 'washing liquid', 'fabric conditioner', 'comfort', 'fabric whitener', 'ujala',
      'kapde dhunnyachi powder', 'kapdyancha sabun',
      'सर्फ', 'डिटर्जेंट', 'कपड्यांचा साबण'
    ],
    canonical: ['detergent', 'surf', 'washing powder'],
    categories: ['Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'sabun', 'soap', 'bath soap', 'bathing soap', 'lux', 'dettol', 'lifebuoy', 'dove',
      'pears', 'santoor', 'cinthol', 'godrej no 1', 'medimix',
      'angacha sabun', 'nahanacha sabun',
      'साबण', 'अंघोळीचा साबण'
    ],
    canonical: ['soap', 'sabun', 'bath soap'],
    categories: ['Personal Care', 'Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'bartan', 'dishwash', 'vim', 'vim bar', 'vim gel', 'dishwash bar', 'dishwash liquid',
      'scrub pad', 'scotch brite', 'pril', 'exo',
      'bhandyacha sabun', 'bhandyache liquid',
      'बर्तन साबुन', 'भांडी घासण्याचा साबण'
    ],
    canonical: ['dishwash', 'vim', 'bartan', 'bhandyacha sabun'],
    categories: ['Cleaning', 'Household & Care']
  },
  {
    keywords: [
      'cleaner', 'floor cleaner', 'lizol', 'phenyl', 'harpic', 'toilet cleaner', 'domex',
      'colin', 'glass cleaner', 'odonil', 'room freshener', 'all out', 'good knight', 'mosquito repellent',
      'ladi pusnyache liquid', 'zural marayche',
      'फिनाइल', 'हारपिक', 'लायजोल'
    ],
    canonical: ['floor cleaner', 'toilet cleaner', 'lizol', 'harpic'],
    categories: ['Cleaning', 'Home & Kitchen', 'Household & Care']
  },

  // 11. Personal Care & Dental
  {
    keywords: ['colgate', 'toothpaste', 'pepsodent', 'close up', 'sensodyne', 'dabur red', 'meswak', 'toothbrush', 'brush', 'manjan', 'दात घासण्याची पेस्ट', 'पेस्ट', 'टूथपेस्ट'],
    canonical: ['toothpaste', 'colgate', 'toothbrush'],
    categories: ['Personal Care', 'Household & Care']
  },
  {
    keywords: ['shampoo', 'conditioner', 'head and shoulders', 'clinic plus', 'dove shampoo', 'sunsilk', 'pantene', 'tresemme', 'hair oil', 'parachute', 'coconut hair oil', 'bajaj almond drops', 'navratna', 'kesh tel', 'खोबरेल तेल', 'शैम्पू', 'तेल'],
    canonical: ['shampoo', 'hair oil', 'khobrel tel'],
    categories: ['Personal Care', 'Household & Care']
  },
];

/** Clean and normalize search string */
export function normalizeSearchTerm(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ') // support Devanagari letters (Hindi & Marathi)
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
