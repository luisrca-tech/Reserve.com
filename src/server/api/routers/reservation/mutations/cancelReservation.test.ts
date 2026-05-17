import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { cancelReservation } from "./cancelReservation";

const ID = "11111111-1111-1111-1111-111111111111";
const UID = "user-1";

function reservationRow(over: Record<string, unknown> = {}) {
	return {
		id: ID,
		userId: UID,
		restaurantId: "22222222-2222-2222-2222-222222222222",
		status: "confirmed",
		cancelledAt: null,
		...over,
	};
}

function makeCtx(opts: {
	row?: unknown;
	session?: unknown;
	updated?: unknown;
}) {
	const findFirst = vi.fn(async () => opts.row);
	const returning = vi.fn(async () => [opts.updated ?? {}]);
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn(() => ({ where }));
	const update = vi.fn(() => ({ set }));
	return {
		ctx: {
			db: { query: { reservation: { findFirst } }, update },
			session:
				opts.session === undefined
					? { user: { id: UID, role: "client" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		update,
		set,
	};
}

const call = createCallerFactory(
	createTRPCRouter({ cancel: cancelReservation }),
);

describe("reservation.cancel", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ row: reservationRow(), session: null });
		await expect(call(ctx).cancel({ reservationId: ID })).rejects.toMatchObject(
			{ code: "UNAUTHORIZED" },
		);
	});

	it("rejects when the reservation does not exist", async () => {
		const { ctx } = makeCtx({ row: undefined });
		await expect(call(ctx).cancel({ reservationId: ID })).rejects.toMatchObject(
			{ code: "NOT_FOUND" },
		);
	});

	it("rejects cancelling another user's reservation", async () => {
		const { ctx } = makeCtx({
			row: reservationRow({ userId: "someone-else" }),
		});
		await expect(call(ctx).cancel({ reservationId: ID })).rejects.toMatchObject(
			{ code: "NOT_FOUND" },
		);
	});

	it("rejects an already-cancelled reservation", async () => {
		const { ctx } = makeCtx({ row: reservationRow({ status: "cancelled" }) });
		await expect(call(ctx).cancel({ reservationId: ID })).rejects.toMatchObject(
			{ code: "CONFLICT" },
		);
	});

	it("persists the cancellation for the owning user", async () => {
		const updated = { id: ID, status: "cancelled" };
		const { ctx, set } = makeCtx({ row: reservationRow(), updated });

		await expect(call(ctx).cancel({ reservationId: ID })).resolves.toEqual(
			updated,
		);

		const patch = (set.mock.calls[0] as unknown[])[0] as Record<
			string,
			unknown
		>;
		expect(patch.status).toBe("cancelled");
		expect(patch.cancelledAt).toBeInstanceOf(Date);
	});
});
