import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { isPublicUploadMode } from "~/server/uploadthing/publicUploadMode";
import { deleteRestaurantImageRecord } from "~/server/uploadthing/restaurantLifecycle";
import { utapi } from "~/server/uploadthing/utapi";

export const deleteRestaurantImage = publicProcedure
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
	});
