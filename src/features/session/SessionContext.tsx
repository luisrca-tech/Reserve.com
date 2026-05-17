"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";

import type { Role } from "~/features/auth/types";
import { authClient } from "~/server/better-auth/client";
import {
	createSessionState,
	type ProfileValues,
	type SessionSnapshot,
	type SessionState,
} from "./sessionState";

interface SessionContextValue extends SessionSnapshot {
	logout: () => Promise<void>;
	updateProfile: (values: ProfileValues) => void;
	completeOnboarding: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

/**
 * One provider for user, role, and owner active restaurant — now fed by the
 * real Better Auth session (`authClient.useSession`) instead of the mock
 * cookie. `hasRestaurant` defaults to `false` on the client; the server route
 * guards are the authority and refine owner-with/without-restaurant routing.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
	const stateRef = useRef<SessionState>(undefined);
	if (!stateRef.current) {
		// The owner panel now resolves guest identity server-side via
		// `owner.reservations`, so the in-session guest resolver has no real
		// consumer here; it stays an inert default, fully retired with the
		// profile shim in P5c.
		stateRef.current = createSessionState({
			baseGuest: () => ({ name: "Cliente", phone: "—" }),
		});
	}
	const state = stateRef.current;

	const { data } = authClient.useSession();
	const u = data?.user;
	const id = u?.id ?? null;

	useEffect(() => {
		if (!u || !id) {
			state.setSessionUser(null);
			return;
		}
		state.setSessionUser({
			id: u.id,
			name: u.name,
			email: u.email,
			phone: u.phone ?? null,
			role: (u.role ?? "client") as Role,
			hasRestaurant: false,
		});
		// `u` is re-created each render; the primitive deps capture every change.
	}, [state, id, u?.name, u?.email, u?.phone, u?.role, u]);

	return (
		<SessionContext.Provider value={state}>{children}</SessionContext.Provider>
	);
}

function useSessionStore(): SessionState {
	const state = useContext(SessionContext);
	if (!state) {
		throw new Error("useSessionState must be used within a SessionProvider");
	}
	return state;
}

export function useSessionState(): SessionContextValue {
	const state = useSessionStore();
	const snapshot = useSyncExternalStore(
		state.subscribe,
		state.getSnapshot,
		state.getSnapshot,
	);

	return useMemo(
		() => ({
			...snapshot,
			logout: async () => {
				await authClient.signOut();
				state.logout();
			},
			updateProfile: state.updateProfile,
			completeOnboarding: state.completeOnboarding,
		}),
		[snapshot, state],
	);
}

/** Live guest profile for an arbitrary user id (owner reservation view). */
export function useGuestProfile(): (userId: string) => {
	name: string;
	phone: string;
} {
	return useSessionStore().guestProfile;
}

/** Post-auth destination by role. Server guards refine owner routing. */
export function redirectPathFor(role: Role): string {
	if (role === "client") return "/restaurants";
	if (role === "restaurant_owner") return "/owner/overview";
	return "/";
}
