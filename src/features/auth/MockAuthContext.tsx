"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	clearSessionCookie,
	readSessionCookie,
	writeSessionCookie,
} from "./cookie";
import { toSessionUser } from "./mappers";
import { mockUsers, mockUsersById } from "./mock/users";
import type { SeededUserKey, SessionUser } from "./types";

interface AuthContextValue {
	user: SessionUser | null;
	loginAs: (key: SeededUserKey) => SessionUser;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<SessionUser | null>(null);

	useEffect(() => {
		const id = readSessionCookie();
		if (!id) return;
		const row = mockUsersById[id];
		if (row) setUser(toSessionUser(row));
	}, []);

	const loginAs = useCallback((key: SeededUserKey) => {
		const session = toSessionUser(mockUsers[key]);
		writeSessionCookie(session.id);
		setUser(session);
		return session;
	}, []);

	const logout = useCallback(() => {
		clearSessionCookie();
		setUser(null);
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({ user, loginAs, logout }),
		[user, loginAs, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return ctx;
}

/** Post-auth destination based on role + onboarding state. */
export function redirectPathFor(user: SessionUser): string {
	if (user.role === "client") return "/restaurants";
	if (user.role === "restaurant_owner") {
		return user.hasRestaurant ? "/owner/overview" : "/owner/onboarding";
	}
	return "/";
}
