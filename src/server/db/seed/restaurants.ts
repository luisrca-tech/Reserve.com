import { faker } from "@faker-js/faker";
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "../schema";
import {
	asset,
	restaurant,
	restaurantAvailability,
	restaurantImage,
	user,
} from "../schema";
import { slugToUuid } from "./slugToUuid";
import { FIXED_RESTAURANT_OWNER_SLUGS, OWNER_ACCOUNT_EMAIL } from "./users";

type Database = PostgresJsDatabase<typeof schema>;
type Role = (typeof schema.user.role.enumValues)[number];

/** Number of deterministic faker restaurants generated on top of the fixed 3. */
export const FAKER_RESTAURANT_COUNT = 25;

/** Fixed faker seed — guarantees identical generated data across runs. */
const FAKER_SEED = 20260517;

type OwnerRef =
	| { kind: "email"; email: string }
	| { kind: "slug"; slug: string };

interface DataOnlyOwner {
	slug: string;
	name: string;
	email: string;
	role: Role;
	phone: string;
}

export interface RestaurantSpec {
	slug: string;
	owner: OwnerRef;
	/** Present when the owner is a faker-generated data-only user this seeder must create. */
	ownerUser?: DataOnlyOwner;
	name: string;
	bio: string;
	address: string;
	phone: string;
	corporateEmail: string;
	categorySlug: string;
	tableCount: number;
	weekdays: number[];
	openHour: number;
	closeHour: number;
	imageUrls: string[];
}

const FAKER_CATEGORY_SLUGS = [
	"cat_italiana",
	"cat_japonesa",
	"cat_brasileira",
	"cat_contemporanea",
] as const;

/**
 * Curated Unsplash pool for faker restaurants. The seed owns this copy; it
 * never imports from `src/features/*​/mock`.
 */
const UNSPLASH_IMAGE_POOL = [
	"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
	"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900",
	"https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=900",
	"https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900",
	"https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900",
	"https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=900",
	"https://images.unsplash.com/photo-1553621042-f6e147245754?w=900",
	"https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=900",
	"https://images.unsplash.com/photo-1544025162-d76694265947?w=900",
	"https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=900",
	"https://images.unsplash.com/photo-1600891964092-4316c288032e?w=900",
	"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900",
] as const;

/** Brazilian mobile format `(11) 9 XXXX-XXXX` from an 8-digit string. */
function formatMobilePhone(eightDigits: string): string {
	return `(11) 9 ${eightDigits.slice(0, 4)}-${eightDigits.slice(4, 8)}`;
}

export function buildFixedRestaurantSpecs(): RestaurantSpec[] {
	return [
		{
			slug: "rest_cantina_bella",
			owner: { kind: "email", email: OWNER_ACCOUNT_EMAIL },
			name: "Cantina Bella",
			bio: "Massas artesanais e vinhos selecionados em um ambiente acolhedor no coração da cidade.",
			address: "Rua das Flores, 123 — São Paulo, SP",
			phone: "(11) 3000-1000",
			corporateEmail: "contato@cantinabella.com",
			categorySlug: "cat_italiana",
			tableCount: 14,
			weekdays: [2, 3, 4, 5, 6],
			openHour: 18,
			closeHour: 23,
			imageUrls: [
				"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
				"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900",
				"https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=900",
				"https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900",
			],
		},
		{
			slug: "rest_sushi_kai",
			owner: { kind: "slug", slug: FIXED_RESTAURANT_OWNER_SLUGS.sushiKai },
			name: "Sushi Kai",
			bio: "Omakase contemporâneo com peixes frescos e balcão chef's table.",
			address: "Alameda Lorena, 800 — São Paulo, SP",
			phone: "(11) 3555-2020",
			corporateEmail: "reservas@sushikai.com",
			categorySlug: "cat_japonesa",
			tableCount: 10,
			weekdays: [1, 2, 3, 4, 5, 6],
			openHour: 19,
			closeHour: 23,
			imageUrls: [
				"https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900",
				"https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=900",
				"https://images.unsplash.com/photo-1553621042-f6e147245754?w=900",
				"https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=900",
			],
		},
		{
			slug: "rest_brasa_viva",
			owner: {
				kind: "slug",
				slug: FIXED_RESTAURANT_OWNER_SLUGS.brasaViva,
			},
			name: "Brasa Viva",
			bio: "Cozinha brasileira de fogo com cortes nobres e acompanhamentos da estação.",
			address: "Av. Paulista, 1500 — São Paulo, SP",
			phone: "(11) 3222-9090",
			corporateEmail: "contato@brasaviva.com",
			categorySlug: "cat_brasileira",
			tableCount: 20,
			weekdays: [3, 4, 5, 6, 0],
			openHour: 12,
			closeHour: 22,
			imageUrls: [
				"https://images.unsplash.com/photo-1544025162-d76694265947?w=900",
				"https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=900",
				"https://images.unsplash.com/photo-1600891964092-4316c288032e?w=900",
				"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900",
			],
		},
	];
}

