import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { updateSettings } from "./updateSettings";

const OWNER_ID = "owner-1";
const RID = "11111111-1111-1111-1111-111111111111";

function restaurantRow(over: Record<string, unknown> = {}) {
	return {
		id: RID,
		ownerId: OWNER_ID,
		name: "Cantina Bella",
		bio: "Massas artesanais",
		address: "Rua A, 100",
		phone: "(11) 9 0000-0000",
		corporateEmail: "contato@bella.test",
		tableCount: 12,
		autoConfirmEnabled: false,
		lowTableThreshold: 5,
		category: { id: "cat-1", name: "Italiana" },
		availability: [{ weekday: 5, hour: 19 }],
		images: [
			{ assetId: "a1", sortOrder: 0, asset: { id: "a1", url: "https://i/1" } },
		],
		menuAsset: null,
		...over,
	};
}

const validInput = {
	name: "Cantina Nova",
	phone: "(11) 9 1111-1111",
	bio: "Cozinha do sul",
	autoConfirmEnabled: true,
	lowTableThreshold: 3,
	tableCount: 20,
	hoursByWeekday: { 5: [20, 19], 6: [12] },
};

function makeCtx(opts: { row?: unknown; session?: unknown }) {
	// Models the DB: the post-transaction re-read reflects the captured
	// `set(...)` payload and the inserted availability rows.
	const state = {
		setArg: {} as Record<string, unknown>,
		avail: undefined as { weekday: number; hour: number }[] | undefined,
	};
	const findFirst = vi.fn(async () => {
		if (opts.row !== undefined) return opts.row;
		const base = restaurantRow();
		return {
			...base,
			...state.setArg,
			availability: state.avail ?? base.availability,
		};
	});
	const setWhere = vi.fn(async () => undefined);
	const set = vi.fn((arg: Record<string, unknown>) => {
		state.setArg = arg;
		return { where: setWhere };
	});
	const update = vi.fn(() => ({ set }));
	const delWhere = vi.fn(async () => undefined);
	const del = vi.fn(() => ({ where: delWhere }));
	const values = vi.fn(async (rows: { weekday: number; hour: number }[]) => {
		state.avail = rows;
	});
	const insert = vi.fn(() => ({ values }));
	const tx = { update, delete: del, insert };
	const transaction = vi.fn(async (cb: (t: typeof tx) => Promise<void>) => {
		state.avail = [];
		await cb(tx);
	});
	return {
		ctx: {
			db: { query: { restaurant: { findFirst } }, transaction },
			session:
				opts.session === undefined
					? { user: { id: OWNER_ID, role: "restaurant_owner" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		findFirst,
		update,
		set,
		del,
		insert,
		values,
		transaction,
	};
}

const call = createCallerFactory(createTRPCRouter({ updateSettings }));

describe("owner.updateSettings", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ session: null });
		await expect(call(ctx).updateSettings(validInput)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects a non-owner role", async () => {
		const { ctx } = makeCtx({
			session: { user: { id: "u9", role: "client" } },
		});
		await expect(call(ctx).updateSettings(validInput)).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("rejects when the owner has no restaurant", async () => {
		const { ctx } = makeCtx({ row: null });
		await expect(call(ctx).updateSettings(validInput)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("rejects invalid input (table count below 1)", async () => {
		const { ctx } = makeCtx({});
		await expect(
			call(ctx).updateSettings({ ...validInput, tableCount: 0 }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("persists the mapped fields and replaces availability rows", async () => {
		const { ctx, set, del, insert, values } = makeCtx({});

		const result = await call(ctx).updateSettings(validInput);

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Cantina Nova",
				phone: "(11) 9 1111-1111",
				bio: "Cozinha do sul",
				autoConfirmEnabled: true,
				lowTableThreshold: 3,
				tableCount: 20,
			}),
		);
		expect(del).toHaveBeenCalledTimes(1);
		expect(insert).toHaveBeenCalledTimes(1);
		expect(values).toHaveBeenCalledWith(
			expect.arrayContaining([
				{ restaurantId: RID, weekday: 5, hour: 19 },
				{ restaurantId: RID, weekday: 5, hour: 20 },
				{ restaurantId: RID, weekday: 6, hour: 12 },
			]),
		);

		expect(result).toMatchObject({
			id: RID,
			name: "Cantina Nova",
			description: "Cozinha do sul",
			phone: "(11) 9 1111-1111",
			autoConfirmEnabled: true,
			lowTableThreshold: 3,
			tableCount: 20,
			categoryName: "Italiana",
			hoursByWeekday: { 5: [19, 20], 6: [12] },
		});
	});

	it("skips the availability insert when every day is closed", async () => {
		const { ctx, del, insert } = makeCtx({});

		await call(ctx).updateSettings({ ...validInput, hoursByWeekday: {} });

		expect(del).toHaveBeenCalledTimes(1);
		expect(insert).not.toHaveBeenCalled();
	});
});
