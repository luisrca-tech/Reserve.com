"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface BrowseContextValue {
	query: string;
	setQuery: (q: string) => void;
	mobileSearchOpen: boolean;
	openMobileSearch: () => void;
	closeMobileSearch: () => void;
}

const BrowseContext = createContext<BrowseContextValue | null>(null);

export function RestaurantBrowseProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [query, setQuery] = useState("");
	const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

	const value = useMemo<BrowseContextValue>(
		() => ({
			query,
			setQuery,
			mobileSearchOpen,
			openMobileSearch: () => setMobileSearchOpen(true),
			closeMobileSearch: () => setMobileSearchOpen(false),
		}),
		[query, mobileSearchOpen],
	);

	return (
		<BrowseContext.Provider value={value}>{children}</BrowseContext.Provider>
	);
}

export function useBrowse(): BrowseContextValue {
	const ctx = useContext(BrowseContext);
	if (!ctx) {
		throw new Error("useBrowse must be used within a RestaurantBrowseProvider");
	}
	return ctx;
}
