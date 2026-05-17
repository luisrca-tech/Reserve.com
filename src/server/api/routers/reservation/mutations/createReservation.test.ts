import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { createReservation } from "./createReservation";

const RID = "11111111-1111-1111-1111-111111111111";
const UID = "user-1";
/** A Tuesday (UTC weekday 2) at 19:00 — matches the open-hours fixture. */
const SLOT = new Date("2030-06-04T19:00:00.000Z");

function restaurantRow(over: Record<string, unknown> = {}) {
	return {
		id: RID,
		tableCount: 10,
		autoConfirmEnabled: false,
		lowTableThreshold: 2,
		availability: [{ weekday: 2, hour: 19 }],
		reservations: [],
		...over,
	};
}

function makeCtx(opts: {
	row?: unknown;
	session?: unknown;
	inserted?: unknown;
}) {
	const findFirst = vi.fn(async () => opts.row);
	const returning = vi.fn(async () => [opts.inserted ?? {}]);
	const values = vi.fn(() => ({ returning }));
	const insert = vi.fn(() => ({ values }));
	return {
		ctx: {
			db: { query: { restaurant: { findFirst } }, insert },
			session:
				opts.session === undefined
					? { user: { id: UID, role: "client" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		insert,
		values,
	};
}

const call = createCallerFactory(
	createTRPCRouter({ create: createReservation }),
);

const validInput = {
	restaurantId: RID,
	startTime: SLOT,
	partySize: 2,
	tableCount: 1,
};

describe("reservation.create", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ row: restaurantRow(), session: null });
		const caller = call(ctx);
		await expect(caller.create(validInput)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects when the restaurant does not exist", async () => {
		const { ctx } = makeCtx({ row: undefined });
		const caller = call(ctx);
		await expect(caller.create(validInput)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("rejects a slot outside the restaurant's open hours", async () => {
		const { ctx } = makeCtx({ row: restaurantRow() });
		const caller = call(ctx);
		await expect(
			caller.create({
				...validInput,
				startTime: new Date("2030-06-04T22:00:00.000Z"),
			}),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	it("rejects a booking that exceeds slot capacity", async () => {
		const { ctx } = makeCtx({
			row: restaurantRow({
				tableCount: 2,
				reservations: [
					{
						id: "held",
						restaurantId: RID,
						startTime: SLOT,
						tableCount: 2,
						status: "confirmed",
						createdAt: SLOT,
					},
				],
			}),
		});
		const caller = call(ctx);
		await expect(
			caller.create({ ...validInput, tableCount: 1 }),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	it("creates a pending reservation when the restaurant does not auto-confirm", async () => {
		const inserted = { id: "new-1", status: "pending" };
		const { ctx, values } = makeCtx({ row: restaurantRow(), inserted });
		const caller = call(ctx);

		await expect(caller.create(validInput)).resolves.toEqual(inserted);

		const row = (values.mock.calls[0] as unknown[])[0] as Record<
			string,
			unknown
		>;
		expect(row.status).toBe("pending");
		expect(row.validatedAt).toBeNull();
		expect(row.userId).toBe(UID);
		expect(row.endTime).toEqual(new Date("2030-06-04T20:00:00.000Z"));
	});

	it("persists an auto-confirmed reservation when the flag is on and capacity is free", async () => {
		const inserted = { id: "new-2", status: "confirmed" };
		const { ctx, values } = makeCtx({
			row: restaurantRow({ autoConfirmEnabled: true }),
			inserted,
		});
		const caller = call(ctx);

		await caller.create(validInput);

		const row = (values.mock.calls[0] as unknown[])[0] as Record<
			string,
			unknown
		>;
		expect(row.status).toBe("confirmed");
		expect(row.validatedAt).toBeInstanceOf(Date);
	});

	it("does not auto-confirm when the flag is on but the slot is full", async () => {
		const { ctx } = makeCtx({
			row: restaurantRow({
				autoConfirmEnabled: true,
				tableCount: 1,
				reservations: [
					{
						id: "held",
						restaurantId: RID,
						startTime: SLOT,
						tableCount: 1,
						status: "confirmed",
						createdAt: SLOT,
					},
				],
			}),
		});
		const caller = call(ctx);
		await expect(caller.create(validInput)).rejects.toBeInstanceOf(TRPCError);
	});
});
