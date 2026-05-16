import { ProfileImageUpload } from "~/app/profile-image-upload";
import { RestaurantGalleryUpload } from "~/app/restaurant-gallery-upload";
import { HydrateClient } from "~/trpc/server";

export default function Home() {
	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
					<h1 className="font-bold text-3xl tracking-tight">Media upload</h1>
					<div className="flex w-full max-w-md flex-col items-center gap-8">
						<section className="flex w-full flex-col items-center gap-2">
							<h2 className="text-lg text-white/80">Profile image</h2>
							<ProfileImageUpload />
						</section>
						<section className="flex w-full flex-col items-center gap-2">
							<h2 className="text-lg text-white/80">Restaurant gallery</h2>
							<RestaurantGalleryUpload />
						</section>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
