import { describe, expect, it } from "vitest";
import type { AvailabilityContext } from "./Availability";
import { createAvailability } from "./Availability";
import type { CapacityReservation } from "./capacity";

const SLOT = "2026-06-02T18:00:00.000Z"; // Tuesday (UTC weekday 2)

function ctx(
	overrides: Partial<AvailabilityContext> = {},
): AvailabilityContext {
	return {
		restaurantId: "r1",
		tableCount: 10,
		autoConfirmEnabled: false,
		lowTableThreshold: 2,
		hoursByWeekday: { 2: [18, 19] },
		...overrides,
	};
}

function resv(
	startTime: string,
	tableCount: number,
	status: CapacityReservation["status"],
	restaurantId = "r1",
): CapacityReservation {
	return { restaurantId, startTime: new Date(startTime), tableCount, status };
}

describe("Availability.slotState — intent-level predicates", () => {
	it("reports used/remaining and isFull from active reservations only", () => {
		const a = createAvailability(
			[
				resv(SLOT, 3, "pending"),
				resv(SLOT, 2, "confirmed"),
				resv(SLOT, 5, "cancelled"),
				resv(SLOT, 7, "confirmed", "r2"),
			],
			ctx(),
		);
		const s = a.slotState(new Date(SLOT));
		expect(s.used).toBe(5);
		expect(s.remaining).toBe(5);
		expect(s.isFull).toBe(false);
	});

	it("isFull is true once active usage reaches tableCount", () => {
		const a = createAvailability([resv(SLOT, 10, "confirmed")], ctx());
		const s = a.slotState(new Date(SLOT));
		expect(s.isFull).toBe(true);
		expect(s.remaining).toBe(0);
	});

	it("canBook is true only for a count within remaining and >= 1", () => {
		const a = createAvailability([resv(SLOT, 8, "confirmed")], ctx());
		const s = a.slotState(new Date(SLOT)); // remaining = 2
		expect(s.canBook(0)).toBe(false);
		expect(s.canBook(2)).toBe(true);
		expect(s.canBook(3)).toBe(false);
	});

	it("isLow reflects the low-tables threshold", () => {
		const a = createAvailability([resv(SLOT, 8, "confirmed")], ctx());
		expect(a.slotState(new Date(SLOT)).isLow).toBe(true); // remaining 2 <= 2
		const b = createAvailability([resv(SLOT, 5, "confirmed")], ctx());
		expect(b.slotState(new Date(SLOT)).isLow).toBe(false); // remaining 5 > 2
	});

	it("canAutoConfirm requires the flag enabled and free capacity", () => {
		const off = createAvailability([], ctx({ autoConfirmEnabled: false }));
		expect(off.slotState(new Date(SLOT)).canAutoConfirm).toBe(false);

		const on = createAvailability([], ctx({ autoConfirmEnabled: true }));
		expect(on.slotState(new Date(SLOT)).canAutoConfirm).toBe(true);

		const onFull = createAvailability(
			[resv(SLOT, 10, "confirmed")],
			ctx({ autoConfirmEnabled: true }),
		);
		expect(onFull.slotState(new Date(SLOT)).canAutoConfirm).toBe(false);
	});
});

describe("Availability.dayReport — day/usage report", () => {
	it("lists open hours for the date and a slot state per hour", () => {
		const a = createAvailability(
			[
				resv(SLOT, 4, "confirmed"),
				resv("2026-06-02T19:00:00.000Z", 10, "confirmed"),
			],
			ctx(),
		);
		const report = a.dayReport(new Date("2026-06-02T00:00:00.000Z"));
		expect(report.openHours).toEqual([18, 19]);
		expect(report.slots.map((s) => s.startTime.getUTCHours())).toEqual([
			18, 19,
		]);
		expect(report.slots[0]?.used).toBe(4);
		expect(report.slots[0]?.isFull).toBe(false);
		expect(report.slots[1]?.isFull).toBe(true);
	});

	it("returns no slots for a closed weekday", () => {
		const a = createAvailability([], ctx());
		const sunday = new Date("2026-06-07T00:00:00.000Z");
		const report = a.dayReport(sunday);
		expect(report.openHours).toEqual([]);
		expect(report.slots).toEqual([]);
	});
});

describe("Availability — single shared source", () => {
	it("client booking view and owner report agree on the same slot", () => {
		const reservations = [resv(SLOT, 8, "confirmed")];
		const a = createAvailability(reservations, ctx());

		const bookingView = a.slotState(new Date(SLOT));
		const ownerSlot = a
			.dayReport(new Date("2026-06-02T00:00:00.000Z"))
			.slots.find((s) => s.startTime.getUTCHours() === 18);

		expect(ownerSlot).toBeDefined();
		expect(ownerSlot?.remaining).toBe(bookingView.remaining);
		expect(ownerSlot?.isFull).toBe(bookingView.isFull);
	});
});
