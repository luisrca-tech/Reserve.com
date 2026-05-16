import "server-only";

import { UTApi } from "uploadthing/server";

import { env } from "~/env";

const globalForUtapi = globalThis as unknown as {
	utapi: UTApi | undefined;
};

export const utapi =
	globalForUtapi.utapi ?? new UTApi({ token: env.UPLOADTHING_TOKEN });

if (env.NODE_ENV !== "production") {
	globalForUtapi.utapi = utapi;
}
