"use client";

import { Button as HeadlessButton } from "@headlessui/react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "google";
  /** When true, renders a spinner inside the button and disables interaction. */
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const primary =
    "bg-neutral-900 hover:bg-neutral-800 text-white";
  const google =
    "bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200";
  const base =
    "w-full py-3 px-4 rounded-full font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2.5";

  const isDisabled = disabled || isLoading;

  return (
    <HeadlessButton
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`${base} ${variant === "primary" ? primary : google} ${
        isDisabled ? "opacity-40 cursor-not-allowed" : ""
      } ${className || ""}`}
      {...props}
    >
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </HeadlessButton>
  );
}
