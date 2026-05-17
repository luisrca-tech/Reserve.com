import { RestaurantBrowse } from "~/features/restaurant/components/RestaurantBrowse";
import { HydrateClient, api } from "~/trpc/server";

export default function RestaurantsPage() {
	void api.restaurant.list.prefetch();
	void api.category.list.prefetch();

	return (
		<HydrateClient>
			<RestaurantBrowse />
		</HydrateClient>
	);
}
