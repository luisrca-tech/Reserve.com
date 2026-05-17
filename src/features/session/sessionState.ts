import type { SessionUser } from "~/features/auth/types";
import {
	mockRestaurantRecords,
	mockRestaurantViewsById,
} from "~/features/restaurant/mock/restaurants";
import type { RestaurantView } from "~/features/restaurant/types";

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
	/** Base profile for any user id (seeded users + synthetic owner-demo guests). */
	baseGuest(userId: string): GuestProfile;
}

export interface SessionSnapshot {
	user: SessionUser | null;
	role: SessionUser["role"] | null;
	/** Resolved owner restaurant, or `null` for clients / signed-out. */
	activeRestaurant: RestaurantView | null;
}

export interface SessionState {
	getSnapshot(): SessionSnapshot;
	subscribe(listener: () => void): () => void;
	/**
	 * Pushes the real Better Auth user into the store (or `null` on sign-out).
	 * Replaces the former mock cookie `login`/`hydrate` — the auth authority
	 * now lives in Better Auth; this store only derives owner active-restaurant
	 * and holds the still-mock profile/onboarding shims (their owning phases
	 * replace them).
	 */
	setSessionUser(next: SessionUser | null): void;
	/** Local state reset; the real Better Auth sign-out is the caller's job. */
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
 * Owner active-restaurant resolution (still mock-backed until P4a). Seeded
 * owners map directly via `ownerId`; a real owner with no mock record falls
 * back to the first seeded restaurant as a populated stand-in.
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
 * Single source of client session state — real user (fed from Better Auth),
 * owner active restaurant, and the in-session profile/onboarding shims.
 * React-free so the still-mock shims stay unit-testable as their owning
 * phases swap them for real data.
 */
export function createSessionState({ baseGuest }: SessionDeps): SessionState {
	let user: SessionUser | null = null;
	let activeRestaurant: RestaurantView | null = null;
	let onboarded = false;
	const profileOverrides = new Map<string, GuestProfile>();
	const listeners = new Set<() => void>();
	let snapshot: SessionSnapshot = {
		user: null,
		role: null,
		activeRestaurant: null,
	};

	function commit() {
		snapshot = { user, role: user?.role ?? null, activeRestaurant };
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
		setSessionUser(next) {
			if (!next) {
				onboarded = false;
				profileOverrides.clear();
				setUser(null);
				return;
			}
			if (next.id !== user?.id) {
				onboarded = false;
				profileOverrides.clear();
			}
			setUser({ ...next, hasRestaurant: next.hasRestaurant || onboarded });
		},
		logout() {
			onboarded = false;
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
			onboarded = true;
			if (user) setUser({ ...user, hasRestaurant: true });
		},
		guestProfile(userId) {
			return profileOverrides.get(userId) ?? baseGuest(userId);
		},
	};
}
