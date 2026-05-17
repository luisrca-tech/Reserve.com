import { describe, expect, it, vi } from "vitest";

import {
	completeRestaurantMenuUpload,
	menuKindFor,
	resolveRestaurantMenuUploadMetadata,
} from "./restaurantMenu";

vi.mock("./publicUploadMode", () => ({
	isPublicUploadMode: () => false,
}));

const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

function makeAuth(session: { user: { id: string; role?: string } } | null) {
	return {
		api: { getSession: vi.fn(async () => session) },
	} as never;
}

/**
 * Drizzle-shaped mock that records the order of side effects so a test can
 * assert the previous menu UploadThing file is deleted before the new asset
 * is persisted and the restaurant's menu reference is repointed.
 */
function makeDb(opts: {
	ownerId?: string;
	previousMenuAssetId?: string | null;
	previousMenuKey?: string | null;
	calls: string[];
}) {
	const restaurantRow = {
		ownerId: opts.ownerId ?? "owner-1",
		menuAssetId: opts.previousMenuAssetId ?? null,
	};
	return {
		query: {
			restaurant: {
				findFirst: vi.fn(async () => restaurantRow),
			},
			asset: {
				findFirst: vi.fn(async () =>
					opts.previousMenuAssetId
						? {
								id: opts.previousMenuAssetId,
								key: opts.previousMenuKey ?? null,
							}
						: undefined,
				),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(async () => {
					opts.calls.push("insert-asset");
					return [{ id: "new-menu-asset" }];
				}),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn(async () => {
				opts.calls.push("delete-asset-row");
			}),
		})),
		update: vi.fn(() => ({
			set: vi.fn((patch: Record<string, unknown>) => ({
				where: vi.fn(async () => {
					opts.calls.push(`update-menu-ref:${String(patch.menuAssetId)}`);
				}),
			})),
		})),
		transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
			const self = makeDbTx(opts);
			return fn(self);
		}),
	} as never;
}

function makeDbTx(opts: {
	ownerId?: string;
	previousMenuAssetId?: string | null;
	previousMenuKey?: string | null;
	calls: string[];
}) {
	return {
		query: {
			asset: {
				findFirst: vi.fn(async () =>
					opts.previousMenuAssetId
						? {
								id: opts.previousMenuAssetId,
								key: opts.previousMenuKey ?? null,
							}
						: undefined,
				),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(async () => {
					opts.calls.push("insert-asset");
					return [{ id: "new-menu-asset" }];
				}),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn(async () => {
				opts.calls.push("delete-asset-row");
			}),
		})),
		update: vi.fn(() => ({
			set: vi.fn((patch: Record<string, unknown>) => ({
				where: vi.fn(async () => {
					opts.calls.push(`update-menu-ref:${String(patch.menuAssetId)}`);
				}),
			})),
		})),
	};
}

describe("menuKindFor", () => {
	it("maps application/pdf to pdf", () => {
		expect(menuKindFor("application/pdf")).toBe("pdf");
	});

	it("maps image mime types to image", () => {
		expect(menuKindFor("image/jpeg")).toBe("image");
		expect(menuKindFor("image/png")).toBe("image");
		expect(menuKindFor("image/webp")).toBe("image");
	});
});

describe("resolveRestaurantMenuUploadMetadata", () => {
	it("rejects an unauthenticated request", async () => {
		await expect(
			resolveRestaurantMenuUploadMetadata({
				headers: new Headers(),
				auth: makeAuth(null),
				restaurantId: RESTAURANT_ID,
				db: makeDb({ calls: [] }),
			}),
		).rejects.toThrow();
	});

	it("rejects an owner who does not own the restaurant", async () => {
		await expect(
			resolveRestaurantMenuUploadMetadata({
				headers: new Headers(),
				auth: makeAuth({ user: { id: "intruder" } }),
				restaurantId: RESTAURANT_ID,
				db: makeDb({ ownerId: "owner-1", calls: [] }),
			}),
		).rejects.toThrow();
	});

	it("derives ids from the session for the owning owner", async () => {
		const result = await resolveRestaurantMenuUploadMetadata({
			headers: new Headers(),
			auth: makeAuth({ user: { id: "owner-1" } }),
			restaurantId: RESTAURANT_ID,
			db: makeDb({ ownerId: "owner-1", calls: [] }),
		});
		expect(result).toEqual({
			userId: "owner-1",
			restaurantId: RESTAURANT_ID,
		});
	});
});

describe("completeRestaurantMenuUpload", () => {
	it("persists a pdf asset and repoints the restaurant menu reference", async () => {
		const calls: string[] = [];
		const deleteFiles = vi.fn(async () => undefined);
		const db = makeDb({ calls });

		await completeRestaurantMenuUpload(
			{
				userId: "owner-1",
				restaurantId: RESTAURANT_ID,
				url: "https://up.example/menu.pdf",
				key: "menu-key",
				mimeType: "application/pdf",
				sizeBytes: 4096,
			},
			{ db, utapi: { deleteFiles } as never },
		);

		expect(calls).toContain("insert-asset");
		expect(calls).toContain("update-menu-ref:new-menu-asset");
	});

	it("deletes the previous menu file and asset before persisting the new one", async () => {
		const calls: string[] = [];
		const deleteFiles = vi.fn(async () => {
			calls.push("delete-old-file");
		});
		const db = makeDb({
			previousMenuAssetId: "old-menu-asset",
			previousMenuKey: "old-menu-key",
			calls,
		});

		await completeRestaurantMenuUpload(
			{
				userId: "owner-1",
				restaurantId: RESTAURANT_ID,
				url: "https://up.example/new-menu.jpg",
				key: "new-menu-key",
				mimeType: "image/jpeg",
				sizeBytes: 2048,
			},
			{ db, utapi: { deleteFiles } as never },
		);

		expect(deleteFiles).toHaveBeenCalledWith("old-menu-key");
		expect(calls.indexOf("delete-old-file")).toBeLessThan(
			calls.indexOf("insert-asset"),
		);
		expect(calls).toContain("delete-asset-row");
		expect(calls).toContain("update-menu-ref:new-menu-asset");
	});

	it("inserts without deleting when there is no previous menu", async () => {
		const calls: string[] = [];
		const deleteFiles = vi.fn(async () => undefined);
		const db = makeDb({ calls });

		await completeRestaurantMenuUpload(
			{
				userId: "owner-1",
				restaurantId: RESTAURANT_ID,
				url: "https://up.example/menu.png",
				key: "menu-key",
				mimeType: "image/png",
				sizeBytes: 1024,
			},
			{ db, utapi: { deleteFiles } as never },
		);

		expect(deleteFiles).not.toHaveBeenCalled();
		expect(calls).toContain("insert-asset");
		expect(calls).toContain("update-menu-ref:new-menu-asset");
	});
});
