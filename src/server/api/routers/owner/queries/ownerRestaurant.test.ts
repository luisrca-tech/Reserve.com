import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { ownerRestaurant } from "./ownerRestaurant";

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
		autoConfirmEnabled: true,
		lowTableThreshold: 4,
		category: { id: "cat-1", name: "Italiana" },
		availability: [
			{ weekday: 5, hour: 20 },
			{ weekday: 5, hour: 19 },
		],
		images: [
			{
				assetId: "a2",
				sortOrder: 1,
				asset: { id: "a2", url: "https://img/2.jpg" },
			},
			{
				assetId: "a1",
				sortOrder: 0,
				asset: { id: "a1", url: "https://img/1.jpg" },
			},
		],
		menuAsset: { id: "m1", url: "https://img/menu.pdf", kind: "pdf" },
		...over,
	};
}

function makeCtx(opts: { row?: unknown; session?: unknown }) {
	const findFirst = vi.fn(async () => opts.row ?? null);
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
	createTRPCRouter({ restaurant: ownerRestaurant }),
);

describe("owner.restaurant", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ session: null });
		await expect(call(ctx).restaurant()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects a non-owner role", async () => {
		const { ctx } = makeCtx({
			session: { user: { id: "u9", role: "client" } },
		});
		await expect(call(ctx).restaurant()).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("returns the signed-in owner's restaurant as a finished view", async () => {
		const { ctx, findFirst } = makeCtx({ row: restaurantRow() });

		const result = await call(ctx).restaurant();

		expect(findFirst).toHaveBeenCalledTimes(1);
		expect(result).toMatchObject({
			id: RID,
			name: "Cantina Bella",
			description: "Massas artesanais",
			categoryName: "Italiana",
			tableCount: 12,
			autoConfirmEnabled: true,
			lowTableThreshold: 4,
			images: ["https://img/1.jpg", "https://img/2.jpg"],
			menuUrl: "https://img/menu.pdf",
			menuKind: "pdf",
			hoursByWeekday: { 5: [19, 20] },
		});
	});

	it("returns null when the owner has no restaurant", async () => {
		const { ctx } = makeCtx({ row: null });
		await expect(call(ctx).restaurant()).resolves.toBeNull();
	});
});
