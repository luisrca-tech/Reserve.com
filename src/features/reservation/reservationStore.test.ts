import { describe, expect, it } from "vitest";

import type { AvailabilityContext } from "./Availability";
import { createReservationStore } from "./reservationStore";
import type { Reservation } from "./types";

const T0 = new Date("2026-06-02T18:00:00.000Z");

function resv(
	over: Partial<Reservation> & { id: string },
): Reservation {
	const startTime = over.startTime ?? new Date(T0.getTime() + 6 * 3_600_000);
	return {
		userId: "u1",
		restaurantId: "r1",
		startTime,
		endTime: new Date(startTime.getTime() + 3_600_000),
		status: "pending",
		validatedAt: null,
		cancelledAt: null,
		createdAt: new Date(T0),
		partySize: 2,
		tableCount: 1,
		...over,
	};
}

function context(over: Partial<AvailabilityContext> = {}): AvailabilityContext {
	return {
		restaurantId: "r1",
		tableCount: 10,
		autoConfirmEnabled: false,
		lowTableThreshold: 2,
		hoursByWeekday: {},
		...over,
	};
}

describe("createReservationStore — role-scoped filtering", () => {
	it("client scope lists only the user's own reservations", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1" }),
			resv({ id: "b", userId: "u2", restaurantId: "r1" }),
		]);

		const mine = store.client("u1").list();

		expect(mine.map((r) => r.id)).toEqual(["a"]);
	});

	it("client capacity read spans the whole restaurant, not just the user", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1" }),
			resv({ id: "b", userId: "u2", restaurantId: "r1" }),
			resv({ id: "c", userId: "u3", restaurantId: "r2" }),
		]);

		const forCapacity = store.client("u1").restaurantReservations("r1");

		expect(forCapacity.map((r) => r.id)).toEqual(["a", "b"]);
	});

	it("owner scope lists only the restaurant's reservations", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1" }),
			resv({ id: "b", userId: "u2", restaurantId: "r2" }),
		]);

		const owned = store.owner("r1").list();

		expect(owned.map((r) => r.id)).toEqual(["a"]);
	});
});

describe("createReservationStore — single coherent set", () => {
	it("a client-created reservation appears in the owner's list", () => {
		const store = createReservationStore([]);

		store.client("u1").addReservation(
			{
				userId: "u1",
				restaurantId: "r1",
				startTime: new Date(T0.getTime() + 6 * 3_600_000),
				partySize: 2,
				tableCount: 1,
				autoConfirm: false,
			},
			T0,
		);

		const owned = store.owner("r1").list();
		expect(owned).toHaveLength(1);
		expect(owned[0]?.userId).toBe("u1");
		expect(owned[0]?.status).toBe("pending");
	});

	it("auto-confirm lands the new reservation confirmed", () => {
		const store = createReservationStore([]);

		const created = store.client("u1").addReservation(
			{
				userId: "u1",
				restaurantId: "r1",
				startTime: new Date(T0.getTime() + 6 * 3_600_000),
				partySize: 2,
				tableCount: 1,
				autoConfirm: true,
			},
			T0,
		);

		expect(created.status).toBe("confirmed");
		expect(created.validatedAt).toEqual(T0);
	});
});

describe("createReservationStore — role enforcement", () => {
	it("client scope exposes no owner mutations", () => {
		const scope = createReservationStore([]).client("u1");

		expect("validateReservation" in scope).toBe(false);
		expect("applyTick" in scope).toBe(false);
	});

	it("owner scope exposes no client mutations", () => {
		const scope = createReservationStore([]).owner("r1");

		expect("addReservation" in scope).toBe(false);
		expect("cancelReservation" in scope).toBe(false);
	});

	it("client cannot cancel another user's reservation", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u2", restaurantId: "r1" }),
		]);

		store.client("u1").cancelReservation("a", T0);

		expect(store.owner("r1").list()[0]?.status).toBe("pending");
	});

	it("owner cannot validate another restaurant's reservation", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r2", status: "pending" }),
		]);

		store.owner("r1").validateReservation("a", T0);

		expect(store.client("u1").list()[0]?.status).toBe("pending");
	});
});

describe("createReservationStore — owner mutations", () => {
	it("validateReservation moves a pending reservation to confirmed", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1", status: "pending" }),
		]);

		store.owner("r1").validateReservation("a", T0);

		const updated = store.owner("r1").list()[0];
		expect(updated?.status).toBe("confirmed");
		expect(updated?.validatedAt).toEqual(T0);
	});

	it("a client-cancelled reservation disappears from the owner's list", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1" }),
		]);

		store.client("u1").cancelReservation("a", T0);

		expect(store.owner("r1").list()).toEqual([]);
	});

	it("applyTick auto-confirms due reservations and reports transitions", () => {
		const startTime = new Date(T0.getTime() + 6 * 3_600_000);
		const store = createReservationStore([
			resv({
				id: "a",
				userId: "u1",
				restaurantId: "r1",
				status: "pending",
				startTime,
			}),
		]);

		const result = store
			.owner("r1")
			.applyTick(context({ autoConfirmEnabled: true }), T0);

		expect(result.transitions.some((t) => t.to === "confirmed")).toBe(true);
		expect(store.owner("r1").list()[0]?.status).toBe("confirmed");
	});

	it("applyTick leaves other restaurants' reservations untouched", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1", status: "pending" }),
			resv({ id: "b", userId: "u2", restaurantId: "r2", status: "pending" }),
		]);

		store.owner("r1").applyTick(context({ autoConfirmEnabled: true }), T0);

		expect(store.owner("r2").list()[0]?.status).toBe("pending");
	});
});

