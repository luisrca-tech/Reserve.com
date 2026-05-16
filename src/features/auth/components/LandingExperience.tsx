"use client";

import { LogIn, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import { Textarea } from "~/components/ui/Textarea";
import { authCopy, landingCopy } from "../copy";
import { redirectPathFor, useAuth } from "../MockAuthContext";
import type { SeededUserKey } from "../types";

type DialogId = "login" | "loginRestaurant" | "register" | null;

export function LandingExperience() {
	const router = useRouter();
	const { loginAs } = useAuth();
	const [openDialog, setOpenDialog] = useState<DialogId>(null);
	const [registerTab, setRegisterTab] = useState<"client" | "restaurant">(
		"client",
	);

	function authenticate(key: SeededUserKey, successMessage: string) {
		try {
			const user = loginAs(key);
			toast.success(successMessage);
			setOpenDialog(null);
			router.push(redirectPathFor(user));
		} catch {
			toast.error(authCopy.genericError);
		}
	}

	function openRegister(tab: "client" | "restaurant") {
		setRegisterTab(tab);
		setOpenDialog("register");
	}

	return (
		<div className="flex min-h-screen flex-col">
			<nav className="sticky top-0 z-[200] flex items-center justify-between border-transparent border-b px-8 py-4">
				<div className="cursor-pointer font-bold font-serif text-[1.8rem] text-text tracking-[-0.5px]">
					{landingCopy.brandPrefix}
					<span className="text-accent">{landingCopy.brandSuffix}</span>
				</div>
				<div className="flex items-center gap-3">
					<Button onClick={() => setOpenDialog("login")} size="sm">
						{landingCopy.navLogin}
					</Button>
					<Button onClick={() => openRegister("client")} size="sm">
						{landingCopy.navRegister}
					</Button>
				</div>
			</nav>

			<section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-16 text-center">
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(ellipse at 50% 0%, rgba(224, 117, 52, 0.12) 0%, transparent 60%)",
					}}
				/>
				<div className="relative z-[1]">
					<div className="mb-6 inline-flex items-center gap-2 rounded-[20px] border border-[rgba(224,117,52,0.25)] bg-accent-soft px-4 py-[0.35rem] font-semibold text-[0.8rem] text-accent uppercase tracking-[0.05em]">
						<span className="inline-block h-[6px] w-[6px] rounded-full bg-accent" />
						{landingCopy.heroEyebrow}
					</div>
					<h1 className="mb-5 font-bold font-serif text-[clamp(3rem,7vw,5.5rem)] leading-[1.05] tracking-[-1px]">
						{landingCopy.heroTitleLine1}
						<br />
						{landingCopy.heroTitleLine2Prefix}
						<em className="text-accent not-italic">
							{landingCopy.heroTitleEmphasis}
						</em>
					</h1>
					<p className="mx-auto mb-10 max-w-[480px] text-[1.1rem] text-text2 leading-[1.7]">
						{landingCopy.heroSubtitle}
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Button onClick={() => setOpenDialog("login")} size="lg">
							<LogIn size={16} />
							{landingCopy.heroLoginClient}
						</Button>
						<Button
							onClick={() => setOpenDialog("loginRestaurant")}
							size="lg"
							variant="outline"
						>
							<UtensilsCrossed size={16} />
							{landingCopy.heroRestaurantArea}
						</Button>
					</div>
					<div className="mt-16 flex flex-wrap justify-center gap-12 border-[var(--border)] border-t pt-8">
						{landingCopy.stats.map((stat) => (
							<div className="text-center" key={stat.label}>
								<div className="font-bold font-serif text-[2rem] text-accent">
									{stat.value}
								</div>
								<div className="text-[0.8rem] text-muted uppercase tracking-[0.06em]">
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<footer className="mt-auto w-full border-[var(--border)] border-t bg-[rgba(23,23,23,0.4)] px-8 py-6 text-center text-[0.85rem] text-muted backdrop-blur-[16px]">
				<div className="flex flex-col items-center gap-[0.3rem]">
					<p>{landingCopy.footerCopyright}</p>
					<p className="font-semibold text-[0.75rem] text-accent uppercase tracking-[0.06em]">
						{landingCopy.footerCredits}
					</p>
				</div>
			</footer>

			{/* Login as client */}
			<Dialog
				onOpenChange={(o) => setOpenDialog(o ? "login" : null)}
				open={openDialog === "login"}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{authCopy.loginClientTitle}</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							authenticate("client", authCopy.loginSuccess);
						}}
					>
						<div className="mb-5">
							<Label htmlFor="loginEmail">{authCopy.emailLabel}</Label>
							<Input
								id="loginEmail"
								placeholder={authCopy.emailPlaceholder}
								type="email"
							/>
						</div>
						<div className="mb-5">
							<Label htmlFor="loginPass">{authCopy.passwordLabel}</Label>
							<Input
								id="loginPass"
								placeholder={authCopy.passwordPlaceholder}
								type="password"
							/>
						</div>
						<Button full size="lg" type="submit">
							{authCopy.loginClientSubmit}
						</Button>
					</form>
					<div className="my-5 flex items-center gap-4 before:h-px before:flex-1 before:bg-[var(--border)] after:h-px after:flex-1 after:bg-[var(--border)]">
						<span className="whitespace-nowrap text-[0.8rem] text-muted">
							{authCopy.noAccount}
						</span>
					</div>
					<Button
						full
						onClick={() => openRegister("client")}
						variant="secondary"
					>
						{authCopy.createFreeAccount}
					</Button>
				</DialogContent>
			</Dialog>

			{/* Login as restaurant */}
			<Dialog
				onOpenChange={(o) => setOpenDialog(o ? "loginRestaurant" : null)}
				open={openDialog === "loginRestaurant"}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{authCopy.loginRestaurantTitle}</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							authenticate("ownerWithRestaurant", authCopy.loginSuccess);
						}}
					>
						<div className="mb-5">
							<Label htmlFor="restLoginEmail">
								{authCopy.corporateEmailLabel}
							</Label>
							<Input
								id="restLoginEmail"
								placeholder={authCopy.corporateEmailPlaceholder}
								type="email"
							/>
						</div>
						<div className="mb-5">
							<Label htmlFor="restLoginPass">{authCopy.passwordLabel}</Label>
							<Input
								id="restLoginPass"
								placeholder={authCopy.passwordPlaceholder}
								type="password"
							/>
						</div>
						<Button full size="lg" type="submit">
							{authCopy.loginRestaurantSubmit}
						</Button>
					</form>
					<div className="my-5 flex items-center gap-4 before:h-px before:flex-1 before:bg-[var(--border)] after:h-px after:flex-1 after:bg-[var(--border)]">
						<span className="whitespace-nowrap text-[0.8rem] text-muted">
							{authCopy.newRestaurant}
						</span>
					</div>
					<Button
						full
						onClick={() => openRegister("restaurant")}
						variant="secondary"
					>
						{authCopy.registerRestaurantCta}
					</Button>
				</DialogContent>
			</Dialog>

			{/* Register */}
			<Dialog
				onOpenChange={(o) => setOpenDialog(o ? "register" : null)}
				open={openDialog === "register"}
			>
				<DialogContent size="lg">
					<DialogHeader>
						<DialogTitle>{authCopy.registerTitle}</DialogTitle>
					</DialogHeader>
					<Tabs
						onValueChange={(v) => setRegisterTab(v as "client" | "restaurant")}
						value={registerTab}
					>
						<TabsList className="mb-6">
							<TabsTrigger value="client">{authCopy.tabClient}</TabsTrigger>
							<TabsTrigger value="restaurant">
								{authCopy.tabRestaurant}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="client">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									authenticate("client", authCopy.registerClientSuccess);
								}}
							>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="mb-5">
										<Label>{authCopy.fullNameLabel}</Label>
										<Input placeholder={authCopy.fullNamePlaceholder} />
									</div>
									<div className="mb-5">
										<Label>{authCopy.phoneLabel}</Label>
										<Input placeholder={authCopy.phonePlaceholderClient} />
									</div>
								</div>
								<div className="mb-5">
									<Label>{authCopy.emailLabel}</Label>
									<Input placeholder={authCopy.emailPlaceholder} type="email" />
								</div>
								<Button full size="lg" type="submit">
									{authCopy.registerClientSubmit}
								</Button>
							</form>
						</TabsContent>

						<TabsContent value="restaurant">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									authenticate(
										"ownerWithoutRestaurant",
										authCopy.registerRestaurantSuccess,
									);
								}}
							>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="mb-5">
										<Label>{authCopy.restaurantNameLabel}</Label>
										<Input placeholder={authCopy.restaurantNamePlaceholder} />
									</div>
									<div className="mb-5">
										<Label>{authCopy.phoneLabel}</Label>
										<Input placeholder={authCopy.phonePlaceholderRestaurant} />
									</div>
								</div>
								<div className="mb-5">
									<Label>{authCopy.corporateEmailLabel}</Label>
									<Input
										placeholder={authCopy.corporateEmailPlaceholder}
										type="email"
									/>
								</div>
								<div className="mb-5">
									<Label>{authCopy.addressLabel}</Label>
									<Input placeholder={authCopy.addressPlaceholder} />
								</div>
								<div className="mb-5">
									<Label>{authCopy.bioLabel}</Label>
									<Textarea placeholder={authCopy.bioPlaceholder} />
								</div>
								<Button full size="lg" type="submit">
									{authCopy.registerRestaurantSubmit}
								</Button>
							</form>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		</div>
	);
}
