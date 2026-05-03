
import { seedAll } from './src/infrastructure/services/SeedDataLoader';
import { logger } from './src/utils/logger';

async function main() {
  try {
    await seedAll();
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();
