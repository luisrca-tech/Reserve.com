import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { ownerReservations } from "./ownerReservations";

const OWNER_ID = "owner-1";
const RID = "11111111-1111-1111-1111-111111111111";

/** Far in the past so a non-auto-confirm pending hold reads as expired. */
const STALE = new Date("2020-01-01T12:00:00.000Z");

function reservationRow(over: Record<string, unknown> = {}) {
	const startTime = new Date("2030-06-04T19:00:00.000Z");
	return {
		id: "resv-1",
		userId: "guest-1",
		restaurantId: RID,
		startTime,
		endTime: new Date(startTime.getTime() + 3_600_000),
		status: "confirmed",
		validatedAt: startTime,
		cancelledAt: null,
		createdAt: STALE,
		partySize: 4,
		tableCount: 2,
		user: { name: "Helena Prado", phone: "(11) 9 7777-1212" },
		...over,
	};
}

function restaurantRow(over: Record<string, unknown> = {}) {
	return {
		id: RID,
		autoConfirmEnabled: false,
		reservations: [reservationRow()],
		...over,
	};
}

function makeCtx(opts: { row?: unknown; session?: unknown }) {
	const findFirst = vi.fn(async () =>
		opts.row === undefined ? restaurantRow() : opts.row,
	);
	return {
		ctx: {
			db: { query: { restaurant: { findFirst } } },
			session:
				opts.session === undefined
					? { user: { id: OWNER_ID, role: "restaurant_owner" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		findFirst,
	};
}

const call = createCallerFactory(
	createTRPCRouter({ reservations: ownerReservations }),
);

describe("owner.reservations", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ session: null });
		await expect(call(ctx).reservations()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects a non-owner role", async () => {
		const { ctx } = makeCtx({
			session: { user: { id: "u9", role: "client" } },
		});
		await expect(call(ctx).reservations()).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("returns the restaurant's reservations as finished owner views", async () => {
		const { ctx } = makeCtx({});

		const result = await call(ctx).reservations();

		expect(result).toEqual([
			{
				id: "resv-1",
				restaurantId: RID,
				userId: "guest-1",
				guestName: "Helena Prado",
				guestPhone: "(11) 9 7777-1212",
				startTime: new Date("2030-06-04T19:00:00.000Z"),
				endTime: new Date("2030-06-04T20:00:00.000Z"),
				status: "confirmed",
				partySize: 4,
				tableCount: 2,
			},
		]);
	});

	it("falls back to a dash when the guest has no phone", async () => {
		const { ctx } = makeCtx({
			row: restaurantRow({
				reservations: [
					reservationRow({ user: { name: "Sem Fone", phone: null } }),
				],
			}),
		});

		const [view] = await call(ctx).reservations();

		expect(view?.guestPhone).toBe("—");
	});

	it("derives expiry on read for a stale non-auto-confirm pending hold", async () => {
		const { ctx } = makeCtx({
			row: restaurantRow({
				reservations: [
					reservationRow({ status: "pending", validatedAt: null }),
				],
			}),
		});

		const [view] = await call(ctx).reservations();

		expect(view?.status).toBe("expired");
	});

	it("promotes a stale pending hold when the restaurant auto-confirms", async () => {
		const { ctx } = makeCtx({
			row: restaurantRow({
				autoConfirmEnabled: true,
				reservations: [
					reservationRow({ status: "pending", validatedAt: null }),
				],
			}),
		});

		const [view] = await call(ctx).reservations();

		expect(view?.status).toBe("confirmed");
	});

	it("returns an empty list when the owner has no restaurant", async () => {
		const { ctx } = makeCtx({ row: null });
		await expect(call(ctx).reservations()).resolves.toEqual([]);
	});
});
