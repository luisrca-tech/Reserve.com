import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { canManageRestaurant } from "~/server/auth/restaurantAccess";
import {
	createTRPCRouter,
	ownsRestaurantProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import { restaurant, restaurantImage } from "~/server/db/schema";
import {
	deleteRestaurantImageRecord,
	deleteRestaurantUploadthingFiles,
} from "~/server/uploadthing/restaurantLifecycle";
import { utapi } from "~/server/uploadthing/utapi";

export const restaurantRouter = createTRPCRouter({
	listGalleryImages: protectedProcedure
		.input(z.object({ restaurantId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const allowed = await canManageRestaurant(
				ctx.db,
				ctx.session.user,
				input.restaurantId,
			);

			if (!allowed) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			return ctx.db.query.restaurantImage.findMany({
				where: eq(restaurantImage.restaurantId, input.restaurantId),
				orderBy: (table, { asc }) => [asc(table.sortOrder)],
				columns: { id: true, sortOrder: true },
				with: { asset: { columns: { url: true } } },
			});
		}),

	deleteRestaurantImage: protectedProcedure
		.input(z.object({ restaurantImageId: z.string().uuid() }))
		.mutation(({ ctx, input }) =>
			deleteRestaurantImageRecord(input.restaurantImageId, {
				db: ctx.db,
				utapi,
				user: ctx.session.user,
			}),
		),

	deleteRestaurant: ownsRestaurantProcedure.mutation(async ({ ctx, input }) => {
		await deleteRestaurantUploadthingFiles(input.restaurantId, {
			db: ctx.db,
			utapi,
		});

		await ctx.db
			.delete(restaurant)
			.where(eq(restaurant.id, input.restaurantId));

		return { success: true as const };
	}),
});
