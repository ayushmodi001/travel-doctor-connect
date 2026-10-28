import { getDbPool } from '../config/db';

interface TranslationResult {
  originalText: string;
  targetLanguage: string;
  languageName: string;
  translatedText: string;
  phonetic: string;
  category: string;
  flag: string;
}

const LANGUAGE_FLAGS: Record<string, { name: string; flag: string }> = {
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  de: { name: 'German', flag: '🇩🇪' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
  it: { name: 'Italian', flag: '🇮🇹' },
  zh: { name: 'Mandarin Chinese', flag: '🇨🇳' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
  th: { name: 'Thai', flag: '🇹🇭' },
};

/**
 * Invokes active Google Gemini models (gemini-3.5-flash).
 */
async function callActiveGemini(prompt: string, apiKey: string): Promise<any> {
  const configuredModels = process.env.GEMINI_MODELS
    ? process.env.GEMINI_MODELS.split(',').map(m => m.trim())
    : [process.env.GEMINI_MODEL || 'gemini-3.5-flash'];
  let lastErr: any = null;

  for (const model of configuredModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          if ((response.status === 503 || response.status === 429) && attempt === 1) {
            console.warn(`[AIAgentService] ${model} transient ${response.status}, retrying in 1.5s...`);
            await new Promise(res => setTimeout(res, 1500));
            continue;
          }
          throw new Error(`[${model}] HTTP ${response.status}: ${errText}`);
        }

        const json: any = await response.json();
        const parts = json.candidates?.[0]?.content?.parts;
        const rawText = parts?.find((p: any) => p.text && !p.thought)?.text || parts?.[0]?.text;
        if (!rawText) throw new Error(`[${model}] returned empty candidate text.`);
        const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
      } catch (err: any) {
        lastErr = err;
        console.warn(`[AIAgentService] ${model} (attempt ${attempt}) failed: ${err.message}`);
        if (attempt === 1 && !err.message.includes('HTTP 400') && !err.message.includes('API key')) {
          await new Promise(res => setTimeout(res, 1200));
        }
      }
    }
  }

  throw lastErr || new Error('All active Gemini models failed.');
}

export class AIAgentService {
  /**
   * Translates medical text using active Gemini AI (gemini-2.5-flash / gemini-2.0-flash),
   * providing exact phonetics, and saves directly to Neon PostgreSQL.
   */
  static async translateAndSavePhrase(
    text: string,
    targetLangCode: string = 'es',
    category: string = 'emergency',
    apiKey?: string
  ): Promise<TranslationResult> {
    const langMeta = LANGUAGE_FLAGS[targetLangCode.toLowerCase()] || {
      name: targetLangCode.toUpperCase(),
      flag: '🌐',
    };

    const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!resolvedApiKey || resolvedApiKey.trim().length < 10) {
      throw new Error('Gemini API key is required to generate medical translations. Please configure GEMINI_API_KEY in server/.env.');
    }

    const prompt = `You are a certified Medical Interpreter & Clinical Translation AI agent.
Translate the following medical phrase from English to ${langMeta.name} (${targetLangCode}).
Phrase: "${text}"

Output strictly valid JSON with this exact schema:
{
  "translation": "accurate clinical translation in target script",
  "phonetic": "easy English phonetic pronunciation guide for travelers",
  "category": "emergency | symptoms | pharmacy | allergies | doctor"
}`;

    const parsed = await callActiveGemini(prompt, resolvedApiKey.trim());

    const result: TranslationResult = {
      originalText: text,
      targetLanguage: targetLangCode,
      languageName: langMeta.name,
      translatedText: parsed.translation,
      phonetic: parsed.phonetic || text.toUpperCase(),
      category: parsed.category || category,
      flag: langMeta.flag,
    };

