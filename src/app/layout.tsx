import "~/styles/globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";

import { Toaster } from "~/components/ui/sonner";
import { AuthProvider } from "~/features/auth/MockAuthContext";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "ReServe — Reserve sua mesa",
	description: "Reserve mesas nos melhores restaurantes da cidade em segundos.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
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
					<AuthProvider>{children}</AuthProvider>
				</TRPCReactProvider>
				<Toaster />
			</body>
		</html>
	);
}
