import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { canManageRestaurant } from "~/server/auth/restaurantAccess";
import {
	createTRPCRouter,
	ownsRestaurantProcedure,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { isPublicUploadMode } from "~/server/uploadthing/publicUploadMode";
import { restaurant, restaurantImage } from "~/server/db/schema";
import {
	deleteRestaurantImageRecord,
	deleteRestaurantUploadthingFiles,
} from "~/server/uploadthing/restaurantLifecycle";
import { utapi } from "~/server/uploadthing/utapi";

export const restaurantRouter = createTRPCRouter({
	listGalleryImages: publicProcedure
		.input(z.object({ restaurantId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			if (!isPublicUploadMode()) {
				if (!ctx.session?.user) {
					throw new TRPCError({ code: "UNAUTHORIZED" });
				}

				const allowed = await canManageRestaurant(
					ctx.db,
					ctx.session.user,
					input.restaurantId,
				);

				if (!allowed) {
					throw new TRPCError({ code: "FORBIDDEN" });
				}
			}

			return ctx.db.query.restaurantImage.findMany({
				where: eq(restaurantImage.restaurantId, input.restaurantId),
				orderBy: (table, { asc }) => [asc(table.sortOrder)],
				columns: { id: true, sortOrder: true },
				with: { asset: { columns: { url: true } } },
			});
		}),

	deleteRestaurantImage: publicProcedure
		.input(z.object({ restaurantImageId: z.string().uuid() }))
		.mutation(({ ctx, input }) => {
			if (!isPublicUploadMode() && !ctx.session?.user) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			return deleteRestaurantImageRecord(input.restaurantImageId, {
				db: ctx.db,
				utapi,
				user: ctx.session?.user ?? { id: "public", role: "admin" },
			});
		}),

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
