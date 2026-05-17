import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { updateSettingsInput } from "~/features/owner/validation";
import { toRestaurantView } from "~/features/restaurant/mappers";
import type { RestaurantView } from "~/features/restaurant/types";
import { roleProcedure } from "~/server/api/trpc";
import { restaurant, restaurantAvailability } from "~/server/db/schema";

/**
 * The owner updates their restaurant settings (name, phone, bio,
 * auto-confirm, low-table threshold, table count, weekly hours). The
 * restaurant is resolved from `ctx.session.user.id` — never client input —
 * so an owner can only ever edit their own; an owner without a restaurant
 * is `NOT_FOUND`. The row update and the full availability replacement run
 * in one transaction so capacity/confirmation behaviour can never observe a
 * half-applied schedule. Returns the finished `RestaurantView` (via the
 * shared mapper) so the optimistic client reconciles to server truth.
 */
export const updateSettings = roleProcedure("restaurant_owner")
	.input(updateSettingsInput)
	.mutation(async ({ ctx, input }): Promise<RestaurantView> => {
		const restaurantWith = {
			category: true,
			availability: true,
			images: { with: { asset: true } },
			menuAsset: true,
		} as const;

		const row = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.ownerId, ctx.session.user.id),
			with: restaurantWith,
		});

		if (!row) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}

		const availabilityRows = Object.entries(input.hoursByWeekday).flatMap(
			([weekday, hours]) =>
				(hours ?? []).map((hour) => ({
					restaurantId: row.id,
					weekday: Number(weekday),
					hour,
				})),
		);

		await ctx.db.transaction(async (tx) => {
			await tx
				.update(restaurant)
				.set({
					name: input.name,
					phone: input.phone,
					bio: input.bio,
					autoConfirmEnabled: input.autoConfirmEnabled,
					lowTableThreshold: input.lowTableThreshold,
					tableCount: input.tableCount,
					updatedAt: new Date(),
				})
				.where(eq(restaurant.id, row.id));

			await tx
				.delete(restaurantAvailability)
				.where(eq(restaurantAvailability.restaurantId, row.id));

			if (availabilityRows.length > 0) {
				await tx.insert(restaurantAvailability).values(availabilityRows);
			}
		});

		const updated = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.id, row.id),
			with: restaurantWith,
		});

		if (!updated) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}

		return toRestaurantView({
			restaurant: updated,
			category: updated.category,
			availability: updated.availability,
			images: updated.images,
			assets: updated.images.map((image) => image.asset),
			menuAsset: updated.menuAsset ?? null,
		});
	});
