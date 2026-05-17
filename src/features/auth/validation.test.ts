import { describe, expect, it } from "vitest";

import {
	clientRegisterSchema,
	loginSchema,
	ownerRegisterSchema,
} from "./validation";

describe("loginSchema", () => {
	it("accepts a valid email + password", () => {
		const r = loginSchema.safeParse({
			email: "client@reserve.test",
			password: "Password123!",
		});
		expect(r.success).toBe(true);
	});

	it("rejects a malformed email", () => {
		const r = loginSchema.safeParse({ email: "nope", password: "x" });
		expect(r.success).toBe(false);
	});

	it("rejects an empty password (login does not re-validate strength)", () => {
		const r = loginSchema.safeParse({
			email: "client@reserve.test",
			password: "",
		});
		expect(r.success).toBe(false);
	});
});

describe("clientRegisterSchema", () => {
	const valid = {
		name: "Marcos Andrade",
		email: "marcos@email.com",
		phone: "(11) 9 8888-0000",
		password: "Password123!",
	};

	it("accepts a complete client registration", () => {
		expect(clientRegisterSchema.safeParse(valid).success).toBe(true);
	});

	it("rejects a too-short password (Better Auth minimum is 8)", () => {
		const r = clientRegisterSchema.safeParse({ ...valid, password: "short" });
		expect(r.success).toBe(false);
	});

	it("rejects a blank name", () => {
		const r = clientRegisterSchema.safeParse({ ...valid, name: " " });
		expect(r.success).toBe(false);
	});

	it("rejects an empty phone", () => {
		const r = clientRegisterSchema.safeParse({ ...valid, phone: "" });
		expect(r.success).toBe(false);
	});
});

describe("ownerRegisterSchema", () => {
	const valid = {
		restaurantName: "Cantina Bella",
		corporateEmail: "contato@cantinabella.com",
		phone: "(11) 3000-1000",
		address: "Rua das Flores, 123 — São Paulo, SP",
		bio: "Comida italiana de família.",
		password: "Password123!",
	};

	it("accepts a complete owner registration", () => {
		expect(ownerRegisterSchema.safeParse(valid).success).toBe(true);
	});

	it("rejects a malformed corporate email", () => {
		const r = ownerRegisterSchema.safeParse({
			...valid,
			corporateEmail: "not-an-email",
		});
		expect(r.success).toBe(false);
	});

	it("rejects a too-short password", () => {
		const r = ownerRegisterSchema.safeParse({ ...valid, password: "abc" });
		expect(r.success).toBe(false);
	});
});
