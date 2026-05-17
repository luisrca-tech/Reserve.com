"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSessionState } from "~/features/session/SessionContext";
import { onboardingCopy as t } from "./copy";
import { mockCategories } from "./mock/categories";
import {
	buildOnboardingDraft,
	type CategoryResolution,
	type DaySchedule,
	emptySchedule,
	type OnboardingError,
	resolveCategory,
	stepValidity,
	validateOnboarding,
} from "./onboarding";

interface UploadedImage {
	id: string;
	name: string;
	url: string;
}

let uploadSeq = 0;

/**
 * Owns onboarding form state, step navigation, per-step validation, and the
 * submit path. The component renders; this hook orchestrates. Draft assembly
 * is delegated to {@link buildOnboardingDraft} so there is no hand re-mapping.
 */
export function useOnboardingForm() {
	const router = useRouter();
	const { completeOnboarding } = useSessionState();

	const [step, setStep] = useState(0);
	const [submitting, setSubmitting] = useState(false);

	const [name, setName] = useState("");
	const [corporateEmail, setCorporateEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [bio, setBio] = useState("");

	const [categoryQuery, setCategoryQuery] = useState("");
	const resolution: CategoryResolution = useMemo(
		() => resolveCategory(categoryQuery, mockCategories),
		[categoryQuery],
	);
	const matches = useMemo(() => {
		const q = categoryQuery.trim().toLowerCase();
		if (q === "") return mockCategories;
		return mockCategories.filter((c) => c.name.toLowerCase().includes(q));
	}, [categoryQuery]);

	const [tableCount, setTableCount] = useState(10);
	const [schedule, setSchedule] = useState<DaySchedule[]>(emptySchedule);

	const [images, setImages] = useState<UploadedImage[]>([]);
	const [menuName, setMenuName] = useState<string | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const menuInputRef = useRef<HTMLInputElement>(null);

	const draft = buildOnboardingDraft({
		name,
		corporateEmail,
		phone,
		address,
		bio,
		category: resolution,
		tableCount,
		schedule,
		imageCount: images.length,
		hasMenu: menuName !== null,
	});

	const errors = validateOnboarding(draft);
	const has = (e: OnboardingError) => errors.includes(e);
	const stepValid = stepValidity(errors);
	const isLast = step === t.steps.length - 1;

	function setDay(weekday: number, patch: Partial<DaySchedule>) {
		setSchedule((prev) =>
			prev.map((d, i) => (i === weekday ? { ...d, ...patch } : d)),
		);
	}

	function onPickImages(files: FileList | null) {
		if (!files) return;
		const added: UploadedImage[] = Array.from(files).map((file) => {
			uploadSeq += 1;
			return {
				id: `upl_${uploadSeq}`,
				name: file.name,
				url: URL.createObjectURL(file),
			};
		});
		setImages((prev) => [...prev, ...added]);
	}

	function removeImage(id: string) {
		setImages((prev) => {
			const target = prev.find((i) => i.id === id);
			if (target) URL.revokeObjectURL(target.url);
			return prev.filter((i) => i.id !== id);
		});
	}

	function next() {
		setStep((s) => s + 1);
	}

	function back() {
		setStep((s) => Math.max(0, s - 1));
	}

	function submit() {
		if (errors.length > 0) {
			toast.error(t.validationError);
			return;
		}
		setSubmitting(true);
		completeOnboarding();
		toast.success(t.success);
		router.push("/owner/overview");
	}

	return {
		step,
		submitting,
		isLast,
		stepValid,
		errors,
		has,
		next,
		back,

		name,
		setName,
		corporateEmail,
		setCorporateEmail,
		phone,
		setPhone,
		address,
		setAddress,
		bio,
		setBio,

		categoryQuery,
		setCategoryQuery,
		resolution,
		matches,

		tableCount,
		setTableCount,
		schedule,
		setDay,

		images,
		onPickImages,
		removeImage,
		imageInputRef,
		menuName,
		setMenuName,
		menuInputRef,

		submit,
	};
}
