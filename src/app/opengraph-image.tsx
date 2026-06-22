import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt =
	"ReServe — Reserve sua mesa nos melhores restaurantes da cidade";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens (mirrors src/styles/globals.css)
const BG = "#0f0f0f";
const ACCENT = "#e07534";
const TEXT = "#f2ede6";
const TEXT2 = "#c4bdb4";

export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				background: BG,
				backgroundImage: `radial-gradient(circle at 80% 0%, rgba(224,117,52,0.18), transparent 55%)`,
				padding: "72px 80px",
				fontFamily: "sans-serif",
			}}
		>
			{/* Top: brand */}
			<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
				<div
					style={{
						width: 56,
						height: 56,
						borderRadius: 16,
						background: ACCENT,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 34,
						fontWeight: 700,
						color: "#ffffff",
					}}
				>
					R
				</div>
				<span style={{ fontSize: 30, fontWeight: 600, color: TEXT }}>
					ReServe
				</span>
			</div>

			{/* Middle: headline */}
			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div
					style={{
						fontSize: 78,
						fontWeight: 700,
						lineHeight: 1.05,
						color: TEXT,
						maxWidth: 900,
					}}
				>
					Reserve sua mesa em <span style={{ color: ACCENT }}>segundos</span>
				</div>
				<div
					style={{
						fontSize: 32,
						color: TEXT2,
						maxWidth: 820,
						lineHeight: 1.35,
					}}
				>
					Encontre os melhores restaurantes, escolha a mesa e agende — sem
					filas, sem espera.
				</div>
			</div>

			{/* Bottom: tags */}
			<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
				{["Restaurantes", "Reservas em tempo real", "Mobile-first"].map(
					(tag) => (
						<div
							key={tag}
							style={{
								display: "flex",
								fontSize: 24,
								color: TEXT2,
								border: `1px solid rgba(224,117,52,0.45)`,
								borderRadius: 999,
								padding: "10px 22px",
							}}
						>
							{tag}
						</div>
					),
				)}
			</div>
		</div>,
		{ ...size },
	);
}
