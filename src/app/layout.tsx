import "~/styles/globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";

import { Toaster } from "~/components/ui/sonner";
import { SessionProvider } from "~/features/session/SessionContext";
import { TRPCReactProvider } from "~/trpc/react";

const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://reserve-com.vercel.app";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: "ReServe — Reserve sua mesa em segundos",
		template: "%s · ReServe",
	},
	description:
		"ReServe é a plataforma de reservas inteligentes para restaurantes: encontre os melhores restaurantes da cidade, escolha sua mesa em tempo real e agende em segundos — sem filas, sem espera.",
	applicationName: "ReServe",
	keywords: [
		"reserva de restaurante",
		"reservar mesa",
		"restaurantes",
		"agendamento de mesa",
		"reserva online",
		"ReServe",
	],
	authors: [{ name: "ReServe" }],
	category: "food",
	alternates: { canonical: "/" },
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon.ico",
		apple: "/favicon.ico",
	},
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: siteUrl,
		siteName: "ReServe",
		title: "ReServe — Reserve sua mesa em segundos",
		description:
			"Encontre os melhores restaurantes da cidade, escolha sua mesa em tempo real e agende em segundos — sem filas, sem espera.",
		images: [
			{
				url: "/opengraph-image.png",
				width: 1200,
				height: 630,
				alt: "ReServe — Reserve sua mesa nos melhores restaurantes da cidade",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "ReServe — Reserve sua mesa em segundos",
		description:
			"Encontre os melhores restaurantes, escolha a mesa e agende — sem filas, sem espera.",
		images: ["/opengraph-image.png"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: { index: true, follow: true },
	},
};

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-cormorant",
});

const outfit = Outfit({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-outfit",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${cormorant.variable} ${outfit.variable}`} lang="pt-BR">
			<body className="bg-bg text-text antialiased">
				<TRPCReactProvider>
					<SessionProvider>{children}</SessionProvider>
				</TRPCReactProvider>
				<Toaster />
			</body>
		</html>
	);
}
