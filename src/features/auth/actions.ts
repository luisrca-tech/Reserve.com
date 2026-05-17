"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "~/server/better-auth";
import { db } from "~/server/db";
import { user } from "~/server/db/schema";

/**
 * Promotes the freshly-registered current user to `restaurant_owner`.
 * Better Auth blocks `role` as sign-up input (`input: false`) so a client
 * can never self-assign a privileged role; this action only ever elevates
 * the authenticated session user from `client` to `restaurant_owner`
 * (never `admin`), called right after owner registration.
 */
export async function promoteToOwner(): Promise<void> {
	const session = await auth.api.getSession({ headers: await headers() });
	const current = session?.user;
	if (!current || current.role !== "client") return;

	await db
		.update(user)
		.set({ role: "restaurant_owner", updatedAt: new Date() })
		.where(eq(user.id, current.id));
}