    // Save directly into Neon DB medical_phrases table
    const pool = getDbPool();
    if (pool) {
      const id = `ai-phrase-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await pool.query(
        `INSERT INTO medical_phrases (id, category, english, translation, phonetic, language, language_code, flag)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          result.category,
          text,
          result.translatedText,
          result.phonetic,
          result.languageName,
          result.targetLanguage,
          result.flag,
        ]
      );
      console.log(`[AIAgentService] Saved live Gemini translated phrase into Neon DB: "${text}" -> "${result.translatedText}"`);
    }

    return result;
  }

  /**
   * AI Agent Harvester: Gathers verified destination health intelligence,
   * local emergency EMS numbers, and health advisories using active Gemini AI models,
   * and saves to Neon DB travel_destinations.
   */
  static async harvestDestinationIntelligence(countryQuery: string, apiKey?: string): Promise<any> {
    const q = countryQuery.trim();
    const pool = getDbPool();
    const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!resolvedApiKey || resolvedApiKey.trim().length < 10) {
      throw new Error('Gemini API key is required to harvest real-time destination intelligence. Please configure GEMINI_API_KEY in server/.env.');
    }

    const prompt = `You are a certified Global Healthcare & Emergency Medical Intelligence AI Agent.
Generate complete, verified clinical and emergency health intelligence for destination: "${q}".
Provide actual, accurate local emergency phone numbers, real water safety advisory, recommended CDC/WHO vaccines, currency, and embassy contacts.

Output strictly valid JSON with this exact schema:
{
  "code": "2-letter uppercase ISO country code (e.g. IT, NO, NZ, EG, CH)",
  "name": "Full country name in English",
  "flag": "Flag emoji (e.g. 🇳🇴)",
  "capital": "Capital city",
  "currency": "3-letter currency code (e.g. EUR, NOK, USD)",
  "currencySymbol": "Currency symbol (e.g. €, kr, $)",
  "primaryLanguage": "Primary language(s)",
  "emergencyNumbers": {
    "general": "Local emergency general number (e.g. 112 or 911)",
    "ambulance": "Direct ambulance dial number",
    "police": "Direct police dial number",
    "fire": "Direct fire department dial number"
  },
  "embassySupport": {
    "title": "Consular & Medical Services Title",
    "phone": "Emergency consular phone with international code",
    "address": "Consulate or embassy address in capital city"
  },
  "healthAdvisories": {
    "waterSafety": "safe | bottled_recommended | boil_required",
    "malariaRisk": "none | low | moderate | high",
    "requiredVaccines": ["Required entry vaccines or 'None for general entry'"],
    "recommendedVaccines": ["Recommended vaccines like Hepatitis A, Typhoid, Tetanus"],
    "currentAlert": "Key traveler medical tip or restricted medication advisory"
  }
}`;

    const dest = await callActiveGemini(prompt, resolvedApiKey.trim());

    if (!dest || !dest.name || !dest.code) {
      throw new Error(`Gemini failed to return valid destination intelligence for "${q}".`);
    }

    if (pool) {
      const id = `dest_${dest.code.toUpperCase()}`;
      await pool.query(
        `INSERT INTO travel_destinations (id, code, name, flag, capital, currency, currency_symbol, primary_language, local_emergency, embassy_support, health_advisories)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           flag = EXCLUDED.flag,
           capital = EXCLUDED.capital,
           currency = EXCLUDED.currency,
           currency_symbol = EXCLUDED.currency_symbol,
           primary_language = EXCLUDED.primary_language,
           local_emergency = EXCLUDED.local_emergency,
           embassy_support = EXCLUDED.embassy_support,
           health_advisories = EXCLUDED.health_advisories`,
        [
          id,
          dest.code.toUpperCase(),
          dest.name,
          dest.flag,
          dest.capital,
          dest.currency,
          dest.currencySymbol,
          dest.primaryLanguage,
          JSON.stringify(dest.emergencyNumbers),
          JSON.stringify(dest.embassySupport),
          JSON.stringify(dest.healthAdvisories),
        ]
      );
      console.log(`[AIAgentService] Saved live Gemini destination intelligence for ${dest.name} (${dest.code}) into Neon DB`);
    }

    return dest;
  }

  /**
   * AI Agent: Researches authentic international brand equivalents and customs restrictions
   * for any medication using active Gemini AI models (gemini-2.5-flash / gemini-2.0-flash), and saves to Neon DB.
   */
  static async generateMedicineEquivalent(medicineName: string, apiKey?: string): Promise<any> {
    const medName = medicineName.trim();
    const pool = getDbPool();
    const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!resolvedApiKey || resolvedApiKey.trim().length < 10) {
      throw new Error('Gemini API key is required to research real medication brand equivalents. Please configure GEMINI_API_KEY in server/.env.');
    }

    const prompt = `You are a certified Clinical Pharmacist & International Travel Health AI Agent.
Provide complete, verified international brand equivalents, indications, and customs regulations for medicine: "${medName}".

Output strictly valid JSON with this exact schema:
{
  "id": "med-${medName.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "genericName": "Official generic pharmaceutical name",
  "primaryUse": "Primary medical indications and symptoms treated",
  "commonHomeBrands": ["Common international brand names"],
  "brandsByCountry": {
    "US": "US brand names",
    "UK": "UK brand names",
    "FR": "France brand names",
    "ES": "Spain brand names",
    "DE": "Germany brand names",
    "JP": "Japan brand names"
  },
  "customsRestrictions": {
    "isRestricted": true or false,
    "warningNote": "Actual customs warning note if banned or restricted abroad (e.g. Japan, UAE, Singapore)"
  },
  "otcAvailability": "OTC availability abroad (e.g. OTC in Europe, Prescription in Japan)"
}`;

    const med = await callActiveGemini(prompt, resolvedApiKey.trim());

    if (!med || !med.genericName) {
      throw new Error(`Gemini failed to return valid medication equivalents for "${medName}".`);
    }

    if (pool) {
      await pool.query(
        `INSERT INTO medicine_equivalents (id, generic_name, primary_use, common_home_brands, brands_by_country, customs_restrictions)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           generic_name = EXCLUDED.generic_name,
           primary_use = EXCLUDED.primary_use,
           common_home_brands = EXCLUDED.common_home_brands,
           brands_by_country = EXCLUDED.brands_by_country,
           customs_restrictions = EXCLUDED.customs_restrictions`,
        [
          med.id,
          med.genericName,
          med.primaryUse,
          JSON.stringify(med.commonHomeBrands),
          JSON.stringify(med.brandsByCountry),
          JSON.stringify(med.customsRestrictions),
        ]
      );
      console.log(`[AIAgentService] Saved live Gemini medicine equivalents for "${med.genericName}" into Neon DB`);
    }

    return med;
  }

  /**
   * Batch harvests essential medical phrases across major traveler languages
   * directly using Gemini AI and stores them in Neon DB.
   */
  static async harvestMedicalPhrasesBatch(apiKey?: string): Promise<{ count: number; phrases: any[] }> {
    const defaultPhrases = [
      { text: 'I need an ambulance immediately, please help!', lang: 'es', cat: 'emergency' },
      { text: 'I am experiencing severe chest pain and shortness of breath', lang: 'es', cat: 'symptoms' },
      { text: 'I am severely allergic to penicillin and aspirin', lang: 'es', cat: 'allergies' },
      { text: 'Where is the nearest 24-hour pharmacy?', lang: 'es', cat: 'pharmacy' },
      { text: 'I need an emergency doctor who speaks English', lang: 'ja', cat: 'emergency' },
      { text: 'I am allergic to nuts and seafood', lang: 'ja', cat: 'allergies' },
      { text: 'I have diabetes and need insulin supplies', lang: 'fr', cat: 'pharmacy' },
      { text: 'I feel dizzy, nauseous, and have a high fever', lang: 'de', cat: 'symptoms' },
    ];

    const results: any[] = [];
    for (const item of defaultPhrases) {
      try {
        const res = await this.translateAndSavePhrase(item.text, item.lang, item.cat, apiKey);
        results.push(res);
      } catch (err: any) {
        console.warn(`[AIAgentService] Phrase harvest error: ${err.message}`);
      }
    }

    return { count: results.length, phrases: results };
  }

  /**
   * Batch harvests common traveler medicine brand equivalents
   * using Gemini AI into Neon DB.
   */
  static async harvestMedicineEquivalentsBatch(apiKey?: string): Promise<number> {
    const commonMeds = [
      'Paracetamol',
      'Ibuprofen',
      'Loperamide',
      'Cetirizine',
      'Omeprazole',
      'Amoxicillin',
      'Salbutamol',
    ];

    let count = 0;
    for (const med of commonMeds) {
      try {
        await this.generateMedicineEquivalent(med, apiKey);
        count++;
      } catch (err: any) {
        console.warn(`[AIAgentService] Medicine harvest error for ${med}: ${err.message}`);
      }
    }

    return count;
  }
}

