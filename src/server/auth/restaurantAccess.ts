import { eq } from "drizzle-orm";

import type { db } from "~/server/db";
import { restaurant } from "~/server/db/schema";

type Db = typeof db;

export type SessionUser = {
	id: string;
	role?: string | null;
};

export async function canManageRestaurant(
	database: Db,
	user: SessionUser,
	restaurantId: string,
): Promise<boolean> {
	const found = await database.query.restaurant.findFirst({
		where: eq(restaurant.id, restaurantId),
		columns: { ownerId: true },
	});

	if (!found) {
		return false;
	}

	if (user.role === "admin") {
		return true;
	}

	return found.ownerId === user.id;
}
