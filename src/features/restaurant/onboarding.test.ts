import { describe, expect, it } from "vitest";

import type { Category } from "~/server/db/schema/types";
import {
	buildAvailabilityRows,
	buildOnboardingDraft,
	emptySchedule,
	normalizeCategoryName,
	normalizeSchedule,
	type OnboardingDraft,
	type OnboardingFormState,
	onboardingStepFields,
	resolveCategory,
	stepValidity,
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

describe("emptySchedule", () => {
	it("returns seven closed weekdays with default 18–23 bounds", () => {
		const s = emptySchedule();
		expect(s).toHaveLength(7);
		expect(s.every((d) => d.open === false)).toBe(true);
		expect(s[0]).toEqual({ open: false, openHour: 18, closeHour: 23 });
	});
});

describe("normalizeSchedule", () => {
	it("keeps only open days and projects them to weekday-indexed rows", () => {
		const schedule = emptySchedule();
		schedule[2] = { open: true, openHour: 18, closeHour: 23 };
		schedule[5] = { open: true, openHour: 12, closeHour: 15 };
		expect(normalizeSchedule(schedule)).toEqual([
			{ weekday: 2, openHour: 18, closeHour: 23 },
			{ weekday: 5, openHour: 12, closeHour: 15 },
		]);
	});

	it("returns no rows when every day is closed", () => {
		expect(normalizeSchedule(emptySchedule())).toEqual([]);
	});
});

function formState(
	overrides: Partial<OnboardingFormState> = {},
): OnboardingFormState {
	const schedule = emptySchedule();
	schedule[2] = { open: true, openHour: 18, closeHour: 23 };
	return {
		name: "Cantina Nova",
		corporateEmail: "contato@cantinanova.com",
		phone: "(11) 3000-0000",
		address: "Rua A, 1 — São Paulo, SP",
		bio: "Um cantinho aconchegante.",
		category: { kind: "existing", category: categories[0] as Category },
		tableCount: 12,
		schedule,
		imageCount: 4,
		hasMenu: true,
		...overrides,
	};
}

describe("buildOnboardingDraft", () => {
	it("assembles a submittable draft from raw form state", () => {
		expect(validateOnboarding(buildOnboardingDraft(formState()))).toEqual([]);
	});

	it("maps an existing category resolution to categoryId", () => {
		const d = buildOnboardingDraft(formState());
		expect(d.categoryId).toBe("cat_italiana");
		expect(d.newCategoryName).toBeNull();
	});

	it("maps a new category resolution to newCategoryName", () => {
		const d = buildOnboardingDraft(
			formState({ category: { kind: "new", name: "Peruana" } }),
		);
		expect(d.categoryId).toBeNull();
		expect(d.newCategoryName).toBe("Peruana");
	});

	it("treats an empty category resolution as no category", () => {
		const d = buildOnboardingDraft(formState({ category: { kind: "empty" } }));
		expect(d.categoryId).toBeNull();
		expect(d.newCategoryName).toBeNull();
	});

	it("normalizes the schedule and derives image/menu flags", () => {
		const d = buildOnboardingDraft(
			formState({ imageCount: 0, hasMenu: false }),
		);
		expect(d.schedule).toEqual([{ weekday: 2, openHour: 18, closeHour: 23 }]);
		expect(d.imageCount).toBe(0);
		expect(d.hasMenu).toBe(false);
	});
});

describe("step validity", () => {
	it("groups errors under the five onboarding steps", () => {
		expect(onboardingStepFields).toEqual([
			["name", "corporateEmail", "phone", "address", "bio"],
			["category"],
			["tableCount", "schedule"],
			["images"],
			["menu"],
		]);
	});

	it("marks a step invalid when any of its fields fails", () => {
		expect(stepValidity([])).toEqual([true, true, true, true, true]);
		expect(stepValidity(["phone"])).toEqual([false, true, true, true, true]);
		expect(stepValidity(["schedule", "menu"])).toEqual([
			true,
			true,
			false,
			true,
			false,
		]);
	});
});
