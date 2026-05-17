"use client";

import { Bell, Home, ListChecks, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ProfileDialog } from "~/features/profile/components/ProfileDialog";
import { profileCopy } from "~/features/profile/copy";
import { useSessionState } from "~/features/session/SessionContext";
import { browseCopy } from "../copy";
import { useBrowse } from "./RestaurantBrowseContext";

export function ClientNavbar() {
	const router = useRouter();
	const { user, logout } = useSessionState();
	const {
		query,
		setQuery,
		mobileSearchOpen,
		openMobileSearch,
		closeMobileSearch,
	} = useBrowse();
	const [menuOpen, setMenuOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);

	const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

	function goHome() {
		setQuery("");
		router.push("/restaurants");
	}

	function handleLogout() {
		logout();
		setMenuOpen(false);
		setProfileOpen(false);
		toast.success(browseCopy.logoutSuccess);
		router.push("/");
	}

	function openProfile() {
		setMenuOpen(false);
		setProfileOpen(true);
	}

	const iconBtn =
		"flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-surface2 text-text2 transition-all duration-200 hover:border-accent hover:bg-accent-soft hover:text-accent";

	return (
		<>
			<nav className="sticky top-0 z-[200] flex items-center justify-between gap-4 border-[var(--border)] border-b bg-[rgba(23,23,23,0.92)] px-4 py-4 backdrop-blur-[20px] sm:px-8">
				<button
					className="cursor-pointer font-bold font-serif text-[1.8rem] text-text tracking-[-0.5px]"
					onClick={goHome}
					type="button"
				>
					Re<span className="text-accent">Serve</span>
				</button>

				<div className="relative hidden flex-1 justify-center sm:flex">
					<div className="relative w-full max-w-[450px]">
						<Search
							className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
							size={14}
						/>
						<input
							autoComplete="off"
							className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 py-2 pr-4 pl-9 text-[0.875rem] text-text outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-surface3"
							onChange={(e) => setQuery(e.target.value)}
							placeholder={browseCopy.searchPlaceholder}
							type="text"
							value={query}
						/>
					</div>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					<button
						aria-label={browseCopy.searchPlaceholder}
						className={`${iconBtn} sm:hidden`}
						onClick={openMobileSearch}
						type="button"
					>
						<Search size={16} />
					</button>
					<button
						aria-label={browseCopy.navHome}
						className={`${iconBtn} hidden sm:flex`}
						onClick={goHome}
						title={browseCopy.navHome}
						type="button"
					>
						<Home size={18} />
					</button>
					<button
						aria-label={browseCopy.navHistory}
						className={iconBtn}
						onClick={() => router.push("/history")}
						title={browseCopy.navHistory}
						type="button"
					>
						<ListChecks size={18} />
					</button>
					<button
						aria-label={browseCopy.navNotifications}
						className={`${iconBtn} relative`}
						onClick={() => toast.info(browseCopy.noNotifications)}
						title={browseCopy.navNotifications}
						type="button"
					>
						<Bell size={16} />
						<span className="absolute top-[7px] right-[7px] h-[7px] w-[7px] rounded-full border-2 border-surface bg-accent" />
					</button>
					<div className="relative">
						<button
							aria-label="Perfil"
							className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#c9611c)] font-bold text-[0.9rem] text-white transition-transform duration-200 hover:scale-105"
							onClick={() => setMenuOpen((o) => !o)}
							type="button"
						>
							{initial}
						</button>
						{menuOpen && (
							<>
								<button
									aria-hidden
									className="fixed inset-0 z-[210] cursor-default"
									onClick={() => setMenuOpen(false)}
									tabIndex={-1}
									type="button"
								/>
								<div className="absolute right-0 z-[220] mt-2 w-56 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface p-3 shadow-[var(--shadow)]">
									<div className="border-[var(--border)] border-b px-1 pb-2">
										<div className="font-semibold text-sm text-text">
											{user?.name}
										</div>
										<div className="truncate text-muted text-xs">
											{user?.email}
										</div>
									</div>
									<button
										className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface2"
										onClick={openProfile}
										type="button"
									>
										{profileCopy.trigger}
									</button>
									<button
										className="w-full rounded-md px-3 py-2 text-left text-red text-sm transition-colors hover:bg-red-soft"
										onClick={handleLogout}
										type="button"
									>
										{browseCopy.logout}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			</nav>

			{mobileSearchOpen && (
				<div className="fixed inset-x-0 top-0 z-[300] flex items-center gap-3 border-[var(--border)] border-b bg-surface px-4 py-3 sm:hidden">
					<div className="relative flex-1">
						<Search
							className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
							size={14}
						/>
						<input
							autoComplete="off"
							// biome-ignore lint/a11y/noAutofocus: expected for a search overlay
							autoFocus
							className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 py-2 pr-9 pl-9 text-[0.9rem] text-text outline-none placeholder:text-muted focus:border-accent"
							onChange={(e) => setQuery(e.target.value)}
							placeholder={browseCopy.searchPlaceholder}
							type="text"
							value={query}
						/>
						{query && (
							<button
								aria-label="Limpar"
								className="absolute top-1/2 right-2 -translate-y-1/2 text-muted"
								onClick={() => setQuery("")}
								type="button"
							>
								<X size={16} />
							</button>
						)}
					</div>
					<button
						className="text-accent text-sm"
						onClick={closeMobileSearch}
						type="button"
					>
						{browseCopy.searchCancel}
					</button>
				</div>
			)}

			<ProfileDialog
				onLogout={handleLogout}
				onOpenChange={setProfileOpen}
				open={profileOpen}
			/>
		</>
	);
}
