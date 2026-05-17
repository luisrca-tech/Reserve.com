import type { Role, SessionUser } from "./types";

/** Minimal shape of a resolved Better Auth session this mapper needs. */
export interface AuthSessionLike {
	user: {
		id: string;
		name: string;
		email: string;
		role?: Role | null;
		phone?: string | null;
	};
}

/**
 * Pure session → view mapper. `ownsRestaurant` is the only authority on
 * `hasRestaurant`, queried (real DB) solely for owners — clients can never
 * own a restaurant, so the lookup is skipped. Injected so the mapping is
 * unit-testable without a database or request headers.
 */
export async function resolveSessionUser(
	session: AuthSessionLike | null,
	ownsRestaurant: (ownerId: string) => Promise<boolean>,
): Promise<SessionUser | null> {
	if (!session?.user) return null;

	const u = session.user;
	const role: Role = u.role ?? "client";
	const hasRestaurant =
		role === "restaurant_owner" ? await ownsRestaurant(u.id) : false;

	return {
		id: u.id,
		name: u.name,
		email: u.email,
		phone: u.phone ?? null,
		role,
		hasRestaurant,
	};
}
