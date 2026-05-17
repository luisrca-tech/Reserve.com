"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { toast } from "sonner";

import { useAuth } from "~/features/auth/MockAuthContext";
import { useReservationStoreSnapshot } from "~/features/reservation/components/ReservationStoreContext";
import type { MockReservation } from "~/features/reservation/types";
import type { RestaurantView } from "~/features/restaurant/types";
import { resolveOwnerRestaurant } from "./mappers";
import { buildOwnerSeed, reservationGuest } from "./mock/ownerReservations";
import {
	createNotificationManager,
	type NotificationSink,
	type NotificationTone,
	type OwnerNotification,
} from "./NotificationManager";

const TICK_MS = 20_000;

export type {
	NotificationKind,
	OwnerNotification,
} from "./NotificationManager";

const sonnerSink: NotificationSink = {
	emit(tone: NotificationTone, message: string) {
		if (tone === "success") toast.success(message);
		else if (tone === "warning") toast.warning(message);
		else toast.info(message);
	},
};

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

	const store = useReservationStoreSnapshot();
	const [restaurant, setRestaurant] = useState<RestaurantView>(() =>
		resolveOwnerRestaurant(ownerId),
	);
	const ownerScope = store.owner(restaurant.id);
	const reservations = ownerScope.list();
	const managerRef = useRef(createNotificationManager(sonnerSink));
	const manager = managerRef.current;
	const notifications = useSyncExternalStore(
		manager.subscribe,
		manager.getHistory,
		manager.getHistory,
	);

	// Resolve the managed restaurant + seed demo rows into the shared store
	// once the mock session hydrates from the cookie. Shared client rows are
	// already in the store's initial set; only owner-demo rows are injected.
	useEffect(() => {
		if (!ownerId) return;
		const resolved = resolveOwnerRestaurant(ownerId);
		setRestaurant(resolved);
		store.seedOwner(buildOwnerSeed(resolved, new Date()));
	}, [ownerId, store]);

	// Translate domain transitions/alerts emitted by the pure reducer into
	// owner-facing notification events. No rule logic and no notification
	// plumbing here — the manager owns dedup, tone, and message construction.
	const runTick = useCallback(() => {
		const now = new Date();
		const { nextReservations, transitions, alerts } = store
			.owner(restaurant.id)
			.applyTick(
				{
					restaurantId: restaurant.id,
					tableCount: restaurant.tableCount,
					autoConfirmEnabled: restaurant.autoConfirmEnabled,
					lowTableThreshold: restaurant.lowTableThreshold,
					hoursByWeekday: restaurant.hoursByWeekday,
				},
				now,
			);

		for (const transition of transitions) {
			const target = nextReservations.find((r) => r.id === transition.id);
			if (!target) continue;
			const guest = reservationGuest(target.userId);
			if (transition.to === "expired") {
				manager.notify("expired", target.id, {
					at: now,
					guestName: guest.name,
					time: timeLabel(target.startTime),
				});
			} else if (transition.to === "confirmed") {
				manager.notify("auto", target.id, {
					at: now,
					guestName: guest.name,
				});
			}
		}

		for (const alert of alerts) {
			if (alert.kind === "reminder") {
				const target = nextReservations.find(
					(r) => r.id === alert.reservationId,
				);
				if (!target) continue;
				const guest = reservationGuest(target.userId);
				manager.notify("reminder", alert.reservationId, {
					at: now,
					guestName: guest.name,
					time: timeLabel(target.startTime),
				});
			} else {
				manager.notify("lowTables", String(alert.slotMs), {
					at: now,
					time: timeLabel(alert.startTime),
					remaining: alert.remaining,
				});
			}
		}
	}, [restaurant, manager, store]);

	// In-app clock: a real interval drives the pure lifecycle module.
	useEffect(() => {
		runTick();
		const handle = setInterval(runTick, TICK_MS);
		return () => clearInterval(handle);
	}, [runTick]);

	const validateReservation = useCallback(
		(id: string) => {
			store.owner(restaurant.id).validateReservation(id, new Date());
		},
		[store, restaurant.id],
	);

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
		manager.clear();
	}, [manager]);

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
