import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./cookie";
import { toSessionUser } from "./mappers";
import { mockUsersById } from "./mock/users";
import type { SessionUser } from "./types";

/** Resolves the mock session from the role cookie inside server components. */
export async function getServerSessionUser(): Promise<SessionUser | null> {
	const store = await cookies();
	const userId = store.get(SESSION_COOKIE)?.value;
	if (!userId) return null;

	const user = mockUsersById[userId];
	return user ? toSessionUser(user) : null;
}
