import { describe, expect, it } from "vitest";

import { assertNotProduction } from "./productionGuard";

describe("assertNotProduction", () => {
	it("throws when NODE_ENV is production", () => {
		expect(() => assertNotProduction("production")).toThrow(/production/i);
	});

	it("does not throw for development", () => {
		expect(() => assertNotProduction("development")).not.toThrow();
	});

	it("does not throw for test", () => {
		expect(() => assertNotProduction("test")).not.toThrow();
	});

	it("does not throw when NODE_ENV is undefined", () => {
		expect(() => assertNotProduction(undefined)).not.toThrow();
	});
});
