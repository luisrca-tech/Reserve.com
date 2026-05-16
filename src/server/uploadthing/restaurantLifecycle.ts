import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { UTApi } from "uploadthing/server";
import type { SessionUser } from "~/server/auth/restaurantAccess";
import { canManageRestaurant } from "~/server/auth/restaurantAccess";
import type { db } from "~/server/db";
import { asset, restaurant, restaurantImage } from "~/server/db/schema";

import { isPublicUploadMode } from "./publicUploadMode";

type Db = typeof db;

export async function collectRestaurantUploadKeys(
	database: Db,
	restaurantId: string,
): Promise<string[]> {
	const images = await database.query.restaurantImage.findMany({
		where: eq(restaurantImage.restaurantId, restaurantId),
		with: { asset: { columns: { key: true } } },
	});

	const found = await database.query.restaurant.findFirst({
		where: eq(restaurant.id, restaurantId),
		columns: { menuAssetId: true },
	});

	const keys = images
		.map((image) => image.asset.key)
		.filter((key): key is string => Boolean(key));

	if (found?.menuAssetId) {
		const menuAsset = await database.query.asset.findFirst({
			where: eq(asset.id, found.menuAssetId),
			columns: { key: true },
		});
		if (menuAsset?.key) {
			keys.push(menuAsset.key);
		}
	}

	return keys;
}

export async function deleteRestaurantImageRecord(
	restaurantImageId: string,
	deps: {
		db: Db;
		utapi: Pick<UTApi, "deleteFiles">;
		user: SessionUser;
	},
) {
	const row = await deps.db.query.restaurantImage.findFirst({
		where: eq(restaurantImage.id, restaurantImageId),
		with: { asset: { columns: { id: true, key: true } } },
	});

	if (!row) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}

	if (!isPublicUploadMode()) {
		const allowed = await canManageRestaurant(
			deps.db,
			deps.user,
			row.restaurantId,
		);

		if (!allowed) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
	}

	if (row.asset.key) {
		await deps.utapi.deleteFiles(row.asset.key);
	}

	await deps.db.transaction(async (tx) => {
		await tx
			.delete(restaurantImage)
			.where(eq(restaurantImage.id, restaurantImageId));
		await tx.delete(asset).where(eq(asset.id, row.assetId));
	});

	return { success: true as const };
}

export async function deleteRestaurantUploadthingFiles(
	restaurantId: string,
	deps: { db: Db; utapi: Pick<UTApi, "deleteFiles"> },
) {
	const keys = await collectRestaurantUploadKeys(deps.db, restaurantId);

	if (keys.length === 0) {
		return;
	}

	try {
		await deps.utapi.deleteFiles(keys);
	} catch (error) {
		console.error(
			"Failed to delete UploadThing files for restaurant",
			restaurantId,
			error,
		);
	}
}
