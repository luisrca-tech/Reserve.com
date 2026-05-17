import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { cancelReservation } from "./cancelReservation";

const ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "owner-1";

function reservationRow(over: Record<string, unknown> = {}) {
	return {
		id: ID,
		userId: "guest-1",
		restaurantId: "22222222-2222-2222-2222-222222222222",
		status: "confirmed",
		cancelledAt: null,
		restaurant: { ownerId: OWNER_ID },
		...over,
	};
}

function makeCtx(opts: {
	row?: unknown;
	session?: unknown;
	updated?: unknown;
}) {
	const findFirst = vi.fn(async () =>
		opts.row === undefined ? reservationRow() : opts.row,
	);
	const returning = vi.fn(async () => [opts.updated ?? {}]);
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn(() => ({ where }));
	const update = vi.fn(() => ({ set }));
	return {
		ctx: {
			db: { query: { reservation: { findFirst } }, update },
			session:
				opts.session === undefined
					? { user: { id: OWNER_ID, role: "restaurant_owner" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		set,
	};
}

const call = createCallerFactory(createTRPCRouter({ cancelReservation }));

describe("owner.cancelReservation", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ session: null });
		await expect(
			call(ctx).cancelReservation({ reservationId: ID }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("rejects a non-owner role", async () => {
		const { ctx } = makeCtx({
			session: { user: { id: "u9", role: "client" } },
		});
		await expect(
			call(ctx).cancelReservation({ reservationId: ID }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("rejects when the reservation does not exist", async () => {
		const { ctx } = makeCtx({ row: null });
		await expect(
			call(ctx).cancelReservation({ reservationId: ID }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("rejects a reservation that belongs to another owner's restaurant", async () => {
		const { ctx } = makeCtx({
			row: reservationRow({ restaurant: { ownerId: "someone-else" } }),
		});
		await expect(
			call(ctx).cancelReservation({ reservationId: ID }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("rejects an already-cancelled reservation", async () => {
		const { ctx } = makeCtx({
			row: reservationRow({ status: "cancelled" }),
		});
		await expect(
			call(ctx).cancelReservation({ reservationId: ID }),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	it("persists the cancellation for the owning restaurant", async () => {
		const updated = { id: ID, status: "cancelled" };
		const { ctx, set } = makeCtx({ row: reservationRow(), updated });

		await expect(
			call(ctx).cancelReservation({ reservationId: ID }),
		).resolves.toEqual(updated);

		const patch = (set.mock.calls[0] as unknown[])[0] as Record<
			string,
			unknown
		>;
		expect(patch.status).toBe("cancelled");
		expect(patch.cancelledAt).toBeInstanceOf(Date);
	});
});
