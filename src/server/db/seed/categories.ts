import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "../schema";
import { category } from "../schema";
import { slugToUuid } from "./slugToUuid";

type Database = PostgresJsDatabase<typeof schema>;

/**
 * The seed owns its own copy of the fixed categories. It must never import from
 * the feature mock directories; deleting those mocks must require zero seed
 * changes.
 */
const FIXED_CATEGORIES: ReadonlyArray<{ slug: string; name: string }> = [
	{ slug: "cat_italiana", name: "Italiana" },
	{ slug: "cat_japonesa", name: "Japonesa" },
	{ slug: "cat_brasileira", name: "Brasileira" },
	{ slug: "cat_contemporanea", name: "Contemporânea" },
];

export async function seedCategories(db: Database): Promise<void> {
	const rows = FIXED_CATEGORIES.map(({ slug, name }) => ({
		id: slugToUuid(slug),
		name,
	}));

	await db.insert(category).values(rows).onConflictDoNothing({
		target: category.id,
	});

	console.log(`  categories: ${rows.length} upserted`);
}
