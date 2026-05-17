import { ownerCopy } from "./copy";

export type NotificationKind = "reminder" | "expired" | "lowTables" | "auto";

/** Semantic severity — drives both the toast channel and the bell color. */
export type NotificationTone = "info" | "success" | "warning";

export interface OwnerNotification {
	key: string;
	kind: NotificationKind;
	tone: NotificationTone;
	message: string;
	at: Date;
}

/** Event payload: identity + the values each message template needs. */
export interface NotificationContext {
	at: Date;
	guestName?: string;
	time?: string;
	remaining?: number;
}

/**
 * Presentation side-effect target. Substitutable on its own: the manager
 * never talks to a toast library directly.
 */
export interface NotificationSink {
	emit(tone: NotificationTone, message: string): void;
}

export interface NotificationManager {
	/** Record a domain event; deduped by `kind` + `subject` across calls. */
	notify(
		kind: NotificationKind,
		subject: string,
		context: NotificationContext,
	): void;
	/** Drop the visible history but keep dedup memory (cross-tick safe). */
	clear(): void;
	getHistory(): OwnerNotification[];
	subscribe(listener: () => void): () => void;
}

const toneByKind: Record<NotificationKind, NotificationTone> = {
	reminder: "info",
	expired: "warning",
	lowTables: "warning",
	auto: "success",
};

function buildMessage(
	kind: NotificationKind,
	context: NotificationContext,
): string {
	const c = ownerCopy.notifications;
	switch (kind) {
		case "reminder":
			return c.reminder(context.guestName ?? "", context.time ?? "");
		case "expired":
			return c.expired(context.guestName ?? "", context.time ?? "");
		case "lowTables":
			return c.lowTables(context.time ?? "", context.remaining ?? 0);
		case "auto":
			return c.autoConfirmed(context.guestName ?? "");
	}
}

/**
 * Owns notification dedup, tone/kind mapping, message construction, and
 * history. The Phase 2 reducer emits domain transitions/alerts; callers
 * translate them into `notify(kind, subject, context)` events here — no
 * low-level push/toast wiring at the call sites. Storage (history) and the
 * toast sink are independently substitutable.
 */
export function createNotificationManager(
	sink: NotificationSink,
): NotificationManager {
	const firedKeys = new Set<string>();
	let history: OwnerNotification[] = [];
	const listeners = new Set<() => void>();

	const emitChange = () => {
		for (const listener of listeners) listener();
	};

	return {
		notify(kind, subject, context) {
			const key = `${kind}:${subject}`;
			if (firedKeys.has(key)) return;
			firedKeys.add(key);

			const tone = toneByKind[kind];
			const notification: OwnerNotification = {
				key,
				kind,
				tone,
				message: buildMessage(kind, context),
				at: context.at,
			};
			history = [notification, ...history];
			sink.emit(tone, notification.message);
			emitChange();
		},
		clear() {
			history = [];
			emitChange();
		},
		getHistory() {
			return history;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}
