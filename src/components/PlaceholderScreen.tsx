"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import { authCopy } from "~/features/auth/copy";
import { useAuth } from "~/features/auth/MockAuthContext";

export function PlaceholderScreen({
	title,
	subtitle,
}: {
	title: string;
	subtitle: string;
}) {
	const router = useRouter();
	const { user, logout } = useAuth();

	function handleLogout() {
		logout();
		toast.success(authCopy.logoutSuccess);
		router.push("/");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
			<div className="font-bold font-serif text-[2.2rem]">{title}</div>
			<p className="max-w-md text-[0.9rem] text-muted">{subtitle}</p>
			{user ? (
				<p className="text-[0.8rem] text-text2">
					{user.name} · {user.role}
				</p>
			) : null}
			<Button onClick={handleLogout} variant="secondary">
				Sair
			</Button>
		</div>
	);
}
