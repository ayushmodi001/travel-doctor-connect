/**
 * Database Configuration & Connection Pool for Neon DB (PostgreSQL).
 * 
 * Features:
 * - Production connection pooling with SSL support for Neon serverless Postgres.
 * - Auto-reconnect, keep-alive, and connection timeout handling.
 * - Schema initialization and table creation for all app entities.
 * - Automatic seeding when database tables are first created.
 * - Graceful shutdown and pool lifecycle management.
 */

import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { MOCK_DOCTORS, MOCK_APPOINTMENTS, MOCK_EMERGENCY_SERVICES } from '../data/mockData';
import {
  DESTINATION_COUNTRIES,
  MEDICAL_PHRASES,
  MEDICINE_EQUIVALENTS,
  DEFAULT_TRAVEL_INSURANCE,
} from '../data/travelData';

let pool: Pool | null = null;
let isConnected = false;

/**
 * Initializes and returns the PostgreSQL / Neon DB Pool.
 */
export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  if (pool) {
    return pool;
  }

  const poolConfig: PoolConfig = {
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Neon cloud SSL certificates
    },
    max: 20, // Max concurrent client connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000, // Timeout after 5s when acquiring connection
  };

  pool = new Pool(poolConfig);

  pool.on('connect', () => {
    isConnected = true;
  });

  pool.on('error', (err: Error) => {
    console.error('[Neon DB] Unexpected client error in pool:', err.message);
    isConnected = false;
  });

  return pool;
}

/**
 * Executes a SQL query against Neon DB.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const currentPool = getDbPool();
  if (!currentPool) {
    throw new Error('DATABASE_URL is not configured. Please set DATABASE_URL to your Neon DB connection string.');
  }

  const start = Date.now();
  try {
    const res = await currentPool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Neon DB Query] ${text.slice(0, 80)}... (${duration}ms, rows: ${res.rowCount})`);
    }
    return res;
  } catch (error: any) {
    console.error(`[Neon DB Query Error] ${text.slice(0, 80)}:`, error.message);
    throw error;
  }
}

/**
 * Health check for Neon DB connection.
 */
