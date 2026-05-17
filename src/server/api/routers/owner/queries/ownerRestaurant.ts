import { eq } from "drizzle-orm";

import { toRestaurantView } from "~/features/restaurant/mappers";
import type { RestaurantView } from "~/features/restaurant/types";
import { roleProcedure } from "~/server/api/trpc";
import { restaurant } from "~/server/db/schema";

/**
 * The signed-in owner's own restaurant as a finished view model (real
 * settings: auto-confirm, low-table threshold, table count, hours). Scoped
 * by `ctx.session.user.id` — never client input — so an owner can only ever
 * read their own. `null` when they have not completed onboarding.
 */
export const ownerRestaurant = roleProcedure("restaurant_owner").query(
	async ({ ctx }): Promise<RestaurantView | null> => {
		const row = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.ownerId, ctx.session.user.id),
			with: {
				category: true,
				availability: true,
				images: { with: { asset: true } },
				menuAsset: true,
			},
		});

		if (!row) return null;

		return toRestaurantView({
			restaurant: row,
			category: row.category,
			availability: row.availability,
			images: row.images,
			assets: row.images.map((image) => image.asset),
			menuAsset: row.menuAsset ?? null,
		});
	},
);
