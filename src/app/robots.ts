import type { MetadataRoute } from "next";

const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://reserve-com.vercel.app";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/owner", "/api"],
		},
		sitemap: `${siteUrl}/sitemap.xml`,
		host: siteUrl,
	};
}
