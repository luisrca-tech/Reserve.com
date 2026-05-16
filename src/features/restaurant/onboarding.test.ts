import { describe, expect, it } from "vitest";

import type { Category } from "~/server/db/schema/types";
import {
	buildAvailabilityRows,
	normalizeCategoryName,
	type OnboardingDraft,
	resolveCategory,
	validateOnboarding,
} from "./onboarding";

const SEED_DATE = new Date("2026-01-01T12:00:00.000Z");

const categories: Category[] = [
	{ id: "cat_italiana", name: "Italiana", createdAt: SEED_DATE },
	{ id: "cat_japonesa", name: "Japonesa", createdAt: SEED_DATE },
];

function draft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
	return {
		name: "Cantina Nova",
		corporateEmail: "contato@cantinanova.com",
		phone: "(11) 3000-0000",
		address: "Rua A, 1 — São Paulo, SP",
		bio: "Um cantinho aconchegante.",
		categoryId: "cat_italiana",
		newCategoryName: null,
		tableCount: 12,
		schedule: [
			{ weekday: 2, openHour: 18, closeHour: 23 },
			{ weekday: 3, openHour: 18, closeHour: 23 },
		],
		imageCount: 4,
		hasMenu: true,
		...overrides,
	};
}

describe("normalizeCategoryName", () => {
	it("trims and collapses internal whitespace", () => {
		expect(normalizeCategoryName("  Italiana  ")).toBe("Italiana");
		expect(normalizeCategoryName("Comida   Árabe")).toBe("Comida Árabe");
	});
});

describe("resolveCategory", () => {
	it("matches an existing category case-insensitively after trimming", () => {
		expect(resolveCategory("  italiana ", categories)).toEqual({
			kind: "existing",
			category: categories[0],
		});
	});

	it("flags a genuinely new category with its normalized name", () => {
		expect(resolveCategory("  Mexicana ", categories)).toEqual({
			kind: "new",
			name: "Mexicana",
		});
	});

	it("treats an empty query as no selection", () => {
		expect(resolveCategory("   ", categories)).toEqual({ kind: "empty" });
	});
});

describe("buildAvailabilityRows", () => {
	it("expands open weekdays into one row per whole hour", () => {
		const rows = buildAvailabilityRows("rest_x", [
			{ weekday: 1, openHour: 18, closeHour: 21 },
		]);
		expect(rows).toEqual([
			{ id: "avail_rest_x_1_18", restaurantId: "rest_x", weekday: 1, hour: 18 },
			{ id: "avail_rest_x_1_19", restaurantId: "rest_x", weekday: 1, hour: 19 },
			{ id: "avail_rest_x_1_20", restaurantId: "rest_x", weekday: 1, hour: 20 },
		]);
	});

	it("returns no rows for an empty schedule", () => {
		expect(buildAvailabilityRows("rest_x", [])).toEqual([]);
	});

	it("skips entries whose close hour is not after open hour", () => {
		expect(
			buildAvailabilityRows("rest_x", [
				{ weekday: 4, openHour: 20, closeHour: 20 },
			]),
		).toEqual([]);
	});
});

describe("validateOnboarding", () => {
	it("returns no errors for a complete draft", () => {
		expect(validateOnboarding(draft())).toEqual([]);
	});

	it("requires the text fields", () => {
		expect(validateOnboarding(draft({ name: "  " }))).toContain("name");
		expect(validateOnboarding(draft({ address: "" }))).toContain("address");
		expect(validateOnboarding(draft({ bio: "" }))).toContain("bio");
		expect(validateOnboarding(draft({ phone: "" }))).toContain("phone");
	});

	it("requires a plausible corporate email", () => {
		expect(validateOnboarding(draft({ corporateEmail: "nope" }))).toContain(
			"corporateEmail",
		);
	});

	it("requires a category (existing or new)", () => {
		expect(
			validateOnboarding(draft({ categoryId: null, newCategoryName: null })),
		).toContain("category");
		expect(
			validateOnboarding(
				draft({ categoryId: null, newCategoryName: "Peruana" }),
			),
		).not.toContain("category");
	});

	it("requires at least one table", () => {
		expect(validateOnboarding(draft({ tableCount: 0 }))).toContain(
			"tableCount",
		);
	});

	it("requires at least one valid open weekday", () => {
		expect(validateOnboarding(draft({ schedule: [] }))).toContain("schedule");
		expect(
			validateOnboarding(
				draft({ schedule: [{ weekday: 2, openHour: 22, closeHour: 22 }] }),
			),
		).toContain("schedule");
	});

	it("requires at least four images", () => {
		expect(validateOnboarding(draft({ imageCount: 3 }))).toContain("images");
	});

	it("requires a menu upload", () => {
		expect(validateOnboarding(draft({ hasMenu: false }))).toContain("menu");
	});
});
