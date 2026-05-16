import type { User } from "~/server/db/schema/types";
import { OWNER_WITH_RESTAURANT_ID } from "./mock/users";
import type { SessionUser } from "./types";

/**
 * Schema → view mapper: a Drizzle `User` row into the UI session model.
 * `onboarded` promotes an owner-without-restaurant after they complete the
 * onboarding flow (mock-only stand-in for a persisted restaurant row).
 */
export function toSessionUser(user: User, onboarded = false): SessionUser {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		phone: user.phone,
		role: user.role,
		hasRestaurant: user.id === OWNER_WITH_RESTAURANT_ID || onboarded,
	};
}
