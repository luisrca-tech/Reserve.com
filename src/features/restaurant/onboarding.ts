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
