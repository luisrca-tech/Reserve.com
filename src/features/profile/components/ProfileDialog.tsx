"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { useSessionState } from "~/features/session/SessionContext";
import { profileCopy } from "../copy";
import { toProfileFormValues } from "../types";

export function ProfileDialog({
	open,
	onOpenChange,
	onLogout,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onLogout: () => void;
}) {
	const { user, updateProfile } = useSessionState();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");

	useEffect(() => {
		if (open && user) {
			const values = toProfileFormValues(user);
			setName(values.name);
			setEmail(values.email);
			setPhone(values.phone);
		}
	}, [open, user]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (name.trim() === "") {
			toast.error(profileCopy.nameRequired);
			return;
		}
		if (!email.includes("@")) {
			toast.error(profileCopy.emailRequired);
			return;
		}
		updateProfile({ name: name.trim(), email: email.trim(), phone });
		toast.success(profileCopy.saved);
		onOpenChange(false);
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{profileCopy.title}</DialogTitle>
					<DialogDescription>{profileCopy.description}</DialogDescription>
				</DialogHeader>

				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div>
						<Label htmlFor="profile-name">{profileCopy.nameLabel}</Label>
						<Input
							id="profile-name"
							onChange={(e) => setName(e.target.value)}
							value={name}
						/>
					</div>
					<div>
						<Label htmlFor="profile-email">{profileCopy.emailLabel}</Label>
						<Input
							id="profile-email"
							onChange={(e) => setEmail(e.target.value)}
							type="email"
							value={email}
						/>
					</div>
					<div>
						<Label htmlFor="profile-phone">{profileCopy.phoneLabel}</Label>
						<Input
							id="profile-phone"
							onChange={(e) => setPhone(e.target.value)}
							placeholder={profileCopy.phonePlaceholder}
							value={phone}
						/>
					</div>

					<div className="mt-2 flex flex-col gap-2">
						<Button full size="lg" type="submit">
							{profileCopy.save}
						</Button>
						<Button full onClick={onLogout} type="button" variant="danger">
							{profileCopy.logout}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
