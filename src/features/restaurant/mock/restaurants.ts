import { OWNER_WITH_RESTAURANT_ID } from "~/features/auth/mock/users";
import type {
	Asset,
	Restaurant,
	RestaurantAvailability,
	RestaurantImage,
} from "~/server/db/schema/types";
import { toRestaurantView } from "../mappers";
import type { RestaurantRecord, RestaurantView } from "../types";
import { mockCategoriesById } from "./categories";

const SEED_DATE = new Date("2026-01-01T12:00:00.000Z");

function imageAsset(id: string, url: string): Asset {
	return {
		id,
		url,
		key: null,
		mimeType: "image/jpeg",
		kind: "image",
		sizeBytes: null,
		uploadedById: null,
		createdAt: SEED_DATE,
	};
}

/** Open `(weekday,hour)` rows for the given weekdays / hour range. */
function availability(
	restaurantId: string,
	weekdays: number[],
	openHour: number,
	closeHour: number,
): RestaurantAvailability[] {
	const rows: RestaurantAvailability[] = [];
	for (const weekday of weekdays) {
		for (let hour = openHour; hour < closeHour; hour++) {
			rows.push({
				id: `avail_${restaurantId}_${weekday}_${hour}`,
				restaurantId,
				weekday,
				hour,
			});
		}
	}
	return rows;
}

interface Seed {
	id: string;
	ownerId: string;
	name: string;
	bio: string;
	address: string;
	phone: string;
	corporateEmail: string;
	categoryId: string;
	tableCount: number;
	weekdays: number[];
	openHour: number;
	closeHour: number;
	imageUrls: string[];
}

const seeds: Seed[] = [
	{
		id: "rest_cantina_bella",
		ownerId: OWNER_WITH_RESTAURANT_ID,
		name: "Cantina Bella",
		bio: "Massas artesanais e vinhos selecionados em um ambiente acolhedor no coração da cidade.",
		address: "Rua das Flores, 123 — São Paulo, SP",
		phone: "(11) 3000-1000",
		corporateEmail: "contato@cantinabella.com",
		categoryId: "cat_italiana",
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
		id: "rest_sushi_kai",
		ownerId: "user_owner_kai",
		name: "Sushi Kai",
		bio: "Omakase contemporâneo com peixes frescos e balcão chef's table.",
		address: "Alameda Lorena, 800 — São Paulo, SP",
		phone: "(11) 3555-2020",
		corporateEmail: "reservas@sushikai.com",
		categoryId: "cat_japonesa",
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
		id: "rest_brasa_viva",
		ownerId: "user_owner_brasa",
		name: "Brasa Viva",
		bio: "Cozinha brasileira de fogo com cortes nobres e acompanhamentos da estação.",
		address: "Av. Paulista, 1500 — São Paulo, SP",
		phone: "(11) 3222-9090",
		corporateEmail: "contato@brasaviva.com",
		categoryId: "cat_brasileira",
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

function buildRecord(seed: Seed): RestaurantRecord {
	const restaurant: Restaurant = {
		id: seed.id,
		ownerId: seed.ownerId,
		name: seed.name,
		corporateEmail: seed.corporateEmail,
		address: seed.address,
		bio: seed.bio,
		phone: seed.phone,
		categoryId: seed.categoryId,
		tableCount: seed.tableCount,
		autoConfirmEnabled: false,
		lowTableThreshold: 5,
		menuAssetId: null,
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	};

	const assets = seed.imageUrls.map((url, i) =>
		imageAsset(`asset_${seed.id}_${i}`, url),
	);
	const images: RestaurantImage[] = assets.map((asset, i) => ({
		id: `img_${seed.id}_${i}`,
		restaurantId: seed.id,
		assetId: asset.id,
		sortOrder: i,
	}));

	const category = mockCategoriesById[seed.categoryId];
	if (!category) {
		throw new Error(`Unknown category ${seed.categoryId}`);
	}

	return {
		restaurant,
		category,
		availability: availability(
			seed.id,
			seed.weekdays,
			seed.openHour,
			seed.closeHour,
		),
		images,
		assets,
		menuAsset: null,
	};
}

export const mockRestaurantRecords: RestaurantRecord[] = seeds.map(buildRecord);

export const mockRestaurantViews: RestaurantView[] =
	mockRestaurantRecords.map(toRestaurantView);

export const mockRestaurantViewsById: Record<string, RestaurantView> =
	Object.fromEntries(mockRestaurantViews.map((r) => [r.id, r]));