export function buildFakerRestaurantSpecs(): RestaurantSpec[] {
	faker.seed(FAKER_SEED);
	const specs: RestaurantSpec[] = [];

	for (let i = 0; i < FAKER_RESTAURANT_COUNT; i++) {
		const index = i + 1;
		const name = `${faker.company.name()} ${faker.helpers.arrayElement([
			"Bistrô",
			"Cozinha",
			"Restaurante",
			"Casa",
			"Mesa",
		])}`;
		const ownerName = faker.person.fullName();
		const ownerSlug = `user_faker_owner_${index}`;
		const restaurantSlug = `rest_faker_${index}`;
		const ownerPhone = formatMobilePhone(faker.string.numeric(8));
		const restaurantPhone = formatMobilePhone(faker.string.numeric(8));
		const openHour = faker.number.int({ min: 11, max: 18 });
		const closeHour = openHour + faker.number.int({ min: 3, max: 6 });
		const weekdays = faker.helpers
			.arrayElements([0, 1, 2, 3, 4, 5, 6], { min: 3, max: 7 })
			.sort((a, b) => a - b);
		const imageCount = faker.number.int({ min: 2, max: 4 });
		const imageUrls = faker.helpers.arrayElements(
			[...UNSPLASH_IMAGE_POOL],
			imageCount,
		);

		specs.push({
			slug: restaurantSlug,
			owner: { kind: "slug", slug: ownerSlug },
			ownerUser: {
				slug: ownerSlug,
				name: ownerName,
				email: `faker.owner.${index}@reserve.test`,
				role: "restaurant_owner",
				phone: ownerPhone,
			},
			name,
			bio: faker.lorem.sentence({ min: 10, max: 18 }),
			address: `${faker.location.streetAddress()} — São Paulo, SP`,
			phone: restaurantPhone,
			corporateEmail: `contato${index}@reserve.test`,
			categorySlug: faker.helpers.arrayElement(FAKER_CATEGORY_SLUGS),
			tableCount: faker.number.int({ min: 6, max: 30 }),
			weekdays,
			openHour,
			closeHour,
			imageUrls,
		});
	}

	return specs;
}

async function resolveOwnerId(
	db: Database,
	spec: RestaurantSpec,
): Promise<string> {
	if (spec.owner.kind === "slug") {
		return slugToUuid(spec.owner.slug);
	}
	const [row] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, spec.owner.email))
		.limit(1);
	if (!row) {
		throw new Error(
			`Owner account ${spec.owner.email} not found. Run the users seeder first.`,
		);
	}
	return row.id;
}

export async function seedRestaurants(db: Database): Promise<void> {
	const specs = [
		...buildFixedRestaurantSpecs(),
		...buildFakerRestaurantSpecs(),
	];

	const fakerOwners = specs
		.map((s) => s.ownerUser)
		.filter((o): o is DataOnlyOwner => o !== undefined)
		.map((o) => ({
			id: slugToUuid(o.slug),
			name: o.name,
			email: o.email,
			emailVerified: true,
			role: o.role,
			phone: o.phone,
		}));

	if (fakerOwners.length > 0) {
		await db
			.insert(user)
			.values(fakerOwners)
			.onConflictDoUpdate({
				target: user.id,
				set: {
					name: sql`excluded.name`,
					email: sql`excluded.email`,
					role: sql`excluded.role`,
					phone: sql`excluded.phone`,
					updatedAt: new Date(),
				},
			});
	}

	for (const spec of specs) {
		const restaurantId = slugToUuid(spec.slug);
		const ownerId = await resolveOwnerId(db, spec);

		await db
			.insert(restaurant)
			.values({
				id: restaurantId,
				ownerId,
				name: spec.name,
				corporateEmail: spec.corporateEmail,
				address: spec.address,
				bio: spec.bio,
				phone: spec.phone,
				categoryId: slugToUuid(spec.categorySlug),
				tableCount: spec.tableCount,
			})
			.onConflictDoUpdate({
				target: restaurant.id,
				set: {
					name: sql`excluded.name`,
					corporateEmail: sql`excluded.corporate_email`,
					address: sql`excluded.address`,
					bio: sql`excluded.bio`,
					phone: sql`excluded.phone`,
					categoryId: sql`excluded.category_id`,
					tableCount: sql`excluded.table_count`,
					updatedAt: new Date(),
				},
			});

		const availabilityRows = spec.weekdays.flatMap((weekday) => {
			const rows = [];
			for (let hour = spec.openHour; hour < spec.closeHour; hour++) {
				rows.push({
					id: slugToUuid(`avail_${spec.slug}_${weekday}_${hour}`),
					restaurantId,
					weekday,
					hour,
				});
			}
			return rows;
		});

		await db
			.insert(restaurantAvailability)
			.values(availabilityRows)
			.onConflictDoNothing({ target: restaurantAvailability.id });

		const assetRows = spec.imageUrls.map((url, i) => ({
			id: slugToUuid(`asset_${spec.slug}_${i}`),
			url,
			mimeType: "image/jpeg",
			kind: "image" as const,
		}));

		await db
			.insert(asset)
			.values(assetRows)
			.onConflictDoUpdate({
				target: asset.id,
				set: { url: sql`excluded.url` },
			});

		const imageRows = assetRows.map((a, i) => ({
			id: slugToUuid(`img_${spec.slug}_${i}`),
			restaurantId,
			assetId: a.id,
			sortOrder: i,
		}));

		await db
			.insert(restaurantImage)
			.values(imageRows)
			.onConflictDoUpdate({
				target: restaurantImage.id,
				set: {
					assetId: sql`excluded.asset_id`,
					sortOrder: sql`excluded.sort_order`,
				},
			});
	}

	console.log(
		`  restaurants: ${specs.length} upserted (${fakerOwners.length} faker owners)`,
	);
}