describe("createReservationStore — Phase 5b: cross-store gaps closed", () => {
	it("an owner-confirmed reservation a client cancels leaves the owner's list", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1", status: "pending" }),
		]);

		store.owner("r1").validateReservation("a", T0);
		expect(store.owner("r1").list()).toHaveLength(1);

		store.client("u1").cancelReservation("a", new Date(T0.getTime() + 1000));

		expect(store.owner("r1").list()).toEqual([]);
	});

	it("owner validation flows through the lifecycle rule, not a blind write", () => {
		const store = createReservationStore([
			resv({ id: "a", userId: "u1", restaurantId: "r1", status: "expired" }),
		]);

		store.owner("r1").validateReservation("a", T0);

		// lifecycle.validate refuses non-pending transitions, so an expired
		// hold is never force-confirmed by the owner action.
		expect(store.owner("r1").list()[0]?.status).toBe("expired");
	});

	it("validating an already-confirmed reservation is idempotent", () => {
		const store = createReservationStore([
			resv({
				id: "a",
				userId: "u1",
				restaurantId: "r1",
				status: "confirmed",
				validatedAt: T0,
			}),
		]);

		store.owner("r1").validateReservation("a", new Date(T0.getTime() + 5000));

		const updated = store.owner("r1").list()[0];
		expect(updated?.status).toBe("confirmed");
		expect(updated?.validatedAt).toEqual(T0);
	});
});

describe("createReservationStore — end-to-end client→owner lifecycle", () => {
	// One coherent set: create (client) → validate (owner, via lifecycle) →
	// cancel (client) → propagates out of the owner's list. No reload, no
	// cross-store desync.
	it("create → owner-validate → client-cancel propagates across roles", () => {
		const store = createReservationStore([]);
		const startTime = new Date(T0.getTime() + 6 * 3_600_000);

		const created = store.client("u1").addReservation(
			{
				userId: "u1",
				restaurantId: "r1",
				startTime,
				partySize: 2,
				tableCount: 1,
				autoConfirm: false,
			},
			T0,
		);
		expect(created.status).toBe("pending");
		expect(store.owner("r1").list()[0]?.id).toBe(created.id);

		store
			.owner("r1")
			.validateReservation(created.id, new Date(T0.getTime() + 1000));
		expect(store.owner("r1").list()[0]?.status).toBe("confirmed");
		expect(store.client("u1").list()[0]?.status).toBe("confirmed");

		store
			.client("u1")
			.cancelReservation(created.id, new Date(T0.getTime() + 2000));
		expect(store.owner("r1").list()).toEqual([]);
		expect(store.client("u1").list()[0]?.status).toBe("cancelled");
	});

	it("create with auto-confirm → owner sees it confirmed → client-cancel propagates", () => {
		const store = createReservationStore([]);

		const created = store.client("u1").addReservation(
			{
				userId: "u1",
				restaurantId: "r1",
				startTime: new Date(T0.getTime() + 6 * 3_600_000),
				partySize: 2,
				tableCount: 1,
				autoConfirm: true,
			},
			T0,
		);
		expect(store.owner("r1").list()[0]?.status).toBe("confirmed");

		store
			.client("u1")
			.cancelReservation(created.id, new Date(T0.getTime() + 1000));
		expect(store.owner("r1").list()).toEqual([]);
	});
});

describe("createReservationStore — seeding and subscription", () => {
	it("seedOwner adds reservations idempotently by id", () => {
		const store = createReservationStore([]);
		const seed = [resv({ id: "s1", restaurantId: "r1" })];

		store.seedOwner(seed);
		store.seedOwner(seed);

		expect(
			store
				.owner("r1")
				.list()
				.map((r) => r.id),
		).toEqual(["s1"]);
	});

	it("notifies subscribers on mutation", () => {
		const store = createReservationStore([]);
		let calls = 0;
		const unsubscribe = store.subscribe(() => {
			calls += 1;
		});

		store.client("u1").addReservation(
			{
				userId: "u1",
				restaurantId: "r1",
				startTime: new Date(T0.getTime() + 6 * 3_600_000),
				partySize: 2,
				tableCount: 1,
				autoConfirm: false,
			},
			T0,
		);
		unsubscribe();
		store.seedOwner([resv({ id: "z", restaurantId: "r1" })]);

		expect(calls).toBe(1);
	});
});
