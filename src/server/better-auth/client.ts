import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from ".";

/**
 * `inferAdditionalFields` propagates the server's `role` / `phone` custom
 * fields onto the client session type so consumers read them type-safely
 * without a separate fetch.
 */
export const authClient = createAuthClient({
	plugins: [inferAdditionalFields<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
