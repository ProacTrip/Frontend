"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "google";
}

export default function Button({
  children,
  variant = "primary",
  ...props
}: ButtonProps) {
  const primary =
    "bg-neutral-900 hover:bg-neutral-800 text-white";
  const google =
    "bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200";
  const base =
    "w-full py-3 px-4 rounded-full font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <button
      {...props}
      className={`${base} ${variant === "primary" ? primary : google} ${props.className || ""}`}
    >
      {children}
    </button>
  );
}
