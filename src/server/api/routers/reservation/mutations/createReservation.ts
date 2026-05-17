import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { createReservationInput } from "~/features/reservation/validation";
import { protectedProcedure } from "~/server/api/trpc";
import { reservation, restaurant } from "~/server/db/schema";
import {
	type AvailabilityContext,
	availableHoursForDate,
	createAvailability,
	nextStates,
} from "~/server/domain/reservation";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * The server is the booking authority. It validates the slot against the
 * restaurant's open hours and current capacity using the *shared* domain
 * module (the exact functions the read side uses, so client and server can
 * never disagree), then decides and persists auto-confirm synchronously.
 * Over-capacity / outside-open-hours bookings are rejected — never a false
 * confirmation. Invalidate-only on the client (nothing safe to fake): the
 * server authors the id and the confirmation outcome.
 */
export const createReservation = protectedProcedure
	.input(createReservationInput)
	.mutation(async ({ ctx, input }) => {
		const row = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.id, input.restaurantId),
			with: { availability: true, reservations: true },
		});

		if (!row) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}

		const openHours = availableHoursForDate(
			row.availability ?? [],
			input.startTime,
		);
		if (!openHours.includes(input.startTime.getUTCHours())) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "O restaurante não abre neste horário.",
			});
		}

		const now = new Date();
		const context: AvailabilityContext = {
			restaurantId: input.restaurantId,
			tableCount: row.tableCount,
			autoConfirmEnabled: row.autoConfirmEnabled,
			lowTableThreshold: row.lowTableThreshold,
			hoursByWeekday: {},
		};

		// Expiry derived on read (story 28): a stale pending hold frees its
		// table before this booking is measured against capacity.
		const { reservations: active } = nextStates({
			now,
			reservations: row.reservations ?? [],
			autoConfirm: () => context.autoConfirmEnabled,
		});
		const capacityReservations = active
			.filter((r) => r.status === "pending" || r.status === "confirmed")
			.map((r) => ({
				restaurantId: r.restaurantId,
				startTime: r.startTime,
				tableCount: r.tableCount,
				status: r.status,
			}));

		const slot = createAvailability(capacityReservations, context).slotState(
			input.startTime,
		);
		if (!slot.canBook(input.tableCount)) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Não há mesas disponíveis neste horário.",
			});
		}

		const autoConfirm = slot.canAutoConfirm;
		const [created] = await ctx.db
			.insert(reservation)
			.values({
				userId: ctx.session.user.id,
				restaurantId: input.restaurantId,
				startTime: input.startTime,
				endTime: new Date(input.startTime.getTime() + ONE_HOUR_MS),
				partySize: input.partySize,
				tableCount: input.tableCount,
				status: autoConfirm ? "confirmed" : "pending",
				validatedAt: autoConfirm ? now : null,
			})
			.returning();

		return created;
	});
