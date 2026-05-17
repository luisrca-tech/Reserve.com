import type {
	Category,
	RestaurantAvailability,
} from "~/server/db/schema/types";

/** One open weekday with its whole-hour opening/closing bounds. */
export interface WeekdaySchedule {
	weekday: number;
	openHour: number;
	closeHour: number;
}

/** Everything the onboarding form collects, in a pure, testable shape. */
export interface OnboardingDraft {
	name: string;
	corporateEmail: string;
	phone: string;
	address: string;
	bio: string;
	categoryId: string | null;
	newCategoryName: string | null;
	tableCount: number;
	schedule: WeekdaySchedule[];
	imageCount: number;
	hasMenu: boolean;
}

export type OnboardingError =
	| "name"
	| "corporateEmail"
	| "phone"
	| "address"
	| "bio"
	| "category"
	| "tableCount"
	| "schedule"
	| "images"
	| "menu";

export type CategoryResolution =
	| { kind: "empty" }
	| { kind: "existing"; category: Category }
	| { kind: "new"; name: string };

/** Trim and collapse internal whitespace so duplicates are caught reliably. */
export function normalizeCategoryName(name: string): string {
	return name.trim().replace(/\s+/g, " ");
}

/**
 * Duplicate-safe category resolution: a normalized, case-insensitive match
 * against an existing category wins over creating a new one.
 */
export function resolveCategory(
	query: string,
	categories: Category[],
): CategoryResolution {
	const normalized = normalizeCategoryName(query);
	if (normalized === "") return { kind: "empty" };

	const existing = categories.find(
		(c) =>
			normalizeCategoryName(c.name).toLowerCase() === normalized.toLowerCase(),
	);
	return existing
		? { kind: "existing", category: existing }
		: { kind: "new", name: normalized };
}

/** Expand open weekdays into `(weekday,hour)` availability rows. */
export function buildAvailabilityRows(
	restaurantId: string,
	schedule: WeekdaySchedule[],
): RestaurantAvailability[] {
	const rows: RestaurantAvailability[] = [];
	for (const { weekday, openHour, closeHour } of schedule) {
		for (let hour = openHour; hour < closeHour; hour++) {
			rows.push({
				id: `avail_${restaurantId}_${weekday}_${hour}`,
				restaurantId,
				weekday,
				hour,
			});
		}
	}
	return rows;
}

/** A single weekday row as edited in the form (closed days kept for the UI). */
export interface DaySchedule {
	open: boolean;
	openHour: number;
	closeHour: number;
}

/** Raw form state, before serialization into an {@link OnboardingDraft}. */
export interface OnboardingFormState {
	name: string;
	corporateEmail: string;
	phone: string;
	address: string;
	bio: string;
	category: CategoryResolution;
	tableCount: number;
	schedule: DaySchedule[];
	imageCount: number;
	hasMenu: boolean;
}

/** Seven closed weekdays with sensible default opening bounds. */
export function emptySchedule(): DaySchedule[] {
	return Array.from({ length: 7 }, () => ({
		open: false,
		openHour: 18,
		closeHour: 23,
	}));
}

/** Drop closed days and project the rest onto weekday-indexed rows. */
export function normalizeSchedule(schedule: DaySchedule[]): WeekdaySchedule[] {
	return schedule.flatMap((d, weekday) =>
		d.open ? [{ weekday, openHour: d.openHour, closeHour: d.closeHour }] : [],
	);
}

/** Single place that turns raw form state into a validated-shape draft. */
export function buildOnboardingDraft(
	state: OnboardingFormState,
): OnboardingDraft {
	return {
		name: state.name,
		corporateEmail: state.corporateEmail,
		phone: state.phone,
		address: state.address,
		bio: state.bio,
		categoryId:
			state.category.kind === "existing" ? state.category.category.id : null,
		newCategoryName: state.category.kind === "new" ? state.category.name : null,
		tableCount: state.tableCount,
		schedule: normalizeSchedule(state.schedule),
		imageCount: state.imageCount,
		hasMenu: state.hasMenu,
	};
}

/** Which validation errors belong to each onboarding step, in order. */
export const onboardingStepFields: readonly (readonly OnboardingError[])[] = [
	["name", "corporateEmail", "phone", "address", "bio"],
	["category"],
	["tableCount", "schedule"],
	["images"],
	["menu"],
];

/** Per-step pass/fail derived from the flat error list. */
export function stepValidity(errors: OnboardingError[]): boolean[] {
	return onboardingStepFields.map((fields) =>
		fields.every((f) => !errors.includes(f)),
	);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns the list of failing fields; empty means the draft is submittable. */
export function validateOnboarding(draft: OnboardingDraft): OnboardingError[] {
	const errors: OnboardingError[] = [];

	if (draft.name.trim() === "") errors.push("name");
	if (!EMAIL_RE.test(draft.corporateEmail.trim()))
		errors.push("corporateEmail");
	if (draft.phone.trim() === "") errors.push("phone");
	if (draft.address.trim() === "") errors.push("address");
	if (draft.bio.trim() === "") errors.push("bio");

	const hasCategory =
		Boolean(draft.categoryId) ||
		normalizeCategoryName(draft.newCategoryName ?? "") !== "";
	if (!hasCategory) errors.push("category");

	if (draft.tableCount < 1) errors.push("tableCount");

	const hasOpenDay = draft.schedule.some((s) => s.closeHour > s.openHour);
	if (!hasOpenDay) errors.push("schedule");

	if (draft.imageCount < 4) errors.push("images");
	if (!draft.hasMenu) errors.push("menu");

	return errors;
}
