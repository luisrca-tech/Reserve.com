import { describe, expect, it } from "vitest";
import type { Reservation } from "~/server/db/schema/types";
import {
	complete,
	DEFAULT_LIFECYCLE_CONFIG,
	nextStates,
	validate,
} from "./lifecycle";

const T0 = new Date("2026-06-02T18:00:00.000Z").getTime();

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

const noAutoConfirm = () => false;
const autoConfirm = () => true;
const { expiryMs, reminderMs } = DEFAULT_LIFECYCLE_CONFIG;

describe("nextStates — expiry vs validated", () => {
	it("expires a pending reservation once the expiry window passes (auto-confirm off)", () => {
		const r = resv({ id: "p1" });
		const now = new Date(T0 + expiryMs);
		const { reservations, transitions } = nextStates({
			now,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reservations[0]?.status).toBe("expired");
		expect(transitions).toEqual([{ id: "p1", from: "pending", to: "expired" }]);
	});

	it("does not expire a pending reservation before the window elapses", () => {
		const r = resv({ id: "p1" });
		const now = new Date(T0 + expiryMs - 1);
		const { reservations, transitions } = nextStates({
			now,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reservations[0]?.status).toBe("pending");
		expect(transitions).toEqual([]);
	});

	it("never expires an already-confirmed (validated) reservation", () => {
		const r = resv({
			id: "c1",
			status: "confirmed",
			validatedAt: new Date(T0),
		});
		const now = new Date(T0 + expiryMs * 10);
		const { reservations } = nextStates({
			now,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reservations[0]?.status).toBe("confirmed");
	});

	it("leaves cancelled and expired reservations untouched", () => {
		const c = resv({ id: "x1", status: "cancelled" });
		const e = resv({ id: "x2", status: "expired" });
		const now = new Date(T0 + expiryMs * 5);
		const { reservations, transitions } = nextStates({
			now,
			reservations: [c, e],
			autoConfirm: autoConfirm,
		});
		expect(reservations.map((r) => r.status)).toEqual(["cancelled", "expired"]);
		expect(transitions).toEqual([]);
	});
});

describe("nextStates — auto-confirm on/off", () => {
	it("auto-confirms a pending reservation when the restaurant has auto-confirm on", () => {
		const r = resv({ id: "p1" });
		const now = new Date(T0 + 60 * 1000);
		const { reservations, transitions } = nextStates({
			now,
			reservations: [r],
			autoConfirm: autoConfirm,
		});
		expect(reservations[0]?.status).toBe("confirmed");
		expect(reservations[0]?.validatedAt?.getTime()).toBe(now.getTime());
		expect(transitions).toEqual([
			{ id: "p1", from: "pending", to: "confirmed" },
		]);
	});

	it("auto-confirm takes precedence over expiry for an old pending reservation", () => {
		const r = resv({ id: "p1" });
		const now = new Date(T0 + expiryMs * 3);
		const { reservations } = nextStates({
			now,
			reservations: [r],
			autoConfirm: autoConfirm,
		});
		expect(reservations[0]?.status).toBe("confirmed");
	});

	it("keeps the reservation pending when auto-confirm is off and not yet expired", () => {
		const r = resv({ id: "p1" });
		const now = new Date(T0 + 60 * 1000);
		const { reservations } = nextStates({
			now,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reservations[0]?.status).toBe("pending");
	});
});

describe("nextStates — reminder boundary", () => {
	const start = new Date(T0 + 6 * 60 * 60 * 1000);

	it("fires a reminder exactly at the reminder window boundary", () => {
		const r = resv({ id: "c1", status: "confirmed", startTime: start });
		const now = new Date(start.getTime() - reminderMs);
		const { reminders } = nextStates({
			now,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reminders).toEqual(["c1"]);
	});

	it("does not fire before the reminder window opens", () => {
		const r = resv({ id: "c1", status: "confirmed", startTime: start });
		const now = new Date(start.getTime() - reminderMs - 1);
		const { reminders } = nextStates({
			now,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reminders).toEqual([]);
	});

	it("does not fire once the reservation start time has arrived", () => {
		const r = resv({ id: "c1", status: "confirmed", startTime: start });
		const { reminders } = nextStates({
			now: start,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reminders).toEqual([]);
	});

	it("does not remind cancelled reservations", () => {
		const r = resv({ id: "x1", status: "cancelled", startTime: start });
		const now = new Date(start.getTime() - reminderMs + 1);
		const { reminders } = nextStates({
			now,
			reservations: [r],
			autoConfirm: noAutoConfirm,
		});
		expect(reminders).toEqual([]);
	});
});

describe("validate — the single owner validate transition", () => {
	const now = new Date(T0 + 60 * 1000);

	it("moves a pending reservation to confirmed and stamps validatedAt", () => {
		const next = validate(resv({ id: "p1", status: "pending" }), now);
		expect(next.status).toBe("confirmed");
		expect(next.validatedAt?.getTime()).toBe(now.getTime());
	});

	it("leaves a cancelled reservation untouched (no forced confirm)", () => {
		const cancelled = resv({
			id: "x1",
			status: "cancelled",
			cancelledAt: new Date(T0),
		});
		expect(validate(cancelled, now)).toBe(cancelled);
	});

	it("is idempotent for an already-confirmed reservation", () => {
		const confirmed = resv({
			id: "c1",
			status: "confirmed",
			validatedAt: new Date(T0),
		});
		expect(validate(confirmed, now)).toBe(confirmed);
	});

	it("does not resurrect an expired reservation", () => {
		const expired = resv({ id: "e1", status: "expired" });
		expect(validate(expired, now)).toBe(expired);
	});
});

describe("complete — the single owner mark-honoured transition", () => {
	it("moves a confirmed reservation to completed", () => {
		const next = complete(
			resv({ id: "c1", status: "confirmed", validatedAt: new Date(T0) }),
		);
		expect(next.status).toBe("completed");
	});

	it("leaves a pending reservation untouched (must be confirmed first)", () => {
		const pending = resv({ id: "p1", status: "pending" });
		expect(complete(pending)).toBe(pending);
	});

	it("leaves a cancelled reservation untouched", () => {
		const cancelled = resv({
			id: "x1",
			status: "cancelled",
			cancelledAt: new Date(T0),
		});
		expect(complete(cancelled)).toBe(cancelled);
	});

	it("is idempotent for an already-completed reservation", () => {
		const completed = resv({ id: "d1", status: "completed" });
		expect(complete(completed)).toBe(completed);
	});
});
