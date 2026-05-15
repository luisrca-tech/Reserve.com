# PRD — Database Schema & Relations (re-serve)

## Problem Statement

re-serve is a multi-restaurant table-scheduling platform — "like iFood, but only for
reservations." Two kinds of people use it: **clients**, who browse restaurants and book a
date/time, and **restaurant owners**, who manage their restaurant, its capacity, and incoming
bookings from a different dashboard. None of this can be built until the database has a schema
that models users, restaurants, categories, availability, reservations, and uploaded assets —
with the right relations and indexes to support the listing, filtering, booking, and
capacity-alert flows shown in the project flowchart.

Today the repo only has the better-auth scaffold tables (`user`, `session`, `account`,
`verification`) plus a leftover T3 `posts` demo table and an inconsistent table-prefix setup.
There is no domain schema at all.

## Solution

Design and define (Drizzle ORM, PostgreSQL) the complete domain schema for the booking
platform, layered on top of the existing better-auth tables, with relations and a deliberate
index set tuned to the real query paths. This PRD covers **database schema only** — no
backend/tRPC/UI work, no upload mechanics, no auth wiring beyond the schema columns.

Core model:

- One unified `user` table (better-auth managed) with a `role` discriminator
  (`client` | `restaurant_owner`) and a nullable `phone`.
- A `restaurant` table owned 1:1 by a user, holding all registration data and
  operational settings (capacity, alert threshold, auto-confirm).
- A self-growing `category` lookup table (owner picks an existing category or creates one).
- An hourly `restaurant_availability` template keyed by weekday.
- A `reservation` table where every booking is a fixed **1-hour** slot, with a 5-state
  lifecycle and equality-count capacity.
- A generic `asset` table for all uploaded files, linked via a `restaurant_image` join
  table (gallery) and a `restaurant.menuAssetId` FK (menu).

## User Stories

### Accounts & roles

1. As a client, I want to register with name, phone, email, and password, so that I can log in and book restaurants.
2. As a restaurant owner, I want to register with login and password, so that I can access my restaurant dashboard.
3. As the system, I want every user to carry a `role`, so that I can route clients and owners to different dashboards from a single login.
4. As a client, I want my phone number stored, so that the restaurant can contact me about my booking.
5. As a restaurant owner, I want my restaurant's phone number stored, so that clients/staff can communicate about bookings.

### Restaurant registration

6. As a restaurant owner, I want to register my restaurant with name, corporate email, address, and bio, so that clients can find and learn about it.
7. As a restaurant owner, I want to assign a category to my restaurant, so that clients can filter the list by cuisine.
8. As a restaurant owner, I want to create a new category when mine doesn't exist yet, so that I'm not limited to a fixed list.
9. As a restaurant owner, I want to reuse an existing category if it already exists, so that categories don't duplicate.
10. As a restaurant owner, I want to upload 4 or more interior/exterior images, so that clients can see my restaurant.
11. As a restaurant owner, I want to upload a menu as a PDF or an image, so that clients can view what I offer.
12. As a restaurant owner, I want to set the total number of tables, so that the system can compute availability.
13. As a restaurant owner, I want to define which weekdays and hours I'm open, so that clients can only book valid slots.

### Browsing & booking

14. As a client, I want to see a list of restaurants, so that I can choose where to eat.
15. As a client, I want to filter the restaurant list by category, so that I can find the cuisine I want.
15a. As a client, I want to search restaurants by name from the navbar searchbox, so that I can quickly find a specific restaurant.
16. As a client, I want to open a restaurant page, so that I can see its details, images, and menu.
17. As a client, I want to pick a date, so that I can book for a specific day — including dates in future months.
18. As a client, I want to pick an available hour for that date, so that I reserve a real slot.
19. As a client, I want each booking to be exactly 1 hour, so that the model is predictable.
20. As a client, I want to book additional 1-hour slots if tables are still available, so that I can stay longer.
21. As a client, I want to be prevented from booking the exact same restaurant slot twice, so that I don't create duplicates.
22. As a client, I want to see how many tables are still available for a slot, so that I know if I can book.

### Reservation lifecycle

