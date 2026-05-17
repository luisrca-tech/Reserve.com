"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUploadThing } from "~/lib/uploadthing";
import { api } from "~/trpc/react";
import { onboardingCopy as t } from "./copy";
import { type CategoryResolution, resolveCategory } from "./onboarding";
import {
	type CreateRestaurantInput,
	createRestaurantInput,
} from "./validation";

interface UploadedImage {
	id: string;
	name: string;
	url: string;
	file: File;
}

interface DaySchedule {
	open: boolean;
	openHour: number;
	closeHour: number;
}

function emptySchedule(): DaySchedule[] {
	return Array.from({ length: 7 }, () => ({
		open: false,
		openHour: 18,
		closeHour: 23,
	}));
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

let uploadSeq = 0;

/**
 * Owns onboarding form state via react-hook-form + the shared
 * `createRestaurantInput` zodResolver (same schema the `restaurant.create`
 * tRPC input uses, so client/server validation cannot drift). Categories are
 * the real `category.list`. On submit the restaurant row is created first,
 * then the picked gallery images are bound to its id via uploadthing, then
 * the real role/restaurant route guard takes the owner to the dashboard.
 */
export function useOnboardingForm() {
	const router = useRouter();

	const form = useForm<CreateRestaurantInput>({
		resolver: zodResolver(createRestaurantInput),
		defaultValues: {
			name: "",
			corporateEmail: "",
			phone: "",
			address: "",
			bio: "",
			categoryId: null,
			newCategoryName: null,
			tableCount: 10,
			hoursByWeekday: {},
		},
	});
	const {
		register,
		setValue,
		watch,
		trigger,
		handleSubmit,
		formState: { errors },
	} = form;

	const [step, setStep] = useState(0);
	const [submitting, setSubmitting] = useState(false);

	const categories = api.category.list.useQuery();
	const createRestaurant = api.restaurant.create.useMutation();
	const { startUpload } = useUploadThing("restaurantImage");
	const { startUpload: startMenuUpload } = useUploadThing("restaurantMenu");

	const [categoryQuery, setCategoryQuery] = useState("");
	const options = useMemo(() => categories.data ?? [], [categories.data]);
	const resolution: CategoryResolution = useMemo(
		() => resolveCategory(categoryQuery, options),
		[categoryQuery, options],
	);
	const matches = useMemo(() => {
		const q = categoryQuery.trim().toLowerCase();
		if (q === "") return options;
		return options.filter((c) => c.name.toLowerCase().includes(q));
	}, [categoryQuery, options]);

	useEffect(() => {
		if (resolution.kind === "existing") {
			setValue("categoryId", resolution.category.id, {
				shouldValidate: true,
			});
			setValue("newCategoryName", null);
		} else if (resolution.kind === "new") {
			setValue("categoryId", null);
			setValue("newCategoryName", resolution.name, { shouldValidate: true });
		} else {
			setValue("categoryId", null);
			setValue("newCategoryName", null);
		}
	}, [resolution, setValue]);

	const tableCount = watch("tableCount");
	const [schedule, setSchedule] = useState<DaySchedule[]>(emptySchedule);
	const hasOpenDay = schedule.some((d) => d.open && d.closeHour > d.openHour);

	function setTableCount(nextValue: number) {
		setValue("tableCount", nextValue, { shouldValidate: true });
	}

	function setDay(weekday: number, patch: Partial<DaySchedule>) {
		setSchedule((prev) => {
			const updated = prev.map((d, i) =>
				i === weekday ? { ...d, ...patch } : d,
			);
			setValue("hoursByWeekday", hoursFromSchedule(updated), {
				shouldValidate: true,
			});
			return updated;
		});
	}

	const [images, setImages] = useState<UploadedImage[]>([]);
	const [menuFile, setMenuFile] = useState<File | null>(null);
	const menuName = menuFile?.name ?? null;
	const imageInputRef = useRef<HTMLInputElement>(null);
	const menuInputRef = useRef<HTMLInputElement>(null);

	function pickMenu(file: File | null) {
		setMenuFile(file);
	}

	function onPickImages(files: FileList | null) {
		if (!files) return;
		const added: UploadedImage[] = Array.from(files).map((file) => {
			uploadSeq += 1;
			return {
				id: `upl_${uploadSeq}`,
				name: file.name,
				url: URL.createObjectURL(file),
				file,
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

	const stepValid = [
		!(
			errors.name ||
			errors.corporateEmail ||
			errors.phone ||
			errors.address ||
			errors.bio
		),
		resolution.kind !== "empty",
		tableCount >= 1 && hasOpenDay,
		images.length >= 4,
		menuName !== null,
	];
	const isLast = step === t.steps.length - 1;

	async function next() {
		if (step === 0) {
			const ok = await trigger([
				"name",
				"corporateEmail",
				"phone",
				"address",
				"bio",
			]);
			if (!ok) return;
		}
		if (!stepValid[step]) return;
		setStep((s) => s + 1);
	}

	function back() {
		setStep((s) => Math.max(0, s - 1));
	}

	const submit = handleSubmit(async (values) => {
		if (images.length < 4) {
			toast.error(t.validationError);
			return;
		}
		setSubmitting(true);
		try {
			const { id } = await createRestaurant.mutateAsync(values);
			await startUpload(
				images.map((i) => i.file),
				{ restaurantId: id },
			);
			if (menuFile) {
				await startMenuUpload([menuFile], { restaurantId: id });
			}
			toast.success(t.success);
			router.push("/owner/overview");
			router.refresh();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : t.validationError;
			toast.error(message);
			setSubmitting(false);
		}
	});

	return {
		step,
		submitting,
		isLast,
		stepValid,
		errors,
		register,
		next,
		back,

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
		pickMenu,
		menuInputRef,

		submit,
	};
}
