import type { User } from "~/server/db/schema/types";
import type { SeededUserKey } from "../types";

const SEED_DATE = new Date("2026-01-01T12:00:00.000Z");

/**
 * Seeded users typed against the Drizzle `User` inferred type so a future
 * seed script can consume them unchanged. Three personas:
 * - a client
 * - an owner that already has a restaurant
 * - an owner that has not completed onboarding yet
 */
export const mockUsers: Record<SeededUserKey, User> = {
	client: {
		id: "user_client_marcos",
		name: "Marcos Andrade",
		email: "marcos@email.com",
		emailVerified: true,
		image: null,
		role: "client",
		phone: "(11) 9 8888-0000",
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	},
	ownerWithRestaurant: {
		id: "user_owner_bella",
		name: "Beatriz Mello",
		email: "contato@cantinabella.com",
		emailVerified: true,
		image: null,
		role: "restaurant_owner",
		phone: "(11) 3000-1000",
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	},
	ownerWithoutRestaurant: {
		id: "user_owner_new",
		name: "Rafael Costa",
		email: "rafael@novorestaurante.com",
		emailVerified: true,
		image: null,
		role: "restaurant_owner",
		phone: "(11) 3000-2000",
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	},
};

export const mockUsersById: Record<string, User> = Object.fromEntries(
	Object.values(mockUsers).map((u) => [u.id, u]),
);

/** The owner id that owns the single seeded restaurant. */
export const OWNER_WITH_RESTAURANT_ID = mockUsers.ownerWithRestaurant.id;
