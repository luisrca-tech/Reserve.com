import type { RestaurantRecord, RestaurantView } from "./types";

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

	const hoursByWeekday: Record<number, number[]> = {};
	for (const row of availability) {
		const hours = hoursByWeekday[row.weekday] ?? [];
		hours.push(row.hour);
		hoursByWeekday[row.weekday] = hours;
	}
	for (const hours of Object.values(hoursByWeekday)) {
		hours.sort((a, b) => a - b);
	}

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
		hoursByWeekday,
	};
}