23. As a restaurant owner, I want new bookings to start as `pending`, so that I can validate them.
24. As a restaurant owner, I want to validate a booking so it becomes `confirmed`, so that the table is held.
25. As the system, I want a `pending` booking that isn't validated within 15 minutes to become `expired` and free the table, so that abandoned bookings don't block capacity.
26. As a client, I want to cancel an active booking, so that I free the table when my plans change.
27. As the system, I want bookings whose time has passed to become `completed`, so that they move to history.
28. As a client, I want to see my active bookings separately from my old/cancelled/expired bookings, so that history is clear.
29. As a restaurant owner, I want to enable "auto-confirm", so that new bookings skip manual validation and the 15-minute expiry.

### Capacity alerts

30. As a restaurant owner, I want a configurable low-tables threshold (default 5), so that I'm alerted when capacity runs low.
31. As a restaurant owner, I want the "few tables left" alert derived from a live query, so that it always reflects real availability without stored notification state.
32. As a restaurant owner, I want a "seating ending soon" signal derived from booking end times, so that I can plan turnover.

### Assets

33. As the system, I want all uploaded files in one generic `asset` table, so that images and menus share one storage model.
34. As the system, I want restaurant images linked through a join table with ordering, so that galleries are ordered and support "4 or more".
35. As the system, I want the restaurant menu linked by a single FK to an asset, so that it can be a PDF or an image interchangeably.

## Implementation Decisions

