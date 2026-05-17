import type {
	Asset,
	Category,
	Restaurant,
	RestaurantAvailability,
	RestaurantImage,
} from "~/server/db/schema/types";

export type { Category, Restaurant } from "~/server/db/schema/types";

/** A restaurant row with everything needed to render it, schema-shaped. */
export interface RestaurantRecord {
	restaurant: Restaurant;
	category: Category;
	availability: RestaurantAvailability[];
	images: RestaurantImage[];
	assets: Asset[];
	menuAsset: Asset | null;
}

/** View model the UI consumes. */
export interface RestaurantView {
	id: string;
	name: string;
	description: string;
	address: string;
	phone: string;
	corporateEmail: string;
	categoryId: string;
	categoryName: string;
	tags: string[];
	tableCount: number;
	autoConfirmEnabled: boolean;
	lowTableThreshold: number;
	images: string[];
	menuUrl: string | null;
	/** Kind of the menu asset, so the detail page renders PDF vs image. */
	menuKind: "image" | "pdf" | null;
	/** weekday (0–6) → sorted list of open whole hours (0–23). */
	hoursByWeekday: Record<number, number[]>;
}
