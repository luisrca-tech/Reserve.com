import type { AvailabilityContext } from "./Availability";
import { type LifecycleConfig, validate } from "./lifecycle";
import { mockReservations } from "./mock/reservations";
import {
	type ReservationStateResult,
	reservationState,
} from "./reservationState";
import type { Reservation } from "./types";

export interface NewReservationInput {
	userId: string;
	restaurantId: string;
	startTime: Date;
	partySize: number;
	tableCount: number;
	/** When the restaurant auto-confirms, the booking lands confirmed. */
	autoConfirm: boolean;
}

/** Client-role surface: a guest only ever touches their own reservations. */
export interface ClientReservationScope {
	list(): Reservation[];
	/**
	 * Restaurant-wide rows for capacity reads only (booking availability).
	 * A read, not a mutation — narrower than the pre-merge client store,
	 * which exposed every restaurant's reservations to the client.
	 */
	restaurantReservations(restaurantId: string): Reservation[];
	addReservation(input: NewReservationInput, now: Date): Reservation;
	cancelReservation(id: string, now: Date): void;
}

/** Owner-role surface: scoped to a single managed restaurant. */
export interface OwnerReservationScope {
	list(): Reservation[];
	validateReservation(id: string, now: Date): void;
	applyTick(
		restaurant: AvailabilityContext,
		now: Date,
		config?: LifecycleConfig,
	): ReservationStateResult;
}

export interface ReservationStore {
	getSnapshot(): Reservation[];
	subscribe(listener: () => void): () => void;
	/** Adds reservations whose id is not already present (idempotent). */
	seedOwner(reservations: Reservation[]): void;
	client(userId: string): ClientReservationScope;
	owner(restaurantId: string): OwnerReservationScope;
}

/**
 * Single role-scoped reservation set shared by client and owner views. Client
 * and owner read one coherent set, so a client-created reservation appears in
 * the owner's list without a reload. Role enforcement is structural: each
 * scope only exposes its own mutations and only operates on rows it owns.
 *
 * React-free so a future persistence/server-action adapter can implement the
 * same interface without re-touching callers.
 */
export function createReservationStore(
	seed: Reservation[] = mockReservations,
): ReservationStore {
	let reservations: Reservation[] = [...seed];
	const listeners = new Set<() => void>();
	let sequence = 0;

	function emit() {
		for (const listener of listeners) listener();
	}

	function setReservations(next: Reservation[]) {
		reservations = next;
		emit();
	}

	function client(userId: string): ClientReservationScope {
		return {
			list() {
				return reservations.filter((r) => r.userId === userId);
			},
			restaurantReservations(restaurantId) {
				return reservations.filter((r) => r.restaurantId === restaurantId);
			},
			addReservation(input, now) {
				sequence += 1;
				const reservation: Reservation = {
					id: `resv_new_${sequence}`,
					userId: input.userId,
					restaurantId: input.restaurantId,
					startTime: input.startTime,
					endTime: new Date(input.startTime.getTime() + 60 * 60 * 1000),
					status: input.autoConfirm ? "confirmed" : "pending",
					validatedAt: input.autoConfirm ? now : null,
					cancelledAt: null,
					createdAt: now,
					partySize: input.partySize,
					tableCount: input.tableCount,
				};
				setReservations([reservation, ...reservations]);
				return reservation;
			},
			cancelReservation(id, now) {
				setReservations(
					reservations.map((r) =>
						r.id === id && r.userId === userId && r.status !== "cancelled"
							? { ...r, status: "cancelled", cancelledAt: now }
							: r,
					),
				);
			},
		};
	}

	function owner(restaurantId: string): OwnerReservationScope {
		return {
			list() {
				// A client-cancelled reservation propagates here: cancelled rows
				// drop out of the owner's working list (they stay in the store
				// for capacity/audit, but the owner no longer acts on them).
				return reservations.filter(
					(r) => r.restaurantId === restaurantId && r.status !== "cancelled",
				);
			},
			validateReservation(id, now) {
				// Route through the single lifecycle transition — no direct
				// status mutation here. `validate` is the one definition of a
				// valid owner confirmation (pending → confirmed only).
				setReservations(
					reservations.map((r) =>
						r.id === id && r.restaurantId === restaurantId
							? validate(r, now)
							: r,
					),
				);
			},
			applyTick(restaurant, now, config) {
				const owned = reservations.filter(
					(r) => r.restaurantId === restaurantId,
				);
				const result = reservationState({
					reservations: owned,
					restaurant,
					now,
					config,
				});
				const byId = new Map(
					result.nextReservations.map((r) => [r.id, r] as const),
				);
				setReservations(reservations.map((r) => byId.get(r.id) ?? r));
				return result;
			},
		};
	}

	return {
		getSnapshot() {
			return reservations;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		seedOwner(incoming) {
			const known = new Set(reservations.map((r) => r.id));
			const fresh = incoming.filter((r) => !known.has(r.id));
			if (fresh.length === 0) return;
			setReservations([...reservations, ...fresh]);
		},
		client,
		owner,
	};
}
