import { eq } from "drizzle-orm";
import { z } from "zod";

import { toRestaurantView } from "~/features/restaurant/mappers";
import type { RestaurantView } from "~/features/restaurant/types";
import { publicProcedure } from "~/server/api/trpc";
import { restaurant } from "~/server/db/schema";

/**
 * A single restaurant as a finished detail view model: real images,
 * hours, address, contact, and the resolved menu asset (kind included so
 * the detail page renders PDF vs image). `null` when it does not exist.
 */
export const restaurantById = publicProcedure
	.input(z.object({ restaurantId: z.string().uuid() }))
	.query(async ({ ctx, input }): Promise<RestaurantView | null> => {
		const row = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.id, input.restaurantId),
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
	});
