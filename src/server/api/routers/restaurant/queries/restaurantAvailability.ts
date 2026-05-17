import { eq } from "drizzle-orm";
import { z } from "zod";

import { collapseHoursByWeekday } from "~/features/restaurant/mappers";
import { publicProcedure } from "~/server/api/trpc";
import { restaurant } from "~/server/db/schema";
import {
	ACTIVE_STATUSES,
	type AvailabilityContext,
	type CapacityReservation,
	nextStates,
} from "~/server/domain/reservation";

const ACTIVE = new Set<string>(ACTIVE_STATUSES);

export interface RestaurantAvailabilityResult {
	context: AvailabilityContext;
	/** Active reservations, with lifecycle expiry already derived on read. */
	reservations: CapacityReservation[];
}

/**
 * The capacity facts the booking calendar reads, authored server-side so
 * client and owner can never disagree on a slot. Lifecycle expiry is
 * derived on read (story 28) through the shared domain module: a stale
 * pending hold no longer counts against capacity, while an auto-confirming
 * restaurant promotes it instead of expiring it.
 */
export const restaurantAvailability = publicProcedure
	.input(z.object({ restaurantId: z.string().uuid() }))
	.query(async ({ ctx, input }): Promise<RestaurantAvailabilityResult> => {
		const row = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.id, input.restaurantId),
			with: { availability: true, reservations: true },
		});

		const context: AvailabilityContext = {
			restaurantId: input.restaurantId,
			tableCount: row?.tableCount ?? 0,
			autoConfirmEnabled: row?.autoConfirmEnabled ?? false,
			lowTableThreshold: row?.lowTableThreshold ?? 0,
			hoursByWeekday: collapseHoursByWeekday(row?.availability ?? []),
		};

		if (!row) return { context, reservations: [] };

		const { reservations } = nextStates({
			now: new Date(),
			reservations: row.reservations,
			autoConfirm: () => context.autoConfirmEnabled,
		});

		return {
			context,
			reservations: reservations
				.filter((r) => ACTIVE.has(r.status))
				.map((r) => ({
					restaurantId: r.restaurantId,
					startTime: r.startTime,
					tableCount: r.tableCount,
					status: r.status,
				})),
		};
	});
