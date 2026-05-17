import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { listReservations } from "./listReservations";

const RID_A = "11111111-1111-1111-1111-111111111111";
const RID_B = "22222222-2222-2222-2222-222222222222";
const UID = "user-1";

/** Far in the past so a non-auto-confirm pending hold is read as expired. */
const STALE = new Date("2020-01-01T12:00:00.000Z");

function reservationRow(over: Record<string, unknown> = {}) {
	const startTime = new Date("2030-06-04T19:00:00.000Z");
	return {
		id: "resv-1",
		userId: UID,
		restaurantId: RID_A,
		startTime,
		endTime: new Date(startTime.getTime() + 3_600_000),
		status: "confirmed",
		validatedAt: startTime,
		cancelledAt: null,
		createdAt: STALE,
		partySize: 4,
		tableCount: 2,
		restaurant: {
			id: RID_A,
			name: "Cantina Bella",
			autoConfirmEnabled: false,
			images: [
				{ sortOrder: 1, asset: { url: "https://img/b.jpg" } },
				{ sortOrder: 0, asset: { url: "https://img/a.jpg" } },
			],
		},
		...over,
	};
}

function makeCtx(opts: { rows?: unknown[]; session?: unknown }) {
	const findMany = vi.fn(async () => opts.rows ?? []);
	return {
		ctx: {
			db: { query: { reservation: { findMany } } },
			session:
				opts.session === undefined
					? { user: { id: UID, role: "client" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		findMany,
	};
}

const call = createCallerFactory(createTRPCRouter({ list: listReservations }));

describe("reservation.list", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ rows: [], session: null });
		await expect(call(ctx).list()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("returns the caller's reservations as finished view models", async () => {
		const { ctx, findMany } = makeCtx({ rows: [reservationRow()] });

		const result = await call(ctx).list();

		expect(findMany).toHaveBeenCalledTimes(1);
		expect(result).toEqual([
			{
				id: "resv-1",
				restaurantId: RID_A,
				restaurantName: "Cantina Bella",
				restaurantImage: "https://img/a.jpg",
				startTime: new Date("2030-06-04T19:00:00.000Z"),
				endTime: new Date("2030-06-04T20:00:00.000Z"),
				status: "confirmed",
				partySize: 4,
				tableCount: 2,
			},
		]);
	});

	it("derives expiry on read for a stale non-auto-confirm pending hold", async () => {
		const { ctx } = makeCtx({
			rows: [reservationRow({ status: "pending", validatedAt: null })],
		});

		const [view] = await call(ctx).list();

		expect(view?.status).toBe("expired");
	});

	it("promotes a stale pending hold when the restaurant auto-confirms", async () => {
		const { ctx } = makeCtx({
			rows: [
				reservationRow({
					status: "pending",
					validatedAt: null,
					restaurant: {
						id: RID_A,
						name: "Cantina Bella",
						autoConfirmEnabled: true,
						images: [],
					},
				}),
			],
		});

		const [view] = await call(ctx).list();

		expect(view?.status).toBe("confirmed");
	});

	it("sorts newest first across windows", async () => {
		const { ctx } = makeCtx({
			rows: [
				reservationRow({
					id: "old",
					restaurantId: RID_B,
					startTime: new Date("2026-01-10T19:00:00.000Z"),
					endTime: new Date("2026-01-10T20:00:00.000Z"),
					restaurant: {
						id: RID_B,
						name: "Sushi Kai",
						autoConfirmEnabled: false,
						images: [],
					},
				}),
				reservationRow({ id: "new" }),
			],
		});

		const result = await call(ctx).list();

		expect(result.map((r) => r.id)).toEqual(["new", "old"]);
	});
});
