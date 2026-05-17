import { describe, expect, it } from "vitest";
import type { Reservation } from "~/server/db/schema/types";
import type { AvailabilityContext } from "./Availability";
import { DEFAULT_LIFECYCLE_CONFIG } from "./lifecycle";
import { reservationState } from "./reservationState";

const T0 = new Date("2026-06-02T18:00:00.000Z").getTime();
const { expiryMs, reminderMs } = DEFAULT_LIFECYCLE_CONFIG;

function resv(over: Partial<Reservation> & { id: string }): Reservation {
	const startTime = over.startTime ?? new Date(T0 + 6 * 60 * 60 * 1000);
	return {
		userId: "u1",
		restaurantId: "r1",
		startTime,
		endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
		status: "pending",
		validatedAt: null,
		cancelledAt: null,
		createdAt: new Date(T0),
		partySize: 2,
		tableCount: 1,
		...over,
	};
}

function context(over: Partial<AvailabilityContext> = {}): AvailabilityContext {
	return {
		restaurantId: "r1",
		tableCount: 10,
		autoConfirmEnabled: false,
		lowTableThreshold: 2,
		hoursByWeekday: {},
		...over,
	};
}

describe("reservationState — expiry", () => {
	it("expires a pending reservation once the 15-minute window passes", () => {
		const r = resv({ id: "p1" });
		const { nextReservations, transitions } = reservationState({
			reservations: [r],
			restaurant: context(),
			now: new Date(T0 + expiryMs),
		});
		expect(nextReservations[0]?.status).toBe("expired");
		expect(transitions).toEqual([{ id: "p1", from: "pending", to: "expired" }]);
	});

	it("keeps the reservation pending before the window elapses", () => {
		const r = resv({ id: "p1" });
		const { nextReservations, transitions } = reservationState({
			reservations: [r],
			restaurant: context(),
			now: new Date(T0 + expiryMs - 1),
		});
		expect(nextReservations[0]?.status).toBe("pending");
		expect(transitions).toEqual([]);
	});
});

describe("reservationState — auto-confirm", () => {
	it("auto-confirms a pending reservation when the restaurant has auto-confirm on", () => {
		const r = resv({ id: "p1" });
		const now = new Date(T0 + 60 * 1000);
		const { nextReservations, transitions } = reservationState({
			reservations: [r],
			restaurant: context({ autoConfirmEnabled: true }),
			now,
		});
		expect(nextReservations[0]?.status).toBe("confirmed");
		expect(nextReservations[0]?.validatedAt?.getTime()).toBe(now.getTime());
		expect(transitions).toEqual([
			{ id: "p1", from: "pending", to: "confirmed" },
		]);
	});

	it("auto-confirm takes precedence over expiry", () => {
		const r = resv({ id: "p1" });
		const { nextReservations } = reservationState({
			reservations: [r],
			restaurant: context({ autoConfirmEnabled: true }),
			now: new Date(T0 + expiryMs * 3),
		});
		expect(nextReservations[0]?.status).toBe("confirmed");
	});
});

describe("reservationState — reminders", () => {
	const start = new Date(T0 + 6 * 60 * 60 * 1000);

	it("emits a reminder alert at the reminder window boundary", () => {
		const r = resv({ id: "c1", status: "confirmed", startTime: start });
		const { alerts } = reservationState({
			reservations: [r],
			restaurant: context(),
			now: new Date(start.getTime() - reminderMs),
		});
		expect(alerts).toContainEqual({ kind: "reminder", reservationId: "c1" });
	});

	it("does not emit a reminder before the window opens", () => {
		const r = resv({ id: "c1", status: "confirmed", startTime: start });
		const { alerts } = reservationState({
			reservations: [r],
			restaurant: context(),
			now: new Date(start.getTime() - reminderMs - 1),
		});
		expect(alerts.filter((a) => a.kind === "reminder")).toEqual([]);
	});
});

describe("reservationState — low-tables threshold", () => {
	it("emits a low-tables alert when an upcoming slot is at/below the threshold", () => {
		const slot = new Date(T0 + 6 * 60 * 60 * 1000);
		const now = new Date(T0);
		// tableCount 10, threshold 2 → remaining must be <= 2 to be low.
		const busy = resv({
			id: "busy",
			status: "confirmed",
			startTime: slot,
			tableCount: 9,
		});
		const { alerts } = reservationState({
			reservations: [busy],
			restaurant: context({ tableCount: 10, lowTableThreshold: 2 }),
			now,
		});
		expect(alerts).toContainEqual({
			kind: "lowTables",
			slotMs: slot.getTime(),
			startTime: slot,
			remaining: 1,
		});
	});

	it("does not emit a low-tables alert when the slot has comfortable capacity", () => {
		const slot = new Date(T0 + 6 * 60 * 60 * 1000);
		const ok = resv({
			id: "ok",
			status: "confirmed",
			startTime: slot,
			tableCount: 2,
		});
		const { alerts } = reservationState({
			reservations: [ok],
			restaurant: context({ tableCount: 10, lowTableThreshold: 2 }),
			now: new Date(T0),
		});
		expect(alerts.filter((a) => a.kind === "lowTables")).toEqual([]);
	});

	it("ignores past slots for low-tables alerts", () => {
		const pastSlot = new Date(T0 - 60 * 60 * 1000);
		const busy = resv({
			id: "busy",
			status: "confirmed",
			startTime: pastSlot,
			tableCount: 10,
		});
		const { alerts } = reservationState({
			reservations: [busy],
			restaurant: context({ tableCount: 10, lowTableThreshold: 2 }),
			now: new Date(T0),
		});
		expect(alerts.filter((a) => a.kind === "lowTables")).toEqual([]);
	});
});

describe("reservationState — purity", () => {
	it("is deterministic for fixed inputs", () => {
		const r = resv({ id: "p1" });
		const args = {
			reservations: [r],
			restaurant: context({ autoConfirmEnabled: true }),
			now: new Date(T0 + 60 * 1000),
		};
		const a = reservationState(args);
		const b = reservationState(args);
		expect(a).toEqual(b);
	});

	it("does not mutate the input reservations array", () => {
		const r = resv({ id: "p1" });
		const input = [r];
		reservationState({
			reservations: input,
			restaurant: context({ autoConfirmEnabled: true }),
			now: new Date(T0 + 60 * 1000),
		});
		expect(input[0]?.status).toBe("pending");
	});
});
