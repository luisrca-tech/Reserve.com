import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../schema";
import { seedCategories } from "./categories";
import { assertNotProduction } from "./productionGuard";
import { seedUsers } from "./users";

type Database = ReturnType<typeof drizzle<typeof schema>>;
type Seeder = (db: Database) => Promise<void>;

/**
 * Seeders in fixed foreign-key order. Future phases append users, restaurants
 * and reservations here; the orchestrator runs them in this order for a full
 * run and dispatches a single one by name via CLI argument.
 */
const SEEDERS: ReadonlyArray<{ name: string; run: Seeder }> = [
	{ name: "categories", run: seedCategories },
	{ name: "users", run: seedUsers },
];

async function main(): Promise<void> {
	assertNotProduction(process.env.NODE_ENV);

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not set. Aborting seed.");
	}

	const requested = process.argv[2];
	const toRun = requested
		? SEEDERS.filter((s) => s.name === requested)
		: SEEDERS;

	if (requested && toRun.length === 0) {
		const available = SEEDERS.map((s) => s.name).join(", ");
		throw new Error(
			`Unknown seeder "${requested}". Available: ${available}.`,
		);
	}

	const conn = postgres(databaseUrl, { max: 1 });
	const db = drizzle(conn, { schema });

	try {
		console.log(
			requested
				? `Seeding "${requested}"...`
				: "Seeding database (full run)...",
		);
		for (const seeder of toRun) {
			await seeder.run(db);
		}
		console.log("Seed complete.");
	} finally {
		await conn.end();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
