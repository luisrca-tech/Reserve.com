import { describe, expect, it } from "vitest";

import {
	CLIENT_ACCOUNT_EMAIL,
	DATA_ONLY_USERS,
	FIXED_RESTAURANT_OWNER_SLUGS,
	OWNER_ACCOUNT_EMAIL,
	REAL_ACCOUNTS,
} from "./users";

const PHONE = /^\(11\) /;

describe("user personas", () => {
	it("defines exactly the two real, login-capable accounts", () => {
		expect(REAL_ACCOUNTS).toHaveLength(2);

		const owner = REAL_ACCOUNTS.find((a) => a.email === OWNER_ACCOUNT_EMAIL);
		const client = REAL_ACCOUNTS.find(
			(a) => a.email === CLIENT_ACCOUNT_EMAIL,
		);

		expect(owner?.role).toBe("restaurant_owner");
		expect(client?.role).toBe("client");
		for (const account of REAL_ACCOUNTS) {
			expect(account.password.length).toBeGreaterThanOrEqual(8);
			expect(account.name.trim()).not.toBe("");
			expect(account.phone).toMatch(PHONE);
		}
	});

	it("provides data-only owners for the two non-test fixed restaurants", () => {
		const slugs = DATA_ONLY_USERS.map((u) => u.slug);
		expect(slugs).toContain(FIXED_RESTAURANT_OWNER_SLUGS.sushiKai);
		expect(slugs).toContain(FIXED_RESTAURANT_OWNER_SLUGS.brasaViva);

		for (const persona of DATA_ONLY_USERS) {
			expect(persona.role).toBe("restaurant_owner");
			expect(persona.name.trim()).not.toBe("");
			expect(persona.phone).toMatch(PHONE);
		}
	});

	it("keeps every email and slug/identity unique across all personas", () => {
		const emails = [
			...REAL_ACCOUNTS.map((a) => a.email),
			...DATA_ONLY_USERS.map((u) => u.email),
		];
		expect(new Set(emails).size).toBe(emails.length);

		const slugs = DATA_ONLY_USERS.map((u) => u.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});
});
