import type { Category } from "~/server/db/schema/types";

const SEED_DATE = new Date("2026-01-01T12:00:00.000Z");

function category(id: string, name: string): Category {
	return { id, name, createdAt: SEED_DATE };
}

export const mockCategories: Category[] = [
	category("cat_italiana", "Italiana"),
	category("cat_japonesa", "Japonesa"),
	category("cat_brasileira", "Brasileira"),
	category("cat_contemporanea", "Contemporânea"),
];

export const mockCategoriesById: Record<string, Category> = Object.fromEntries(
	mockCategories.map((c) => [c.id, c]),
);
