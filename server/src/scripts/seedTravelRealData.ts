/**
 * Seed Script: Populates Neon PostgreSQL database with comprehensive,
 * authentic clinical travel intelligence, cross-border medicine equivalents,
 * emergency phrases with phonetics, and realistic travel insurance.
 */

import dotenv from 'dotenv';
dotenv.config();

import { getDbPool, initDatabase } from '../config/db';
import {
  DESTINATION_COUNTRIES,
  MEDICAL_PHRASES,
  MEDICINE_EQUIVALENTS,
  DEFAULT_TRAVEL_INSURANCE,
} from '../data/travelData';

async function seedRealTravelData() {
  console.log('[Seed] Starting database seed for Travel Tab...');
  await initDatabase();

  const pool = getDbPool();
  if (!pool) {
    console.error('[Seed Error] No database pool available. Check DATABASE_URL in .env');
    process.exit(1);
  }

  try {
    // 1. Seed Destinations
    console.log(`[Seed] Inserting ${DESTINATION_COUNTRIES.length} destination countries...`);
    for (const c of DESTINATION_COUNTRIES) {
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
          `dest_${c.code}`,
          c.code,
          c.name,
          c.flag,
          c.capital,
          c.currency,
          c.currencySymbol,
          c.primaryLanguage,
          JSON.stringify(c.emergencyNumbers),
          JSON.stringify(c.embassySupport),
          JSON.stringify(c.healthAdvisories),
        ]
      );
    }
    console.log(`[Seed] Successfully synced ${DESTINATION_COUNTRIES.length} destinations.`);

    // 2. Seed Medical Phrases
    console.log(`[Seed] Inserting ${MEDICAL_PHRASES.length} clinical emergency & travel phrases...`);
    for (const p of MEDICAL_PHRASES) {
      await pool.query(
        `INSERT INTO medical_phrases (id, category, english, translation, phonetic, language, language_code, flag)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           category = EXCLUDED.category,
           english = EXCLUDED.english,
           translation = EXCLUDED.translation,
           phonetic = EXCLUDED.phonetic,
           language = EXCLUDED.language,
           language_code = EXCLUDED.language_code,
           flag = EXCLUDED.flag`,
        [
          p.id,
          p.category,
          p.english,
          p.translation,
          p.phonetic,
          p.language,
          p.languageCode,
          p.flag,
        ]
      );
    }
    console.log(`[Seed] Successfully synced ${MEDICAL_PHRASES.length} medical phrases.`);

    // 3. Seed Medicine Equivalents
    console.log(`[Seed] Inserting ${MEDICINE_EQUIVALENTS.length} cross-border medicine brand equivalents...`);
    for (const m of MEDICINE_EQUIVALENTS) {
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
          m.id,
          m.genericName,
          m.primaryUse,
          JSON.stringify(m.commonHomeBrands),
          JSON.stringify(m.brandsByCountry),
          JSON.stringify(m.customsRestrictions),
        ]
      );
    }
    console.log(`[Seed] Successfully synced ${MEDICINE_EQUIVALENTS.length} medicine equivalents.`);

    // 4. Seed Travel Insurance
    console.log('[Seed] Syncing comprehensive global travel insurance policy...');
    await pool.query(
      `INSERT INTO travel_insurance (id, policy_number, provider, plan_name, status, valid_from, valid_to, emergency_assistance_phone, claims_email, coverage_limit, deductible, emergency_evacuation_limit, covered_countries, checklist_steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET
         policy_number = EXCLUDED.policy_number,
         provider = EXCLUDED.provider,
         plan_name = EXCLUDED.plan_name,
         status = EXCLUDED.status,
         valid_from = EXCLUDED.valid_from,
         valid_to = EXCLUDED.valid_to,
         emergency_assistance_phone = EXCLUDED.emergency_assistance_phone,
         claims_email = EXCLUDED.claims_email,
         coverage_limit = EXCLUDED.coverage_limit,
         deductible = EXCLUDED.deductible,
         emergency_evacuation_limit = EXCLUDED.emergency_evacuation_limit,
         covered_countries = EXCLUDED.covered_countries,
         checklist_steps = EXCLUDED.checklist_steps`,
      [
        DEFAULT_TRAVEL_INSURANCE.policyNumber,
        DEFAULT_TRAVEL_INSURANCE.policyNumber,
        DEFAULT_TRAVEL_INSURANCE.provider,
        DEFAULT_TRAVEL_INSURANCE.planName,
        DEFAULT_TRAVEL_INSURANCE.status,
        DEFAULT_TRAVEL_INSURANCE.validFrom,
        DEFAULT_TRAVEL_INSURANCE.validTo,
        DEFAULT_TRAVEL_INSURANCE.emergencyAssistancePhone,
        DEFAULT_TRAVEL_INSURANCE.claimsEmail,
        DEFAULT_TRAVEL_INSURANCE.coverageLimit,
        DEFAULT_TRAVEL_INSURANCE.deductible,
        DEFAULT_TRAVEL_INSURANCE.emergencyEvacuationLimit,
        JSON.stringify(DEFAULT_TRAVEL_INSURANCE.coveredCountries),
        JSON.stringify(DEFAULT_TRAVEL_INSURANCE.checklistSteps),
      ]
    );

    console.log('[Seed Complete] Neon database has been filled with realistic travel data!');
    process.exit(0);
  } catch (err: any) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
}

seedRealTravelData();
