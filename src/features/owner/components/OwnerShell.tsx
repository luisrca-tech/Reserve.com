"use client";

import {
	CalendarCheck,
	LayoutDashboard,
	Settings,
	Utensils,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ProfileDialog } from "~/features/profile/components/ProfileDialog";
import { ReservationStoreProvider } from "~/features/reservation/components/ReservationStoreContext";
import { useSessionState } from "~/features/session/SessionContext";
import { ownerCopy } from "../copy";
import { OwnerStoreProvider } from "../OwnerStoreContext";
import { NotificationBell } from "./NotificationBell";

const NAV = [
	{
		href: "/owner/overview",
		label: ownerCopy.nav.overview,
		Icon: LayoutDashboard,
	},
	{ href: "/owner/tables", label: ownerCopy.nav.tables, Icon: Utensils },
	{
		href: "/owner/reservations",
		label: ownerCopy.nav.reservations,
		Icon: CalendarCheck,
	},
	{ href: "/owner/settings", label: ownerCopy.nav.settings, Icon: Settings },
] as const;

export function OwnerShell({ children }: { children: React.ReactNode }) {
	return (
		<ReservationStoreProvider>
			<OwnerStoreProvider>
				<OwnerLayout>{children}</OwnerLayout>
			</OwnerStoreProvider>
		</ReservationStoreProvider>
	);
}

function OwnerLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, logout } = useSessionState();
	const [profileOpen, setProfileOpen] = useState(false);

	const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

	function handleLogout() {
		logout();
		setProfileOpen(false);
		toast.success(ownerCopy.profile.logoutSuccess);
		router.push("/");
	}

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	return (
		<div className="flex min-h-screen bg-bg">
			<aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-[var(--border)] border-r bg-surface px-4 py-6 md:flex">
				<div className="px-2 font-bold font-serif text-[1.6rem] text-text tracking-[-0.5px]">
					Re<span className="text-accent">Serve</span>
				</div>
				<div className="mt-1 px-2 text-[0.72rem] text-muted uppercase tracking-wide">
					{ownerCopy.panelLabel}
				</div>
				<nav className="mt-8 flex flex-col gap-1">
					{NAV.map(({ href, label, Icon }) => (
						<Link
							className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[0.9rem] transition-colors ${
								isActive(href)
									? "bg-accent-soft font-semibold text-accent"
									: "text-text2 hover:bg-surface2 hover:text-text"
							}`}
							href={href}
							key={href}
						>
							<Icon size={18} />
							{label}
						</Link>
					))}
				</nav>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-[200] flex items-center justify-between gap-4 border-[var(--border)] border-b bg-[rgba(23,23,23,0.92)] px-4 py-4 backdrop-blur-[20px] sm:px-8">
					<div className="font-bold font-serif text-[1.4rem] text-text md:hidden">
						Re<span className="text-accent">Serve</span>
					</div>
					<div className="hidden text-muted text-sm md:block">
						{ownerCopy.panelLabel}
					</div>
					<div className="flex items-center gap-3">
						<NotificationBell />
						<button
							aria-label={ownerCopy.profile.trigger}
							className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#c9611c)] font-bold text-[0.9rem] text-white transition-transform duration-200 hover:scale-105"
							onClick={() => setProfileOpen(true)}
							type="button"
						>
							{initial}
						</button>
					</div>
				</header>

				<main className="flex-1 pb-24 md:pb-10">{children}</main>
			</div>

			<nav className="fixed inset-x-0 bottom-0 z-[200] flex items-center justify-around border-[var(--border)] border-t bg-[rgba(23,23,23,0.95)] px-2 py-2 backdrop-blur-[20px] md:hidden">
				{NAV.map(({ href, label, Icon }) => (
					<Link
						className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[0.68rem] transition-colors ${
							isActive(href) ? "text-accent" : "text-muted"
						}`}
						href={href}
						key={href}
					>
						<Icon size={20} />
						{label}
					</Link>
				))}
			</nav>

			<ProfileDialog
				onLogout={handleLogout}
				onOpenChange={setProfileOpen}
				open={profileOpen}
			/>
		</div>
	);
}
