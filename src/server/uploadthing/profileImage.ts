import { and, eq } from "drizzle-orm";
import type { UTApi } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";

import type { auth } from "~/server/better-auth";
import type { db } from "~/server/db";
import { asset, user } from "~/server/db/schema";

import {
	isPublicUploadMode,
	resolveDemoUploadUserId,
} from "./publicUploadMode";

export const ALLOWED_PROFILE_IMAGE_MIMES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
]);

type Auth = typeof auth;
type Db = typeof db;

export async function resolveProfileUploadMetadata(opts: {
	headers: Headers;
	auth: Auth;
	db: Db;
}) {
	if (isPublicUploadMode()) {
		return { userId: await resolveDemoUploadUserId(opts.db) };
	}

	const session = await opts.auth.api.getSession({ headers: opts.headers });

	if (!session?.user) {
		throw new UploadThingError("Unauthorized");
	}

	return { userId: session.user.id };
}

export async function completeProfileUpload(
	input: {
		userId: string;
		url: string;
		key: string;
		mimeType: string;
		sizeBytes: number;
	},
	deps: { db: Db; utapi: Pick<UTApi, "deleteFiles"> },
) {
	const { db, utapi } = deps;

	const currentUser = await db.query.user.findFirst({
		where: eq(user.id, input.userId),
		columns: { image: true },
	});

	const previousAsset = currentUser?.image
		? await db.query.asset.findFirst({
				where: and(
					eq(asset.uploadedById, input.userId),
					eq(asset.url, currentUser.image),
				),
			})
		: undefined;

	if (previousAsset?.key) {
		await utapi.deleteFiles(previousAsset.key);
	}

	if (previousAsset) {
		await db.delete(asset).where(eq(asset.id, previousAsset.id));
	}

	await db
		.insert(asset)
		.values({
			url: input.url,
			key: input.key,
			mimeType: input.mimeType,
			kind: "image",
			sizeBytes: input.sizeBytes,
			uploadedById: input.userId,
		})
		.returning();

	await db
		.update(user)
		.set({ image: input.url })
		.where(eq(user.id, input.userId));
}
