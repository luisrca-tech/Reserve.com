"use client";

import { createContext, useContext, useRef, useSyncExternalStore } from "react";

import { useAuth } from "~/features/auth/MockAuthContext";
import {
	createReservationStore,
	type NewReservationInput,
	type ReservationStore,
} from "../reservationStore";
import type { MockReservation } from "../types";

const ReservationStoreContext = createContext<ReservationStore | null>(null);

/**
 * One reservation set for client and owner. Both shells mount this provider;
 * the client hook below and `OwnerStoreContext` read the same store, so a
 * client-created reservation shows up in the owner's list without a reload.
 */
export function ReservationStoreProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const storeRef = useRef<ReservationStore>(undefined);
	if (!storeRef.current) storeRef.current = createReservationStore();

	return (
		<ReservationStoreContext.Provider value={storeRef.current}>
			{children}
		</ReservationStoreContext.Provider>
	);
}

/** Raw store access for the owner provider. Subscribes the caller to changes. */
export function useReservationStoreSnapshot(): ReservationStore {
	const store = useContext(ReservationStoreContext);
	if (!store) {
		throw new Error(
			"Reservation store hooks must be used within a ReservationStoreProvider",
		);
	}
	useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
	return store;
}

interface ClientReservationStore {
	/** The signed-in user's own reservations (history view). */
	reservations: MockReservation[];
	/** Restaurant-wide rows for booking-capacity reads only. */
	restaurantReservations: (restaurantId: string) => MockReservation[];
	addReservation: (input: NewReservationInput) => MockReservation;
	cancelReservation: (id: string) => void;
}

export function useReservationStore(): ClientReservationStore {
	const store = useReservationStoreSnapshot();
	const { user } = useAuth();
	const scope = store.client(user?.id ?? "");

	return {
		reservations: scope.list(),
		restaurantReservations: (restaurantId) =>
			scope.restaurantReservations(restaurantId),
		addReservation: (input) => scope.addReservation(input, new Date()),
		cancelReservation: (id) => scope.cancelReservation(id, new Date()),
	};
}
