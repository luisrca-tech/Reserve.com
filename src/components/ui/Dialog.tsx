"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		className={cn(
			"fixed inset-0 z-[500] bg-black/75 backdrop-blur-[8px]",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		size?: "default" | "lg" | "xl";
	}
>(({ className, children, size = "default", ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			className={cn(
				"fixed top-1/2 left-1/2 z-[501] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
				"max-h-[90vh] overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-surface shadow-[var(--shadow-lg)]",
				size === "default" && "max-w-[520px]",
				size === "lg" && "max-w-[680px]",
				size === "xl" && "max-w-[820px]",
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex items-center justify-between p-6 pb-0", className)}
			{...props}
		>
			{children}
			<DialogPrimitive.Close
				aria-label="Fechar"
				className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-muted transition-all hover:bg-surface3 hover:text-text"
			>
				<X size={18} />
			</DialogPrimitive.Close>
		</div>
	);
}

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		className={cn("font-semibold font-serif text-2xl text-text", className)}
		ref={ref}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		className={cn("text-muted text-sm", className)}
		ref={ref}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

function DialogBody({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-6", className)} {...props} />;
}

export {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
