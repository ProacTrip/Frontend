import { Check, X, Loader2, AlertTriangle } from 'lucide-react';

type StatusVariant = 'success' | 'error' | 'loading' | 'warning';

interface AuthStatusIconProps {
  variant: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT_CONFIG = {
  success: { icon: Check, bg: 'bg-green-100', text: 'text-green-600' },
  error: { icon: X, bg: 'bg-red-100', text: 'text-red-600' },
  loading: { icon: Loader2, bg: 'bg-neutral-100', text: 'text-neutral-400', animate: true },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-600' },
} as const;

const SIZE_CONFIG = {
  sm: { container: 'w-12 h-12', icon: 'w-6 h-6' },
  md: { container: 'w-16 h-16', icon: 'w-8 h-8' },
} as const;

export default function AuthStatusIcon({
  variant,
  size = 'md',
  className = '',
}: AuthStatusIconProps) {
  const config = VARIANT_CONFIG[variant];
  const sizes = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <div
      className={`${sizes.container} ${config.bg} rounded-2xl flex items-center justify-center mx-auto ${className}`}
      aria-hidden="true"
    >
      <Icon
        className={`${sizes.icon} ${config.text} ${'animate' in config ? 'animate-spin' : ''}`}
        strokeWidth={1.5}
      />
    </div>
  );
}
