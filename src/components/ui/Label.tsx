"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

import { cn } from "~/lib/utils";

const Label = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
	<LabelPrimitive.Root
		className={cn(
			"mb-[0.4rem] block font-semibold text-[0.78rem] text-muted uppercase tracking-[0.06em]",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