### Identity & roles
- Keep the single better-auth `user` table. Add `role` enum (`client` | `restaurant_owner`) and `phone` (**nullable at DB level**; required for clients enforced in Zod at the app layer, because the better-auth adapter inserts user rows and won't supply `phone`).
- A separate `restaurant` table is owned 1:1 via `ownerId` → `user.id` (`unique`).
- better-auth-managed columns (including `user.image` text) are **not** modified or repointed.

### Restaurant
- Columns: `id` (PK), `ownerId` (FK, unique), `name`, `corporateEmail` (unique), `address` (single `text notNull` — no structured address, no geo features in scope), `bio` (nullable), `phone` (`text notNull`), `categoryId` (FK notNull), `tableCount` (int notNull), `autoConfirmEnabled` (bool notNull default false), `lowTableThreshold` (int notNull default 5), `menuAssetId` (FK → asset, nullable), `createdAt`/`updatedAt` (timestamptz).
- **No `seatingDurationMinutes`** — all reservations are a fixed 1 hour.

### Category
- Lookup table (`id`, `name` unique-normalized, `createdAt`). On restaurant creation: select existing or create-if-not-exists, deduped by normalized name. No enum (so categories grow without migrations). No tags / many-to-many.

### Availability
- `restaurant_availability` table: `(restaurantId FK, weekday, hour)` — an hourly template per weekday. Reservations reference a concrete calendar date; the weekday template only decides which hours are offered, so far-future and cross-month dates work with no advance-day cap.

### Reservation
- Every booking is a fixed **1-hour** slot. `startTime` stored; `endTime = startTime + 1h` stored for easy querying.
- `reservationStatus` enum: `pending`, `confirmed`, `cancelled`, `expired`, `completed`. Plus `validatedAt` and `cancelledAt` (nullable timestamps) for auditing and the 15-minute logic.
- Capacity is an **equality count** (all slots are uniform hourly blocks — no interval-overlap math): `available = tableCount − count(reservations WHERE restaurantId AND date AND startTime = slot AND status IN (pending, confirmed))`. Only `pending` + `confirmed` hold a table.
- Active = `pending`/`confirmed`; history = `cancelled`/`expired`/`completed`.
- `unique(userId, restaurantId, startTime)` blocks duplicate same-slot bookings. Booking additional non-conflicting hours is just additional reservation rows — no special logic.
- Alerts ("few tables left", "seating ending soon") are **query-derived**; there is **no notification table**.

### Assets
- Generic `asset` table: `id`, `url`/storage key, `mimeType` (text), `kind` enum (`image` | `pdf`), `sizeBytes` (nullable), `uploadedById` → `user.id` (nullable), `createdAt`.
- `restaurant_image` join table: `(restaurantId FK, assetId FK, sortOrder)` — one-to-many, ordered. "≥4 images" enforced in **Zod**, not the DB.
- `restaurant.menuAssetId` → single `asset` FK (nullable); `kind` distinguishes PDF vs image.
- **Polymorphic owner columns rejected** — dedicated FKs/join tables for FK integrity and type-safety.

### Index set (confirm on review)
- `restaurant`: `categoryId`; unique `ownerId`; unique `corporateEmail`; `name` (navbar search — see note on substring search below).
- `restaurant_availability`: composite `(restaurantId, weekday)`.
- `reservation`: composite `(restaurantId, startTime, status)` (hot capacity path); `userId`; composite `(status, startTime)` (expiry/completion sweep); unique `(userId, restaurantId, startTime)`.
- `restaurant_image`: `restaurantId`.
- `category`: unique normalized `name`.
- `asset`: `uploadedById` (optional, cleanup/ownership).

### Cleanup
- Delete the leftover T3 `posts` table.
- All new domain tables use plain `pgTable` with **no prefix**, matching the existing better-auth tables.
- Remove the now-incorrect `tablesFilter` from `drizzle.config.ts` (current `re-serve_*` filter would exclude the unprefixed tables; the `pg-drizzle_` prefix in the schema creator is also dropped along with `posts`).

## Out of Scope

- Any backend logic: tRPC routers, services, the 15-minute expiry job, auto-confirm behavior, capacity computation code, alert/notification delivery.
- File upload/storage mechanics (bucket, signed URLs) — only the DB `asset` reference is modeled.
- Frontend/UI changes of any kind.
- better-auth configuration changes beyond schema columns (no provider/role-plugin wiring).
- Email verification: **not used in this app**. The `user.emailVerified` column remains (better-auth-managed, defaults `false`) but is left untouched; verification is simply never enabled in the backend-phase better-auth config — no schema change here.
- Structured address / geolocation / maps.
- Notification persistence and read/seen state.
- Tags / many-to-many cuisine classification.
- Per-table entities, per-reservation custom duration, advance-booking caps.
- **Individual table identity is not modeled.** The flowchart's "número de mesa" booking step is a non-persisted UI/display artifact only — `reservation` stores **no** table number or table reference. Capacity stays a pure integer-count model.
- Migration/seed data authoring (generation/migration run is a follow-up, not part of schema design).

## Further Notes

- Risk: `user.phone` is nullable at the DB to keep the better-auth adapter working; the "clients must have a phone" rule depends entirely on the future Zod/app layer. This is an accepted trade-off, noted here so the backend phase enforces it.
- Risk: "≥4 restaurant images" is likewise Zod-enforced, not DB-enforced (Postgres can't cleanly require ≥4 child rows without triggers, and "or more" rules out fixed columns).
- The 1-hour fixed-slot decision deliberately collapses capacity to a simple equality count; if variable seating durations are ever introduced, capacity must move to interval-overlap logic and `seatingDurationMinutes` returns.
- Category dedupe relies on a normalized-name unique index — normalization rules (trim/lowercase) must be applied consistently by the future create path.
- The index set is the one open item flagged for confirmation at schema-review time; everything else is fully agreed.
- Navbar restaurant search is in MVP scope. A plain B-tree index on `restaurant.name` only accelerates prefix/exact matches; case-insensitive substring search (`ILIKE '%term%'`) needs a `pg_trgm` GIN index. Recommendation for the schema phase: add the `pg_trgm` extension + a GIN trigram index on `restaurant.name`. If keeping the schema minimal is preferred, ship the plain index now and treat trigram as a fast follow — flagged for the index-set review.
- "número de mesa" in the client flow is intentionally **not persisted** (no individual table identity); it is a display-only artifact, consistent with the integer-capacity model.

## Listening

- **What changed:** Created `plans/database-schema.md`, a PRD capturing the agreed database-schema design for the re-serve booking platform. No code or schema files were modified.
- **Key decisions:** Unified better-auth `user` + `role`/nullable `phone`; 1:1 owner→`restaurant`; self-growing `category` table; hourly weekday `restaurant_availability` template; fixed 1-hour `reservation` with 5-state lifecycle and equality-count capacity; generic `asset` table with `restaurant_image` join + `menuAssetId` FK; deliberate index set; drop `posts` and the prefix/`tablesFilter` inconsistency.
- **Alternatives considered & rejected:** separate auth entity for restaurants; cuisine enum; many-to-many tags; individual table entities; client-chosen / owner-configurable seating duration (B-lite); polymorphic asset ownership; notification table; fixed `image1..4` columns; structured address.
- **Risks / follow-ups:** phone-required and ≥4-images rules are app-layer (Zod) only, not DB-enforced; category normalization must be consistent; index set is the single confirm-on-review item; migration/seed authoring and all backend logic are explicitly deferred.
