import { OrderModel } from '../models/Order';

/**
 * Small, idempotent data fixes that run on startup.
 * Each one must be safe to run any number of times.
 */
export async function runMigrations(): Promise<void> {
  // Inside paper "fluted" changed from a single number to a list (e.g. 120 → [120]).
  const fluted = await OrderModel.collection.updateMany(
    {
      'insidePaper.fluted': { $exists: true },
      $expr: { $not: { $isArray: '$insidePaper.fluted' } },
    },
    [{ $set: { 'insidePaper.fluted': ['$insidePaper.fluted'] } }],
  );
  if (fluted.modifiedCount > 0) {
    console.log(`Migrated ${fluted.modifiedCount} order(s) to multi-value fluted paper.`);
  }
}
