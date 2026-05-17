import { describe, expect, it } from "vitest";

import type { RestaurantView } from "~/features/restaurant/types";
import { ownerCopy } from "./copy";
import { deriveOwnerNotifications } from "./notifications";
import type { OwnerReservationView } from "./types";

const NOW = new Date("2026-06-02T18:00:00.000Z");

function restaurant(over: Partial<RestaurantView> = {}): RestaurantView {
	return {
		id: "r1",
		name: "Cantina",
		description: "",
		address: "",
		phone: "",
		corporateEmail: "",
		categoryId: "c1",
		categoryName: "Italiana",
		tags: [],
		tableCount: 4,
		autoConfirmEnabled: false,
		lowTableThreshold: 2,
		images: [],
		menuUrl: null,
		menuKind: null,
		// open every weekday 18h–22h
		hoursByWeekday: Object.fromEntries(
			Array.from({ length: 7 }, (_, d) => [d, [18, 19, 20, 21]]),
		),
		...over,
	};
}

function resv(over: Partial<OwnerReservationView> = {}): OwnerReservationView {
	return {
		id: "x1",
		restaurantId: "r1",
		userId: "u1",
		guestName: "Ana",
		guestPhone: "123",
		startTime: new Date("2026-06-02T19:00:00.000Z"),
		endTime: new Date("2026-06-02T20:00:00.000Z"),
		status: "confirmed",
		partySize: 2,
		tableCount: 1,
		...over,
	};
}

describe("deriveOwnerNotifications — reminders", () => {
	it("reminds about a confirmed reservation starting within the window", () => {
		const out = deriveOwnerNotifications(
			[
				resv({
					id: "a",
					guestName: "Ana",
					startTime: new Date("2026-06-02T19:00:00.000Z"),
				}),
			],
			restaurant(),
			NOW,
		);
		const reminder = out.find((n) => n.kind === "reminder");
		expect(reminder).toMatchObject({
			key: "reminder:a",
			tone: "info",
			message: ownerCopy.notifications.reminder("Ana", "19:00"),
		});
	});

	it("ignores reservations that already started or are far away", () => {
		const out = deriveOwnerNotifications(
			[
				resv({ id: "past", startTime: new Date("2026-06-02T17:00:00.000Z") }),
				resv({ id: "far", startTime: new Date("2026-06-03T19:00:00.000Z") }),
			],
			restaurant(),
			NOW,
		);
		expect(out.filter((n) => n.kind === "reminder")).toHaveLength(0);
	});

	it("ignores non-confirmed reservations", () => {
		const out = deriveOwnerNotifications(
			[resv({ id: "p", status: "pending" })],
			restaurant(),
			NOW,
		);
		expect(out.filter((n) => n.kind === "reminder")).toHaveLength(0);
	});
});

describe("deriveOwnerNotifications — low capacity", () => {
	it("warns when an upcoming open slot is at/below the low-table threshold", () => {
		// tableCount 4, threshold 2; 3 tables used at 19:00 → 1 remaining (low).
		const reservations = [
			resv({ id: "r-a", tableCount: 2 }),
			resv({ id: "r-b", tableCount: 1 }),
		];
		const out = deriveOwnerNotifications(reservations, restaurant(), NOW);
		const low = out.find((n) => n.kind === "lowTables");
		expect(low).toMatchObject({
			tone: "warning",
			message: ownerCopy.notifications.lowTables("19:00", 1),
		});
	});

	it("does not warn for a full slot or a comfortably free slot", () => {
		// 4/4 used at 19:00 (full, remaining 0) → no low warning for 19:00.
		const reservations = [resv({ id: "full", tableCount: 4 })];
		const out = deriveOwnerNotifications(reservations, restaurant(), NOW);
		expect(
			out.some(
				(n) =>
					n.kind === "lowTables" &&
					n.message === ownerCopy.notifications.lowTables("19:00", 0),
			),
		).toBe(false);
		// 20:00 / 21:00 have 4 free (> threshold) → no warning either.
		expect(
			out.some(
				(n) =>
					n.kind === "lowTables" &&
					n.message === ownerCopy.notifications.lowTables("20:00", 4),
			),
		).toBe(false);
	});

	it("ignores slots already in the past", () => {
		const reservations = [
			resv({
				id: "early",
				tableCount: 3,
				startTime: new Date("2026-06-02T17:00:00.000Z"),
				endTime: new Date("2026-06-02T18:00:00.000Z"),
			}),
		];
		const out = deriveOwnerNotifications(reservations, restaurant(), NOW);
		expect(
			out.some((n) => n.kind === "lowTables" && n.message.includes("17:00")),
		).toBe(false);
	});
});

describe("deriveOwnerNotifications — ordering", () => {
	it("returns notifications ordered by event time ascending", () => {
		const reservations = [
			resv({
				id: "late",
				guestName: "Zé",
				startTime: new Date("2026-06-02T19:00:00.000Z"),
			}),
		];
		const out = deriveOwnerNotifications(reservations, restaurant(), NOW);
		const times = out.map((n) => n.at.getTime());
		expect(times).toEqual([...times].sort((a, b) => a - b));
	});
});
