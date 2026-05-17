import { describe, expect, it, vi } from "vitest";

import { resolveSessionUser } from "./sessionResolver";

const baseUser = {
	id: "u1",
	name: "Marcos Andrade",
	email: "client@reserve.test",
	role: "client" as const,
	phone: "(11) 9 8888-0000",
};

describe("resolveSessionUser", () => {
	it("returns null when there is no session", async () => {
		const ownsRestaurant = vi.fn();
		expect(await resolveSessionUser(null, ownsRestaurant)).toBeNull();
		expect(ownsRestaurant).not.toHaveBeenCalled();
	});

	it("maps a client session and never queries restaurant ownership", async () => {
		const ownsRestaurant = vi.fn();
		const user = await resolveSessionUser({ user: baseUser }, ownsRestaurant);

		expect(user).toEqual({
			id: "u1",
			name: "Marcos Andrade",
			email: "client@reserve.test",
			phone: "(11) 9 8888-0000",
			role: "client",
			hasRestaurant: false,
		});
		expect(ownsRestaurant).not.toHaveBeenCalled();
	});

	it("flags an owner that owns a restaurant", async () => {
		const ownsRestaurant = vi.fn().mockResolvedValue(true);
		const user = await resolveSessionUser(
			{ user: { ...baseUser, id: "owner1", role: "restaurant_owner" } },
			ownsRestaurant,
		);

		expect(ownsRestaurant).toHaveBeenCalledWith("owner1");
		expect(user?.hasRestaurant).toBe(true);
	});

	it("an owner without a restaurant is hasRestaurant=false", async () => {
		const ownsRestaurant = vi.fn().mockResolvedValue(false);
		const user = await resolveSessionUser(
			{ user: { ...baseUser, role: "restaurant_owner" } },
			ownsRestaurant,
		);

		expect(user?.hasRestaurant).toBe(false);
	});

	it("normalizes a missing phone to null", async () => {
		const user = await resolveSessionUser(
			{ user: { ...baseUser, phone: undefined } },
			vi.fn(),
		);
		expect(user?.phone).toBeNull();
	});
});
