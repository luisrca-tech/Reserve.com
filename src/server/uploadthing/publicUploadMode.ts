import { UploadThingError } from "uploadthing/server";

import { env } from "~/env";
import type { db } from "~/server/db";

type Db = typeof db;

export function isPublicUploadMode(): boolean {
	if (env.UPLOADTHING_PUBLIC_UPLOADS === "true") {
		return true;
	}
	if (env.UPLOADTHING_PUBLIC_UPLOADS === "false") {
		return false;
	}
	return env.NODE_ENV === "development";
}

export async function resolveDemoUploadUserId(database: Db): Promise<string> {
	if (env.DEMO_UPLOAD_USER_ID) {
		return env.DEMO_UPLOAD_USER_ID;
	}

	const firstUser = await database.query.user.findFirst({
		columns: { id: true },
	});

	if (!firstUser) {
		throw new UploadThingError(
			"No user in database for demo uploads. Sign up once or set DEMO_UPLOAD_USER_ID in .env",
		);
	}

	return firstUser.id;
}
