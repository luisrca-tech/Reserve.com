import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import { deleteRestaurantImageRecord } from "./restaurantLifecycle";

vi.mock("./publicUploadMode", () => ({
	isPublicUploadMode: () => false,
}));

const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";
const IMAGE_ID = "22222222-2222-2222-2222-222222222222";

function makeDeps(opts: {
	user: { id: string; role: string };
	image?: {
		id: string;
		restaurantId: string;
		assetId: string;
		asset: { key: string | null };
	} | null;
	restaurantOwnerId?: string | null;
}) {
	const deleteFiles = vi.fn(async () => undefined);
	const transactionCalls: string[] = [];

	const tx = {
		delete: vi.fn(() => ({
			where: vi.fn(async () => {
				transactionCalls.push("delete-row");
			}),
		})),
	};

	return {
		deleteFiles,
		transactionCalls,
		deps: {
			db: {
				query: {
					restaurantImage: {
						findFirst: vi.fn(async () => opts.image ?? undefined),
					},
					restaurant: {
						findFirst: vi.fn(async () =>
							opts.restaurantOwnerId === undefined ||
							opts.restaurantOwnerId === null
								? undefined
								: { ownerId: opts.restaurantOwnerId },
						),
					},
				},
				transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => {
					transactionCalls.push("begin-tx");
					await fn(tx);
				}),
			} as never,
			utapi: { deleteFiles },
			user: opts.user,
		},
	};
}

describe("deleteRestaurantImageRecord", () => {
	it("rejects a non-owner non-admin", async () => {
		const { deps } = makeDeps({
			user: { id: "u1", role: "restaurant_owner" },
			image: {
				id: IMAGE_ID,
				restaurantId: RESTAURANT_ID,
				assetId: "asset-1",
				asset: { key: "ut-key" },
			},
			restaurantOwnerId: "someone-else",
		});

		await expect(
			deleteRestaurantImageRecord(IMAGE_ID, deps as never),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("deletes the UploadThing file then removes rows in a transaction", async () => {
		const { deps, deleteFiles, transactionCalls } = makeDeps({
			user: { id: "owner-1", role: "restaurant_owner" },
			image: {
				id: IMAGE_ID,
				restaurantId: RESTAURANT_ID,
				assetId: "asset-1",
				asset: { key: "ut-key" },
			},
			restaurantOwnerId: "owner-1",
		});

		await deleteRestaurantImageRecord(IMAGE_ID, deps as never);

		expect(deleteFiles).toHaveBeenCalledWith("ut-key");
		expect(transactionCalls.indexOf("begin-tx")).toBeLessThan(
			transactionCalls.lastIndexOf("delete-row"),
		);
	});

	it("allows an admin to delete any restaurant image", async () => {
		const { deps } = makeDeps({
			user: { id: "admin-1", role: "admin" },
			image: {
				id: IMAGE_ID,
				restaurantId: RESTAURANT_ID,
				assetId: "asset-1",
				asset: { key: "ut-key" },
			},
			restaurantOwnerId: "someone-else",
		});

		await expect(
			deleteRestaurantImageRecord(IMAGE_ID, deps as never),
		).resolves.toEqual({ success: true });
	});

	it("throws NOT_FOUND when the image row is missing", async () => {
		const { deps } = makeDeps({
			user: { id: "owner-1", role: "restaurant_owner" },
			image: null,
		});

		await expect(
			deleteRestaurantImageRecord(IMAGE_ID, deps as never),
		).rejects.toBeInstanceOf(TRPCError);
	});
});
