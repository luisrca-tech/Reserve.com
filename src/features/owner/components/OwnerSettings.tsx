"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type FieldError, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/Select";
import { Textarea } from "~/components/ui/Textarea";
import { UploadDropzone } from "~/lib/uploadthing";
import { api } from "~/trpc/react";
import { ownerCopy } from "../copy";
import { useOwnerStore } from "../OwnerStoreContext";
import { type UpdateSettingsInput, updateSettingsInput } from "../validation";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface DaySchedule {
	open: boolean;
	openHour: number;
	closeHour: number;
}

function scheduleFromHours(
	hoursByWeekday: Record<number, number[]>,
): DaySchedule[] {
	return Array.from({ length: 7 }, (_, weekday) => {
		const hours = hoursByWeekday[weekday] ?? [];
		if (hours.length === 0) {
			return { open: false, openHour: 18, closeHour: 23 };
		}
		return {
			open: true,
			openHour: Math.min(...hours),
			closeHour: Math.max(...hours) + 1,
		};
	});
}

function hoursFromSchedule(schedule: DaySchedule[]): Record<number, number[]> {
	const hoursByWeekday: Record<number, number[]> = {};
	schedule.forEach((day, weekday) => {
		if (!day.open || day.closeHour <= day.openHour) return;
		const hours: number[] = [];
		for (let h = day.openHour; h < day.closeHour; h++) hours.push(h);
		hoursByWeekday[weekday] = hours;
	});
	return hoursByWeekday;
}

function FieldMessage({ error }: { error?: FieldError }) {
	if (!error?.message) return null;
	return <p className="mt-1 text-[0.78rem] text-red">{error.message}</p>;
}

export function OwnerSettings() {
	const { restaurant, saveSettings } = useOwnerStore();
	const router = useRouter();
	const utils = api.useUtils();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<UpdateSettingsInput>({
		resolver: zodResolver(updateSettingsInput),
		defaultValues: {
			name: restaurant.name,
			phone: restaurant.phone,
			bio: restaurant.description,
			autoConfirmEnabled: restaurant.autoConfirmEnabled,
			lowTableThreshold: restaurant.lowTableThreshold,
			tableCount: restaurant.tableCount,
			hoursByWeekday: restaurant.hoursByWeekday,
		},
	});

	const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
		scheduleFromHours(restaurant.hoursByWeekday),
	);

	function setDay(weekday: number, patch: Partial<DaySchedule>) {
		setSchedule((prev) => {
			const next = prev.map((d, i) => (i === weekday ? { ...d, ...patch } : d));
			setValue("hoursByWeekday", hoursFromSchedule(next), {
				shouldValidate: true,
			});
			return next;
		});
	}

	const onSubmit = handleSubmit((values) => {
		saveSettings({
			name: values.name,
			phone: values.phone,
			bio: values.bio,
			hoursByWeekday: values.hoursByWeekday,
		});
		toast.success(ownerCopy.settings.saved);
	});

	return (
		<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-8">
			<header className="mb-8">
				<h1 className="font-bold font-serif text-[2rem] text-text">
					{ownerCopy.settings.title}
				</h1>
				<p className="mt-1 text-muted text-sm">{ownerCopy.settings.subtitle}</p>
			</header>

			<form
				className="space-y-6 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-6"
				onSubmit={onSubmit}
			>
				<div>
					<Label htmlFor="set-name">{ownerCopy.settings.nameLabel}</Label>
					<Input id="set-name" {...register("name")} />
					<FieldMessage error={errors.name} />
				</div>
				<div>
					<Label htmlFor="set-phone">{ownerCopy.settings.phoneLabel}</Label>
					<Input id="set-phone" {...register("phone")} />
					<FieldMessage error={errors.phone} />
				</div>
				<div>
					<Label htmlFor="set-bio">{ownerCopy.settings.bioLabel}</Label>
					<Textarea id="set-bio" {...register("bio")} />
					<FieldMessage error={errors.bio} />
				</div>

				<div>
					<Label>{ownerCopy.settings.availabilityLabel}</Label>
					<div className="mt-1 space-y-2">
						{ownerCopy.settings.weekdayNames.map((dayName, weekday) => {
							const day = schedule[weekday] as DaySchedule;
							return (
								<div
									className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-3"
									key={dayName}
								>
									<button
										className={`min-w-[5.5rem] rounded-full border px-3 py-1 text-[0.78rem] transition-colors ${
											day.open
												? "border-green bg-green-soft text-green"
												: "border-[var(--border)] text-muted"
										}`}
										onClick={() => setDay(weekday, { open: !day.open })}
										type="button"
									>
										{day.open
											? ownerCopy.settings.open
											: ownerCopy.settings.closed}
									</button>
									<span className="w-20 text-[0.85rem] text-text">
										{dayName}
									</span>
									{day.open && (
										<div className="ml-auto flex items-center gap-2 text-[0.8rem] text-muted">
											<span>{ownerCopy.settings.openHour}</span>
											<HourSelect
												onChange={(h) => setDay(weekday, { openHour: h })}
												value={day.openHour}
											/>
											<span>{ownerCopy.settings.closeHour}</span>
											<HourSelect
												onChange={(h) => setDay(weekday, { closeHour: h })}
												value={day.closeHour}
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<Button disabled={isSubmitting} full size="lg" type="submit">
					{ownerCopy.settings.save}
				</Button>
			</form>

			<section className="mt-6 space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-6">
				<div>
					<Label>{ownerCopy.settings.menuLabel}</Label>
					<p className="mt-1 text-[0.85rem] text-muted">
						{ownerCopy.settings.menuHint}
					</p>
				</div>

				{restaurant.menuUrl ? (
					restaurant.menuKind === "pdf" ? (
						<a
							className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-2 text-[0.85rem] text-text transition-colors hover:border-accent"
							href={restaurant.menuUrl}
							rel="noreferrer"
							target="_blank"
						>
							{ownerCopy.settings.menuCurrentPdf}
						</a>
					) : (
						// biome-ignore lint/performance/noImgElement: remote menu asset
						<img
							alt={ownerCopy.settings.menuLabel}
							className="max-h-48 rounded-[var(--radius-sm)] border border-[var(--border)]"
							src={restaurant.menuUrl}
						/>
					)
				) : (
					<p className="text-[0.85rem] text-muted">
						{ownerCopy.settings.menuNone}
					</p>
				)}

				<UploadDropzone
					endpoint="restaurantMenu"
					input={{ restaurantId: restaurant.id }}
					onClientUploadComplete={async () => {
						await utils.owner.restaurant.invalidate();
						await utils.restaurant.byId.invalidate({
							restaurantId: restaurant.id,
						});
						router.refresh();
						toast.success(ownerCopy.settings.menuUpdated);
					}}
					onUploadError={() => {
						toast.error(ownerCopy.settings.menuError);
					}}
				/>
			</section>
		</div>
	);
}

function HourSelect({
	value,
	onChange,
}: {
	value: number;
	onChange: (hour: number) => void;
}) {
	return (
		<Select onValueChange={(v) => onChange(Number(v))} value={String(value)}>
			<SelectTrigger aria-label={ownerCopy.settings.hourValue(value)}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{HOURS.map((h) => (
					<SelectItem key={h} value={String(h)}>
						{ownerCopy.settings.hourValue(h)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
