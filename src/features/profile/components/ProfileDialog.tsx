"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type FieldError, useForm } from "react-hook-form";
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
import { api } from "~/trpc/react";
import { profileCopy } from "../copy";
import { toProfileFormValues } from "../types";
import { type UpdateProfileInput, updateProfileInput } from "../validation";

function FieldMessage({ error }: { error?: FieldError }) {
	if (!error?.message) return null;
	return <p className="mt-1 text-[0.78rem] text-red">{error.message}</p>;
}

export function ProfileDialog({
	open,
	onOpenChange,
	onLogout,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onLogout: () => void;
}) {
	const { user, refreshSession } = useSessionState();
	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<UpdateProfileInput>({
		resolver: zodResolver(updateProfileInput),
	});

	useEffect(() => {
		if (open && user) reset(toProfileFormValues(user));
	}, [open, user, reset]);

	const updateProfile = api.user.updateProfile.useMutation();

	const onSubmit = handleSubmit(async (values) => {
		try {
			await updateProfile.mutateAsync(values);
			await refreshSession();
			toast.success(profileCopy.saved);
			onOpenChange(false);
		} catch (error) {
			const conflict =
				error instanceof Error && "data" in error
					? (error as { data?: { code?: string } }).data?.code === "CONFLICT"
					: false;
			if (conflict) {
				setError("email", { message: profileCopy.emailTaken });
				return;
			}
			toast.error(profileCopy.saveError);
		}
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{profileCopy.title}</DialogTitle>
					<DialogDescription>{profileCopy.description}</DialogDescription>
				</DialogHeader>

				<form className="flex flex-col gap-4" onSubmit={onSubmit}>
					<div>
						<Label htmlFor="profile-name">{profileCopy.nameLabel}</Label>
						<Input id="profile-name" {...register("name")} />
						<FieldMessage error={errors.name} />
					</div>
					<div>
						<Label htmlFor="profile-email">{profileCopy.emailLabel}</Label>
						<Input id="profile-email" type="email" {...register("email")} />
						<FieldMessage error={errors.email} />
					</div>
					<div>
						<Label htmlFor="profile-phone">{profileCopy.phoneLabel}</Label>
						<Input
							id="profile-phone"
							placeholder={profileCopy.phonePlaceholder}
							{...register("phone")}
						/>
						<FieldMessage error={errors.phone} />
					</div>

					<div className="mt-2 flex flex-col gap-2">
						<Button disabled={isSubmitting} full size="lg" type="submit">
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
