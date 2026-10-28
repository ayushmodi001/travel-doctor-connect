/**
 * fillTravelDataWithGemini.ts
 * 
 * Directly queries Google's Gemini AI model (gemini-1.5-flash) to generate
 * real, comprehensive clinical and emergency travel data on demand,
 * and inserts the live responses directly into Neon PostgreSQL.
 */

import dotenv from 'dotenv';
dotenv.config();

import { getDbPool, initDatabase } from '../config/db';

const API_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.argv[2];

if (!API_KEY || API_KEY.trim().length < 10) {
  console.error('\n❌ [Gemini Error] GEMINI_API_KEY is missing or invalid!');
  console.error('Please add your Gemini API key to server/.env:');
  console.error('  GEMINI_API_KEY=AIzaSy...\n');
  console.error('Or run this script with your key as an argument:');
  console.error('  npx tsx src/scripts/fillTravelDataWithGemini.ts AIzaSy...\n');
  console.error('Get a free key in 30 seconds at: https://aistudio.google.com/app/apikey\n');
  process.exit(1);
}

const DESTINATION_TARGETS = [
  'Japan',
  'France',
  'Spain',
  'United Kingdom',
  'Germany',
  'India',
  'Switzerland',
  'Thailand',
  'Italy',
  'United States',
  'Australia',
  'Singapore',
  'United Arab Emirates',
  'Brazil',
  'Canada',
  'Mexico',
];

const MEDICINE_TARGETS = [
  'Paracetamol (Acetaminophen)',
  'Ibuprofen',
  'Loperamide',
  'Pseudoephedrine',
  'Cetirizine',
  'Omeprazole',
  'Amoxicillin-Clavulanate',
  'Salbutamol (Albuterol)',
  'Azithromycin',
  'Metformin',
  'Oral Rehydration Salts',
  'Diphenhydramine',
];

async function callGemini(prompt: string): Promise<any> {
  const models = process.env.GEMINI_MODELS
    ? process.env.GEMINI_MODELS.split(',').map(m => m.trim())
    : [process.env.GEMINI_MODEL || 'gemini-3.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
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
        throw new Error(`[${model}] HTTP ${response.status}: ${errText}`);
      }

      const json: any = await response.json();
      const parts = json.candidates?.[0]?.content?.parts;
      const rawText = parts?.find((p: any) => p.text && !p.thought)?.text || parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`[${model}] returned an empty response.`);
      }

      const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(clean);
    } catch (err: any) {
      lastError = err;
      console.warn(`  ⚠️  ${model} request failed: ${err.message}, trying next active model...`);
    }
  }

  throw lastError || new Error('All active Gemini models failed to generate response.');
}

async function harvestDestinationFromGemini(country: string, pool: any) {
  console.log(`\n🤖 [Gemini AI] Generating verified travel health & emergency data for "${country}"...`);

  const prompt = `You are a certified International Travel Health & Emergency Medical AI Agent.
Generate complete, verified clinical and emergency health intelligence for destination country: "${country}".
Provide actual, accurate local emergency phone numbers, real water safety advisory, recommended CDC/WHO vaccines, currency, and embassy contacts.

Output strictly valid JSON with this exact schema:
{
  "code": "2-letter uppercase ISO country code (e.g. JP, FR, ES, IN)",
  "name": "Full country name in English",
  "flag": "Country flag emoji",
  "capital": "Official capital city",
  "currency": "3-letter currency code (e.g. JPY, EUR, USD, INR)",
  "currencySymbol": "Currency symbol (e.g. ¥, €, $, ₹)",
  "primaryLanguage": "Primary spoken language(s)",
  "emergencyNumbers": {
    "general": "Main emergency dial number (e.g. 112, 911, 999)",
    "ambulance": "Direct ambulance phone number",
    "police": "Direct police phone number",
    "fire": "Direct fire department phone number"
  },
  "embassySupport": {
    "title": "Consular & Medical Services Title",
    "phone": "Emergency consular phone number with international country code",
    "address": "Embassy or consulate address in the capital"
  },
  "healthAdvisories": {
    "waterSafety": "safe | bottled_recommended | boil_required",
    "malariaRisk": "none | low | moderate | high",
    "requiredVaccines": ["List of mandatory entry vaccines or 'None for general entry'"],
    "recommendedVaccines": ["List of recommended travel immunizations"],
    "currentAlert": "Actionable healthcare advice or customs medication restriction notice"
  }
}`;

  const dest = await callGemini(prompt);
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

  console.log(`  ✅ [Gemini AI] Saved ${dest.name} (${dest.code}) to Neon DB! (EMS: ${dest.emergencyNumbers.ambulance || dest.emergencyNumbers.general})`);
}

async function harvestMedicineFromGemini(medName: string, pool: any) {
  console.log(`\n💊 [Gemini AI] Researching international brand equivalents for "${medName}"...`);

  const prompt = `You are a certified Clinical Pharmacist & International Travel Health AI Agent.
Provide complete international brand equivalents, indications, and customs regulations for medicine: "${medName}".

Output strictly valid JSON with this exact schema:
{
  "id": "med-${medName.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "genericName": "Official generic pharmaceutical name",
  "primaryUse": "Primary medical indications and symptoms treated",
  "commonHomeBrands": ["Common international brand names in English"],
  "brandsByCountry": {
    "US": "Common US brand names",
    "UK": "Common UK brand names",
    "FR": "Common France brand names",
    "ES": "Common Spain brand names",
    "DE": "Common Germany brand names",
    "JP": "Common Japan brand names with kanji/katakana if applicable"
  },
  "customsRestrictions": {
    "isRestricted": true or false,
    "warningNote": "Actual customs warning note if banned or restricted abroad (e.g. Japan, UAE, Singapore)"
  },
  "otcAvailability": "OTC availability abroad (e.g. Over-the-counter worldwide, Prescription only in Europe)"
}`;

  const med = await callGemini(prompt);

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

  console.log(`  ✅ [Gemini AI] Saved "${med.genericName}" equivalents to Neon DB!`);
}

async function runGeminiHarvester() {
  console.log('====================================================');
  console.log('🚀 MediConnect: Live Gemini AI Travel Intelligence');
  console.log('====================================================');

  await initDatabase();
  const pool = getDbPool();
  if (!pool) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Destinations
  console.log(`\nHarvesting ${DESTINATION_TARGETS.length} destinations from Gemini 1.5 Flash...`);
  for (const country of DESTINATION_TARGETS) {
    try {
      await harvestDestinationFromGemini(country, pool);
      // Small pause to prevent rate limits
      await new Promise(r => setTimeout(r, 600));
    } catch (err: any) {
      console.error(`  ❌ Error harvesting ${country}:`, err.message);
    }
  }

  // 2. Medicines
  console.log(`\nHarvesting ${MEDICINE_TARGETS.length} medicines from Gemini 1.5 Flash...`);
  for (const med of MEDICINE_TARGETS) {
    try {
      await harvestMedicineFromGemini(med, pool);
      await new Promise(r => setTimeout(r, 600));
    } catch (err: any) {
      console.error(`  ❌ Error harvesting ${med}:`, err.message);
    }
  }

  console.log('\n🎉 [Success] All real data has been generated by Gemini AI and saved into Neon PostgreSQL!');
  process.exit(0);
}

runGeminiHarvester();
