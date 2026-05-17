import { RestaurantDetailScreen } from "~/features/restaurant/components/RestaurantDetailScreen";
import { HydrateClient, api } from "~/trpc/server";

export default async function RestaurantDetailPage({
	params,
}: {
	params: Promise<{ restaurantId: string }>;
}) {
	const { restaurantId } = await params;

	void api.restaurant.byId.prefetch({ restaurantId });
	void api.restaurant.availability.prefetch({ restaurantId });

	return (
		<HydrateClient>
			<RestaurantDetailScreen restaurantId={restaurantId} />
		</HydrateClient>
	);
}
