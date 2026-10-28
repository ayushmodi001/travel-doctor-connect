import { Request, Response } from 'express';
import { getDbPool } from '../config/db';

// GET /api/travel/hub
export const getTravelHub = async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.query;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    let queryText = 'SELECT * FROM travel_destinations';
    const params: any[] = [];

    if (countryCode && typeof countryCode === 'string') {
      queryText += ' WHERE UPPER(code) = UPPER($1)';
      params.push(countryCode);
    }

    const dbResult = await pool.query(queryText, params);
    const countries = dbResult.rows.map(r => ({
      code: r.code,
      name: r.name,
      flag: r.flag,
      capital: r.capital || '',
      currency: r.currency || 'USD',
      currencySymbol: r.currency_symbol || '$',
      primaryLanguage: r.primary_language || 'English',
      emergencyNumbers: r.local_emergency || {},
      embassySupport: r.embassy_support || {},
      healthAdvisories: r.health_advisories || {},
    }));

    if (countryCode && countries.length > 0) {
      return res.json({ success: true, data: countries[0] });
    }

    if (countries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No travel destinations found in database. Please generate destination intelligence using Gemini AI.',
      });
    }

    return res.json({
      success: true,
      count: countries.length,
      data: countries,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching travel intelligence' });
  }
};

// GET /api/travel/phrases
export const getMedicalPhrases = async (req: Request, res: Response) => {
  try {
    const { category, languageCode, query: searchQuery } = req.query;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    let queryText = 'SELECT * FROM medical_phrases WHERE 1=1';
    const params: any[] = [];

    if (category && typeof category === 'string' && category !== 'all') {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (languageCode && typeof languageCode === 'string' && languageCode !== 'all') {
      params.push(languageCode);
      queryText += ` AND language_code = $${params.length}`;
    }

    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      params.push(`%${searchQuery}%`);
      queryText += ` AND (english ILIKE $${params.length} OR translation ILIKE $${params.length} OR phonetic ILIKE $${params.length})`;
    }

    const dbResult = await pool.query(queryText, params);
    const phrases = dbResult.rows.map(r => ({
      id: r.id,
      category: r.category,
      english: r.english,
      translation: r.translation,
      phonetic: r.phonetic,
      language: r.language,
      languageCode: r.language_code,
      flag: r.flag,
    }));

    if (phrases.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No medical phrases found in database. Use Gemini AI to generate medical translations.',
      });
    }

    return res.json({
      success: true,
      count: phrases.length,
      data: phrases,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching medical phrases' });
  }
};

// POST /api/travel/translate
export const translateCustomText = async (req: Request, res: Response) => {
  try {
    const { text, targetLang, category } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide text to translate' });
    }

    const apiKey = (req.headers['x-ai-api-key'] as string) || req.body.apiKey;
    const { AIAgentService } = await import('../services/aiAgentService');
    const result = await AIAgentService.translateAndSavePhrase(
      text.trim(),
      targetLang || 'es',
      category || 'emergency',
      apiKey
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Translation service failed' });
  }
};

// GET /api/travel/medicines
export const getMedicineEquivalents = async (req: Request, res: Response) => {
  try {
    const { query: searchQuery } = req.query;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    let queryText = 'SELECT * FROM medicine_equivalents';
    const params: any[] = [];

    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      params.push(`%${searchQuery}%`);
      queryText += ` WHERE generic_name ILIKE $1 OR primary_use ILIKE $1`;
    }

    const dbResult = await pool.query(queryText, params);
    const list = dbResult.rows.map(r => {
      let homeBrands = r.common_home_brands;
      if (typeof homeBrands === 'string') {
        try { homeBrands = JSON.parse(homeBrands); } catch { homeBrands = [homeBrands]; }
      }
      let brandsByCountry = r.brands_by_country;
      if (typeof brandsByCountry === 'string') {
        try { brandsByCountry = JSON.parse(brandsByCountry); } catch { brandsByCountry = {}; }
      }
      let customs = r.customs_restrictions;
      if (typeof customs === 'string') {
        try { customs = JSON.parse(customs); } catch { customs = { isRestricted: false }; }
      }

      return {
        id: r.id,
        genericName: r.generic_name,
        primaryUse: r.primary_use,
        commonHomeBrands: Array.isArray(homeBrands) ? homeBrands : [],
        brandsByCountry: (typeof brandsByCountry === 'object' && brandsByCountry !== null) ? brandsByCountry : {},
        customsRestrictions: (typeof customs === 'object' && customs !== null) ? customs : { isRestricted: false },
        otcAvailability: r.otc_availability || 'Available over-the-counter or with standard prescription abroad.',
      };
    });

    if (list.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No medicine equivalents found in database. Use Gemini AI to research international medications.',
      });
    }

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching medicine equivalents' });
  }
};

// GET /api/travel/insurance
export const getTravelInsurance = async (_req: Request, res: Response) => {
  try {
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    const dbResult = await pool.query('SELECT * FROM travel_insurance LIMIT 1');
    if (dbResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No travel insurance policy found in database.' });
    }

    const r = dbResult.rows[0];
    return res.json({
      success: true,
      data: {
        policyNumber: r.policy_number,
        provider: r.provider,
        planName: r.plan_name,
        status: r.status,
        validFrom: r.valid_from,
        validTo: r.valid_to,
        emergencyAssistancePhone: r.emergency_assistance_phone,
        claimsEmail: r.claims_email,
        coverageLimit: r.coverage_limit,
        deductible: r.deductible,
        emergencyEvacuationLimit: r.emergency_evacuation_limit,
        coveredCountries: r.covered_countries || [],
        checklistSteps: r.checklist_steps || [],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error retrieving travel insurance policy' });
  }
};

// POST /api/travel/destinations (Admin Panel)
export const createDestination = async (req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database connection offline.' });

    const {
      code,
      name,
      flag,
      capital,
      currency,
      currencySymbol,
      primaryLanguage,
      emergencyNumbers,
      embassySupport,
      healthAdvisories,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Country code and name are required' });
    }

    const cCode = code.toUpperCase();
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
        `dest_${cCode}`,
        cCode,
        name,
        flag || '🌍',
        capital || '',
        currency || 'USD',
        currencySymbol || '$',
        primaryLanguage || 'English',
        JSON.stringify(emergencyNumbers || { general: '112', ambulance: '112', police: '112', fire: '112' }),
        JSON.stringify(embassySupport || { title: 'Consular Services', phone: '+1 888 407 4747', address: 'Capital City' }),
        JSON.stringify(healthAdvisories || { waterSafety: 'safe', malariaRisk: 'none', requiredVaccines: [], recommendedVaccines: [], currentAlert: '' }),
      ]
    );

    return res.status(201).json({ success: true, message: 'Destination created in Neon DB', data: { code: cCode, name } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error creating destination' });
  }
};

// DELETE /api/travel/destinations/:code (Admin Panel)
export const deleteDestination = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database connection offline.' });

    await pool.query('DELETE FROM travel_destinations WHERE UPPER(code) = UPPER($1)', [code]);
    return res.json({ success: true, message: `Destination ${code} deleted from Neon DB` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error deleting destination' });
  }
};
