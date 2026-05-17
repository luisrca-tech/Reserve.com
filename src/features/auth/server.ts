import "server-only";

import { eq } from "drizzle-orm";

import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { restaurant } from "~/server/db/schema";
import { resolveSessionUser } from "./sessionResolver";
import type { SessionUser } from "./types";

async function ownsRestaurant(ownerId: string): Promise<boolean> {
	const owned = await db.query.restaurant.findFirst({
		where: eq(restaurant.ownerId, ownerId),
		columns: { id: true },
	});
	return Boolean(owned);
}

/**
 * Real Better Auth session resolution for server components and route guards.
 * `hasRestaurant` is the live restaurant-ownership query — the single
 * authority every server gate redirects on.
 */
export async function getServerSessionUser(): Promise<SessionUser | null> {
	const session = await getSession();
	return resolveSessionUser(session, ownsRestaurant);
}
