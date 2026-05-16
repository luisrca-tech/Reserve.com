import "server-only";

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "~/server/better-auth";
import { db } from "~/server/db";

import {
	ALLOWED_PROFILE_IMAGE_MIMES,
	completeProfileUpload,
	resolveProfileUploadMetadata,
} from "./profileImage";
import { utapi } from "./utapi";

const f = createUploadthing();

export const uploadRouter = {
	profileImage: f({
		"image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/png": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
	})
		.middleware(async ({ req }) =>
			resolveProfileUploadMetadata({ headers: req.headers, auth }),
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
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
