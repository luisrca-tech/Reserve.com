import type { User } from "~/server/db/schema/types";
import { OWNER_WITH_RESTAURANT_ID } from "./mock/users";
import type { SessionUser } from "./types";

/** Schema → view mapper: a Drizzle `User` row into the UI session model. */
export function toSessionUser(user: User): SessionUser {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		phone: user.phone,
		role: user.role,
		hasRestaurant: user.id === OWNER_WITH_RESTAURANT_ID,
	};
}
