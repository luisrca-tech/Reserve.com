import { describe, expect, it, vi } from "vitest";

import { OWNER_WITH_RESTAURANT_ID } from "~/features/auth/mock/users";
import { mockRestaurantRecords } from "~/features/restaurant/mock/restaurants";
import { createSessionState, type SessionCookiePort } from "./sessionState";

/** In-memory cookie port so the React-free core is testable in node. */
function fakeCookies(): SessionCookiePort {
	let session: string | null = null;
	let onboarded = false;
	return {
		readSession: () => session,
		writeSession: (id) => {
			session = id;
		},
		clearSession: () => {
			session = null;
		},
		readOnboarded: () => onboarded,
		writeOnboarded: () => {
			onboarded = true;
		},
		clearOnboarded: () => {
			onboarded = false;
		},
	};
}

const BELLA_RESTAURANT_ID = mockRestaurantRecords.find(
	(r) => r.restaurant.ownerId === OWNER_WITH_RESTAURANT_ID,
)?.restaurant.id;

function baseGuest(userId: string) {
	if (userId === "user_client_marcos")
		return { name: "Marcos Andrade", phone: "(11) 9 8888-0000" };
	return { name: "Cliente", phone: "—" };
}

function setup() {
	return createSessionState({ cookies: fakeCookies(), baseGuest });
}

describe("createSessionState — exposure", () => {
	it("starts signed out", () => {
		const s = setup();
		expect(s.getSnapshot()).toEqual({
			user: null,
			role: null,
			activeRestaurant: null,
		});
	});

	it("login exposes user + role and writes the session cookie", () => {
		const cookies = fakeCookies();
		const s = createSessionState({ cookies, baseGuest });

		const user = s.login("client");

		expect(user.id).toBe("user_client_marcos");
		expect(s.getSnapshot().role).toBe("client");
		expect(cookies.readSession()).toBe("user_client_marcos");
	});

	it("hydrate restores the user from the session cookie", () => {
		const cookies = fakeCookies();
		cookies.writeSession(OWNER_WITH_RESTAURANT_ID);
		const s = createSessionState({ cookies, baseGuest });

		s.hydrate();

		expect(s.getSnapshot().user?.id).toBe(OWNER_WITH_RESTAURANT_ID);
	});
});

describe("createSessionState — active restaurant resolution", () => {
	it("resolves the owner's managed restaurant (no owner-feature mapper)", () => {
		const s = setup();
		s.login("ownerWithRestaurant");
		expect(s.getSnapshot().activeRestaurant?.id).toBe(BELLA_RESTAURANT_ID);
	});

	it("falls back to a seeded restaurant for an owner without one", () => {
		const s = setup();
		s.login("ownerWithoutRestaurant");
		expect(s.getSnapshot().activeRestaurant).not.toBeNull();
	});

	it("clients have no active restaurant", () => {
		const s = setup();
		s.login("client");
		expect(s.getSnapshot().activeRestaurant).toBeNull();
	});
});

describe("createSessionState — profile/reservation desync", () => {
	it("a profile phone edit propagates to the owner's guest view", () => {
		const s = setup();
		s.login("client");

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

describe("createSessionState — onboarding", () => {
	it("completeOnboarding promotes the owner and writes the cookie", () => {
		const cookies = fakeCookies();
		const s = createSessionState({ cookies, baseGuest });
		s.login("ownerWithoutRestaurant");

		s.completeOnboarding();

		expect(s.getSnapshot().user?.hasRestaurant).toBe(true);
		expect(cookies.readOnboarded()).toBe(true);
	});
});

describe("createSessionState — explicit logout cleanup", () => {
	it("logout fully resets state and cookies, order-independent", () => {
		const cookies = fakeCookies();
		const s = createSessionState({ cookies, baseGuest });
		s.login("client");
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
		expect(cookies.readSession()).toBeNull();
		expect(cookies.readOnboarded()).toBe(false);
		// Profile override is cleared too — guest view reverts to base.
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

		s.login("client");
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		s.logout();
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
