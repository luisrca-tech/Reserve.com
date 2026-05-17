import { toRestaurantView } from "~/features/restaurant/mappers";
import type { RestaurantView } from "~/features/restaurant/types";
import { publicProcedure } from "~/server/api/trpc";

/**
 * The full seeded catalogue as finished, server-mapped view models.
 * Client-side category filter / search / infinite scroll operate over
 * this single list (server-side search & pagination are out of scope).
 */
export const listRestaurants = publicProcedure.query(
	async ({ ctx }): Promise<RestaurantView[]> => {
		const rows = await ctx.db.query.restaurant.findMany({
			with: {
				category: true,
				availability: true,
				images: { with: { asset: true } },
			},
			orderBy: (table, { asc }) => [asc(table.name)],
		});

		return rows.map((row) =>
			toRestaurantView({
				restaurant: row,
				category: row.category,
				availability: row.availability,
				images: row.images,
				assets: row.images.map((image) => image.asset),
				menuAsset: null,
			}),
		);
	},
);
