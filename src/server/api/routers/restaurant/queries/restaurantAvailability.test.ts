import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { restaurantAvailability } from "./restaurantAvailability";

const RID = "11111111-1111-1111-1111-111111111111";
const LONG_AGO = new Date("2020-01-01T00:00:00.000Z");
const FUTURE = new Date("2030-06-01T20:00:00.000Z");

function reservationRow(over: Record<string, unknown>) {
	return {
		id: "r1",
		userId: "u1",
		restaurantId: RID,
		startTime: FUTURE,
		endTime: FUTURE,
		partySize: 2,
		tableCount: 1,
		status: "pending",
		validatedAt: null,
		cancelledAt: null,
		createdAt: LONG_AGO,
		...over,
	};
}

function makeCtx(row: unknown) {
	const findFirst = vi.fn(async () => row);
	return {
		db: { query: { restaurant: { findFirst } } },
		session: null,
		headers: new Headers(),
	} as never;
}

const call = createCallerFactory(
	createTRPCRouter({ availability: restaurantAvailability }),
);

describe("restaurant.availability", () => {
	it("returns the capacity context collapsed from availability rows", async () => {
		const caller = call(
			makeCtx({
				id: RID,
				tableCount: 14,
				autoConfirmEnabled: false,
				lowTableThreshold: 5,
				availability: [
					{ weekday: 2, hour: 19 },
					{ weekday: 2, hour: 18 },
				],
				reservations: [],
			}),
		);

		const result = await caller.availability({ restaurantId: RID });

		expect(result.context).toEqual({
			restaurantId: RID,
			tableCount: 14,
			autoConfirmEnabled: false,
			lowTableThreshold: 5,
			hoursByWeekday: { 2: [18, 19] },
		});
		expect(result.reservations).toEqual([]);
	});

	it("derives expiry on read: a stale pending hold is dropped from capacity", async () => {
		const caller = call(
			makeCtx({
				id: RID,
				tableCount: 14,
				autoConfirmEnabled: false,
				lowTableThreshold: 5,
				availability: [],
				reservations: [
					reservationRow({ id: "stale", status: "pending" }),
					reservationRow({ id: "kept", status: "confirmed" }),
				],
			}),
		);

		const result = await caller.availability({ restaurantId: RID });

		expect(result.reservations.map((r) => r.status)).toEqual(["confirmed"]);
		expect(result.reservations[0]).toEqual({
			restaurantId: RID,
			startTime: FUTURE,
			tableCount: 1,
			status: "confirmed",
		});
	});

	it("auto-confirm keeps a fresh pending hold counted against capacity", async () => {
		const caller = call(
			makeCtx({
				id: RID,
				tableCount: 14,
				autoConfirmEnabled: true,
				lowTableThreshold: 5,
				availability: [],
				reservations: [
					reservationRow({
						id: "fresh",
						status: "pending",
						createdAt: new Date(),
					}),
				],
			}),
		);

		const result = await caller.availability({ restaurantId: RID });

		expect(result.reservations.map((r) => r.status)).toEqual(["confirmed"]);
	});

	it("returns an empty context when the restaurant does not exist", async () => {
		const caller = call(makeCtx(undefined));
		const result = await caller.availability({ restaurantId: RID });
		expect(result.reservations).toEqual([]);
		expect(result.context.tableCount).toBe(0);
	});
});
