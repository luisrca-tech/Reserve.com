"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

import { useAuth } from "~/features/auth/MockAuthContext";
import { mockReservations } from "~/features/reservation/mock/reservations";
import { reservationState } from "~/features/reservation/reservationState";
import type { MockReservation } from "~/features/reservation/types";
import type { RestaurantView } from "~/features/restaurant/types";
import { ownerCopy } from "./copy";
import { resolveOwnerRestaurant } from "./mappers";
import { buildOwnerSeed, reservationGuest } from "./mock/ownerReservations";

const TICK_MS = 20_000;

export type NotificationKind = "reminder" | "expired" | "lowTables" | "auto";

export interface OwnerNotification {
	key: string;
	kind: NotificationKind;
	message: string;
	at: Date;
}

/** Editable subset of the restaurant managed from Configurações. */
export interface OwnerSettingsUpdate {
	name: string;
	phone: string;
	bio: string;
	hoursByWeekday: Record<number, number[]>;
}

interface OwnerStoreValue {
	restaurant: RestaurantView;
	reservations: MockReservation[];
	notifications: OwnerNotification[];
	validateReservation: (id: string) => void;
	setAutoConfirm: (enabled: boolean) => void;
	saveTableCount: (tableCount: number) => void;
	saveSettings: (values: OwnerSettingsUpdate) => void;
	clearNotifications: () => void;
}

const OwnerStoreContext = createContext<OwnerStoreValue | null>(null);

function timeLabel(date: Date): string {
	return `${String(date.getUTCHours()).padStart(2, "0")}:00`;
}

export function OwnerStoreProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = useAuth();
	const ownerId = user?.id ?? "";

	const [restaurant, setRestaurant] = useState<RestaurantView>(() =>
		resolveOwnerRestaurant(ownerId),
	);
	const [reservations, setReservations] = useState<MockReservation[]>([]);
	const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
	const firedKeys = useRef<Set<string>>(new Set());

	// Resolve the managed restaurant + seed reservations once the mock
	// session hydrates from the cookie.
	useEffect(() => {
		if (!ownerId) return;
		const resolved = resolveOwnerRestaurant(ownerId);
		setRestaurant(resolved);
		const now = new Date();
		const shared = mockReservations.filter(
			(r) => r.restaurantId === resolved.id,
		);
		setReservations([...buildOwnerSeed(resolved, now), ...shared]);
	}, [ownerId]);

	const pushNotification = useCallback(
		(notification: OwnerNotification, toastFn: (msg: string) => void) => {
			if (firedKeys.current.has(notification.key)) return;
			firedKeys.current.add(notification.key);
			setNotifications((prev) => [notification, ...prev]);
			toastFn(notification.message);
		},
		[],
	);

	// Translate domain transitions/alerts emitted by the pure reducer into
	// owner-facing notifications. No rule logic lives here.
	const runTick = useCallback(() => {
		const now = new Date();
		setReservations((prev) => {
			const { nextReservations, transitions, alerts } = reservationState({
				reservations: prev,
				restaurant: {
					restaurantId: restaurant.id,
					tableCount: restaurant.tableCount,
					autoConfirmEnabled: restaurant.autoConfirmEnabled,
					lowTableThreshold: restaurant.lowTableThreshold,
					hoursByWeekday: restaurant.hoursByWeekday,
				},
				now,
			});

			for (const transition of transitions) {
				const target = prev.find((r) => r.id === transition.id);
				if (!target) continue;
				const guest = reservationGuest(target.userId);
				if (transition.to === "expired") {
					pushNotification(
						{
							key: `expired:${target.id}`,
							kind: "expired",
							message: ownerCopy.notifications.expired(
								guest.name,
								timeLabel(target.startTime),
							),
							at: now,
						},
						toast.warning,
					);
				} else if (transition.to === "confirmed") {
					pushNotification(
						{
							key: `auto:${target.id}`,
							kind: "auto",
							message: ownerCopy.notifications.autoConfirmed(guest.name),
							at: now,
						},
						toast.success,
					);
				}
			}

			for (const alert of alerts) {
				if (alert.kind === "reminder") {
					const target = nextReservations.find(
						(r) => r.id === alert.reservationId,
					);
					if (!target) continue;
					const guest = reservationGuest(target.userId);
					pushNotification(
						{
							key: `reminder:${alert.reservationId}`,
							kind: "reminder",
							message: ownerCopy.notifications.reminder(
								guest.name,
								timeLabel(target.startTime),
							),
							at: now,
						},
						toast.info,
					);
				} else {
					pushNotification(
						{
							key: `low:${alert.slotMs}`,
							kind: "lowTables",
							message: ownerCopy.notifications.lowTables(
								timeLabel(alert.startTime),
								alert.remaining,
							),
							at: now,
						},
						toast.warning,
					);
				}
			}

			return nextReservations;
		});
	}, [restaurant, pushNotification]);

	// In-app clock: a real interval drives the pure lifecycle module.
	useEffect(() => {
		runTick();
		const handle = setInterval(runTick, TICK_MS);
		return () => clearInterval(handle);
	}, [runTick]);

	const validateReservation = useCallback((id: string) => {
		const now = new Date();
		setReservations((prev) =>
			prev.map((r) =>
				r.id === id && r.status === "pending"
					? { ...r, status: "confirmed", validatedAt: now }
					: r,
			),
		);
	}, []);

	const setAutoConfirm = useCallback((enabled: boolean) => {
		setRestaurant((prev) => ({ ...prev, autoConfirmEnabled: enabled }));
	}, []);

	const saveTableCount = useCallback((tableCount: number) => {
		setRestaurant((prev) => ({ ...prev, tableCount }));
	}, []);

	const saveSettings = useCallback((values: OwnerSettingsUpdate) => {
		setRestaurant((prev) => ({
			...prev,
			name: values.name,
			phone: values.phone,
			description: values.bio,
			hoursByWeekday: values.hoursByWeekday,
		}));
	}, []);

	const clearNotifications = useCallback(() => {
		setNotifications([]);
	}, []);

	const value = useMemo<OwnerStoreValue>(
		() => ({
			restaurant,
			reservations,
			notifications,
			validateReservation,
			setAutoConfirm,
			saveTableCount,
			saveSettings,
			clearNotifications,
		}),
		[
			restaurant,
			reservations,
			notifications,
			validateReservation,
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
