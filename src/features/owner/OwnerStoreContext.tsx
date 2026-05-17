"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

import type { RestaurantView } from "~/features/restaurant/types";
import { api } from "~/trpc/react";
import type { OwnerNotification } from "./NotificationManager";
import type { OwnerReservationView } from "./types";

export type {
	NotificationKind,
	OwnerNotification,
} from "./NotificationManager";

/** Editable subset of the restaurant managed from Configurações. */
export interface OwnerSettingsUpdate {
	name: string;
	phone: string;
	bio: string;
	hoursByWeekday: Record<number, number[]>;
}

interface OwnerStoreValue {
	restaurant: RestaurantView;
	reservations: OwnerReservationView[];
	/**
	 * Reminders / low-capacity warnings. Empty in P4a — P4c derives these
	 * client-side from `owner.reservations` and surfaces them in the bell.
	 */
	notifications: OwnerNotification[];
	setAutoConfirm: (enabled: boolean) => void;
	saveTableCount: (tableCount: number) => void;
	saveSettings: (values: OwnerSettingsUpdate) => void;
	clearNotifications: () => void;
}

const OwnerStoreContext = createContext<OwnerStoreValue | null>(null);

/** Local-only edits layered over the server restaurant until P4c persists them. */
type RestaurantEdits = Partial<
	Pick<
		RestaurantView,
		| "name"
		| "phone"
		| "description"
		| "autoConfirmEnabled"
		| "tableCount"
		| "hoursByWeekday"
	>
>;

export function OwnerStoreProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	// The panel layout guard redirects an owner-without-restaurant to
	// onboarding, so within the panel the query is always populated.
	const [serverRestaurant] = api.owner.restaurant.useSuspenseQuery();
	const [serverReservations] = api.owner.reservations.useSuspenseQuery();
	if (!serverRestaurant) {
		throw new Error("Owner panel rendered without a restaurant");
	}

	// P4b wired the reservation actions (confirm/cancel/complete) as real
	// optimistic mutations that patch the `owner.reservations` query cache
	// directly, so reservations are read straight from server truth here —
	// no local overlay. The settings edits (auto-confirm, table count,
	// settings form) stay in-session overlays until P4c persists them.
	const [edits, setEdits] = useState<RestaurantEdits>({});

	const restaurant = useMemo<RestaurantView>(
		() => ({ ...serverRestaurant, ...edits }),
		[serverRestaurant, edits],
	);

	const setAutoConfirm = useCallback((enabled: boolean) => {
		setEdits((prev) => ({ ...prev, autoConfirmEnabled: enabled }));
	}, []);

	const saveTableCount = useCallback((tableCount: number) => {
		setEdits((prev) => ({ ...prev, tableCount }));
	}, []);

	const saveSettings = useCallback((values: OwnerSettingsUpdate) => {
		setEdits((prev) => ({
			...prev,
			name: values.name,
			phone: values.phone,
			description: values.bio,
			hoursByWeekday: values.hoursByWeekday,
		}));
	}, []);

	const clearNotifications = useCallback(() => {}, []);

	const value = useMemo<OwnerStoreValue>(
		() => ({
			restaurant,
			reservations: serverReservations,
			notifications: [],
			setAutoConfirm,
			saveTableCount,
			saveSettings,
			clearNotifications,
		}),
		[
			restaurant,
			serverReservations,
			setAutoConfirm,
			saveTableCount,
			saveSettings,
			clearNotifications,
		],
	);

	return (
		<OwnerStoreContext.Provider value={value}>
			{children}
		</OwnerStoreContext.Provider>
	);
}

export function useOwnerStore(): OwnerStoreValue {
	const ctx = useContext(OwnerStoreContext);
	if (!ctx) {
		throw new Error("useOwnerStore must be used within an OwnerStoreProvider");
	}
	return ctx;
}
