import { describe, expect, it, vi } from "vitest";

import type { SessionUser } from "~/features/auth/types";
import { createSessionState } from "./sessionState";

const clientUser: SessionUser = {
	id: "user_client_marcos",
	name: "Marcos Andrade",
	email: "client@reserve.test",
	phone: "(11) 9 8888-0000",
	role: "client",
	hasRestaurant: false,
};

const ownerUser: SessionUser = {
	id: "user_owner_bella",
	name: "Beatriz Mello",
	email: "owner@reserve.test",
	phone: "(11) 3000-1000",
	role: "restaurant_owner",
	hasRestaurant: true,
};

describe("createSessionState — exposure", () => {
	it("starts signed out", () => {
		expect(createSessionState().getSnapshot()).toEqual({
			user: null,
			role: null,
		});
	});

	it("setSessionUser exposes the real user + role", () => {
		const s = createSessionState();
		s.setSessionUser(clientUser);
		expect(s.getSnapshot().user?.id).toBe("user_client_marcos");
		expect(s.getSnapshot().role).toBe("client");
	});

	it("setSessionUser derives the owner role", () => {
		const s = createSessionState();
		s.setSessionUser(ownerUser);
		expect(s.getSnapshot().role).toBe("restaurant_owner");
	});

	it("setSessionUser(null) signs out", () => {
		const s = createSessionState();
		s.setSessionUser(clientUser);
		s.setSessionUser(null);
		expect(s.getSnapshot()).toEqual({ user: null, role: null });
	});
});

describe("createSessionState — logout", () => {
	it("logout fully resets state", () => {
		const s = createSessionState();
		s.setSessionUser(clientUser);

		s.logout();

		expect(s.getSnapshot()).toEqual({ user: null, role: null });
	});
});

describe("createSessionState — subscription", () => {
	it("notifies subscribers on state changes", () => {
		const s = createSessionState();
		const listener = vi.fn();
		const unsubscribe = s.subscribe(listener);

		s.setSessionUser(clientUser);
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		s.logout();
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
