"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Textarea } from "~/components/ui/Textarea";
import { ownerCopy } from "../copy";
import { useOwnerStore } from "../OwnerStoreContext";

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

export function OwnerSettings() {
	const { restaurant, saveSettings } = useOwnerStore();
	const [name, setName] = useState(restaurant.name);
	const [phone, setPhone] = useState(restaurant.phone);
	const [bio, setBio] = useState(restaurant.description);
	const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
		scheduleFromHours(restaurant.hoursByWeekday),
	);

	function setDay(weekday: number, patch: Partial<DaySchedule>) {
		setSchedule((prev) =>
			prev.map((d, i) => (i === weekday ? { ...d, ...patch } : d)),
		);
	}

	function handleSave(e: React.FormEvent) {
		e.preventDefault();
		const hoursByWeekday: Record<number, number[]> = {};
		schedule.forEach((day, weekday) => {
			if (!day.open || day.closeHour <= day.openHour) return;
			const hours: number[] = [];
			for (let h = day.openHour; h < day.closeHour; h++) hours.push(h);
			hoursByWeekday[weekday] = hours;
		});
		saveSettings({
			name: name.trim(),
			phone: phone.trim(),
			bio,
			hoursByWeekday,
		});
		toast.success(ownerCopy.settings.saved);
	}

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
				onSubmit={handleSave}
			>
				<div>
					<Label htmlFor="set-name">{ownerCopy.settings.nameLabel}</Label>
					<Input
						id="set-name"
						onChange={(e) => setName(e.target.value)}
						value={name}
					/>
				</div>
				<div>
					<Label htmlFor="set-phone">{ownerCopy.settings.phoneLabel}</Label>
					<Input
						id="set-phone"
						onChange={(e) => setPhone(e.target.value)}
						value={phone}
					/>
				</div>
				<div>
					<Label htmlFor="set-bio">{ownerCopy.settings.bioLabel}</Label>
					<Textarea
						id="set-bio"
						onChange={(e) => setBio(e.target.value)}
						value={bio}
					/>
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

				<Button full size="lg" type="submit">
					{ownerCopy.settings.save}
				</Button>
			</form>
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
		<select
			className="rounded-md border border-[var(--border)] bg-surface px-2 py-1 text-[0.8rem] text-text focus:border-accent focus:outline-none"
			onChange={(e) => onChange(Number(e.target.value))}
			value={value}
		>
			{HOURS.map((h) => (
				<option key={h} value={h}>
					{ownerCopy.settings.hourValue(h)}
				</option>
			))}
		</select>
	);
}
