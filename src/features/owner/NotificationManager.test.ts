import { describe, expect, it, vi } from "vitest";

import { ownerCopy } from "./copy";
import {
	createNotificationManager,
	type NotificationSink,
} from "./NotificationManager";

const AT = new Date("2026-06-02T18:00:00.000Z");

function fakeSink(): NotificationSink & { calls: Array<[string, string]> } {
	const calls: Array<[string, string]> = [];
	return {
		calls,
		emit(tone, message) {
			calls.push([tone, message]);
		},
	};
}

describe("NotificationManager — message construction", () => {
	it("builds each kind's message from ownerCopy", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);

		m.notify("reminder", "r1", { at: AT, guestName: "Ana", time: "19:00" });
		m.notify("expired", "r2", { at: AT, guestName: "Bia", time: "20:00" });
		m.notify("auto", "r3", { at: AT, guestName: "Caio" });
		m.notify("lowTables", "1717351200000", {
			at: AT,
			time: "21:00",
			remaining: 2,
		});

		expect(m.getHistory().map((n) => n.message)).toEqual([
			ownerCopy.notifications.lowTables("21:00", 2),
			ownerCopy.notifications.autoConfirmed("Caio"),
			ownerCopy.notifications.expired("Bia", "20:00"),
			ownerCopy.notifications.reminder("Ana", "19:00"),
		]);
	});
});

describe("NotificationManager — tone/kind mapping", () => {
	it("maps each kind to its tone in history and on the sink", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);

		m.notify("reminder", "r1", { at: AT, guestName: "Ana", time: "19:00" });
		m.notify("expired", "r2", { at: AT, guestName: "Bia", time: "20:00" });
		m.notify("auto", "r3", { at: AT, guestName: "Caio" });
		m.notify("lowTables", "s1", { at: AT, time: "21:00", remaining: 1 });

		const toneByKind = Object.fromEntries(
			m.getHistory().map((n) => [n.kind, n.tone]),
		);
		expect(toneByKind).toEqual({
			reminder: "info",
			expired: "warning",
			auto: "success",
			lowTables: "warning",
		});
		expect(sink.calls.map(([tone]) => tone)).toEqual([
			"info",
			"warning",
			"success",
			"warning",
		]);
	});
});

describe("NotificationManager — dedup across ticks", () => {
	it("ignores a repeated kind+subject and emits the sink only once", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);

		m.notify("expired", "r1", { at: AT, guestName: "Ana", time: "19:00" });
		m.notify("expired", "r1", { at: AT, guestName: "Ana", time: "19:00" });

		expect(m.getHistory()).toHaveLength(1);
		expect(sink.calls).toHaveLength(1);
	});

	it("treats the same subject under different kinds as distinct", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);

		m.notify("reminder", "r1", { at: AT, guestName: "Ana", time: "19:00" });
		m.notify("expired", "r1", { at: AT, guestName: "Ana", time: "19:00" });

		expect(m.getHistory()).toHaveLength(2);
	});

	it("keeps dedup memory after clear (no re-notify of a fired key)", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);

		m.notify("expired", "r1", { at: AT, guestName: "Ana", time: "19:00" });
		m.clear();
		m.notify("expired", "r1", { at: AT, guestName: "Ana", time: "19:00" });

		expect(m.getHistory()).toHaveLength(0);
		expect(sink.calls).toHaveLength(1);
	});
});

describe("NotificationManager — storage / sink substitutability", () => {
	it("clear empties history without touching the sink", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);

		m.notify("auto", "r1", { at: AT, guestName: "Ana" });
		m.clear();

		expect(m.getHistory()).toEqual([]);
		expect(sink.calls).toHaveLength(1);
	});

	it("works with an arbitrary sink implementation", () => {
		const emit = vi.fn();
		const m = createNotificationManager({ emit });

		m.notify("auto", "r1", { at: AT, guestName: "Ana" });

		expect(emit).toHaveBeenCalledWith(
			"success",
			ownerCopy.notifications.autoConfirmed("Ana"),
		);
		expect(m.getHistory()).toHaveLength(1);
	});
});

describe("NotificationManager — subscription", () => {
	it("notifies subscribers on notify and clear, and stops after unsubscribe", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);
		const listener = vi.fn();

		const unsubscribe = m.subscribe(listener);
		m.notify("auto", "r1", { at: AT, guestName: "Ana" });
		m.clear();
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
		m.notify("auto", "r2", { at: AT, guestName: "Bia" });
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("does not notify subscribers for a deduped call", () => {
		const sink = fakeSink();
		const m = createNotificationManager(sink);
		const listener = vi.fn();
		m.subscribe(listener);

		m.notify("expired", "r1", { at: AT, guestName: "Ana", time: "19:00" });
		m.notify("expired", "r1", { at: AT, guestName: "Ana", time: "19:00" });

		expect(listener).toHaveBeenCalledTimes(1);
	});
});
