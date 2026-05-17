import { eq } from "drizzle-orm";
import { ownsRestaurantProcedure } from "~/server/api/trpc";
import { restaurant } from "~/server/db/schema";
import { deleteRestaurantUploadthingFiles } from "~/server/uploadthing/restaurantLifecycle";
import { utapi } from "~/server/uploadthing/utapi";

export const deleteRestaurant = ownsRestaurantProcedure.mutation(
	async ({ ctx, input }) => {
		await deleteRestaurantUploadthingFiles(input.restaurantId, {
			db: ctx.db,
			utapi,
		});

		await ctx.db
			.delete(restaurant)
			.where(eq(restaurant.id, input.restaurantId));

		return { success: true as const };
	},
);
