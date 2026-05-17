import {
	type CapacityReservation,
	isSlotFull,
	openHoursForWeekday,
	remainingTables,
	slotUsage,
} from "./capacity";

/**
 * Capacity-relevant restaurant facts. Deliberately free of React/context
 * types so the same shape can back a future server-side adapter.
 */
export interface AvailabilityContext {
	restaurantId: string;
	tableCount: number;
	autoConfirmEnabled: boolean;
	lowTableThreshold: number;
	/** weekday (0–6) → sorted list of open whole hours (0–23). */
	hoursByWeekday: Record<number, number[]>;
}

/** Rich, intent-level view of a single reservation slot. */
export interface SlotState {
	startTime: Date;
	used: number;
	remaining: number;
	isFull: boolean;
	/** Remaining tables are at or below the restaurant's low-tables threshold. */
	isLow: boolean;
	/** A new booking here would be auto-confirmed (flag on + capacity free). */
	canAutoConfirm: boolean;
	/** Whether `tableCount` tables can still be booked in this slot. */
	canBook: (tableCount: number) => boolean;
}

/** Per-day open hours plus a slot state for each. */
export interface DayUsageReport {
	date: Date;
	openHours: number[];
	slots: SlotState[];
}

export interface Availability {
	slotState: (startTime: Date) => SlotState;
	dayReport: (date: Date) => DayUsageReport;
}

/**
 * The single source of truth for capacity questions. Components ask
 * intent-level questions here instead of re-deriving capacity arithmetic,
 * so client and owner can never disagree on the same slot.
 */
export function createAvailability(
	reservations: CapacityReservation[],
	context: AvailabilityContext,
): Availability {
	function slotState(startTime: Date): SlotState {
		const used = slotUsage(reservations, context.restaurantId, startTime);
		const remaining = remainingTables(
			reservations,
			context.restaurantId,
			startTime,
			context.tableCount,
		);
		const isFull = isSlotFull(
			reservations,
			context.restaurantId,
			startTime,
			context.tableCount,
		);
		return {
			startTime,
			used,
			remaining,
			isFull,
			isLow: remaining <= context.lowTableThreshold,
			canAutoConfirm: context.autoConfirmEnabled && remaining > 0,
			canBook: (tableCount: number) =>
				tableCount >= 1 && tableCount <= remaining,
		};
	}

	function dayReport(date: Date): DayUsageReport {
		const openHours = openHoursForWeekday(
			Object.entries(context.hoursByWeekday).flatMap(([weekday, hours]) =>
				hours.map((hour) => ({ weekday: Number(weekday), hour })),
			),
			date.getUTCDay(),
		);
		const slots = openHours.map((hour) =>
			slotState(
				new Date(
					Date.UTC(
						date.getUTCFullYear(),
						date.getUTCMonth(),
						date.getUTCDate(),
						hour,
					),
				),
			),
		);
		return { date, openHours, slots };
	}

	return { slotState, dayReport };
}
