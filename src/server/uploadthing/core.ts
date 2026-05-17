import "server-only";

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { auth } from "~/server/better-auth";
import { db } from "~/server/db";
import {
	ALLOWED_PROFILE_IMAGE_MIMES,
	completeProfileUpload,
	resolveProfileUploadMetadata,
} from "./profileImage";
import {
	ALLOWED_RESTAURANT_IMAGE_MIMES,
	completeRestaurantImageUpload,
	resolveRestaurantUploadMetadata,
} from "./restaurantImage";
import {
	ALLOWED_RESTAURANT_MENU_MIMES,
	completeRestaurantMenuUpload,
	resolveRestaurantMenuUploadMetadata,
} from "./restaurantMenu";
import { utapi } from "./utapi";

const f = createUploadthing();

export const uploadRouter = {
	profileImage: f({
		"image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/png": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
	})
		.middleware(async ({ req }) =>
			resolveProfileUploadMetadata({ headers: req.headers, auth, db }),
		)
		.onUploadComplete(async ({ metadata, file }) => {
			if (!ALLOWED_PROFILE_IMAGE_MIMES.has(file.type)) {
				throw new UploadThingError("Invalid file type");
			}

			try {
				await completeProfileUpload(
					{
						userId: metadata.userId,
						url: file.ufsUrl,
						key: file.key,
						mimeType: file.type,
						sizeBytes: file.size,
					},
					{ db, utapi },
				);
			} catch (error) {
				console.error("profileImage onUploadComplete failed", error);
			}

			return { url: file.ufsUrl };
		}),

	restaurantImage: f({
		"image/jpeg": { maxFileSize: "8MB", maxFileCount: 5 },
		"image/png": { maxFileSize: "8MB", maxFileCount: 5 },
		"image/webp": { maxFileSize: "8MB", maxFileCount: 5 },
	})
		.input(z.object({ restaurantId: z.string().uuid() }))
		.middleware(async ({ req, input }) =>
			resolveRestaurantUploadMetadata({
				headers: req.headers,
				auth,
				restaurantId: input.restaurantId,
				db,
			}),
		)
		.onUploadComplete(async ({ metadata, file }) => {
			if (!ALLOWED_RESTAURANT_IMAGE_MIMES.has(file.type)) {
				throw new UploadThingError("Invalid file type");
			}

			try {
				await completeRestaurantImageUpload(
					{
						userId: metadata.userId,
						restaurantId: metadata.restaurantId,
						url: file.ufsUrl,
						key: file.key,
						mimeType: file.type,
						sizeBytes: file.size,
					},
					{ db },
				);
			} catch (error) {
				console.error("restaurantImage onUploadComplete failed", error);
			}

			return { url: file.ufsUrl };
		}),

	restaurantMenu: f({
		"application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
		"image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
		"image/png": { maxFileSize: "8MB", maxFileCount: 1 },
		"image/webp": { maxFileSize: "8MB", maxFileCount: 1 },
	})
		.input(z.object({ restaurantId: z.string().uuid() }))
		.middleware(async ({ req, input }) =>
			resolveRestaurantMenuUploadMetadata({
				headers: req.headers,
				auth,
				restaurantId: input.restaurantId,
				db,
			}),
		)
		.onUploadComplete(async ({ metadata, file }) => {
			if (!ALLOWED_RESTAURANT_MENU_MIMES.has(file.type)) {
				throw new UploadThingError("Invalid file type");
			}

			try {
				await completeRestaurantMenuUpload(
					{
						userId: metadata.userId,
						restaurantId: metadata.restaurantId,
						url: file.ufsUrl,
						key: file.key,
						mimeType: file.type,
						sizeBytes: file.size,
					},
					{ db, utapi },
				);
			} catch (error) {
				console.error("restaurantMenu onUploadComplete failed", error);
			}

			return { url: file.ufsUrl };
		}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
