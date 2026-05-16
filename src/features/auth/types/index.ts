import type { User } from "~/server/db/schema/types";

export type Role = User["role"];

export type SeededUserKey =
	| "client"
	| "ownerWithRestaurant"
	| "ownerWithoutRestaurant";

/** View model the UI consumes — derived from the Drizzle `User` row. */
export interface SessionUser {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	role: Role;
	hasRestaurant: boolean;
}

export interface ClientRegistrationInput {
	name: string;
	email: string;
	phone: string;
}

export interface RestaurantRegistrationInput {
	name: string;
	corporateEmail: string;
	phone: string;
	address: string;
	bio: string;
}
