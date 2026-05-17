"use client";

import {
	Check,
	ChevronLeft,
	ChevronRight,
	Minus,
	Plus,
	Search,
	Upload,
	X,
} from "lucide-react";
import type { FieldError } from "react-hook-form";

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
import { onboardingCopy as t } from "../copy";
import { useOnboardingForm } from "../useOnboardingForm";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function OnboardingFlow() {
	const f = useOnboardingForm();
	const { step, errors, register, resolution, matches } = f;

	return (
		<div className="mx-auto w-full max-w-2xl px-4 py-10">
			<header className="mb-8">
				<h1 className="font-serif text-[2rem] text-text">{t.title}</h1>
				<p className="mt-1 text-[0.95rem] text-muted">{t.subtitle}</p>
			</header>

			<ol className="mb-8 flex flex-wrap gap-2">
				{t.steps.map((label, i) => {
					const done = i < step;
					const active = i === step;
					return (
						<li
							className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.78rem] ${
								active
									? "border-accent bg-accent-soft text-accent"
									: done
										? "border-[var(--border)] text-text"
										: "border-[var(--border)] text-muted"
							}`}
							key={label}
						>
							<span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[0.7rem]">
								{done ? <Check size={12} /> : i + 1}
							</span>
							{label}
						</li>
					);
				})}
			</ol>

			<div className="rounded-[var(--radius)] border border-[var(--border)] bg-surface p-6">
				<div className="mb-5 text-[0.8rem] text-muted">
					{t.stepOf(step + 1, t.steps.length)}
				</div>

				{step === 0 && (
					<section className="space-y-4">
						<h2 className="font-semibold font-serif text-[1.3rem] text-text">
							{t.basicsTitle}
						</h2>
						<div>
							<Label htmlFor="ob-name">{t.nameLabel}</Label>
							<Input
								id="ob-name"
								placeholder={t.namePlaceholder}
								{...register("name")}
							/>
							<FieldMessage error={errors.name} />
						</div>
						<div>
							<Label htmlFor="ob-email">{t.corporateEmailLabel}</Label>
							<Input
								id="ob-email"
								placeholder={t.corporateEmailPlaceholder}
								type="email"
								{...register("corporateEmail")}
							/>
							<FieldMessage error={errors.corporateEmail} />
						</div>
						<div>
							<Label htmlFor="ob-phone">{t.phoneLabel}</Label>
							<Input
								id="ob-phone"
								placeholder={t.phonePlaceholder}
								{...register("phone")}
							/>
							<FieldMessage error={errors.phone} />
						</div>
						<div>
							<Label htmlFor="ob-address">{t.addressLabel}</Label>
							<Input
								id="ob-address"
								placeholder={t.addressPlaceholder}
								{...register("address")}
							/>
							<FieldMessage error={errors.address} />
						</div>
						<div>
							<Label htmlFor="ob-bio">{t.bioLabel}</Label>
							<Textarea
								id="ob-bio"
								placeholder={t.bioPlaceholder}
								{...register("bio")}
							/>
							<FieldMessage error={errors.bio} />
						</div>
					</section>
				)}

				{step === 1 && (
					<section className="space-y-4">
						<h2 className="font-semibold font-serif text-[1.3rem] text-text">
							{t.categoryTitle}
						</h2>
						<p className="text-[0.85rem] text-muted">{t.categoryHint}</p>
						<div className="relative">
							<Search
								className="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
								size={16}
							/>
							<Input
								className="pl-9"
								onChange={(e) => f.setCategoryQuery(e.target.value)}
								placeholder={t.categorySearchPlaceholder}
								value={f.categoryQuery}
							/>
						</div>

						<div className="flex flex-wrap gap-2">
							{matches.map((c) => {
								const selected =
									resolution.kind === "existing" &&
									resolution.category.id === c.id;
								return (
									<button
										className={`rounded-full border px-4 py-2 text-[0.85rem] transition-colors ${
											selected
												? "border-accent bg-accent text-white"
												: "border-[var(--border)] text-text hover:border-accent"
										}`}
										key={c.id}
										onClick={() => f.setCategoryQuery(c.name)}
										type="button"
									>
										{c.name}
									</button>
								);
							})}
							{matches.length === 0 && resolution.kind !== "new" && (
								<p className="text-[0.85rem] text-muted">
									{t.categoryNoResults}
								</p>
							)}
						</div>

						{resolution.kind === "new" && (
							<div className="rounded-[var(--radius-sm)] border border-accent border-dashed bg-accent-soft px-4 py-3 text-[0.85rem] text-accent">
								{t.categoryCreate(resolution.name)}
							</div>
						)}
						{resolution.kind === "existing" && (
							<p className="text-[0.85rem] text-green">
								{t.categorySelected(resolution.category.name)}
							</p>
						)}
					</section>
				)}

				{step === 2 && (
					<section className="space-y-6">
						<h2 className="font-semibold font-serif text-[1.3rem] text-text">
							{t.capacityTitle}
						</h2>
						<div>
							<Label>{t.tableCountLabel}</Label>
							<Stepper
								label={t.tableCountValue(f.tableCount)}
								min={1}
								onChange={f.setTableCount}
								value={f.tableCount}
							/>
						</div>
						<div>
							<Label>{t.hoursLabel}</Label>
							<div className="space-y-2">
								{t.weekdayNames.map((dayName, weekday) => {
									const day = f.schedule[weekday];
									if (!day) return null;
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
												onClick={() => f.setDay(weekday, { open: !day.open })}
												type="button"
											>
												{day.open ? t.open : t.closed}
											</button>
											<span className="w-20 text-[0.85rem] text-text">
												{dayName}
											</span>
											{day.open && (
												<div className="ml-auto flex items-center gap-2 text-[0.8rem] text-muted">
													<span>{t.openHour}</span>
													<HourSelect
														onChange={(h) => f.setDay(weekday, { openHour: h })}
														value={day.openHour}
													/>
													<span>{t.closeHour}</span>
													<HourSelect
														onChange={(h) =>
															f.setDay(weekday, { closeHour: h })
														}
														value={day.closeHour}
													/>
												</div>
											)}
										</div>
									);
								})}
							</div>
							{!f.stepValid[2] && (
								<p className="mt-2 text-[0.8rem] text-red">
									{t.validationError}
								</p>
							)}
						</div>
					</section>
				)}

				{step === 3 && (
					<section className="space-y-4">
						<h2 className="font-semibold font-serif text-[1.3rem] text-text">
							{t.imagesTitle}
						</h2>
						<p className="text-[0.85rem] text-muted">{t.imagesHint}</p>
						<input
							accept="image/*"
							className="hidden"
							multiple
							onChange={(e) => {
								f.onPickImages(e.target.files);
								e.target.value = "";
							}}
							ref={f.imageInputRef}
							type="file"
						/>
						<Button
							onClick={() => f.imageInputRef.current?.click()}
							type="button"
							variant="secondary"
						>
							<Upload size={16} />
							{t.imagesPick}
						</Button>
						<p
							className={`text-[0.85rem] ${
								f.images.length >= 4 ? "text-green" : "text-muted"
							}`}
						>
							{t.imagesCount(f.images.length)}
						</p>
						{f.images.length > 0 && (
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
								{f.images.map((img) => (
									<div
										className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]"
										key={img.id}
									>
										{/* biome-ignore lint/performance/noImgElement: object-URL preview before upload */}
										<img
											alt={img.name}
											className="h-full w-full object-cover"
											src={img.url}
										/>
										<button
											className="absolute top-1 right-1 rounded-full bg-bg/80 p-1 text-text opacity-0 transition-opacity group-hover:opacity-100"
											onClick={() => f.removeImage(img.id)}
											title={t.imageRemove}
											type="button"
										>
											<X size={14} />
										</button>
									</div>
								))}
							</div>
						)}
					</section>
				)}

				{step === 4 && (
					<section className="space-y-4">
						<h2 className="font-semibold font-serif text-[1.3rem] text-text">
							{t.menuTitle}
						</h2>
						<p className="text-[0.85rem] text-muted">{t.menuHint}</p>
						<input
							accept="application/pdf,image/*"
							className="hidden"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) f.pickMenu(file);
								e.target.value = "";
							}}
							ref={f.menuInputRef}
							type="file"
						/>
						<Button
							onClick={() => f.menuInputRef.current?.click()}
							type="button"
							variant="secondary"
						>
							<Upload size={16} />
							{t.menuPick}
						</Button>
						{f.menuName && (
							<div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-green border-dashed bg-green-soft px-4 py-3 text-[0.85rem] text-green">
								<Check size={16} />
								<span className="flex-1">{t.menuReady(f.menuName)}</span>
								<button
									className="text-muted hover:text-text"
									onClick={() => f.pickMenu(null)}
									type="button"
								>
									{t.menuRemove}
								</button>
							</div>
						)}
					</section>
				)}

				<div className="mt-8 flex items-center justify-between border-[var(--border)] border-t pt-5">
					<Button
						disabled={step === 0}
						onClick={f.back}
						type="button"
						variant="ghost"
					>
						<ChevronLeft size={16} />
						{t.back}
					</Button>

					{f.isLast ? (
						<Button
							disabled={!f.stepValid[4] || f.submitting}
							onClick={f.submit}
							type="button"
							variant="success"
						>
							{f.submitting ? t.submitting : t.submit}
						</Button>
					) : (
						<Button
							disabled={!f.stepValid[step]}
							onClick={f.next}
							type="button"
						>
							{t.next}
							<ChevronRight size={16} />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

function FieldMessage({ error }: { error?: FieldError }) {
	if (!error?.message) return null;
	return <p className="mt-1 text-[0.78rem] text-red">{error.message}</p>;
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
			<SelectTrigger aria-label={t.hourValue(value)}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{HOURS.map((h) => (
					<SelectItem key={h} value={String(h)}>
						{t.hourValue(h)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function Stepper({
	value,
	label,
	min = 1,
	max = 999,
	onChange,
}: {
	value: number;
	label: string;
	min?: number;
	max?: number;
	onChange: (next: number) => void;
}) {
	return (
		<div className="inline-flex items-center gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-2">
			<button
				className="rounded-md p-1 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
				disabled={value <= min}
				onClick={() => onChange(Math.max(min, value - 1))}
				type="button"
			>
				<Minus size={16} />
			</button>
			<span className="min-w-[6rem] text-center font-medium text-[0.9rem] text-text">
				{label}
			</span>
			<button
				className="rounded-md p-1 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
				disabled={value >= max}
				onClick={() => onChange(Math.min(max, value + 1))}
				type="button"
			>
				<Plus size={16} />
			</button>
		</div>
	);
}
