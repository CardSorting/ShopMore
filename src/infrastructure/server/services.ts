import { initDatabase } from '@infrastructure/sqlite/database';
import { getInitialServices } from '@core/container';
import { seedTaxonomy } from '@infrastructure/services/SeedDataLoader';

let initPromise: Promise<void> | null = null;

export async function getServerServices() {
    if (!initPromise) {
        initPromise = (async () => {
            await initDatabase();
            await seedTaxonomy().catch(() => {}); // Seed if empty
        })();
    }
    await initPromise;
    return getInitialServices();
}
