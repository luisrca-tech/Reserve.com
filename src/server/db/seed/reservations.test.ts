import { describe, expect, it } from "vitest";
import {
	buildReservationSpecs,
	resolveReservationWindow,
} from "./reservations";

const CANTINA_SLUG = "rest_cantina_bella";

describe("reservation specs", () => {
	it("creates the client reservations covering every required status", () => {
		const specs = buildReservationSpecs();
		expect(specs.length).toBeGreaterThanOrEqual(8);

		const statuses = new Set(specs.map((s) => s.status));
		expect(statuses.has("pending")).toBe(true);
		expect(statuses.has("confirmed")).toBe(true);
		expect(statuses.has("cancelled")).toBe(true);
	});

	it("spans both past and upcoming time windows", () => {
		const specs = buildReservationSpecs();
		expect(specs.some((s) => s.dayOffset < 0)).toBe(true);
		expect(specs.some((s) => s.dayOffset > 0)).toBe(true);
	});

	it("targets Cantina Bella at least once", () => {
		const specs = buildReservationSpecs();
		expect(specs.some((s) => s.restaurantSlug === CANTINA_SLUG)).toBe(true);
	});

	it("has unique slugs and a unique (restaurant, day, hour) identity", () => {
		const specs = buildReservationSpecs();

		const slugs = specs.map((s) => s.slug);
		expect(new Set(slugs).size).toBe(slugs.length);

		const identity = specs.map(
			(s) => `${s.restaurantSlug}|${s.dayOffset}|${s.hour}`,
		);
		expect(new Set(identity).size).toBe(identity.length);
	});

	it("resolves a window anchored to the given now with end after start", () => {
		const now = new Date("2026-05-17T15:30:00.000Z");
		const { startTime, endTime } = resolveReservationWindow(
			{
				slug: "resv_x",
				restaurantSlug: CANTINA_SLUG,
				status: "pending",
				dayOffset: 2,
				hour: 20,
				durationMinutes: 90,
				partySize: 4,
				tableCount: 2,
			},
			now,
		);

		expect(endTime.getTime()).toBeGreaterThan(startTime.getTime());
		expect(endTime.getTime() - startTime.getTime()).toBe(90 * 60_000);
		expect(startTime.getHours()).toBe(20);
		expect(startTime.getMinutes()).toBe(0);
	});

	it("carries realistic party size and table count on every spec", () => {
		const specs = buildReservationSpecs();
		for (const spec of specs) {
			expect(spec.partySize).toBeGreaterThanOrEqual(1);
			expect(spec.tableCount).toBeGreaterThanOrEqual(1);
			expect(spec.tableCount).toBeLessThanOrEqual(spec.partySize);
		}
		expect(new Set(specs.map((s) => s.partySize)).size).toBeGreaterThan(1);
	});

	it("is deterministic across separate builder calls", () => {
		expect(JSON.stringify(buildReservationSpecs())).toBe(
			JSON.stringify(buildReservationSpecs()),
		);
	});
});
