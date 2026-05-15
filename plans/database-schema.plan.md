# Plan: Database Schema & Relations (re-serve)

> Source PRD: `plans/database-schema.md`

Schema-only plan (Drizzle ORM + PostgreSQL). No backend/tRPC/UI/upload-mechanics
work. Each phase is a vertical slice through the schema stack — table
definitions + enums + relations + index set — verified end-to-end by
`drizzle-kit generate` producing a clean migration, `tsc` typecheck passing, and
the existing better-auth tables (`user`, `session`, `account`, `verification`)
remaining structurally untouched except for the agreed additive `user` columns.

## Architectural decisions

Durable decisions that apply across all phases:

- **ORM / dialect**: Drizzle ORM, PostgreSQL, schema file `src/server/db/schema.ts`.
- **No table prefix**: all domain tables use plain `pgTable` with no prefix,
  matching the better-auth tables. The `pgTableCreator("pg-drizzle_...")` and
  `tablesFilter: ["re-serve_*"]` in `drizzle.config.ts` are removed.
- **Identity**: single better-auth-managed `user` table; `role` enum
  (`client` | `restaurant_owner`) + nullable `phone` added. better-auth columns
  (incl. `image`, `emailVerified`) not modified or repointed.
- **Key models / tables**: `user` (extended), `restaurant` (1:1 `ownerId` →
  `user.id` unique), `category` (self-growing lookup, normalized-name unique),
  `restaurant_availability` (weekday+hour template), `reservation`
  (fixed 1-hour slot, 5-state lifecycle, equality-count capacity), `asset`
  (generic uploads), `restaurant_image` (ordered gallery join).
- **Enums**: `role`, `reservation_status`
  (`pending` | `confirmed` | `cancelled` | `expired` | `completed`),
  `asset_kind` (`image` | `pdf`).
- **Capacity model**: integer equality count; no individual table identity, no
  interval-overlap math, no notification table.
- **Constraints deferred to app/Zod**: client phone-required, ≥4 restaurant
  images. DB keeps `phone` / image-count nullable/unconstrained.
- **Search**: `pg_trgm` extension + GIN trigram index on `restaurant.name`
  (case-insensitive substring search is in MVP scope).
- **Index set** is the PRD's flagged confirm-on-review item — implemented as
  specified per phase and surfaced for review when each slice lands.

---

## Phase 1: Cleanup & user-role foundation

**User stories**: 1–5; PRD "Cleanup" items.

### What to build

Strip the T3 leftovers and the prefix inconsistency, and extend the better-auth
`user` table so a single login can carry a role and a contact phone. Delete the
`posts` table and the `pg-drizzle_` `pgTableCreator`. Add a `role` Postgres enum
(`client` | `restaurant_owner`) and a nullable `phone` text column to `user`,
without touching any other better-auth-managed column. Remove the now-incorrect
`tablesFilter` from `drizzle.config.ts` so unprefixed domain tables are not
excluded from generation.

### Acceptance criteria

- [ ] `posts` table and `pgTableCreator`/`createTable` export removed; no
      remaining references.
- [ ] `role` enum and nullable `phone` added to `user`; `id`, `email`,
      `emailVerified`, `image`, `createdAt`, `updatedAt` unchanged.
- [ ] `tablesFilter` removed from `drizzle.config.ts`.
- [ ] `drizzle-kit generate` produces a clean migration covering exactly these
      changes; typecheck passes.
- [ ] better-auth tables (`user` base cols, `session`, `account`,
      `verification`) structurally intact.

---

## Phase 2: Restaurant domain (category, restaurant, availability)

**User stories**: 6–13; capacity/threshold settings from 12, 29, 30.

### What to build

The complete restaurant-owner setup slice: a self-growing `category` lookup
(`id`, normalized-unique `name`, `createdAt`); the `restaurant` table owned 1:1
via `ownerId` → `user.id` (unique) with `name`, `corporateEmail` (unique),
`address` (single text), nullable `bio`, `phone`, `categoryId` FK, `tableCount`,
`autoConfirmEnabled` (default false), `lowTableThreshold` (default 5),
`createdAt`/`updatedAt` — `menuAssetId` deferred to Phase 3; and the
`restaurant_availability` weekday/hour template `(restaurantId FK, weekday,
hour)`. Wire Drizzle `relations` (user↔restaurant 1:1, restaurant↔category,
restaurant↔availability) and the index set: `restaurant.categoryId`, unique
`ownerId`, unique `corporateEmail`, plain B-tree on `name`, `pg_trgm` extension
+ GIN trigram index on `name`, composite `(restaurantId, weekday)` on
availability, unique normalized `name` on category.

### Acceptance criteria

- [ ] `category`, `restaurant`, `restaurant_availability` tables defined with
      PRD columns, FKs, defaults, and nullability.
- [ ] 1:1 owner relation enforced by `unique(ownerId)`; relations defined for
      all three tables.
- [ ] All Phase-2 indexes present, including `pg_trgm` extension + GIN trigram
      index on `restaurant.name`.
- [ ] `drizzle-kit generate` migration is clean; typecheck passes.
- [ ] Index set surfaced in the change summary for review.

---

## Phase 3: Reservation lifecycle & assets

**User stories**: 14–35.

### What to build

The booking + uploads slice. `reservation` table: `userId` FK, `restaurantId`
FK, stored `startTime` and `endTime` (= start + 1h), `reservationStatus` enum
(`pending`|`confirmed`|`cancelled`|`expired`|`completed`), nullable
`validatedAt`/`cancelledAt`, `createdAt`; `unique(userId, restaurantId,
startTime)` to block duplicate same-slot bookings; capacity/sweep indexes
`(restaurantId, startTime, status)`, `userId`, `(status, startTime)`. Generic
`asset` table (`id`, url/storage key, `mimeType`, `kind` enum `image`|`pdf`,
nullable `sizeBytes`, nullable `uploadedById` → `user.id`, `createdAt`) with
optional `uploadedById` index. `restaurant_image` join table `(restaurantId FK,
assetId FK, sortOrder)` with `restaurantId` index. Add the deferred
`restaurant.menuAssetId` FK → `asset` (nullable). Wire all relations
(reservation↔user/restaurant, asset↔uploader, restaurant↔images, restaurant↔menu
asset).

### Acceptance criteria

- [x] `reservation`, `asset`, `restaurant_image` tables + `reservation_status`
      and `asset_kind` enums defined per PRD.
- [x] `restaurant.menuAssetId` nullable FK added; gallery join carries
      `sortOrder`.
- [x] `unique(userId, restaurantId, startTime)` and all reservation/asset
      indexes present.
- [x] All relations defined; FK integrity (no polymorphic columns).
- [x] `drizzle-kit generate` migration is clean; typecheck passes; full schema
      (all phases) generates without conflicts.
