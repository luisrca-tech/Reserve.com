import { eq, max } from "drizzle-orm";
import { UploadThingError } from "uploadthing/server";

import { canManageRestaurant } from "~/server/auth/restaurantAccess";
import type { auth } from "~/server/better-auth";
import type { db } from "~/server/db";
import { asset, restaurant, restaurantImage } from "~/server/db/schema";

import {
	isPublicUploadMode,
	resolveDemoUploadUserId,
} from "./publicUploadMode";

export const ALLOWED_RESTAURANT_IMAGE_MIMES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
]);

type Auth = typeof auth;
type Db = typeof db;

export async function resolveRestaurantUploadMetadata(opts: {
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

export async function completeRestaurantImageUpload(
	input: {
		userId: string;
		restaurantId: string;
		url: string;
		key: string;
		mimeType: string;
		sizeBytes: number;
	},
	deps: { db: Db },
) {
	const { db } = deps;

	await db.transaction(async (tx) => {
		const [aggregate] = await tx
			.select({ maxOrder: max(restaurantImage.sortOrder) })
			.from(restaurantImage)
			.where(eq(restaurantImage.restaurantId, input.restaurantId));

		const nextSortOrder = (aggregate?.maxOrder ?? -1) + 1;

		const [createdAsset] = await tx
			.insert(asset)
			.values({
				url: input.url,
				key: input.key,
				mimeType: input.mimeType,
				kind: "image",
				sizeBytes: input.sizeBytes,
				uploadedById: input.userId,
			})
			.returning({ id: asset.id });

		if (!createdAsset) {
			throw new Error("Failed to create asset row");
		}

		await tx.insert(restaurantImage).values({
			restaurantId: input.restaurantId,
			assetId: createdAsset.id,
			sortOrder: nextSortOrder,
		});
	});
}
