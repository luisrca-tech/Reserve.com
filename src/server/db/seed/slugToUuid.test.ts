import { describe, expect, it } from "vitest";

import { slugToUuid } from "./slugToUuid";

describe("slugToUuid", () => {
	it("returns a stable UUIDv5 for a known slug", () => {
		expect(slugToUuid("cat_italiana")).toBe(
			"ab44615a-faa2-5bee-ba91-cf5e140ccd6f",
		);
	});

	it("is deterministic across calls (stable across processes)", () => {
		expect(slugToUuid("rest_cantina_bella")).toBe(
			slugToUuid("rest_cantina_bella"),
		);
		expect(slugToUuid("rest_cantina_bella")).toBe(
			"6ea82b91-7dc2-527e-8c63-9ca27119f795",
		);
	});

	it("maps distinct slugs to distinct UUIDs", () => {
		expect(slugToUuid("cat_italiana")).not.toBe(slugToUuid("cat_japonesa"));
	});

	it("produces a valid RFC 4122 version-5 UUID", () => {
		expect(slugToUuid("cat_brasileira")).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});
});
