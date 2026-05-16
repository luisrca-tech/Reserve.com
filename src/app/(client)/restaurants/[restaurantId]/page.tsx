import { PlaceholderScreen } from "~/components/PlaceholderScreen";

export default async function RestaurantDetailPage({
	params,
}: {
	params: Promise<{ restaurantId: string }>;
}) {
	const { restaurantId } = await params;
	return (
		<PlaceholderScreen
			subtitle={`Em breve: galeria, informações e fluxo de reserva do restaurante ${restaurantId} (Fases 2 e 3).`}
			title="Restaurante"
		/>
	);
}
