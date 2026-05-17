import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { listRestaurants } from "./listRestaurants";

const SEED_DATE = new Date("2026-01-01T12:00:00.000Z");

function restaurantRow() {
	return {
		id: "rest_1",
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
		menuAssetId: null,
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
		category: { id: "cat_it", name: "Italiana", createdAt: SEED_DATE },
		availability: [
			{ id: "a1", restaurantId: "rest_1", weekday: 2, hour: 19 },
			{ id: "a2", restaurantId: "rest_1", weekday: 2, hour: 18 },
		],
		images: [
			{
				id: "img2",
				restaurantId: "rest_1",
				assetId: "as2",
				sortOrder: 1,
				asset: { id: "as2", url: "https://img/2.jpg" },
			},
			{
				id: "img1",
				restaurantId: "rest_1",
				assetId: "as1",
				sortOrder: 0,
				asset: { id: "as1", url: "https://img/1.jpg" },
			},
		],
	};
}

function makeCtx(rows: unknown[]) {
	const findMany = vi.fn(async () => rows);
	return {
		db: { query: { restaurant: { findMany } } },
		session: null,
		headers: new Headers(),
	} as never;
}

const call = createCallerFactory(createTRPCRouter({ list: listRestaurants }));

describe("restaurant.list", () => {
	it("returns server-mapped view models (ordered images, collapsed hours)", async () => {
		const caller = call(makeCtx([restaurantRow()]));

		const result = await caller.list();

		expect(result).toEqual([
			expect.objectContaining({
				id: "rest_1",
				name: "Cantina Bella",
				description: "Massas artesanais.",
				categoryId: "cat_it",
				categoryName: "Italiana",
				tags: ["Italiana"],
				tableCount: 14,
				images: ["https://img/1.jpg", "https://img/2.jpg"],
				menuUrl: null,
				hoursByWeekday: { 2: [18, 19] },
			}),
		]);
	});

	it("returns an empty array when there are no restaurants", async () => {
		const caller = call(makeCtx([]));
		await expect(caller.list()).resolves.toEqual([]);
	});
});
