import { mockDb } from './mockDb';

/**
 * Seed the database with initial data.
 * This function initializes the in-memory mock database.
 * 
 * @param force - If true, reinitializes even if already initialized
 */
export function seedDatabase(force = false): void {
  mockDb.initialize(force);
}

/**
 * Clear the database and reset to initial state.
 * Use this in tests to ensure a clean slate.
 */
export function clearDatabase(): void {
  mockDb.reset();
}

// Re-export for backward compatibility
export { mockDb };
