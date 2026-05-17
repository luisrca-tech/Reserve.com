import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { canManageRestaurant } from "~/server/auth/restaurantAccess";
import { restaurantImage } from "~/server/db/schema";
import { isPublicUploadMode } from "~/server/uploadthing/publicUploadMode";

export const listGalleryImages = publicProcedure
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
	});
