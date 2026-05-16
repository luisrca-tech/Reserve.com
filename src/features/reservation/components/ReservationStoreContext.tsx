"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

import { mockReservations } from "../mock/reservations";
import type { MockReservation } from "../types";

interface NewReservationInput {
	userId: string;
	restaurantId: string;
	startTime: Date;
	partySize: number;
	tableCount: number;
	/** When the restaurant auto-confirms, the booking lands confirmed. */
	autoConfirm: boolean;
}

interface ReservationStoreValue {
	reservations: MockReservation[];
	addReservation: (input: NewReservationInput) => MockReservation;
}

const ReservationStoreContext = createContext<ReservationStoreValue | null>(
	null,
);

let sequence = 0;

export function ReservationStoreProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [reservations, setReservations] =
		useState<MockReservation[]>(mockReservations);

	const addReservation = useCallback((input: NewReservationInput) => {
		const now = new Date();
		const endTime = new Date(input.startTime.getTime() + 60 * 60 * 1000);
		const status = input.autoConfirm ? "confirmed" : "pending";
		sequence += 1;
		const reservation: MockReservation = {
			id: `resv_new_${sequence}`,
			userId: input.userId,
			restaurantId: input.restaurantId,
			startTime: input.startTime,
			endTime,
			status,
			validatedAt: input.autoConfirm ? now : null,
			cancelledAt: null,
			createdAt: now,
			partySize: input.partySize,
			tableCount: input.tableCount,
		};
		setReservations((prev) => [reservation, ...prev]);
		return reservation;
	}, []);

	const value = useMemo<ReservationStoreValue>(
		() => ({ reservations, addReservation }),
		[reservations, addReservation],
	);

	return (
		<ReservationStoreContext.Provider value={value}>
			{children}
		</ReservationStoreContext.Provider>
	);
}

export function useReservationStore(): ReservationStoreValue {
	const ctx = useContext(ReservationStoreContext);
	if (!ctx) {
		throw new Error(
			"useReservationStore must be used within a ReservationStoreProvider",
		);
	}
	return ctx;
}
