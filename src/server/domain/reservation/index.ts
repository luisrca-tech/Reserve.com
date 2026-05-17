/**
 * Server-owned pure reservation domain: capacity, availability, lifecycle,
 * reservation-state. No React/context/db dependencies — the server is the
 * booking authority and the client imports the exact same functions from here.
 */

export * from "./Availability";
export * from "./capacity";
export * from "./lifecycle";
export * from "./reservationState";
