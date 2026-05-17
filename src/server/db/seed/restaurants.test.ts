import { describe, expect, it } from "vitest";
import {
	buildFakerRestaurantSpecs,
	buildFixedRestaurantSpecs,
	FAKER_RESTAURANT_COUNT,
} from "./restaurants";
import { CLIENT_ACCOUNT_EMAIL, OWNER_ACCOUNT_EMAIL } from "./users";

const PHONE = /^\(11\) /;
const MOBILE_PHONE = /^\(11\) 9 \d{4}-\d{4}$/;
const FIXED_CATEGORY_SLUGS = new Set([
	"cat_italiana",
	"cat_japonesa",
	"cat_brasileira",
	"cat_contemporanea",
]);

describe("restaurant specs", () => {
	it("defines exactly the three canonical fixed restaurants", () => {
		const fixed = buildFixedRestaurantSpecs();
		expect(fixed).toHaveLength(3);

		const cantina = fixed.find((r) => r.slug === "rest_cantina_bella");
		expect(cantina?.owner).toEqual({
			kind: "email",
			email: OWNER_ACCOUNT_EMAIL,
		});
		expect(cantina?.categorySlug).toBe("cat_italiana");

		const others = fixed.filter((r) => r.slug !== "rest_cantina_bella");
		for (const r of others) {
			expect(r.owner.kind).toBe("slug");
		}
	});

	it("generates the configured number of faker restaurants", () => {
		expect(buildFakerRestaurantSpecs()).toHaveLength(FAKER_RESTAURANT_COUNT);
	});

	it("produces a total of 28 restaurants with unique slugs and owners", () => {
		const all = [
			...buildFixedRestaurantSpecs(),
			...buildFakerRestaurantSpecs(),
		];
		expect(all).toHaveLength(28);

		const slugs = all.map((r) => r.slug);
		expect(new Set(slugs).size).toBe(slugs.length);

		const ownerKeys = all.map((r) =>
			r.owner.kind === "email" ? r.owner.email : r.owner.slug,
		);
		expect(new Set(ownerKeys).size).toBe(ownerKeys.length);
	});

	it("gives every faker restaurant its own data-only owner user", () => {
		const faker = buildFakerRestaurantSpecs();
		for (const r of faker) {
			expect(r.owner.kind).toBe("slug");
			expect(r.ownerUser).toBeDefined();
			expect(r.ownerUser?.role).toBe("restaurant_owner");
			expect(r.ownerUser?.name.trim()).not.toBe("");
		}
		const ownerEmails = faker.map((r) => r.ownerUser?.email);
		expect(new Set(ownerEmails).size).toBe(ownerEmails.length);
		expect(ownerEmails).not.toContain(OWNER_ACCOUNT_EMAIL);
		expect(ownerEmails).not.toContain(CLIENT_ACCOUNT_EMAIL);
	});

	it("gives every restaurant a valid category, availability and images", () => {
		const all = [
			...buildFixedRestaurantSpecs(),
			...buildFakerRestaurantSpecs(),
		];
		for (const r of all) {
			expect(FIXED_CATEGORY_SLUGS.has(r.categorySlug)).toBe(true);
			expect(r.weekdays.length).toBeGreaterThan(0);
			expect(r.closeHour).toBeGreaterThan(r.openHour);
			expect(r.imageUrls.length).toBeGreaterThan(0);
			expect(r.tableCount).toBeGreaterThan(0);
			expect(r.phone).toMatch(PHONE);
		}
	});

	it("formats faker phones as Brazilian mobile numbers", () => {
		for (const r of buildFakerRestaurantSpecs()) {
			expect(r.phone).toMatch(MOBILE_PHONE);
		}
	});

	it("is deterministic across separate builder calls", () => {
		expect(JSON.stringify(buildFakerRestaurantSpecs())).toBe(
			JSON.stringify(buildFakerRestaurantSpecs()),
		);
	});
});
