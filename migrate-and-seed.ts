import { initDatabase } from './src/infrastructure/sqlite/database';
import { seedAll } from './src/infrastructure/services/SeedDataLoader';
import { logger } from './src/utils/logger';

async function main() {
  try {
    logger.info('Running migrations...');
    await initDatabase();
    logger.info('Migrations complete.');

    await seedAll();

    logger.info('All done!');
    process.exit(0);
  } catch (err) {
    logger.error('Migration/seed failed:', err);
    process.exit(1);
  }
}

main();
