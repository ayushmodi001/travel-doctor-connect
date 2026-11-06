import dotenv from 'dotenv';
dotenv.config();

import { getDbPool } from '../config/db';
import { seedUsersVitalsAndAppointments } from './fillTravelDataWithGemini';

async function run() {
  const pool = getDbPool();
  if (!pool) {
    console.error('No DB pool');
    process.exit(1);
  }
  await seedUsersVitalsAndAppointments(pool);
  console.log('Done!');
  process.exit(0);
}

run();
