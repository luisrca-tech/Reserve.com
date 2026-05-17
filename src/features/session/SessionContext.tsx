"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";

import type { SeededUserKey, SessionUser } from "~/features/auth/types";
import { reservationGuest } from "~/features/owner/mock/ownerReservations";
import { browserCookiePort } from "./browserCookies";
import {
	createSessionState,
	type ProfileValues,
	type SessionSnapshot,
	type SessionState,
} from "./sessionState";

interface SessionContextValue extends SessionSnapshot {
	login: (key: SeededUserKey) => SessionUser;
	logout: () => void;
	updateProfile: (values: ProfileValues) => void;
	completeOnboarding: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

/**
 * One provider for user, role, and owner active restaurant. Replaces the
 * former auth-context / owner-mapper / static-profile stitching: every view
 * reads session from `useSessionState`, and a profile edit propagates to the
 * owner's reservation view because both read the same `guestProfile` source.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
	const stateRef = useRef<SessionState>(undefined);
	if (!stateRef.current) {
		stateRef.current = createSessionState({
			cookies: browserCookiePort,
			baseGuest: reservationGuest,
		});
	}
	const state = stateRef.current;

	useEffect(() => {
		state.hydrate();
	}, [state]);

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
			login: state.login,
			logout: state.logout,
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

/** Post-auth destination based on role + onboarding state. */
export function redirectPathFor(user: SessionUser): string {
	if (user.role === "client") return "/restaurants";
	if (user.role === "restaurant_owner") {
		return user.hasRestaurant ? "/owner/overview" : "/owner/onboarding";
	}
	return "/";
}
