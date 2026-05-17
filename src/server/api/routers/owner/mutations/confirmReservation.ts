import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { roleProcedure } from "~/server/api/trpc";
import { reservation } from "~/server/db/schema";
import { validate } from "~/server/domain/reservation";

/**
 * The owner confirms a pending reservation: the guest is guaranteed a
 * table. Ownership is enforced server-side against the reservation's
 * restaurant (a foreign or missing reservation is `NOT_FOUND` so
 * existence never leaks); a non-pending row is rejected so the optimistic
 * client never misleads. The transition is the shared domain `validate`
 * (pending → confirmed only), never a hand-mutated status.
 */
export const confirmReservation = roleProcedure("restaurant_owner")
	.input(z.object({ reservationId: z.string().uuid() }))
	.mutation(async ({ ctx, input }) => {
		const row = await ctx.db.query.reservation.findFirst({
			where: eq(reservation.id, input.reservationId),
			with: { restaurant: { columns: { ownerId: true } } },
		});

		if (!row || row.restaurant.ownerId !== ctx.session.user.id) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}
		if (row.status !== "pending") {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Apenas reservas pendentes podem ser confirmadas.",
			});
		}

		const next = validate(row, new Date());

		const [updated] = await ctx.db
			.update(reservation)
			.set({ status: next.status, validatedAt: next.validatedAt })
			.where(eq(reservation.id, input.reservationId))
			.returning();

		return updated;
	});
