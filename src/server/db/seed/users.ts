import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "../schema";
import { user } from "../schema";
import { slugToUuid } from "./slugToUuid";

type Database = PostgresJsDatabase<typeof schema>;
type Role = (typeof schema.user.role.enumValues)[number];

export const OWNER_ACCOUNT_EMAIL = "owner@reserve.test";
export const CLIENT_ACCOUNT_EMAIL = "client@reserve.test";

/** Slugs of the data-only owners backing the two non-test fixed restaurants. */
export const FIXED_RESTAURANT_OWNER_SLUGS = {
	sushiKai: "user_owner_sushi_kai",
	brasaViva: "user_owner_brasa_viva",
} as const;

export interface RealAccountSpec {
	email: string;
	password: string;
	name: string;
	role: Role;
	phone: string;
}

export interface DataOnlyUserSpec {
	slug: string;
	email: string;
	name: string;
	role: Role;
	phone: string;
}

/**
 * The only login-capable accounts. Created through the real Better Auth flow so
 * the seeded password hash is byte-compatible with the app's auth instance.
 */
export const REAL_ACCOUNTS: ReadonlyArray<RealAccountSpec> = [
	{
		email: OWNER_ACCOUNT_EMAIL,
		password: "Password123!",
		name: "Beatriz Mello",
		role: "restaurant_owner",
		phone: "(11) 3000-1000",
	},
	{
		email: CLIENT_ACCOUNT_EMAIL,
		password: "Password123!",
		name: "Marcos Andrade",
		role: "client",
		phone: "(11) 9 8888-0000",
	},
];

/**
 * Data-only personas inserted directly. The seed owns these copies; it never
 * imports from `src/features/*​/mock`.
 */
export const DATA_ONLY_USERS: ReadonlyArray<DataOnlyUserSpec> = [
	{
		slug: FIXED_RESTAURANT_OWNER_SLUGS.sushiKai,
		email: "contato@sushikai.test",
		name: "Kenji Nakamura",
		role: "restaurant_owner",
		phone: "(11) 3000-3000",
	},
	{
		slug: FIXED_RESTAURANT_OWNER_SLUGS.brasaViva,
		email: "contato@brasaviva.test",
		name: "Heitor Brasil",
		role: "restaurant_owner",
		phone: "(11) 3000-4000",
	},
];

/**
 * Seed-scoped Better Auth instance bound to the orchestrator connection. It
 * omits the Next cookie plugin so `signUpEmail` is callable outside an HTTP
 * request context (tsx/CLI) while keeping the real scrypt password hashing.
 */
function createSeedAuth(db: Database) {
	return betterAuth({
		database: drizzleAdapter(db, { provider: "pg" }),
		emailAndPassword: { enabled: true },
		user: {
			additionalFields: {
				role: {
					type: ["client", "restaurant_owner", "admin"],
					required: false,
					defaultValue: "client",
					input: false,
				},
				phone: { type: "string", required: false, input: false },
			},
		},
	});
}

async function userIdByEmail(
	db: Database,
	email: string,
): Promise<string | null> {
	const [row] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	return row?.id ?? null;
}

export async function seedUsers(db: Database): Promise<void> {
	const seedAuth = createSeedAuth(db);

	for (const account of REAL_ACCOUNTS) {
		const existing = await userIdByEmail(db, account.email);
		if (!existing) {
			await seedAuth.api.signUpEmail({
				body: {
					email: account.email,
					password: account.password,
					name: account.name,
				},
			});
		}
		await db
			.update(user)
			.set({
				role: account.role,
				phone: account.phone,
				emailVerified: true,
				updatedAt: new Date(),
			})
			.where(eq(user.email, account.email));
	}

	const dataOnlyRows = DATA_ONLY_USERS.map((persona) => ({
		id: slugToUuid(persona.slug),
		name: persona.name,
		email: persona.email,
		emailVerified: true,
		role: persona.role,
		phone: persona.phone,
	}));

	await db
		.insert(user)
		.values(dataOnlyRows)
		.onConflictDoUpdate({
			target: user.id,
			set: {
				name: sql`excluded.name`,
				email: sql`excluded.email`,
				role: sql`excluded.role`,
				phone: sql`excluded.phone`,
				updatedAt: new Date(),
			},
		});

	console.log(
		`  users: ${REAL_ACCOUNTS.length} real accounts, ${dataOnlyRows.length} data-only upserted`,
	);
}
