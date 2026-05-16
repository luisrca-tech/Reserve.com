import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "~/server/db";

export const auth = betterAuth({
	plugins: [nextCookies()],
	database: drizzleAdapter(db, {
		provider: "pg", // or "pg" or "mysql"
	}),
	emailAndPassword: {
		enabled: true,
	},
	user: {
		additionalFields: {
			role: {
				type: ["client", "restaurant_owner"],
				required: false,
				defaultValue: "client",
				input: false,
			},
			phone: {
				type: "string",
				required: false,
				input: false,
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
