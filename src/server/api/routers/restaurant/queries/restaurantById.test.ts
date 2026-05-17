import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { restaurantById } from "./restaurantById";

const SEED_DATE = new Date("2026-01-01T12:00:00.000Z");

function restaurantRow() {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		ownerId: "owner_1",
		name: "Cantina Bella",
		corporateEmail: "contato@cantinabella.com",
		address: "Rua das Flores, 123",
		bio: "Massas artesanais.",
		phone: "(11) 3000-1000",
		categoryId: "cat_it",
		tableCount: 14,
		autoConfirmEnabled: false,
		lowTableThreshold: 5,
		menuAssetId: "menu_1",
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
		category: { id: "cat_it", name: "Italiana", createdAt: SEED_DATE },
		availability: [
			{ id: "a1", restaurantId: "rest_1", weekday: 2, hour: 19 },
			{ id: "a2", restaurantId: "rest_1", weekday: 2, hour: 18 },
		],
		images: [
			{
				id: "img1",
				restaurantId: "rest_1",
				assetId: "as1",
				sortOrder: 0,
				asset: { id: "as1", url: "https://img/1.jpg" },
			},
		],
		menuAsset: { id: "menu_1", url: "https://menu/m.pdf", kind: "pdf" },
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

const call = createCallerFactory(createTRPCRouter({ byId: restaurantById }));
const RID = "11111111-1111-1111-1111-111111111111";

describe("restaurant.byId", () => {
	it("returns a finished detail view model with the real menu asset", async () => {
		const caller = call(makeCtx(restaurantRow()));

		const result = await caller.byId({ restaurantId: RID });

		expect(result).toEqual(
			expect.objectContaining({
				id: RID,
				name: "Cantina Bella",
				address: "Rua das Flores, 123",
				phone: "(11) 3000-1000",
				corporateEmail: "contato@cantinabella.com",
				images: ["https://img/1.jpg"],
				menuUrl: "https://menu/m.pdf",
				menuKind: "pdf",
				hoursByWeekday: { 2: [18, 19] },
			}),
		);
	});

	it("returns null when the restaurant does not exist", async () => {
		const caller = call(makeCtx(undefined));
		await expect(caller.byId({ restaurantId: RID })).resolves.toBeNull();
	});
});
