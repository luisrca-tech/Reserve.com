"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { toast } from "sonner";

import type { RestaurantView } from "~/features/restaurant/types";
import { api } from "~/trpc/react";
import { ownerCopy } from "./copy";
import type { OwnerNotification } from "./NotificationManager";
import { deriveOwnerNotifications } from "./notifications";
import type { OwnerReservationView } from "./types";
import type { UpdateSettingsInput } from "./validation";

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
	/** Reminders / low-capacity warnings derived from the reservation query. */
	notifications: OwnerNotification[];
	setAutoConfirm: (enabled: boolean) => void;
	saveTableCount: (tableCount: number) => void;
	saveSettings: (values: OwnerSettingsUpdate) => void;
	clearNotifications: () => void;
}

const OwnerStoreContext = createContext<OwnerStoreValue | null>(null);

/** The full settings contract from the current view + a partial change. */
function buildInput(
	current: RestaurantView,
	patch: Partial<UpdateSettingsInput>,
): UpdateSettingsInput {
	return {
		name: current.name,
		phone: current.phone,
		bio: current.description,
		autoConfirmEnabled: current.autoConfirmEnabled,
		lowTableThreshold: current.lowTableThreshold,
		tableCount: current.tableCount,
		hoursByWeekday: current.hoursByWeekday,
		...patch,
	};
}

/** The settings change expressed against the `RestaurantView` cache. */
function viewPatch(input: UpdateSettingsInput): Partial<RestaurantView> {
	return {
		name: input.name,
		phone: input.phone,
		description: input.bio,
		autoConfirmEnabled: input.autoConfirmEnabled,
		lowTableThreshold: input.lowTableThreshold,
		tableCount: input.tableCount,
		hoursByWeekday: input.hoursByWeekday,
	};
}

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

	const utils = api.useUtils();
	const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

	// Optimistic per the contract: cancel owner.restaurant in-flight →
	// snapshot → patch the cache to the values the server will return → roll
	// back visibly on error → invalidate the three contract queries on
	// settle (owner's restaurant + that restaurant by id + its availability).
	const update = api.owner.updateSettings.useMutation({
		async onMutate(input) {
			await utils.owner.restaurant.cancel();
			const previous = utils.owner.restaurant.getData();
			utils.owner.restaurant.setData(undefined, (old) =>
				old ? { ...old, ...viewPatch(input) } : old,
			);
			return { previous };
		},
		onError(_error, _input, context) {
			utils.owner.restaurant.setData(undefined, context?.previous);
			toast.error(ownerCopy.settings.saveError);
		},
		async onSettled() {
			const restaurantId = serverRestaurant.id;
			await Promise.all([
				utils.owner.restaurant.invalidate(),
				utils.restaurant.byId.invalidate({ restaurantId }),
				utils.restaurant.availability.invalidate({ restaurantId }),
			]);
		},
	});

	const restaurant = serverRestaurant;

	const setAutoConfirm = useCallback(
		(enabled: boolean) => {
			update.mutate(buildInput(restaurant, { autoConfirmEnabled: enabled }));
		},
		[restaurant, update],
	);

	const saveTableCount = useCallback(
		(tableCount: number) => {
			update.mutate(buildInput(restaurant, { tableCount }));
		},
		[restaurant, update],
	);

	const saveSettings = useCallback(
		(values: OwnerSettingsUpdate) => {
			update.mutate(
				buildInput(restaurant, {
					name: values.name,
					phone: values.phone,
					bio: values.bio,
					hoursByWeekday: values.hoursByWeekday,
				}),
			);
		},
		[restaurant, update],
	);

	const notifications = useMemo(
		() =>
			deriveOwnerNotifications(
				serverReservations,
				serverRestaurant,
				new Date(),
			).filter((n) => !dismissed.has(n.key)),
		[serverReservations, serverRestaurant, dismissed],
	);

	const clearNotifications = useCallback(() => {
		setDismissed(
			(prev) =>
				new Set([
					...prev,
					...deriveOwnerNotifications(
						serverReservations,
						serverRestaurant,
						new Date(),
					).map((n) => n.key),
				]),
		);
	}, [serverReservations, serverRestaurant]);

	const value = useMemo<OwnerStoreValue>(
		() => ({
			restaurant,
			reservations: serverReservations,
			notifications,
			setAutoConfirm,
			saveTableCount,
			saveSettings,
			clearNotifications,
		}),
		[
			restaurant,
			serverReservations,
			notifications,
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
