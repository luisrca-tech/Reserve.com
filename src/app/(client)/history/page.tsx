import { ReservationHistory } from "~/features/reservation/components/ReservationHistory";
import { api, HydrateClient } from "~/trpc/server";

export default function HistoryPage() {
	void api.reservation.list.prefetch();

	return (
		<HydrateClient>
			<ReservationHistory />
		</HydrateClient>
	);
}
