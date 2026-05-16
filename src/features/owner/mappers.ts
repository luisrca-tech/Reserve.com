import {
	mockRestaurantRecords,
	mockRestaurantViewsById,
} from "~/features/restaurant/mock/restaurants";
import type { RestaurantView } from "~/features/restaurant/types";

/** ownerId → restaurantId, derived from the relational mock records. */
const restaurantIdByOwnerId: Record<string, string> = Object.fromEntries(
	mockRestaurantRecords.map((r) => [r.restaurant.ownerId, r.restaurant.id]),
);

/**
 * Resolves the restaurant an owner manages. Seeded owners map directly via
 * `ownerId`; an owner promoted through onboarding has no persisted record
 * yet (documented Phase 5 debt), so the first seeded restaurant is used as
 * a populated stand-in to keep the dashboard demoable.
 */
export function resolveOwnerRestaurant(ownerId: string): RestaurantView {
	const restaurantId = restaurantIdByOwnerId[ownerId];
	const own = restaurantId ? mockRestaurantViewsById[restaurantId] : undefined;
	if (own) return own;
	const fallback = Object.values(mockRestaurantViewsById)[0];
	if (!fallback) throw new Error("No seeded restaurants available");
	return fallback;
}
