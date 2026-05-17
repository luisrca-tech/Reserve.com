/**
 * The seed performs bulk writes and must never touch a production database.
 * Aborts before any connection is established when running in production.
 */
export function assertNotProduction(nodeEnv: string | undefined): void {
	if (nodeEnv === "production") {
		throw new Error(
			"Refusing to seed: NODE_ENV is production. The database seed is local/test only.",
		);
	}
}
