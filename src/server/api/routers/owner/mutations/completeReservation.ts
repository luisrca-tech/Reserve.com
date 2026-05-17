import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { roleProcedure } from "~/server/api/trpc";
import { reservation } from "~/server/db/schema";
import { complete } from "~/server/domain/reservation";

/**
 * The owner marks a confirmed reservation as honoured (the guest showed
 * up): `confirmed → completed`, so the lifecycle reflects reality.
 * Ownership is enforced server-side against the reservation's restaurant
 * (a foreign or missing reservation is `NOT_FOUND` so existence never
 * leaks); a non-confirmed row is rejected so the optimistic client never
 * misleads. The transition is the shared domain `complete`, never a
 * hand-mutated status.
 */
export const completeReservation = roleProcedure("restaurant_owner")
	.input(z.object({ reservationId: z.string().uuid() }))
	.mutation(async ({ ctx, input }) => {
		const row = await ctx.db.query.reservation.findFirst({
			where: eq(reservation.id, input.reservationId),
			with: { restaurant: { columns: { ownerId: true } } },
		});

		if (!row || row.restaurant.ownerId !== ctx.session.user.id) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}
		if (row.status !== "confirmed") {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Apenas reservas confirmadas podem ser concluídas.",
			});
		}

		const next = complete(row);

		const [updated] = await ctx.db
			.update(reservation)
			.set({ status: next.status })
			.where(eq(reservation.id, input.reservationId))
			.returning();

		return updated;
	});
