import { eq } from "drizzle-orm";

import type { OwnerReservationView } from "~/features/owner/types";
import { roleProcedure } from "~/server/api/trpc";
import { restaurant } from "~/server/db/schema";
import { nextStates } from "~/server/domain/reservation";

/**
 * Every reservation for the signed-in owner's restaurant as finished view
 * models: the guest's name + phone are resolved server-side (no client
 * lookup) and lifecycle expiry is derived on read (story 28) through the
 * shared domain module — a stale pending hold reads as expired, or is
 * promoted when the restaurant auto-confirms. Scoped by the session owner,
 * never client input. Empty until onboarding creates the restaurant.
 */
export const ownerReservations = roleProcedure("restaurant_owner").query(
	async ({ ctx }): Promise<OwnerReservationView[]> => {
		const row = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.ownerId, ctx.session.user.id),
			columns: { id: true, autoConfirmEnabled: true },
			with: { reservations: { with: { user: true } } },
		});

		if (!row) return [];

		const { reservations } = nextStates({
			now: new Date(),
			reservations: row.reservations,
			autoConfirm: () => row.autoConfirmEnabled,
		});

		const guestById = new Map(row.reservations.map((r) => [r.id, r.user]));

		return reservations.map((r) => {
			const guest = guestById.get(r.id);
			return {
				id: r.id,
				restaurantId: r.restaurantId,
				userId: r.userId,
				guestName: guest?.name ?? "Cliente",
				guestPhone: guest?.phone ?? "—",
				startTime: r.startTime,
				endTime: r.endTime,
				status: r.status,
				partySize: r.partySize,
				tableCount: r.tableCount,
			};
		});
	},
);
