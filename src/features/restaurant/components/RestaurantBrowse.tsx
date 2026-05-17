"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { browseCopy } from "../copy";
import type { RestaurantView } from "../types";
import { useBrowse } from "./RestaurantBrowseContext";
import { RestaurantCard } from "./RestaurantCard";
import { SkeletonCard } from "./SkeletonCard";

const INITIAL_PAGE = 6;
const LOAD_DELAY_MS = 600;

function matches(r: RestaurantView, q: string): boolean {
	const needle = q.trim().toLowerCase();
	if (!needle) return true;
	return (
		r.name.toLowerCase().includes(needle) ||
		r.description.toLowerCase().includes(needle) ||
		r.tags.some((t) => t.toLowerCase().includes(needle))
	);
}

export function RestaurantBrowse() {
	const { query } = useBrowse();
	const [restaurants] = api.restaurant.list.useSuspenseQuery();
	const [categories] = api.category.list.useSuspenseQuery();
	const [categoryId, setCategoryId] = useState<string | "all">("all");
	const [visible, setVisible] = useState(INITIAL_PAGE);
	const [loadingMore, setLoadingMore] = useState(false);
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	const filtered = useMemo(
		() =>
			restaurants.filter(
				(r) =>
					(categoryId === "all" || r.categoryId === categoryId) &&
					matches(r, query),
			),
		[restaurants, categoryId, query],
	);

	const filterKey = `${categoryId}|${query}`;
	const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
	if (prevFilterKey !== filterKey) {
		setPrevFilterKey(filterKey);
		setVisible(INITIAL_PAGE);
		setLoadingMore(false);
	}

	const shown = filtered.slice(0, visible);
	const hasMore = visible < filtered.length;

	useEffect(() => {
		if (!hasMore || loadingMore) return;
		const node = sentinelRef.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries[0]?.isIntersecting) return;
				setLoadingMore(true);
				setTimeout(() => {
					setVisible((v) => v * 2);
					setLoadingMore(false);
				}, LOAD_DELAY_MS);
			},
			{ rootMargin: "200px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [hasMore, loadingMore]);

	return (
		<div className="dashboard-content flex-1 overflow-y-auto">
			<div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-8">
				<button
					className={chipClass(categoryId === "all")}
					onClick={() => setCategoryId("all")}
					type="button"
				>
					{browseCopy.filterAll}
				</button>
				{categories.map((cat) => (
					<button
						className={chipClass(categoryId === cat.id)}
						key={cat.id}
						onClick={() => setCategoryId(cat.id)}
						type="button"
					>
						{cat.name}
					</button>
				))}
			</div>

			<div className="flex items-center justify-between px-4 pt-6 pb-2 sm:px-8">
				<div>
					<div className="font-semibold font-serif text-[1.5rem] text-text">
						{browseCopy.sectionTitle}
					</div>
					<div className="text-[0.85rem] text-muted">
						{browseCopy.resultCount(filtered.length)}
					</div>
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="px-4 py-16 text-center text-muted sm:px-8">
					<div className="mb-4 text-5xl">🔍</div>
					<div className="font-semibold text-text">{browseCopy.emptyTitle}</div>
					<div className="mt-1 text-sm">{browseCopy.emptyHint}</div>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-8 md:grid-cols-2 lg:grid-cols-3">
					{shown.map((r) => (
						<RestaurantCard key={r.id} restaurant={r} />
					))}
					{loadingMore &&
						Array.from({ length: 3 }, (_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
							<SkeletonCard key={`sk_${i}`} />
						))}
				</div>
			)}

			{hasMore && <div className="h-px w-full" ref={sentinelRef} />}

			<footer className="mt-auto w-full border-[var(--border)] border-t bg-[rgba(23,23,23,0.4)] px-8 py-6 text-center text-[0.85rem] text-muted">
				<div className="flex flex-col items-center gap-[0.3rem]">
					<p>{browseCopy.footerCopyright}</p>
					<p className="font-semibold text-[0.75rem] text-accent uppercase tracking-[0.06em]">
						{browseCopy.footerCredits}
					</p>
				</div>
			</footer>
		</div>
	);
}

function chipClass(active: boolean): string {
	return [
		"rounded-full border px-4 py-[0.4rem] text-[0.82rem] font-medium transition-all duration-200",
		active
			? "border-accent bg-accent text-white"
			: "border-[var(--border)] bg-transparent text-text2 hover:border-accent hover:text-accent",
	].join(" ");
}
