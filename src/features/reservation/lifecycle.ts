import type { MockReservation, Reservation } from "./types";

/** Tunable lifecycle durations; overridable to short values for the demo. */
export interface LifecycleConfig {
	/** Pending → expired after this long with no validation. */
	expiryMs: number;
	/** Window before startTime in which a reminder should fire. */
	reminderMs: number;
}

export const DEFAULT_LIFECYCLE_CONFIG: LifecycleConfig = {
	expiryMs: 15 * 60 * 1000,
	reminderMs: 10 * 60 * 1000,
};

export interface LifecycleInput {
	now: Date;
	reservations: MockReservation[];
	/** Per-restaurant auto-confirm flag resolver. */
	autoConfirm: (restaurantId: string) => boolean;
	config?: LifecycleConfig;
}

export interface LifecycleTransition {
	id: string;
	from: Reservation["status"];
	to: Reservation["status"];
}

export interface LifecycleResult {
	/** Reservations with any due transitions applied (same order in). */
	reservations: MockReservation[];
	transitions: LifecycleTransition[];
	/** Ids currently inside the pre-start reminder window. */
	reminders: string[];
}

/**
 * Pure reservation lifecycle: given the current time and the reservation
 * set, derive the next states. Auto-confirm is applied before expiry so an
 * auto-confirming restaurant never expires a pending hold. Only `pending`
 * reservations transition; `confirmed`/`cancelled`/`expired`/`completed`
 * are terminal here. Reminders fire while `0 < startTime - now <= reminderMs`.
 */
export function nextStates(input: LifecycleInput): LifecycleResult {
	const { now, reservations, autoConfirm } = input;
	const config = input.config ?? DEFAULT_LIFECYCLE_CONFIG;
	const nowMs = now.getTime();

	const transitions: LifecycleTransition[] = [];
	const reminders: string[] = [];

	const next = reservations.map((r) => {
		let result = r;

		if (r.status === "pending") {
			if (autoConfirm(r.restaurantId)) {
				transitions.push({ id: r.id, from: "pending", to: "confirmed" });
				result = { ...r, status: "confirmed", validatedAt: now };
			} else if (nowMs - r.createdAt.getTime() >= config.expiryMs) {
				transitions.push({ id: r.id, from: "pending", to: "expired" });
				result = { ...r, status: "expired" };
			}
		}

		const untilStart = result.startTime.getTime() - nowMs;
		const remindable =
			result.status === "pending" || result.status === "confirmed";
		if (remindable && untilStart > 0 && untilStart <= config.reminderMs) {
			reminders.push(result.id);
		}

		return result;
	});

	return { reservations: next, transitions, reminders };
}
