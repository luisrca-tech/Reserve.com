import { describe, expect, it, vi } from "vitest";

import { OWNER_WITH_RESTAURANT_ID } from "~/features/auth/mock/users";
import type { SessionUser } from "~/features/auth/types";
import { mockRestaurantRecords } from "~/features/restaurant/mock/restaurants";
import { createSessionState } from "./sessionState";

const BELLA_RESTAURANT_ID = mockRestaurantRecords.find(
	(r) => r.restaurant.ownerId === OWNER_WITH_RESTAURANT_ID,
)?.restaurant.id;

const clientUser: SessionUser = {
	id: "user_client_marcos",
	name: "Marcos Andrade",
	email: "client@reserve.test",
	phone: "(11) 9 8888-0000",
	role: "client",
	hasRestaurant: false,
};

const ownerWithRestaurant: SessionUser = {
	id: OWNER_WITH_RESTAURANT_ID,
	name: "Beatriz Mello",
	email: "owner@reserve.test",
	phone: "(11) 3000-1000",
	role: "restaurant_owner",
	hasRestaurant: true,
};

const ownerWithoutRestaurant: SessionUser = {
	id: "user_owner_new",
	name: "Rafael Costa",
	email: "rafael@novo.test",
	phone: null,
	role: "restaurant_owner",
	hasRestaurant: false,
};

function baseGuest(userId: string) {
	if (userId === "user_client_marcos")
		return { name: "Marcos Andrade", phone: "(11) 9 8888-0000" };
	return { name: "Cliente", phone: "—" };
}

function setup() {
	return createSessionState({ baseGuest });
}

describe("createSessionState — exposure", () => {
	it("starts signed out", () => {
		expect(setup().getSnapshot()).toEqual({
			user: null,
			role: null,
			activeRestaurant: null,
		});
	});

	it("setSessionUser exposes the real user + role", () => {
		const s = setup();
		s.setSessionUser(clientUser);
		expect(s.getSnapshot().user?.id).toBe("user_client_marcos");
		expect(s.getSnapshot().role).toBe("client");
	});

	it("setSessionUser(null) signs out", () => {
		const s = setup();
		s.setSessionUser(clientUser);
		s.setSessionUser(null);
		expect(s.getSnapshot()).toEqual({
			user: null,
			role: null,
			activeRestaurant: null,
		});
	});
});

describe("createSessionState — active restaurant resolution", () => {
	it("resolves the owner's managed restaurant by ownerId", () => {
		const s = setup();
		s.setSessionUser(ownerWithRestaurant);
		expect(s.getSnapshot().activeRestaurant?.id).toBe(BELLA_RESTAURANT_ID);
	});

	it("falls back to a seeded restaurant for an owner without a mock record", () => {
		const s = setup();
		s.setSessionUser(ownerWithoutRestaurant);
		expect(s.getSnapshot().activeRestaurant).not.toBeNull();
	});

	it("clients have no active restaurant", () => {
		const s = setup();
		s.setSessionUser(clientUser);
		expect(s.getSnapshot().activeRestaurant).toBeNull();
	});
});

describe("createSessionState — profile/reservation desync shim", () => {
	it("a profile phone edit propagates to the owner's guest view", () => {
		const s = setup();
		s.setSessionUser(clientUser);

		expect(s.guestProfile("user_client_marcos").phone).toBe("(11) 9 8888-0000");

		s.updateProfile({
			name: "Marcos A.",
			email: "marcos@email.com",
			phone: "(11) 9 1234-5678",
		});

		expect(s.guestProfile("user_client_marcos")).toEqual({
			name: "Marcos A.",
			phone: "(11) 9 1234-5678",
		});
		expect(s.getSnapshot().user?.phone).toBe("(11) 9 1234-5678");
	});

	it("guestProfile falls back to the base resolver for un-edited ids", () => {
		const s = setup();
		expect(s.guestProfile("guest_helena")).toEqual(baseGuest("guest_helena"));
	});
});

describe("createSessionState — onboarding shim", () => {
	it("completeOnboarding promotes the owner locally", () => {
		const s = setup();
		s.setSessionUser(ownerWithoutRestaurant);

		s.completeOnboarding();

		expect(s.getSnapshot().user?.hasRestaurant).toBe(true);
	});

	it("a re-pushed session keeps the local onboarding promotion", () => {
		const s = setup();
		s.setSessionUser(ownerWithoutRestaurant);
		s.completeOnboarding();

		s.setSessionUser(ownerWithoutRestaurant);

		expect(s.getSnapshot().user?.hasRestaurant).toBe(true);
	});
});

describe("createSessionState — logout cleanup", () => {
	it("logout fully resets state, order-independent", () => {
		const s = setup();
		s.setSessionUser(clientUser);
		s.updateProfile({
			name: "Marcos A.",
			email: "marcos@email.com",
			phone: "(11) 9 1234-5678",
		});

		s.logout();

		expect(s.getSnapshot()).toEqual({
			user: null,
			role: null,
			activeRestaurant: null,
		});
		expect(s.guestProfile("user_client_marcos")).toEqual(
			baseGuest("user_client_marcos"),
		);
	});

	it("switching to a different user clears the prior profile override", () => {
		const s = setup();
		s.setSessionUser(clientUser);
		s.updateProfile({
			name: "Marcos A.",
			email: "marcos@email.com",
			phone: "(11) 9 1234-5678",
		});

		s.setSessionUser(ownerWithRestaurant);

		expect(s.guestProfile("user_client_marcos")).toEqual(
			baseGuest("user_client_marcos"),
		);
	});
});

describe("createSessionState — subscription", () => {
	it("notifies subscribers on state changes", () => {
		const s = setup();
		const listener = vi.fn();
		const unsubscribe = s.subscribe(listener);

		s.setSessionUser(clientUser);
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		s.logout();
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
