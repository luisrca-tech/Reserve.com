import { type AvailabilityContext, createAvailability } from "./Availability";
import {
	DEFAULT_LIFECYCLE_CONFIG,
	type LifecycleConfig,
	type LifecycleTransition,
	nextStates,
} from "./lifecycle";
import type { Reservation } from "./types";

export interface ReservationStateInput {
	reservations: Reservation[];
	/** Capacity + lifecycle facts for the managed restaurant. */
	restaurant: AvailabilityContext;
	/** The current time, supplied from outside — never read in here. */
	now: Date;
	config?: LifecycleConfig;
}

/**
 * A pre-start reminder or a low-capacity warning for an upcoming slot.
 * Status transitions (expiry/auto-confirm) are reported as `transitions`.
 */
export type ReservationAlert =
	| { kind: "reminder"; reservationId: string }
	| {
			kind: "lowTables";
			slotMs: number;
			startTime: Date;
			remaining: number;
	  };

export interface ReservationStateResult {
	/** Reservations with any due transitions applied (same order in). */
	nextReservations: Reservation[];
	transitions: LifecycleTransition[];
	alerts: ReservationAlert[];
}

/**
 * The single rule owner for owner-side reservation evolution. Given the
 * reservation set, restaurant facts, and the current time, it derives the
 * next states (lifecycle), pre-start reminders, and low-tables warnings —
 * the last via the shared `Availability` source the booking UI also reads.
 *
 * Pure: deterministic for fixed inputs, no clock/random reads, no mutation
 * of the input. `OwnerStoreContext` owns the clock and feeds `now` in.
 */
export function reservationState(
	input: ReservationStateInput,
): ReservationStateResult {
	const { reservations, restaurant, now } = input;
	const config = input.config ?? DEFAULT_LIFECYCLE_CONFIG;

	const lifecycle = nextStates({
		now,
		reservations,
		autoConfirm: () => restaurant.autoConfirmEnabled,
		config,
	});

	const alerts: ReservationAlert[] = lifecycle.reminders.map(
		(reservationId) => ({ kind: "reminder", reservationId }),
	);

	const availability = createAvailability(lifecycle.reservations, restaurant);
	const nowMs = now.getTime();
	const upcomingSlots = new Set(
		lifecycle.reservations
			.filter(
				(r) =>
					r.startTime.getTime() >= nowMs &&
					(r.status === "pending" || r.status === "confirmed"),
			)
			.map((r) => r.startTime.getTime()),
	);

	for (const slotMs of upcomingSlots) {
		const startTime = new Date(slotMs);
		const { remaining, isLow } = availability.slotState(startTime);
		if (isLow) {
			alerts.push({ kind: "lowTables", slotMs, startTime, remaining });
		}
	}

	return {
		nextReservations: lifecycle.reservations,
		transitions: lifecycle.transitions,
		alerts,
	};
}
