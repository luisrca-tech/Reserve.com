import { RestaurantDetail } from "~/features/restaurant/components/RestaurantDetail";
import { detailCopy } from "~/features/restaurant/copy";
import { mockRestaurantViewsById } from "~/features/restaurant/mock/restaurants";

export default async function RestaurantDetailPage({
	params,
}: {
	params: Promise<{ restaurantId: string }>;
}) {
	const { restaurantId } = await params;
	const restaurant = mockRestaurantViewsById[restaurantId];

	if (!restaurant) {
		return (
			<div className="dashboard-content flex-1 overflow-y-auto">
				<div className="px-4 py-16 text-center text-muted sm:px-8">
					<div className="mb-4 text-5xl">🔍</div>
					<div className="font-semibold text-text">
						{detailCopy.notFoundTitle}
					</div>
					<div className="mt-1 text-sm">{detailCopy.notFoundHint}</div>
				</div>
			</div>
		);
	}

	return <RestaurantDetail restaurant={restaurant} />;
}
