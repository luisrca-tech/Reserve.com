const shimmer =
	"bg-[linear-gradient(90deg,var(--surface2)_25%,var(--surface3)_50%,var(--surface2)_75%)] bg-[length:200%_100%] animate-[reserve-shimmer_1.5s_infinite]";

export function SkeletonCard() {
	return (
		<div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-surface">
			<div className={`h-[180px] ${shimmer}`} />
			<div className="p-5">
				<div
					className={`mb-[0.6rem] h-[14px] w-[70%] rounded-[7px] ${shimmer}`}
				/>
				<div
					className={`mb-[0.6rem] h-[14px] w-full rounded-[7px] ${shimmer}`}
				/>
				<div className={`h-[14px] w-[45%] rounded-[7px] ${shimmer}`} />
			</div>
		</div>
	);
}
