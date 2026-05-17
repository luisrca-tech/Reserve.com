import type { RestaurantAvailability } from "~/server/db/schema/types";
import type { RestaurantRecord, RestaurantView } from "./types";

/**
 * Collapse `(weekday,hour)` availability rows into the
 * `weekday → sorted open hours` map both the view model and the
 * server-side availability query render from (single definition,
 * client and server cannot drift).
 */
export function collapseHoursByWeekday(
	availability: Pick<RestaurantAvailability, "weekday" | "hour">[],
): Record<number, number[]> {
	const hoursByWeekday: Record<number, number[]> = {};
	for (const row of availability) {
		const hours = hoursByWeekday[row.weekday] ?? [];
		hours.push(row.hour);
		hoursByWeekday[row.weekday] = hours;
	}
	for (const hours of Object.values(hoursByWeekday)) {
		hours.sort((a, b) => a - b);
	}
	return hoursByWeekday;
}

const WEEKDAY_LABELS = [
	"Dom",
	"Seg",
	"Ter",
	"Qua",
	"Qui",
	"Sex",
	"Sáb",
] as const;

/**
 * Human-readable open days/hours derived from the `(weekday,hour)`
 * availability rows collapsed into `hoursByWeekday`. Days collapse into
 * contiguous ranges (Mon→Sun order); hours span the earliest open hour to
 * the latest closing hour (last open hour + 1).
 */
export function formatAvailability(hoursByWeekday: Record<number, number[]>): {
	days: string;
	hours: string;
} {
	const order = [1, 2, 3, 4, 5, 6, 0];
	const openDays = order.filter((wd) => (hoursByWeekday[wd]?.length ?? 0) > 0);

	if (openDays.length === 0) {
		return { days: "Fechado", hours: "—" };
	}

	const ranges: string[] = [];
	let runStart = 0;
	for (let i = 0; i < openDays.length; i++) {
		const isLast = i === openDays.length - 1;
		const breaks =
			isLast ||
			order.indexOf(openDays[i + 1] as number) !==
				order.indexOf(openDays[i] as number) + 1;
		if (breaks) {
			const start = openDays[runStart] as number;
			const end = openDays[i] as number;
			const startLabel = WEEKDAY_LABELS[start] ?? "";
			const endLabel = WEEKDAY_LABELS[end] ?? "";
			ranges.push(start === end ? startLabel : `${startLabel}–${endLabel}`);
			runStart = i + 1;
		}
	}

	const allHours = openDays.flatMap((wd) => hoursByWeekday[wd] ?? []);
	const open = Math.min(...allHours);
	const close = Math.max(...allHours) + 1;

	return { days: ranges.join(", "), hours: `${open}h–${close}h` };
}

/**
 * Schema → view mapper. Collapses the relational shape (restaurant +
 * category + `(weekday,hour)` availability rows + image/asset joins)
 * into a flat model the UI renders directly.
 */
export function toRestaurantView(record: RestaurantRecord): RestaurantView {
	const { restaurant, category, availability, images, assets, menuAsset } =
		record;

	const assetById = new Map(assets.map((a) => [a.id, a]));

	const orderedImages = [...images]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((img) => assetById.get(img.assetId)?.url)
		.filter((url): url is string => Boolean(url));

	const hoursByWeekday = collapseHoursByWeekday(availability);

	return {
		id: restaurant.id,
		name: restaurant.name,
		description: restaurant.bio ?? "",
		address: restaurant.address,
		phone: restaurant.phone,
		corporateEmail: restaurant.corporateEmail,
		categoryId: category.id,
		categoryName: category.name,
		tags: [category.name],
		tableCount: restaurant.tableCount,
		autoConfirmEnabled: restaurant.autoConfirmEnabled,
		lowTableThreshold: restaurant.lowTableThreshold,
		images: orderedImages,
		menuUrl: menuAsset?.url ?? null,
		menuKind: menuAsset?.kind ?? null,
		hoursByWeekday,
	};
}
