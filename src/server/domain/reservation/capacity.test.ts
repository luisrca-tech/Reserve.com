import { describe, expect, it } from "vitest";
import type { CapacityReservation } from "./capacity";
import {
	availableHoursForDate,
	isSlotFull,
	openHoursForWeekday,
	remainingTables,
	slotUsage,
} from "./capacity";

function avail(weekday: number, hour: number) {
	return { id: `a_${weekday}_${hour}`, restaurantId: "r1", weekday, hour };
}

function resv(
	startTime: string,
	tableCount: number,
	status: CapacityReservation["status"],
	restaurantId = "r1",
): CapacityReservation {
	return { restaurantId, startTime: new Date(startTime), tableCount, status };
}

describe("openHoursForWeekday — (weekday,hour) expansion", () => {
	it("returns sorted unique hours for the given weekday only", () => {
		const rows = [avail(2, 20), avail(2, 18), avail(2, 19), avail(3, 12)];
		expect(openHoursForWeekday(rows, 2)).toEqual([18, 19, 20]);
		expect(openHoursForWeekday(rows, 3)).toEqual([12]);
	});

	it("returns an empty array for a closed weekday", () => {
		const rows = [avail(2, 20)];
		expect(openHoursForWeekday(rows, 0)).toEqual([]);
	});
});

describe("availableHoursForDate", () => {
	it("derives the weekday from the date and returns its open hours", () => {
		// 2026-06-02 is a Tuesday (getDay() === 2).
		const rows = [avail(2, 18), avail(2, 19)];
		const date = new Date("2026-06-02T00:00:00.000Z");
		expect(date.getUTCDay()).toBe(2);
		expect(availableHoursForDate(rows, date)).toEqual([18, 19]);
	});

	it("returns no hours for a closed weekday (Sunday)", () => {
		const rows = [avail(2, 18)];
		const sunday = new Date("2026-06-07T00:00:00.000Z");
		expect(availableHoursForDate(rows, sunday)).toEqual([]);
	});
});

describe("slotUsage / remainingTables / isSlotFull — SUM rule", () => {
	const slot = "2026-06-02T18:00:00.000Z";

	it("sums tableCount only for active (pending + confirmed) reservations in that slot", () => {
		const reservations = [
			resv(slot, 3, "pending"),
			resv(slot, 2, "confirmed"),
			resv(slot, 5, "cancelled"),
			resv(slot, 4, "expired"),
			resv("2026-06-02T19:00:00.000Z", 9, "confirmed"),
			resv(slot, 7, "confirmed", "r2"),
		];
		expect(slotUsage(reservations, "r1", new Date(slot))).toBe(5);
	});

	it("cancellation frees capacity for that slot", () => {
		const before = [resv(slot, 6, "confirmed"), resv(slot, 4, "confirmed")];
		expect(slotUsage(before, "r1", new Date(slot))).toBe(10);
		const after = [resv(slot, 6, "cancelled"), resv(slot, 4, "confirmed")];
		expect(slotUsage(after, "r1", new Date(slot))).toBe(4);
	});

	it("remainingTables = tableCount - usage, floored at 0", () => {
		const reservations = [resv(slot, 8, "confirmed")];
		expect(remainingTables(reservations, "r1", new Date(slot), 14)).toBe(6);
		expect(remainingTables(reservations, "r1", new Date(slot), 5)).toBe(0);
	});

	it("isSlotFull is true once usage reaches tableCount", () => {
		const reservations = [resv(slot, 9, "confirmed"), resv(slot, 1, "pending")];
		expect(isSlotFull(reservations, "r1", new Date(slot), 10)).toBe(true);
		expect(isSlotFull(reservations, "r1", new Date(slot), 11)).toBe(false);
	});
});
