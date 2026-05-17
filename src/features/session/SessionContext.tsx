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
	type SessionSnapshot,
	type SessionState,
} from "./sessionState";

interface SessionContextValue extends SessionSnapshot {
	logout: () => Promise<void>;
	/** Refetches the Better Auth session so a persisted profile edit shows. */
	refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

/**
 * One provider for user and role — fed by the real Better Auth session
 * (`authClient.useSession`). `hasRestaurant` defaults to `false` on the
 * client; the server route guards are the authority and refine
 * owner-with/without-restaurant routing.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
	const stateRef = useRef<SessionState>(undefined);
	if (!stateRef.current) {
		stateRef.current = createSessionState();
	}
	const state = stateRef.current;

	const { data, refetch } = authClient.useSession();
	const refetchRef = useRef(refetch);
	refetchRef.current = refetch;
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
		<SessionContext.Provider value={state}>
			<RefetchContext.Provider value={refetchRef}>
				{children}
			</RefetchContext.Provider>
		</SessionContext.Provider>
	);
}

const RefetchContext = createContext<{
	current: () => Promise<unknown> | unknown;
} | null>(null);

function useSessionStore(): SessionState {
	const state = useContext(SessionContext);
	if (!state) {
		throw new Error("useSessionState must be used within a SessionProvider");
	}
	return state;
}

export function useSessionState(): SessionContextValue {
	const state = useSessionStore();
	const refetchRef = useContext(RefetchContext);
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
			refreshSession: async () => {
				await refetchRef?.current();
			},
		}),
		[snapshot, state, refetchRef],
	);
}

/** Post-auth destination by role. Server guards refine owner routing. */
export function redirectPathFor(role: Role): string {
	if (role === "client") return "/restaurants";
	if (role === "restaurant_owner") return "/owner/overview";
	return "/";
}