export async function checkDbHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
  database?: string;
  error?: string;
}> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return {
      connected: false,
      latencyMs: 0,
      error: 'DATABASE_URL not set in environment',
    };
  }

  const currentPool = getDbPool();
  if (!currentPool) {
    return {
      connected: false,
      latencyMs: 0,
      error: 'Failed to create database pool',
    };
  }

  const start = Date.now();
  try {
    const res = await currentPool.query('SELECT current_database() as db, NOW() as time');
    const latencyMs = Date.now() - start;
    return {
      connected: true,
      latencyMs,
      database: res.rows[0]?.db,
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Initialize all database tables for MediConnect on Neon DB.
 */
export async function initDatabase(): Promise<void> {
  const currentPool = getDbPool();
  if (!currentPool) {
    console.log('[Neon DB] DATABASE_URL not configured. Running in hybrid memory-persistent fallback mode.');
    return;
  }

  console.log('[Neon DB] Connecting to Neon Database and verifying schema...');

  try {
    // 1. Users Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'patient',
        blood_group VARCHAR(10) DEFAULT 'O+',
        allergies JSONB DEFAULT '[]'::jsonb,
        medical_history JSONB DEFAULT '[]'::jsonb,
        emergency_contact JSONB DEFAULT '{}'::jsonb,
        profile_image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Doctors Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        sub_specialty VARCHAR(100),
        hospital VARCHAR(255) NOT NULL,
        location JSONB NOT NULL,
        rating NUMERIC(3,2) DEFAULT 4.8,
        review_count INTEGER DEFAULT 0,
        experience INTEGER DEFAULT 5,
        fee NUMERIC(10,2) DEFAULT 100,
        currency VARCHAR(10) DEFAULT 'USD',
        profile_image TEXT,
        about TEXT,
        qualifications JSONB DEFAULT '[]'::jsonb,
        languages JSONB DEFAULT '[]'::jsonb,
        available_slots JSONB DEFAULT '[]'::jsonb,
        is_available_now BOOLEAN DEFAULT true,
        consultation_type JSONB DEFAULT '["video"]'::jsonb,
        verified BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Appointments Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(100) PRIMARY KEY,
        doctor_id VARCHAR(100) NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        doctor_specialty VARCHAR(100),
        doctor_image TEXT,
        patient_id VARCHAR(100) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL,
        type VARCHAR(50) DEFAULT 'video',
        status VARCHAR(50) DEFAULT 'upcoming',
        reason TEXT,
        meeting_link TEXT,
        amount NUMERIC(10,2) DEFAULT 100,
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Emergency Services Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS emergency_services (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        location JSONB NOT NULL,
        available24h BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Travel Intelligence & Destinations Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS travel_destinations (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        flag VARCHAR(10) NOT NULL,
        capital VARCHAR(100),
        currency VARCHAR(10),
        currency_symbol VARCHAR(10),
        primary_language VARCHAR(50),
        local_emergency JSONB NOT NULL,
        embassy_support JSONB NOT NULL,
        health_advisories JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE travel_destinations ADD COLUMN IF NOT EXISTS capital VARCHAR(100);
      ALTER TABLE travel_destinations ADD COLUMN IF NOT EXISTS currency VARCHAR(10);
      ALTER TABLE travel_destinations ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10);
      ALTER TABLE travel_destinations ADD COLUMN IF NOT EXISTS primary_language VARCHAR(50);
    `);

    // 6. Medical Phrases Table (Travel Translator)
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS medical_phrases (
        id VARCHAR(100) PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        english TEXT NOT NULL,
        translation TEXT,
        phonetic TEXT,
        language VARCHAR(100),
        language_code VARCHAR(10),
        flag VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE medical_phrases ADD COLUMN IF NOT EXISTS translation TEXT;
      ALTER TABLE medical_phrases ADD COLUMN IF NOT EXISTS phonetic TEXT;
      ALTER TABLE medical_phrases ADD COLUMN IF NOT EXISTS language VARCHAR(100);
      ALTER TABLE medical_phrases ADD COLUMN IF NOT EXISTS language_code VARCHAR(10);
      ALTER TABLE medical_phrases ADD COLUMN IF NOT EXISTS flag VARCHAR(10);
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_phrases' AND column_name = 'translations') THEN
          ALTER TABLE medical_phrases ALTER COLUMN translations DROP NOT NULL;
        END IF;
      END $$;
    `);

    // 7. Medicine Equivalents Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS medicine_equivalents (
        id VARCHAR(100) PRIMARY KEY,
        generic_name VARCHAR(255) NOT NULL,
        primary_use TEXT NOT NULL,
        common_home_brands JSONB NOT NULL,
        brands_by_country JSONB NOT NULL,
        customs_restrictions JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE medicine_equivalents ADD COLUMN IF NOT EXISTS customs_restrictions JSONB;
    `);

    // 8. Travel Insurance Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS travel_insurance (
        id VARCHAR(100) PRIMARY KEY,
        policy_number VARCHAR(100) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        plan_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        valid_from VARCHAR(50) NOT NULL,
        valid_to VARCHAR(50) NOT NULL,
        emergency_assistance_phone VARCHAR(50) NOT NULL,
        claims_email VARCHAR(100),
        coverage_limit VARCHAR(50),
        deductible VARCHAR(50),
        emergency_evacuation_limit VARCHAR(50),
        covered_countries JSONB NOT NULL,
        checklist_steps JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS status VARCHAR(50);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS valid_from VARCHAR(50);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS valid_to VARCHAR(50);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS claims_email VARCHAR(100);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS coverage_limit VARCHAR(50);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS deductible VARCHAR(50);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS emergency_evacuation_limit VARCHAR(50);
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS covered_countries JSONB;
      ALTER TABLE travel_insurance ADD COLUMN IF NOT EXISTS checklist_steps JSONB;
    `);

    // 9. User Vitals Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS user_vitals (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) DEFAULT 'u1',
        heart_rate VARCHAR(50) DEFAULT '72 bpm',
        blood_pressure VARCHAR(50) DEFAULT '120/80 mmHg',
        blood_oxygen VARCHAR(50) DEFAULT '98%',
        blood_group VARCHAR(10) DEFAULT 'O+',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Medical Documents (Cloud Bucket Storage)
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS medical_documents (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50) DEFAULT 'application/pdf',
        file_size INTEGER DEFAULT 0,
        category VARCHAR(50) DEFAULT 'medical_record',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. User Settings Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id VARCHAR(100) PRIMARY KEY,
        notifications BOOLEAN DEFAULT true,
        dark_mode BOOLEAN DEFAULT false,
        location_enabled BOOLEAN DEFAULT true,
        biometric_enabled BOOLEAN DEFAULT false,
        language VARCHAR(10) DEFAULT 'en',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Chat Messages Table
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(100) PRIMARY KEY,
        appointment_id VARCHAR(100) NOT NULL,
        sender_id VARCHAR(100) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed doctors if empty
    const docCheck = await currentPool.query('SELECT count(*) as count FROM doctors');
    if (parseInt(docCheck.rows[0].count, 10) === 0) {
      console.log('[Neon DB] Seeding initial doctors into Neon DB...');
      for (const d of MOCK_DOCTORS) {
        await currentPool.query(
          `INSERT INTO doctors (id, name, specialty, hospital, location, rating, review_count, experience, fee, currency, profile_image, about, qualifications, languages, available_slots, is_available_now, consultation_type, verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (id) DO NOTHING`,
          [
            d.id,
            d.name,
            d.specialty,
            d.hospital,
            JSON.stringify(d.location),
            d.rating,
            d.reviewCount,
            d.experience,
            d.fee,
            d.currency,
            d.profileImage,
            d.about,
            JSON.stringify(d.qualifications),
            JSON.stringify(d.languages),
            JSON.stringify(d.availableSlots),
            d.isAvailableNow,
            JSON.stringify(d.consultationType),
            d.verified,
          ]
        );
      }
    }

    // Seed emergency facilities if empty
    const emCheck = await currentPool.query('SELECT count(*) as count FROM emergency_services');
    if (parseInt(emCheck.rows[0].count, 10) === 0) {
      console.log('[Neon DB] Seeding emergency facilities into Neon DB...');
      for (const e of MOCK_EMERGENCY_SERVICES) {
        await currentPool.query(
          `INSERT INTO emergency_services (id, name, type, phone, address, location, available24h)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            e.id,
            e.name,
            e.type,
            e.phone,
            e.address,
            JSON.stringify(e.location),
            e.available24h,
          ]
        );
      }
    }

    // Seed travel destinations if empty
    const destCheck = await currentPool.query('SELECT count(*) as count FROM travel_destinations');
    if (parseInt(destCheck.rows[0].count, 10) === 0) {
      console.log('[Neon DB] Seeding travel destinations into Neon DB...');
      for (const c of DESTINATION_COUNTRIES) {
        await currentPool.query(
          `INSERT INTO travel_destinations (id, code, name, flag, capital, currency, currency_symbol, primary_language, local_emergency, embassy_support, health_advisories)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (code) DO NOTHING`,
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
    }

    // Seed medical phrases if empty
    const phraseCheck = await currentPool.query('SELECT count(*) as count FROM medical_phrases');
    if (parseInt(phraseCheck.rows[0].count, 10) === 0) {
      console.log('[Neon DB] Seeding medical phrases into Neon DB...');
      for (const p of MEDICAL_PHRASES) {
        await currentPool.query(
          `INSERT INTO medical_phrases (id, category, english, translation, phonetic, language, language_code, flag)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
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
    }

    // Seed medicine equivalents if empty
    const medCheck = await currentPool.query('SELECT count(*) as count FROM medicine_equivalents');
    if (parseInt(medCheck.rows[0].count, 10) === 0) {
      console.log('[Neon DB] Seeding medicine equivalents into Neon DB...');
      for (const m of MEDICINE_EQUIVALENTS) {
        await currentPool.query(
          `INSERT INTO medicine_equivalents (id, generic_name, primary_use, common_home_brands, brands_by_country, customs_restrictions)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
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
    }

    // Seed travel insurance policy if empty
    const insCheck = await currentPool.query('SELECT count(*) as count FROM travel_insurance');
    if (parseInt(insCheck.rows[0].count, 10) === 0) {
      console.log('[Neon DB] Seeding travel insurance into Neon DB...');
      await currentPool.query(
        `INSERT INTO travel_insurance (id, policy_number, provider, plan_name, status, valid_from, valid_to, emergency_assistance_phone, claims_email, coverage_limit, deductible, emergency_evacuation_limit, covered_countries, checklist_steps)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
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
    }

    // Seed default user vitals if empty
    const vitCheck = await currentPool.query('SELECT count(*) as count FROM user_vitals');
    if (parseInt(vitCheck.rows[0].count, 10) === 0) {
      console.log('[Neon DB] Seeding user vitals into Neon DB...');
      await currentPool.query(
        `INSERT INTO user_vitals (id, user_id, heart_rate, blood_pressure, blood_oxygen, blood_group)
         VALUES ('v1', 'u1', '72 bpm', '120/80 mmHg', '98%', 'O+')
         ON CONFLICT (id) DO NOTHING`
      );
    }

    console.log('[Neon DB] Database initialized and verified successfully!');
  } catch (err: any) {
    console.error('[Neon DB] Error initializing schema:', err.message);
  }
}

/**
 * Closes the Neon DB connection pool on server shutdown.
 */
export async function closeDbPool(): Promise<void> {
  if (pool) {
    console.log('[Neon DB] Closing connection pool...');
    await pool.end();
    pool = null;
    isConnected = false;
    console.log('[Neon DB] Pool closed gracefully.');
  }
}
