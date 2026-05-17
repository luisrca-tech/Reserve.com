import { eq } from "drizzle-orm";
import type { UTApi } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";

import { canManageRestaurant } from "~/server/auth/restaurantAccess";
import type { auth } from "~/server/better-auth";
import type { db } from "~/server/db";
import { asset, restaurant } from "~/server/db/schema";

import {
	isPublicUploadMode,
	resolveDemoUploadUserId,
} from "./publicUploadMode";

export const ALLOWED_RESTAURANT_MENU_MIMES = new Set([
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
]);

type Auth = typeof auth;
type Db = typeof db;

/** PDF stays a `pdf` asset; every accepted image is an `image` asset. */
export function menuKindFor(mimeType: string): "image" | "pdf" {
	return mimeType === "application/pdf" ? "pdf" : "image";
}

export async function resolveRestaurantMenuUploadMetadata(opts: {
	headers: Headers;
	auth: Auth;
	restaurantId: string;
	db: Db;
}) {
	if (isPublicUploadMode()) {
		const exists = await opts.db.query.restaurant.findFirst({
			where: eq(restaurant.id, opts.restaurantId),
			columns: { id: true },
		});

		if (!exists) {
			throw new UploadThingError("Restaurant not found");
		}

		return {
			userId: await resolveDemoUploadUserId(opts.db),
			restaurantId: opts.restaurantId,
		};
	}

	const session = await opts.auth.api.getSession({ headers: opts.headers });

	if (!session?.user) {
		throw new UploadThingError("Unauthorized");
	}

	const allowed = await canManageRestaurant(
		opts.db,
		session.user,
		opts.restaurantId,
	);

	if (!allowed) {
		throw new UploadThingError("Forbidden");
	}

	return {
		userId: session.user.id,
		restaurantId: opts.restaurantId,
	};
}

/**
 * Persists the uploaded menu as an asset (kind derived from the mime so the
 * detail page renders PDF vs image), repoints `restaurant.menuAssetId`, and
 * removes the previous menu's UploadThing file + asset row so replacing the
 * menu later never orphans storage. Old file is deleted before the new asset
 * is written, mirroring the profile-image replacement ordering.
 */
export async function completeRestaurantMenuUpload(
	input: {
		userId: string;
		restaurantId: string;
		url: string;
		key: string;
		mimeType: string;
		sizeBytes: number;
	},
	deps: { db: Db; utapi: Pick<UTApi, "deleteFiles"> },
) {
	const { db, utapi } = deps;

	const current = await db.query.restaurant.findFirst({
		where: eq(restaurant.id, input.restaurantId),
		columns: { menuAssetId: true },
	});

	const previousAsset = current?.menuAssetId
		? await db.query.asset.findFirst({
				where: eq(asset.id, current.menuAssetId),
				columns: { id: true, key: true },
			})
		: undefined;

	if (previousAsset?.key) {
		await utapi.deleteFiles(previousAsset.key);
	}

	await db.transaction(async (tx) => {
		const [createdAsset] = await tx
			.insert(asset)
			.values({
				url: input.url,
				key: input.key,
				mimeType: input.mimeType,
				kind: menuKindFor(input.mimeType),
				sizeBytes: input.sizeBytes,
				uploadedById: input.userId,
			})
			.returning({ id: asset.id });

		if (!createdAsset) {
			throw new Error("Failed to create menu asset row");
		}

		await tx
			.update(restaurant)
			.set({ menuAssetId: createdAsset.id })
			.where(eq(restaurant.id, input.restaurantId));

		if (previousAsset) {
			await tx.delete(asset).where(eq(asset.id, previousAsset.id));
		}
	});
}
