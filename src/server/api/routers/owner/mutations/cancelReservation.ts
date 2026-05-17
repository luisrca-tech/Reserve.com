import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { roleProcedure } from "~/server/api/trpc";
import { reservation } from "~/server/db/schema";

/**
 * The owner cancels a reservation (frees the table / rejects the guest).
 * Ownership is enforced server-side against the reservation's restaurant
 * (a foreign or missing reservation is `NOT_FOUND` so existence never
 * leaks); an already-cancelled row is rejected so the optimistic client
 * never misleads. The status write is the single cancel transition.
 */
export const cancelReservation = roleProcedure("restaurant_owner")
	.input(z.object({ reservationId: z.string().uuid() }))
	.mutation(async ({ ctx, input }) => {
		const row = await ctx.db.query.reservation.findFirst({
			where: eq(reservation.id, input.reservationId),
			with: { restaurant: { columns: { ownerId: true } } },
		});

		if (!row || row.restaurant.ownerId !== ctx.session.user.id) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}
		if (row.status === "cancelled") {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Esta reserva já foi cancelada.",
			});
		}

		const [updated] = await ctx.db
			.update(reservation)
			.set({ status: "cancelled", cancelledAt: new Date() })
			.where(eq(reservation.id, input.reservationId))
			.returning();

		return updated;
	});
