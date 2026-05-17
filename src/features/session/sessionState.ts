import { toSessionUser } from "~/features/auth/mappers";
import { mockUsers, mockUsersById } from "~/features/auth/mock/users";
import type { Role, SeededUserKey, SessionUser } from "~/features/auth/types";
import {
	mockRestaurantRecords,
	mockRestaurantViewsById,
} from "~/features/restaurant/mock/restaurants";
import type { RestaurantView } from "~/features/restaurant/types";

/** Mock session persistence; injected so the core stays React/DOM-free. */
export interface SessionCookiePort {
	readSession(): string | null;
	writeSession(userId: string): void;
	clearSession(): void;
	readOnboarded(): boolean;
	writeOnboarded(): void;
	clearOnboarded(): void;
}

export interface ProfileValues {
	name: string;
	email: string;
	phone: string;
}

export interface GuestProfile {
	name: string;
	phone: string;
}

export interface SessionDeps {
	cookies: SessionCookiePort;
	/** Base profile for any user id (seeded users + synthetic owner-demo guests). */
	baseGuest(userId: string): GuestProfile;
}

export interface SessionSnapshot {
	user: SessionUser | null;
	role: Role | null;
	/** Resolved owner restaurant, or `null` for clients / signed-out. */
	activeRestaurant: RestaurantView | null;
}

export interface SessionState {
	getSnapshot(): SessionSnapshot;
	subscribe(listener: () => void): () => void;
	/** Restores the user from the session cookie (mock hydration). */
	hydrate(): void;
	login(key: SeededUserKey): SessionUser;
	logout(): void;
	updateProfile(values: ProfileValues): void;
	completeOnboarding(): void;
	/**
	 * Live guest profile: the base resolver overlaid with in-session profile
	 * edits. The single source the owner reservation view reads, so a client's
	 * profile edit shows up in the owner's list — closing the desync gap.
	 */
	guestProfile(userId: string): GuestProfile;
}

/** ownerId → restaurantId, derived from the relational mock records. */
const restaurantIdByOwnerId: Record<string, string> = Object.fromEntries(
	mockRestaurantRecords.map((r) => [r.restaurant.ownerId, r.restaurant.id]),
);

/**
 * Owner active-restaurant resolution (moved here from the owner feature).
 * Seeded owners map directly via `ownerId`; an owner promoted through
 * onboarding has no persisted record yet (documented Phase 5 debt), so the
 * first seeded restaurant is used as a populated stand-in.
 */
function resolveActiveRestaurant(
	user: SessionUser | null,
): RestaurantView | null {
	if (!user || user.role !== "restaurant_owner") return null;
	const ownId = restaurantIdByOwnerId[user.id];
	const own = ownId ? mockRestaurantViewsById[ownId] : undefined;
	if (own) return own;
	const fallback = Object.values(mockRestaurantViewsById)[0];
	if (!fallback) throw new Error("No seeded restaurants available");
	return fallback;
}

/**
 * Single source of session state — user, role, owner active restaurant, and
 * in-session profile overrides. React-free so a future persistence/server
 * adapter can implement the same interface without re-touching callers.
 */
export function createSessionState({
	cookies,
	baseGuest,
}: SessionDeps): SessionState {
	let user: SessionUser | null = null;
	let activeRestaurant: RestaurantView | null = null;
	const profileOverrides = new Map<string, GuestProfile>();
	const listeners = new Set<() => void>();
	let snapshot: SessionSnapshot = {
		user: null,
		role: null,
		activeRestaurant: null,
	};

	function commit() {
		snapshot = {
			user,
			role: user?.role ?? null,
			activeRestaurant,
		};
		for (const listener of listeners) listener();
	}

	function setUser(next: SessionUser | null) {
		user = next;
		activeRestaurant = resolveActiveRestaurant(next);
		commit();
	}

	return {
		getSnapshot() {
			return snapshot;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		hydrate() {
			const id = cookies.readSession();
			if (!id) return;
			const row = mockUsersById[id];
			if (row) setUser(toSessionUser(row, cookies.readOnboarded()));
		},
		login(key) {
			cookies.clearOnboarded();
			const session = toSessionUser(mockUsers[key]);
			cookies.writeSession(session.id);
			profileOverrides.clear();
			setUser(session);
			return session;
		},
		logout() {
			cookies.clearSession();
			cookies.clearOnboarded();
			profileOverrides.clear();
			setUser(null);
		},
		updateProfile(values) {
			if (!user) return;
			const phone = values.phone.trim() === "" ? null : values.phone;
			profileOverrides.set(user.id, {
				name: values.name,
				phone: phone ?? "—",
			});
			setUser({
				...user,
				name: values.name,
				email: values.email,
				phone,
			});
		},
		completeOnboarding() {
			cookies.writeOnboarded();
			if (user) setUser({ ...user, hasRestaurant: true });
		},
		guestProfile(userId) {
			return profileOverrides.get(userId) ?? baseGuest(userId);
		},
	};
}
