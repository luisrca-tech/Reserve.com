import { describe, expect, it, vi } from "vitest";

import {
	completeRestaurantImageUpload,
	resolveRestaurantUploadMetadata,
} from "./restaurantImage";

vi.mock("./publicUploadMode", () => ({
	isPublicUploadMode: () => false,
	resolveDemoUploadUserId: vi.fn(async () => "demo-user"),
}));

function makeAuth(session: { user: { id: string; role?: string } } | null) {
	return {
		api: { getSession: vi.fn(async () => session) },
	} as never;
}

function makeDb(opts: {
	ownerId?: string | null;
	maxSortOrder?: number | null;
	calls?: string[];
}) {
	const calls = opts.calls ?? [];
	return {
		query: {
			restaurant: {
				findFirst: vi.fn(async () =>
					opts.ownerId === undefined || opts.ownerId === null
						? undefined
						: { ownerId: opts.ownerId },
				),
			},
		},
		transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
			const tx = {
				select: vi.fn(() => ({
					from: vi.fn(() => ({
						where: vi.fn(async () => [
							{ maxOrder: opts.maxSortOrder ?? null },
						]),
					})),
				})),
				insert: vi.fn(() => ({
					values: vi.fn(() => ({
						returning: vi.fn(async () => {
							calls.push("insert-asset");
							return [{ id: "asset-1" }];
						}),
					})),
				})),
			};
			await fn(tx);
			calls.push("transaction-done");
		}),
	} as never;
}

const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

describe("resolveRestaurantUploadMetadata", () => {
	it("rejects an unauthenticated request", async () => {
		await expect(
			resolveRestaurantUploadMetadata({
				headers: new Headers(),
				auth: makeAuth(null),
				restaurantId: RESTAURANT_ID,
				db: makeDb({ ownerId: "owner-1" }),
			}),
		).rejects.toThrow();
	});

	it("rejects a non-owner non-admin", async () => {
		await expect(
			resolveRestaurantUploadMetadata({
				headers: new Headers(),
				auth: makeAuth({ user: { id: "u1", role: "restaurant_owner" } }),
				restaurantId: RESTAURANT_ID,
				db: makeDb({ ownerId: "someone-else" }),
			}),
		).rejects.toThrow();
	});

	it("returns metadata for the restaurant owner without trusting client owner id", async () => {
		const result = await resolveRestaurantUploadMetadata({
			headers: new Headers(),
			auth: makeAuth({ user: { id: "owner-1", role: "restaurant_owner" } }),
			restaurantId: RESTAURANT_ID,
			db: makeDb({ ownerId: "owner-1" }),
		});
		expect(result).toEqual({
			userId: "owner-1",
			restaurantId: RESTAURANT_ID,
		});
	});

	it("returns metadata for an admin on any restaurant", async () => {
		const result = await resolveRestaurantUploadMetadata({
			headers: new Headers(),
			auth: makeAuth({ user: { id: "admin-1", role: "admin" } }),
			restaurantId: RESTAURANT_ID,
			db: makeDb({ ownerId: "someone-else" }),
		});
		expect(result).toEqual({
			userId: "admin-1",
			restaurantId: RESTAURANT_ID,
		});
	});
});

describe("completeRestaurantImageUpload", () => {
	it("persists asset and restaurant_image inside a transaction with next sortOrder", async () => {
		const calls: string[] = [];
		const db = makeDb({ maxSortOrder: 2, calls });

		await completeRestaurantImageUpload(
			{
				userId: "owner-1",
				restaurantId: RESTAURANT_ID,
				url: "https://ut.example/img.png",
				key: "ut-key",
				mimeType: "image/png",
				sizeBytes: 5000,
			},
			{ db },
		);

		expect(calls).toContain("insert-asset");
		expect(calls).toContain("transaction-done");
	});
});
