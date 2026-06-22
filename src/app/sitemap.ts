import type { MetadataRoute } from "next";

const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://reserve-com.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: siteUrl,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${siteUrl}/restaurants`,
			changeFrequency: "daily",
			priority: 0.8,
		},
	];
}
