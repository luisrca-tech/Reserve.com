import type { SessionUser } from "~/features/auth/types";

export interface SessionSnapshot {
	user: SessionUser | null;
	role: SessionUser["role"] | null;
}

export interface SessionState {
	getSnapshot(): SessionSnapshot;
	subscribe(listener: () => void): () => void;
	/** Pushes the real Better Auth user into the store (or `null` on sign-out). */
	setSessionUser(next: SessionUser | null): void;
	/** Local state reset; the real Better Auth sign-out is the caller's job. */
	logout(): void;
}

/**
 * Single source of client session state — the real user (fed from Better
 * Auth) and the derived role. React-free so it stays trivially unit-testable.
 * All former mock-backed shims (owner active restaurant, profile/onboarding
 * overrides, guest resolver) were retired in P5c: profile now persists via
 * `user.updateProfile` and the owner panel resolves data server-side.
 */
export function createSessionState(): SessionState {
	let snapshot: SessionSnapshot = { user: null, role: null };
	const listeners = new Set<() => void>();

	function commit(user: SessionUser | null) {
		snapshot = { user, role: user?.role ?? null };
		for (const listener of listeners) listener();
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
			commit(next);
		},
		logout() {
			commit(null);
		},
	};
}
